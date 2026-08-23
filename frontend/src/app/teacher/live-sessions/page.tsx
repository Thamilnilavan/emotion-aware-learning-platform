'use client';

import { useEffect, useState } from 'react';
import { Video, Activity, Smile, Eye, Clock } from 'lucide-react';
import { toast } from 'sonner';
import teacherAPI from '@/services/api/teacher';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function LiveSessionsContent() {
  const [liveData, setLiveData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherAPI.getLiveSessions()
      .then(setLiveData)
      .catch(() => toast.error('Failed to load live sessions'))
      .finally(() => setLoading(false));
    
    // Near-real-time refresh backed by active MongoDB session data.
    const interval = setInterval(() => {
      teacherAPI.getLiveSessions()
        .then(setLiveData)
        .catch(() => {});
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const liveStudents = liveData?.liveStudents as Array<Record<string, any>> || [];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <Video className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">Live Sessions Monitor</h1>
              <p className="text-sm text-body">Real-time student engagement tracking</p>
            </div>
          </div>

          {liveStudents.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Video className="mx-auto mb-4 h-12 w-12 text-muted" />
              <h3 className="mb-2 text-lg font-bold text-heading">No Active Sessions</h3>
              <p className="text-body">No students are currently learning</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveStudents.map((student: any, index) => (
                <div key={index} className="glass-card p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-heading">{student.student.name}</h3>
                      <p className="text-sm text-body">{student.student.email}</p>
                      <p className="mt-1 text-xs font-medium text-primary">{student.course?.title || 'Course session'}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs font-semibold text-primary">Live</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-xs text-body">
                      <span>Course progress</span>
                      <span>{Math.round(student.progress || 0)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${student.progress || 0}%` }} />
                    </div>
                  </div>

                  <div className="mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-sm text-body">Engagement</span>
                      </div>
                      <span className={`text-sm font-bold ${student.engagement > 50 ? 'text-success' : 'text-danger'}`}>
                        {Math.round(student.engagement)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smile className="h-4 w-4 text-primary" />
                        <span className="text-sm text-body">Emotion</span>
                      </div>
                      <span className="text-sm font-bold text-heading capitalize">{student.emotion}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        <span className="text-sm text-body">Attention</span>
                      </div>
                      <span className={`text-sm font-bold ${student.attention === 'Focused' ? 'text-success' : 'text-danger'}`}>
                        {student.attention}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <Clock className="h-4 w-4 text-body" />
                    <span className="text-xs text-body">
                      Started: {new Date(student.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-body">Updated {new Date(student.lastUpdated).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="teacher">
      <LiveSessionsContent />
    </ProtectedRoute>
  );
}
