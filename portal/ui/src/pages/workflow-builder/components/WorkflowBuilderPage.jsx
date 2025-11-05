import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExecutionViewerModal from "../../../components/ExecutionViewerModal.jsx";
import { useWorkflowRun } from "../../../hooks/useWorkflowRun.js";
import StepEditor from "./StepEditor.jsx";
import StepList from "./StepList.jsx";
import { useWorkflowBuilderForm } from "../hooks/useWorkflowBuilderForm.js";
import { buildPayload, formatApiError, getBuilderContext } from "../utils/workflowBuilder.js";

export default function WorkflowBuilderPage() {
  const { workflowId } = useMemo(() => getBuilderContext(window.location.pathname), []);
  const {
    workflowState,
    runState,
    wsStatus,
    eventLog,
    screenshot,
    currentStepIndex,
    handleRun,
  } = useWorkflowRun(workflowId);

  const {
    form,
    selectedIndex,
    selectedStep,
    handleMetaChange,
    handleStartChange,
    handleAddStep,
    handleRemoveStep,
    handleSelectStep,
    handleStepChange,
    syncFromWorkflow,
  } = useWorkflowBuilderForm(workflowState.data);

  const [saveState, setSaveState] = useState({ status: "idle", error: "" });
  const [isViewerOpen, setViewerOpen] = useState(false);

  const onRun = useCallback(async () => {
    if (!workflowId) return;
    setViewerOpen(true);
    const result = await handleRun();
    if (!result?.ok) {
      setViewerOpen(false);
    }
  }, [handleRun, workflowId]);

  const handleSave = useCallback(async () => {
    setSaveState({ status: "saving", error: "" });
    try {
      const payload = buildPayload(form);
      const isEdit = Number.isInteger(workflowId);
      const url = isEdit ? `/api/workflows/${workflowId}` : "/api/workflows";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorPayload = await res.json().catch(() => ({}));
        throw new Error(formatApiError(errorPayload));
      }
      const responsePayload = await res.json();
      const saved = responsePayload?.data;
      if (saved) {
        syncFromWorkflow(saved, { preserveSelection: true, force: true });
      }
      setSaveState({ status: "idle", error: "" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setSaveState({ status: "error", error: message });
    }
  }, [form, workflowId, syncFromWorkflow]);

  const isLoading = workflowState.loading && !workflowState.data;
  const loadError = workflowState.error;
  const runError = runState.error;
  const viewerSteps = useMemo(() => form.steps, [form.steps]);

  if (!workflowId) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">Invalid workflow path. Please return to the list.</Alert>
      </Container>
    );
  }

  if (isLoading) {
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

  if (loadError && !workflowState.data) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">{loadError}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h5">{form.title || "Untitled workflow"}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {workflowId} / Slug: {form.slug || "-"}
                </Typography>
              </Box>
              <Stack spacing={1} alignItems="flex-end">
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={onRun}
                    disabled={runState.status === "starting" || runState.status === "queued"}
                  >
                    Run workflow
                  </Button>
                  <Button variant="outlined" onClick={() => setViewerOpen(true)} size="small">
                    Open viewer
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saveState.status === "saving"}
                  >
                    {saveState.status === "saving" ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outlined" component="a" href="/workflows" size="small">
                    Back
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  WS: {wsStatus} / Status: {runState.status}
                </Typography>
              </Stack>
            </Stack>
            {saveState.status === "error" ? <Alert severity="error">{saveState.error}</Alert> : null}
            {runError ? <Alert severity="error">{runError}</Alert> : null}
            {loadError && workflowState.data ? <Alert severity="warning">{loadError}</Alert> : null}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Slug"
                value={form.slug}
                onChange={handleMetaChange("slug")}
                required
                fullWidth
              />
              <TextField
                label="Title"
                value={form.title}
                onChange={handleMetaChange("title")}
                required
                fullWidth
              />
            </Stack>
            <TextField
              label="Description"
              value={form.description}
              onChange={handleMetaChange("description")}
              multiline
              minRows={2}
              fullWidth
            />
            <TextField
              select
              label="Start step"
              value={form.startStepId}
              onChange={handleStartChange}
              helperText="Optional. Leave empty to start from the first step."
              fullWidth
            >
              <MenuItem value="">
                <em>Auto (first step)</em>
              </MenuItem>
              {form.steps.map((step) => (
                <MenuItem key={step.stepKey} value={step.stepKey}>
                  {step.stepKey}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Steps</Typography>
            <Divider />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
              <StepList
                steps={form.steps}
                selectedIndex={selectedIndex}
                activeIndex={currentStepIndex}
                onSelect={handleSelectStep}
                onAdd={handleAddStep}
                onRemove={handleRemoveStep}
              />
              <StepEditor
                step={selectedStep}
                onChange={(updates) => handleStepChange(selectedIndex, updates)}
              />
            </Stack>
          </Stack>
        </Paper>

        <ExecutionViewerModal
          open={isViewerOpen}
          onClose={() => setViewerOpen(false)}
          screenshot={screenshot}
          eventLog={eventLog}
          wsStatus={wsStatus}
          runState={runState}
          steps={viewerSteps}
          currentStepIndex={currentStepIndex}
        />
      </Stack>
    </Container>
  );
}
