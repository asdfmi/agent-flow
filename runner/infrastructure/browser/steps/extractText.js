export default async function handleExtractText({ automation, step }) {
  const { xpath = "" } = step.config ?? {};
  const locator = automation.page.locator(`xpath=${xpath}`).first();
  const text = await locator.textContent();
  return { outputs: { text } };
}
