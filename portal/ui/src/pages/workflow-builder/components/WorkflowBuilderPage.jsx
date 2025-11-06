import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExecutionViewerModal from "../../../components/ExecutionViewerModal.jsx";
import { useWorkflowRun } from "../../../hooks/useWorkflowRun.js";
import StepEditor from "./StepEditor.jsx";
import WorkflowCanvas from "./WorkflowCanvas.jsx";
import { useWorkflowBuilderForm } from "../hooks/useWorkflowBuilderForm.js";
import { getBuilderContext } from "../utils/workflowBuilder.js";

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
    reloadWorkflow,
  } = useWorkflowRun(workflowId);

  const {
    form,
    selectedIndex,
    selectedStep,
    handleAddStep,
    handleRemoveStep,
    handleSelectStep,
    handleStepChange,
    syncFromWorkflow,
  } = useWorkflowBuilderForm(workflowState.data);
  const [isViewerOpen, setViewerOpen] = useState(false);
  const [isEditorOpen, setEditorOpen] = useState(false);

  const onRun = useCallback(async () => {
    if (!workflowId) return;
    setViewerOpen(true);
    const result = await handleRun();
    if (!result?.ok) {
      setViewerOpen(false);
    }
  }, [handleRun, workflowId]);

  const isLoading = workflowState.loading && !workflowState.data;
  const loadError = workflowState.error;
  const runError = runState.error;
  const viewerSteps = useMemo(() => form.steps, [form.steps]);
  const selectedStepKey = selectedStep?.stepKey ?? "";
  const activeStepKey = typeof currentStepIndex === "number"
    ? form.steps[currentStepIndex]?.stepKey ?? ""
    : "";
  const canDeleteStep = selectedIndex >= 0 && form.steps.length > 1;

  const openEditorForIndex = useCallback((index) => {
    if (typeof index === "number" && index >= 0) {
      handleSelectStep(index);
      setEditorOpen(true);
    }
  }, [handleSelectStep]);

  const handleDeleteSelectedStep = useCallback(() => {
    if (selectedIndex >= 0) {
      handleRemoveStep(selectedIndex);
      setEditorOpen(false);
    }
  }, [handleRemoveStep, selectedIndex]);

  const handleAddStepAndEdit = useCallback(() => {
    handleAddStep();
    setTimeout(() => setEditorOpen(true), 0);
  }, [handleAddStep]);

  const handleRefreshWorkflow = useCallback(() => {
    reloadWorkflow().then((result) => {
      if (result?.ok && result.data) {
        syncFromWorkflow(result.data, { preserveSelection: true, force: true });
      }
    });
  }, [reloadWorkflow, syncFromWorkflow]);

  if (!workflowId) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
        }}
      >
        <Alert severity="error">Invalid workflow path. Please return to the list.</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (loadError && !workflowState.data) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
        }}
      >
        <Alert severity="error">{loadError}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <WorkflowCanvas
        steps={form.steps}
        selectedStepKey={selectedStepKey}
        activeStepKey={activeStepKey}
        startStepId={form.startStepId}
        onSelectStep={openEditorForIndex}
      />

      <Box
        sx={{
          position: "absolute",
          top: { xs: 12, md: 20 },
          left: { xs: 12, md: 20 },
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <Paper
          elevation={5}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            pointerEvents: "auto",
            minWidth: 280,
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="h6" noWrap>
                {form.title || "Untitled workflow"}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                #{workflowId}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" noWrap>
              Slug: {form.slug || "-"} · Steps: {form.steps.length} · Start: {form.startStepId || (form.steps[0]?.stepKey ?? "-")}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              WS: {wsStatus} · Run status: {runState.status}
            </Typography>
            {(runError || (loadError && workflowState.data)) ? (
              <Stack spacing={0.5}>
                {runError ? <Alert severity="error" variant="filled">{runError}</Alert> : null}
                {loadError && workflowState.data ? <Alert severity="warning" variant="filled">{loadError}</Alert> : null}
              </Stack>
            ) : null}
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={handleRefreshWorkflow}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button variant="contained" size="small" onClick={handleAddStepAndEdit}>
                New step
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="secondary"
                onClick={onRun}
                disabled={runState.status === "starting" || runState.status === "queued"}
              >
                Run
              </Button>
              <Button variant="outlined" size="small" onClick={() => setViewerOpen(true)}>
                Viewer
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>

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
      <StepEditor
        open={isEditorOpen}
        step={selectedStep}
        onChange={(updates) => handleStepChange(selectedIndex, updates)}
        onDelete={handleDeleteSelectedStep}
        canDelete={canDeleteStep}
        onClose={() => setEditorOpen(false)}
      />
    </Box>
  );
}
