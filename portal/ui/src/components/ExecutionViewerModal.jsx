import PropTypes from "prop-types";
import { useMemo } from "react";
import { Chip, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
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
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        Live Execution
        <Typography>
          WS: {wsStatus} / Status: {runState.status}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {screenshot ? <img src={screenshot} alt="Live screenshot" /> : <Typography>{FALLBACK_TEXT}</Typography>}
        <Typography>Events</Typography>
        {entries.length === 0 ? (
          <Typography>No events yet.</Typography>
        ) : (
          entries.map((event, idx) => (
            <div key={`${event.type}-${event.index ?? "x"}-${event.ts ?? idx}-${idx}`}>
              <Chip label={event.type} />
              {typeof event.index === "number" ? <Typography>node: {event.index}</Typography> : null}
              <Typography>{event.ts ? new Date(event.ts).toLocaleString() : "-"}</Typography>
              <Typography>{event.message || JSON.stringify(event.step || event, null, 0)}</Typography>
            </div>
          ))
        )}
        <Typography>Nodes</Typography>
        {(nodes ?? []).map((node, index) => {
          const meta = getNodeMeta(node.type);
          const isActive = typeof currentStepIndex === "number" && currentStepIndex === index;
          const label = isActive ? `* ${node.label || meta.label}` : `${node.label || meta.label}`;
          return <Chip key={node.id ?? index} label={`Node ${index + 1}: ${label}`} />;
        })}
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
