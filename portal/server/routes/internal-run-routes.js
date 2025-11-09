import express from 'express';
import { asyncHandler } from '../utils/http.js';

export default function createInternalRunRoutes({ runEventHub, internalSecret = '' } = {}) {
  const router = express.Router();

  router.post(
    '/runs/:runId/events',
    asyncHandler(async (req, res) => {
      if (internalSecret) {
        const header = req.get('authorization') || '';
        if (header !== `Bearer ${internalSecret}`) {
          res.status(401).json({ error: 'unauthorized' });
          return;
        }
      }
      const runId = typeof req.params.runId === 'string' ? req.params.runId : null;
      if (!runId) {
        res.status(400).json({ error: 'invalid_run', message: 'run id is required' });
        return;
      }
      if (!runEventHub) {
        res.status(503).json({ error: 'ws_unavailable' });
        return;
      }
      const payload = req.body && typeof req.body === 'object' ? req.body : {};
      runEventHub.broadcast(runId, {
        ...payload,
        runId,
        ts: typeof payload.ts === 'number' ? payload.ts : Date.now(),
      });
      res.status(202).json({ ok: true });
    }),
  );

  return router;
}
