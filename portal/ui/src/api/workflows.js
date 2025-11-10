import { request } from "./client.js";

export function listWorkflows(options = {}) {
  return request("/api/workflows", options);
}

export function createWorkflow(payload, options = {}) {
  return request("/api/workflows", {
    ...options,
    method: "POST",
    json: payload,
  });
}

export function getWorkflow(id, options = {}) {
  if (id == null) throw new Error("workflow id is required");
  return request(`/api/workflows/${encodeURIComponent(id)}`, options);
}

export function runWorkflow(id, options = {}) {
  if (id == null) throw new Error("workflow id is required");
  return request(`/api/workflows/${encodeURIComponent(id)}/run`, { ...options, method: "POST" });
}

export function updateWorkflow(id, payload, options = {}) {
  if (id == null) throw new Error("workflow id is required");
  return request(`/api/workflows/${encodeURIComponent(id)}`, {
    ...options,
    method: "PUT",
    json: payload,
  });
}

export function listWorkflowRuns(id, options = {}) {
  if (id == null) throw new Error("workflow id is required");
  return request(`/api/workflows/${encodeURIComponent(id)}/runs`, options);
}
