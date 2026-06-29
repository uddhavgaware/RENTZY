import api from './api';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://rentxy.onrender.com/api' : 'http://localhost:8080/api');
// Extract base URL for websocket by removing /api if needed, assuming WS is on the root
const WS_URL = API_BASE_URL.replace('/api', '') + '/ws';

class ChatService {
  constructor() {
    this.stompClient = null;
    this.callbacks = [];
    this._userId = null;
    this._boundOnline = null;
  }

  // Connect to WebSocket
  connect(userId, onMessageReceived) {
    if (!userId) {
      console.warn('ChatService: Cannot connect without a valid userId');
      return;
    }

    this._userId = userId;

    // If already connected, just update the callback
    if (this.stompClient && this.stompClient.active) {
      if (onMessageReceived) {
        this.callbacks = [onMessageReceived];
      }
      return;
    }
    
    // Replace callbacks (don't accumulate stale ones from re-renders)
    this.callbacks = onMessageReceived ? [onMessageReceived] : [];

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('ChatService: No auth token found');
      return;
    }
    
    // STOMP client with a WebSocket factory — creates a FRESH SockJS on each
    // connection attempt. This is critical because SockJS instances are single-use;
    // after a disconnect they cannot be reused. Without this, reconnect after
    // going offline would silently fail.
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: function (str) {
        // Reduce noise — only log errors
        if (str.includes('ERROR')) console.error(str);
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

    this.stompClient.onWebSocketClose = (event) => {
      console.log('WebSocket connection closed, will attempt reconnect...');
    };

    this.stompClient.activate();

    // Listen for the browser/app coming back online and force a reconnect
    if (!this._boundOnline) {
      this._boundOnline = () => this.forceReconnect();
      window.addEventListener('online', this._boundOnline);
    }
  }

  // Force a fresh reconnect — useful when the device comes back online
  forceReconnect() {
    if (!this._userId) return;
    console.log('ChatService: Network back online, forcing reconnect...');

    // Deactivate the old client (if any) without triggering its internal reconnect
    if (this.stompClient) {
      try { this.stompClient.deactivate(); } catch (_) { /* ignore */ }
      this.stompClient = null;
    }

    // Re-establish with a fresh SockJS + STOMP client
    const currentCallbacks = [...this.callbacks];
    this.connect(this._userId, currentCallbacks[0] || null);
  }

  disconnect() {
    if (this.stompClient !== null) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    if (this._boundOnline) {
      window.removeEventListener('online', this._boundOnline);
      this._boundOnline = null;
    }
    this._userId = null;
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

  // Edit a message
  async editMessage(messageId, newContent) {
    const response = await api.put(`/chat/edit/${messageId}`, newContent, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    return response.data;
  }

  // Delete a message
  async deleteMessage(messageId) {
    const response = await api.delete(`/chat/delete/${messageId}`);
    return response.data;
  }

  // Mark message as read
  async markAsRead(messageId) {
    const response = await api.put(`/chat/read/${messageId}`);
    return response.data;
  }
}

export const chatService = new ChatService();
