'use client';

import { useState } from 'react';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function PlannerContent() {
  const [studySessions, setStudySessions] = useState<Array<Record<string, any>>>([
    { id: 1, title: 'Mathematics Review', date: '2026-06-22', time: '10:00', duration: 60 },
    { id: 2, title: 'Physics Lab Prep', date: '2026-06-23', time: '14:00', duration: 90 },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [newSession, setNewSession] = useState({ title: '', date: '', time: '', duration: 60 });

  const handleAddSession = () => {
    if (!newSession.title || !newSession.date || !newSession.time) {
      toast.error('Please fill in all fields');
      return;
    }
    setStudySessions([...studySessions, { ...newSession, id: Date.now() }]);
    setNewSession({ title: '', date: '', time: '', duration: 60 });
    setShowForm(false);
    toast.success('Study session added');
  };

  const handleDeleteSession = (id: number) => {
    setStudySessions(studySessions.filter(s => s.id !== id));
    toast.success('Study session deleted');
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-extrabold text-heading">Study Planner</h1>
                <p className="text-sm text-body">Schedule your learning sessions</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Session
            </button>
          </div>

          {/* Add Session Form */}
          {showForm && (
            <div className="mb-8 glass-card p-6">
              <h3 className="mb-4 font-bold text-heading">Schedule New Session</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <input
                  type="text"
                  placeholder="Session Title"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  className="rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-body focus:border-primary focus:outline-none"
                />
                <input
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                  className="rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-body focus:border-primary focus:outline-none"
                />
                <input
                  type="time"
                  value={newSession.time}
                  onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                  className="rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-body focus:border-primary focus:outline-none"
                />
                <select
                  value={newSession.duration}
                  onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
                  className="rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-body focus:border-primary focus:outline-none"
                >
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleAddSession}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  Add Session
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-heading hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upcoming Sessions */}
          <div className="glass-card p-6">
            <h3 className="mb-4 font-bold text-heading">Upcoming Sessions</h3>
            <div className="space-y-3">
              {studySessions.length === 0 ? (
                <p className="py-8 text-center text-body">No study sessions scheduled</p>
              ) : (
                studySessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between rounded-xl border border-white/20 p-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/20 p-3">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-heading">{session.title}</p>
                        <p className="text-sm text-body">
                          {new Date(session.date).toLocaleDateString()} at {session.time} · {session.duration} min
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="rounded-lg p-2 text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
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
      <PlannerContent />
    </ProtectedRoute>
  );
}
