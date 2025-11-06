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
   * - ``startNodeId``
     - String?
     - Optional entry point node ID when using pointer-based workflows
   * - ``nodes``
     - WorkflowNode[]
     - Related nodes (ordered for default traversal)
   * - ``edges``
     - WorkflowEdge[]
     - Directed transitions between nodes
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

WorkflowNode
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
   * - ``nodeKey``
     - String
     - Unique identifier within the workflow (referenced by edges and the runner)
   * - ``type``
     - Enum
     - ``navigate`` / ``wait`` / ``scroll`` / ``click`` / ``fill`` / ``press`` / ``log`` / ``script`` / ``extract_text``
   * - ``label``
     - String?
     - Optional label shown in the UI
   * - ``config``
     - Json?
     - Node-specific configuration (URL, XPath, input values, etc.)
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
- **wait**: Delay-only node, typically via ``success.delay``.
- **scroll**: Scroll by ``dx`` / ``dy`` pixels.
- **click**: Requires ``xpath``; supports click options (button, clickCount, delay, timeout).
- **fill**: Fill the element at ``xpath`` with ``value`` (optionally ``clear`` first).
- **press**: Send a key press to ``xpath`` with ``key``.
- **log**: Emit a log message with optional template variables (e.g. ``{{ variables.foo }}``).
- **script**: Execute JavaScript in the page (``code``) and optionally store the result in ``as``.
- **extract_text**: Capture text at ``xpath`` and store it under ``as``.

WorkflowEdge
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
   * - ``edgeKey``
     - String
     - Unique per-workflow identifier
   * - ``sourceKey``
     - String
     - Originating node key
   * - ``targetKey``
     - String?
     - Destination node (``null`` terminates execution)
   * - ``label``
     - String?
     - Optional label shown in the UI
   * - ``condition``
     - Json?
     - Evaluated when deciding whether the edge is taken (same schema as success conditions)
   * - ``priority``
     - Int?
     - Lower numbers are evaluated first; the first matching edge is selected
   * - ``metadata``
     - Json?
     - Reserved for future extensions
   * - ``createdAt`` / ``updatedAt``
     - DateTime
     - Timestamps for auditing
