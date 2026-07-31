import axios from 'axios';

// Get base URL from env or use default localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const assistantAPI = {
  chat: async (messages: { role: string; content: string }[]) => {
    return axios.post(`${API_URL}/assistant/chat`, { messages }, {
      // You can add headers here if we need auth for the assistant later
      withCredentials: true 
    });
  },
};
