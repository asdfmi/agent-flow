import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import WorkflowStepNode from "./WorkflowStepNode.jsx";

const nodeTypes = { workflowStep: WorkflowStepNode };

function getNodeId(step, index) {
  const key = String(step.stepKey || "").trim();
  return key ? key : `__step_${index}`;
}

function formatLabel(step, index) {
  return step.label?.trim() || step.stepKey?.trim() || `Step ${index + 1}`;
}

function formatBranchLabel(condition, index) {
  if (!condition || typeof condition !== "object") return `branch ${index + 1}`;
  if (condition.visible?.xpath) return `visible(${condition.visible.xpath})`;
  if (condition.exists?.xpath) return `exists(${condition.exists.xpath})`;
  if (typeof condition.urlIncludes === "string") return `url includes "${condition.urlIncludes}"`;
  if (condition.script?.code) return "script";
  if (typeof condition.delay === "number") return `delay ${condition.delay}s`;
  return `branch ${index + 1}`;
}

function ensurePosition(index) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: column * 260,
    y: row * 160,
  };
}

export default function WorkflowCanvas({
  steps,
  selectedStepKey,
  activeStepKey,
  startStepId,
  onSelectStep,
}) {
  const [nodePositions, setNodePositions] = useState({});

  useEffect(() => {
    setNodePositions((prev) => {
      const next = { ...prev };
      const seen = new Set();

      steps.forEach((step, index) => {
        const nodeId = getNodeId(step, index);
        seen.add(nodeId);
        if (!next[nodeId]) {
          next[nodeId] = ensurePosition(index);
        }
      });

      Object.keys(next).forEach((nodeId) => {
        if (!seen.has(nodeId)) {
          delete next[nodeId];
        }
      });

      return next;
    });
  }, [steps]);

  const nodeIdByKey = useMemo(() => {
    const map = new Map();
    steps.forEach((step, index) => {
      const nodeId = getNodeId(step, index);
      map.set(step.stepKey || nodeId, nodeId);
    });
    return map;
  }, [steps]);

  const nodes = useMemo(() => {
    return steps.map((step, index) => {
      const nodeId = getNodeId(step, index);
      const position = nodePositions[nodeId] || ensurePosition(index);
      const label = formatLabel(step, index);
      const isStart = startStepId ? startStepId === step.stepKey : index === 0;
      const isSelected = selectedStepKey ? selectedStepKey === step.stepKey : index === 0;
      const isActive = activeStepKey === step.stepKey;

      return {
        id: nodeId,
        position,
        data: {
          label,
          type: step.type,
          description: step.description,
          isSelected,
          isActive,
          isStart,
          index,
        },
        type: "workflowStep",
      };
    });
  }, [steps, nodePositions, startStepId, selectedStepKey, activeStepKey]);

  const edges = useMemo(() => {
    const result = [];

    steps.forEach((step, index) => {
      const sourceId = nodeIdByKey.get(step.stepKey || getNodeId(step, index));
      if (!sourceId) return;

      const addEdge = (targetKey, label) => {
        if (!targetKey) return;
        const targetId = nodeIdByKey.get(targetKey);
        if (!targetId) return;
        result.push({
          id: `${sourceId}-${targetId}-${label || "flow"}`,
          source: sourceId,
          target: targetId,
          label: label || undefined,
          animated: activeStepKey === step.stepKey,
          style: {
            strokeWidth: activeStepKey === step.stepKey ? 2.2 : 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "var(--mui-palette-text-primary)",
            width: 18,
            height: 18,
          },
        });
      };

      if (step.type === "if") {
        const branches = Array.isArray(step.config?.branches) ? step.config.branches : [];
        branches.forEach((branch, branchIndex) => {
          if (!branch) return;
          addEdge(branch.next, formatBranchLabel(branch.condition, branchIndex));
        });
        if (step.nextStepKey) addEdge(step.nextStepKey, "default");
      } else {
        if (step.nextStepKey) addEdge(step.nextStepKey);
        if (step.type === "loop" && step.exitStepKey) {
          addEdge(step.exitStepKey, "exit");
        }
      }
    });

    return result;
  }, [steps, nodeIdByKey, activeStepKey]);

  const handleNodeClick = useCallback((_, node) => {
    if (!onSelectStep) return;
    const index = node?.data?.index;
    if (typeof index === "number") {
      onSelectStep(index);
    }
  }, [onSelectStep]);

  const handleNodesChange = useCallback((changes) => {
    setNodePositions((prev) => {
      const next = { ...prev };
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          next[change.id] = change.position;
        }
        if (change.type === "remove") {
          delete next[change.id];
        }
      });
      return next;
    });
  }, []);

  return (
    <Box sx={{ width: "100%", height: "100%", borderRadius: 0, overflow: "hidden" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        onNodeClick={handleNodeClick}
        onNodesChange={handleNodesChange}
        nodesDraggable
        zoomOnScroll
        zoomOnPinch
        panOnScroll
        style={{ width: "100%", height: "100%" }}
      >
        <MiniMap pannable zoomable style={{ bottom: 80, right: 16 }} />
        <Controls style={{ bottom: 16, right: 16 }} />
        <Background gap={20} size={1} />
      </ReactFlow>
    </Box>
  );
}

WorkflowCanvas.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedStepKey: PropTypes.string,
  activeStepKey: PropTypes.string,
  startStepId: PropTypes.string,
  onSelectStep: PropTypes.func.isRequired,
};

WorkflowCanvas.defaultProps = {
  selectedStepKey: "",
  activeStepKey: "",
  startStepId: "",
};
