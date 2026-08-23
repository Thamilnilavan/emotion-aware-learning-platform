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
    let active = true;
    let requestInFlight = false;
    const load = async (showError = false) => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const data = await adminAPI.getAIMonitoring();
        if (active) setAIData(data);
      } catch {
        if (active && showError) toast.error('Failed to load AI monitoring data');
      } finally {
        requestInFlight = false;
        if (active) setLoading(false);
      }
    };

    void load(true);
    const interval = window.setInterval(() => void load(), 3000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const aiGateway = aiData?.aiGateway as Record<string, any> | undefined;
  const services = aiData?.services as Record<string, any> | undefined;
  const predictions = aiData?.predictions as Record<string, any> | undefined;
  const model = aiData?.model as Record<string, any> | undefined;
  const latestPrediction = predictions?.latest as Record<string, any> | null | undefined;
  const latestEmotion = String(latestPrediction?.emotion || '');
  const emotionEmoji: Record<string, string> = {
    happy: '\u{1F60A}', sad: '\u{1F622}', angry: '\u{1F620}', neutral: '\u{1F610}',
    surprised: '\u{1F632}', fearful: '\u{1F628}', disgusted: '\u{1F922}',
  };

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
                <p className={`text-2xl font-bold ${model?.loaded ? 'text-success' : 'text-danger'}`}>{model?.loaded ? 'Active' : 'Offline'}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-body">Architecture</p>
                <p className="text-2xl font-bold text-heading">EfficientNetB3</p>
                <p className="text-xs text-body">RAF-DB dataset</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-body">Input Size</p>
                <p className="text-2xl font-bold text-heading">{Array.isArray(model?.input_size) ? model.input_size.join(' × ') : String(model?.input_size || '300 × 300')}</p>
                <p className="text-xs text-body">Live service metadata</p>
              </div>
            </div>
          </div>

          {/* AI capabilities */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-bold text-heading">AI Capabilities</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[
                { name: 'Face Detection', detail: 'OpenCV' },
                { name: 'Emotion Detection', detail: 'EfficientNetB3' },
                { name: 'Face Landmarks', detail: 'MediaPipe' },
                { name: 'Head Pose', detail: 'Yaw and pitch' },
                { name: 'Attention', detail: 'Real-time score' },
                { name: 'Engagement', detail: '10-second windows' },
                { name: 'Intervention', detail: 'Adaptive rules' },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-heading">{service.name}</p>
                    <p className="text-xs text-body">{service.detail}</p>
                  </div>
                  {aiGateway?.status === 'online' ? <CheckCircle className="h-4 w-4 text-success" /> : <AlertCircle className="h-4 w-4 text-warning" />}
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
            <div className="grid gap-4 md:grid-cols-3">
              <div className={`rounded-lg p-4 ${predictions?.isLive ? 'bg-success/10' : 'bg-muted/50'}`}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm text-body">Live Emotion</p>
                  <span className={`h-2.5 w-2.5 rounded-full ${predictions?.isLive ? 'animate-pulse bg-success' : 'bg-body/30'}`} />
                </div>
                {predictions?.isLive && latestPrediction ? (
                  <div>
                    <p className="text-3xl font-bold capitalize text-heading">
                      <span className="mr-2">{emotionEmoji[latestEmotion] || '\u2753'}</span>{latestEmotion}
                    </p>
                    <p className="mt-1 text-xs text-body">
                      {latestPrediction.studentName} · {Math.round(Number(latestPrediction.confidence || 0) * 100)}% confidence
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-bold text-heading">Waiting for live session</p>
                    <p className="mt-1 text-xs text-body">No fresh face prediction in the last 15 seconds</p>
                  </div>
                )}
              </div>
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
