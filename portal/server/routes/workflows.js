import { Router } from "express";
import { randomUUID } from "crypto";
import prisma from "../lib/prisma.js";

const router = Router();

const STEP_TYPES = new Set([
  "navigate",
  "wait",
  "scroll",
  "click",
  "fill",
  "press",
  "log",
  "script",
  "extract_text",
  "if",
  "loop",
]);

router.get("/", async (_req, res) => {
  try {
    const workflows = await prisma.workflow.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        updatedAt: true,
        createdAt: true,
      },
    });
    res.json({ data: workflows });
  } catch (error) {
    console.error("Failed to list workflows", error);
    res.status(500).json({ error: "failed_to_list_workflows" });
  }
});

router.post("/draft", async (_req, res) => {
  try {
    const workflow = await createDraftWorkflow();
    return res.status(201).json({ data: workflow });
  } catch (error) {
    console.error("Failed to create draft workflow", error);
    return res.status(500).json({ error: "failed_to_create_draft" });
  }
});

router.post("/", async (req, res) => {
  const { value, errors } = normalizeWorkflowInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "invalid_workflow_payload", details: errors });
  }

  try {
    const workflow = await prisma.workflow.create({
      data: {
        slug: value.slug,
        title: value.title,
        description: value.description,
        startStepId: value.startStepId,
        steps: {
          create: value.steps.map(toStepCreateInput),
        },
      },
      include: { steps: { orderBy: { id: "asc" } } },
    });
    return res.status(201).json({ data: workflow });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "slug_conflict" });
    }
    console.error("Failed to create workflow", error);
    return res.status(500).json({ error: "failed_to_create_workflow" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "invalid_workflow_id" });
  }
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { steps: { orderBy: { id: "asc" } } },
    });
    if (!workflow) return res.status(404).json({ error: "workflow_not_found" });
    res.json({ data: workflow });
  } catch (error) {
    console.error("Failed to fetch workflow", error);
    res.status(500).json({ error: "failed_to_fetch_workflow" });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "invalid_workflow_id" });
  }

  const { value, errors } = normalizeWorkflowInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "invalid_workflow_payload", details: errors });
  }

  try {
    const workflow = await prisma.$transaction(async (tx) => {
      const existing = await tx.workflow.findUnique({ where: { id }, select: { id: true } });
      if (!existing) return null;

      await tx.workflowStep.deleteMany({ where: { workflowId: id } });

      return tx.workflow.update({
        where: { id },
        data: {
          slug: value.slug,
          title: value.title,
          description: value.description,
          startStepId: value.startStepId,
          steps: {
            create: value.steps.map(toStepCreateInput),
          },
        },
        include: { steps: { orderBy: { id: "asc" } } },
      });
    });

    if (!workflow) {
      return res.status(404).json({ error: "workflow_not_found" });
    }

    return res.json({ data: workflow });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "slug_conflict" });
    }
    console.error("Failed to update workflow", error);
    return res.status(500).json({ error: "failed_to_update_workflow" });
  }
});

router.post("/:id/run", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "invalid_workflow_id" });
  }
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { steps: { orderBy: { id: "asc" } } },
    });
    if (!workflow) return res.status(404).json({ error: "workflow_not_found" });

    const workflowPayload = toWorkflowPayload(workflow);
    const runId = randomUUID();
    const base = process.env.CRAWLER_BASE_URL;
    if (!base) {
      return res.status(500).json({ error: "crawler_base_url_not_configured" });
    }

    try {
      const crawlerRes = await fetch(`${base}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, workflow: workflowPayload }),
      });

      if (crawlerRes.status >= 200 && crawlerRes.status < 300) {
        return res.status(202).json({ runId });
      }

      const errorPayload = await crawlerRes.json().catch(() => ({}));
      const status = crawlerRes.status >= 400 && crawlerRes.status < 500 ? crawlerRes.status : 502;

      return res.status(status).json({
        error: errorPayload.error || "crawler_request_failed",
        details: errorPayload.details,
        crawlerStatus: crawlerRes.status,
      });
    } catch (error) {
      console.error("Failed to dispatch workflow run", error);
      return res.status(502).json({ error: "crawler_unreachable" });
    }
  } catch (error) {
    console.error("Failed to run workflow", error);
    res.status(500).json({ error: "failed_to_run_workflow" });
  }
});

function normalizeWorkflowInput(body) {
  const errors = [];
  if (!isRecord(body)) {
    return { errors: ["payload must be an object"] };
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug) errors.push("slug is required");

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) errors.push("title is required");

  const description =
    body.description == null
      ? null
      : typeof body.description === "string"
        ? body.description.trim() || null
        : null;

  const startStepId =
    typeof body.startStepId === "string" ? body.startStepId.trim() || null : null;

  const stepsInput = Array.isArray(body.steps) ? body.steps : [];
  if (!Array.isArray(body.steps)) {
    errors.push("steps must be an array");
  }

  const steps = [];
  const seenStepKeys = new Set();

  for (let index = 0; index < stepsInput.length; index += 1) {
    const rawStep = stepsInput[index];
    const prefix = `steps[${index}]`;
    if (!isRecord(rawStep)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }

    const stepKey = typeof rawStep.stepKey === "string" ? rawStep.stepKey.trim() : "";
    if (!stepKey) {
      errors.push(`${prefix}.stepKey is required`);
      continue;
    }
    if (seenStepKeys.has(stepKey)) {
      errors.push(`${prefix}.stepKey duplicates an existing step`);
      continue;
    }
    seenStepKeys.add(stepKey);

    const type = typeof rawStep.type === "string" ? rawStep.type.trim() : "";
    if (!STEP_TYPES.has(type)) {
      errors.push(`${prefix}.type is invalid`);
      continue;
    }

    const label =
      typeof rawStep.label === "string" ? rawStep.label.trim() || null : null;
    const nextStepKey =
      typeof rawStep.nextStepKey === "string"
        ? rawStep.nextStepKey.trim() || null
        : null;
    const exitStepKey =
      typeof rawStep.exitStepKey === "string"
        ? rawStep.exitStepKey.trim() || null
        : null;

    let config = null;
    if (typeof rawStep.config !== "undefined") {
      if (rawStep.config === null || typeof rawStep.config === "object") {
        config = rawStep.config;
      } else {
        errors.push(`${prefix}.config must be an object when provided`);
        continue;
      }
    }

    let successConfig = null;
    if (typeof rawStep.successConfig !== "undefined") {
      if (isRecord(rawStep.successConfig)) {
        successConfig = rawStep.successConfig;
      } else if (rawStep.successConfig === null) {
        successConfig = null;
      } else {
        errors.push(`${prefix}.successConfig must be an object when provided`);
        continue;
      }
    }

    steps.push({
      stepKey,
      type,
      label,
      nextStepKey,
      exitStepKey,
      config,
      successConfig,
    });
  }

  if (startStepId && !seenStepKeys.has(startStepId)) {
    errors.push("startStepId must reference a stepKey defined in steps");
  }

  return {
    value: {
      slug,
      title,
      description,
      startStepId,
      steps,
    },
    errors,
  };
}

function toStepCreateInput(step) {
  const data = {
    stepKey: step.stepKey,
    type: step.type,
    label: step.label,
    nextStepKey: step.nextStepKey,
    exitStepKey: step.exitStepKey,
  };

  if (typeof step.config !== "undefined") {
    data.config = step.config;
  }
  if (typeof step.successConfig !== "undefined") {
    data.successConfig = step.successConfig;
  }

  return data;
}

function toWorkflowPayload(workflow) {
  const name = workflow.slug || `workflow-${workflow.id}`;
  const description = workflow.description ?? "";
  const steps = workflow.steps.map((step) => {
    const cfg = isRecord(step.config) ? step.config : {};
    const success = isRecord(step.successConfig) ? step.successConfig : null;
    const payload = { type: step.type, id: step.stepKey };
    if (step.label) payload.label = step.label;
    Object.assign(payload, cfg);
    if (typeof step.nextStepKey === "string" && step.nextStepKey.trim()) {
      payload.next = step.nextStepKey.trim();
    }
    if (typeof step.exitStepKey === "string" && step.exitStepKey.trim()) {
      payload.exit = step.exitStepKey.trim();
    }
    if (Array.isArray(cfg.branches)) {
      payload.branches = cfg.branches;
    }
    if (success && Object.keys(success).length > 0) {
      payload.success = success;
    }
    return payload;
  });
  const startId = typeof workflow.startStepId === "string" && workflow.startStepId.trim().length > 0
    ? workflow.startStepId.trim()
    : workflow.steps[0]?.stepKey;
  return { name, description, start: startId, steps };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function createDraftWorkflow() {
  let attempt = 0;
  while (attempt < 5) {
    try {
      const workflow = await prisma.workflow.create({
        data: {
          slug: makeDraftSlug(),
          title: "Untitled workflow",
          description: "",
        },
        include: { steps: { orderBy: { id: "asc" } } },
      });
      return workflow;
    } catch (error) {
      if (error?.code !== "P2002") throw error;
      attempt += 1;
    }
  }
  throw new Error("failed_to_generate_unique_slug");
}

function makeDraftSlug() {
  return `draft-${Math.random().toString(36).slice(2, 8)}`;
}

export default router;
