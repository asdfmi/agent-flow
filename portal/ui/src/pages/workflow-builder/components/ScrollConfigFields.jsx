import PropTypes from "prop-types";
import { Stack, TextField, Typography } from "@mui/material";
import { parseNumber } from "../utils/workflowBuilder.js";

export default function ScrollConfigFields({ config, onChange }) {
  const handleChange = (field) => (event) => {
    onChange({ ...config, [field]: parseNumber(event.target.value) });
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Scroll settings</Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField
          label="dx"
          type="number"
          value={config.dx ?? ""}
          onChange={handleChange("dx")}
          fullWidth
        />
        <TextField
          label="dy"
          type="number"
          value={config.dy ?? ""}
          onChange={handleChange("dy")}
          fullWidth
        />
      </Stack>
    </Stack>
  );
}

ScrollConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
