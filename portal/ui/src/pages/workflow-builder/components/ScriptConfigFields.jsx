import PropTypes from "prop-types";
import { Stack, TextField, Typography } from "@mui/material";

export default function ScriptConfigFields({ config, onChange }) {
  const setConfig = (updates) => onChange({ ...config, ...updates });

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Script settings</Typography>
      <TextField
        label="JavaScript code"
        value={config.code ?? ""}
        onChange={(event) => setConfig({ code: event.target.value })}
        multiline
        minRows={6}
        fullWidth
      />
      <TextField
        label="Store result as variable"
        value={config.as ?? ""}
        onChange={(event) => setConfig({ as: event.target.value })}
        helperText="Optional (execution variables)"
        fullWidth
      />
    </Stack>
  );
}

ScriptConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
