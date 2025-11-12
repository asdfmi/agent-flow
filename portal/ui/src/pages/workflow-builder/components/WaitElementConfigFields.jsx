import PropTypes from "prop-types";
import { MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { WAIT_ELEMENT_CONDITION_TYPES } from "@agent-flow/domain/value-objects/node-configs/constants.js";
import { parseNumber } from "../utils/workflowBuilder.js";

const CONDITION_LABELS = {
  visible: "Element becomes visible",
  exists: "Element exists in DOM",
};

function normalizeType(value) {
  if (value === "attached") {
    return "exists";
  }
  if (WAIT_ELEMENT_CONDITION_TYPES.includes(value)) {
    return value;
  }
  return WAIT_ELEMENT_CONDITION_TYPES[0];
}

export default function WaitElementConfigFields({ config, onChange }) {
  const updateConfig = (updates) => {
    onChange({ ...config, ...updates });
  };

  return (
    <>
      <Typography>Wait for element</Typography>
      <Tooltip title="Which element state must be satisfied before continuing">
        <TextField
          select
          label="Element state"
          value={normalizeType(config.type)}
          onChange={(event) => updateConfig({ type: event.target.value })}
        >
          {WAIT_ELEMENT_CONDITION_TYPES.map((value) => (
            <MenuItem key={value} value={value}>
              {CONDITION_LABELS[value] ?? value}
            </MenuItem>
          ))}
        </TextField>
      </Tooltip>
      <Tooltip title="XPath selector for the element to watch">
        <TextField
          label="Element XPath"
          value={config.xpath}
          onChange={(event) => updateConfig({ xpath: event.target.value })}
        />
      </Tooltip>
      <Tooltip title="Maximum time to wait before aborting (seconds)">
        <TextField
          label="Timeout (s)"
          type="number"
          value={config.timeout}
          onChange={(event) => {
            const parsed = parseNumber(event.target.value);
            updateConfig({
              timeout: parsed === null ? 10 : parsed,
            });
          }}
          slotProps={{ input: { min: 0.5, step: 0.5 } }}
        />
      </Tooltip>
    </>
  );
}

WaitElementConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
