Workflow Builder Guide
======================

Prerequisites
-------------
- Portal running locally at ``http://localhost:3000`` (``pnpm run dev``).
- A workflow entry created via **Create workflow** on the dashboard (automatically seeds an empty draft).
- Basic familiarity with browser automation concepts (navigation, selectors, waits).

Layout Tour
-----------
- **Toolbar** – Contains *Run workflow*, *Save*, *Add node*, and *Refresh* controls.
- **Canvas** – Shows the node sequence using cards. The selected node is outlined; the currently running node is highlighted in blue during execution.
- **Sidebar** – Lists metadata such as workflow title, slug, and description (editable inline).
- **Node drawer** – Opens when you click *Edit* or double-click a node; this is where you configure action-specific fields and transitions.

Adding Nodes
------------
1. Click **Add node**. A placeholder node is appended after the current selection.
2. Open the node editor and set a unique ``nodeKey``. Keys act as identifiers for edges and conditional routing.
3. Select a ``type``:
   - ``navigate`` – Load a URL and optionally wait for a selector.
   - ``click`` – Click a selector on the page.
   - ``fill`` – Type into an input identified by selector.
   - ``press`` – Send keyboard shortcuts (e.g. ``Enter`` or ``Control+S``).
   - ``scroll`` – Scroll by pixels or until an element is visible.
   - ``wait`` – Delay for a fixed duration or until a selector appears.
   - ``log`` – Append a readable message to the event stream.
   - ``script`` – Execute custom JavaScript in the page context.
   - ``extract_text`` – Capture text content and expose it as a metric.
4. Fill the configuration form presented for the selected type. Required fields are marked in the UI.
5. Configure transitions:
   - Set **Default next node** to declare the fallback edge when no conditions match.
   - Add one or more **Conditional edges** with selectors, delays, or scripts to branch the flow.
6. Save the node. The workflow persists immediately if the update succeeds.

Configuring Success Conditions
------------------------------
For action nodes you can declare a success policy under **Success conditions**:
- ``none`` – No extra check; the step completes when the handler is finished.
- ``selector`` – Wait until a CSS selector matches an element.
- ``text`` – Wait until the page contains the provided substring.
- ``expression`` – Execute JavaScript that returns a truthy value to mark the step successful.
Success checks run after the handler unless the handler reports completion via ``handled: true``.

Organising Complex Flows
------------------------
- Use descriptive labels and consistent ``nodeKey`` names (e.g. ``open_login``, ``submit_form``).
- Combine conditional edges with counter/script nodes to express branches or loops without duplicating sequences.
- Record outcomes with ``log`` or ``extract_text`` nodes to provide traceability and metrics for downstream analysis.
- Keep loops finite: track counters or timers in script nodes and add conditional edges that eventually fall back to a default path.

Saving and Versioning
---------------------
- The **Save** button writes the entire workflow to the portal. Multiple operators editing simultaneously should use **Refresh** to pull the latest version.
- Each save updates the ``updatedAt`` timestamp visible on the workflow dashboard and in the admin tables.
- Consider exporting workflows via the API (`GET /api/workflows/:id`) for archival or Git-based version control.

Next Steps
----------
- Launch a run by pressing **Run workflow** and switch to the :doc:`run_monitoring` guide for real-time observability.
- Review the :doc:`api_reference` section to integrate Browgent workflows with external schedulers or CI systems.
