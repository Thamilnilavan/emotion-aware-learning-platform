'use client';

import { useEffect, useState } from 'react';
import { Brain, Activity, Clock, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import adminAPI from '@/services/api/admin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function AIMonitoringContent() {
  const [aiData, setAIData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAIMonitoring()
      .then((res) => setAIData(res.data))
      .catch(() => toast.error('Failed to load AI monitoring data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const aiGateway = aiData?.aiGateway as Record<string, any> | undefined;
  const services = aiData?.services as Record<string, any> | undefined;
  const predictions = aiData?.predictions as Record<string, any> | undefined;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <h1 className="mb-8 text-2xl font-extrabold text-heading">AI Monitoring</h1>

          {/* AI Gateway Status */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-bold text-heading">AI Gateway Status</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`flex items-center gap-3 rounded-lg p-4 ${aiGateway?.status === 'online' ? 'bg-success/10' : 'bg-danger/10'}`}>
                {aiGateway?.status === 'online' ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-danger" />
                )}
                <div>
                  <p className="text-sm text-body">Status</p>
                  <p className="font-semibold text-heading capitalize">{String(aiGateway?.status || 'Unknown')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-body">Response Time</p>
                  <p className="font-semibold text-heading">{aiGateway?.responseTime ? `${aiGateway.responseTime}ms` : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CNN Model Status */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-bold text-heading">CNN Model Status</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-success/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <p className="text-sm font-semibold text-heading">Running</p>
                </div>
                <p className="text-2xl font-bold text-success">Active</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-body">Accuracy</p>
                <p className="text-2xl font-bold text-heading">82.9%</p>
                <p className="text-xs text-body">FER2013 Dataset</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-body">Last Training</p>
                <p className="text-2xl font-bold text-heading">Today</p>
                <p className="text-xs text-body">Model v2.0</p>
              </div>
            </div>
          </div>

          {/* Microservices Status */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-bold text-heading">Microservices Status</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[
                { name: 'Face Detection', port: 5001 },
                { name: 'Emotion Detection', port: 5002 },
                { name: 'Eye Gaze', port: 5003 },
                { name: 'Head Pose', port: 5004 },
                { name: 'Attention', port: 5005 },
                { name: 'Engagement', port: 5006 },
                { name: 'Intervention', port: 5007 },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-heading">{service.name}</p>
                    <p className="text-xs text-body">Port {service.port}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
              ))}
            </div>
          </div>

          {/* Prediction Statistics */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-bold text-heading">Prediction Statistics</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-primary/10 p-4">
                <p className="mb-1 text-sm text-body">Today's Predictions</p>
                <p className="text-3xl font-bold text-primary">{String(predictions?.today || 0)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-body">Average Response Time</p>
                <p className="text-3xl font-bold text-heading">{aiGateway?.responseTime ? `${aiGateway.responseTime}ms` : 'N/A'}</p>
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
      <AIMonitoringContent />
    </ProtectedRoute>
  );
}
