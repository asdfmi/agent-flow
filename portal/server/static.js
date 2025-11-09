import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const moduleFile = fileURLToPath(import.meta.url);
const serverDir = path.dirname(moduleFile);
const repoRoot = path.resolve(serverDir, '..', '..');

const staticPaths = {
  dist: path.join(repoRoot, 'portal', 'ui', 'dist'),
  workflows: path.join(repoRoot, 'portal', 'ui', 'dist', 'src', 'pages', 'workflows', 'index.html'),
  workflowBuilder: path.join(repoRoot, 'portal', 'ui', 'dist', 'src', 'pages', 'workflow-builder', 'index.html'),
};

export function registerStatic(app) {
  app.use(express.static(staticPaths.dist));
  app.get('/', (_req, res) => {
    res.sendFile(staticPaths.workflows);
  });
  app.get('/workflow/:workflowId', (_req, res) => {
    res.sendFile(staticPaths.workflowBuilder);
  });
}
