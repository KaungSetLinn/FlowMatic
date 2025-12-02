import { createContext, useContext, useEffect, useState } from "react";
import { getProjects } from "../services/ProjectService";

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  // 🔹 Dummy data for now
  const dummyProjects = [
    { id: 1, name: "Project Alpha", description: "Main website redesign" },
    { id: 2, name: "Project Beta", description: "Mobile app launch" },
    { id: 3, name: "Project Gamma", description: "Internal tools update" },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects(); // fetch projects from API

        // ✅ Extract the projects array from the response object
        const projectsArray = Array.isArray(data.projects) ? data.projects : [];
        setProjects(projectsArray);

        // Set the first project as default if exists
        if (projectsArray.length > 0) {
          setCurrentProject(projectsArray[0]);
        }

        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleProjectChange = (projectId) => {
    console.log(projects)
    const selected = projects.find((p) => p.project_id === projectId);

    console.log(selected)
    if (selected) setCurrentProject(selected);
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
