const STEP_META = {
  navigate: { label: "Navigate", color: "primary" },
  click: { label: "Click", color: "warning" },
  extract_text: { label: "Extract Text", color: "secondary" },
  fill: { label: "Fill", color: "info" },
  wait: { label: "Wait", color: "default" },
  scroll: { label: "Scroll", color: "success" },
  press: { label: "Press", color: "info" },
  log: { label: "Log", color: "secondary" },
  script: { label: "Script", color: "error" },
};

export function getStepMeta(type) {
  return STEP_META[type] ?? { label: type, color: "default" };
}

export default STEP_META;
