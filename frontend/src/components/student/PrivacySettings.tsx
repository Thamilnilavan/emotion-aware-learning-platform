'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Download, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api/auth';
import { sessionAPI } from '@/services/api/sessions';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function PrivacySettings() {
  const { user, updateUser, logout } = useAuth();
  const [prefs, setPrefs] = useState(user?.preferences || { notificationSensitivity: 'medium' as const, darkMode: false, focusGoal: 65 });
  const [sessionCount, setSessionCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    sessionAPI.getMy(1, 1).then((res) => setSessionCount(res.data.totalCount)).catch(() => {});
  }, []);

  const savePreferences = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updatePreferences(prefs);
      updateUser({ preferences: res.data.preferences });
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const downloadData = async () => {
    try {
      const res = await sessionAPI.getMy(1, 1000);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emolearn_my_data_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data downloaded');
    } catch {
      toast.error('Failed to download data');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await authAPI.deleteMyData();
      toast.success('All data deleted');
      logout();
    } catch {
      toast.error('Failed to delete data');
    } finally {
      setDeleting(false);
    }
  };

  const consentItems = [
    { label: 'Webcam consent', granted: user?.consent?.webcamConsent },
    { label: 'Emotion data consent', granted: user?.consent?.emotionConsent },
    { label: 'Attention tracking consent', granted: user?.consent?.attentionConsent },
    { label: 'Data retention consent', granted: user?.consent?.retentionConsent },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 space-y-6 p-4 md:p-8">
          <h1 className="text-2xl font-extrabold text-heading">Privacy Settings</h1>

          <div className="glass-card p-6">
            <h2 className="mb-4 font-bold text-heading">Consent Status</h2>
            <div className="space-y-3">
              {consentItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <Check className={`h-5 w-5 ${item.granted ? 'text-success' : 'text-gray-300'}`} />
                  <span className="text-sm text-heading">{item.label}</span>
                </div>
              ))}
            </div>
            {user?.consent?.givenAt && (
              <p className="mt-4 text-sm text-body">Consent given: {new Date(user.consent.givenAt).toLocaleDateString()}</p>
            )}
            <Link href="/consent" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Update Consent</Link>
          </div>

          <div className="glass-card p-6">
            <h2 className="mb-4 font-bold text-heading">My Data</h2>
            <ul className="space-y-2 text-sm text-body">
              <li>Total sessions: <strong className="text-heading">{sessionCount}</strong></li>
              <li>Stored: engagement scores, emotion labels, attention scores</li>
              <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-success" /> Raw video: NEVER stored</li>
            </ul>
          </div>

          <div className="glass-card p-6">
            <h2 className="mb-4 font-bold text-heading">Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-heading">Notification Sensitivity</label>
                <div className="flex gap-4">
                  {(['low', 'medium', 'high'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm capitalize">
                      <input type="radio" checked={prefs.notificationSensitivity === s} onChange={() => setPrefs({ ...prefs, notificationSensitivity: s })} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-heading">Dark Mode</label>
                <input type="checkbox" checked={prefs.darkMode} onChange={(e) => setPrefs({ ...prefs, darkMode: e.target.checked })} className="h-5 w-5 accent-primary" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-heading">Focus Goal (0-100)</label>
                <input type="number" min={0} max={100} value={prefs.focusGoal} onChange={(e) => setPrefs({ ...prefs, focusGoal: parseInt(e.target.value) || 0 })} className="w-24 rounded-xl border px-3 py-2" />
              </div>
              <button onClick={savePreferences} disabled={saving} className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
                {saving ? <LoadingSpinner size="sm" /> : 'Save Preferences'}
              </button>
            </div>
          </div>

          <button onClick={downloadData} className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover">
            <Download className="h-4 w-4" /> Download My Data
          </button>

          <div className="rounded-3xl border-2 border-danger/30 p-6">
            <h2 className="mb-2 font-bold text-danger">Danger Zone</h2>
            <p className="mb-4 text-sm text-body">Permanently delete all your session data and reset consent. This cannot be undone.</p>
            <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 rounded-2xl border-2 border-danger px-6 py-2.5 text-sm font-semibold text-danger hover:bg-danger/5">
              <Trash2 className="h-4 w-4" /> Delete Everything
            </button>
          </div>
        </main>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-heading">Are you absolutely sure?</h3>
            <p className="mb-4 text-sm text-body">Type DELETE to confirm permanent data deletion.</p>
            <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="mb-4 w-full rounded-xl border px-4 py-2" placeholder="DELETE" />
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-xl border py-2.5 text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={deleteConfirm !== 'DELETE' || deleting} className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
