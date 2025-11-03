import { Router } from "express";
import { randomUUID } from "crypto";
import prisma from "../lib/prisma.js";

const router = Router();

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

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "invalid_workflow_id" });
  }
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepKey: "asc" } } },
    });
    if (!workflow) return res.status(404).json({ error: "workflow_not_found" });
    res.json({ data: workflow });
  } catch (error) {
    console.error("Failed to fetch workflow", error);
    res.status(500).json({ error: "failed_to_fetch_workflow" });
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
      include: { steps: { orderBy: { stepKey: "asc" } } },
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

export default router;
