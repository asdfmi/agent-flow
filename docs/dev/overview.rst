Developer Overview
==================

Agent Flow keeps browser automation logic inside the domain core and treats the UI plus execution infrastructure as interchangeable adapters that orbit that core.

Package Structure
-----------------

``domain``
    Represents the core domain. Aggregates, value objects, and services live here, independent from delivery or infrastructure concerns.
``portal``
    Owns user-facing surfaces and persistence. Express powers the REST API and internal webhook, while the workflow builder UI is built with Vite + React + Pixi.js and paired with a WebSocket hub for live updates.
``runner``
    Provides the execution infrastructure. An Express service receives workflow jobs, Playwright-driven step handlers perform real browser actions, and HTTP/WS event publishers stream status back to the portal.
