import PropTypes from "prop-types";
import { TextField, MenuItem, Typography } from "@mui/material";

export default function LogConfigFields({ config, onChange }) {
  const setConfig = (updates) => onChange({ ...config, ...updates });

  return (
    <>
      <Typography>Log settings</Typography>
      <TextField
        label="Target"
        value={config.target ?? "agent-flow"}
        onChange={(event) => setConfig({ target: event.target.value })}
      />
      <TextField
        select
        label="Level"
        value={config.level ?? "info"}
        onChange={(event) => setConfig({ level: event.target.value })}
      >
        <MenuItem value="info">info</MenuItem>
        <MenuItem value="warn">warn</MenuItem>
        <MenuItem value="error">error</MenuItem>
      </TextField>
      <TextField
        label="Message"
        value={config.message ?? ""}
        onChange={(event) => setConfig({ message: event.target.value })}
        multiline
      />
      <Typography color="text.secondary">
        Bind data to the <code>value</code> input and reference it inside the
        message with {"{{variables.value}}"}.
      </Typography>
    </>
  );
}

LogConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
