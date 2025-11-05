import PropTypes from "prop-types";
import { Button, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function StepList({
  steps,
  selectedIndex,
  activeIndex,
  onSelect,
  onAdd,
  onRemove,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        width: { xs: "100%", md: 260 },
        flexShrink: 0,
      }}
    >
      <Stack spacing={1.5}>
        <Typography variant="subtitle1">Step order</Typography>
        {steps.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No steps yet. Add one to get started.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {steps.map((step, index) => {
              const isSelected = selectedIndex === index;
              const isActive = typeof activeIndex === "number" && activeIndex === index;
              return (
                <Button
                  key={step.stepKey || index}
                  variant={isSelected ? "contained" : isActive ? "outlined" : "text"}
                  color={isSelected ? "primary" : isActive ? "secondary" : "inherit"}
                  onClick={() => onSelect(index)}
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    bgcolor: (theme) =>
                      isActive && !isSelected
                        ? alpha(theme.palette.secondary.main, 0.08)
                        : undefined,
                  }}
                >
                  {step.stepKey || `Step ${index + 1}`}
                </Button>
              );
            })}
          </Stack>
        )}
        <Divider />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={onAdd} fullWidth>
            Add step
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => onRemove(selectedIndex)}
            disabled={selectedIndex < 0}
          >
            Remove
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

StepList.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedIndex: PropTypes.number.isRequired,
  activeIndex: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

StepList.defaultProps = {
  activeIndex: null,
};
