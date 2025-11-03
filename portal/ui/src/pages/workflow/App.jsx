import NavBar from "../../components/NavBar.jsx";
import WorkflowDetailPage from "./components/WorkflowDetailPage.jsx";

export default function WorkflowApp() {
  return (
    <>
      <NavBar current="workflows" />
      <WorkflowDetailPage />
    </>
  );
}
