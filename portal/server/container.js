import {
  WorkflowDefinitionService,
  WorkflowExecutionService,
} from './application/index.js';
import {
  PrismaWorkflowRepository,
  PrismaWorkflowExecutionRepository,
} from './infrastructure/prisma/index.js';

export function buildContainer() {
  const workflowRepository = new PrismaWorkflowRepository();
  const workflowExecutionRepository = new PrismaWorkflowExecutionRepository();

  const workflowDefinitionService = new WorkflowDefinitionService({ workflowRepo: workflowRepository });
  const workflowExecutionService = new WorkflowExecutionService({ executionRepo: workflowExecutionRepository });

  return {
    workflowRepository,
    workflowExecutionRepository,
    workflowDefinitionService,
    workflowExecutionService,
  };
}
