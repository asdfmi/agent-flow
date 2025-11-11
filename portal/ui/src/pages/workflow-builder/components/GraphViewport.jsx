import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import PixiProjection from "../../../workflow-graph/projection/pixi-projection.js";

export default function GraphViewport({ graphCore, height }) {
  const containerRef = useRef(null);

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

  const resolvedHeight = typeof height === "number" ? `${height}px` : (height || "360px");

  return (
    <div style={{ width: "100%", height: resolvedHeight }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

GraphViewport.propTypes = {
  graphCore: PropTypes.object,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

GraphViewport.defaultProps = {
  graphCore: null,
  height: 360,
};
