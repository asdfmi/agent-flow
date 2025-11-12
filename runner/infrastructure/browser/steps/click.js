const PLAYWRIGHT_BUTTON_BY_TYPE = Object.freeze({
  left: "left",
  right: "right",
  middle: "middle",
});

export default async function handleClick({ automation, step }) {
  const { xpath, button, clickCount, delay, timeout } = step.config;
  const locator = automation.page.locator(`xpath=${xpath}`);
  await locator.click({
    button: PLAYWRIGHT_BUTTON_BY_TYPE[button],
    clickCount,
    delay: delay * 1000,
    timeout: timeout * 1000,
  });
}
