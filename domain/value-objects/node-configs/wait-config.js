import { requirePositiveNumber } from "../../utils/validation.js";

export default class WaitConfig {
  constructor(rawConfig) {
    const config = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    this.timeout = requirePositiveNumber(config.timeout, "wait config.timeout");
    Object.freeze(this);
  }

  static from(raw) {
    if (raw instanceof WaitConfig) {
      return raw;
    }
    return new WaitConfig(raw);
  }
}
