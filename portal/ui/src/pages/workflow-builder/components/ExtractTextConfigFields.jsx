import PropTypes from "prop-types";
import { TextField, Typography } from "@mui/material";

export default function ExtractTextConfigFields({ config, onChange }) {
  const setConfig = (updates) => onChange({ ...config, ...updates });

  return (
    <>
      <Typography>Extract text settings</Typography>
      <TextField
        label="XPath"
        value={config.xpath ?? ""}
        onChange={(event) => setConfig({ xpath: event.target.value })}
      />
      <TextField
        label="Store result as variable"
        value={config.as ?? ""}
        onChange={(event) => setConfig({ as: event.target.value })}
      />
    </>
  );
}

ExtractTextConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
