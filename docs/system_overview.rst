System Overview
===============

Summary
-------
Browgent is a platform for registering, executing, and observing browser-automation workflows.  
Operators manage workflows through the ``portal`` (API + UI), while the ``crawler`` uses Playwright to perform real browser actions and stream progress and screenshots back to the portal in real time.

Portal
------
Responsibilities
^^^^^^^^^^^^^^^^
- Persist workflow definitions (Prisma + SQLite)
- Expose the REST API and WebSocket bridge
- Render the operator dashboard with React

Technology Stack
^^^^^^^^^^^^^^^^
- **Express 5** – Serves REST endpoints under ``/api`` and static UI assets.
- **Prisma Client** – Provides typed access to the SQLite database for workflows, nodes, edges, runs, and metrics.
- **WebSocket (ws)** – Bridges crawler events to subscribed browsers (`/ws` path).
- **Vite + React 19 + MUI** – Powers the UI with component-based views and live reload in development.

Runtime Services
^^^^^^^^^^^^^^^^
- **Workflow CRUD API** – ``GET/POST/PUT`` routes in ``portal/server/routes/workflows.js``.
- **Internal event ingestion** – Protected endpoint in ``portal/server/routes/internal.js`` that accepts crawler notifications.
- **WebSocket gateway** – ``portal/server/ws/index.js`` maps run IDs to connections and broadcasts execution events.

Key directories
^^^^^^^^^^^^^^^
- ``prisma/``: ``Workflow`` / ``WorkflowNode`` / ``WorkflowEdge`` models and seed script.
- ``server/``: Express API, internal event bus, WebSocket gateway.
- ``ui/``: Management UI built with Vite, React, and MUI.

Crawler
-------
Responsibilities
^^^^^^^^^^^^^^^^
- Launch and manage the lifecycle of Playwright browsers
- Validate workflow JSON, materialise the node/edge graph, and execute nodes sequentially
- Evaluate outbound edge conditions to choose the next node (or terminate the run)
- Send step events and screenshots back to the portal

Technology Stack
^^^^^^^^^^^^^^^^
- **Playwright** – Controls Chromium browsers headlessly.
- **Express 5** – Exposes ``POST /run`` for execution requests and ``GET /healthz`` for monitoring.
- **AJV** – Validates incoming workflows against ``src/schema/workflow.schema.json``.
- **Node.js EventEmitter** – Coordinates step-level events before forwarding to the portal.

Key directories
^^^^^^^^^^^^^^^
- ``src/engine/``: ``WorkflowRunner``, step handlers, success evaluation logic.
- ``src/services/``: ``RunManager`` (concurrency control) and ``WorkflowValidator`` (AJV validation).
- ``src/schema/``: JSON schema describing accepted workflow payloads.
- ``src/events.js``: Module that posts events to the portal’s internal API.
