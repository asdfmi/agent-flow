export default async function handleExtractText({
  automation,
  execution,
  step,
}) {
  const { xpath, as } = step.config;
  const locator = automation.page.locator(`xpath=${xpath}`).first();
  const text = await locator.textContent();
  execution.setVar(as, text);
  return text;
}
