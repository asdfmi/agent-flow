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

Key directories
^^^^^^^^^^^^^^^
- ``prisma/``: ``Workflow`` / ``WorkflowStep`` models and seed script.
- ``server/``: Express API, internal event bus, WebSocket gateway.
- ``ui/``: Management UI built with Vite, React, and MUI.

Crawler
-------
Responsibilities
^^^^^^^^^^^^^^^^
- Launch and manage the lifecycle of Playwright browsers
- Validate workflow JSON and execute steps sequentially
- Send step events and screenshots back to the portal

Key directories
^^^^^^^^^^^^^^^
- ``src/engine/``: ``WorkflowRunner``, step handlers, success evaluation logic.
- ``src/services/``: ``RunManager`` (concurrency control) and ``WorkflowValidator`` (AJV validation).
- ``src/schema/``: JSON schema describing accepted workflow payloads.
- ``src/events.js``: Module that posts events to the portal’s internal API.
