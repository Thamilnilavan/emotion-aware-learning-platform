'use client';

import { useEffect, useState } from 'react';
import { Server, Database, Cpu, HardDrive, Activity, CheckCircle, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import adminAPI from '@/services/api/admin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function SystemHealthContent() {
  const [systemData, setSystemData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => adminAPI.getSystemHealth()
      .then(setSystemData)
      .catch(() => toast.error('Failed to load system health data'))
      .finally(() => setLoading(false));
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const metrics = systemData?.metrics as Record<string, any> | undefined;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <h1 className="mb-8 text-2xl font-extrabold text-heading">System Health</h1>

          {/* System Status Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className={`glass-card p-6 ${systemData?.database === 'connected' ? 'border-l-4 border-l-success' : 'border-l-4 border-l-danger'}`}>
              <div className="mb-2 flex items-center gap-3">
                {systemData?.database === 'connected' ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-danger" />
                )}
                <p className="text-sm text-body">Database</p>
              </div>
              <p className={`text-lg font-bold ${systemData?.database === 'connected' ? 'text-success' : 'text-danger'}`}>
                {systemData?.database === 'connected' ? 'Connected' : 'Error'}
              </p>
            </div>

            <div className={`glass-card p-6 ${systemData?.aiGateway === 'online' ? 'border-l-4 border-l-success' : 'border-l-4 border-l-danger'}`}>
              <div className="mb-2 flex items-center gap-3">
                {systemData?.aiGateway === 'online' ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-danger" />
                )}
                <p className="text-sm text-body">AI Gateway</p>
              </div>
              <p className={`text-lg font-bold ${systemData?.aiGateway === 'online' ? 'text-success' : 'text-danger'}`}>
                {systemData?.aiGateway === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>

            <div className={`glass-card p-6 ${systemData?.aiService === 'online' ? 'border-l-4 border-l-success' : 'border-l-4 border-l-danger'}`}>
              <div className="mb-2 flex items-center gap-3">
                {systemData?.aiService === 'online' ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-danger" />
                )}
                <p className="text-sm text-body">AI Services</p>
              </div>
              <p className={`text-lg font-bold ${systemData?.aiService === 'online' ? 'text-success' : 'text-danger'}`}>
                {systemData?.aiService === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>

            <div className="glass-card p-6 border-l-4 border-l-primary">
              <div className="mb-2 flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <p className="text-sm text-body">System Status</p>
              </div>
              <p className="text-lg font-bold text-heading">{systemData?.database === 'connected' ? 'Operational' : 'Degraded'}</p>
            </div>
          </div>

          {/* System Metrics */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Total Users</p>
              </div>
              <p className="text-3xl font-bold text-heading">{metrics?.totalUsers ?? 0}</p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Active Users</p>
              </div>
              <p className="text-3xl font-bold text-heading">{metrics?.activeUsers ?? 0}</p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Total Sessions</p>
              </div>
              <p className="text-3xl font-bold text-heading">{metrics?.totalSessions ?? 0}</p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Active Sessions</p>
              </div>
              <p className="text-3xl font-bold text-heading">{metrics?.activeSessions ?? 0}</p>
            </div>
          </div>

          {/* Live resource usage */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <Cpu className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-heading">CPU Usage</h3>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{width:`${metrics?.systemLoadPercent ?? 0}%`}} />
              </div>
              <p className="mt-2 text-sm text-body">{metrics?.systemLoadPercent ?? 0}% current load</p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-heading">Memory Usage</h3>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{width:`${metrics?.memoryUsagePercent ?? 0}%`}} />
              </div>
              <p className="mt-2 text-sm text-body">{metrics?.memoryUsagePercent ?? 0}% used</p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-heading">API Uptime</h3>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary w-full" />
              </div>
              <p className="mt-2 text-sm text-body">{Math.floor((metrics?.uptimeSeconds ?? 0) / 3600)}h {Math.floor(((metrics?.uptimeSeconds ?? 0) % 3600) / 60)}m</p>
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
      <SystemHealthContent />
    </ProtectedRoute>
  );
}
