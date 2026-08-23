import api from '@/lib/axios';

export interface AssistantMessage {
  _id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export const assistantAPI = {
  chat: (message: string) => api.post<{ success: boolean; response: string }>('/assistant/chat', { message }),
};
