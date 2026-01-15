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

export async function getChatrooms(projectId) {
  try {
    const response = await api.get(`/api/projects/${projectId}/chatrooms/`);
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

/**
 * Get messages from a chatroom with pagination
 * @param {string} projectId - The project ID
 * @param {string} chatroomId - The chatroom ID
 * @param {number} page - Page number (starts from 1)
 * @param {number} perPage - Number of messages per page
 * @returns {Promise<Object>} Messages data with pagination info
 */
export async function getMessages(projectId, chatroomId, page = 1, perPage = 20) {
  try {
    const response = await api.get(
      `/api/projects/${projectId}/chatrooms/${chatroomId}/messages/`,
      {
        params: {
          p: page,
          per_page: perPage
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

/**
 * Post a message to a chatroom
 * @param {string} projectId - The project ID
 * @param {string} chatroomId - The chatroom ID
 * @param {Object} messageData - Message data
 * @param {string} messageData.content - Message content
 * @param {string} [messageData.user_id] - Optional user ID (uses authenticated user if not provided)
 * @returns {Promise<Object>} Created message data
 */
export async function postMessage(projectId, chatroomId, messageData) {
  try {
    const response = await api.post(
      `/api/projects/${projectId}/chatrooms/${chatroomId}/messages/`,
      messageData
    );
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}