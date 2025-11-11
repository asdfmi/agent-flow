import PropTypes from "prop-types";
import {
  Alert,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

function statusColor(status) {
  switch (status) {
    case "running":
      return "success";
    case "queued":
    case "starting":
      return "warning";
    case "failed":
      return "error";
    case "succeeded":
      return "primary";
    default:
      return "default";
  }
}

export default function WorkflowRunHistory({ runs, loading, error, onRefresh }) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1">Recent runs</Typography>
        <IconButton size="small" onClick={onRefresh}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Stack>
      {loading ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Loading runs...
          </Typography>
        </Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : runs.length === 0 ? (
        <Paper variant="outlined">
          <Typography variant="body2" color="text.secondary">
            No runs recorded yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {runs.map((run) => (
            <Paper key={run.id} variant="outlined">
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" noWrap>
                      {run.runKey || `Run #${run.id}`}
                    </Typography>
                    <Chip size="small" label={run.status} color={statusColor(run.status)} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Started: {run.startedAt ? new Date(run.startedAt).toLocaleString() : "-"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Finished: {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : "—"}
                  </Typography>
                </Stack>
                {run.errorMessage ? (
                  <Typography variant="caption" color="error">
                    {run.errorMessage}
                  </Typography>
                ) : null}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

WorkflowRunHistory.propTypes = {
  runs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      runKey: PropTypes.string,
      status: PropTypes.string.isRequired,
      startedAt: PropTypes.string,
      finishedAt: PropTypes.string,
      errorMessage: PropTypes.string,
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
