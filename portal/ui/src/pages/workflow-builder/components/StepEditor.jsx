import PropTypes from "prop-types";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BRANCH_CONDITION_TYPES, STEP_TYPES, SUCCESS_TYPES } from "../constants.js";
import {
  createDefaultBranch,
  createDefaultBranchCondition,
  createDefaultSuccessConfig,
  getBranchConditionType,
  getDefaultConfig,
  getSuccessType,
  parseNumber,
  cleanSuccessConfig,
} from "../utils/workflowBuilder.js";

export default function StepEditor({ step, onChange }) {
  if (!step) {
    return (
      <Paper variant="outlined" sx={{ p: 3, flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Select a step to configure it.
        </Typography>
      </Paper>
    );
  }

  const handleTypeChange = (event) => {
    const value = event.target.value;
    onChange({
      type: value,
      config: getDefaultConfig(value),
      successConfig: null,
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, flexGrow: 1 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Step key"
            value={step.stepKey}
            onChange={(event) => onChange({ stepKey: event.target.value })}
            fullWidth
          />
          <TextField
            select
            label="Type"
            value={step.type}
            onChange={handleTypeChange}
            fullWidth
          >
            {STEP_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <TextField
          label="Label"
          value={step.label}
          onChange={(event) => onChange({ label: event.target.value })}
          fullWidth
        />
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Next step key"
            value={step.nextStepKey}
            onChange={(event) => onChange({ nextStepKey: event.target.value })}
            fullWidth
          />
          <TextField
            label="Exit step key"
            value={step.exitStepKey}
            onChange={(event) => onChange({ exitStepKey: event.target.value })}
            helperText="Used by loop steps."
            fullWidth
          />
        </Stack>
        <StepConfigEditor
          step={step}
          onChange={(config) => onChange({ config })}
        />
        <SuccessConfigEditor
          value={step.successConfig}
          onChange={(successConfig) => onChange({ successConfig })}
        />
      </Stack>
    </Paper>
  );
}

StepEditor.propTypes = {
  step: PropTypes.shape({
    stepKey: PropTypes.string,
    label: PropTypes.string,
    type: PropTypes.string.isRequired,
    nextStepKey: PropTypes.string,
    exitStepKey: PropTypes.string,
    config: PropTypes.object,
    successConfig: PropTypes.object,
  }),
  onChange: PropTypes.func.isRequired,
};

StepEditor.defaultProps = {
  step: null,
};

function StepConfigEditor({ step, onChange }) {
  const config = step.config && typeof step.config === "object"
    ? step.config
    : getDefaultConfig(step.type);

  const updateConfig = (updates) => {
    onChange({ ...config, ...updates });
  };

  switch (step.type) {
    case "navigate":
      return (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Navigate settings</Typography>
          <TextField
            label="URL"
            value={config.url ?? ""}
            onChange={(event) => updateConfig({ url: event.target.value })}
            fullWidth
          />
          <TextField
            label="waitUntil"
            value={config.waitUntil ?? ""}
            onChange={(event) => updateConfig({ waitUntil: event.target.value })}
            helperText="Optional (load, domcontentloaded, networkidle, commit)"
            fullWidth
          />
        </Stack>
      );
    case "scroll":
      return (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Scroll settings</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="dx"
              type="number"
              value={config.dx ?? ""}
              onChange={(event) => updateConfig({ dx: parseNumber(event.target.value) })}
              fullWidth
            />
            <TextField
              label="dy"
              type="number"
              value={config.dy ?? ""}
              onChange={(event) => updateConfig({ dy: parseNumber(event.target.value) })}
              fullWidth
            />
          </Stack>
        </Stack>
      );
    case "click": {
      const options = config.options && typeof config.options === "object" ? config.options : {};
      const updateOptions = (updates) => {
        const next = { ...options, ...updates };
        Object.keys(next).forEach((key) => {
          if (next[key] === null || next[key] === "" || typeof next[key] === "undefined") {
            delete next[key];
          }
        });
        updateConfig({ options: next });
      };
      return (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Click settings</Typography>
          <TextField
            label="XPath"
            value={config.xpath ?? ""}
            onChange={(event) => updateConfig({ xpath: event.target.value })}
            fullWidth
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Button"
              value={options.button ?? ""}
              onChange={(event) => updateOptions({ button: event.target.value || null })}
              helperText="Optional"
              fullWidth
            >
              <MenuItem value=""><em>Default</em></MenuItem>
              <MenuItem value="left">left</MenuItem>
              <MenuItem value="right">right</MenuItem>
              <MenuItem value="middle">middle</MenuItem>
            </TextField>
            <TextField
              label="Click count"
              type="number"
              value={options.clickCount ?? ""}
              onChange={(event) => updateOptions({ clickCount: parseNumber(event.target.value) })}
              helperText="Optional"
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Delay (ms)"
              type="number"
              value={options.delay ?? ""}
              onChange={(event) => updateOptions({ delay: parseNumber(event.target.value) })}
              helperText="Optional"
              fullWidth
            />
            <TextField
              label="Timeout (ms)"
              type="number"
              value={options.timeout ?? ""}
              onChange={(event) => updateOptions({ timeout: parseNumber(event.target.value) })}
              helperText="Optional"
              fullWidth
            />
          </Stack>
        </Stack>
      );
    }
    case "fill":
      return (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Fill settings</Typography>
          <TextField
            label="XPath"
            value={config.xpath ?? ""}
            onChange={(event) => updateConfig({ xpath: event.target.value })}
            fullWidth
          />
          <TextField
            label="Value"
            value={config.value ?? ""}
            onChange={(event) => updateConfig({ value: event.target.value })}
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(config.clear)}
                onChange={(event) => updateConfig({ clear: event.target.checked })}
              />
            }
            label="Clear before typing"
          />
        </Stack>
      );
    case "press":
      return (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Press settings</Typography>
          <TextField
            label="XPath"
            value={config.xpath ?? ""}
            onChange={(event) => updateConfig({ xpath: event.target.value })}
            fullWidth
          />
          <TextField
            label="Key"
            value={config.key ?? ""}
            onChange={(event) => updateConfig({ key: event.target.value })}
            helperText='Example: "Enter"'
            fullWidth
          />
          <TextField
            label="Delay (ms)"
            type="number"
            value={config.delay ?? ""}
            onChange={(event) => updateConfig({ delay: parseNumber(event.target.value) })}
            helperText="Optional"
            fullWidth
          />
        </Stack>
      );
    case "log":
      return (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Log settings</Typography>
          <TextField
            label="Target"
            value={config.target ?? "browgent"}
            onChange={(event) => updateConfig({ target: event.target.value })}
            fullWidth
          />
          <TextField
            select
            label="Level"
            value={config.level ?? "info"}
            onChange={(event) => updateConfig({ level: event.target.value })}
            fullWidth
          >
            <MenuItem value="info">info</MenuItem>
            <MenuItem value="warn">warn</MenuItem>
            <MenuItem value="error">error</MenuItem>
          </TextField>
          <TextField
            label="Message"
            value={config.message ?? ""}
            onChange={(event) => updateConfig({ message: event.target.value })}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      );
    case "script":
      return (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Script settings</Typography>
          <TextField
            label="JavaScript code"
            value={config.code ?? ""}
            onChange={(event) => updateConfig({ code: event.target.value })}
            multiline
            minRows={6}
            fullWidth
          />
          <TextField
            label="Store result as variable"
            value={config.as ?? ""}
            onChange={(event) => updateConfig({ as: event.target.value })}
            helperText="Optional (execution variables)"
            fullWidth
          />
        </Stack>
      );
    case "extract_text":
      return (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Extract text settings</Typography>
          <TextField
            label="XPath"
            value={config.xpath ?? ""}
            onChange={(event) => updateConfig({ xpath: event.target.value })}
            fullWidth
          />
          <TextField
            label="Store result as variable"
            value={config.as ?? ""}
            onChange={(event) => updateConfig({ as: event.target.value })}
            fullWidth
          />
        </Stack>
      );
    case "if": {
      const branches = Array.isArray(config.branches) ? config.branches : [];
      const updateBranch = (idx, branch) => {
        const nextBranches = branches.map((item, i) => (i === idx ? branch : item));
        updateConfig({ branches: nextBranches });
      };
      const removeBranch = (idx) => {
        const nextBranches = branches.filter((_, i) => i !== idx);
        updateConfig({ branches: nextBranches });
      };
      const addBranch = () => {
        const nextBranches = [...branches, createDefaultBranch()];
        updateConfig({ branches: nextBranches });
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
    case "loop":
      return (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Loop settings</Typography>
          <TextField
            label="Times"
            type="number"
            value={config.times ?? ""}
            onChange={(event) => updateConfig({ times: parseNumber(event.target.value) })}
            helperText="Use next/exit step keys to control loop flow"
            fullWidth
          />
        </Stack>
      );
    case "wait":
    default:
      return (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">No additional configuration</Typography>
          <Typography variant="body2" color="text.secondary">
            Use the success condition area below to wait for a delay or element.
          </Typography>
        </Stack>
      );
  }
}

StepConfigEditor.propTypes = {
  step: PropTypes.shape({
    type: PropTypes.string.isRequired,
    config: PropTypes.object,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

function SuccessConfigEditor({ value, onChange }) {
  const type = getSuccessType(value);

  const handleTypeChange = (event) => {
    const nextType = event.target.value;
    if (!nextType) {
      onChange(null);
      return;
    }
    onChange(createDefaultSuccessConfig(nextType));
  };

  const updateSuccess = (updater) => {
    const baseType = type || "delay";
    const base = value ?? createDefaultSuccessConfig(baseType);
    const next = updater(base);
    onChange(cleanSuccessConfig(next));
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Success condition</Typography>
      <TextField
        select
        label="Condition type"
        value={type}
        onChange={handleTypeChange}
        fullWidth
      >
        {SUCCESS_TYPES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      {type ? (
        <>
          <TextField
            label="Timeout (seconds)"
            type="number"
            value={value?.timeout ?? ""}
            onChange={(event) =>
              updateSuccess((current) => ({
                ...current,
                timeout: parseNumber(event.target.value),
              }))
            }
            fullWidth
          />
          {renderSuccessFields(type, value, updateSuccess)}
        </>
      ) : null}
    </Stack>
  );
}

SuccessConfigEditor.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

SuccessConfigEditor.defaultProps = {
  value: null,
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

function renderSuccessFields(type, success, updateSuccess) {
  const condition = success?.condition ?? {};
  switch (type) {
    case "delay":
      return (
        <TextField
          label="Delay (seconds)"
          type="number"
          value={typeof condition.delay === "number" ? condition.delay : ""}
          onChange={(event) =>
            updateSuccess((current) => ({
              ...current,
              condition: { delay: parseNumber(event.target.value) },
            }))
          }
          fullWidth
        />
      );
    case "visible":
    case "exists":
      return (
        <TextField
          label="XPath"
          value={condition[type]?.xpath ?? ""}
          onChange={(event) =>
            updateSuccess((current) => ({
              ...current,
              condition: { [type]: { xpath: event.target.value } },
            }))
          }
          fullWidth
        />
      );
    case "urlIncludes":
      return (
        <TextField
          label="Substring"
          value={condition.urlIncludes ?? ""}
          onChange={(event) =>
            updateSuccess((current) => ({
              ...current,
              condition: { urlIncludes: event.target.value },
            }))
          }
          fullWidth
        />
      );
    case "script":
      return (
        <TextField
          label="JavaScript code"
          value={condition.script?.code ?? ""}
          onChange={(event) =>
            updateSuccess((current) => ({
              ...current,
              condition: { script: { code: event.target.value } },
            }))
          }
          multiline
          minRows={4}
          fullWidth
        />
      );
    default:
      return null;
  }
}
