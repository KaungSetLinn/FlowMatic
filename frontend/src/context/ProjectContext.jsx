import { createContext, useContext, useEffect, useState } from "react";
import { getProjects } from "../services/ProjectService";
import { CURRENT_PROJECT_ID } from "../constants";
import { useAuth } from "./AuthContext";

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const { isAuthorized, auth } = useAuth();

  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthorized === null) return;  // wait until auth check finishes
    if (!isAuthorized) return; // not logged in → no request

    const fetchProjects = async () => {
      try {
        const data = await getProjects(); // fetch projects from API

        // ✅ Extract the projects array from the response object
        const projectsArray = Array.isArray(data.projects) ? data.projects : [];
        setProjects(projectsArray);

        // Try to restore previously selected project from localStorage
        const savedProjectId = localStorage.getItem(CURRENT_PROJECT_ID);

        if (savedProjectId) {
          const previouslySelectedProject = projectsArray.find(
            (project) => project.project_id === savedProjectId
          );

          if (previouslySelectedProject) {
            setCurrentProject(previouslySelectedProject);
            setLoading(false);
            return; // Stop here — no need to select a fallback
          }
        }

        // Fallback: select first project only if no saved project found
      if (projectsArray.length > 0) {
        setCurrentProject(projectsArray[0]);
        const currentProjectId = projectsArray[0].project_id;
        localStorage.setItem(CURRENT_PROJECT_ID, currentProjectId)
      }

        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
      finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isAuthorized]);

  const handleProjectChange = (projectId) => {
    const selectedProject = projects.find((p) => p.project_id === projectId);

    if (selectedProject) {
      setCurrentProject(selectedProject);
      localStorage.setItem(CURRENT_PROJECT_ID, projectId);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        setProjects,
        currentProject,
        setCurrentProject,
        handleProjectChange,
        loading,
        error,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
