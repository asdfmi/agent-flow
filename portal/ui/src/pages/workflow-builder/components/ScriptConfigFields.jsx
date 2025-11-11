import PropTypes from "prop-types";
import { TextField, Typography } from "@mui/material";

export default function ScriptConfigFields({ config, onChange }) {
  const setConfig = (updates) => onChange({ ...config, ...updates });

  return (
    <>
      <Typography>Script settings</Typography>
      <TextField
        label="JavaScript code"
        value={config.code ?? ""}
        onChange={(event) => setConfig({ code: event.target.value })}
        multiline
      />
      <TextField
        label="Store result as variable"
        value={config.as ?? ""}
        onChange={(event) => setConfig({ as: event.target.value })}
      />
    </>
  );
}

ScriptConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
