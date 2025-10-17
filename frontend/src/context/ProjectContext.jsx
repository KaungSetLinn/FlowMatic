import { createContext, useContext, useEffect, useState } from "react";

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
    // todo: api callでプロジェクトリストを取得
    setProjects(dummyProjects)
    setCurrentProject(dummyProjects[0])
    setLoading(false)
  }, []);

  const handleProjectChange = (projectId) => {
    const selected = projects.find((p) => p.id === Number(projectId));
    if (selected) setCurrentProject(selected);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
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
