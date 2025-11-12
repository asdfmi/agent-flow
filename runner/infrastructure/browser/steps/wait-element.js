const PLAYWRIGHT_STATE_BY_TYPE = Object.freeze({
  visible: "visible",
  exists: "attached",
});

export default async function handleWaitElement({ automation, step }) {
  const { type, xpath, timeout } = step.config;
  const locator = automation.page.locator(`xpath=${xpath}`);
  await locator.waitFor({
    state: PLAYWRIGHT_STATE_BY_TYPE[type] ?? "visible",
    timeout: timeout * 1000,
  });
  return false;
}
