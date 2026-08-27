import api from '@/lib/axios';

const pendingCourseRequests = new Map<string, Promise<any>>();

function dedupeCourseRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
  const pending = pendingCourseRequests.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const next = request();
  pendingCourseRequests.set(key, next);
  void next.then(
    () => pendingCourseRequests.delete(key),
    () => pendingCourseRequests.delete(key),
  );
  return next;
}

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
    const response = await api.get('/sessions/my');
    return response.data;
  },

  async getSession(sessionId: string) {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  // Courses
  async getEnrolledCourses(page = 1, limit = 20) {
    return dedupeCourseRequest(`enrolled:${page}:${limit}`, async () => {
      const response = await api.get('/courses/my', { params: { page, limit } });
      return response.data;
    });
  },

  async getAvailableCourses(page = 1, limit = 20) {
    return dedupeCourseRequest(`available:${page}:${limit}`, async () => {
      const response = await api.get('/courses', { params: { page, limit } });
      return response.data;
    });
  },

  async enrollInCourse(courseId: string) {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  async getCourseDetails(courseId: string) {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },

  async getStudyPlans() {
    const response = await api.get('/planner');
    return response.data;
  },

  async createStudyPlan(data: { title: string; scheduledAt: string; durationMinutes: number }) {
    const response = await api.post('/planner', data);
    return response.data;
  },

  async deleteStudyPlan(planId: string) {
    const response = await api.delete(`/planner/${planId}`);
    return response.data;
  },
};

export default studentAPI;
