export default async function handleIf({ runner, step, meta }) {
  for (const branch of step.branches) {
    let matches = true;
    if (branch.condition) {
      matches = await runner.successEvaluator.evaluate(branch.condition);
    }
    if (matches) {
      return { handled: true, nextStepId: branch.next };
    }
  }

  throw new Error(`no matching branch for if step ${step.id || meta?.stepId || '<unknown>'}`);
}
