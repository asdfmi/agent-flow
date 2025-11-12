export default async function handleScript({ automation, step }) {
  const { code = "" } = step.config ?? {};
  const variables =
    step.inputValues && typeof step.inputValues === "object"
      ? step.inputValues
      : {};
  const result = await automation.evaluateOnPage(code, variables);
  return { outputs: { result } };
}
