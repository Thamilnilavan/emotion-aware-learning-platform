import api from '@/lib/axios';
import type { Course, User } from '@/types';

export const dashboardAPI = {
  getStudent: () => api.get('/dashboard/student'),
  getTeacher: () => api.get('/dashboard/teacher'),
  getAdmin: () => api.get('/dashboard/admin'),
  getTeacherStudents: () => api.get('/teacher/students'),
  getStudentSessions: (studentId: string) =>
    api.get(`/teacher/students/${studentId}/sessions`),
  sendFeedback: (data: { studentId: string; message: string; type: string }) =>
    api.post('/teacher/feedback', data),
  getEarlyWarnings: () => api.get('/teacher/earlywarnings'),
  getAdminUsers: (params: Record<string, any>) =>
    api.get('/admin/users', { params }),
  createUser: (data: Record<string, any>) => api.post('/admin/users', data),
  updateUser: (id: string, data: Record<string, any>) =>
    api.put(`/admin/users/${id}`, data),
  deactivateUser: (id: string) => api.delete(`/admin/users/${id}`),
  exportData: () => api.get('/admin/export', { responseType: 'blob' }),
  getSystemStatus: () => api.get('/admin/system'),
};

export const coursesAPI = {
  getAll: () => api.get<{ success: boolean; courses: Course[] }>('/courses'),
  getMy: () => api.get<{ success: boolean; courses: Course[] }>('/courses/my'),
  getById: (id: string) => api.get<{ success: boolean; course: Course }>(`/courses/${id}`),
  create: (data: Record<string, any>) =>
    api.post<{ success: boolean; course: Course }>('/courses', data),
  update: (id: string, data: Record<string, any>) =>
    api.put<{ success: boolean; course: Course }>(`/courses/${id}`, data),
  addStudent: (id: string, email: string) =>
    api.post(`/courses/${id}/students`, { email }),
  removeStudent: (id: string, studentId: string) =>
    api.delete(`/courses/${id}/students/${studentId}`),
  uploadVideo: (data: FormData, onProgress?: (percentage: number) => void) =>
    api.post('/courses/upload-video', data, {
      timeout: 10 * 60 * 1000,
      onUploadProgress: (event) => {
        if (event.total && onProgress) onProgress(Math.round((event.loaded * 100) / event.total));
      },
    }),
  uploadMaterial: (data: FormData, onProgress?: (percentage: number) => void) =>
    api.post('/courses/upload-material', data, {
      timeout: 5 * 60 * 1000,
      onUploadProgress: (event) => {
        if (event.total && onProgress) onProgress(Math.round((event.loaded * 100) / event.total));
      },
    }),
  enroll: (id: string) => api.post<{ success: boolean }>(`/courses/${id}/enroll`),
};
