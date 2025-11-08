Monitoring Workflow Runs
========================

Starting a Run
--------------
- From the workflow builder, press **Run workflow**. The portal sends a ``POST`` request to ``/api/workflows/<id>/run``.
- Provide context in the UI (e.g. ensure selectors are up to date) before launching the run to avoid validation errors.
- The crawler responds with a ``runId``. The UI opens the *Live Execution* modal automatically when the request is accepted.

Understanding Statuses
----------------------
- **Queued** – The crawler acknowledged the run but has not yet allocated a Playwright browser (limited by ``MAX_CONCURRENCY``).
- **Running** – Steps are executing. The active step chip shows progress, and the screenshot stream refreshes roughly every 200 ms.
- **Succeeded** – All steps completed and success criteria passed.
- **Failed** – A step raised an error. The event log includes the failing step index and message.
- **Cancelled** – (Reserved) Browgent currently exposes the state but does not provide cancellation controls.

Live Execution Modal
--------------------
- **Screenshot panel** – Displays live browser snapshots. If unavailable, the placeholder ``Waiting for screenshot...`` is shown.
- **Event stream** – List of chronological events (`step_start`, `step_end`, `run_status`, `done`, `screenshot`). Hover the chips to read timestamps or error messages.
- **Step chips** – Read-only overview of the workflow; the chip matching the current step is filled, and its colour reflects the action type.
- **WebSocket indicator** – Header shows `WS: open|connecting|closed`. If closed, refresh the page to re-establish real-time updates (run continues server-side).

After the Run
-------------
- Close the modal to return to the builder; the last run status remains visible under the Run button.
- Use the workflows dashboard to see refreshed timestamps and statuses for each automation once the run completes.
- Query ``GET /api/workflows/<id>/runs`` if you need a detailed history feed (suitable for exporting to monitoring tools or dashboards).

Troubleshooting
---------------
- **Validation errors** – The crawler enforces the JSON schema. Review error details inside the builder toast or inspect the network response.
- **Selector not found** – Double-check the selectors in the step config. Use browser devtools targeting Playwright-friendly selectors.
- **Stale workflow data** – If another operator saved changes, use **Refresh** before editing (avoids overwriting steps unintentionally).
- **Screenshots missing** – Ensure the crawler has Playwright Chromium installed (`pnpm --dir crawler exec playwright install --with-deps chromium`) and the portal can reach it via ``PORTAL_BASE_URL``/``CRAWLER_BASE_URL`` configuration.
