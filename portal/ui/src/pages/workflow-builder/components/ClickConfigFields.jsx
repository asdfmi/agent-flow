import PropTypes from "prop-types";
import { TextField, MenuItem, Typography } from "@mui/material";
import { parseNumber } from "../utils/workflowBuilder.js";

export default function ClickConfigFields({ config, onChange }) {
  const options =
    config.options && typeof config.options === "object" ? config.options : {};

  const setConfig = (updates) => {
    onChange({ ...config, ...updates });
  };

  const updateOptions = (updates) => {
    const next = { ...options, ...updates };
    Object.keys(next).forEach((key) => {
      if (
        next[key] === null ||
        next[key] === "" ||
        typeof next[key] === "undefined"
      ) {
        delete next[key];
      }
    });
    setConfig({ options: next });
  };

  return (
    <>
      <Typography>Click settings</Typography>
      <TextField
        label="XPath"
        value={config.xpath ?? ""}
        onChange={(event) => setConfig({ xpath: event.target.value })}
      />
      <TextField
        select
        label="Button"
        value={options.button ?? ""}
        onChange={(event) =>
          updateOptions({ button: event.target.value || null })
        }
      >
        <MenuItem value="">
          <em>Default</em>
        </MenuItem>
        <MenuItem value="left">left</MenuItem>
        <MenuItem value="right">right</MenuItem>
        <MenuItem value="middle">middle</MenuItem>
      </TextField>
      <TextField
        label="Click count"
        type="number"
        value={options.clickCount ?? ""}
        onChange={(event) =>
          updateOptions({ clickCount: parseNumber(event.target.value) })
        }
      />
      <TextField
        label="Delay (ms)"
        type="number"
        value={options.delay ?? ""}
        onChange={(event) =>
          updateOptions({ delay: parseNumber(event.target.value) })
        }
      />
      <TextField
        label="Timeout (ms)"
        type="number"
        value={options.timeout ?? ""}
        onChange={(event) =>
          updateOptions({ timeout: parseNumber(event.target.value) })
        }
      />
    </>
  );
}

ClickConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
