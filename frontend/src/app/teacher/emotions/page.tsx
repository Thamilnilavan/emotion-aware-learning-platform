'use client';

import { useEffect, useState } from 'react';
import { Smile, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import teacherAPI from '@/services/api/teacher';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function EmotionsContent() {
  const [emotionsData, setEmotionsData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async (showError = false) => {
      try { const data = await teacherAPI.getEmotionAnalytics(); if (active) setEmotionsData(data); }
      catch { if (showError) toast.error('Failed to load emotion analytics'); }
      finally { if (active) setLoading(false); }
    };
    void load(true);
    const interval = window.setInterval(() => void load(false), 10000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const emotionDistribution = emotionsData?.emotionDistribution as Record<string, number> || {};
  const emotionTrend = emotionsData?.emotionTrend as Array<Record<string, any>> || [];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <Smile className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">Emotion Analytics</h1>
              <p className="text-sm text-body">Class-wide emotion distribution and trends</p>
            </div>
          </div>

          {/* Emotion Distribution */}
          <div className="mb-8 glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Overall Emotion Distribution</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(emotionDistribution).map(([emotion, count]) => (
                <div key={emotion} className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/20 p-2">
                      <Smile className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-heading capitalize">{emotion}</span>
                  </div>
                  <span className="text-lg font-bold text-primary">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emotion Trend */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">Emotion Trend Over Time</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-body">
                    <th className="pb-3">Date</th>
                    {Object.keys(emotionDistribution).map((emotion) => (
                      <th key={emotion} className="pb-3 capitalize">{emotion}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emotionTrend.slice(-7).map((day: any, index) => (
                    <tr key={index} className="border-b border-white/10">
                      <td className="py-3 font-medium text-heading">{day.date}</td>
                      {Object.keys(emotionDistribution).map((emotion) => (
                        <td key={emotion} className="py-3 text-body">
                          {day[emotion] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="teacher">
      <EmotionsContent />
    </ProtectedRoute>
  );
}
