import NavBar from "../../components/NavBar.jsx";
import WorkflowsPage from "./components/WorkflowsPage.jsx";

export default function WorkflowsApp() {
  return (
    <>
      <NavBar current="workflows" />
      <WorkflowsPage />
    </>
  );
}
