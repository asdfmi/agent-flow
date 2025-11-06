import { Box } from "@mui/material";
import NavBar from "../../components/NavBar.jsx";
import WorkflowBuilderPage from "./components/WorkflowBuilderPage.jsx";

export default function WorkflowBuilderApp() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar current="workflows" />
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <WorkflowBuilderPage />
      </Box>
    </Box>
  );
}
