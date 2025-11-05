import { BRANCH_CONDITION_TYPES, STEP_TYPES } from "../constants.js";

export function getBuilderContext(pathname) {
  const segments = String(pathname || "")
    .split("/")
    .filter(Boolean);
  if (segments.length === 2 && segments[0] === "workflow") {
    const parsedId = Number(segments[1]);
    if (Number.isInteger(parsedId) && parsedId > 0) {
      return { workflowId: parsedId };
    }
  }
  return { workflowId: null };
}

export function createEmptyStep(existingSteps) {
  const existingKeys = existingSteps.map((step) => step.stepKey);
  const stepKey = generateStepKey(existingKeys);
  return {
    stepKey,
    label: "",
    type: "navigate",
    nextStepKey: "",
    exitStepKey: "",
    config: getDefaultConfig("navigate"),
    successConfig: null,
  };
}

export function toEditableStep(step) {
  return {
    stepKey: step.stepKey ?? "",
    label: step.label ?? "",
    type: step.type ?? "navigate",
    nextStepKey: step.nextStepKey ?? "",
    exitStepKey: step.exitStepKey ?? "",
    config: step.config && typeof step.config === "object"
      ? step.config
      : getDefaultConfig(step.type ?? "navigate"),
    successConfig: step.successConfig && typeof step.successConfig === "object"
      ? step.successConfig
      : null,
  };
}

export function getDefaultConfig(type) {
  switch (type) {
    case "navigate":
      return { url: "", waitUntil: "" };
    case "scroll":
      return { dx: 0, dy: 600 };
    case "click":
      return { xpath: "", options: { button: "left", clickCount: 1 } };
    case "fill":
      return { xpath: "", value: "", clear: false };
    case "press":
      return { xpath: "", key: "", delay: null };
    case "log":
      return { target: "browgent", level: "info", message: "" };
    case "script":
      return { code: "", as: "" };
    case "extract_text":
      return { xpath: "", as: "" };
    case "if":
      return { branches: [] };
    case "loop":
      return { times: 1 };
    default:
      return {};
  }
}

export function createDefaultBranch() {
  return {
    next: "",
    condition: createDefaultBranchCondition("visible"),
  };
}

export function createDefaultBranchCondition(type) {
  switch (type) {
    case "visible":
      return { visible: { xpath: "" } };
    case "exists":
      return { exists: { xpath: "" } };
    case "urlIncludes":
      return { urlIncludes: "" };
    default:
      return { visible: { xpath: "" } };
  }
}

export function getBranchConditionType(condition) {
  if (!condition || typeof condition !== "object") return BRANCH_CONDITION_TYPES[0].value;
  if (condition.visible) return "visible";
  if (condition.exists) return "exists";
  if (typeof condition.urlIncludes === "string") return "urlIncludes";
  return BRANCH_CONDITION_TYPES[0].value;
}

export function getSuccessType(success) {
  if (!success || typeof success !== "object") return "";
  const condition = success.condition;
  if (!condition || typeof condition !== "object") return "";
  if (typeof condition.delay === "number") return "delay";
  if (condition.visible) return "visible";
  if (condition.exists) return "exists";
  if (typeof condition.urlIncludes === "string") return "urlIncludes";
  if (condition.script) return "script";
  return "";
}

export function createDefaultSuccessConfig(type) {
  switch (type) {
    case "delay":
      return { timeout: 5, condition: { delay: 1 } };
    case "visible":
      return { timeout: 5, condition: { visible: { xpath: "" } } };
    case "exists":
      return { timeout: 5, condition: { exists: { xpath: "" } } };
    case "urlIncludes":
      return { timeout: 5, condition: { urlIncludes: "" } };
    case "script":
      return { timeout: 5, condition: { script: { code: "" } } };
    default:
      return null;
  }
}

export function cleanSuccessConfig(value) {
  if (!value || typeof value !== "object") return null;
  const cleaned = deepClean(value);
  return cleaned ?? null;
}

export function parseNumber(input) {
  if (input === "" || input === null || typeof input === "undefined") return null;
  const num = Number(input);
  return Number.isFinite(num) ? num : null;
}

export function buildPayload(form) {
  const errors = [];
  const slug = String(form.slug || "").trim();
  const title = String(form.title || "").trim();
  const description = String(form.description || "").trim();
  const startStepId = String(form.startStepId || "").trim();

  if (!slug) errors.push("Slug is required");
  if (!title) errors.push("Title is required");

  if (!Array.isArray(form.steps) || form.steps.length === 0) {
    errors.push("At least one step is required");
  }

  const steps = [];
  const seen = new Set();

  (form.steps || []).forEach((step, index) => {
    const stepLabel = `Step ${index + 1}`;
    const stepKey = String(step.stepKey || "").trim();
    if (!stepKey) {
      errors.push(`${stepLabel}: step key is required`);
      return;
    }
    if (seen.has(stepKey)) {
      errors.push(`${stepLabel}: step key must be unique`);
      return;
    }
    seen.add(stepKey);

    const type = step.type;
    if (!STEP_TYPES.includes(type)) {
      errors.push(`${stepLabel}: unsupported step type "${type}"`);
      return;
    }

    const config = cleanConfigForType(type, step.config);
    const configErrors = validateConfig(type, config, stepLabel);
    errors.push(...configErrors);

    const successConfig = cleanSuccessConfig(step.successConfig);

    steps.push({
      stepKey,
      type,
      label: String(step.label || "").trim() || null,
      nextStepKey: String(step.nextStepKey || "").trim() || null,
      exitStepKey: String(step.exitStepKey || "").trim() || null,
      ...(config ? { config } : {}),
      ...(successConfig ? { successConfig } : {}),
    });
  });

  if (startStepId && !seen.has(startStepId)) {
    errors.push("Start step must match one of the defined step keys");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return {
    slug,
    title,
    description: description || null,
    startStepId: startStepId || null,
    steps,
  };
}

export function formatApiError(payload) {
  if (!payload || typeof payload !== "object") {
    return "Failed to save workflow";
  }
  const segments = [];
  if (typeof payload.error === "string" && payload.error) {
    segments.push(payload.error);
  }
  if (Array.isArray(payload.details) && payload.details.length > 0) {
    segments.push(payload.details.join("\n"));
  } else if (typeof payload.message === "string" && payload.message) {
    segments.push(payload.message);
  }
  return segments.length > 0 ? segments.join("\n") : "Failed to save workflow";
}

function generateStepKey(existingKeys) {
  const taken = new Set(existingKeys);
  let index = existingKeys.length + 1;
  let candidate = `step_${index}`;
  while (taken.has(candidate)) {
    index += 1;
    candidate = `step_${index}`;
  }
  return candidate;
}

function cleanConfigForType(type, config) {
  if (!config || typeof config !== "object") {
    if (type === "if") return { branches: [] };
    return null;
  }
  if (type === "if") {
    const branches = Array.isArray(config.branches) ? config.branches : [];
    const cleanedBranches = branches
      .map((branch) => {
        if (!branch || typeof branch !== "object") return null;
        const next = String(branch.next || "").trim();
        const condition = branch.condition && typeof branch.condition === "object"
          ? deepClean(branch.condition)
          : null;
        if (!next || !condition) return null;
        return { next, condition };
      })
      .filter(Boolean);
    return { branches: cleanedBranches };
  }
  const cleaned = deepClean(config);
  return cleaned ?? null;
}

function validateConfig(type, config, label) {
  const errors = [];
  if (type === "navigate") {
    if (!config || !config.url) errors.push(`${label}: URL is required for navigate steps`);
  } else if (type === "click") {
    if (!config || !config.xpath) errors.push(`${label}: XPath is required for click steps`);
  } else if (type === "fill") {
    if (!config || !config.xpath) errors.push(`${label}: XPath is required for fill steps`);
    if (!config || !config.value) errors.push(`${label}: Value is required for fill steps`);
  } else if (type === "press") {
    if (!config || !config.xpath) errors.push(`${label}: XPath is required for press steps`);
    if (!config || !config.key) errors.push(`${label}: Key is required for press steps`);
  } else if (type === "log") {
    if (!config || !config.message) errors.push(`${label}: Message is required for log steps`);
  } else if (type === "script") {
    if (!config || !config.code) errors.push(`${label}: Code is required for script steps`);
  } else if (type === "extract_text") {
    if (!config || !config.xpath) errors.push(`${label}: XPath is required for extract_text steps`);
    if (!config || !config.as) errors.push(`${label}: Variable name is required for extract_text steps`);
  } else if (type === "if") {
    const branches = Array.isArray(config?.branches) ? config.branches : [];
    if (branches.length === 0) {
      errors.push(`${label}: At least one branch is required for if steps`);
    } else {
      branches.forEach((branch, idx) => {
        if (!branch.next) errors.push(`${label}: Branch ${idx + 1} requires a next step key`);
        if (!branch.condition) errors.push(`${label}: Branch ${idx + 1} requires a condition`);
      });
    }
  } else if (type === "loop") {
    const times = config?.times;
    if (times == null || times <= 0) {
      errors.push(`${label}: Times must be greater than 0 for loop steps`);
    }
  }
  return errors;
}

function deepClean(value) {
  if (Array.isArray(value)) {
    const items = value
      .map(deepClean)
      .filter((item) => item !== undefined && (!(typeof item === "object") || (item && Object.keys(item).length > 0)));
    return items.length > 0 ? items : undefined;
  }
  if (value && typeof value === "object") {
    const next = {};
    Object.entries(value).forEach(([key, val]) => {
      const cleaned = deepClean(val);
      if (cleaned !== undefined) next[key] = cleaned;
    });
    return Object.keys(next).length > 0 ? next : undefined;
  }
  if (value === null || value === "" || typeof value === "undefined") {
    return undefined;
  }
  return value;
}
