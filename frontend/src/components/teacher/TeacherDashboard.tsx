'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, AlertTriangle, Activity, Brain, Zap } from 'lucide-react';
import { toast } from 'sonner';
import teacherAPI from '@/services/api/teacher';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { getScoreColor } from '@/lib/utils';

export function TeacherDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<Record<string, any> | null>(null);
  const [students, setStudents] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      teacherAPI.getDashboard(),
      teacherAPI.getStudents()
    ])
      .then(([dashRes, studentsRes]) => {
        setDashboardData(dashRes.data);
        setStudents(studentsRes.data.students || []);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const metrics = dashboardData?.metrics as Record<string, any> | undefined;
  const aiInsight = dashboardData?.aiInsight as string || '';

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <h1 className="mb-2 text-2xl font-extrabold text-heading">Teacher Dashboard</h1>
          <p className="mb-8 text-body">{user?.name} · {new Date().toLocaleDateString()}</p>

          {/* AI Insights Panel */}
          <div className="mb-8 rounded-xl bg-primary/10 border border-primary/20 p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-primary">🔥 AI Insight</p>
                <p className="text-sm text-body">{aiInsight}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { icon: Users, label: 'Total Students', value: String(metrics?.totalStudents ?? 0) },
              { icon: TrendingUp, label: 'Avg Engagement', value: `${metrics?.avgEngagement ?? 0}%` },
              { icon: Activity, label: 'Active Sessions', value: String(metrics?.activeSessions ?? 0) },
              { icon: AlertTriangle, label: 'At-Risk Students', value: String(metrics?.atRiskCount ?? 0), danger: true },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-5">
                <stat.icon className={`mb-2 h-6 w-6 ${stat.danger ? 'text-danger' : 'text-primary'}`} />
                <p className="text-sm text-body">{stat.label}</p>
                <p className="text-2xl font-bold text-heading">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Emotion Distribution */}
          <div className="mb-8 glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Emotion Distribution</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(metrics?.emotionDistribution as Record<string, number> || {}).map(([emotion, count]) => (
                <div key={emotion} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm font-medium text-heading capitalize">{emotion}</span>
                  <span className="text-sm font-bold text-primary">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Students Table */}
          <div className="glass-card overflow-x-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-heading">Students</h3>
              <Link href="/teacher/students" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-body">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4 hidden md:table-cell">Email</th>
                  <th className="pb-3 pr-4">Latest Score</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.slice(0, 5).map((s: any) => (
                  <tr key={s.student._id} className="border-b border-white/10">
                    <td className="py-3 pr-4 font-medium text-heading">{s.student.name}</td>
                    <td className="py-3 pr-4 hidden md:table-cell text-body">{s.student.email}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: getScoreColor(s.latestSession?.summary?.averageScore || 0) }}>
                        {s.latestSession?.summary?.averageScore ?? '—'}%
                      </span>
                    </td>
                    <td className="py-3">
                      <Link href={`/teacher/students/${s.student._id}`} className="text-primary hover:underline">View Analytics</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
