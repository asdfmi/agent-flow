import PropTypes from "prop-types";
import { Stack, TextField, Typography } from "@mui/material";

export default function NavigateConfigFields({ config, onChange }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Navigate settings</Typography>
      <TextField
        label="URL"
        value={config.url ?? ""}
        onChange={(event) => onChange({ ...config, url: event.target.value })}
        fullWidth
      />
      <TextField
        label="waitUntil"
        value={config.waitUntil ?? ""}
        onChange={(event) => onChange({ ...config, waitUntil: event.target.value })}
        helperText="Optional (load, domcontentloaded, networkidle, commit)"
        fullWidth
      />
    </Stack>
  );
}

NavigateConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
