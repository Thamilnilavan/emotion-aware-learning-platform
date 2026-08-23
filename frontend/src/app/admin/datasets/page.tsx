'use client';

import { useEffect, useState } from 'react';
import { Database, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import adminAPI from '@/services/api/admin';

function DatasetsContent() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.getDatasets().then(setData).catch(()=>toast.error('Failed to load dataset information')).finally(()=>setLoading(false)); }, []);
  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;
  const datasets = (data?.datasets || []) as Array<Record<string, any>>;
  const model = data?.model as Record<string, any> | undefined;
  return <div className="min-h-screen bg-background pb-20 lg:pb-0"><Navbar/><div className="flex"><Sidebar/><main className="flex-1 p-4 md:p-8">
    <h1 className="text-2xl font-extrabold text-heading">Dataset & Model Registry</h1><p className="mb-7 text-sm text-body">Live configuration used by the Flask emotion-recognition service.</p>
    <div className="mb-6 grid gap-4 md:grid-cols-2">{datasets.map(dataset=><div key={dataset.name} className="glass-card p-6"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><Database className="h-6 w-6 text-primary"/><h2 className="font-bold text-heading">{dataset.name}</h2></div>{dataset.status==='available'?<CheckCircle className="h-5 w-5 text-success"/>:<AlertCircle className="h-5 w-5 text-warning"/>}</div><p className="text-sm text-body">{dataset.purpose}</p><div className="mt-4 flex gap-4 text-sm"><span className="text-body">Classes: <b className="text-heading">{dataset.classes}</b></span><span className="capitalize text-body">Status: <b className="text-heading">{dataset.status}</b></span></div></div>)}</div>
    <div className="glass-card p-6"><div className="mb-4 flex items-center gap-3"><Brain className="h-6 w-6 text-primary"/><h2 className="font-bold text-heading">EfficientNetB3 Runtime</h2></div>{model?<dl className="grid gap-4 text-sm md:grid-cols-3"><div><dt className="text-body">Model loaded</dt><dd className="font-semibold text-success">Yes</dd></div><div><dt className="text-body">Input size</dt><dd className="font-semibold text-heading">{Array.isArray(model.input_size)?model.input_size.join(' × '):model.input_size || '300 × 300'}</dd></div><div><dt className="text-body">Service state</dt><dd className="font-semibold text-success">Connected</dd></div></dl>:<p className="text-sm text-warning">The dataset is configured, but live model information is unavailable because the AI service is offline.</p>}</div>
  </main></div></div>;
}
export default function Page(){return <ProtectedRoute role="admin"><DatasetsContent/></ProtectedRoute>;}
