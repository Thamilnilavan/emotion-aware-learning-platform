'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Play, Clock, TrendingUp, Plus, Star, Users, Award } from 'lucide-react';
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
            <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((course) => (
                <Link
                  key={course._id}
                  href={`/student/courses/${course._id}`}
                  className="group cursor-pointer"
                >
                  <div className="glass-card overflow-hidden rounded-lg transition-all hover:shadow-xl">
                    <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                      <BookOpen className="h-16 w-16 text-primary/40" />
                    </div>

                    <div className="p-4">
                      <h3 className="mb-2 line-clamp-2 text-sm font-bold text-heading group-hover:text-primary transition-colors">{course.title}</h3>
                      <p className="mb-3 text-xs text-body">{getTeacherName(course.teacherId)}</p>
                      
                      <div className="mb-3 flex items-center gap-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-heading">4.8</span>
                        <span className="text-xs text-body">(2,341 ratings)</span>
                      </div>

                      <div className="mb-3 text-xs text-body">
                        {course.totalSessions || 0} lectures • {Math.round((course.totalSessions || 0) * 5)}h total length
                      </div>

                      <div className="mb-3">
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
                    </div>
                  </div>
                </Link>
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
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {availableCourses.map((course) => (
                  <div key={course._id} className="glass-card overflow-hidden rounded-lg transition-all hover:shadow-xl">
                    <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <BookOpen className="h-16 w-16 text-primary/40" />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-2 line-clamp-2 text-sm font-bold text-heading">{course.title}</h3>
                      <p className="mb-3 text-xs text-body">{getTeacherName(course.teacherId)}</p>
                      
                      <div className="mb-3 flex items-center gap-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-heading">4.6</span>
                        <span className="text-xs text-body">({Math.floor(Math.random() * 500 + 100)} ratings)</span>
                      </div>

                      <div className="mb-3 text-xs text-body">
                        {Math.floor(Math.random() * 20 + 5)} lectures • {Math.floor(Math.random() * 10 + 2)}h total length
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEnroll(course._id)}
                        disabled={enrollingId === course._id}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
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
