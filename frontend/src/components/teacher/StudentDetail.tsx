'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { toast } from 'sonner';
import { dashboardAPI } from '@/services/api/dashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { getScoreColor, getEmotionEmoji } from '@/lib/utils';
import type { LearningSession, User } from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface StudentDetailProps {
  studentId: string;
}

export function StudentDetail({ studentId }: StudentDetailProps) {
  const [student, setStudent] = useState<User | null>(null);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'encouragement' });

  useEffect(() => {
    dashboardAPI.getStudentSessions(studentId)
      .then((res) => {
        setStudent(res.data.student);
        setSessions(res.data.sessions || []);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const sendFeedback = async () => {
    try {
      await dashboardAPI.sendFeedback({ studentId, ...feedback });
      toast.success('Feedback sent');
      setShowModal(false);
      setFeedback({ message: '', type: 'encouragement' });
    } catch {
      toast.error('Failed to send feedback');
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const chartData = {
    labels: sessions.slice().reverse().map((_, i) => `S${i + 1}`),
    datasets: [{
      label: 'Engagement',
      data: sessions.slice().reverse().map((s) => s.summary?.averageScore || 0),
      borderColor: '#a556f0',
      pointBackgroundColor: sessions.slice().reverse().map((s) => getScoreColor(s.summary?.averageScore || 0)),
    }],
  };

  const avgScore = sessions.length
    ? Math.round(sessions.reduce((sum, s) => sum + (s.summary?.averageScore || 0), 0) / sessions.length)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                {student?.name?.charAt(0)}
              </span>
              <div>
                <h1 className="text-2xl font-bold text-heading">{student?.name}</h1>
                <p className="text-body">{student?.programme} · {student?.icbtNumber}</p>
              </div>
            </div>
            <button onClick={() => setShowModal(true)} className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white">Send Feedback</button>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Total Sessions', value: sessions.length },
              { label: 'Average Score', value: `${avgScore}%` },
              { label: 'Best Score', value: `${Math.max(...sessions.map((s) => s.summary?.averageScore || 0), 0)}%` },
              { label: 'Last Active', value: sessions[0]?.endTime ? new Date(sessions[0].endTime).toLocaleDateString() : '—' },
            ].map((s) => (
              <div key={s.label} className="glass-card p-4">
                <p className="text-xs text-body">{s.label}</p>
                <p className="font-bold text-heading">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Engagement Trend</h3>
            <div className="h-[250px]">
              {sessions.length > 0 ? (
                <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }} />
              ) : (
                <p className="flex h-full items-center justify-center text-body">No sessions</p>
              )}
            </div>
          </div>

          <div className="glass-card overflow-x-auto p-6">
            <h3 className="mb-4 font-bold text-heading">Sessions</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-body">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Emotion</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s._id} className="border-b border-white/10">
                    <td className="py-3">{s.endTime ? new Date(s.endTime).toLocaleDateString() : '—'}</td>
                    <td className="py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: getScoreColor(s.summary?.averageScore || 0) }}>
                        {s.summary?.averageScore}%
                      </span>
                    </td>
                    <td className="py-3">{getEmotionEmoji(s.summary?.dominantEmotion || 'Neutral')} {s.summary?.dominantEmotion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <h3 className="mb-4 font-bold text-heading">Send Feedback</h3>
            <select value={feedback.type} onChange={(e) => setFeedback({ ...feedback, type: e.target.value })} className="mb-4 w-full rounded-xl border px-4 py-2">
              <option value="encouragement">Encouragement</option>
              <option value="feedback">Feedback</option>
              <option value="warning">Warning</option>
            </select>
            <textarea value={feedback.message} onChange={(e) => setFeedback({ ...feedback, message: e.target.value })} rows={4} className="mb-4 w-full rounded-xl border px-4 py-2" placeholder="Your message..." />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl border py-2.5">Cancel</button>
              <button onClick={sendFeedback} className="flex-1 rounded-xl bg-primary py-2.5 font-semibold text-white">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
