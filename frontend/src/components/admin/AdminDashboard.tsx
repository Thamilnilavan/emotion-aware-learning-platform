'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, GraduationCap, BookOpen, TrendingUp, Activity, Database, Brain, HeartPulse, Server, Cpu, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import adminAPI from '@/services/api/admin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<Record<string, any> | null>(null);
  const [systemHealth, setSystemHealth] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    Promise.all([
      adminAPI.getDashboard(),
      adminAPI.getSystemHealth(),
    ]).then(([dashboard, system]) => {
      setDashboardData(dashboard.data);
      setSystemHealth(system.data);
    }).catch(() => {
      toast.error('Failed to load dashboard data');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      adminAPI.getSystemHealth().then((res) => setSystemHealth(res.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const metrics = dashboardData?.metrics as Record<string, any> | undefined;
  const health = systemHealth as Record<string, any> | undefined;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <h1 className="mb-8 text-2xl font-extrabold text-heading">Admin Dashboard</h1>

          {/* Bento Grid Layout */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* User Stats */}
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-body">Total Students</p>
                  <p className="text-2xl font-bold text-heading">{String(metrics?.totalStudents ?? 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-success" />
                <span className="text-body">{String(metrics?.totalTeachers ?? 0)} Teachers</span>
              </div>
            </div>

            {/* Course Stats */}
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-body">Active Sessions</p>
                  <p className="text-2xl font-bold text-heading">{metrics?.activeSessions ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-success" />
                <span className="text-body">Live Now</span>
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-body">Avg Engagement</p>
                  <p className="text-2xl font-bold text-heading">{String(metrics?.avgEngagement ?? 0)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <HeartPulse className="h-4 w-4 text-success" />
                <span className="text-body">Platform Average</span>
              </div>
            </div>

            {/* AI Model Status */}
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-body">AI Model Status</p>
                  <p className={`text-lg font-bold ${health?.aiGateway === 'online' ? 'text-success' : 'text-danger'}`}>
                    {health?.aiGateway === 'online' ? 'Running' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Server className="h-4 w-4 text-success" />
                <span className="text-body">CNN Model Active</span>
              </div>
            </div>
          </div>

          {/* System Health Row */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className={`glass-card p-4 ${health?.database === 'connected' ? 'border-l-4 border-l-success' : 'border-l-4 border-l-danger'}`}>
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-body">Database</p>
                  <p className="font-semibold text-heading">{health?.database === 'connected' ? 'Connected' : 'Error'}</p>
                </div>
              </div>
            </div>

            <div className={`glass-card p-4 ${health?.aiGateway === 'online' ? 'border-l-4 border-l-success' : 'border-l-4 border-l-danger'}`}>
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-body">AI Gateway</p>
                  <p className="font-semibold text-heading">{health?.aiGateway === 'online' ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </div>

            <div className={`glass-card p-4 ${health?.aiService === 'online' ? 'border-l-4 border-l-success' : 'border-l-4 border-l-danger'}`}>
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-body">AI Services</p>
                  <p className="font-semibold text-heading">{health?.aiService === 'online' ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Trend Chart Placeholder */}
          <div className="mb-8 glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Engagement Trend (Last 7 Days)</h3>
            <div className="h-48 flex items-center justify-center rounded-lg bg-muted/50">
              <p className="text-sm text-body">Chart visualization would appear here</p>
            </div>
          </div>

          {/* Emotion Distribution */}
          <div className="glass-card p-6">
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
        </main>
      </div>
    </div>
  );
}
