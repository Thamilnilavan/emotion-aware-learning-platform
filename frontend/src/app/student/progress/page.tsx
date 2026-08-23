'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Clock, TrendingUp, Target } from 'lucide-react';
import { toast } from 'sonner';
import studentAPI from '@/services/api/student';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function ProgressContent() {
  const [progressData, setProgressData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    const loadProgress = async (showError = false) => {
      try {
        const response = await studentAPI.getProgress();
        if (active) {
          setProgressData(response.data);
          setLastUpdated(new Date());
        }
      } catch {
        if (showError) toast.error('Failed to load progress data');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProgress(true);
    const interval = window.setInterval(() => void loadProgress(false), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const courseProgress = progressData?.courseProgress as Array<Record<string, any>> || [];
  const weeklyHours = progressData?.weeklyHours as Array<Record<string, any>> || [];
  const totalStudyMinutes = progressData?.totalStudyMinutes as number || 0;
  const totalSessions = progressData?.totalSessions as number || 0;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">Progress Tracker</h1>
              <p className="text-sm text-body">Track your learning journey</p>
            </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-body">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
              Live{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ''}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Total Study Time</p>
              </div>
              <p className="text-3xl font-bold text-heading">{Math.round(totalStudyMinutes / 60)}h</p>
            </div>
            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Total Sessions</p>
              </div>
              <p className="text-3xl font-bold text-heading">{totalSessions}</p>
            </div>
            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Courses Enrolled</p>
              </div>
              <p className="text-3xl font-bold text-heading">{courseProgress.length}</p>
            </div>
          </div>

          {/* Course Progress */}
          <div className="mb-8 glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Course Progress</h3>
            <div className="space-y-4">
              {courseProgress.map((course: any) => (
                <div key={course.courseId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-heading">{course.title}</span>
                    <span className="text-sm font-bold text-primary">{course.progress}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted">
                    <div 
                      className="h-3 rounded-full bg-primary transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-body">{course.sessionsCompleted} sessions completed</p>
                </div>
              ))}
              {courseProgress.length === 0 && (
                <p className="text-center text-body">No courses enrolled yet</p>
              )}
            </div>
          </div>

          {/* Weekly Hours */}
          <div className="glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Weekly Learning Hours</h3>
            <div className="grid gap-4 md:grid-cols-7">
              {weeklyHours.map((day: any) => (
                <div key={day.date} className="flex flex-col items-center gap-2">
                  <span className="text-xs text-body">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <div className="h-32 w-full rounded-lg bg-muted">
                    <div 
                      className="h-full rounded-lg bg-success transition-all"
                      style={{ height: `${Math.min((day.hours / 8) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-heading">{day.hours}h</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="student">
      <ProgressContent />
    </ProtectedRoute>
  );
}
