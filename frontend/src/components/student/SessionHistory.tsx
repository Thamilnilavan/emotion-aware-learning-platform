'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { sessionAPI } from '@/services/api/sessions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { formatDuration, getScoreColor, getEmotionEmoji } from '@/lib/utils';
import type { LearningSession } from '@/types';

export function SessionHistory() {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [scoreFilter, setScoreFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    sessionAPI.getMy(page, 10)
      .then((res) => {
        let filtered = res.data.sessions;
        if (scoreFilter === 'good') filtered = filtered.filter((s) => (s.summary?.averageScore || 0) >= 70);
        else if (scoreFilter === 'average') filtered = filtered.filter((s) => { const sc = s.summary?.averageScore || 0; return sc >= 45 && sc < 70; });
        else if (scoreFilter === 'poor') filtered = filtered.filter((s) => (s.summary?.averageScore || 0) < 45);
        setSessions(filtered);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.totalCount);
      })
      .finally(() => setLoading(false));
  }, [page, scoreFilter]);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <h1 className="mb-6 text-2xl font-extrabold text-heading">Session History</h1>

          <div className="mb-6 flex flex-wrap gap-3">
            <select value={scoreFilter} onChange={(e) => { setScoreFilter(e.target.value); setPage(1); }} className="rounded-xl border bg-white px-4 py-2 text-sm">
              <option value="all">All Scores</option>
              <option value="good">Good (≥70)</option>
              <option value="average">Average (45-69)</option>
              <option value="poor">Poor (&lt;45)</option>
            </select>
            <button onClick={() => { setScoreFilter('all'); setPage(1); }} className="rounded-xl border px-4 py-2 text-sm hover:bg-white/50">Clear filters</button>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" className="py-20" />
          ) : sessions.length === 0 ? (
            <div className="glass-card py-16 text-center">
              <p className="mb-4 text-4xl">📚</p>
              <p className="mb-4 text-heading font-semibold">No sessions yet</p>
              <Link href="/student/dashboard" className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white">Start your first session</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session._id} className="glass-card flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold text-heading">
                      {typeof session.courseId === 'object' ? session.courseId?.title : 'Session'}
                    </p>
                    <p className="text-sm text-body">
                      {session.endTime ? new Date(session.endTime).toLocaleDateString() : ''} · {formatDuration(session.durationSeconds)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getEmotionEmoji(session.summary?.dominantEmotion || 'Neutral')}</span>
                    <span className="rounded-full px-4 py-1.5 text-lg font-bold text-white" style={{ backgroundColor: getScoreColor(session.summary?.averageScore || 0) }}>
                      {session.summary?.averageScore || 0}%
                    </span>
                    <Link href={`/student/reports/${session._id}`} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
                      View Report
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40">Previous</button>
              <span className="text-sm text-body">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
