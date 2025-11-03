Event Payloads
==============

Portal and crawler exchange the following events over the WebSocket and internal HTTP channels.  
All events include ``runId`` and ``ts`` (timestamp assigned by the crawler).

Run Status
----------

``run_status``
  - ``status``: ``running`` / ``succeeded`` / ``failed``
  - ``error`` (optional): error message

``done``
  - ``ok``: boolean
  - ``error`` (optional)

Step Events
-----------

``step_start``
  - ``index``: zero-based step index
  - ``meta``: optional metadata

``step_end``
  - ``index``: step index
  - ``ok``: boolean
  - ``error`` (optional)
  - ``meta`` (optional)

Screenshots
-----------

``screenshot``
  - ``image``: ``data:image/png;base64,...`` payload

Logs
----

``log``
  - ``message``: text content
  - ``level``: defaults to ``info``
  - ``target``: destination tag (defaults to ``browgent``)
