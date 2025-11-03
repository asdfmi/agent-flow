import BrowserSession from './browser-session.js';
import RunEventDispatcher from './run-events.js';
import SuccessEvaluator from './success-evaluator.js';
import ExecutionContext from './execution-context.js';
import handleNavigate from './steps/navigate.js';
import handleWait from './steps/wait.js';
import handleScroll from './steps/scroll.js';
import handleClick from './steps/click.js';
import handleFill from './steps/fill.js';
import handlePress from './steps/press.js';
import handleLog from './steps/log.js';
import handleScript from './steps/script.js';
import handleExtractText from './steps/extractText.js';
import handleIf from './steps/if.js';
import handleLoop from './steps/loop.js';

const STEP_HANDLERS = {
  navigate: handleNavigate,
  wait: handleWait,
  scroll: handleScroll,
  click: handleClick,
  fill: handleFill,
  press: handlePress,
  log: handleLog,
  script: handleScript,
  extract_text: handleExtractText,
  if: handleIf,
  loop: handleLoop,
};

export class WorkflowRunner {
  constructor({ workflow, runId, postEvent, logger = console }) {
    this.workflow = workflow;
    this.runId = runId;
    this.postEvent = postEvent;
    this.logger = logger;
    this.execution = new ExecutionContext();
    this.browserSession = null;
    this.events = null;
    this.successEvaluator = null;
    this.stepIndex = null;
    this.loopStates = new Map();
  }

  async run() {
    this.browserSession = await new BrowserSession({ logger: this.logger }).init();
    this.events = new RunEventDispatcher({ runId: this.runId, postEvent: this.postEvent, logger: this.logger });
    this.events.attachBrowserSession(this.browserSession);
    this.events.startScreenshotStream();
  	this.successEvaluator = new SuccessEvaluator({ browserSession: this.browserSession, execution: this.execution });

    await this.events.runStatus('running');
    try {
      const pointerPlan = this.#buildStepIndex(this.workflow.steps);
      if (pointerPlan) {
        this.stepIndex = pointerPlan.map;
        await this.#executeFrom(pointerPlan.startId);
      } else {
        await this.#executeSteps(this.workflow.steps);
      }
      await this.events.runStatus('succeeded');
      await this.events.done({ ok: true });
    } catch (error) {
      const message = String(error?.message || error);
      await this.events.runStatus('failed', { error: message });
      await this.events.done({ ok: false, error: message });
      throw error;
    } finally {
      this.events?.stopScreenshotStream();
      await this.browserSession?.cleanup();
    }
  }

  #buildStepIndex(steps) {
    if (!Array.isArray(steps) || steps.length === 0) return null;
    const map = new Map();
    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i];
      const id = typeof step?.id === 'string' ? step.id.trim() : '';
      if (!id) {
        return null;
      }
      map.set(id, { step, index: i });
    }
    const defaultStart = steps[0]?.id;
    const requestedStart = typeof this.workflow.start === 'string' ? this.workflow.start.trim() : '';
    const startId = requestedStart && map.has(requestedStart) ? requestedStart : defaultStart;
    if (!startId) return null;
    return { startId, map };
  }

  async #executeSteps(steps, meta = {}) {
    if (!Array.isArray(steps)) return;
    for (const step of steps) {
      const stepMeta = step?.id ? { ...meta, stepId: step.id, type: step.type } : meta;
      await this.#executeStep(step, stepMeta);
    }
  }

  async #executeFrom(startId) {
    let currentId = startId;
    while (currentId) {
      const entry = this.stepIndex?.get(currentId);
      if (!entry) {
        throw new Error(`unknown step id: ${currentId}`);
      }
      const { step, index } = entry;
      const directive = await this.#executeStep(step, { stepId: step.id });
      let nextStepId = typeof directive?.nextStepId === 'string' ? directive.nextStepId : undefined;
      if (directive?.nextStepId === null) {
        nextStepId = null;
      }
      if (typeof nextStepId === 'undefined' || nextStepId === '') {
        if (typeof step.next === 'string' && step.next.trim()) {
          nextStepId = step.next.trim();
        } else {
          const fallback = this.#getSequentialNext(index);
          nextStepId = fallback?.step?.id;
        }
      }
      if (!nextStepId) break;
      if (!this.stepIndex.has(nextStepId)) {
        throw new Error(`unknown next step id: ${nextStepId}`);
      }
      currentId = nextStepId;
    }
  }

  #getSequentialNext(index) {
    const steps = this.workflow.steps;
    if (!Array.isArray(steps)) return null;
    const nextStep = steps[index + 1];
    if (!nextStep?.id) return null;
    return this.stepIndex?.get(nextStep.id) ?? null;
  }

  async #executeStep(step, meta) {
    if (!step || typeof step.type !== 'string') {
      throw new Error(`invalid step: ${JSON.stringify(step)}`);
    }
    const index = this.execution.nextStepIndex();
    const enrichedMeta = { ...meta, type: step.type, stepId: step.id ?? meta?.stepId };
    await this.events.stepStart({ index, meta: enrichedMeta });
    try {
      const handler = STEP_HANDLERS[step.type];
      if (!handler) {
        throw new Error(`unsupported step type: ${step.type}`);
      }
      const result = await handler({ runner: this, step, meta: enrichedMeta, index });
      let handled = false;
      let nextStepId;
      if (typeof result === 'boolean') {
        handled = result;
      } else if (result && typeof result === 'object') {
        handled = Boolean(result.handled);
        if ('nextStepId' in result) {
          nextStepId = result.nextStepId;
        }
      }
      if (!handled) {
        await this.successEvaluator.waitFor(step.success, { meta: enrichedMeta });
      }
      await this.events.stepEnd({ index, ok: true, meta: enrichedMeta });
      return { nextStepId };
    } catch (error) {
      const message = String(error?.message || error);
      await this.events.stepEnd({ index, ok: false, error: message, meta: enrichedMeta });
      throw error;
    }
  }

  async evaluateOnPage(code) {
    const variables = this.execution.getVariablesSnapshot();
    return this.browserSession.evaluateOnPage(code, variables);
  }

  get page() {
    return this.browserSession?.page;
  }
}
