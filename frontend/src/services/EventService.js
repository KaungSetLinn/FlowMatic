import api from "../api";

export async function createEvent(projectId, eventData) {
    try {
    const response = await api.post(`/api/projects/${projectId}/events/`, eventData);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getEvents(projectId) {
    try {
        // f28497cc-6801-46a1-ac69-dada7febd96c = 実際のprojectId
    const response = await api.get(`/api/projects/${projectId}/events/`);
    return response.data.events;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function updateEvent(projectId, eventId, eventData) {
    try {
        // f28497cc-6801-46a1-ac69-dada7febd96c = 実際のprojectId
    const response = await api.put(`/api/projects/${projectId}/events/${eventId}/`, eventData);
    return response.data.events;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}