import RequestError from '../errors/request-error.js';

export default class RunManager {
  constructor({ maxConcurrency, validator, crawlerFactory, logger = console } = {}) {
    this.maxConcurrency = Number(maxConcurrency ?? 1);
    this.validator = validator;
    this.crawlerFactory = crawlerFactory;
    this.logger = logger;
    this.activeRuns = 0;
  }

  getMetrics() {
    return { activeRuns: this.activeRuns, maxConcurrency: this.maxConcurrency };
  }

  async enqueue({ runId, workflow }) {
    if (!workflow || typeof workflow !== 'object') {
      throw new RequestError(400, { error: 'workflow_required' });
    }

    const { valid, errors } = await this.validator.validate(workflow);
    if (!valid) {
      throw new RequestError(400, { error: 'invalid_workflow', details: errors });
    }

    if (!runId) {
      throw new RequestError(400, { error: 'runId required' });
    }

    if (this.activeRuns >= this.maxConcurrency) {
      throw new RequestError(429, { error: 'crawler busy', active: this.activeRuns, max: this.maxConcurrency });
    }

    this.activeRuns += 1;
    try {
      const crawler = this.crawlerFactory({ workflow, runId });
      crawler
        .run()
        .catch((error) => {
          this.logger.error('Workflow execution failed', error);
        })
        .finally(() => {
          this.activeRuns -= 1;
        });
    } catch (error) {
      this.activeRuns -= 1;
      throw error;
    }
  }
}
