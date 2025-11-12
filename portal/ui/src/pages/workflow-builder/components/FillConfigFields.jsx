import PropTypes from "prop-types";
import {
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";

export default function FillConfigFields({ config, onChange }) {
  const setConfig = (updates) => onChange({ ...config, ...updates });

  return (
    <>
      <Typography>Fill settings</Typography>
      <TextField
        label="XPath"
        value={config.xpath ?? ""}
        onChange={(event) => setConfig({ xpath: event.target.value })}
      />
      <Typography color="text.secondary">
        Value is supplied via data bindings. Connect an upstream node to the
        `value` input in the bindings panel.
      </Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(config.clear)}
            onChange={(event) => setConfig({ clear: event.target.checked })}
          />
        }
        label="Clear before typing"
      />
    </>
  );
}

FillConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
