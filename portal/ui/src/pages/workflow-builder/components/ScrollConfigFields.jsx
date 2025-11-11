import PropTypes from "prop-types";
import { TextField, Typography } from "@mui/material";
import { parseNumber } from "../utils/workflowBuilder.js";

export default function ScrollConfigFields({ config, onChange }) {
  const handleChange = (field) => (event) => {
    onChange({ ...config, [field]: parseNumber(event.target.value) });
  };

  return (
    <>
      <Typography>Scroll settings</Typography>
      <TextField
        label="dx"
        type="number"
        value={config.dx ?? ""}
        onChange={handleChange("dx")}
      />
      <TextField
        label="dy"
        type="number"
        value={config.dy ?? ""}
        onChange={handleChange("dy")}
      />
    </>
  );
}

ScrollConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
