import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

const TABLES = {
  workflows: {
    label: "Workflows",
    primaryKey: "id",
    parseId(value) {
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) throw new Error("invalid id");
      return parsed;
    },
    delegate: prisma.workflow,
    listArgs: {
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { nodes: true, edges: true, runs: true } },
      },
    },
    detailArgs: {
      include: {
        nodes: { orderBy: { id: "asc" } },
        edges: { orderBy: { id: "asc" } },
        runs: { orderBy: { id: "desc" }, take: 10 },
      },
    },
    example: {
      slug: "my-workflow",
      title: "My workflow",
      description: "Optional description",
      startNodeId: null,
    },
  },
  workflowNodes: {
    label: "Workflow nodes",
    primaryKey: "id",
    parseId(value) {
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) throw new Error("invalid id");
      return parsed;
    },
    delegate: prisma.workflowNode,
    listArgs: {
      orderBy: { updatedAt: "desc" },
      include: {
        workflow: { select: { id: true, title: true, slug: true } },
      },
    },
    detailArgs: {
      include: {
        workflow: { select: { id: true, title: true, slug: true } },
      },
    },
    example: {
      workflowId: 1,
      nodeKey: "node_1",
      type: "navigate",
      config: { url: "https://example.com" },
    },
  },
  workflowEdges: {
    label: "Workflow edges",
    primaryKey: "id",
    parseId(value) {
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) throw new Error("invalid id");
      return parsed;
    },
    delegate: prisma.workflowEdge,
    listArgs: {
      orderBy: { updatedAt: "desc" },
      include: {
        workflow: { select: { id: true, title: true, slug: true } },
      },
    },
    detailArgs: {
      include: {
        workflow: { select: { id: true, title: true, slug: true } },
      },
    },
    example: {
      workflowId: 1,
      edgeKey: "edge_1",
      sourceKey: "node_1",
      targetKey: "node_2",
      priority: 0,
    },
  },
  workflowRuns: {
    label: "Workflow runs",
    primaryKey: "id",
    parseId(value) {
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) throw new Error("invalid id");
      return parsed;
    },
    delegate: prisma.workflowRun,
    listArgs: {
      orderBy: { startedAt: "desc" },
      include: {
        workflow: { select: { id: true, title: true, slug: true } },
        _count: { select: { metrics: true } },
      },
    },
    detailArgs: {
      include: {
        workflow: { select: { id: true, title: true, slug: true } },
        metrics: { orderBy: { id: "asc" } },
      },
    },
    example: {
      workflowId: 1,
      runKey: "run_123",
      status: "queued",
    },
  },
  workflowRunMetrics: {
    label: "Workflow run metrics",
    primaryKey: "id",
    parseId(value) {
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) throw new Error("invalid id");
      return parsed;
    },
    delegate: prisma.workflowRunMetric,
    listArgs: {
      orderBy: { id: "desc" },
      include: {
        run: { select: { id: true, runKey: true, workflowId: true } },
      },
    },
    detailArgs: {
      include: {
        run: { select: { id: true, runKey: true, workflowId: true } },
      },
    },
    example: {
      runId: 1,
      key: "example_metric",
      value: { value: 123 },
    },
  },
};

function getTable(name) {
  const key = String(name || "").trim();
  const table = TABLES[key];
  if (!table) {
    const error = new Error("table_not_found");
    error.status = 404;
    throw error;
  }
  return { key, ...table };
}

router.get("/tables", (_req, res) => {
  const tables = Object.entries(TABLES).map(([name, meta]) => ({
    name,
    label: meta.label,
    primaryKey: meta.primaryKey,
    example: meta.example,
  }));
  res.json({ tables });
});

router.get("/:table", async (req, res) => {
  try {
    const { delegate, listArgs, primaryKey } = getTable(req.params.table);
    const take = Math.min(Number(req.query.take) || 50, 200);
    const records = await delegate.findMany({
      ...(listArgs || {}),
      take,
    });
    res.json({ data: records, meta: { primaryKey } });
  } catch (error) {
    console.error("Admin list failed", error);
    res.status(error.status || 500).json({ error: error.message || "failed_to_list" });
  }
});

router.get("/:table/:id", async (req, res) => {
  try {
    const { delegate, detailArgs, primaryKey, parseId } = getTable(req.params.table);
    const id = parseId ? parseId(req.params.id) : req.params.id;
    const record = await delegate.findUnique({
      where: { [primaryKey]: id },
      ...(detailArgs || {}),
    });
    if (!record) {
      return res.status(404).json({ error: "record_not_found" });
    }
    res.json({ data: record });
  } catch (error) {
    console.error("Admin detail failed", error);
    res.status(error.status || 500).json({ error: error.message || "failed_to_fetch" });
  }
});

router.post("/:table", async (req, res) => {
  try {
    const { delegate, primaryKey } = getTable(req.params.table);
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "invalid_payload" });
    }
    const data = req.body.data || req.body;
    const record = await delegate.create({ data });
    res.status(201).json({ data: record, meta: { primaryKey } });
  } catch (error) {
    console.error("Admin create failed", error);
    res.status(error.status || 500).json({ error: error.message || "failed_to_create" });
  }
});

router.put("/:table/:id", async (req, res) => {
  try {
    const { delegate, primaryKey, parseId } = getTable(req.params.table);
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "invalid_payload" });
    }
    const pkValue = parseId ? parseId(req.params.id) : req.params.id;
    const data = req.body.data || req.body;
    const record = await delegate.update({
      where: { [primaryKey]: pkValue },
      data,
    });
    res.json({ data: record });
  } catch (error) {
    console.error("Admin update failed", error);
    res.status(error.status || 500).json({ error: error.message || "failed_to_update" });
  }
});

router.delete("/:table/:id", async (req, res) => {
  try {
    const { delegate, primaryKey, parseId } = getTable(req.params.table);
    const pkValue = parseId ? parseId(req.params.id) : req.params.id;
    await delegate.delete({ where: { [primaryKey]: pkValue } });
    res.status(204).end();
  } catch (error) {
    console.error("Admin delete failed", error);
    res.status(error.status || 500).json({ error: error.message || "failed_to_delete" });
  }
});

export default router;
