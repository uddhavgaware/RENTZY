import api from './api';

/**
 * ChatService provides a clean abstraction for the chat system.
 * Currently uses REST endpoints + short polling.
 * Can be swapped out for WebSockets later without changing the UI components.
 */
export const chatService = {
  // Fetch list of users the current user has conversations with
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  // Fetch the message history with a specific user
  getChatHistory: async (userId) => {
    const response = await api.get(`/chat/history/${userId}`);
    return response.data;
  },

  // Send a new message to a specific user
  sendMessage: async (receiverId, content) => {
    const response = await api.post(`/chat/send/${receiverId}`, content, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    return response.data;
  }
};
