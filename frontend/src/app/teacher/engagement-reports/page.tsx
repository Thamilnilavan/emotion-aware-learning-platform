'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Award, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import teacherAPI from '@/services/api/teacher';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function EngagementReportsContent() {
  const [reportsData, setReportsData] = useState<Record<string, any> | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherAPI.getEngagementReports(timeRange)
      .then((res) => setReportsData(res.data))
      .catch(() => toast.error('Failed to load engagement reports'))
      .finally(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const topPerformers = reportsData?.topPerformers as Array<Record<string, any>> || [];
  const lowEngagement = reportsData?.lowEngagement as Array<Record<string, any>> || [];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-extrabold text-heading">Engagement Reports</h1>
                <p className="text-sm text-body">Student performance analytics</p>
              </div>
            </div>
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

          {/* Summary Stats */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Total Sessions</p>
              </div>
              <p className="text-3xl font-bold text-heading">{String(reportsData?.totalSessions || 0)}</p>
            </div>
            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-success/20 p-3">
                  <Award className="h-6 w-6 text-success" />
                </div>
                <p className="text-sm text-body">Top Performers</p>
              </div>
              <p className="text-3xl font-bold text-heading">{topPerformers.length}</p>
            </div>
            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-danger/20 p-3">
                  <AlertCircle className="h-6 w-6 text-danger" />
                </div>
                <p className="text-sm text-body">Needs Attention</p>
              </div>
              <p className="text-3xl font-bold text-heading">{lowEngagement.length}</p>
            </div>
          </div>

          {/* Top Performers */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Award className="h-5 w-5 text-success" />
              <h3 className="font-bold text-heading">Top Performers</h3>
            </div>
            <div className="space-y-3">
              {topPerformers.map((student: any, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-success/10 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-heading">{student.student.name}</p>
                      <p className="text-xs text-body">{student.sessionCount} sessions</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-success">{student.avgEngagement}%</span>
                </div>
              ))}
              {topPerformers.length === 0 && (
                <p className="text-center text-body">No data available for this period</p>
              )}
            </div>
          </div>

          {/* Low Engagement */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-danger" />
              <h3 className="font-bold text-heading">Students Needing Attention</h3>
            </div>
            <div className="space-y-3">
              {lowEngagement.map((student: any, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-danger/10 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-heading">{student.student.name}</p>
                      <p className="text-xs text-body">{student.sessionCount} sessions</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-danger">{student.avgEngagement}%</span>
                </div>
              ))}
              {lowEngagement.length === 0 && (
                <p className="text-center text-body">No students with low engagement</p>
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
    <ProtectedRoute role="teacher">
      <EngagementReportsContent />
    </ProtectedRoute>
  );
}
