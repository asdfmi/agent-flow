import PropTypes from "prop-types";
import { useMemo } from "react";
import {
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: { xs: "auto", md: "80vh" },
        },
      }}
    >
      <DialogTitle>
        Live Execution
        <Typography>
          WS: {wsStatus} / Status: {runState.status}
        </Typography>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            gap: 16,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Screenshot
            </Typography>
            <div
              style={{
                flex: 1,
                borderRadius: 8,
                background: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {screenshot ? (
                <img
                  src={screenshot}
                  alt="Live screenshot"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <Typography color="white">{FALLBACK_TEXT}</Typography>
              )}
            </div>
          </div>

          <div
            style={{
              width: 360,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Events
            </Typography>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                padding: 12,
              }}
            >
              {entries.length === 0 ? (
                <Typography variant="body2">No events yet.</Typography>
              ) : (
                entries.map((event, idx) => (
                  <div
                    key={`${event.type}-${event.index ?? "x"}-${event.ts ?? idx}-${idx}`}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      paddingBottom: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Chip
                      label={event.type}
                      size="small"
                      sx={{ mr: 1, mb: 0.5 }}
                    />
                    {typeof event.index === "number" ? (
                      <Typography variant="caption" display="block">
                        node: {event.index}
                      </Typography>
                    ) : null}
                    <Typography variant="caption" display="block">
                      {event.ts ? new Date(event.ts).toLocaleString() : "-"}
                    </Typography>
                    <Typography variant="body2">
                      {event.message ||
                        JSON.stringify(event.step || event, null, 0)}
                    </Typography>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 8,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Nodes
          </Typography>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              maxHeight: 140,
              overflowY: "auto",
            }}
          >
            {(nodes ?? []).map((node, index) => {
              const meta = getNodeMeta(node.type);
              const isActive =
                typeof currentStepIndex === "number" &&
                currentStepIndex === index;
              const label = isActive
                ? `* ${node.label || meta.label}`
                : `${node.label || meta.label}`;
              return (
                <Chip
                  key={node.id ?? index}
                  label={`Node ${index + 1}: ${label}`}
                  color={isActive ? "primary" : "default"}
                  variant={isActive ? "filled" : "outlined"}
                />
              );
            })}
          </div>
        </div>
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
    }),
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
    }),
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
