import NavBar from "../../components/NavBar.jsx";
import WorkflowBuilderPage from "./components/WorkflowBuilderPage.jsx";

export default function WorkflowBuilderApp() {
  return (
    <>
      <NavBar current="workflows" />
      <WorkflowBuilderPage />
    </>
  );
}
