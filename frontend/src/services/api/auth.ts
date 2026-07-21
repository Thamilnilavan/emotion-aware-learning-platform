import api from '@/lib/axios';
import type { AuthResponse, User, UserConsent, UserPreferences } from '@/types';

export const authAPI = {
  register: (data: Record<string, any>) =>
    api.post<AuthResponse>('/auth/register', data),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  getMe: () => api.get<{ success: boolean; user: User }>('/auth/me'),
  updateConsent: (consentData: Partial<UserConsent>) =>
    api.put<{ success: boolean; user: User }>('/auth/consent', consentData),
  updatePreferences: (prefs: Partial<UserPreferences>) =>
    api.put<{ success: boolean; preferences: UserPreferences }>('/auth/preferences', prefs),
  deleteMyData: () =>
    api.delete<{ success: boolean; message: string; sessionsDeleted: number }>('/auth/data'),
  getNotifications: () =>
    api.get<{ success: boolean; notifications: unknown[] }>('/auth/notifications'),
};
