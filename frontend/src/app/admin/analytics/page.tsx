'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Activity, Download } from 'lucide-react';
import { toast } from 'sonner';
import adminAPI from '@/services/api/admin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function AnalyticsContent() {
  const [analyticsData, setAnalyticsData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  const exportAnalytics = async () => {
    try {
      const response = await adminAPI.exportData();
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'anonymised_sessions.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Analytics export downloaded');
    } catch { toast.error('Failed to export analytics'); }
  };

  useEffect(() => {
    let active = true;
    let requestInFlight = false;
    setLoading(true);

    const load = async (showError = false) => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const data = await adminAPI.getAnalytics(timeRange);
        if (active) setAnalyticsData(data);
      } catch {
        if (active && showError) toast.error('Failed to load analytics');
      } finally {
        requestInFlight = false;
        if (active) setLoading(false);
      }
    };

    void load(true);
    const interval = window.setInterval(() => void load(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [timeRange]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const dailyData = analyticsData?.dailyData as Array<Record<string, any>> || [];
  const summary = analyticsData?.summary as Record<string, number> | undefined;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-heading">Analytics</h1>
                <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Live
                </span>
              </div>
              <p className="mt-1 text-xs text-body">Refreshes every 5 seconds · {summary?.activeSessions || 0} active session(s)</p>
            </div>
            <div className="flex gap-2"><button onClick={exportAnalytics} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-heading"><Download className="h-4 w-4"/>Export CSV</button><select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select></div>
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
                {summary?.totalSessions || 0}
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
                {summary?.avgEngagement || 0}%
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
                {summary?.totalDistractions || 0}
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
                    <th className="pb-3">Active</th>
                    <th className="pb-3">Avg Engagement</th>
                    <th className="pb-3">Distractions</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((d, i) => (
                    <tr key={i} className="border-b border-white/10">
                      <td className="py-3 font-medium text-heading">{d.date as string}</td>
                      <td className="py-3">{d.sessions as number}</td>
                      <td className="py-3"><span className={Number(d.activeSessions || 0) > 0 ? 'font-semibold text-success' : ''}>{Number(d.activeSessions || 0)}</span></td>
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

export default function AnalyticsPage() {
  return <ProtectedRoute role="admin"><AnalyticsContent /></ProtectedRoute>;
}
