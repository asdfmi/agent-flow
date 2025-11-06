import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Handle, Position } from "reactflow";

export default function WorkflowStepNode({ data }) {
  const {
    label,
    type,
    description,
    isSelected,
    isActive,
    isStart,
    index,
  } = data;

  const borderColor = isActive
    ? "secondary.main"
    : isSelected
      ? "primary.main"
      : "divider";

  const backgroundColor = (theme) => {
    if (isActive) return alpha(theme.palette.secondary.light, 0.18);
    if (isSelected) return alpha(theme.palette.primary.light, 0.16);
    return theme.palette.background.paper;
  };

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: 2,
        borderColor,
        bgcolor: backgroundColor,
        boxShadow: isSelected ? 4 : 1,
        px: 2,
        py: 1.5,
        minWidth: 200,
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" noWrap>
            {label}
          </Typography>
          <Chip
            size="small"
            label={type}
            color="default"
            sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}
          />
        </Stack>
        {isStart ? (
          <Chip
            size="small"
            color="success"
            label="Start"
            sx={{ alignSelf: "flex-start", fontSize: "0.7rem" }}
          />
        ) : null}
        {description ? (
          <Typography variant="caption" color="text.secondary" noWrap>
            {description}
          </Typography>
        ) : null}
        <Typography variant="caption" color="text.disabled">
          Step #{index + 1}
        </Typography>
      </Stack>
    </Box>
  );
}

WorkflowStepNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    description: PropTypes.string,
    isSelected: PropTypes.bool,
    isActive: PropTypes.bool,
    isStart: PropTypes.bool,
    index: PropTypes.number.isRequired,
  }).isRequired,
};
