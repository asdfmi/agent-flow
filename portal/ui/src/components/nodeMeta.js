const NODE_META = {
  navigate: { label: "Navigate", color: "primary" },
  wait: { label: "Wait", color: "default" },
  scroll: { label: "Scroll", color: "secondary" },
  click: { label: "Click", color: "info" },
  fill: { label: "Fill", color: "success" },
  press: { label: "Press", color: "info" },
  log: { label: "Log", color: "warning" },
  script: { label: "Script", color: "secondary" },
  extract_text: { label: "Extract text", color: "success" },
};

export function getNodeMeta(type) {
  return NODE_META[type] || { label: type || "node", color: "default" };
}

export default NODE_META;
