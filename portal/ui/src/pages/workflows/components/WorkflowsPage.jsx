import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
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
          const details = error.data && typeof error.data === "object"
            ? (error.data.error || error.data.message)
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <CircularProgress size={24} />
          <Typography>
            Loading...
          </Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography>Workflows</Typography>
          <Typography>
            Select a workflow to view details and run the automation.
          </Typography>
          <Button variant="contained" onClick={handleCreate} sx={{ alignSelf: "flex-start", mt: 1 }}>
            Create workflow
          </Button>
        </Stack>
        {state.error ? <Alert severity="error">{state.error}</Alert> : null}
        {state.data.length === 0 ? (
          <Typography>
            No workflows have been registered yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {state.data.map((workflow) => (
              <Paper
                key={workflow.id}
                variant="outlined"
                onClick={() => {
                  const target = String(workflow.id);
                  window.location.href = `/workflow/${encodeURIComponent(target)}`;
                }}
              >
                <Box padding={2}>
                  <Stack spacing={1}>
                    <Typography>{workflow.title || workflow.id}</Typography>
                    {workflow.description ? (
                      <Typography>
                        {workflow.description}
                      </Typography>
                    ) : null}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography>
                        Updated: {workflow.updatedAt}
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(event) => {
                          event.stopPropagation();
                          const target = String(workflow.id);
                          window.location.href = `/workflow/${encodeURIComponent(target)}`;
                        }}
                      >
                        View details
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
