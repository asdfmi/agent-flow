import { ensureArray } from '../utils/object-utils.js';
import { ValidationError } from '../errors.js';
import { randomUUID } from 'node:crypto';
import { optionalString, requireNonEmptyString } from '../utils/validation.js';

function normalizePorts(definitions, { defaultRequired }) {
  return ensureArray(definitions).map((definition, index) => {
    if (typeof definition === 'string') {
      return {
        name: requireNonEmptyString(definition, `Node.port[${index}]`),
        required: defaultRequired,
      };
    }
    if (definition && typeof definition === 'object') {
      const name = requireNonEmptyString(definition.name, `Node.port[${index}].name`);
      const required = definition.required === undefined ? defaultRequired : Boolean(definition.required);
      return { name, required };
    }
    throw new ValidationError('Node ports must be strings or objects with a "name" property');
  });
}

export default class Node {
  constructor({
    id = null,
    name = null,
    type = 'task',
    inputs = [],
    outputs = [],
  }) {
    const identifier = id ?? randomUUID();
    this.id = requireNonEmptyString(identifier, 'Node.id');
    this.type = requireNonEmptyString(type, 'Node.type');
    this.name = optionalString(name) ?? this.id;
    this.inputs = normalizePorts(inputs, { defaultRequired: true });
    this.outputs = normalizePorts(outputs, { defaultRequired: false });
  }

  getInputNames() {
    return this.inputs.map((port) => port.name);
  }

  getRequiredInputs() {
    return this.inputs.filter((port) => port.required !== false).map((port) => port.name);
  }

  getOutputNames() {
    return this.outputs.map((port) => port.name);
  }

  hasOutput(name) {
    return this.getOutputNames().includes(name);
  }

  static from(value) {
    if (!value) {
      throw new ValidationError('Node input is required');
    }
    if (value instanceof Node) return value;
    return new Node(value);
  }
}
