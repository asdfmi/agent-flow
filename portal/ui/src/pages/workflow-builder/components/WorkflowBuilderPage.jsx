import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import ExecutionViewerModal from "../../../components/ExecutionViewerModal.jsx";
import { useWorkflowRun } from "../../../hooks/useWorkflowRun.js";
import NodeDetailPanel from "./NodeDetailPanel.jsx";
import WorkflowRunHistory from "./WorkflowRunHistory.jsx";
import { useWorkflowBuilderForm } from "../hooks/useWorkflowBuilderForm.js";
import { buildPayload, formatApiError, getBuilderContext } from "../utils/workflowBuilder.js";
import GraphViewport from "./GraphViewport.jsx";
import { HttpError } from "../../../api/client.js";
import {
  createWorkflow as createWorkflowApi,
  listWorkflowRuns,
  updateWorkflow as updateWorkflowApi,
} from "../../../api/workflows.js";

export default function WorkflowBuilderPage() {
  const builderContext = useMemo(() => getBuilderContext(window.location.pathname), []);
  const [workflowId, setWorkflowId] = useState(builderContext.workflowId ?? null);
  const isNewWorkflow = !workflowId;
  const {
    workflowState,
    runState,
    wsStatus,
    eventLog,
    screenshot,
    currentStepIndex,
    handleRun,
    reloadWorkflow,
  } = useWorkflowRun(workflowId, { enabled: Boolean(workflowId) });

  const {
    form,
    selectedIndex,
    selectedNode,
    handleMetaChange,
    handleStartChange,
    handleAddNode,
    handleRemoveNode,
    handleNodeChange,
    replaceEdgesForNode,
    syncFromWorkflow,
    graphCore,
  } = useWorkflowBuilderForm(workflowState.data);
  const [isViewerOpen, setViewerOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [runsState, setRunsState] = useState({ loading: true, data: [], error: "" });
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const hydratingRef = useRef(true);
  const latestFormRef = useRef(form);
  const lastSavedSnapshotRef = useRef(JSON.stringify(form));

  const isLoading = workflowState.loading && !workflowState.data;
  const loadError = workflowState.error;
  const runError = runState.error;
  const viewerNodes = useMemo(() => form.nodes, [form.nodes]);
  const canDeleteNode = selectedIndex >= 0 && form.nodes.length > 1;

  const metaTitleChange = handleMetaChange("title");
  const metaDescriptionChange = handleMetaChange("description");

  const applyWorkflowData = useCallback((data, options = {}) => {
    if (!data) return;
    hydratingRef.current = true;
    syncFromWorkflow(data, { preserveSelection: true, force: true, ...options });
  }, [syncFromWorkflow]);

  const persistWorkflow = useCallback(async (formOverride, { silent = false } = {}) => {
    const targetForm = formOverride ?? latestFormRef.current;
    if (!targetForm) return false;
    setSaving(true);
    if (!silent) setSaveError("");
    try {
      const payload = buildPayload(targetForm);
      if (!workflowId) {
        const response = await createWorkflowApi(payload);
        const workflowData = response?.data;
        if (workflowData?.id) {
          setWorkflowId(workflowData.id);
          window.history.replaceState(
            null,
            "",
            `/workflow/${encodeURIComponent(String(workflowData.id))}`,
          );
        }
        if (workflowData) {
          applyWorkflowData(workflowData);
          setSaveError("");
          lastSavedSnapshotRef.current = JSON.stringify(targetForm);
          latestFormRef.current = targetForm;
          setHasPendingChanges(false);
          return true;
        }
        throw new Error("Failed to create workflow");
      }
      const response = await updateWorkflowApi(workflowId, payload);
      const workflowData = response?.data;
      if (workflowData) {
        applyWorkflowData(workflowData);
        setSaveError("");
        lastSavedSnapshotRef.current = JSON.stringify(targetForm);
        latestFormRef.current = targetForm;
        setHasPendingChanges(false);
        return true;
      }
      const refreshed = await reloadWorkflow();
      if (refreshed?.ok && refreshed.data) {
        applyWorkflowData(refreshed.data);
        setSaveError("");
        lastSavedSnapshotRef.current = JSON.stringify(targetForm);
        latestFormRef.current = targetForm;
        setHasPendingChanges(false);
        return true;
      }
      const fallbackError = refreshed?.error || "Failed to refresh workflow";
      setSaveError(fallbackError);
      return false;
    } catch (error) {
      if (error instanceof HttpError) {
        const formatted = formatApiError(
          error.data && typeof error.data === "object"
            ? error.data
            : { error: error.message }
        );
        setSaveError(formatted);
      } else {
        const message = error instanceof Error ? error.message : "Failed to save workflow";
        setSaveError(message);
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [workflowId, applyWorkflowData, reloadWorkflow, setSaveError, setSaving]);

  const fetchRuns = useCallback(async ({ signal, silent = false } = {}) => {
    if (!workflowId) {
      setRunsState({ loading: false, data: [], error: "" });
      return;
    }
    if (!silent) {
      setRunsState((prev) => ({ ...prev, loading: true, error: "" }));
    }
    try {
      const payload = await listWorkflowRuns(workflowId, signal ? { signal } : undefined);
      const rows = Array.isArray(payload.data) ? payload.data : [];
      setRunsState({ loading: false, data: rows, error: "" });
    } catch (error) {
      if (signal?.aborted) return;
      const message =
        error instanceof Error ? error.message : "Failed to load workflow runs";
      setRunsState({ loading: false, data: [], error: message });
    }
  }, [workflowId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchRuns({ signal: controller.signal, silent: false });
    return () => controller.abort();
  }, [fetchRuns]);

  const handleDeleteSelectedNode = useCallback(async () => {
    if (selectedIndex < 0) return;
    const node = form.nodes[selectedIndex];
    const label = node?.label || node?.nodeKey || `node ${selectedIndex + 1}`;
    if (!window.confirm(`Delete ${label}?`)) return;
    const nextForm = handleRemoveNode(selectedIndex);
    if (!nextForm) return;
    latestFormRef.current = nextForm;
    await persistWorkflow(nextForm);
  }, [form.nodes, handleRemoveNode, persistWorkflow, selectedIndex]);

  const handleAddNodeAndEdit = useCallback(() => {
    const nextForm = handleAddNode();
    if (nextForm) {
      latestFormRef.current = nextForm;
    }
    setSaveError("");
  }, [handleAddNode]);

  const handleNodePartialChange = useCallback((updates) => {
    if (selectedIndex < 0) return;
    setSaveError("");
    const nextForm = handleNodeChange(selectedIndex, updates);
    if (nextForm) {
      latestFormRef.current = nextForm;
    }
  }, [selectedIndex, handleNodeChange]);

  const handleRefreshWorkflow = useCallback(() => {
    if (!workflowId) return;
    reloadWorkflow().then((result) => {
      if (result?.ok && result.data) {
        applyWorkflowData(result.data, { preserveSelection: true, force: true });
      }
    });
  }, [workflowId, reloadWorkflow, applyWorkflowData]);

  useEffect(() => {
    latestFormRef.current = form;
    if (hydratingRef.current) {
      lastSavedSnapshotRef.current = JSON.stringify(form);
      setHasPendingChanges(false);
      hydratingRef.current = false;
    } else {
      const snapshotString = JSON.stringify(form);
      setHasPendingChanges(snapshotString !== lastSavedSnapshotRef.current);
    }
  }, [form]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasPendingChanges || isSaving) {
        event.preventDefault();
        event.returnValue = "Changes you made may not be saved.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasPendingChanges, isSaving]);

  const onRun = useCallback(async () => {
    if (!workflowId) return;
    setViewerOpen(true);
    const result = await handleRun();
    if (!result?.ok) {
      setViewerOpen(false);
    }
    fetchRuns({ silent: true });
  }, [handleRun, workflowId, fetchRuns]);

  const selectedNodeKey = selectedNode?.nodeKey ?? "";
  const nodeEdges = useMemo(() => {
    if (!selectedNodeKey) return [];
    return form.edges.filter((edge) => edge.sourceKey === selectedNodeKey);
  }, [form.edges, selectedNodeKey]);

  const handleNodeEdgesChange = useCallback((nextEdges) => {
    if (!selectedNodeKey) return;
    setSaveError("");
    const nextForm = replaceEdgesForNode(selectedNodeKey, () => nextEdges);
    if (nextForm) {
      latestFormRef.current = nextForm;
    }
  }, [replaceEdgesForNode, selectedNodeKey]);

  const handleRefreshRuns = useCallback(() => {
    fetchRuns({});
  }, [fetchRuns]);

  useEffect(() => {
    if (workflowState.data) {
      hydratingRef.current = true;
    }
  }, [workflowState.data]);

  const handleSave = useCallback(async () => {
    if (!hasPendingChanges) return;
    await persistWorkflow();
  }, [hasPendingChanges, persistWorkflow]);

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
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <GraphViewport graphCore={graphCore} height={420} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "flex-end" }} justifyContent="space-between">
              <TextField
                label="Workflow title"
                value={form.title}
                onChange={(event) => {
                  setSaveError("");
                  metaTitleChange(event);
                }}
                fullWidth
              />
              <Stack direction="row" spacing={1} flexShrink={0}>
                <Button variant="contained" onClick={handleSave} disabled={isSaving || !hasPendingChanges}>
                  Save
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={onRun}
                  disabled={!workflowId || runState.status === "starting" || runState.status === "queued"}
                >
                  Run
                </Button>
                <Button variant="outlined" onClick={() => setViewerOpen(true)} disabled={!workflowId}>
                  Viewer
                </Button>
              </Stack>
            </Stack>
            <TextField
              label="Description"
              value={form.description}
              onChange={(event) => {
                setSaveError("");
                metaDescriptionChange(event);
              }}
              multiline
              minRows={2}
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
              <TextField
                select
                label="Start node"
                value={form.startNodeId}
                onChange={(event) => {
                  setSaveError("");
                  handleStartChange(event);
                }}
                fullWidth
              >
                {form.nodes.map((node) => (
                  <MenuItem key={node.nodeKey} value={node.nodeKey}>
                    {node.label || node.nodeKey}
                  </MenuItem>
                ))}
                {form.nodes.length === 0 ? <MenuItem value="">No nodes</MenuItem> : null}
              </TextField>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="contained" color="success" onClick={handleAddNodeAndEdit}>
                  Add node
                </Button>
                <Button variant="outlined" color="error" onClick={handleDeleteSelectedNode} disabled={!canDeleteNode}>
                  Delete node
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    handleRefreshWorkflow();
                    handleRefreshRuns();
                  }}
                  disabled={!workflowId}
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={`Run: ${runState.status}`}
                color={
                  runState.status === "running"
                    ? "success"
                    : runState.status === "failed"
                      ? "error"
                      : runState.status === "queued" || runState.status === "starting"
                        ? "warning"
                        : "default"
                }
                size="small"
              />
              <Chip
                label={`WS: ${wsStatus}`}
                color={wsStatus === "open" ? "success" : wsStatus === "error" ? "error" : "default"}
                size="small"
              />
              <Chip label={`Nodes: ${form.nodes.length}`} size="small" />
              {hasPendingChanges ? <Chip label="Unsaved" color="warning" size="small" /> : null}
            </Stack>
            {isNewWorkflow ? (
              <Alert severity="info" variant="outlined">
                This workflow is not saved yet. Add nodes and press Save to create it.
              </Alert>
            ) : null}
            {(runError || saveError || (loadError && workflowState.data)) ? (
              <Stack spacing={1}>
                {runError ? <Alert severity="error" variant="outlined">{runError}</Alert> : null}
                {saveError ? (
                  <Alert severity="error" variant="outlined">
                    {saveError.split(/\n+/).map((line, index) => (
                      <Typography key={`${line}-${index}`} component="div" variant="body2">
                        {line}
                      </Typography>
                    ))}
                  </Alert>
                ) : null}
                {loadError && workflowState.data ? <Alert severity="warning" variant="outlined">{loadError}</Alert> : null}
              </Stack>
            ) : null}
          </Stack>
        </Paper>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
          <Paper variant="outlined" sx={{ flex: 1, p: 2 }}>
            <NodeDetailPanel
              node={selectedNode}
              edges={nodeEdges}
              allEdges={form.edges}
              onNodeChange={handleNodePartialChange}
              onEdgesChange={handleNodeEdgesChange}
              onDelete={handleDeleteSelectedNode}
              canDelete={canDeleteNode}
              saving={isSaving}
              error={saveError}
            />
          </Paper>
          <Paper variant="outlined" sx={{ flexBasis: 360, p: 2 }}>
            <WorkflowRunHistory
              runs={runsState.data}
              loading={runsState.loading}
              error={runsState.error}
              onRefresh={handleRefreshRuns}
            />
          </Paper>
        </Stack>
      </Stack>

      <ExecutionViewerModal
        open={isViewerOpen}
        onClose={() => setViewerOpen(false)}
        screenshot={screenshot}
        eventLog={eventLog}
        wsStatus={wsStatus}
        runState={runState}
        nodes={viewerNodes}
        currentStepIndex={currentStepIndex}
      />
    </Box>
  );
}
