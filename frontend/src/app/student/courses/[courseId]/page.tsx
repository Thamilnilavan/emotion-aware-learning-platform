'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Play, Clock, TrendingUp, Award, ArrowLeft, BarChart3, Star, Users, CheckCircle } from 'lucide-react';
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
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Courses
          </Link>

          {/* Course Header - Compact */}
          <div className="mb-6 bg-white rounded-lg shadow overflow-hidden">
            <div className="aspect-[16/9] sm:aspect-[21/9] bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
              <BookOpen className="h-20 w-20 text-white/30" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h1 className="mb-1 text-xl font-bold text-gray-900">{course.title}</h1>
                  <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                </div>
                <Link
                  href={`/student/learning-session/${courseId}`}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors shrink-0"
                >
                  <Play className="h-4 w-4" />
                  Continue
                </Link>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {course.averageEngagement ? `${(course.averageEngagement / 20).toFixed(1)}` : 'No rating'}
                </span>
                <span>•</span>
                <span>{course.content?.length || 0} lectures</span>
                <span>•</span>
                <span>{course.totalSessions || 0} sessions</span>
              </div>
            </div>
          </div>

          {/* Course Stats - Compact */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-lg p-3 shadow">
              <div className="mb-1 flex items-center gap-2 text-xs text-gray-600">
                <TrendingUp className="h-3 w-3 text-purple-600" />
                Engagement
              </div>
              <p className="text-xl font-bold text-gray-900">{course.averageEngagement || 0}%</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow">
              <div className="mb-1 flex items-center gap-2 text-xs text-gray-600">
                <Award className="h-3 w-3 text-purple-600" />
                Focus
              </div>
              <p className="text-xl font-bold text-gray-900">{course.focusPercentage || 0}%</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow">
              <div className="mb-1 flex items-center gap-2 text-xs text-gray-600">
                <Clock className="h-3 w-3 text-purple-600" />
                Hours
              </div>
              <p className="text-xl font-bold text-gray-900">{course.learningHours || 0}h</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow">
              <div className="mb-1 flex items-center gap-2 text-xs text-gray-600">
                <BarChart3 className="h-3 w-3 text-purple-600" />
                Completion
              </div>
              <p className="text-xl font-bold text-gray-900">{course.progress || 0}%</p>
            </div>
          </div>

          {/* Progress Section - Compact */}
          <div className="mb-6 bg-white rounded-lg p-4 shadow">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Your Progress</h3>
              <span className="text-sm font-bold text-purple-600">{course.progress || 0}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-purple-600 transition-all"
                style={{ width: `${course.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Course Content - Compact */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-900">Course Content</h2>
              <p className="text-xs text-gray-600">{course.content?.length || 0} lectures • {course.totalSessions || 0} sessions</p>
            </div>
            <div className="divide-y divide-gray-200">
              {course.content?.sort((a: any, b: any) => a.order - b.order).map((content: any, index: number) => (
                <div key={content._id || index} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100">
                      <Play className="h-3 w-3 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">{content.title}</p>
                    </div>
                    <span className="text-xs text-gray-500">{Math.floor(Math.random() * 15 + 5)}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session History - Compact */}
          {sessions.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-sm font-bold text-gray-900">Session History</h2>
              <div className="space-y-2">
                {sessions.map((session, index) => (
                  <div key={session._id} className="bg-white rounded-lg p-3 shadow flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        session.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {session.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">Session {String(index + 1).padStart(2, '0')}</p>
                        <p className="text-xs text-gray-500">{session.duration || '45m'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {session.previousEngagement && (
                        <div className="text-right">
                          <p className="text-xs font-bold text-purple-600">{session.previousEngagement}%</p>
                        </div>
                      )}
                      <Link
                        href={`/student/courses/${courseId}/sessions/${session._id}`}
                        className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
                      >
                        <Play className="h-3 w-3" />
                        {session.status === 'completed' ? 'Review' : 'Start'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
