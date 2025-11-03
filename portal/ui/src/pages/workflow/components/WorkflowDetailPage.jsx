import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ExecutionViewerModal from "./ExecutionViewerModal.jsx";
import { useWorkflowRun } from "../../../hooks/useWorkflowRun.js";
import { getStepMeta } from "./stepMeta.js";

const initialViewState = { loading: true, data: null, error: "" };

export default function WorkflowDetailPage() {
  const workflowId = useMemo(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? null;
  }, []);

  const {
    workflowState = initialViewState,
    runState,
    wsStatus,
    eventLog,
    screenshot,
    currentStepIndex,
    handleRun,
  } = useWorkflowRun(workflowId);
  const [isViewerOpen, setViewerOpen] = useState(false);

  if (workflowState.loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (workflowState.error || !workflowState.data) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">{workflowState.error || "Failed to load workflow"}</Alert>
      </Container>
    );
  }

  const workflow = workflowState.data;

  const onRun = async () => {
    setViewerOpen(true);
    const result = await handleRun();
    if (!result?.ok) {
      setViewerOpen(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h5">{workflow.title || workflow.slug}</Typography>
                {workflow.description ? (
                  <Typography variant="body2" color="text.secondary">
                    {workflow.description}
                  </Typography>
                ) : null}
              </Box>
              <Stack spacing={1} alignItems="flex-end">
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={onRun} disabled={runState.status === "starting" || runState.status === "queued"}>
                    Run workflow
                  </Button>
                  <Button variant="outlined" onClick={() => setViewerOpen(true)} size="small">
                    Open viewer
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  WS: {wsStatus} / Status: {runState.status}
                </Typography>
              </Stack>
            </Stack>
            {runState.error ? <Alert severity="error">{runState.error}</Alert> : null}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Steps</Typography>
            <Divider />
            {(workflow.steps || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No steps registered.
              </Typography>
            ) : (
              <Stack
                direction="row"
                spacing={2}
                sx={{ overflowX: "auto", pb: 1 }}
              >
                {workflow.steps.map((step, index) => (
                  <StepCard key={step.id} step={step} index={index} />
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>

        <ExecutionViewerModal
          open={isViewerOpen}
          onClose={() => setViewerOpen(false)}
          screenshot={screenshot}
          eventLog={eventLog}
          runState={runState}
          wsStatus={wsStatus}
          steps={workflow.steps || []}
          currentStepIndex={currentStepIndex}
        />
      </Stack>
    </Container>
  );
}

function StepCard({ step, index }) {
  const { config = {}, successConfig = {} } = step;
  const meta = getStepMeta(step.type);
  const chipColor = meta.color === "default" ? undefined : meta.color;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        minWidth: 260,
        borderTop: 4,
        borderTopColor: (theme) =>
          chipColor ? theme.palette[chipColor].main : theme.palette.divider,
        backgroundColor: (theme) =>
          chipColor ? alpha(theme.palette[chipColor].main, 0.06) : theme.palette.background.paper,
      }}
    >
      <Stack spacing={1.5}>
        <Stack spacing={0.25}>
          <Typography variant="caption" color="text.secondary">
            Step {index + 1}
          </Typography>
          <Typography variant="subtitle1">{step.label || meta.label}</Typography>
        </Stack>
        <Chip label={meta.label} color={chipColor} size="small" variant={chipColor ? "filled" : "outlined"} sx={{ alignSelf: "flex-start" }} />
        <DetailBlock title="Configuration" data={config} />
        {successConfig && Object.keys(successConfig).length > 0 ? (
          <DetailBlock title="Success" data={successConfig} />
        ) : null}
      </Stack>
    </Paper>
  );
}

function DetailBlock({ title, data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          None
        </Typography>
      </Stack>
    );
  }
  return (
    <Stack spacing={0.75}>
      <Typography variant="subtitle2">{title}</Typography>
      <Stack spacing={0.5}>{renderEntries(data)}</Stack>
    </Stack>
  );
}

StepCard.propTypes = {
  step: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    config: PropTypes.object,
    successConfig: PropTypes.object,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

DetailBlock.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.object,
};

function renderEntries(value, depth = 0) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return Object.entries(value).map(([key, val]) => {
    const label = humanizeKey(key);
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return (
        <Stack key={`${depth}-${key}`} spacing={0.5} sx={{ pl: depth ? 2 : 0 }}>
          <Typography variant="body2" fontWeight={600}>
            {label}
          </Typography>
          <Stack spacing={0.25}>{renderEntries(val, depth + 1)}</Stack>
        </Stack>
      );
    }
    return (
      <Stack
        key={`${depth}-${key}`}
        direction="row"
        spacing={1}
        sx={{ pl: depth ? 2 : 0 }}
        alignItems="flex-start"
      >
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 96 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {formatValue(val)}
        </Typography>
      </Stack>
    );
  });
}

function humanizeKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((item) => formatValue(item)).join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}
