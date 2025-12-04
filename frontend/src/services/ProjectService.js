import api from "../api";

export async function createProject(projectData) {
  try {
    const response = await api.post('/api/projects/', projectData);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getProjects() {
  try {
    const response = await api.get('/api/projects/');
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  } 
}

export async function getProjectById(projectId) {
  try {
    const response = await api.get(`/api/projects/${projectId}/`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  } 
}
