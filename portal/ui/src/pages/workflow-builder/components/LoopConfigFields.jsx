import PropTypes from "prop-types";
import { Stack, TextField, Typography } from "@mui/material";
import { parseNumber } from "../utils/workflowBuilder.js";

export default function LoopConfigFields({ config, onChange }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Loop settings</Typography>
      <TextField
        label="Times"
        type="number"
        value={config.times ?? ""}
        onChange={(event) => onChange({ ...config, times: parseNumber(event.target.value) })}
        helperText="Use next/exit step keys to control loop flow"
        fullWidth
      />
    </Stack>
  );
}

LoopConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
