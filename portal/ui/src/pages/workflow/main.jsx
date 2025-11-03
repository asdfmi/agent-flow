import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import WorkflowApp from "./App.jsx";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <StrictMode>
      <ThemeProvider theme={createTheme()}>
        <CssBaseline />
        <WorkflowApp />
      </ThemeProvider>
    </StrictMode>
  );
}
