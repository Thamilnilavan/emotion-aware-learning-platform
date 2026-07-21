'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Award, BookOpen, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import studentAPI from '@/services/api/student';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function ProfileContent() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentAPI.getDashboard(),
      studentAPI.getAchievements()
    ])
      .then(([dashRes, achievementsRes]) => {
        setProfileData({
          ...dashRes.data,
          ...achievementsRes.data
        });
      })
      .catch(() => toast.error('Failed to load profile data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const totalSessions = profileData?.totalSessions as number || 0;
  const averageEngagement = profileData?.averageEngagement as number || 0;
  const badges = profileData?.badges as Array<Record<string, any>> || [];
  const xp = profileData?.xp as number || 0;
  const streakDays = profileData?.streakDays as number || 0;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">Profile</h1>
              <p className="text-sm text-body">Your learning journey overview</p>
            </div>
          </div>

          {/* Profile Header */}
          <div className="mb-8 glass-card p-6">
            <div className="flex items-start gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-4xl">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-heading">{user?.name}</h2>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-body">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{user?.programme}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Statistics */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <div className="glass-card p-6 text-center">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="text-3xl font-bold text-heading">{totalSessions}</p>
              <p className="text-sm text-body">Total Sessions</p>
            </div>
            <div className="glass-card p-6 text-center">
              <Award className="mx-auto mb-2 h-8 w-8 text-warning" />
              <p className="text-3xl font-bold text-heading">{averageEngagement}%</p>
              <p className="text-sm text-body">Avg Engagement</p>
            </div>
            <div className="glass-card p-6 text-center">
              <Award className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="text-3xl font-bold text-heading">{xp}</p>
              <p className="text-sm text-body">Total XP</p>
            </div>
            <div className="glass-card p-6 text-center">
              <Award className="mx-auto mb-2 h-8 w-8 text-warning" />
              <p className="text-3xl font-bold text-heading">{streakDays}</p>
              <p className="text-sm text-body">Day Streak</p>
            </div>
          </div>

          {/* Achievements */}
          <div className="glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Achievements</h3>
            <div className="flex flex-wrap gap-3">
              {badges.filter((b: any) => b.earned).map((badge: any) => (
                <div
                  key={badge.name}
                  className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
                >
                  🏆 {badge.name}
                </div>
              ))}
              {badges.filter((b: any) => b.earned).length === 0 && (
                <p className="text-body">No achievements earned yet. Keep learning!</p>
              )}
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
      <ProfileContent />
    </ProtectedRoute>
  );
}
