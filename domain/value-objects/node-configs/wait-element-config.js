import {
  assertInSet,
  requireNonEmptyString,
  requirePositiveNumber,
} from "../../utils/validation.js";
import { WAIT_ELEMENT_CONDITION_TYPE_SET } from "./constants.js";

export default class WaitElementConfig {
  constructor(rawConfig) {
    const config = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    const type = requireNonEmptyString(config.type, "wait_element config.type");
    assertInSet(type, WAIT_ELEMENT_CONDITION_TYPE_SET, "wait_element config.type");
    this.type = type;
    this.xpath = requireNonEmptyString(
      config.xpath,
      "wait_element config.xpath",
    );
    this.timeout = requirePositiveNumber(
      config.timeout,
      "wait_element config.timeout",
    );
    Object.freeze(this);
  }

  static from(raw) {
    if (raw instanceof WaitElementConfig) {
      return raw;
    }
    return new WaitElementConfig(raw);
  }
}
