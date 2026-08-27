'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Clock, Database, Shield, Trash2, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import adminAPI from '@/services/api/admin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

type PrivacyUser = { _id: string; name: string; email: string; role: string };

function PrivacyContent() {
  const [privacyData, setPrivacyData] = useState<Record<string, any> | null>(null);
  const [users, setUsers] = useState<PrivacyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [retentionDays, setRetentionDays] = useState(180);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [requestForm, setRequestForm] = useState({ userId: '', reason: '' });

  const loadPrivacy = useCallback(async (showError = true) => {
    try {
      const result = await adminAPI.getPrivacy();
      setPrivacyData(result);
      setRetentionDays(Number(result.privacy?.dataRetentionDays || 180));
    } catch {
      if (showError) toast.error('Failed to load privacy data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrivacy();
    adminAPI.getUsers({ limit: 100 })
      .then((result) => setUsers((result.users || []).filter((user: PrivacyUser) => user.role !== 'admin')))
      .catch(() => {});
  }, [loadPrivacy]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const privacy = privacyData?.privacy as Record<string, any> | undefined;
  const requests = (privacy?.deletionRequests || []) as Array<Record<string, any>>;
  const consent = privacy?.consentBreakdown as Record<string, number> | undefined;

  const updateRequest = async (id: string, status: 'approved' | 'rejected' | 'completed') => {
    if (status === 'completed' && !window.confirm('Permanently delete this user account and all associated learning, prediction, notification, and enrollment data? This cannot be undone.')) return;
    try {
      const result = await adminAPI.updateDeletionRequest(id, status);
      const summary = result.request?.deletionSummary;
      toast.success(status === 'completed' && summary
        ? `Deleted ${summary.sessionsDeleted || 0} sessions and ${summary.predictionsDeleted || 0} predictions`
        : `Request ${status}`);
      await loadPrivacy(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not update deletion request');
    }
  };

  const createRequest = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await adminAPI.createDeletionRequest(requestForm);
      toast.success('Deletion request created for review');
      setRequestForm({ userId: '', reason: '' });
      await loadPrivacy(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not create deletion request');
    }
  };

  const saveRetention = async () => {
    if (!Number.isInteger(retentionDays) || retentionDays < 30 || retentionDays > 3650) {
      toast.error('Retention must be between 30 and 3650 days');
      return;
    }
    setSavingPolicy(true);
    try {
      await adminAPI.updateSettings('privacy', { dataRetentionDays: retentionDays, anonymizeData: privacy?.anonymizeData !== false });
      toast.success('Retention policy saved');
      await loadPrivacy(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not save retention policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  const runCleanup = async () => {
    if (!window.confirm(`Delete all completed or abandoned session data older than ${retentionDays} days? This cannot be undone.`)) return;
    setCleaning(true);
    try {
      const result = await adminAPI.runRetentionCleanup();
      toast.success(`Removed ${result.sessionsDeleted || 0} sessions and ${result.predictionsDeleted || 0} predictions`);
      await loadPrivacy(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Retention cleanup failed');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8"><h1 className="text-2xl font-extrabold text-heading">Privacy Center</h1><p className="text-sm text-body">Manage consent coverage, retention, and verified deletion workflows.</p></div>

          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<Users className="h-6 w-6" />} label="Users with consent" value={`${privacy?.consentedUsers || 0} / ${privacy?.totalUsers || 0}`} />
            <Metric icon={<Database className="h-6 w-6" />} label="Stored sessions" value={String(privacy?.totalSessions || 0)} />
            <Metric icon={<Shield className="h-6 w-6" />} label="Stored predictions" value={String(privacy?.predictionCount || 0)} />
            <Metric icon={<Trash2 className="h-6 w-6" />} label="Pending deletions" value={String(privacy?.pendingDeletionRequests || 0)} />
          </div>

          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <section className="glass-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-heading"><UserCheck className="h-5 w-5 text-primary" />Consent coverage</h2>
              <div className="space-y-3">{[['Webcam', consent?.webcam], ['Emotion analysis', consent?.emotion], ['Attention analysis', consent?.attention], ['Data retention', consent?.retention]].map(([label, count]) => {const percentage=privacy?.totalUsers?Math.round(Number(count||0)/Number(privacy.totalUsers)*100):0;return <div key={String(label)}><div className="mb-1 flex justify-between text-sm"><span className="text-body">{label}</span><b className="text-heading">{String(count||0)} ({percentage}%)</b></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${percentage}%`}}/></div></div>;})}</div>
              <p className="mt-4 text-xs text-body">Raw webcam video is processed in memory and is not stored.</p>
            </section>

            <section className="glass-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-heading"><Clock className="h-5 w-5 text-primary" />Retention policy</h2>
              <label className="text-sm font-medium text-heading">Keep completed session data for</label>
              <div className="mt-2 flex gap-2"><input type="number" min={30} max={3650} value={retentionDays} onChange={(event)=>setRetentionDays(Number(event.target.value))} className="w-32 rounded-xl border px-3 py-2"/><span className="self-center text-sm text-body">days</span><button onClick={saveRetention} disabled={savingPolicy} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{savingPolicy?'Saving…':'Save policy'}</button></div>
              <div className="mt-5 rounded-xl bg-warning/10 p-4"><p className="text-sm text-heading"><b>{String(privacy?.eligibleForCleanup || 0)}</b> session(s) currently exceed this limit.</p><button onClick={runCleanup} disabled={cleaning||!privacy?.eligibleForCleanup} className="mt-3 rounded-lg bg-danger/15 px-3 py-2 text-xs font-semibold text-danger disabled:opacity-40">{cleaning?'Cleaning…':'Run retention cleanup'}</button></div>
            </section>
          </div>

          <section className="glass-card p-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-heading"><Trash2 className="h-5 w-5 text-primary" />Data deletion requests</h2>
            <p className="mb-5 text-sm text-body">Approval records the review decision. Permanent deletion requires a separate confirmed action.</p>
            <form onSubmit={createRequest} className="mb-6 grid gap-3 rounded-xl bg-muted/40 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]"><select required value={requestForm.userId} onChange={(event)=>setRequestForm({...requestForm,userId:event.target.value})} className="rounded-xl border px-3 py-2"><option value="">Select user</option>{users.map((user)=><option key={user._id} value={user._id}>{user.name} — {user.email}</option>)}</select><input required maxLength={1000} value={requestForm.reason} onChange={(event)=>setRequestForm({...requestForm,reason:event.target.value})} placeholder="Reason or user request reference" className="rounded-xl border px-3 py-2"/><button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Create request</button></form>
            <div className="space-y-3">{requests.map((request)=><article key={String(request._id)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 p-4"><div><p className="font-semibold text-heading">{request.userId?.name||'Deleted user'}</p><p className="text-xs text-body">{request.userId?.email||'Personal identity removed'} · {request.reason}</p><p className="mt-1 text-xs capitalize text-body">Status: <b>{request.status}</b> · {new Date(request.createdAt).toLocaleString()}</p>{request.deletionSummary&&<p className="mt-1 text-xs text-success">Account and {request.deletionSummary.sessionsDeleted||0} session(s) deleted</p>}</div><div className="flex gap-2">{request.status==='pending'&&<><button onClick={()=>updateRequest(String(request._id),'approved')} className="rounded-lg bg-success/20 px-3 py-2 text-xs font-semibold text-success">Approve</button><button onClick={()=>updateRequest(String(request._id),'rejected')} className="rounded-lg bg-danger/20 px-3 py-2 text-xs font-semibold text-danger">Reject</button></>}{request.status==='approved'&&<button onClick={()=>updateRequest(String(request._id),'completed')} className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white">Permanently delete data</button>}</div></article>)}{requests.length===0&&<p className="rounded-xl bg-muted/50 p-4 text-sm text-body">No deletion requests.</p>}</div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="glass-card p-6"><div className="mb-2 flex items-center gap-3"><div className="rounded-full bg-primary/20 p-3 text-primary">{icon}</div><p className="text-sm text-body">{label}</p></div><p className="text-3xl font-bold text-heading">{value}</p></div>;
}

export default function Page() {
  return <ProtectedRoute role="admin"><PrivacyContent /></ProtectedRoute>;
}
