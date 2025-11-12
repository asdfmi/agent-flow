import PropTypes from "prop-types";
import { MenuItem, TextField, Typography } from "@mui/material";
import { NAVIGATE_WAIT_STATES } from "@agent-flow/domain/value-objects/node-configs/constants.js";

const WAIT_UNTIL_LABELS = {
  page_loaded: "Page fully loaded",
  dom_ready: "DOM ready",
  network_idle: "Network idle",
  response_received: "First response byte",
};

const DEFAULT_WAIT_UNTIL = NAVIGATE_WAIT_STATES[0];

export default function NavigateConfigFields({ config, onChange }) {
  return (
    <>
      <Typography>Navigate settings</Typography>
      <TextField
        label="URL"
        value={config.url ?? ""}
        onChange={(event) => onChange({ ...config, url: event.target.value })}
      />
      <TextField
        select
        label="Wait until"
        value={config.waitUntil ?? DEFAULT_WAIT_UNTIL}
        onChange={(event) =>
          onChange({ ...config, waitUntil: event.target.value })
        }
      >
        {NAVIGATE_WAIT_STATES.map((option) => (
          <MenuItem key={option} value={option}>
            {WAIT_UNTIL_LABELS[option] ?? option}
          </MenuItem>
        ))}
      </TextField>
    </>
  );
}

NavigateConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
