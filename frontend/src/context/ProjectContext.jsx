import { createContext, useContext, useEffect, useState } from "react";
import { getProjects } from "../services/ProjectService";
import { CURRENT_PROJECT_ID } from "../constants";
import { useAuth } from "./AuthContext";

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const { isAuthorized } = useAuth();

  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthorized === null) return; // wait for auth check
    if (!isAuthorized) {
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);

        const savedProjectId = localStorage.getItem(CURRENT_PROJECT_ID);

        // Try to restore previously selected project
        if (savedProjectId) {
          const restored = fetchedProjects.find(
            (p) => p.project_id === savedProjectId
          );

          if (restored) {
            setCurrentProject(restored);
            setLoading(false);
            return;
          }
        }

        // Fallback: use first project
        if (fetchedProjects.length > 0) {
          setCurrentProject(fetchedProjects[0]);
          localStorage.setItem(
            CURRENT_PROJECT_ID,
            fetchedProjects[0].project_id
          );
        }

        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isAuthorized, projects]);

  const handleProjectChange = (projectId) => {
    const selected = projects.find((p) => p.project_id === projectId);

    if (selected) {
      setCurrentProject(selected);
      localStorage.setItem(CURRENT_PROJECT_ID, projectId);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        setProjects,
        currentProject,
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
