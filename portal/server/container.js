import { WorkflowFactory } from "@agent-flow/domain";
import { PrismaWorkflowRepository } from "./infrastructure/prisma/index.js";

export function buildContainer() {
  const workflowRepository = new PrismaWorkflowRepository();

  const workflowFactory = new WorkflowFactory({
    workflowRepo: workflowRepository,
  });

  return {
    workflowRepository,
    workflowFactory,
  };
}
