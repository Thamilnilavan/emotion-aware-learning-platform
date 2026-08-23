import api from '@/lib/axios';
import type { AxiosPromise } from 'axios';
import type { AuthResponse, User, UserConsent, UserPreferences } from '@/types';

export interface AppNotification {
  _id: string;
  title: string;
  type: 'feedback' | 'warning' | 'encouragement' | 'system';
  message: string;
  isRead: boolean;
  createdAt: string;
  senderId?: { name: string; email: string };
}

interface NotificationsResponse {
  success: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  pagination: { currentPage: number; totalPages: number; totalCount: number; limit: number };
}

// Navbar and inbox effects can mount together (and twice in React development
// Strict Mode). Reuse the same in-flight request instead of hitting the API for
// identical data multiple times.
const pendingNotificationRequests = new Map<string, AxiosPromise<NotificationsResponse>>();

function getNotifications(page = 1, limit = 20) {
  const key = `${page}:${limit}`;
  const pending = pendingNotificationRequests.get(key);
  if (pending) return pending;

  const request = api.get<NotificationsResponse>('/auth/notifications', { params: { page, limit } });
  pendingNotificationRequests.set(key, request);
  void request.then(
    () => pendingNotificationRequests.delete(key),
    () => pendingNotificationRequests.delete(key),
  );
  return request;
}

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
  getNotifications,
  markNotificationsRead: () =>
    api.put<{ success: boolean; updated: number }>('/auth/notifications/read'),
};
