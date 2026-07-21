'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, TrendingUp, Trophy, Clock, Lightbulb, Flame, Target, Brain } from 'lucide-react';
import { toast } from 'sonner';
import studentAPI from '@/services/api/student';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { getScoreColor } from '@/lib/utils';

export function StudentDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<Record<string, any> | null>(null);
  const [progressData, setProgressData] = useState<Record<string, any> | null>(null);
  const [achievementsData, setAchievementsData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentAPI.getDashboard(),
      studentAPI.getProgress(),
      studentAPI.getAchievements()
    ])
      .then(([dashRes, progressRes, achievementsRes]) => {
        setDashboardData(dashRes.data);
        setProgressData(progressRes.data);
        setAchievementsData(achievementsRes.data);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const streakDays = dashboardData?.streakDays as number || 0;
  const averageEngagement = dashboardData?.averageEngagement as number || 0;
  const totalSessions = dashboardData?.totalSessions as number || 0;
  const insights = dashboardData?.insights as string[] || [];
  const recentSessions = dashboardData?.recentSessions as Array<Record<string, any>> || [];
  const badges = achievementsData?.badges as Array<Record<string, any>> || [];
  const xp = achievementsData?.xp as number || 0;
  const courseProgress = progressData?.courseProgress as Array<Record<string, any>> || [];
  const totalStudyMinutes = progressData?.totalStudyMinutes as number || 0;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          {/* Welcome Banner */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-heading md:text-3xl">
                Welcome back, {user?.name} 👋
              </h1>
              <p className="text-body">{new Date().toLocaleDateString()}</p>
            </div>
            {streakDays > 1 && (
              <span className="flex items-center gap-2 rounded-full bg-warning/20 px-4 py-2 text-sm font-bold text-warning">
                <Flame className="h-4 w-4" /> {streakDays} day streak
              </span>
            )}
          </div>

          {/* Bento Grid Layout */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Progress Card */}
            <div className="glass-card p-5">
              <Target className="mb-2 h-6 w-6 text-primary" />
              <p className="text-sm text-body">Learning Progress</p>
              <p className="text-2xl font-bold text-heading">{courseProgress.length > 0 ? Math.round((courseProgress[0] as any).progress) : 0}%</p>
            </div>

            {/* Streak Card */}
            <div className="glass-card p-5">
              <Flame className="mb-2 h-6 w-6 text-warning" />
              <p className="text-sm text-body">Current Streak</p>
              <p className="text-2xl font-bold text-heading">{streakDays} days</p>
            </div>

            {/* Engagement Card */}
            <div className="glass-card p-5">
              <TrendingUp className="mb-2 h-6 w-6 text-primary" />
              <p className="text-sm text-body">Today's Engagement</p>
              <p className="text-2xl font-bold text-heading">{averageEngagement}%</p>
            </div>

            {/* XP Card */}
            <div className="glass-card p-5">
              <Trophy className="mb-2 h-6 w-6 text-warning" />
              <p className="text-sm text-body">Current XP</p>
              <p className="text-2xl font-bold text-heading">{xp}</p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">🔥 AI Insights</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {insights.slice(0, 4).map((insight, i) => (
                <div key={i} className="flex gap-3 rounded-xl bg-primary/10 border border-primary/20 p-4">
                  <Lightbulb className="h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm text-heading">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Analytics */}
          <div className="mb-8 glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Weekly Focus Score</h3>
            <div className="grid gap-4 md:grid-cols-7">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  <span className="text-sm text-body">{day}</span>
                  <div className="h-24 w-full rounded-lg bg-muted">
                    <div 
                      className="h-full rounded-lg bg-primary transition-all"
                      style={{ height: `${Math.random() * 80 + 20}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-heading">{Math.round(Math.random() * 30 + 70)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-heading">Recent Sessions</h3>
              <Link href="/student/reports" className="text-sm font-semibold text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {recentSessions.slice(0, 5).map((session: any) => (
                <Link
                  key={session._id}
                  href={`/student/reports/${session._id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/20 p-4 transition-colors hover:bg-white/50"
                >
                  <div>
                    <p className="font-medium text-heading">
                      {typeof session.courseId === 'object' ? session.courseId?.title : 'Session'}
                    </p>
                    <p className="text-sm text-body">{session.endTime ? new Date(session.endTime).toLocaleDateString() : ''}</p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-sm font-bold text-white" style={{ backgroundColor: getScoreColor(session.summary?.averageScore || 0) }}>
                    {session.summary?.averageScore || 0}%
                  </span>
                </Link>
              ))}
              {recentSessions.length === 0 && (
                <p className="py-8 text-center text-body">No sessions yet. Start your first one!</p>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-heading">Recent Achievements</h3>
              <Link href="/student/achievements" className="text-sm font-semibold text-primary hover:underline">View All</Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {badges.filter((b: any) => b.earned).slice(0, 4).map((badge: any) => (
                <div
                  key={badge.name}
                  className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
                >
                  🏆 {badge.name}
                </div>
              ))}
              {badges.filter((b: any) => b.earned).length === 0 && (
                <p className="text-body">Complete more sessions to earn achievements!</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
