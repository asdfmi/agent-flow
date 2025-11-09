import express from 'express';
import { buildContainer } from './container.js';
import createWorkflowRouter from './routes/workflow-routes.js';

export function registerApi(app) {
  const { workflowDefinitionService, workflowExecutionService } = buildContainer();
  app.use(express.json({ limit: '1mb' }));
  app.use(
    '/api',
    createWorkflowRouter({
      workflowDefinitionService,
      workflowExecutionService,
    }),
  );
}
