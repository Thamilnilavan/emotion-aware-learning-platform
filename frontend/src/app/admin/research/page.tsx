'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Target, Brain } from 'lucide-react';
import { toast } from 'sonner';
import adminAPI from '@/services/api/admin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function ResearchContent() {
  const [researchData, setResearchData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getResearch()
      .then(setResearchData)
      .catch(() => toast.error('Failed to load research data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const metrics = researchData?.metrics as Record<string, any> | undefined;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <h1 className="mb-8 text-2xl font-extrabold text-heading">Research Dashboard</h1>

          {/* Research Metrics */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Total Sessions</p>
              </div>
              <p className="text-3xl font-bold text-heading">{metrics?.totalSessions ?? 0}</p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Avg Engagement</p>
              </div>
              <p className="text-3xl font-bold text-heading">{metrics?.avgEngagement ?? 0}%</p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Avg Focus</p>
              </div>
              <p className="text-3xl font-bold text-heading">{metrics?.avgFocusPercentage ?? 0}%</p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Emotion Classes</p>
              </div>
              <p className="text-3xl font-bold text-heading">{Object.keys(metrics?.emotionDistribution as Record<string, number> || {}).length}</p>
            </div>
          </div>

          {/* Emotion Distribution */}
          <div className="mb-8 glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Emotion Distribution Analysis</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(metrics?.emotionDistribution as Record<string, number> || {}).map(([emotion, count]) => (
                <div key={emotion} className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="text-sm font-medium text-heading capitalize">{emotion}</span>
                  <span className="text-lg font-bold text-primary">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Research context */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-card p-6">
              <h3 className="mb-4 font-bold text-heading">Research Data Quality</h3>
              <p className="text-sm text-body">These metrics are calculated from completed learning sessions. Raw webcam images and videos are not retained; only consented analytical metadata contributes to the aggregates.</p>
            </div>

            <div className="glass-card p-6">
              <h3 className="mb-4 font-bold text-heading">Dataset Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-body">RAF-DB</span>
                  <span className="text-sm font-bold text-heading">7 expressions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-body">Model</span>
                  <span className="text-sm font-bold text-heading">EfficientNetB3</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="admin">
      <ResearchContent />
    </ProtectedRoute>
  );
}
