import PropTypes from "prop-types";
import { Stack, TextField, Typography } from "@mui/material";
import { parseNumber } from "../utils/workflowBuilder.js";

export default function PressConfigFields({ config, onChange }) {
  const setConfig = (updates) => onChange({ ...config, ...updates });

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Press settings</Typography>
      <TextField
        label="XPath"
        value={config.xpath ?? ""}
        onChange={(event) => setConfig({ xpath: event.target.value })}
        fullWidth
      />
      <TextField
        label="Key"
        value={config.key ?? ""}
        onChange={(event) => setConfig({ key: event.target.value })}
        helperText='Example: "Enter"'
        fullWidth
      />
      <TextField
        label="Delay (ms)"
        type="number"
        value={config.delay ?? ""}
        onChange={(event) => setConfig({ delay: parseNumber(event.target.value) })}
        helperText="Optional"
        fullWidth
      />
    </Stack>
  );
}

PressConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
