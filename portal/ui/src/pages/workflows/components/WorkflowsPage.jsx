import { useEffect, useState } from "react";
import {
  Alert,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
  Divider,
  Button,
} from "@mui/material";

const initialState = { loading: true, data: [], error: "" };

export default function WorkflowsPage() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setState(initialState);
      try {
        const res = await fetch("/api/workflows", { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load workflows");
        const payload = await res.json();
        const rows = Array.isArray(payload.data) ? payload.data : [];
        setState({ loading: false, data: rows, error: "" });
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Unknown error";
        setState({ loading: false, data: [], error: message });
      }
    };
    load();
    return () => controller.abort();
  }, []);

  if (state.loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Workflows</Typography>
          <Typography variant="body2" color="text.secondary">
            Select a workflow to view details and run the automation.
          </Typography>
          {state.error ? <Alert severity="error">{state.error}</Alert> : null}
          <Divider />
          {state.data.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No workflows have been registered yet.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {state.data.map((workflow) => (
                <Paper
                  key={workflow.id}
                  variant="outlined"
                  sx={{ p: 2, cursor: "pointer", "&:hover": { boxShadow: 4 } }}
                  onClick={() => {
                    window.location.href = `/workflow/${workflow.id}`;
                  }}
                >
                  <Stack spacing={1}>
                    <Typography variant="h6">{workflow.title || workflow.slug}</Typography>
                    {workflow.description ? (
                      <Typography variant="body2" color="text.secondary">
                        {workflow.description}
                      </Typography>
                    ) : null}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Updated: {workflow.updatedAt}
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(event) => {
                          event.stopPropagation();
                          window.location.href = `/workflow/${workflow.id}`;
                        }}
                      >
                        View details
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
