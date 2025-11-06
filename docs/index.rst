Browgent Documentation
======================

Discover how Browgent orchestrates browser automation, from the architecture and data model to the events emitted during each run.

Operator Guides
---------------

.. grid:: 1 2 2 3
   :gutter: 2

   .. grid-item-card:: Operator Overview
      :link: operator_overview
      :link-type: doc
      :class-card: sd-shadow-sm sd-rounded-3

      Learn the UI entry points, core concepts, and terminology used across the portal.

   .. grid-item-card:: Workflow Builder Guide
      :link: workflow_builder_guide
      :link-type: doc
      :class-card: sd-shadow-sm sd-rounded-3

      Create, configure, and organise workflows with advanced success conditions.

   .. grid-item-card:: Monitoring Workflow Runs
      :link: run_monitoring
      :link-type: doc
      :class-card: sd-shadow-sm sd-rounded-3

      Trigger executions, interpret statuses, and inspect run history.

   .. grid-item-card:: Step Reference
      :link: step_reference
      :link-type: doc
      :class-card: sd-shadow-sm sd-rounded-3

      Review every step type, required fields, and success conditions.

Developer Guides
----------------

.. grid:: 1 2 2 3
   :gutter: 2

   .. grid-item-card:: System Overview
      :link: system_overview
      :link-type: doc
      :class-card: sd-shadow-sm sd-rounded-3

      Understand the moving pieces that collaborate to execute workflows end-to-end.

   .. grid-item-card:: Execution Flow
      :link: execution_flow
      :link-type: doc
      :class-card: sd-shadow-sm sd-rounded-3

      Step through how the portal and crawler coordinate during a single workflow run.

   .. grid-item-card:: Data Model
      :link: data_model
      :link-type: doc
      :class-card: sd-shadow-sm sd-rounded-3

      Inspect the persisted entities that define workflows, their steps, and runtime state.

   .. grid-item-card:: API Reference
      :link: api_reference
      :link-type: doc
      :class-card: sd-shadow-sm sd-rounded-3

      Explore REST endpoints and payloads that integrate with Browgent programmatically.

   .. grid-item-card:: Events
      :link: events
      :link-type: doc
      :class-card: sd-shadow-sm sd-rounded-3

      Review the event schema, including success, failure, and progress notifications.

   .. grid-item-card:: Deployment
      :link: deployment
      :link-type: doc
      :class-card: sd-shadow-sm sd-rounded-3

      Learn how to package and deploy Browgent into staging or production environments.

.. toctree::
   :hidden:
   :maxdepth: 1
   :caption: Operator Guides

   operator_overview
   workflow_builder_guide
   run_monitoring
   step_reference

.. toctree::
   :hidden:
   :maxdepth: 1
   :caption: Developer Guides

   system_overview
   execution_flow
   data_model
   api_reference
   events
   deployment
