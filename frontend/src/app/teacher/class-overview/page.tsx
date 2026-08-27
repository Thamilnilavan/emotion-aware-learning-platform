'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Users, Activity, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import teacherAPI from '@/services/api/teacher';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function ClassOverviewContent() {
  const [classData, setClassData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async (showError = false) => {
      try { const data = await teacherAPI.getClassOverview(); if (active) setClassData(data); }
      catch { if (showError) toast.error('Failed to load class overview'); }
      finally { if (active) setLoading(false); }
    };
    void load(true);
    const interval = window.setInterval(() => void load(false), 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const classes = classData?.classes as Array<Record<string, any>> || [];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">Class Overview</h1>
              <p className="text-sm text-body">Performance metrics across all courses</p>
            </div>
          </div>

          {classes.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted" />
              <h3 className="mb-2 text-lg font-bold text-heading">No Classes Found</h3>
              <p className="text-body">Create your first course to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls: any, index) => (
                <div key={index} className="glass-card p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-full bg-primary/20 p-3">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className={`flex items-center gap-2 rounded-full px-3 py-1 ${cls.isActive ? 'bg-success/20' : 'bg-muted'}`}>
                      <div className={`h-2 w-2 rounded-full ${cls.isActive ? 'bg-success' : 'bg-body'}`} />
                      <span className={`text-xs font-semibold ${cls.isActive ? 'text-success' : 'text-body'}`}>{cls.isActive ? 'Active' : 'Archived'}</span>
                    </div>
                  </div>

                  <h3 className="mb-4 text-lg font-bold text-heading">{cls.title}</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm text-body">Students</span>
                      </div>
                      <span className="text-sm font-bold text-heading">{cls.studentCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm text-body">Avg Engagement</span>
                      </div>
                      <span className={`text-sm font-bold ${cls.avgEngagement > 60 ? 'text-success' : 'text-danger'}`}>
                        {cls.avgEngagement}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-sm text-body">Active Sessions</span>
                      </div>
                      <span className="text-sm font-bold text-heading">{cls.activeSessions}</span>
                    </div>
                  </div>
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
      <ClassOverviewContent />
    </ProtectedRoute>
  );
}
