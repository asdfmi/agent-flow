import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import PixiProjection from "../../../workflow-graph/projection/pixi-projection.js";

export default function GraphViewport({ graphCore, height, framed }) {
  const containerRef = useRef(null);
  const projectionRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!graphCore || !containerRef.current) return undefined;
    const projection = new PixiProjection({
      graphCore,
      container: containerRef.current,
    });
    projectionRef.current = projection;
    setReady(true);
    return () => {
      projection.destroy();
      projectionRef.current = null;
      setReady(false);
    };
  }, [graphCore]);

  const resolvedHeight = typeof height === "number" ? `${height}px` : (height || "360px");

  return (
    <Box
      sx={{
        width: "100%",
        height: resolvedHeight,
        position: "relative",
        overflow: "hidden",
        borderRadius: framed ? 2 : 0,
        border: framed ? "1px solid" : 0,
        borderColor: framed ? "divider" : "transparent",
      }}
    >
      {!ready ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            bgcolor: framed ? "background.default" : "transparent",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Loading canvas...
          </Typography>
        </Box>
      ) : null}
      <Box ref={containerRef} sx={{ width: "100%", height: "100%" }} />
    </Box>
  );
}

GraphViewport.propTypes = {
  graphCore: PropTypes.object,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  framed: PropTypes.bool,
};

GraphViewport.defaultProps = {
  graphCore: null,
  height: 360,
  framed: true,
};
