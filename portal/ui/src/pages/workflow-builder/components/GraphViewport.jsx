import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import PixiProjection from "../../../workflow-graph/projection/pixi-projection.js";

export default function GraphViewport({ graphCore }) {
  const containerRef = useRef(null);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));
  const navHeight = isDesktop ? 64 : 56;

  useEffect(() => {
    if (!graphCore || !containerRef.current) return undefined;
    const projection = new PixiProjection({
      graphCore,
      container: containerRef.current,
    });
    return () => {
      projection.destroy();
    };
  }, [graphCore]);

  return (
    <Box
      sx={{
        width: "100%",
        height: `calc(100vh - ${navHeight}px)`,
        overflow: "hidden",
      }}
    >
      <Box ref={containerRef} sx={{ width: "100%", height: "100%" }} />
    </Box>
  );
}

GraphViewport.propTypes = {
  graphCore: PropTypes.object,
};

GraphViewport.defaultProps = {
  graphCore: null,
};
