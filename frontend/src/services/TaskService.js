import api from "../api";

export async function createTask(projectId, taskData) {
  try {
    // f28497cc-6801-46a1-ac69-dada7febd96c = 実際のprojectId
    const response = await api.post(`/api/projects/${projectId}/tasks/`, taskData);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getTasks(projectId) {
    try {
        // f28497cc-6801-46a1-ac69-dada7febd96c = 実際のprojectId
    const response = await api.get(`/api/projects/${projectId}/tasks/`);
    return response.data.tasks;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getTaskById(projectId, taskId) {
  const response = await api.get(
    `/api/projects/${projectId}/tasks/${taskId}/`
  );
  return response.data;
}

export async function updateTask(projectId, taskId, taskData) {
  try {
    // Update a specific task within a project
    const response = await api.put(`/api/projects/${projectId}/tasks/${taskId}/`, taskData);

    console.log(response.data)
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function deleteTask(projectId, taskId) {
  try {
    await api.delete(`/api/projects/${projectId}/tasks/${taskId}/`);
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}