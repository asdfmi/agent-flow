import PropTypes from "prop-types";
import { useMemo } from "react";
import { Box, Chip, Dialog, DialogContent, DialogTitle, Paper, Stack, Typography } from "@mui/material";
import { getNodeMeta } from "./nodeMeta.js";

const FALLBACK_TEXT = "Waiting for screenshot...";

export default function ExecutionViewerModal({
  open,
  onClose,
  screenshot,
  eventLog,
  wsStatus,
  runState,
  nodes,
  currentStepIndex,
}) {
  const entries = useMemo(() => eventLog ?? [], [eventLog]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        Live Execution
        <Typography variant="caption" color="text.secondary">
          WS: {wsStatus} / Status: {runState.status}
        </Typography>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          height: { xs: "65vh", md: "75vh" },
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          <Paper
            variant="outlined"
            sx={{
              flex: 3,
              minHeight: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {screenshot ? (
              <Box
                component="img"
                src={screenshot}
                alt="Live screenshot"
                sx={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {FALLBACK_TEXT}
              </Typography>
            )}
          </Box>
          <Stack
            spacing={1}
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
            }}
          >
            {entries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No events yet.
              </Typography>
            ) : (
              entries.map((event, idx) => (
                <Paper key={`${event.type}-${event.index ?? "x"}-${event.ts ?? idx}-${idx}`} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={event.type} />
                      {typeof event.index === "number" ? (
                        <Typography variant="caption" color="text.secondary">
                          node: {event.index}
                        </Typography>
                      ) : null}
                      <Typography variant="caption" color="text.secondary">
                        {event.ts ? new Date(event.ts).toLocaleString() : "-"}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {event.message || JSON.stringify(event.step || event, null, 0)}
                    </Typography>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: "auto",
            pt: 1,
          }}
        >
          {(nodes ?? []).map((node, index) => {
            const isActive = typeof currentStepIndex === "number" && currentStepIndex === index;
            const meta = getNodeMeta(node.type);
            const chipColor = meta.color === "default" ? undefined : meta.color;
            return (
              <Chip
                key={node.id ?? index}
                label={`Node ${index + 1}: ${node.label || meta.label}`}
                color={chipColor}
                variant={isActive ? "filled" : "outlined"}
              />
            );
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

ExecutionViewerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  screenshot: PropTypes.string,
  eventLog: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      index: PropTypes.number,
      ts: PropTypes.number,
      message: PropTypes.string,
      step: PropTypes.object,
    })
  ),
  wsStatus: PropTypes.string,
  runState: PropTypes.shape({
    status: PropTypes.string,
  }).isRequired,
  nodes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      type: PropTypes.string,
    })
  ),
  currentStepIndex: PropTypes.number,
};

ExecutionViewerModal.defaultProps = {
  screenshot: "",
  eventLog: [],
  wsStatus: "idle",
  nodes: [],
  currentStepIndex: null,
};
