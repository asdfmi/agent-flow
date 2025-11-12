import PropTypes from "prop-types";
import { TextField, Tooltip, Typography } from "@mui/material";
import { parseNumber } from "../utils/workflowBuilder.js";

export default function WaitConfigFields({ config, onChange }) {
  const handleChange = (event) => {
    const parsed = parseNumber(event.target.value);
    onChange({
      ...config,
      timeout: parsed === null ? 1 : parsed,
    });
  };

  return (
    <>
      <Typography>Delay settings</Typography>
      <Tooltip title="Pause for a fixed number of seconds before continuing">
        <TextField
          label="Duration (s)"
          type="number"
          value={config.timeout}
          onChange={handleChange}
          slotProps={{ input: { min: 0.1, step: 0.5 } }}
        />
      </Tooltip>
    </>
  );
}

WaitConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
