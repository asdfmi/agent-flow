import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createEmptyNode, toEditableEdge, toEditableNode } from "../utils/workflowBuilder.js";

const EMPTY_FORM = {
  title: "",
  description: "",
  startNodeId: "",
  nodes: [],
  edges: [],
};

export function useWorkflowBuilderForm(workflow) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const lastSyncRef = useRef({ id: null, updatedAt: null });

  const syncFromWorkflow = useCallback((nextWorkflow, options = {}) => {
    if (!nextWorkflow) return;
    const { preserveSelection = false, force = false } = options;
    const last = lastSyncRef.current;
    if (!force && last.id === nextWorkflow.id && last.updatedAt === nextWorkflow.updatedAt) {
      return;
    }

    const nodes = Array.isArray(nextWorkflow.nodes)
      ? nextWorkflow.nodes.map(toEditableNode)
      : [];

    const edges = Array.isArray(nextWorkflow.edges)
      ? nextWorkflow.edges.map(toEditableEdge)
      : [];

    lastSyncRef.current = { id: nextWorkflow.id, updatedAt: nextWorkflow.updatedAt };
    setForm({
      title: nextWorkflow.title ?? "",
      description: nextWorkflow.description ?? "",
      startNodeId: nextWorkflow.startNodeId ?? "",
      nodes,
      edges,
    });
    setSelectedIndex((current) => {
      if (nodes.length === 0) return -1;
      if (preserveSelection && current >= 0) {
        return Math.min(current, nodes.length - 1);
      }
      return 0;
    });
  }, []);

  useEffect(() => {
    syncFromWorkflow(workflow);
  }, [workflow, syncFromWorkflow]);

  const handleMetaChange = useCallback(
    (field) => (event) => {
      const { value } = event.target;
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleStartChange = useCallback((event) => {
    setForm((prev) => ({ ...prev, startNodeId: event.target.value }));
  }, []);

  const handleAddNode = useCallback(() => {
    let nextForm = null;
    let nextIndex = -1;
    setForm((prev) => {
      const newNode = createEmptyNode(prev.nodes);
      const nodes = [...prev.nodes, newNode];
      const startNodeId = prev.startNodeId || (nodes[0]?.nodeKey ?? "");
      nextIndex = nodes.length - 1;
      nextForm = { ...prev, nodes, startNodeId };
      return nextForm;
    });
    if (nextIndex >= 0) {
      setSelectedIndex(nextIndex);
    }
    return nextForm;
  }, []);

  const handleRemoveNode = useCallback((index) => {
    if (index < 0) return null;
    let nextForm = null;
    setForm((prev) => {
      if (index >= prev.nodes.length) return prev;
      const node = prev.nodes[index];
      const nodeKey = node?.nodeKey;
      const nodes = prev.nodes.filter((_, i) => i !== index);
      const edges = prev.edges.filter(
        (edge) => edge.sourceKey !== nodeKey && edge.targetKey !== nodeKey
      );
      const startNodeId = nodeKey === prev.startNodeId
        ? nodes[0]?.nodeKey ?? ""
        : prev.startNodeId;
      setSelectedIndex((current) => {
        if (nodes.length === 0) return -1;
        if (current > index) return current - 1;
        if (current === index) return Math.min(index, nodes.length - 1);
        return current;
      });
      nextForm = { ...prev, nodes, edges, startNodeId };
      return nextForm;
    });
    return nextForm;
  }, []);

  const handleSelectNode = useCallback((index) => {
    setSelectedIndex(index);
  }, []);

  const handleNodeChange = useCallback((index, updates) => {
    let nextForm = null;
    setForm((prev) => {
      if (index < 0 || index >= prev.nodes.length) return prev;
      const currentNode = prev.nodes[index];
      const nextNode = { ...currentNode, ...updates };
      const nodes = prev.nodes.map((node, i) => (i === index ? nextNode : node));
      let startNodeId = prev.startNodeId;
      if (currentNode.nodeKey === prev.startNodeId && nextNode.nodeKey) {
        startNodeId = nextNode.nodeKey;
      }
      let edges = prev.edges;
      const currentKey = currentNode.nodeKey;
      const nextKey = nextNode.nodeKey;
      if (currentKey && nextKey && currentKey !== nextKey) {
        edges = prev.edges.map((edge) => {
          if (!edge) return edge;
          let changed = false;
          const updated = { ...edge };
          if (edge.sourceKey === currentKey) {
            updated.sourceKey = nextKey;
            changed = true;
          }
          if (edge.targetKey === currentKey) {
            updated.targetKey = nextKey;
            changed = true;
          }
          return changed ? updated : edge;
        });
      }
      nextForm = { ...prev, nodes, edges, startNodeId };
      return nextForm;
    });
    return nextForm;
  }, []);

  const replaceEdgesForNode = useCallback((nodeKey, builder) => {
    let nextForm = null;
    setForm((prev) => {
      const existing = prev.edges.filter((edge) => edge.sourceKey === nodeKey);
      const nextNodeEdgesRaw = builder(existing, prev) || [];
      const nextNodeEdges = nextNodeEdgesRaw
        .filter(Boolean)
        .map((edge) => ({
          edgeKey: String(edge.edgeKey || "").trim(),
          sourceKey: nodeKey,
          targetKey: String(
            typeof edge.targetKey === "string"
              ? edge.targetKey
              : typeof edge.target === "string"
                ? edge.target
                : ""
          ).trim(),
          label: edge.label ?? "",
          condition: edge.condition && typeof edge.condition === "object" ? edge.condition : null,
          metadata: edge.metadata && typeof edge.metadata === "object" ? edge.metadata : null,
          priority: typeof edge.priority === "number" ? edge.priority : null,
        }));
      const remainder = prev.edges.filter((edge) => edge.sourceKey !== nodeKey);
      nextForm = { ...prev, edges: [...remainder, ...nextNodeEdges] };
      return nextForm;
    });
    return nextForm;
  }, []);

  const selectedNode = useMemo(
    () => (selectedIndex >= 0 ? form.nodes[selectedIndex] ?? null : null),
    [form.nodes, selectedIndex]
  );

  return {
    form,
    selectedIndex,
    selectedNode,
    handleMetaChange,
    handleStartChange,
    handleAddNode,
    handleRemoveNode,
    handleSelectNode,
    handleNodeChange,
    replaceEdgesForNode,
    syncFromWorkflow,
  };
}
