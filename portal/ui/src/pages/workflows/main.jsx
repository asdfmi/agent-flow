import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline } from "@mui/material";
import WorkflowsApp from "./App.jsx";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <StrictMode>
      <CssBaseline />
      <WorkflowsApp />
    </StrictMode>
  );
}
