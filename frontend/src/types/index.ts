export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserConsent {
  given: boolean;
  givenAt?: string;
  webcamConsent: boolean;
  emotionConsent: boolean;
  attentionConsent: boolean;
  retentionConsent: boolean;
}

export interface UserPreferences {
  notificationSensitivity: 'low' | 'medium' | 'high';
  darkMode: boolean;
  focusGoal: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  icbtNumber?: string;
  programme?: string;
  consent: UserConsent;
  preferences: UserPreferences;
  isActive?: boolean;
  lastLogin?: string;
  enrolledCourses?: string[];
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface EngagementWindow {
  timestamp: string;
  score: number;
  state: string;
  dominantEmotion: string;
  attentionScore: number;
  emotionValence: number;
  interactionScore: number;
  interventionFired?: boolean;
  interventionType?: string | null;
}

export interface SessionSummary {
  averageScore: number;
  peakScore: number;
  lowestScore: number;
  peakFocusMinute: string;
  dominantEmotion: string;
  totalDistractions: number;
  totalInterventions: number;
  focusPercentage: number;
  emotionDistribution?: Record<string, number>;
}

export interface LearningSession {
  _id: string;
  userId: string;
  courseId?: { _id: string; title: string } | string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  windows?: EngagementWindow[];
  status: string;
  summary: SessionSummary;
}

export interface FrameResult {
  emotion: string;
  confidence: number;
  valence: number;
  attention: boolean;
  yaw?: number;
  pitch?: number;
  interaction: number;
  face_detected?: boolean;
  demo_mode?: boolean;
  error?: boolean;
  timestamp?: string;
}

export interface Intervention {
  type: 'NUDGE' | 'ALERT' | 'PAUSE' | 'SUPPORT' | 'BREAK';
  message: string | null;
  pauseVideo: boolean;
  showTimer?: boolean;
}

export interface Course {
  _id: string;
  title: string;
  description?: string;
  teacherId: { _id: string; name: string; email?: string } | string;
  enrolledStudents?: string[];
  content: Array<{
    contentType: 'video' | 'youtube' | 'document' | 'link';
    title: string;
    url: string;
    durationMinutes: number;
    order: number;
  }>;
  integrations?: {
    zoomLink?: string;
    googleClassroomLink?: string;
    teamsLink?: string;
  };
  settings?: {
    engagementThreshold: number;
    alertFrequency: string;
  };
  isActive: boolean;
}

export interface Badge {
  name: string;
  tier: 'bronze' | 'silver' | 'gold';
  earned: boolean;
}

export interface Notification {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  senderId?: { name: string; email: string };
}
