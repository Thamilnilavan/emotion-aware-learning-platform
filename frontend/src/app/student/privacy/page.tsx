'use client';

import { useEffect, useState } from 'react';
import { Shield, Download, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function PrivacyContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState({
    webcamConsent: false,
    emotionConsent: false,
    attentionConsent: false,
    retentionConsent: false,
  });

  const handleConsentChange = async (field: string, value: boolean) => {
    setConsent(prev => ({ ...prev, [field]: value }));
    // In a real implementation, this would call the API to update consent
    toast.success(`${field} updated successfully`);
  };

  const handleDownloadData = async () => {
    setLoading(true);
    // Simulate data download
    setTimeout(() => {
      setLoading(false);
      toast.success('Your data has been downloaded');
    }, 2000);
  };

  const handleDeleteData = async () => {
    if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      setLoading(true);
      // Simulate data deletion
      setTimeout(() => {
        setLoading(false);
        toast.success('Your data has been deleted');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">Privacy Center</h1>
              <p className="text-sm text-body">Manage your data and privacy settings</p>
            </div>
          </div>

          {/* Webcam Monitoring Status */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">Webcam Monitoring</h3>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 p-4">
              <EyeOff className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold text-heading">Raw Webcam Video: Not Stored</p>
                <p className="text-sm text-body">Your webcam feed is processed in real-time and never saved to our servers.</p>
              </div>
            </div>
          </div>

          {/* Consent Management */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">Consent Management</h3>
            </div>
            <div className="space-y-4">
              {[
                { key: 'webcamConsent', label: 'Webcam Monitoring', description: 'Allow webcam access for emotion detection' },
                { key: 'emotionConsent', label: 'Emotion Tracking', description: 'Track and analyze your emotional states during learning' },
                { key: 'attentionConsent', label: 'Attention Tracking', description: 'Monitor your attention levels during sessions' },
                { key: 'retentionConsent', label: 'Data Retention', description: 'Allow storage of your learning analytics data' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-xl border border-white/20 p-4">
                  <div>
                    <p className="font-medium text-heading">{item.label}</p>
                    <p className="text-sm text-body">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleConsentChange(item.key, !consent[item.key as keyof typeof consent])}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      consent[item.key as keyof typeof consent] ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <div
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        consent[item.key as keyof typeof consent] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Data Actions */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">Data Actions</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={handleDownloadData}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-primary hover:bg-primary/20 disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                <span>Download My Data</span>
              </button>
              <button
                onClick={handleDeleteData}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger hover:bg-danger/20 disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" />
                <span>Delete All Data</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="student">
      <PrivacyContent />
    </ProtectedRoute>
  );
}
