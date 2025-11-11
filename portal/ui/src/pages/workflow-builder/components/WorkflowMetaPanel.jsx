import PropTypes from "prop-types";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getNodeMeta } from "../../../components/nodeMeta.js";

export default function WorkflowMetaPanel({
  form,
  isSaving,
  hasPendingChanges,
  isNewWorkflow,
  runState,
  wsStatus,
  saveError,
  loadError,
  handleSave,
  onRun,
  onViewer,
  metaTitleChange,
  metaDescriptionChange,
  handleStartChange,
  handleAddNode,
  runsState,
  onRefreshRuns,
}) {
  return (
    <Accordion
      defaultExpanded
      disableGutters
      sx={{
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 4,
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: "action.hover",
          borderBottom: 1,
          borderColor: "divider",
          px: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          Meta Panel
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: "background.paper",
            maxHeight: { xs: "none", lg: "70vh" },
            overflow: "auto",
          }}
        >
          <Stack spacing={2}>
            <Stack spacing={1}>
              <TextField
                label="Workflow title"
                value={form.title}
                onChange={(event) => {
                  metaTitleChange(event);
                }}
              />
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={isSaving || !hasPendingChanges}
                >
                  Save
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={onRun}
                  disabled={runState.disabled}
                >
                  Run
                </Button>
                <Button
                  variant="outlined"
                  onClick={onViewer}
                  disabled={runState.viewerDisabled}
                >
                  Viewer
                </Button>
              </Stack>
            </Stack>

            <TextField
              label="Description"
              value={form.description}
              onChange={(event) => {
                metaDescriptionChange(event);
              }}
              multiline
              minRows={2}
            />

            <Stack spacing={1}>
              <TextField
                select
                label="Start node"
                value={form.startNodeId}
                onChange={(event) => handleStartChange(event)}
              >
                {form.nodes.map((node) => (
                  <MenuItem key={node.nodeKey} value={node.nodeKey}>
                    {node.label || node.nodeKey}
                  </MenuItem>
                ))}
                {form.nodes.length === 0 ? (
                  <MenuItem value="">No nodes</MenuItem>
                ) : null}
              </TextField>
              <Button onClick={handleAddNode}>Add node</Button>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Run: ${runState.status}`} />
              <Chip label={`WS: ${wsStatus}`} />
              <Chip label={`Nodes: ${form.nodes.length}`} />
              {hasPendingChanges ? <Chip label="Unsaved" /> : null}
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              {form.nodes.map((node) => {
                const meta = getNodeMeta(node.type);
                return (
                  <Chip
                    key={node.nodeKey}
                    label={meta.label}
                    color={meta.color}
                    size="small"
                  />
                );
              })}
              {form.nodes.length === 0 ? (
                <Chip label="No nodes" size="small" />
              ) : null}
            </Stack>

            {isNewWorkflow ? (
              <Alert severity="info">
                This workflow is not saved yet. Add nodes and press Save to
                create it.
              </Alert>
            ) : null}

            {runState.error || saveError || loadError ? (
              <Stack spacing={1}>
                {runState.error ? (
                  <Alert severity="error">{runState.error}</Alert>
                ) : null}
                {saveError ? <Alert severity="error">{saveError}</Alert> : null}
                {loadError ? (
                  <Alert severity="warning">{loadError}</Alert>
                ) : null}
              </Stack>
            ) : null}

            {runsState.loading ? (
              <Stack spacing={1}>
                <Typography>Loading runs...</Typography>
              </Stack>
            ) : runsState.error ? (
              <Alert severity="error">{runsState.error}</Alert>
            ) : runsState.data.length === 0 ? (
              <Typography>No runs recorded yet.</Typography>
            ) : (
              <Stack spacing={1}>
                {runsState.data.map((run) => (
                  <Paper key={run.id} variant="outlined" sx={{ p: 1 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">
                        {run.runKey || `Run #${run.id}`}
                      </Typography>
                      <Chip label={run.status} size="small" />
                    </Stack>
                    <Typography variant="caption">
                      Started:{" "}
                      {run.startedAt
                        ? new Date(run.startedAt).toLocaleString()
                        : "-"}
                    </Typography>
                    <Typography variant="caption">
                      Finished:{" "}
                      {run.finishedAt
                        ? new Date(run.finishedAt).toLocaleString()
                        : "—"}
                    </Typography>
                    {run.errorMessage ? (
                      <Typography variant="caption" color="error">
                        {run.errorMessage}
                      </Typography>
                    ) : null}
                  </Paper>
                ))}
                <Button onClick={onRefreshRuns} size="small">
                  Refresh runs
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      </AccordionDetails>
    </Accordion>
  );
}

WorkflowMetaPanel.propTypes = {
  form: PropTypes.object.isRequired,
  isSaving: PropTypes.bool.isRequired,
  hasPendingChanges: PropTypes.bool.isRequired,
  isNewWorkflow: PropTypes.bool.isRequired,
  runState: PropTypes.shape({
    status: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    viewerDisabled: PropTypes.bool,
    error: PropTypes.string,
  }).isRequired,
  wsStatus: PropTypes.string.isRequired,
  saveError: PropTypes.string.isRequired,
  loadError: PropTypes.string.isRequired,
  handleSave: PropTypes.func.isRequired,
  onRun: PropTypes.func.isRequired,
  onViewer: PropTypes.func.isRequired,
  metaTitleChange: PropTypes.func.isRequired,
  metaDescriptionChange: PropTypes.func.isRequired,
  handleStartChange: PropTypes.func.isRequired,
  handleAddNode: PropTypes.func.isRequired,
  runsState: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string.isRequired,
  }).isRequired,
  onRefreshRuns: PropTypes.func.isRequired,
};
