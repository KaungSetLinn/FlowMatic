import api from "../api";

export async function createTask(taskData) {
  try {
    // f28497cc-6801-46a1-ac69-dada7febd96c = 実際のprojectId
    const response = await api.post(`/api/projects/f28497cc-6801-46a1-ac69-dada7febd96c/tasks/`, taskData);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getTasks(projectId) {
    try {
        // f28497cc-6801-46a1-ac69-dada7febd96c = 実際のprojectId
    const response = await api.get(`/api/projects/f28497cc-6801-46a1-ac69-dada7febd96c/tasks/`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}