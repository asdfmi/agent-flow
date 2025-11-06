import PropTypes from "prop-types";
import {
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

function NodeListItem({ node, index, isSelected, isStart, isActive, onSelect }) {
  const label = node.label?.trim() || node.nodeKey || `Node ${index + 1}`;

  return (
    <ListItemButton
      selected={isSelected}
      onClick={onSelect}
      sx={{
        borderRadius: 1.5,
        mb: 1,
        alignItems: "flex-start",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
        <Typography variant="subtitle2" noWrap>
          {label}
        </Typography>
        <Chip
          size="small"
          color="default"
          label={node.type}
          sx={{ textTransform: "uppercase", fontSize: "0.65rem" }}
        />
        {isStart ? (
          <Chip size="small" color="success" label="Start" sx={{ fontSize: "0.65rem" }} />
        ) : null}
        {isActive ? (
          <Chip size="small" color="primary" label="Active" sx={{ fontSize: "0.65rem" }} />
        ) : null}
      </Stack>
      <ListItemText
        primaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
        primary={`Key: ${node.nodeKey || "-"}`}
      />
    </ListItemButton>
  );
}

NodeListItem.propTypes = {
  node: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  isSelected: PropTypes.bool.isRequired,
  isStart: PropTypes.bool.isRequired,
  isActive: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default function WorkflowNodeList({
  nodes,
  selectedIndex,
  startNodeId,
  activeNodeKey,
  onSelectNode,
  onAddNode,
}) {
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
          <Typography variant="subtitle1">Nodes</Typography>
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

      <List sx={{ px: 2, pt: 2, pb: 0 }}>
        {nodes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No nodes yet. Create your first node to begin.
          </Typography>
        ) : (
          nodes.map((node, index) => (
            <NodeListItem
              key={node.nodeKey || index}
              node={node}
              index={index}
              isSelected={index === selectedIndex}
              isStart={startNodeId ? startNodeId === node.nodeKey : index === 0}
              isActive={activeNodeKey ? activeNodeKey === node.nodeKey : false}
              onSelect={() => onSelectNode(index)}
            />
          ))
        )}
      </List>
      <Divider sx={{ display: { xs: "block", md: "none" }, mt: 2 }} />
    </Box>
  );
}

WorkflowNodeList.propTypes = {
  nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedIndex: PropTypes.number.isRequired,
  startNodeId: PropTypes.string,
  activeNodeKey: PropTypes.string,
  onSelectNode: PropTypes.func.isRequired,
  onAddNode: PropTypes.func.isRequired,
};

WorkflowNodeList.defaultProps = {
  startNodeId: "",
  activeNodeKey: "",
};
