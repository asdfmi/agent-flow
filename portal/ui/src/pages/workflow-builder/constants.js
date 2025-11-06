export const NODE_TYPES = [
  "navigate",
  "wait",
  "scroll",
  "click",
  "fill",
  "press",
  "log",
  "script",
  "extract_text",
];

export const SUCCESS_TYPES = [
  { value: "", label: "None" },
  { value: "delay", label: "Delay (seconds)" },
  { value: "visible", label: "Element visible (XPath)" },
  { value: "exists", label: "Element exists (XPath)" },
  { value: "urlIncludes", label: "URL contains string" },
  { value: "script", label: "Script" },
];

export const BRANCH_CONDITION_TYPES = [
  { value: "visible", label: "Element visible (XPath)" },
  { value: "exists", label: "Element exists (XPath)" },
  { value: "urlIncludes", label: "URL contains string" },
  { value: "delay", label: "Delay (seconds)" },
  { value: "script", label: "Script" },
];
