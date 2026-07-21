'use client';

import { useEffect, useState } from 'react';
import { Shield, Users, Database, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import adminAPI from '@/services/api/admin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function PrivacyContent() {
  const [privacyData, setPrivacyData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getPrivacy()
      .then((res) => setPrivacyData(res.data))
      .catch(() => toast.error('Failed to load privacy data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const privacy = privacyData?.privacy as Record<string, any> | undefined;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <h1 className="mb-8 text-2xl font-extrabold text-heading">Privacy Center</h1>

          {/* Privacy Overview */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Total Users</p>
              </div>
              <p className="text-3xl font-bold text-heading">{String(privacy?.totalUsers ?? 0)}</p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Total Sessions</p>
              </div>
              <p className="text-3xl font-bold text-heading">{String(privacy?.totalSessions ?? 0)}</p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-body">Data Retention</p>
              </div>
              <p className="text-3xl font-bold text-heading">{String(privacy?.dataRetentionDays ?? 180)} days</p>
            </div>

            <div className="glass-card p-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-success/20 p-3">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <p className="text-sm text-body">Webcam Data</p>
              </div>
              <p className="text-3xl font-bold text-success">Never Stored</p>
            </div>
          </div>

          {/* Privacy Policies */}
          <div className="mb-8 glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Privacy Policies</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                <Shield className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-semibold text-heading">Raw Webcam Videos</p>
                  <p className="text-sm text-body">Never stored. Only processed in real-time for emotion detection.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                <Shield className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-semibold text-heading">Data Anonymization</p>
                  <p className="text-sm text-body">All user data is anonymized for research and analytics purposes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                <Shield className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-semibold text-heading">Data Retention</p>
                  <p className="text-sm text-body">Session data is automatically deleted after {String(privacy?.dataRetentionDays ?? 180)} days.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Deletion Requests */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Trash2 className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold text-heading">Data Deletion Requests</h3>
            </div>
            <p className="mb-4 text-sm text-body">
              Users can request deletion of their personal data at any time. All requests are processed within 30 days.
            </p>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-body">No pending deletion requests</p>
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
      <PrivacyContent />
    </ProtectedRoute>
  );
}
