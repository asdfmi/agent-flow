import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { STEP_TYPES, SUCCESS_TYPES } from "../constants.js";
import {
  createDefaultSuccessConfig,
  getDefaultConfig,
  getSuccessType,
  parseNumber,
  cleanSuccessConfig,
} from "../utils/workflowBuilder.js";
import StepConfigFields from "./StepConfigFields.jsx";

function cloneStep(value) {
  if (!value) return null;
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // Fall back to JSON clone
    }
  }
  return JSON.parse(JSON.stringify(value));
}

export default function StepEditor({
  open,
  step,
  onSave,
  onDelete,
  canDelete,
  onClose,
  saving,
  error,
}) {
  const [draft, setDraft] = useState(cloneStep(step));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(cloneStep(step));
    setIsSaving(false);
  }, [step, open]);

  const isEditing = Boolean(draft);

  const handleUpdate = (updates) => {
    setDraft((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const handleTypeChange = (event) => {
    const value = event.target.value;
    handleUpdate({
      type: value,
      config: getDefaultConfig(value),
      successConfig: null,
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await onSave(draft);
      if (result !== false) {
        onClose();
      }
    } catch (error) {
      console.error("Failed to save step", error);
    } finally {
      setIsSaving(false);
    }
  };

  const successConfig = draft?.successConfig;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {isEditing ? `Edit step: ${draft?.stepKey || draft?.label || "Step"}` : "Add step"}
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {!isEditing ? (
          <Typography variant="body2" color="text.secondary">
            No step selected.
          </Typography>
        ) : null}
        {error ? (
          <Alert severity="error">
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              {error}
            </Typography>
          </Alert>
        ) : null}
        <Stack spacing={2}>
          {isEditing ? (
            <>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Step key"
                  value={draft.stepKey}
                  onChange={(event) => handleUpdate({ stepKey: event.target.value })}
                  fullWidth
                />
                <TextField
                  select
                  label="Type"
                  value={draft.type}
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
                value={draft.label}
                onChange={(event) => handleUpdate({ label: event.target.value })}
                fullWidth
              />
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Next step key"
                  value={draft.nextStepKey}
                  onChange={(event) => handleUpdate({ nextStepKey: event.target.value })}
                  fullWidth
                />
                <TextField
                  label="Exit step key"
                  value={draft.exitStepKey}
                  onChange={(event) => handleUpdate({ exitStepKey: event.target.value })}
                  helperText="Used by loop steps."
                  fullWidth
                />
              </Stack>
              <StepConfigFields
                type={draft.type}
                config={draft.config}
                onChange={(nextConfig) => handleUpdate({ config: nextConfig })}
              />
              <SuccessConfigEditor
                value={successConfig}
                onChange={(nextSuccess) => handleUpdate({ successConfig: nextSuccess })}
              />
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
        {onDelete ? (
          <Button
            variant="outlined"
            color="error"
            onClick={onDelete}
            disabled={!canDelete || !isEditing || saving || isSaving}
          >
            Delete step
          </Button>
        ) : <span />}
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!isEditing || saving || isSaving}
          >
            {saving || isSaving ? "Saving..." : "Save"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

StepEditor.propTypes = {
  open: PropTypes.bool.isRequired,
  step: PropTypes.shape({
    stepKey: PropTypes.string,
    label: PropTypes.string,
    type: PropTypes.string.isRequired,
    nextStepKey: PropTypes.string,
    exitStepKey: PropTypes.string,
    config: PropTypes.object,
    successConfig: PropTypes.object,
  }),
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  canDelete: PropTypes.bool,
  onClose: PropTypes.func,
  saving: PropTypes.bool,
  error: PropTypes.string,
};

StepEditor.defaultProps = {
  step: null,
  onDelete: null,
  canDelete: true,
  onClose: () => {},
  saving: false,
  error: "",
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
