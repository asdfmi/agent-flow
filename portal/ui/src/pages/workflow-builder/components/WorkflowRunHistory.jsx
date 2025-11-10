import PropTypes from "prop-types";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
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
    <Box sx={{ px: { xs: 2, md: 4 }, mt: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        sx={{ mb: 2 }}
      >
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
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No runs recorded yet.
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          {runs.map((run) => (
            <Stack
              key={run.id}
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: "background.paper",
                boxShadow: 1,
              }}
            >
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2" noWrap>
                    {run.runKey || `Run #${run.id}`}
                  </Typography>
                  <Chip
                    size="small"
                    label={run.status}
                    color={statusColor(run.status)}
                    sx={{ textTransform: "uppercase" }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Started: {run.startedAt ? new Date(run.startedAt).toLocaleString() : "-"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Finished: {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : "—"}
                </Typography>
              </Stack>
              {run.errorMessage ? (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ maxWidth: 360 }}
                >
                  {run.errorMessage}
                </Typography>
              ) : null}
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
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
