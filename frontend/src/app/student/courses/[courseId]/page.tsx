'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Play, Clock, TrendingUp, Award, ArrowLeft, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import studentAPI from '@/services/api/student';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { getScoreColor } from '@/lib/utils';

function CourseDetailsContent() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getCourseDetails(courseId as string);
      setCourse(response.course);
      setSessions(response.sessions || []);
    } catch (error) {
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8">
            <LoadingSpinner size="lg" className="py-20" />
          </main>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8">
            <div className="glass-card py-16 text-center">
              <p className="text-heading font-semibold">Course not found</p>
              <Link href="/student/courses" className="mt-4 inline-block text-primary hover:underline">
                Back to My Courses
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          {/* Back Button */}
          <Link
            href="/student/courses"
            className="mb-6 inline-flex items-center gap-2 text-sm text-body hover:text-heading"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Courses
          </Link>

          {/* Course Banner */}
          <div className="mb-8 glass-card overflow-hidden rounded-2xl">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <BookOpen className="h-24 w-24 text-primary/50" />
            </div>
            <div className="p-6">
              <h1 className="mb-2 text-2xl font-extrabold text-heading">{course.title}</h1>
              <p className="text-body">{course.description}</p>
            </div>
          </div>

          {/* Course Analytics */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card rounded-xl p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-body">
                <TrendingUp className="h-4 w-4 text-primary" />
                Average Engagement
              </div>
              <p className="text-2xl font-bold text-heading">{course.averageEngagement || 0}%</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-body">
                <Award className="h-4 w-4 text-primary" />
                Focus Percentage
              </div>
              <p className="text-2xl font-bold text-heading">{course.focusPercentage || 0}%</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-body">
                <Clock className="h-4 w-4 text-primary" />
                Learning Hours
              </div>
              <p className="text-2xl font-bold text-heading">{course.learningHours || 0}h</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-body">
                <BarChart3 className="h-4 w-4 text-primary" />
                Completion Rate
              </div>
              <p className="text-2xl font-bold text-heading">{course.progress || 0}%</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8 glass-card rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-heading">Course Progress</h3>
              <span className="text-lg font-bold text-primary">{course.progress || 0}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted">
              <div
                className="h-3 rounded-full bg-primary transition-all"
                style={{ width: `${course.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Session List */}
          <div>
            <h2 className="mb-4 text-xl font-bold text-heading">Course Sessions</h2>
            {sessions.length === 0 ? (
              <div className="glass-card py-12 text-center">
                <p className="text-body">No sessions available yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <div key={session._id} className="glass-card rounded-xl p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                            Session {String(index + 1).padStart(2, '0')}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                              session.status === 'completed'
                                ? 'bg-success/10 text-success'
                                : 'bg-muted text-body'
                            }`}
                          >
                            {session.status === 'completed' ? 'Completed' : 'Not Started'}
                          </span>
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-heading">{session.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-body">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {session.duration || '45 min'}
                          </div>
                          {session.previousEngagement && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Previous Engagement: {session.previousEngagement}%
                            </div>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/student/courses/${courseId}/sessions/${session._id}`}
                        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                      >
                        <Play className="h-4 w-4" />
                        {session.status === 'completed' ? 'Review Session' : 'Start Session'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="student">
      <CourseDetailsContent />
    </ProtectedRoute>
  );
}
