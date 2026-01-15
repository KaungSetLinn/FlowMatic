import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoutes from "./components/ProtectedRoutes";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MemberInvitationModal from "./pages/MemberInvitationModal";
import AccountSettings from "./pages/AccountSettings";
import Project from "./pages/Project";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Task from "./pages/Task";
import Calendar from "./pages/Calendar";
import Chat from "./pages/Chat";
import Files from "./pages/Files";
import { ProjectProvider } from "./context/ProjectContext";
import NewTaskForm from "./components/NewTaskForm";
import NewProjectForm from "./components/NewProjectForm";
import GanttChart from "./pages/GanttChart";
import ProjectDetail from "./pages/ProjectDetail";

function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoutes />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/project" element={<Project />} />
              <Route path="/project/new" element={<NewProjectForm />} />
              <Route path="/task" element={<Task />} />
              <Route path="/task/new" element={<NewTaskForm />} />
              <Route path="/invite" element={<MemberInvitationModal />} />
              <Route path="/account" element={<AccountSettings />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/files" element={<Files />} />
              <Route path="/gantt-chart" element={<GanttChart />} />
              <Route path="/project/:projectId/edit" element={<ProjectDetail />} />
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
  );
}

export default App;