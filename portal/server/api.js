import express from "express";
import createWorkflowRouter from "./routes/workflow-routes.js";
import createInternalRunRoutes from "./routes/internal-run-routes.js";

export function registerApi(
  app,
  {
    workflowFactory,
    runEventHub,
    internalSecret = "",
    runnerClient = null,
  } = {},
) {
  app.use(express.json({ limit: "1mb" }));
  app.use(
    "/api",
    createWorkflowRouter({
      workflowFactory,
      runnerClient,
    }),
  );
  app.use(
    "/internal",
    createInternalRunRoutes({
      runEventHub,
      internalSecret,
    }),
  );
}
