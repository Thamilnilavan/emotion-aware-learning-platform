'use client';

import { useEffect, useState } from 'react';
import { Settings, Brain, Shield, Globe } from 'lucide-react';
import { toast } from 'sonner';
import adminAPI from '@/services/api/admin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function SettingsContent() {
  const [settingsData, setSettingsData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminAPI.getSettings()
      .then((res) => setSettingsData(res))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const settings = settingsData?.settings as Record<string, any> | undefined;
  const general = settings?.general as Record<string, string> | undefined;
  const ai = settings?.ai as Record<string, string> | undefined;
  const privacy = settings?.privacy as Record<string, any> | undefined;

  const updateField = (section: string, key: string, value: unknown) => {
    setSettingsData((previous) => ({
      ...(previous || {}),
      settings: {
        ...((previous?.settings as Record<string, any>) || {}),
        [section]: {
          ...(((previous?.settings as Record<string, any>)?.[section]) || {}),
          [key]: value,
        },
      },
    }));
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await Promise.all(['general', 'ai', 'privacy'].map((section) =>
        adminAPI.updateSettings(section, settings[section] || {})
      ));
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <h1 className="mb-8 text-2xl font-extrabold text-heading">Settings</h1>

          {/* General Settings */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-bold text-heading">General Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-body">Site Name</label>
                <input
                  type="text"
                  value={general?.siteName || 'Eduvo'}
                  onChange={(event) => updateField('general', 'siteName', event.target.value)}
                  className="w-full rounded-xl border px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-body">Support Email</label>
                <input
                  type="email"
                  value={general?.supportEmail || 'support@eduvo.app'}
                  onChange={(event) => updateField('general', 'supportEmail', event.target.value)}
                  className="w-full rounded-xl border px-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-bold text-heading">AI Configuration</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-body">Confidence Threshold</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={ai?.confidenceThreshold || 0.55}
                  onChange={(event) => updateField('ai', 'confidenceThreshold', Number(event.target.value))}
                  className="w-full rounded-xl border px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-body">Engagement Threshold</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={ai?.engagementThreshold || 0.7}
                  onChange={(event) => updateField('ai', 'engagementThreshold', Number(event.target.value))}
                  className="w-full rounded-xl border px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-body">AI Gateway URL</label>
                <input
                  type="text"
                  value={ai?.aiGatewayUrl || 'http://localhost:5000'}
                  onChange={(event) => updateField('ai', 'aiGatewayUrl', event.target.value)}
                  className="w-full rounded-xl border px-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-bold text-heading">Privacy Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-body">Data Retention Days</label>
                <input
                  type="number"
                  min="1"
                  value={String(privacy?.dataRetentionDays || 180)}
                  onChange={(event) => updateField('privacy', 'dataRetentionDays', Number(event.target.value))}
                  className="w-full rounded-xl border px-4 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={privacy?.anonymizeData === true}
                  onChange={(event) => updateField('privacy', 'anonymizeData', event.target.checked)}
                  className="rounded"
                />
                <label className="text-sm text-body">Anonymize data by default</label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white"
            >
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="admin">
      <SettingsContent />
    </ProtectedRoute>
  );
}
