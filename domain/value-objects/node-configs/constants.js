export const NAVIGATE_WAIT_STATES = Object.freeze([
  "page_loaded",
  "dom_ready",
  "network_idle",
  "response_received",
]);
export const NAVIGATE_WAIT_STATE_SET = new Set(NAVIGATE_WAIT_STATES);

export const CLICK_BUTTON_OPTIONS = Object.freeze(["left", "right", "middle"]);
export const CLICK_BUTTON_OPTION_SET = new Set(CLICK_BUTTON_OPTIONS);

export const WAIT_ELEMENT_CONDITION_TYPES = Object.freeze([
  "visible",
  "exists",
]);
export const WAIT_ELEMENT_CONDITION_TYPE_SET = new Set(
  WAIT_ELEMENT_CONDITION_TYPES,
);
