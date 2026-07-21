'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Activity } from 'lucide-react';
import { toast } from 'sonner';
import adminAPI from '@/services/api/admin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    adminAPI.getAnalytics(timeRange)
      .then((res) => setAnalyticsData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const dailyData = analyticsData?.dailyData as Array<Record<string, any>> || [];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-heading">Analytics</h1>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* Summary Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Total Sessions</p>
              </div>
              <p className="text-3xl font-bold text-heading">
                {dailyData.reduce((sum, d) => sum + (d.sessions as number || 0), 0)}
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Avg Engagement</p>
              </div>
              <p className="text-3xl font-bold text-heading">
                {dailyData.length > 0 
                  ? Math.round(dailyData.reduce((sum, d) => sum + (d.avgEngagement as number || 0), 0) / dailyData.length)
                  : 0}%
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Total Distractions</p>
              </div>
              <p className="text-3xl font-bold text-heading">
                {dailyData.reduce((sum, d) => sum + (d.totalDistractions as number || 0), 0)}
              </p>
            </div>
          </div>

          {/* Daily Data Table */}
          <div className="glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Daily Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-body">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Sessions</th>
                    <th className="pb-3">Avg Engagement</th>
                    <th className="pb-3">Distractions</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((d, i) => (
                    <tr key={i} className="border-b border-white/10">
                      <td className="py-3 font-medium text-heading">{d.date as string}</td>
                      <td className="py-3">{d.sessions as number}</td>
                      <td className="py-3">{d.avgEngagement as number}%</td>
                      <td className="py-3">{d.totalDistractions as number}</td>
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
