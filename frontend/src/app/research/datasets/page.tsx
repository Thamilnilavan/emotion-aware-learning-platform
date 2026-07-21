'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Database, CheckCircle, AlertTriangle, XCircle, ArrowLeft } from 'lucide-react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EMOTION_COLORS } from '@/lib/constants';
import aiService from '@/services/api/ai';

interface DatasetInfo {
  name: string;
  status: string;
  format: string;
  total_samples: number;
  train_samples: number;
  test_samples: number;
  emotion_distribution: Record<string, number>;
  issues: string[];
  note?: string;
}

interface DatasetReport {
  summary: {
    total_datasets: number;
    ready: number;
    partial: number;
    missing: number;
    total_samples: number;
    target_emotions: string[];
  };
  datasets: DatasetInfo[];
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ready') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-success/20 px-3 py-1 text-xs font-semibold text-success">
        <CheckCircle className="h-3.5 w-3.5" /> Ready
      </span>
    );
  }
  if (status === 'partial') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning">
        <AlertTriangle className="h-3.5 w-3.5" /> Partial
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-danger/20 px-3 py-1 text-xs font-semibold text-danger">
      <XCircle className="h-3.5 w-3.5" /> Missing
    </span>
  );
}

function DatasetsPage() {
  const [report, setReport] = useState<DatasetReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    aiService.checkHealth()
      .then((res) => setReport(res))
      .catch(() => setError('Could not reach AI service. Ensure microservices are running.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/research/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Research Dashboard
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-heading">Dataset Management</h1>
            <p className="text-body">Live validation of emotion recognition training datasets</p>
          </div>
          <button onClick={load} className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
            Re-check Datasets
          </button>
        </div>

        {loading && <LoadingSpinner size="lg" className="py-20" />}

        {error && (
          <div className="glass-card border border-danger/30 p-6 text-danger">{error}</div>
        )}

        {report && !loading && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Datasets Ready', value: `${report.summary.ready}/${report.summary.total_datasets}` },
                { label: 'Total Samples', value: report.summary.total_samples.toLocaleString() },
                { label: 'Emotion Classes', value: report.summary.target_emotions.length },
                { label: 'Status', value: report.summary.ready === 4 ? 'All Ready' : 'Incomplete' },
              ].map((s) => (
                <div key={s.label} className="glass-card p-5">
                  <p className="text-sm text-body">{s.label}</p>
                  <p className="text-2xl font-bold text-heading">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {report.datasets.map((ds) => (
                <div key={ds.name} className="glass-card p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Database className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-bold text-heading">{ds.name}</h2>
                      <StatusBadge status={ds.status} />
                    </div>
                    <span className="text-sm text-body">{ds.format}</span>
                  </div>

                  <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-body">Total</span><p className="font-bold text-heading">{ds.total_samples.toLocaleString()}</p></div>
                    <div><span className="text-body">Train</span><p className="font-bold text-heading">{ds.train_samples.toLocaleString()}</p></div>
                    <div><span className="text-body">Test</span><p className="font-bold text-heading">{ds.test_samples.toLocaleString()}</p></div>
                  </div>

                  {ds.note && <p className="mb-3 text-sm text-body italic">{ds.note}</p>}

                  {ds.issues.length > 0 && (
                    <div className="mb-4 rounded-xl bg-warning/10 p-3 text-sm text-warning">
                      {ds.issues.map((issue, i) => <p key={i}>• {issue}</p>)}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ds.emotion_distribution).map(([emotion, count]) => (
                      <span
                        key={emotion}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: EMOTION_COLORS[emotion] || '#a556f0' }}
                      >
                        {emotion}: {count.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return <ProtectedRoute><DatasetsPage /></ProtectedRoute>;
}
