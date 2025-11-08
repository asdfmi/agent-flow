Operator Overview
=================

Audience
--------
This guide is for operators who interact with Browgent through the web portal.  
It explains how to navigate the UI, understand key concepts, and discover where task automation happens.

Portal Entry Points
-------------------
- ``/`` – Workflows dashboard with the list of saved automations and the **Create workflow** shortcut.
- ``/workflow/<id>`` – Workflow Builder for editing steps, running a workflow, and reviewing live execution.

Core Concepts
-------------
- **Workflow** – A reusable automation composed of ordered steps plus an optional starting step.
- **Step** – A targeted browser action such as ``navigate``, ``click``, ``fill``, ``loop``, or ``if``. Each step can provide config (inputs) and success conditions.
- **Run** – A concrete execution of a workflow. Runs emit status updates, event logs, and screenshots.
- **Metrics** – Arbitrary JSON values captured during a run—for example scraped counts or prices—stored for analysis.

UI Primer
---------
- **Navigation bar** – Located at the top of every page; jump back to the Workflows dashboard at any time.
- **Workflow cards** – Each card shows title, description, last-updated timestamp, and a button to open the builder.
- **Builder canvas** – Visual layout of the step sequence. Selecting a step opens additional details and highlights connections.
- **Step editor** – Modal dialog for editing the selected step. Configure step keys, types, success checks, and advanced routing (``nextStepKey`` / ``exitStepKey`` for loops).
- **Execution viewer** – Live modal that displays the current screenshot, WebSocket status, streamed events, and the active step chip row.

Roles and Permissions
---------------------
The default deployment does not enforce authentication. If you host Browgent in a multi-tenant environment, front the portal with an authentication proxy and restrict access to the portal according to your operational policies.

Need More Detail?
-----------------
Continue with :doc:`workflow_builder_guide` to create and refine workflows, then follow :doc:`run_monitoring` to trigger and observe executions.
