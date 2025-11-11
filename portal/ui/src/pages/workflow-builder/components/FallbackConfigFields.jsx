import PropTypes from "prop-types";
import { Typography } from "@mui/material";

export default function FallbackConfigFields({ description }) {
  return (
    <>
      <Typography>No additional configuration</Typography>
      <Typography>{description}</Typography>
    </>
  );
}

FallbackConfigFields.propTypes = {
  description: PropTypes.string,
};

FallbackConfigFields.defaultProps = {
  description: "Use the success condition area below to wait for a delay or element.",
};
