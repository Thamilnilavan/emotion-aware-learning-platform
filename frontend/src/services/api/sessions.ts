import api from '@/lib/axios';
import type { LearningSession } from '@/types';

export const sessionAPI = {
  start: (courseId?: string) =>
    api.post<{ success: boolean; sessionId: string }>('/sessions/start', { courseId }),
  sendWindow: (sessionId: string, windowData: Record<string, any>) =>
    api.post<{ success: boolean; windowCount: number }>(`/sessions/${sessionId}/window`, windowData),
  end: (sessionId: string) =>
    api.post<{ success: boolean; session: LearningSession }>(`/sessions/${sessionId}/end`),
  getMy: (page = 1, limit = 10) =>
    api.get<{ success: boolean; sessions: LearningSession[]; totalCount: number; currentPage: number; totalPages: number }>(
      '/sessions/my',
      { params: { page, limit } }
    ),
  getOne: (sessionId: string, full = false) =>
    api.get<{ success: boolean; session: LearningSession }>(`/sessions/${sessionId}`, { params: { full } }),
  getReport: (sessionId: string) =>
    api.get<{ success: boolean; session: LearningSession; insights: string[] }>(`/sessions/${sessionId}/report`),
};
