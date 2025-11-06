import { Router } from "express";
import { randomUUID } from "crypto";
import prisma from "../lib/prisma.js";

const router = Router();

const NODE_TYPES = new Set([
  "navigate",
  "wait",
  "scroll",
  "click",
  "fill",
  "press",
  "log",
  "script",
  "extract_text",
]);

const WORKFLOW_INCLUDE = {
  nodes: { orderBy: { id: "asc" } },
  edges: { orderBy: { id: "asc" } },
};

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
        startNodeId: value.startNodeId,
        nodes: {
          create: value.nodes.map(toNodeCreateInput),
        },
        edges: {
          create: value.edges.map(toEdgeCreateInput),
        },
      },
      include: WORKFLOW_INCLUDE,
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

async function resolveWorkflow(identifier, { include } = {}) {
  if (!identifier) return null;
  const numeric = Number(identifier);
  if (Number.isInteger(numeric) && numeric > 0) {
    const workflow = await prisma.workflow.findUnique({ where: { id: numeric }, include });
    return workflow ? { workflow, id: numeric } : null;
  }
  const slug = String(identifier || "").trim();
  if (!slug) return null;
  const workflow = await prisma.workflow.findUnique({ where: { slug }, include });
  return workflow ? { workflow, id: workflow.id } : null;
}

router.get("/:identifier", async (req, res) => {
  const { identifier } = req.params;
  try {
    const resolved = await resolveWorkflow(identifier, {
      include: WORKFLOW_INCLUDE,
    });
    if (!resolved) {
      return res.status(404).json({ error: "workflow_not_found" });
    }
    res.json({ data: resolved.workflow });
  } catch (error) {
    console.error("Failed to fetch workflow", error);
    res.status(500).json({ error: "failed_to_fetch_workflow" });
  }
});

router.put("/:identifier", async (req, res) => {
  const { identifier } = req.params;

  const { value, errors } = normalizeWorkflowInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "invalid_workflow_payload", details: errors });
  }

  try {
    const resolved = await resolveWorkflow(identifier);
    if (!resolved) {
      return res.status(404).json({ error: "workflow_not_found" });
    }
    const id = resolved.id;
    const workflow = await prisma.$transaction(async (tx) => {
      await tx.workflowEdge.deleteMany({ where: { workflowId: id } });
      await tx.workflowNode.deleteMany({ where: { workflowId: id } });

      return tx.workflow.update({
        where: { id },
        data: {
          slug: value.slug,
          title: value.title,
          description: value.description,
          startNodeId: value.startNodeId,
          nodes: {
            create: value.nodes.map(toNodeCreateInput),
          },
          edges: {
            create: value.edges.map(toEdgeCreateInput),
          },
        },
        include: WORKFLOW_INCLUDE,
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

router.get("/:identifier/runs", async (req, res) => {
  const take = Math.min(Number(req.query.take) || 20, 100);

  try {
    const resolved = await resolveWorkflow(req.params.identifier);
    if (!resolved) {
      return res.status(404).json({ error: "workflow_not_found" });
    }
    const runs = await prisma.workflowRun.findMany({
      where: { workflowId: resolved.id },
      orderBy: { startedAt: "desc" },
      take,
      select: {
        id: true,
        runKey: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ data: runs });
  } catch (error) {
    console.error("Failed to list workflow runs", error);
    res.status(500).json({ error: "failed_to_list_runs" });
  }
});

router.post("/:identifier/run", async (req, res) => {
  try {
    const resolved = await resolveWorkflow(req.params.identifier, {
      include: WORKFLOW_INCLUDE,
    });
    if (!resolved) return res.status(404).json({ error: "workflow_not_found" });

    const workflowPayload = toWorkflowPayload(resolved.workflow);
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

  const startNodeId =
    typeof body.startNodeId === "string" ? body.startNodeId.trim() || null : null;

  const nodesInput = Array.isArray(body.nodes) ? body.nodes : [];
  if (!Array.isArray(body.nodes)) {
    errors.push("nodes must be an array");
  }

  const nodes = [];
  const seenNodeKeys = new Set();

  for (let index = 0; index < nodesInput.length; index += 1) {
    const rawNode = nodesInput[index];
    const prefix = `nodes[${index}]`;
    if (!isRecord(rawNode)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }

    const nodeKey = typeof rawNode.nodeKey === "string" ? rawNode.nodeKey.trim() : "";
    if (!nodeKey) {
      errors.push(`${prefix}.nodeKey is required`);
      continue;
    }
    if (seenNodeKeys.has(nodeKey)) {
      errors.push(`${prefix}.nodeKey duplicates an existing node`);
      continue;
    }
    seenNodeKeys.add(nodeKey);

    const type = typeof rawNode.type === "string" ? rawNode.type.trim() : "";
    if (!NODE_TYPES.has(type)) {
      errors.push(`${prefix}.type is invalid`);
      continue;
    }

    const label =
      typeof rawNode.label === "string" ? rawNode.label.trim() || null : null;

    let config;
    if (Object.prototype.hasOwnProperty.call(rawNode, "config")) {
      if (rawNode.config === null || typeof rawNode.config === "object") {
        config = rawNode.config;
      } else {
        errors.push(`${prefix}.config must be an object when provided`);
        continue;
      }
    }

    let successConfig;
    if (Object.prototype.hasOwnProperty.call(rawNode, "successConfig")) {
      if (rawNode.successConfig === null || typeof rawNode.successConfig === "object") {
        successConfig = rawNode.successConfig;
      } else {
        errors.push(`${prefix}.successConfig must be an object when provided`);
        continue;
      }
    }

    nodes.push({
      nodeKey,
      type,
      label,
      ...(typeof config !== "undefined" ? { config } : {}),
      ...(typeof successConfig !== "undefined" ? { successConfig } : {}),
    });
  }

  if (nodes.length === 0) {
    errors.push("at least one node is required");
  }

  if (startNodeId && !seenNodeKeys.has(startNodeId)) {
    errors.push("startNodeId must reference a nodeKey defined in nodes");
  }

  const edgesInput = Array.isArray(body.edges) ? body.edges : [];
  if (!Array.isArray(body.edges)) {
    errors.push("edges must be an array");
  }

  const edges = [];
  const seenEdgeKeys = new Set();

  for (let index = 0; index < edgesInput.length; index += 1) {
    const rawEdge = edgesInput[index];
    const prefix = `edges[${index}]`;
    if (!isRecord(rawEdge)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }

    const providedEdgeKey =
      typeof rawEdge.edgeKey === "string" ? rawEdge.edgeKey.trim() : "";
    const edgeKey =
      providedEdgeKey || `edge_${randomUUID().replace(/-/g, "")}`;
    if (seenEdgeKeys.has(edgeKey)) {
      errors.push(`${prefix}.edgeKey duplicates an existing edge`);
      continue;
    }
    seenEdgeKeys.add(edgeKey);

    const sourceKey =
      typeof rawEdge.source === "string"
        ? rawEdge.source.trim()
        : typeof rawEdge.sourceKey === "string"
          ? rawEdge.sourceKey.trim()
          : "";
    if (!sourceKey) {
      errors.push(`${prefix}.source is required`);
      continue;
    }

    const targetKeyRaw =
      typeof rawEdge.target === "string"
        ? rawEdge.target.trim()
        : typeof rawEdge.targetKey === "string"
          ? rawEdge.targetKey.trim()
          : "";
    const targetKey = targetKeyRaw || null;

    const label =
      typeof rawEdge.label === "string" ? rawEdge.label.trim() || null : null;

    let condition;
    if (Object.prototype.hasOwnProperty.call(rawEdge, "condition")) {
      if (rawEdge.condition === null || typeof rawEdge.condition === "object") {
        condition = rawEdge.condition;
      } else {
        errors.push(`${prefix}.condition must be an object when provided`);
        continue;
      }
    }

    let metadata;
    if (Object.prototype.hasOwnProperty.call(rawEdge, "metadata")) {
      if (
        rawEdge.metadata === null ||
        typeof rawEdge.metadata === "object"
      ) {
        metadata = rawEdge.metadata;
      } else {
        errors.push(`${prefix}.metadata must be an object when provided`);
        continue;
      }
    }

    let priority;
    if (Object.prototype.hasOwnProperty.call(rawEdge, "priority")) {
      if (rawEdge.priority === null) {
        priority = null;
      } else {
        const numeric = Number(rawEdge.priority);
        if (Number.isFinite(numeric)) {
          priority = numeric;
        } else {
          errors.push(`${prefix}.priority must be a number`);
          continue;
        }
      }
    } else {
      priority = index;
    }

    edges.push({
      edgeKey,
      sourceKey,
      targetKey,
      label,
      ...(typeof condition !== "undefined" ? { condition } : {}),
      ...(typeof metadata !== "undefined" ? { metadata } : {}),
      ...(typeof priority !== "undefined" ? { priority } : {}),
    });
  }

  const nodeKeySet = new Set(nodes.map((node) => node.nodeKey));
  for (const edge of edges) {
    if (!nodeKeySet.has(edge.sourceKey)) {
      errors.push(`edge ${edge.edgeKey} references unknown source node ${edge.sourceKey}`);
    }
    if (edge.targetKey && !nodeKeySet.has(edge.targetKey)) {
      errors.push(`edge ${edge.edgeKey} references unknown target node ${edge.targetKey}`);
    }
  }

  const outgoingByNode = new Map();
  for (const edge of edges) {
    const list = outgoingByNode.get(edge.sourceKey) ?? [];
    list.push(edge);
    outgoingByNode.set(edge.sourceKey, list);
  }

  return {
    value: {
      slug,
      title,
      description,
      startNodeId,
      nodes,
      edges,
    },
    errors,
  };
}

function toNodeCreateInput(node) {
  const data = {
    nodeKey: node.nodeKey,
    type: node.type,
    label: node.label,
  };

  if (typeof node.config !== "undefined") {
    data.config = node.config;
  }
  if (typeof node.successConfig !== "undefined") {
    data.successConfig = node.successConfig;
  }

  return data;
}

function toEdgeCreateInput(edge) {
  const data = {
    edgeKey: edge.edgeKey,
    sourceKey: edge.sourceKey,
    targetKey: edge.targetKey,
    label: edge.label,
  };

  if (typeof edge.condition !== "undefined") {
    data.condition = edge.condition;
  }
  if (typeof edge.metadata !== "undefined") {
    data.metadata = edge.metadata;
  }
  if (Object.prototype.hasOwnProperty.call(edge, "priority")) {
    data.priority = edge.priority;
  }

  return data;
}

function toWorkflowPayload(workflow) {
  const name = workflow.slug || `workflow-${workflow.id}`;
  const description = workflow.description ?? "";
  const nodes = (workflow.nodes || []).map((node) => {
    const cfg = isRecord(node.config) ? node.config : {};
    const success = isRecord(node.successConfig) ? node.successConfig : null;
    const payload = { type: node.type, id: node.nodeKey };
    if (node.label) payload.label = node.label;
    Object.assign(payload, cfg);
    if (success && Object.keys(success).length > 0) {
      payload.success = success;
    }
    payload.config = cfg;
    return payload;
  });
  const edges = (workflow.edges || []).map((edge) => {
    const payload = {
      id: edge.edgeKey,
      from: edge.sourceKey,
      to: edge.targetKey ?? null,
    };
    if (edge.label) payload.label = edge.label;
    if (edge.condition != null) payload.condition = edge.condition;
    if (edge.metadata != null) payload.metadata = edge.metadata;
    if (typeof edge.priority === "number") payload.priority = edge.priority;
    return payload;
  });
  const startId = typeof workflow.startNodeId === "string" && workflow.startNodeId.trim().length > 0
    ? workflow.startNodeId.trim()
    : workflow.nodes?.[0]?.nodeKey;
  return { name, description, start: startId, nodes, edges };
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
        include: WORKFLOW_INCLUDE,
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
