import { requireNonEmptyString } from "../../utils/validation.js";

export default class ScriptConfig {
  constructor(rawConfig) {
    const config = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    const code = typeof config.code === "string" ? config.code : "";
    this.code = requireNonEmptyString(code, "script config.code");
    Object.freeze(this);
  }

  static from(raw) {
    if (raw instanceof ScriptConfig) {
      return raw;
    }
    return new ScriptConfig(raw);
  }
}
