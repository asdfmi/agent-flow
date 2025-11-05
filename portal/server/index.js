import "dotenv/config";
import http from "http";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";
import workflowsRouter from "./routes/workflows.js";
import internalRouter from "./routes/internal.js";
import prisma from "./lib/prisma.js";
import { initWs } from "./ws/index.js";

const moduleFile = fileURLToPath(import.meta.url);
const apiDir = path.dirname(moduleFile);
const repoRoot = path.resolve(apiDir, "..", "..");

const clientDistDir = path.join(repoRoot, "portal", "ui", "dist");
const workflowsHtmlPath = path.join(clientDistDir, "src", "pages", "workflows", "index.html");
const workflowBuilderHtmlPath = path.join(clientDistDir, "src", "pages", "workflow-builder", "index.html");
const app = express();
const port = 3000;

app.use(express.json({ limit: "10mb" }));

// ===== Static =====

// Static asset delivery
app.use(express.static(clientDistDir));

// Static page routes
app.get(["/", "/workflows"], (_req, res) => {
  res.sendFile(workflowsHtmlPath);
});
app.get("/workflow/:workflowId", (_req, res) => {
  res.sendFile(workflowBuilderHtmlPath);
});

// ===== API =====

app.use("/api/workflows", workflowsRouter);
app.use("/internal", internalRouter);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
initWs(server);

server.listen(port, () => {
  console.log(`Server running → http://localhost:${port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
