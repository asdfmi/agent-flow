import PropTypes from "prop-types";
import { Stack, TextField, Typography } from "@mui/material";

export default function ExtractTextConfigFields({ config, onChange }) {
  const setConfig = (updates) => onChange({ ...config, ...updates });

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Extract text settings</Typography>
      <TextField
        label="XPath"
        value={config.xpath ?? ""}
        onChange={(event) => setConfig({ xpath: event.target.value })}
        fullWidth
      />
      <TextField
        label="Store result as variable"
        value={config.as ?? ""}
        onChange={(event) => setConfig({ as: event.target.value })}
        fullWidth
      />
    </Stack>
  );
}

ExtractTextConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
