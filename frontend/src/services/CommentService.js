import api from "../api";

export async function createComment(projectId, taskId, newComment) {
    try {
        const response = await api.post(`/api/projects/${projectId}/tasks/${taskId}/comments/`, newComment)

        return response.data;
    } catch (error) {
        console.error("API Error:", error);
    throw error;
    }
}