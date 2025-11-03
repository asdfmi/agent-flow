API Reference
=============

Portal Endpoints
----------------

``GET /api/workflows``
  - Returns workflows ordered by most recently updated.
  - Response: ``{ data: Workflow[] }``.

``GET /api/workflows/:id``
  - Fetches a workflow and its steps.
  - Validation: ``id`` must be a positive integer.
  - Not found: ``{ error: "workflow_not_found" }``.

``POST /api/workflows/:id/run``
  - Triggers execution.
  - Success: ``202 Accepted`` with ``{ runId }``.
  - The portal forwards ``{ runId, workflow }`` to the crawler service.
  - Typical errors:
    * ``400`` invalid_workflow_id
    * ``404`` workflow_not_found
    * ``500`` crawler_base_url_not_configured
    * ``502`` crawler_unreachable

``POST /internal/runs/:runId/events``
  - Crawler-only endpoint; requires a shared bearer token.
  - Success: ``204 No Content``.
  - Auth failure: ``401 unauthorized``.

WebSocket ``/ws``
  - Subscribe via ``{"type":"subscribe","runId":"..."}``.
  - Unsubscribe via ``{"type":"unsubscribe","runId":"..."}``.
  - Ping/Pong: ``{"type":"ping"}`` → ``{"type":"pong","ts":...}``.
  - Events are JSON objects forwarded from the crawler.

Crawler Endpoints
-----------------

``POST /run``
  - Body: ``{ runId: string, workflow: WorkflowPayload }``.
  - Validated by JSON schema; ``runId`` is required.
  - Success: ``202 { accepted: true }``.
  - Errors:
    * ``400`` workflow_required / invalid_workflow / runId required
    * ``429`` crawler busy (includes ``active`` / ``max``)

``GET /healthz``
  - Response: ``{ ok: true, activeRuns, maxConcurrency }``.
