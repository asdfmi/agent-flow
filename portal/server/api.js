import express from 'express';
import createWorkflowRouter from './routes/workflow-routes.js';
import createInternalRunRoutes from './routes/internal-run-routes.js';

export function registerApi(
  app,
  {
    workflowDefinitionService,
    workflowExecutionService,
    runEventHub,
    internalSecret = '',
  } = {},
) {
  if (!workflowDefinitionService || !workflowExecutionService) {
    throw new Error('workflow services are required to register API routes');
  }
  app.use(express.json({ limit: '1mb' }));
  app.use(
    '/api',
    createWorkflowRouter({
      workflowDefinitionService,
      workflowExecutionService,
    }),
  );
  app.use(
    '/internal',
    createInternalRunRoutes({
      runEventHub,
      internalSecret,
    }),
  );
}
