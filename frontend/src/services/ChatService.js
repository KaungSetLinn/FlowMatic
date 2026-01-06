// ChatService.js
import api from "../api";

export async function createChatroom(projectId, chatroomData) {
  try {
    const response = await api.post(
      `/api/projects/${projectId}/chatrooms/`,
      chatroomData
    );
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getChatrooms() {
  try {
    const response = await api.get('/api/chatrooms/');
    return response.data.chatrooms;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getChatroomById(chatroomId) {
  try {
    const response = await api.get(`/api/chatrooms/${chatroomId}/`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function updateChatroom(chatroomId, chatroomData) {
  try {
    const response = await api.put(
      `/api/chatrooms/${chatroomId}/`,
      chatroomData
    );
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function deleteChatroom(chatroomId) {
  try {
    const response = await api.delete(`/api/chatrooms/${chatroomId}/`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}