export default class ExecutionContext {
  constructor() {
    this.stepCounter = 0;
  }

  nextStepIndex() {
    const current = this.stepCounter;
    this.stepCounter += 1;
    return current;
  }
}
