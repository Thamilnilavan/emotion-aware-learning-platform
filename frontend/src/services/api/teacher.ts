import api from '@/lib/axios';

export const teacherAPI = {
  // Dashboard
  async getDashboard() {
    const response = await api.get('/teacher/dashboard');
    return response.data;
  },

  // Class Overview
  async getClassOverview() {
    const response = await api.get('/teacher/class-overview');
    return response.data;
  },

  // Students
  async getStudents() {
    const response = await api.get('/teacher/students');
    return response.data;
  },

  async getStudentSessions(studentId: string) {
    const response = await api.get(`/teacher/students/${studentId}/sessions`);
    return response.data;
  },

  async getStudentAnalytics(studentId: string) {
    const response = await api.get(`/teacher/students/${studentId}/analytics`);
    return response.data;
  },

  // Live Sessions
  async getLiveSessions() {
    const response = await api.get('/teacher/live-sessions');
    return response.data;
  },

  // At-Risk Students
  async getAtRiskStudents() {
    const response = await api.get('/teacher/at-risk');
    return response.data;
  },

  // Emotion Analytics
  async getEmotionAnalytics() {
    const response = await api.get('/teacher/emotions');
    return response.data;
  },

  // Engagement Reports
  async getEngagementReports(timeRange: string = '7d') {
    const response = await api.get('/teacher/engagement-reports', { params: { timeRange } });
    return response.data;
  },

  // Feedback
  async sendFeedback(data: { studentId: string; message: string; type: string }) {
    const response = await api.post('/teacher/feedback', data);
    return response.data;
  },

  // Notifications
  async getNotifications() {
    const response = await api.get('/teacher/notifications');
    return response.data;
  },

  // Early Warnings
  async getEarlyWarnings() {
    const response = await api.get('/teacher/earlywarnings');
    return response.data;
  },
};

export default teacherAPI;
