import { assertInSet, requireNonEmptyString } from "../../utils/validation.js";
import { NAVIGATE_WAIT_STATE_SET } from "./constants.js";

export default class NavigateConfig {
  constructor(rawConfig) {
    const config = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    this.url = requireNonEmptyString(config.url, "navigate config.url");
    const waitUntil = requireNonEmptyString(
      config.waitUntil,
      "navigate config.waitUntil",
    );
    assertInSet(waitUntil, NAVIGATE_WAIT_STATE_SET, "navigate config.waitUntil");
    this.waitUntil = waitUntil;
    Object.freeze(this);
  }

  static from(raw) {
    if (raw instanceof NavigateConfig) {
      return raw;
    }
    return new NavigateConfig(raw);
  }
}
