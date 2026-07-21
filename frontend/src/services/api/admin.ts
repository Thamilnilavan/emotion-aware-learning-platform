import api from '@/lib/axios';


export const adminAPI = {
  // Dashboard
  async getDashboard() {
    const response = await api.get(`/admin/dashboard`);
    return response.data;
  },

  // Users
  async getUsers(params?: { page?: number; limit?: number; role?: string; search?: string }) {
    const response = await api.get(`/admin/users`, { params });
    return response.data;
  },

  async createUser(data: { name: string; email: string; password: string; role: string; icbtNumber?: string; programme?: string }) {
    const response = await api.post(`/admin/users`, data);
    return response.data;
  },

  async updateUser(id: string, data: { role?: string; isActive?: boolean; name?: string }) {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Analytics
  async getAnalytics(timeRange: string = '7d') {
    const response = await api.get(`/admin/analytics`, { params: { timeRange } });
    return response.data;
  },

  // AI Monitoring
  async getAIMonitoring() {
    const response = await api.get(`/admin/ai-monitoring`);
    return response.data;
  },

  // Datasets
  async getDatasets() {
    const response = await api.get(`/admin/datasets`);
    return response.data;
  },

  // Research
  async getResearch() {
    const response = await api.get(`/admin/research`);
    return response.data;
  },

  // Notifications
  async getNotifications() {
    const response = await api.get(`/admin/notifications`);
    return response.data;
  },

  async createNotification(data: { title: string; message: string; type?: string }) {
    const response = await api.post(`/admin/notifications`, data);
    return response.data;
  },

  // Privacy
  async getPrivacy() {
    const response = await api.get(`/admin/privacy`);
    return response.data;
  },

  async createDeletionRequest(data: { userId: string; reason: string }) {
    const response = await api.post(`/admin/privacy/delete-request`, data);
    return response.data;
  },

  // Settings
  async getSettings() {
    const response = await api.get(`/admin/settings`);
    return response.data;
  },

  async updateSettings(section: string, settings: Record<string, unknown>) {
    const response = await api.put(`/admin/settings`, { section, settings });
    return response.data;
  },

  // System Health
  async getSystemHealth() {
    const response = await api.get(`/admin/system`);
    return response.data;
  },

  // Export
  async exportData() {
    const response = await api.get(`/admin/export`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default adminAPI;
