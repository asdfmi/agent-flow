import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import WorkflowsApp from "./App.jsx";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <StrictMode>
      <ThemeProvider theme={createTheme()}>
        <CssBaseline />
        <WorkflowsApp />
      </ThemeProvider>
    </StrictMode>
  );
}
