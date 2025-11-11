import PropTypes from "prop-types";
import { TextField, Typography } from "@mui/material";
import { parseNumber } from "../utils/workflowBuilder.js";

export default function PressConfigFields({ config, onChange }) {
  const setConfig = (updates) => onChange({ ...config, ...updates });

  return (
    <>
      <Typography>Press settings</Typography>
      <TextField
        label="XPath"
        value={config.xpath ?? ""}
        onChange={(event) => setConfig({ xpath: event.target.value })}
      />
      <TextField
        label="Key"
        value={config.key ?? ""}
        onChange={(event) => setConfig({ key: event.target.value })}
      />
      <TextField
        label="Delay (ms)"
        type="number"
        value={config.delay ?? ""}
        onChange={(event) =>
          setConfig({ delay: parseNumber(event.target.value) })
        }
      />
    </>
  );
}

PressConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
