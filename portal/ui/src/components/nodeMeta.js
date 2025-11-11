const NODE_META = {
  navigate: {
    label: "Navigate",
    color: "primary",
    description: "Open a URL and wait for load",
  },
  wait: { label: "Wait", color: "default", description: "Pause for a delay" },
  scroll: {
    label: "Scroll",
    color: "secondary",
    description: "Scroll by dx/dy to reveal content",
  },
  click: {
    label: "Click",
    color: "info",
    description: "Click an element via XPath",
  },
  fill: {
    label: "Fill",
    color: "success",
    description: "Fill input via XPath with value",
  },
  press: {
    label: "Press",
    color: "info",
    description: "Send key press to element",
  },
  log: {
    label: "Log",
    color: "warning",
    description: "Emit a log message",
  },
  script: {
    label: "Script",
    color: "secondary",
    description: "Run custom JavaScript snippet",
  },
  extract_text: {
    label: "Extract text",
    color: "success",
    description: "Capture text via XPath",
  },
};

export function getNodeMeta(type) {
  return (
    NODE_META[type] || {
      label: type || "node",
      color: "default",
      description: "",
    }
  );
}

export default NODE_META;
