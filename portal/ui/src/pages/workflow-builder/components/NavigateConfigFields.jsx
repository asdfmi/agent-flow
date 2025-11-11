import PropTypes from "prop-types";
import { TextField, Typography } from "@mui/material";

export default function NavigateConfigFields({ config, onChange }) {
  return (
    <>
      <Typography>Navigate settings</Typography>
      <TextField
        label="URL"
        value={config.url ?? ""}
        onChange={(event) => onChange({ ...config, url: event.target.value })}
      />
      <TextField
        label="waitUntil"
        value={config.waitUntil ?? ""}
        onChange={(event) =>
          onChange({ ...config, waitUntil: event.target.value })
        }
      />
    </>
  );
}

NavigateConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
