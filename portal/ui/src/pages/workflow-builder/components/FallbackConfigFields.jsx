import PropTypes from "prop-types";
import { Stack, Typography } from "@mui/material";

export default function FallbackConfigFields({ description }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">No additional configuration</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Stack>
  );
}

FallbackConfigFields.propTypes = {
  description: PropTypes.string,
};

FallbackConfigFields.defaultProps = {
  description: "Use the success condition area below to wait for a delay or element.",
};
