import { useCallback, useEffect, useState } from "react";
import { Alert, Button, CircularProgress, Typography } from "@mui/material";
import { HttpError } from "../../../api/client.js";
import { listWorkflows } from "../../../api/workflows.js";

const initialState = { loading: true, data: [], error: "" };

export default function WorkflowsPage() {
  const [state, setState] = useState(initialState);
  const handleCreate = useCallback(() => {
    window.location.href = "/workflow/new";
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setState(initialState);
      try {
        const payload = await listWorkflows({ signal: controller.signal });
        const rows = Array.isArray(payload.data) ? payload.data : [];
        setState({ loading: false, data: rows, error: "" });
      } catch (error) {
        if (controller.signal.aborted) return;
        let message = "Unknown error";
        if (error instanceof HttpError) {
          const details =
            error.data && typeof error.data === "object"
              ? error.data.error || error.data.message
              : null;
          message = details || error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        setState({ loading: false, data: [], error: message });
      }
    };
    load();
    return () => controller.abort();
  }, []);

  if (state.loading) {
    return (
      <>
        <CircularProgress />
        <Typography>Loading...</Typography>
      </>
    );
  }

  return (
    <>
      <Typography>Workflows</Typography>
      <Typography>
        Select a workflow to view details and run the automation.
      </Typography>
      <Button onClick={handleCreate}>Create workflow</Button>
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.data.length === 0 ? (
        <Typography>No workflows have been registered yet.</Typography>
      ) : (
        <ul>
          {state.data.map((workflow) => (
            <li key={workflow.id}>
              <Typography>{workflow.title || workflow.id}</Typography>
              {workflow.description ? (
                <Typography>{workflow.description}</Typography>
              ) : null}
              <Typography>Updated: {workflow.updatedAt}</Typography>
              <Button
                onClick={() => {
                  const target = String(workflow.id);
                  window.location.href = `/workflow/${encodeURIComponent(target)}`;
                }}
              >
                View details
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
