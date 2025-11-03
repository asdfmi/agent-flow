export default async function handleLoop({ runner, step }) {
  const state = runner.loopStates.get(step.id) ?? { count: 0 };
  let shouldContinue = true;

  if (typeof step.times === 'number') {
    shouldContinue = state.count < step.times;
  }

  if (shouldContinue && step.condition) {
    shouldContinue = await runner.successEvaluator.evaluate(step.condition);
  }

  if (shouldContinue) {
    if (step.as) {
      runner.execution.setVar(step.as, state.count);
    }
    state.count += 1;
    runner.loopStates.set(step.id, state);
    return { handled: true, nextStepId: step.next };
  }

  runner.loopStates.delete(step.id);
  return { handled: true, nextStepId: step.exit ?? null };
}
