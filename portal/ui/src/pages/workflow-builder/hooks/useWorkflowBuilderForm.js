import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createEmptyStep, toEditableStep } from "../utils/workflowBuilder.js";

const EMPTY_FORM = {
  slug: "",
  title: "",
  description: "",
  startStepId: "",
  steps: [],
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

    const steps = Array.isArray(nextWorkflow.steps)
      ? nextWorkflow.steps.map(toEditableStep)
      : [];

    lastSyncRef.current = { id: nextWorkflow.id, updatedAt: nextWorkflow.updatedAt };
    setForm({
      slug: nextWorkflow.slug ?? "",
      title: nextWorkflow.title ?? "",
      description: nextWorkflow.description ?? "",
      startStepId: nextWorkflow.startStepId ?? "",
      steps,
    });
    setSelectedIndex((current) => {
      if (steps.length === 0) return -1;
      if (preserveSelection && current >= 0) {
        return Math.min(current, steps.length - 1);
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
    setForm((prev) => ({ ...prev, startStepId: event.target.value }));
  }, []);

  const handleAddStep = useCallback(() => {
    let nextForm = null;
    let nextIndex = -1;
    setForm((prev) => {
      const newStep = createEmptyStep(prev.steps);
      const steps = [...prev.steps, newStep];
      const startStepId = prev.startStepId || (steps[0]?.stepKey ?? "");
      nextIndex = steps.length - 1;
      nextForm = { ...prev, steps, startStepId };
      return nextForm;
    });
    if (nextIndex >= 0) {
      setSelectedIndex(nextIndex);
    }
    return nextForm;
  }, []);

  const handleRemoveStep = useCallback((index) => {
    if (index < 0) return null;
    let nextForm = null;
    setForm((prev) => {
      if (index >= prev.steps.length) return prev;
      const steps = prev.steps.filter((_, i) => i !== index);
      const startStepId = steps.some((step) => step.stepKey === prev.startStepId)
        ? prev.startStepId
        : steps[0]?.stepKey ?? "";
      setSelectedIndex((current) => {
        if (steps.length === 0) return -1;
        if (current > index) return current - 1;
        if (current === index) return Math.min(index, steps.length - 1);
        return current;
      });
      nextForm = { ...prev, steps, startStepId };
      return nextForm;
    });
    return nextForm;
  }, []);

  const handleSelectStep = useCallback((index) => {
    setSelectedIndex(index);
  }, []);

  const handleStepChange = useCallback((index, updates) => {
    let nextForm = null;
    setForm((prev) => {
      if (index < 0 || index >= prev.steps.length) return prev;
      const currentStep = prev.steps[index];
      const nextStep = { ...currentStep, ...updates };
      const steps = prev.steps.map((step, i) => (i === index ? nextStep : step));
      const startStepId = currentStep.stepKey === prev.startStepId && nextStep.stepKey
        ? nextStep.stepKey
        : prev.startStepId;
      nextForm = { ...prev, steps, startStepId };
      return nextForm;
    });
    return nextForm;
  }, []);

  const selectedStep = useMemo(
    () => (selectedIndex >= 0 ? form.steps[selectedIndex] ?? null : null),
    [form.steps, selectedIndex]
  );

  return {
    form,
    selectedIndex,
    selectedStep,
    handleMetaChange,
    handleStartChange,
    handleAddStep,
    handleRemoveStep,
    handleSelectStep,
    handleStepChange,
    syncFromWorkflow,
  };
}
