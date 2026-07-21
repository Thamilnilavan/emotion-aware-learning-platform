'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Play, Clock, TrendingUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import studentAPI from '@/services/api/student';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

interface Course {
  _id: string;
  title: string;
  description: string;
  teacherId: string | { name?: string; email?: string };
  enrolledStudents: string[];
  content: any[];
  createdAt: string;
  progress?: number;
  averageEngagement?: number;
  totalSessions?: number;
  completedSessions?: number;
}

function CoursesContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const [enrolledRes, availableRes] = await Promise.all([
        studentAPI.getEnrolledCourses(),
        studentAPI.getAvailableCourses(),
      ]);

      const enrolled = enrolledRes.courses || [];
      const enrolledIds = new Set(enrolled.map((course: Course) => course._id));

      setCourses(enrolled);
      setAvailableCourses(
        (availableRes.courses || []).filter((course: Course) => !enrolledIds.has(course._id))
      );
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingId(courseId);
      await studentAPI.enrollInCourse(courseId);
      toast.success('Enrolled successfully');
      await loadCourses();
    } catch (error) {
      toast.error('Failed to enroll in course');
    } finally {
      setEnrollingId(null);
    }
  };

  const getTeacherName = (teacherId: Course['teacherId']) => {
    if (typeof teacherId === 'object' && teacherId?.name) {
      return teacherId.name;
    }
    return 'Instructor';
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

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-extrabold text-heading">My Courses</h1>
            <p className="text-body">Continue your learning journey</p>
          </div>

          {courses.length === 0 ? (
            <div className="glass-card mb-8 py-16 text-center">
              <BookOpen className="mx-auto mb-4 h-16 w-16 text-muted" />
              <p className="mb-4 text-xl font-semibold text-heading">No courses enrolled yet</p>
              <p className="text-body">Browse available courses below and enroll to get started</p>
            </div>
          ) : (
            <div className="mb-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div key={course._id} className="glass-card overflow-hidden rounded-2xl">
                  <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <BookOpen className="h-16 w-16 text-primary/50" />
                  </div>

                  <div className="p-6">
                    <h3 className="mb-2 line-clamp-2 text-lg font-bold text-heading">{course.title}</h3>
                    <p className="mb-4 line-clamp-2 text-sm text-body">{course.description}</p>

                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-heading">Progress</span>
                        <span className="text-primary">{course.progress || 0}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${course.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-body">Engagement: </span>
                        <span className="font-semibold text-heading">{course.averageEngagement || 0}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-body">Sessions: </span>
                        <span className="font-semibold text-heading">
                          {course.completedSessions || 0} / {course.totalSessions || 0}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/student/courses/${course._id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                    >
                      <Play className="h-4 w-4" />
                      Continue Learning
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <h2 className="mb-4 text-xl font-bold text-heading">Available Courses</h2>
            {availableCourses.length === 0 ? (
              <div className="glass-card py-12 text-center">
                <p className="text-body">No additional courses available right now</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableCourses.map((course) => (
                  <div key={course._id} className="glass-card overflow-hidden rounded-2xl">
                    <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <BookOpen className="h-14 w-14 text-primary/40" />
                    </div>
                    <div className="p-6">
                      <h3 className="mb-2 line-clamp-2 text-lg font-bold text-heading">{course.title}</h3>
                      <p className="mb-3 line-clamp-2 text-sm text-body">{course.description}</p>
                      <p className="mb-4 text-xs text-body">
                        Instructor: {getTeacherName(course.teacherId)}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleEnroll(course._id)}
                        disabled={enrollingId === course._id}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/20 disabled:opacity-60"
                      >
                        <Plus className="h-4 w-4" />
                        {enrollingId === course._id ? 'Enrolling...' : 'Enroll'}
                      </button>
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
      <CoursesContent />
    </ProtectedRoute>
  );
}
