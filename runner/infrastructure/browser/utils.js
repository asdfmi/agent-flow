export const DEFAULT_SUCCESS_TIMEOUT_SEC = 5;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeTimeoutSeconds(
  value,
  fallback = DEFAULT_SUCCESS_TIMEOUT_SEC,
) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  return fallback;
}

export function renderTemplate(template, variables = {}) {
  if (typeof template !== "string") return template;
  const source = variables && typeof variables === "object" ? variables : {};
  return template.replace(
    /{{\s*(?:variables\.)?([a-zA-Z0-9_]+)\s*}}/g,
    (_match, key) => {
      const value = source[key];
      if (value === undefined || value === null) return "";
      if (Array.isArray(value)) {
        const first = value[0];
        return first === undefined || first === null ? "" : String(first);
      }
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      return String(value);
    },
  );
}
