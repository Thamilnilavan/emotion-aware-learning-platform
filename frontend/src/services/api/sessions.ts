import api from '@/lib/axios';
import type { LearningSession } from '@/types';

export const sessionAPI = {
  start: (courseId?: string) =>
    api.post<{
      success: boolean;
      sessionId: string;
      reused?: boolean;
      overallProgress?: number;
      contentProgress?: Array<{
        contentIndex: number;
        positionSeconds: number;
        durationSeconds: number;
        percent: number;
        completed: boolean;
      }>;
      notes?: string;
    }>('/sessions/start', { courseId }),
  sendWindow: (sessionId: string, windowData: Record<string, any>) =>
    api.post<{ success: boolean; windowCount: number }>(`/sessions/${sessionId}/window`, windowData),
  updateProgress: (sessionId: string, progressData: {
    contentIndex: number;
    positionSeconds: number;
    durationSeconds: number;
    percent: number;
  }) => api.put<{
    success: boolean;
    contentIndex: number;
    contentProgress: number;
    overallProgress: number;
  }>(`/sessions/${sessionId}/progress`, progressData),
  updateNotes: (sessionId: string, notes: string) =>
    api.put<{ success: boolean; notes: string }>(`/sessions/${sessionId}/notes`, { notes }),
  recordIntervention: (sessionId: string, data: { type: string; message?: string | null; state: string; score: number }) =>
    api.post<{ success: boolean }>(`/sessions/${sessionId}/interventions`, data),
  end: (sessionId: string) =>
    api.post<{ success: boolean; session: LearningSession }>(`/sessions/${sessionId}/end`, {}, { timeout: 60000 }),
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
