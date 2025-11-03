import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import workflowsRouter from "./routes/workflows.js";
import internalRouter from "./routes/internal.js";
import prisma from "./lib/prisma.js";
import http from "http";
import { initWs } from "./ws/index.js";

const moduleFile = fileURLToPath(import.meta.url);
const apiDir = path.dirname(moduleFile);
const repoRoot = path.resolve(apiDir, "..", "..");

const clientDistDir = path.join(repoRoot, "app", "ui", "dist");
const workflowsHtmlPath = path.join(clientDistDir, "src", "pages", "workflows", "index.html");
const workflowHtmlPath = path.join(clientDistDir, "src", "pages", "workflow", "index.html");
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
  res.sendFile(workflowHtmlPath);
});

// ===== API =====

app.use("/api/workflows", workflowsRouter);
app.use("/internal", internalRouter);

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
