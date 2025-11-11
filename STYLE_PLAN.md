# MUI Default Styling Plan

Goal: remove all custom styling from JSX components and fall back to Material UI defaults. Work through the repository in manageable chunks so behaviour stays reviewable.

## Component Inventory

Workflow builder:
1. `portal/ui/src/pages/workflow-builder/components/WorkflowBuilderPage.jsx`
2. `portal/ui/src/pages/workflow-builder/components/GraphViewport.jsx`
3. `portal/ui/src/pages/workflow-builder/components/NodeDetailPanel.jsx`
4. `portal/ui/src/pages/workflow-builder/components/WorkflowNodeList.jsx`
5. `portal/ui/src/pages/workflow-builder/components/WorkflowRunHistory.jsx`
6. `portal/ui/src/components/ExecutionViewerModal.jsx`
7. `portal/ui/src/pages/workflow-builder/components/ClickConfigFields.jsx`
8. `portal/ui/src/pages/workflow-builder/components/FillConfigFields.jsx`
9. `portal/ui/src/pages/workflow-builder/components/PressConfigFields.jsx`
10. `portal/ui/src/pages/workflow-builder/components/ScrollConfigFields.jsx`
11. `portal/ui/src/pages/workflow-builder/components/NavigateConfigFields.jsx`
12. `portal/ui/src/pages/workflow-builder/components/ScriptConfigFields.jsx`
13. `portal/ui/src/pages/workflow-builder/components/ExtractTextConfigFields.jsx`
14. `portal/ui/src/pages/workflow-builder/components/LogConfigFields.jsx`
15. `portal/ui/src/pages/workflow-builder/components/FallbackConfigFields.jsx`
16. `portal/ui/src/pages/workflow-builder/components/NodeConfigFields.jsx`
17. `portal/ui/src/components/NavBar.jsx`

Workflows list:
18. `portal/ui/src/pages/workflows/components/WorkflowsPage.jsx`
19. `portal/ui/src/pages/workflows/App.jsx`

Entry points:
20. `portal/ui/src/pages/workflows/main.jsx`
21. `portal/ui/src/pages/workflow-builder/main.jsx`
22. `portal/ui/src/pages/workflow-builder/App.jsx`

## Execution Steps

1. **Audit per file** – remove `sx`, `style`, `variant`, `color`, spacing props, and theme/token references. Replace with bare components (`Box` → `div`, `Typography` → default tags) where MUI adds unavoidable styling.
2. **Replace layout helpers** – where `Stack`, `Box`, `Paper`, etc. were only used for spacing/styling, switch to plain HTML or the simplest MUI component without extra props.
3. **Config subcomponents** – ensure each config field component uses plain `div`/`label`/`input` or bare `TextField` without styling props.
4. **NavBar / Execution modal** – strip AppBar/Dialog custom props, keeping minimal structure.
5. **Manually verify** – after each batch (e.g., workflow builder core, config fields, nav/modal, workflows list), run through the UI to ensure functionality remains even if presentation downgrades.

Tackle in the above order so larger containers go first, followed by shared widgets and finally entry points. Update this document as sections are completed. 
