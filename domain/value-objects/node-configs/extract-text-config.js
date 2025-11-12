import { requireNonEmptyString } from "../../utils/validation.js";

export default class ExtractTextConfig {
  constructor(rawConfig) {
    const config = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    this.xpath = requireNonEmptyString(
      config.xpath,
      "extract_text config.xpath",
    );
    this.as = requireNonEmptyString(config.as, "extract_text config.as");
    Object.freeze(this);
  }

  static from(raw) {
    if (raw instanceof ExtractTextConfig) {
      return raw;
    }
    return new ExtractTextConfig(raw);
  }
}
