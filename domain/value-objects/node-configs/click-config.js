import {
  assertInSet,
  requireNonEmptyString,
  requirePositiveInteger,
  requireNonNegativeNumber,
  requirePositiveNumber,
} from "../../utils/validation.js";
import { CLICK_BUTTON_OPTION_SET } from "./constants.js";

export default class ClickConfig {
  constructor(rawConfig) {
    const config = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    this.xpath = requireNonEmptyString(config.xpath, "click config.xpath");
    const button = requireNonEmptyString(config.button, "click config.button");
    assertInSet(button, CLICK_BUTTON_OPTION_SET, "click config.button");
    this.button = button;
    this.clickCount = requirePositiveInteger(
      config.clickCount,
      "click config.clickCount",
    );
    this.delay = requireNonNegativeNumber(config.delay, "click config.delay");
    this.timeout = requirePositiveNumber(
      config.timeout,
      "click config.timeout",
    );
    Object.freeze(this);
  }

  static from(raw) {
    if (raw instanceof ClickConfig) {
      return raw;
    }
    return new ClickConfig(raw);
  }
}
