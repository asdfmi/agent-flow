Data Model
==========

Workflow
--------

.. list-table::
   :header-rows: 1

   * - Field
     - Type
     - Notes
   * - ``id``
     - Int
     - Auto increment, primary key
   * - ``slug``
     - String
     - Unique workflow identifier
   * - ``title``
     - String
     - Display title
   * - ``description``
     - String?
     - Optional description
   * - ``createdAt``
     - DateTime
     - Creation timestamp
   * - ``updatedAt``
     - DateTime
     - Updated timestamp (auto-maintained by Prisma)
   * - ``startStepId``
     - String?
     - Optional entry point step ID when using pointer-based workflows
   * - ``steps``
     - WorkflowStep[]
     - Related steps
   * - ``runs``
     - WorkflowRun[]
     - Historical executions for analytics/monitoring

WorkflowRun
-----------

.. list-table::
   :header-rows: 1

   * - Field
     - Type
     - Notes
   * - ``id``
     - Int
     - Auto increment, primary key
   * - ``workflowId``
     - Int
     - Owning workflow ID
   * - ``runKey``
     - String
     - External/public run identifier (e.g. UUID)
   * - ``status``
     - WorkflowRunStatus
     - ``queued`` / ``running`` / ``succeeded`` / ``failed`` / ``cancelled``
   * - ``startedAt``
     - DateTime
     - Start timestamp
   * - ``finishedAt``
     - DateTime?
     - Completion timestamp (null while running)
   * - ``errorMessage``
     - String?
     - Optional failure reason summary
   * - ``stats``
     - Json?
     - Aggregated metrics blob for the run (duration, counts, etc.)
   * - ``metrics``
     - WorkflowRunMetric[]
     - Fine-grained metrics captured during the run
   * - ``createdAt`` / ``updatedAt``
     - DateTime
     - Timestamps for auditing

WorkflowRunMetric
-----------------

.. list-table::
   :header-rows: 1

   * - Field
     - Type
     - Notes
   * - ``id``
     - Int
     - Auto increment, primary key
   * - ``runId``
     - Int
     - Owning workflow run ID
   * - ``key``
     - String
     - Metric name (e.g. ``dom_nodes_scanned``)
   * - ``value``
     - Json?
     - Metric payload (number, object, per-browser stats, etc.)
   * - ``createdAt``
     - DateTime
     - Timestamp when captured

WorkflowStep
------------

.. list-table::
   :header-rows: 1

   * - Field
     - Type
     - Notes
   * - ``id``
     - Int
     - Auto increment, primary key
   * - ``workflowId``
     - Int
     - Owning workflow ID
   * - ``stepKey``
     - String
     - Unique identifier within the workflow (used for pointer traversal)
   * - ``nextStepKey``
     - String?
     - Optional pointer to the next step when using pointer-based flows
   * - ``exitStepKey``
     - String?
     - Optional pointer used by ``loop`` steps when exiting the loop
   * - ``type``
     - Enum
     - ``navigate`` / ``wait`` / ``scroll`` / ``click`` / ``fill`` / ``press`` / ``log`` / ``script`` / ``extract_text`` / ``if`` / ``loop``
   * - ``label``
     - String?
     - Optional label
   * - ``config``
     - Json?
     - Step-specific configuration (URL, XPath, input values, etc.). For ``if`` steps this includes ``branches``; for ``loop`` steps this includes settings such as ``times`` or ``condition``.
   * - ``successConfig``
     - Json?
     - Success condition (one of visible / exists / urlIncludes / delay / script)
   * - ``createdAt``
     - DateTime
     - Creation timestamp
   * - ``updatedAt``
     - DateTime
     - Updated timestamp

 Step Types Summary
 ------------------

- **navigate**: Provide ``url`` and optional ``waitUntil`` to navigate.
- **wait**: Delay-only step, typically via ``success.delay``.
- **scroll**: Scroll by ``dx`` / ``dy`` pixels.
- **click**: Requires ``xpath``; supports click options (button, clickCount, delay, timeout).
- **fill**: Fill the element at ``xpath`` with ``value`` (optionally ``clear`` first).
- **press**: Send a key press to ``xpath`` with ``key``.
- **log**: Emit a log message with optional template variables (e.g. ``{{ variables.foo }}``).
- **script**: Execute JavaScript in the page (``code``) and optionally store the result in ``as``.
- **extract_text**: Capture text at ``xpath`` and store it under ``as``.
- **if**: Evaluate ``branches`` sequentially and jump to the first branch whose ``condition`` succeeds (``next`` pointer required).
- **loop**: Maintain counters/conditions for repeated execution; ``next`` is the loop body entry and ``exit`` is the break destination.
