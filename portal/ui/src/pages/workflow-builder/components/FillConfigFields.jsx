import PropTypes from "prop-types";
import { Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";

export default function FillConfigFields({ config, onChange }) {
  const setConfig = (updates) => onChange({ ...config, ...updates });

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Fill settings</Typography>
      <TextField
        label="XPath"
        value={config.xpath ?? ""}
        onChange={(event) => setConfig({ xpath: event.target.value })}
        fullWidth
      />
      <TextField
        label="Value"
        value={config.value ?? ""}
        onChange={(event) => setConfig({ value: event.target.value })}
        fullWidth
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(config.clear)}
            onChange={(event) => setConfig({ clear: event.target.checked })}
          />
        }
        label="Clear before typing"
      />
    </Stack>
  );
}

FillConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
