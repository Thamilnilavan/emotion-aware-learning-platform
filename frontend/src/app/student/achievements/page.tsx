'use client';

import { useEffect, useState } from 'react';
import { Trophy, Flame, Target } from 'lucide-react';
import { toast } from 'sonner';
import studentAPI from '@/services/api/student';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function AchievementsContent() {
  const [achievementsData, setAchievementsData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async (showError = false) => {
      try { const data = await studentAPI.getAchievements(); if (active) setAchievementsData(data); }
      catch { if (showError) toast.error('Failed to load achievements'); }
      finally { if (active) setLoading(false); }
    };
    void load(true);
    const interval = window.setInterval(() => void load(false), 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const badges = achievementsData?.badges as Array<Record<string, any>> || [];
  const xp = achievementsData?.xp as number || 0;
  const streakDays = achievementsData?.streakDays as number || 0;
  const totalSessions = achievementsData?.totalSessions as number || 0;
  const averageEngagement = achievementsData?.averageEngagement as number || 0;

  const tierColors: Record<string, string> = {
    bronze: 'bg-orange-100 text-orange-700 border-orange-300',
    silver: 'bg-gray-100 text-gray-700 border-gray-300',
    gold: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    platinum: 'bg-purple-100 text-purple-700 border-purple-300',
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-warning" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">Achievements & Rewards</h1>
              <p className="text-sm text-body">Track your accomplishments and earn rewards</p>
            </div>
          </div>

          {/* XP Summary */}
          <div className="mb-8 glass-card p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-body">Current XP</p>
                  <p className="text-2xl font-bold text-heading">{xp}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-warning/20 p-3">
                  <Flame className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-body">Current Streak</p>
                  <p className="text-2xl font-bold text-heading">{streakDays} days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-success/20 p-3">
                  <Target className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-body">Total Sessions</p>
                  <p className="text-2xl font-bold text-heading">{totalSessions}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-body">Avg Engagement</p>
                  <p className="text-2xl font-bold text-heading">{averageEngagement}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Badges</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {badges.map((badge: any) => (
                <div 
                  key={badge.name} 
                  className={`rounded-xl border p-6 text-center ${badge.earned ? tierColors[badge.tier] : 'border-gray-200 bg-gray-50 text-gray-400 opacity-50'}`}
                >
                  <p className="text-4xl mb-2">{badge.earned ? '🏆' : '🔒'}</p>
                  <p className="font-bold">{badge.name}</p>
                  <p className="text-xs capitalize mb-2">{badge.tier}</p>
                  <p className="text-xs">{badge.description}</p>
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
      <AchievementsContent />
    </ProtectedRoute>
  );
}
