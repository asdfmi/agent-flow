import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const summarizeCondition = (condition) => {
  if (!condition) return "else";
  if (condition.visible) return `if visible ${condition.visible.xpath || ""}`.trim();
  if (condition.exists) return `if exists ${condition.exists.xpath || ""}`.trim();
  if (typeof condition.urlIncludes === "string") return `if url includes "${condition.urlIncludes}"`;
  if (typeof condition.delay === "number") return `if delay ${condition.delay}s`;
  if (condition.script) return "if script true";
  return "if condition";
};

export default function WorkflowNodeList({
  nodes,
  edges,
  selectedIndex,
  startNodeId,
  activeNodeKey,
  onSelectNode,
  onAddNode,
}) {
  const [workflowOpen, setWorkflowOpen] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState({});

  const nodeMap = useMemo(
    () => new Map(nodes.map((node, index) => [node.nodeKey ?? `node_${index + 1}`, { node, index }])),
    [nodes],
  );

  const adjacency = useMemo(() => {
    const map = new Map();
    (edges || []).forEach((edge) => {
      const key = String(edge?.sourceKey || edge?.source || "").trim();
      if (!key) return;
      const list = map.get(key) ?? [];
      list.push(edge);
      map.set(key, list);
    });
    map.forEach((list) => {
      list.sort((a, b) => {
        const ap = typeof a.priority === "number" ? a.priority : Number.MAX_SAFE_INTEGER;
        const bp = typeof b.priority === "number" ? b.priority : Number.MAX_SAFE_INTEGER;
        return ap - bp;
      });
    });
    return map;
  }, [edges]);

  const startKey = useMemo(() => {
    if (startNodeId && nodeMap.has(startNodeId)) return startNodeId;
    return nodes[0]?.nodeKey ?? null;
  }, [startNodeId, nodeMap, nodes]);

  const getNodeLabel = (node, index) => node.label?.trim() || node.nodeKey || `Node ${index + 1}`;

  const toggleExpand = (key) => {
    setExpandedNodes((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  const renderLinearHint = (edge, depth) => {
    const entry = nodeMap.get(edge.targetKey);
    const label = entry ? getNodeLabel(entry.node, entry.index) : edge.targetKey || "End";
    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: 6 + depth * 2, pb: 0.5 }}>
        <ArrowDownwardIcon fontSize="inherit" sx={{ color: "text.disabled", fontSize: 16 }} />
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Stack>
    );
  };

  const renderedKeys = new Set();

  const renderNode = (nodeKey, depth = 0, incomingEdge = null, visited = new Set()) => {
    if (!nodeKey || !nodeMap.has(nodeKey) || visited.has(nodeKey)) return null;
    const nextVisited = new Set(visited);
    nextVisited.add(nodeKey);
    const { node, index } = nodeMap.get(nodeKey);
    const outgoing = adjacency.get(nodeKey) ?? [];
    const isIfNode = node.type === "if";
    const hasChildren = isIfNode && outgoing.length > 0;
    const isExpanded = expandedNodes[nodeKey] ?? true;
    const isStart = startKey === nodeKey;
    const isActive = activeNodeKey ? activeNodeKey === nodeKey : false;
    const indent = 4 + depth * 2;
    const conditionLabel = incomingEdge ? summarizeCondition(incomingEdge.condition) : null;

    renderedKeys.add(nodeKey);

    return (
      <Box key={`${nodeKey}-${depth}-${conditionLabel || "root"}`}>
        <ListItemButton
          selected={selectedIndex === index}
          onClick={() => onSelectNode(index)}
          sx={{
            pl: indent,
            alignItems: "flex-start",
            flexDirection: "column",
            gap: 0.5,
            borderRadius: 1,
            mb: 0.5,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              {isIfNode ? (
                isExpanded ? <FolderOpenIcon fontSize="small" /> : <FolderIcon fontSize="small" />
              ) : (
                <InsertDriveFileIcon fontSize="small" />
              )}
            </ListItemIcon>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {getNodeLabel(node, index)}
              </Typography>
              {conditionLabel ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {conditionLabel}
                </Typography>
              ) : null}
              <Typography variant="caption" color="text.secondary">
                Key: {node.nodeKey}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5}>
              <Chip size="small" label={node.type} sx={{ textTransform: "uppercase", fontSize: "0.65rem" }} />
              {isStart ? <Chip size="small" color="success" label="Start" sx={{ fontSize: "0.65rem" }} /> : null}
              {isActive ? <Chip size="small" color="primary" label="Active" sx={{ fontSize: "0.65rem" }} /> : null}
            </Stack>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleExpand(nodeKey);
                }}
              >
                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            ) : null}
          </Stack>
        </ListItemButton>
        {!isIfNode && outgoing.length === 1 && !outgoing[0].condition
          ? renderLinearHint(outgoing[0], depth)
          : null}
        {isIfNode && hasChildren && isExpanded
          ? outgoing.map((edge) => renderNode(edge.targetKey, depth + 1, edge, nextVisited))
          : null}
      </Box>
    );
  };

  const mainTree = (() => {
    if (!startKey) return null;
    const stack = [startKey];
    const result = [];
    while (stack.length > 0) {
      const key = stack.shift();
      if (!key || renderedKeys.has(key)) continue;
      renderedKeys.add(key);
      result.push(renderNode(key));
      const outgoing = adjacency.get(key) ?? [];
      outgoing.forEach((edge) => {
        if (edge?.targetKey) {
          stack.push(edge.targetKey);
        }
      });
    }
    return result;
  })();

  const danglingNodes = nodes.filter((node) => node.nodeKey && !renderedKeys.has(node.nodeKey));

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 320 },
        flexShrink: 0,
        borderRight: { xs: "none", md: 1 },
        borderColor: { md: "divider" },
        pb: 3,
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          px: 2,
          py: 1.5,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1">Workflow tree</Typography>
          <Button
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={onAddNode}
            variant="contained"
          >
            New
          </Button>
        </Stack>
      </Box>

      <List sx={{ px: 1, pt: 1, pb: 0 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => setWorkflowOpen((prev) => !prev)}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              {workflowOpen ? <FolderOpenIcon /> : <FolderIcon />}
            </ListItemIcon>
            <ListItemText
              primary="Workflow"
              secondary={`${nodes.length} node${nodes.length === 1 ? "" : "s"}`}
            />
            {workflowOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
        </ListItem>

        <Collapse in={workflowOpen} timeout="auto" unmountOnExit>
          <List disablePadding>
            {nodes.length === 0 ? (
              <ListItem sx={{ pl: 4 }}>
                <ListItemText
                  primary="No nodes yet. Use “New” to start building."
                  primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                />
              </ListItem>
            ) : (
              <>
                {mainTree}
                {danglingNodes.length > 0 ? (
                  <Box sx={{ pl: 4, pt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Unlinked nodes
                    </Typography>
                    {danglingNodes.map((node) => {
                      const entry = nodeMap.get(node.nodeKey);
                      if (!entry) return null;
                      return (
                        <ListItemButton
                          key={`dangling-${node.nodeKey}`}
                          onClick={() => onSelectNode(entry.index)}
                          sx={{ pl: 2 }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <InsertDriveFileIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={getNodeLabel(entry.node, entry.index)}
                            secondary={`Key: ${entry.node.nodeKey}`}
                          />
                        </ListItemButton>
                      );
                    })}
                  </Box>
                ) : null}
              </>
            )}
          </List>
        </Collapse>
      </List>
      <Divider sx={{ display: { xs: "block", md: "none" }, mt: 2 }} />
    </Box>
  );
}

WorkflowNodeList.propTypes = {
  nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  edges: PropTypes.arrayOf(PropTypes.object),
  selectedIndex: PropTypes.number.isRequired,
  startNodeId: PropTypes.string,
  activeNodeKey: PropTypes.string,
  onSelectNode: PropTypes.func.isRequired,
  onAddNode: PropTypes.func.isRequired,
};

WorkflowNodeList.defaultProps = {
  edges: [],
  startNodeId: "",
  activeNodeKey: "",
};
