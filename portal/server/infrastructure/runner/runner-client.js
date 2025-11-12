const DEFAULT_BASE_URL = process.env.RUNNER_BASE_URL || "http://localhost:4000";

function normalizeBaseUrl(value) {
  if (!value) return DEFAULT_BASE_URL;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export default class RunnerClient {
  constructor({ baseUrl = DEFAULT_BASE_URL, timeoutMs = 10_000 } = {}) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.timeoutMs = timeoutMs;
    if (typeof fetch !== "function") {
      throw new Error("global fetch is required to call runner");
    }
  }

  async triggerRun({ runId, workflow, startNodeId = null } = {}) {
    if (!runId) {
      throw new Error("runId is required");
    }
    if (!workflow || typeof workflow !== "object") {
      throw new Error("workflow payload is required");
    }
    const payload = {
      runId,
      workflow: {
        ...workflow,
        ...(startNodeId ? { startNodeId } : {}),
      },
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(
          `Runner request failed (${response.status}): ${
            message || response.statusText
          }`,
        );
      }
      return response.json().catch(() => ({}));
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Runner request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
