import api from './api';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
// Extract base URL for websocket by removing /api if needed, assuming WS is on the root
const WS_URL = API_BASE_URL.replace('/api', '') + '/ws';

class ChatService {
  constructor() {
    this.stompClient = null;
    this.callbacks = [];
  }

  // Connect to WebSocket
  connect(userId, onMessageReceived) {
    if (this.stompClient && this.stompClient.active) return;
    
    // Add the callback to the list of listeners
    if (onMessageReceived) {
      this.callbacks.push(onMessageReceived);
    }

    const token = localStorage.getItem('token');
    
    const socket = new SockJS(WS_URL);
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to Chat WebSocket');
      // Subscribe to user-specific queue
      this.stompClient.subscribe(`/user/${userId}/queue/messages`, (message) => {
        if (message.body) {
          const parsedMessage = JSON.parse(message.body);
          this.callbacks.forEach(cb => cb(parsedMessage));
        }
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient !== null) {
      this.stompClient.deactivate();
    }
    console.log("Disconnected from Chat WebSocket");
    this.callbacks = [];
  }

  // Fetch list of users the current user has conversations with
  async getConversations() {
    const response = await api.get('/chat/conversations');
    return response.data;
  }

  // Fetch the message history with a specific user
  async getChatHistory(userId) {
    const response = await api.get(`/chat/history/${userId}`);
    return response.data;
  }

  // Send a new message to a specific user via REST
  async sendMessage(receiverId, content) {
    const response = await api.post(`/chat/send/${receiverId}`, content, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    return response.data;
  }
}

export const chatService = new ChatService();
