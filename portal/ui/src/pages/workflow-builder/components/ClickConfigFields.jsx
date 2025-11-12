import PropTypes from "prop-types";
import { MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { CLICK_BUTTON_OPTIONS } from "@agent-flow/domain/value-objects/node-configs/constants.js";
import { parseNumber } from "../utils/workflowBuilder.js";

export default function ClickConfigFields({ config, onChange }) {
  const buttonValue = config.button ?? "left";
  const clickCountValue =
    typeof config.clickCount === "number" ? config.clickCount : 1;
  const delayValue = typeof config.delay === "number" ? config.delay : 0;
  const timeoutValue = typeof config.timeout === "number" ? config.timeout : 5;

  const setConfig = (updates) => {
    onChange({ ...config, ...updates });
  };

  const handleNumberChange = (field, fallback) => (event) => {
    const parsed = parseNumber(event.target.value);
    setConfig({
      [field]: parsed === null ? fallback : parsed,
    });
  };

  return (
    <>
      <Typography>Click settings</Typography>
      <TextField
        label="XPath"
        value={config.xpath ?? ""}
        onChange={(event) => setConfig({ xpath: event.target.value })}
      />
      <Tooltip title="Which mouse button to use for this click">
        <TextField
          select
          label="Button"
          value={buttonValue}
          onChange={(event) => {
            const value = event.target.value;
            setConfig({
              button: value === "" ? "left" : value,
            });
          }}
        >
          <MenuItem value="">
            <em>Default (left)</em>
          </MenuItem>
          {CLICK_BUTTON_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Tooltip>
      <Tooltip title="How many times to click the element (1 = single, 2 = double, …)">
        <TextField
          label="Click count"
          type="number"
          value={clickCountValue}
          onChange={handleNumberChange("clickCount", 1)}
          slotProps={{ input: { min: 1, step: 1 } }}
        />
      </Tooltip>
      <Tooltip title="Delay between mouse down and up, in seconds">
        <TextField
          label="Delay (s)"
          type="number"
          value={delayValue}
          onChange={handleNumberChange("delay", 0)}
          slotProps={{ input: { min: 0, step: 0.1 } }}
        />
      </Tooltip>
      <Tooltip title="Maximum time to wait for the click action to succeed, in seconds">
        <TextField
          label="Timeout (s)"
          type="number"
          value={timeoutValue}
          onChange={handleNumberChange("timeout", 5)}
          slotProps={{ input: { min: 0.1, step: 0.5 } }}
        />
      </Tooltip>
    </>
  );
}

ClickConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
