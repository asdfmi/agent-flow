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

export default function WorkflowRunHistory({
  runs,
  loading,
  error,
  onRefresh,
}) {
  return (
    <Stack>
      <Stack>
        <Typography>Recent runs</Typography>
        <IconButton onClick={onRefresh}>
          <RefreshIcon />
        </IconButton>
      </Stack>
      {loading ? (
        <Stack>
          <CircularProgress />
          <Typography>Loading runs...</Typography>
        </Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : runs.length === 0 ? (
        <Paper>
          <Typography>No runs recorded yet.</Typography>
        </Paper>
      ) : (
        <Stack>
          {runs.map((run) => (
            <Paper key={run.id}>
              <Stack>
                <Stack>
                  <Typography>{run.runKey || `Run #${run.id}`}</Typography>
                  <Chip
                    size="small"
                    label={run.status}
                    color={statusColor(run.status)}
                  />
                </Stack>
                <Typography>
                  Started:{" "}
                  {run.startedAt
                    ? new Date(run.startedAt).toLocaleString()
                    : "-"}
                </Typography>
                <Typography>
                  Finished:{" "}
                  {run.finishedAt
                    ? new Date(run.finishedAt).toLocaleString()
                    : "—"}
                </Typography>
                {run.errorMessage ? (
                  <Typography>{run.errorMessage}</Typography>
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
    }),
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
