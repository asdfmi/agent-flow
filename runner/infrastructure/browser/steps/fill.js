import { DEFAULT_SUCCESS_TIMEOUT_SEC } from "../utils.js";

function resolveInputValue(step, name) {
  const payload = step?.inputValues?.[name];
  if (Array.isArray(payload)) {
    return payload.length > 0 ? payload[0] : undefined;
  }
  return payload;
}

export default async function handleFill({ automation, step }) {
  const {
    xpath = "",
    clear = false,
    timeout: timeoutSeconds = DEFAULT_SUCCESS_TIMEOUT_SEC,
  } = step.config ?? {};
  const value = resolveInputValue(step, "value");
  if (typeof value === "undefined") {
    throw new Error(
      `fill node "${step.id}" requires a bound input for "value"`,
    );
  }
  const locator = automation.page.locator(`xpath=${xpath}`);
  const timeout = timeoutSeconds * 1000;
  if (clear) {
    await locator.fill("", { timeout });
  }
  await locator.fill(value === null ? "" : String(value), { timeout });
}
