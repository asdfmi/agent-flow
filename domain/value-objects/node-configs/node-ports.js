const NODE_PORT_TEMPLATES = Object.freeze({
  fill: {
    inputs: [{ name: "value", required: true }],
    outputs: [],
  },
  log: {
    inputs: [{ name: "value", required: false }],
    outputs: [],
  },
  script: {
    inputs: [{ name: "payload", required: false }],
    outputs: [{ name: "result", required: false }],
  },
  extract_text: {
    inputs: [],
    outputs: [{ name: "text", required: true }],
  },
});

const DEFAULT_PORTS = Object.freeze({
  inputs: [],
  outputs: [],
});

function clonePorts(ports = []) {
  return ports.map((port) => ({
    name: port.name,
    required: port.required,
  }));
}

export function getNodePorts(type) {
  const template = NODE_PORT_TEMPLATES[type] ?? DEFAULT_PORTS;
  return {
    inputs: clonePorts(template.inputs),
    outputs: clonePorts(template.outputs),
  };
}

export function getDefaultNodeInputs(type) {
  return getNodePorts(type).inputs;
}

export function getDefaultNodeOutputs(type) {
  return getNodePorts(type).outputs;
}
