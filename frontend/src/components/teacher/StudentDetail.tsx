'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Download, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';
import { dashboardAPI } from '@/services/api/dashboard';
import { teacherAPI } from '@/services/api/teacher';
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
  const [feedback, setFeedback] = useState({ message: '', type: 'encouragement', courseId: '' });
  const [commentSession, setCommentSession] = useState<LearningSession | null>(null);
  const [reportComment, setReportComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);

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
      setFeedback({ message: '', type: 'encouragement', courseId: '' });
    } catch {
      toast.error('Failed to send feedback');
    }
  };

  const openReportComment = (session: LearningSession) => {
    setCommentSession(session);
    setReportComment(session.teacherFeedback?.comment || '');
  };

  const saveReportComment = async () => {
    if (!commentSession || !reportComment.trim()) {
      toast.error('Please enter a report comment');
      return;
    }
    setSavingComment(true);
    try {
      const result = await teacherAPI.saveReportComment(studentId, commentSession._id, reportComment.trim());
      setSessions((current) => current.map((session) => (
        session._id === commentSession._id
          ? { ...session, teacherFeedback: result.teacherFeedback }
          : session
      )));
      toast.success('Report comment saved and student notified');
      setCommentSession(null);
      setReportComment('');
    } catch {
      toast.error('Failed to save report comment');
    } finally {
      setSavingComment(false);
    }
  };

  const exportData = () => {
    const exportData = {
      student: student,
      sessions: sessions,
      exportDate: new Date().toISOString(),
      averageScore: avgScore,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_${studentId}_analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
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
  const feedbackCourses = Array.from(new Map(
    sessions
      .filter((session) => typeof session.courseId === 'object')
      .map((session) => {
        const course = session.courseId as { _id: string; title: string };
        return [course._id, course] as const;
      })
  ).values());

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
            <div className="flex gap-3">
              <button onClick={exportData} className="flex items-center gap-2 rounded-2xl border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5">
                <Download className="h-4 w-4" /> Export
              </button>
              <button onClick={() => setShowModal(true)} className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white">Send Feedback</button>
            </div>
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
                  <th className="pb-3">Teacher Comment</th>
                  <th className="pb-3 text-right">Report Card</th>
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
                    <td className="max-w-xs py-3 text-body">
                      <span className="block truncate">{s.teacherFeedback?.comment || 'No comment yet'}</span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => openReportComment(s)}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
                      >
                        <MessageSquareText className="h-4 w-4" />
                        {s.teacherFeedback?.comment ? 'Edit' : 'Add comment'}
                      </button>
                    </td>
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
            <select value={feedback.courseId} onChange={(e) => setFeedback({ ...feedback, courseId: e.target.value })} className="mb-4 w-full rounded-xl border px-4 py-2">
              <option value="">General guidance</option>
              {feedbackCourses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
            </select>
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

      {commentSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-heading">Teacher Report Comment</h3>
            <p className="mt-1 text-sm text-body">
              This comment will appear on the student's analytics report card.
            </p>
            <textarea
              value={reportComment}
              onChange={(event) => setReportComment(event.target.value)}
              maxLength={2000}
              rows={6}
              className="mt-5 w-full rounded-xl border px-4 py-3"
              placeholder="Describe progress, strengths, and areas to improve..."
              autoFocus
            />
            <p className="mt-1 text-right text-xs text-body">{reportComment.length}/2000</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setCommentSession(null)} disabled={savingComment} className="flex-1 rounded-xl border py-2.5">Cancel</button>
              <button onClick={saveReportComment} disabled={savingComment || !reportComment.trim()} className="flex-1 rounded-xl bg-primary py-2.5 font-semibold text-white disabled:opacity-50">
                {savingComment ? 'Saving...' : 'Save & Notify Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
