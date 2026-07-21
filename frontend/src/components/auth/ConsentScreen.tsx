'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Brain, Eye, Database, Shield, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

const consentItems = [
  {
    key: 'webcamConsent' as const,
    icon: Camera,
    label: 'Webcam access for real-time emotion and attention analysis during study sessions. The camera feed is processed in server memory only.',
  },
  {
    key: 'emotionConsent' as const,
    icon: Brain,
    label: 'Emotion classification labels (e.g. Happy, Neutral) stored with my session data. Raw video is NEVER saved.',
  },
  {
    key: 'attentionConsent' as const,
    icon: Eye,
    label: 'Attention scores and engagement scores stored in my anonymised profile for analytics and progress tracking.',
  },
  {
    key: 'retentionConsent' as const,
    icon: Database,
    label: 'My data will be retained for 6 months after my last session, then permanently deleted.',
  },
];

export function ConsentScreen() {
  const [checks, setChecks] = useState({
    webcamConsent: false,
    emotionConsent: false,
    attentionConsent: false,
    retentionConsent: false,
  });
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuth();
  const router = useRouter();

  const allChecked = Object.values(checks).every(Boolean);

  const handleSubmit = async () => {
    if (!allChecked) return;
    setLoading(true);
    try {
      const res = await authAPI.updateConsent({
        webcamConsent: true,
        emotionConsent: true,
        attentionConsent: true,
        retentionConsent: true,
      });
      updateUser(res.data.user);
      toast.success('Consent saved. You can now start learning!');
      router.push('/student/dashboard');
    } catch {
      toast.error('Failed to save consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-heading">EmoLearn</h1>
          <h2 className="mt-4 text-2xl font-bold text-heading">Before you begin</h2>
          <p className="mt-2 text-body">Please review and accept our data collection practices</p>
        </div>

        <div className="mb-8 rounded-3xl bg-primary/10 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-heading">
            <Shield className="h-5 w-5 text-primary" />
            What we collect and why:
          </h3>
          <ul className="space-y-2 text-sm text-body">
            <li>• Emotion labels from facial analysis (no video stored)</li>
            <li>• Attention scores from head pose estimation</li>
            <li>• Engagement metrics for adaptive learning</li>
            <li>• Session analytics for your progress reports</li>
          </ul>
        </div>

        <div className="glass-card space-y-4 p-6">
          {consentItems.map((item) => (
            <label key={item.key} className="flex cursor-pointer gap-4 rounded-2xl border border-white/20 p-4 transition-colors hover:bg-white/50">
              <input
                type="checkbox"
                checked={checks[item.key]}
                onChange={(e) => setChecks((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                className="mt-1 h-5 w-5 rounded accent-primary"
              />
              <div className="flex gap-3">
                <item.icon className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-heading">{item.label}</span>
              </div>
            </label>
          ))}
        </div>

        <p className="mt-4 text-center text-sm text-body">
          <Link href="/privacy" className="text-primary hover:underline">Read our full Privacy Policy</Link>
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={!allChecked || loading}
            className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? <LoadingSpinner size="sm" /> : (
              <>Start Learning <ArrowRight className="h-5 w-5" /></>
            )}
          </button>
          <button
            onClick={() => {
              toast.warning('AI monitoring will be limited without consent');
              router.push('/student/dashboard');
            }}
            className="text-sm text-body hover:text-primary"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
