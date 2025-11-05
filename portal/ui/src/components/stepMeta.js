const STEP_META = {
  navigate: { label: "Navigate", color: "primary" },
  wait: { label: "Wait", color: "default" },
  scroll: { label: "Scroll", color: "secondary" },
  click: { label: "Click", color: "info" },
  fill: { label: "Fill", color: "success" },
  press: { label: "Press", color: "info" },
  log: { label: "Log", color: "warning" },
  script: { label: "Script", color: "secondary" },
  extract_text: { label: "Extract text", color: "success" },
  if: { label: "Branch", color: "warning" },
  loop: { label: "Loop", color: "secondary" },
};

export function getStepMeta(type) {
  return STEP_META[type] || { label: type || "step", color: "default" };
}

export default STEP_META;
