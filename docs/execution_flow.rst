Execution Flow
==============

Run Lifecycle
-------------
1. An operator triggers a run from the portal UI or API (``POST /api/workflows/:id/run``).
2. The portal loads the workflow plus steps via Prisma, then POSTs ``{ runId, workflow }`` to the crawler’s run endpoint.
3. The crawler validates the payload against the JSON schema and enqueues it in ``RunManager``. If the configured concurrency limit is exceeded, it returns 429.
4. ``WorkflowRunner`` launches a Playwright browser and executes each step handler in order.
   - Sends a ``step_start`` event at the beginning of every step.
   - Captures screenshots periodically and emits ``screenshot`` events.
   - Waits for the ``success`` condition via ``SuccessEvaluator`` when provided.
   - Emits ``step_end`` (with ``ok: false`` and an ``error`` message on failure).
5. Once all steps complete, the crawler emits ``run_status: succeeded`` (or ``failed`` on errors) followed by a ``done`` event.
6. The portal rebroadcasts incoming events over the WebSocket endpoint (``/ws``); the UI hook ``useWorkflowRun`` updates status, logs, and screenshots accordingly.
7. ``WorkflowRunner`` cleans up Playwright resources and ``RunManager`` decrements the active run count.

Seed Workflow (Sample)
----------------------
The demo flow in ``portal/prisma/seed.js`` scrolls through the Qiita trending articles page.

.. list-table::
   :header-rows: 1

   * - Position
     - Type
     - Purpose
   * - 0
     - navigate
     - Visit ``https://qiita.com`` and wait until the first article is visible
   * - 1
     - wait
     - Delay to allow hydration
   * - 2
     - click
     - Open the first article
   * - 3
     - wait
     - Pause after navigation stabilizes
   * - 4-13
     - scroll
     - Scroll downward 600 px at a time with a 1s delay
   * - 14
     - log
     - Output ``Finished scrolling Qiita feed``
