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
  createDefaultBranchEdge,
  createDefaultBranchCondition,
  getBranchConditionType,
  parseNumber,
} from "../utils/workflowBuilder.js";

export default function IfConfigFields({ edges, onChange }) {
  const list = Array.isArray(edges) ? edges : [];

  const updateBranch = (index, branch) => {
    const next = list.map((current, i) => (i === index ? branch : current));
    onChange(next);
  };

  const removeBranch = (index) => {
    const next = list.filter((_, i) => i !== index);
    onChange(next);
  };

  const addBranch = () => {
    onChange([...list, createDefaultBranchEdge()]);
  };

  return (
    <Stack spacing={1.5}>
      {list.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No conditional edges defined yet.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {list.map((branch, index) => (
            <Paper key={branch.edgeKey || index} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.25}>
                <Typography variant="subtitle2">Branch {index + 1}</Typography>
                <TextField
                  label="Target node key"
                  value={branch.targetKey ?? ""}
                  onChange={(event) =>
                    updateBranch(index, { ...branch, targetKey: event.target.value })
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
          Add edge
        </Button>
      </Box>
    </Stack>
  );
}

IfConfigFields.propTypes = {
  edges: PropTypes.arrayOf(
    PropTypes.shape({
      edgeKey: PropTypes.string,
      targetKey: PropTypes.string,
      condition: PropTypes.object,
      priority: PropTypes.number,
    })
  ),
  onChange: PropTypes.func.isRequired,
};

IfConfigFields.defaultProps = {
  edges: [],
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
  } else if (type === "delay") {
    content = (
      <TextField
        label="Delay (seconds)"
        type="number"
        value={value?.delay ?? ""}
        onChange={(event) =>
          onChange({
            delay: parseNumber(event.target.value) ?? 1,
          })
        }
        fullWidth
      />
    );
  } else if (type === "script") {
    content = (
      <TextField
        label="Script"
        value={value?.script?.code ?? ""}
        onChange={(event) =>
          onChange({
            script: { code: event.target.value },
          })
        }
        fullWidth
        multiline
        minRows={3}
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
