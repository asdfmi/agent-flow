import PropTypes from "prop-types";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { BRANCH_CONDITION_TYPES } from "../constants.js";
import {
  createDefaultBranch,
  createDefaultBranchCondition,
  getBranchConditionType,
} from "../utils/workflowBuilder.js";

export default function IfConfigFields({ config, onChange }) {
  const branches = Array.isArray(config.branches) ? config.branches : [];

  const updateBranch = (index, branch) => {
    const nextBranches = branches.map((current, i) => (i === index ? branch : current));
    onChange({ ...config, branches: nextBranches });
  };

  const removeBranch = (index) => {
    const nextBranches = branches.filter((_, i) => i !== index);
    onChange({ ...config, branches: nextBranches });
  };

  const addBranch = () => {
    const nextBranches = [...branches, createDefaultBranch()];
    onChange({ ...config, branches: nextBranches });
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Branches</Typography>
      {branches.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No branches defined yet.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {branches.map((branch, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.25}>
                <Typography variant="subtitle2">Branch {index + 1}</Typography>
                <TextField
                  label="Next step key"
                  value={branch.next ?? ""}
                  onChange={(event) =>
                    updateBranch(index, { ...branch, next: event.target.value })
                  }
                  fullWidth
                />
                <BranchConditionEditor
                  value={branch.condition}
                  onChange={(condition) => updateBranch(index, { ...branch, condition })}
                />
                <Box textAlign="right">
                  <Button color="error" size="small" onClick={() => removeBranch(index)}>
                    Remove
                  </Button>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
      <Box>
        <Button variant="outlined" size="small" onClick={addBranch}>
          Add branch
        </Button>
      </Box>
    </Stack>
  );
}

IfConfigFields.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

function BranchConditionEditor({ value, onChange }) {
  const type = getBranchConditionType(value);

  const handleTypeChange = (event) => {
    const nextType = event.target.value;
    onChange(createDefaultBranchCondition(nextType));
  };

  let content = null;
  if (type === "visible" || type === "exists") {
    content = (
      <TextField
        label="XPath"
        value={value?.[type]?.xpath ?? ""}
        onChange={(event) =>
          onChange({
            [type]: { xpath: event.target.value },
          })
        }
        fullWidth
      />
    );
  } else if (type === "urlIncludes") {
    content = (
      <TextField
        label="Substring"
        value={value?.urlIncludes ?? ""}
        onChange={(event) =>
          onChange({
            urlIncludes: event.target.value,
          })
        }
        fullWidth
      />
    );
  }

  return (
    <Stack spacing={1.25}>
      <TextField
        select
        label="Condition type"
        value={type}
        onChange={handleTypeChange}
        fullWidth
      >
        {BRANCH_CONDITION_TYPES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      {content}
    </Stack>
  );
}

BranchConditionEditor.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

BranchConditionEditor.defaultProps = {
  value: null,
};
