Step Reference
==============

This reference describes every workflow step available in the builder, the fields you can configure, and how Browgent behaves during execution.

Common Fields
-------------
- **Step key** – Unique identifier used for branching. Refer to it from ``Next step key`` or ``Exit step key`` in other steps.
- **Label** – Optional friendly name rendered on the canvas.
- **Next step key** – Overrides the natural order and jumps directly to another step after completion.
- **Exit step key** – Used by ``loop`` steps to decide where to continue when the loop terminates.
- **Success conditions** – Optional guard that waits for an element, text, URL substring, delay, or custom script before the step finishes. Without a success condition Browgent trusts the handler's completion.

Step Types
----------

Navigate
^^^^^^^^
Purpose: Load a new page and wait for the chosen lifecycle event.

Configuration:

- ``url`` (required) – Absolute or relative URL to open.
- ``waitUntil`` (optional) – Playwright event to await. Supports ``load`` (default), ``domcontentloaded``, ``networkidle``, ``commit``.

Wait
^^^^
Purpose: Pause the workflow or wait for a success condition.

- No additional configuration fields.
- Without a success condition the step simply sleeps for ~1 second.
- Combine with success types (e.g. *Element visible*) to wait until the page reaches a specific state.

Scroll
^^^^^^
Purpose: Scroll the page by a fixed number of pixels.

Configuration:

- ``dx`` – Horizontal offset in pixels. Positive values scroll right, negative scroll left.
- ``dy`` – Vertical offset in pixels. Positive values scroll down, negative scroll up. Defaults to ``600``.

Click
^^^^^
Purpose: Click an element located by XPath.

Configuration:

- ``xpath`` (required) – XPath selector for the target element.
- ``button`` (optional) – Mouse button (`left` default, also `right` or `middle`).
- ``clickCount`` (optional) – Number of clicks for the gesture (e.g. set to ``2`` for double-click).
- ``delay`` (optional) – Pause between press and release in seconds. Enter fractional values like ``0.2`` for 200 ms.
- ``timeout`` (optional) – Maximum wait (seconds) for the element to be interactable. Defaults to 5 s.

Fill
^^^^
Purpose: Type text into an input.

Configuration:

- ``xpath`` (required) – XPath selector for the input element.
- ``value`` (required) – String to type.
- ``clear`` – Enable to clear the field before typing. Helpful for inputs with pre-filled content.

Press
^^^^^
Purpose: Trigger keyboard shortcuts on an element.

Configuration:

- ``xpath`` (required) – XPath selector that receives focus before the keypress.
- ``key`` (required) – Playwright key descriptor (e.g. ``Enter``, ``Control+S``).
- ``delay`` (optional) – Delay between keydown and keyup in seconds.

Log
^^^
Purpose: Emit a message to the run log (and optionally downstream systems).

Configuration:

- ``target`` – Logical sink for the log entry. Defaults to ``browgent`` but can be any string.
- ``level`` – Severity (`info`, `warn`, `error`).
- ``message`` (required) – Log text. Supports variable templating via ``{{ variables.someKey }}`` to interpolate values saved earlier in the run.

Script
^^^^^^
Purpose: Execute custom JavaScript within the current page context.

Configuration:

- ``code`` (required) – JavaScript snippet. Receives a ``variables`` object mirroring the execution context.
- ``as`` (optional) – Stores the return value as a workflow variable for later steps.

Extract Text
^^^^^^^^^^^^
Purpose: Read text content from the page and store it for metrics or later use.

Configuration:

- ``xpath`` (required) – XPath selector for the element whose text you need.
- ``as`` (required) – Variable name that receives the extracted string. Accessible via ``{{ variables.<name> }}``.
- The step waits up to 5 seconds for the element to appear before failing.

If
^^
Purpose: Branch to different steps based on the page state.

Configuration:

- ``branches`` – Each branch defines:

  - ``Next step key`` – Destination step when the condition passes.
  - ``Condition type`` – Choose between:
    - **Element visible** – Wait for the XPath to be visible.
    - **Element exists** – Require the XPath to exist in the DOM.
    - **URL contains string** – Check the browser URL for a substring.

Branches are evaluated in order; the first condition that passes wins. At least one branch is required.

Loop
^^^^
Purpose: Repeat a section of the workflow a fixed number of times or until a condition fails.

Configuration:

- ``times`` – Maximum number of iterations. Must be greater than 0.
- Use the standard fields:
  - ``Next step key`` – First step inside the loop body.
  - ``Exit step key`` – Step to jump to once the loop completes.
- (Advanced) When combined with success conditions the loop can also break based on element state.

Success Conditions
------------------
- **Delay (seconds)** – Waits for the given number of seconds before marking the step complete.
- **Element visible / Element exists** – Accepts an XPath and polls until the selector is visible or attached. Times out after the configured ``timeout`` (defaults to 5 s).
- **URL contains string** – Pauses until ``window.location.href`` contains the provided substring.
- **Script** – Runs custom JavaScript repeatedly until it returns a truthy value. Use this for complex checks (e.g. verifying request counts).

Variables and Metrics
---------------------
- ``extract_text`` and ``script`` steps can populate workflow variables. Logs and downstream steps can reference them via ``{{ variables.yourKey }}``.
- Metrics captured during a run appear under **Admin → Workflow run metrics** for historical analysis.
