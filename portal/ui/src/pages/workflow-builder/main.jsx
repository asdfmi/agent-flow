import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import WorkflowBuilderApp from "./App.jsx";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <StrictMode>
      <ThemeProvider theme={createTheme()}>
        <CssBaseline />
        <WorkflowBuilderApp />
      </ThemeProvider>
    </StrictMode>
  );
}
