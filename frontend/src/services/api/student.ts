import api from '@/lib/axios';

export const studentAPI = {
  // Dashboard
  async getDashboard() {
    const response = await api.get('/dashboard/student');
    return response.data;
  },

  // Progress
  async getProgress() {
    const response = await api.get('/dashboard/student/progress');
    return response.data;
  },

  // Achievements
  async getAchievements() {
    const response = await api.get('/dashboard/student/achievements');
    return response.data;
  },

  // Recommendations
  async getRecommendations() {
    const response = await api.get('/dashboard/student/recommendations');
    return response.data;
  },

  // Sessions
  async getSessions() {
    const response = await api.get('/sessions');
    return response.data;
  },

  async getSession(sessionId: string) {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  // Courses
  async getEnrolledCourses() {
    const response = await api.get('/courses/my');
    return response.data;
  },

  async getAvailableCourses() {
    const response = await api.get('/courses');
    return response.data;
  },

  async enrollInCourse(courseId: string) {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  async getCourseDetails(courseId: string) {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },
};

export default studentAPI;
