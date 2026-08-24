'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Brain, CheckCircle, Database } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import adminAPI from '@/services/api/admin';

function DatasetsContent() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    const load = async (showError = false) => {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await adminAPI.getDatasets();
        if (active) setData(result);
      } catch {
        if (active && showError) toast.error('Failed to load dataset information');
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    };
    void load(true);
    const interval = window.setInterval(() => void load(), 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const datasets = (data?.datasets || []) as Array<Record<string, any>>;
  const model = data?.model as Record<string, any> | undefined;
  const modelLoaded = data?.modelLoaded === true;
  const serviceConnected = data?.serviceConnected === true;
  const inputShape = Array.isArray(model?.input_shape)
    ? model.input_shape.slice(1).join(' × ')
    : '300 × 300 × 3';

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-7">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-heading">Dataset &amp; Model Registry</h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Live</span>
            </div>
            <p className="text-sm text-body">Configuration currently used by the emotion-recognition service.</p>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {datasets.map((dataset) => (
              <div key={String(dataset.name)} className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3"><Database className="h-6 w-6 text-primary" /><h2 className="font-bold text-heading">{String(dataset.name)}</h2></div>
                  {dataset.status === 'available' ? <CheckCircle className="h-5 w-5 text-success" /> : <AlertCircle className="h-5 w-5 text-warning" />}
                </div>
                <p className="text-sm text-body">{String(dataset.purpose)}</p>
                <div className="mt-4 flex gap-4 text-sm">
                  <span className="text-body">Classes: <b className="text-heading">{String(dataset.classes)}</b></span>
                  <span className="capitalize text-body">Status: <b className="text-heading">{String(dataset.status)}</b></span>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card p-6">
            <div className="mb-4 flex items-center gap-3"><Brain className="h-6 w-6 text-primary" /><h2 className="font-bold text-heading">EfficientNetB3 Runtime</h2></div>
            <dl className="grid gap-4 text-sm md:grid-cols-4">
              <div><dt className="text-body">Model loaded</dt><dd className={`font-semibold ${modelLoaded ? 'text-success' : 'text-danger'}`}>{modelLoaded ? 'Yes' : 'No'}</dd></div>
              <div><dt className="text-body">Input shape</dt><dd className="font-semibold text-heading">{inputShape}</dd></div>
              <div><dt className="text-body">Classes</dt><dd className="font-semibold text-heading">{String(model?.num_classes || 7)}</dd></div>
              <div><dt className="text-body">Service state</dt><dd className={`font-semibold ${serviceConnected ? 'text-success' : 'text-danger'}`}>{serviceConnected ? 'Connected' : 'Offline'}</dd></div>
            </dl>
            {model?.model_path && <p className="mt-4 break-all rounded-lg bg-muted/40 p-3 text-xs text-body">Checkpoint: {String(model.model_path)}</p>}
            {!serviceConnected && <p className="mt-4 text-sm text-warning">Start the AI service on port 5000 to inspect the live model.</p>}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return <ProtectedRoute role="admin"><DatasetsContent /></ProtectedRoute>;
}
