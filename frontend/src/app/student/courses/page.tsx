'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Layers3,
  Play,
  Plus,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import studentAPI from '@/services/api/student';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import type { Course } from '@/types';

type CourseFilter = 'all' | 'in-progress' | 'completed';

const getTeacherName = (teacher: Course['teacherId']) =>
  typeof teacher === 'object' && teacher?.name ? teacher.name : 'Course instructor';

const getCourseMinutes = (course: Course) =>
  (course.content || []).reduce((sum, item) => sum + (Number(item.durationMinutes) || 0), 0);

const formatDuration = (minutes: number) => {
  if (!minutes) return 'Self-paced';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

function CoursesContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CourseFilter>('all');

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
      setAvailableCourses((availableRes.courses || []).filter((course: Course) => !enrolledIds.has(course._id)));
    } catch {
      toast.error('Unable to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCourses(); }, []);

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingId(courseId);
      await studentAPI.enrollInCourse(courseId);
      toast.success('You are now enrolled');
      await loadCourses();
    } catch {
      toast.error('Unable to enrol in this course');
    } finally {
      setEnrollingId(null);
    }
  };

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      const progress = Number(course.progress) || 0;
      const matchesSearch = !query || course.title.toLowerCase().includes(query) || course.description?.toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || (filter === 'completed' ? progress >= 100 : progress < 100);
      return matchesSearch && matchesFilter;
    });
  }, [courses, search, filter]);

  const completedCount = courses.filter((course) => Number(course.progress) >= 100).length;
  const activeCount = courses.length - completedCount;
  const overallProgress = courses.length
    ? Math.round(courses.reduce((sum, course) => sum + (Number(course.progress) || 0), 0) / courses.length)
    : 0;

  if (loading) {
    return <div className="universe-shell flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="universe-shell pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 md:p-6 xl:p-8">
          <header className="mb-7">
            <p className="mb-1 flex items-center gap-2 text-sm font-bold text-[#F1FEC8]"><Sparkles className="h-4 w-4" /> MY LEARNING</p>
            <h1 className="universe-page-title text-2xl font-extrabold tracking-tight md:text-3xl">My Courses</h1>
            <p className="universe-page-copy mt-1 text-sm">Continue learning, review your progress or discover something new.</p>
          </header>

          <section className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Enrolled courses', value: courses.length, icon: BookOpen, colour: 'bg-primary/10 text-primary' },
              { label: 'In progress', value: activeCount, icon: Play, colour: 'bg-secondary/60 text-primary' },
              { label: 'Completed', value: completedCount, icon: CheckCircle2, colour: 'bg-emerald-100 text-emerald-600' },
              { label: 'Overall progress', value: `${overallProgress}%`, icon: Layers3, colour: 'bg-amber-100 text-amber-600' },
            ].map(({ label, value, icon: Icon, colour }) => (
              <div key={label} className="liquid-glass rounded-2xl p-4">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${colour}`}><Icon className="h-5 w-5" /></div>
                <p className="text-2xl font-extrabold text-heading">{value}</p><p className="text-xs font-semibold text-body">{label}</p>
              </div>
            ))}
          </section>

          <section className="mb-10">
            <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div><h2 className="universe-page-title text-xl font-extrabold">Enrolled courses</h2><p className="universe-page-copy text-sm">Your active learning library</p></div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search my courses" className="liquid-control h-10 w-full rounded-xl pl-10 pr-4 text-sm text-heading outline-none transition focus:border-primary sm:w-60" />
                </label>
                <div className="liquid-control flex rounded-xl p-1">
                  {(['all', 'in-progress', 'completed'] as CourseFilter[]).map((item) => (
                    <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${filter === item ? 'bg-dark-card text-white' : 'text-body hover:bg-muted'}`}>{item.replace('-', ' ')}</button>
                  ))}
                </div>
              </div>
            </div>

            {filteredCourses.length ? (
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {filteredCourses.map((course, index) => <EnrolledCourseCard key={course._id} course={course} index={index} />)}
              </div>
            ) : (
              <div className="liquid-glass rounded-2xl border-dashed py-14 text-center">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-body" />
                <h3 className="font-bold text-heading">{courses.length ? 'No matching courses' : 'Your learning library is empty'}</h3>
                <p className="mt-1 text-sm text-body">{courses.length ? 'Try a different search or filter.' : 'Choose an available course below to begin.'}</p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-5"><h2 className="universe-page-title text-xl font-extrabold">Discover courses</h2><p className="universe-page-copy text-sm">Courses available for enrolment</p></div>
            {availableCourses.length ? (
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {availableCourses.map((course, index) => (
                  <AvailableCourseCard key={course._id} course={course} index={index} enrolling={enrollingId === course._id} onEnroll={handleEnroll} />
                ))}
              </div>
            ) : (
              <div className="liquid-glass rounded-2xl p-8 text-center text-sm text-body">You are enrolled in every currently available course.</div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function EnrolledCourseCard({ course, index }: { course: Course; index: number }) {
  const progress = Math.min(100, Math.max(0, Math.round(Number(course.progress) || 0)));
  const completed = progress >= 100;
  const gradients = ['from-[#F1FEC8]/70 to-white/30', 'from-white/35 to-[#F1FEC8]/60', 'from-[#F1FEC8]/55 to-white/40'];
  return (
    <article className="liquid-glass overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-xl">
      <div className={`relative h-32 bg-gradient-to-br ${gradients[index % gradients.length]} p-5 text-heading`}>
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border border-slate-200/70 bg-white/30" />
        <span className="inline-flex rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-bold text-body">{completed ? 'COMPLETED' : 'IN PROGRESS'}</span>
        <BookOpen className="absolute bottom-5 right-5 h-10 w-10 text-primary/35" />
      </div>
      <div className="p-5">
        <h3 className="line-clamp-1 text-lg font-extrabold text-heading">{course.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-body"><UserRound className="h-3.5 w-3.5" /> {getTeacherName(course.teacherId)}</p>
        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-body">{course.description || 'Course learning materials and guided sessions.'}</p>
        <div className="mt-4 flex gap-4 text-xs font-semibold text-body"><span className="flex items-center gap-1"><Layers3 className="h-3.5 w-3.5" /> {course.content?.length || 0} items</span><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {formatDuration(getCourseMinutes(course))}</span></div>
        <div className="mt-5"><div className="mb-2 flex justify-between text-xs font-bold"><span className="text-heading">Course progress</span><span className="text-primary">{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/80" style={{ width: `${progress}%` }} /></div></div>
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
          <Link href={`/student/learning-session/${course._id}`} className="flex items-center justify-center gap-2 rounded-xl bg-dark-card px-4 py-3 text-sm font-bold text-white transition hover:bg-primary"><Play className="h-4 w-4 fill-current" /> {completed ? 'Review course' : progress ? 'Continue learning' : 'Start learning'}</Link>
          <Link href={`/student/courses/${course._id}`} aria-label={`View ${course.title} details`} className="flex items-center justify-center rounded-xl border border-border px-4 text-heading transition hover:border-primary hover:text-primary"><ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </article>
  );
}

function AvailableCourseCard({ course, index, enrolling, onEnroll }: { course: Course; index: number; enrolling: boolean; onEnroll: (id: string) => void }) {
  const gradients = ['from-[#F1FEC8]/70 to-white/30', 'from-white/35 to-[#F1FEC8]/60', 'from-[#F1FEC8]/55 to-white/40'];
  return (
    <article className="liquid-glass overflow-hidden rounded-2xl">
      <div className={`relative h-28 bg-gradient-to-br ${gradients[index % gradients.length]} p-5 text-heading`}><span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-bold text-body">AVAILABLE</span><Sparkles className="absolute bottom-4 right-5 h-8 w-8 text-primary/30" /></div>
      <div className="p-5"><h3 className="line-clamp-1 text-lg font-extrabold text-heading">{course.title}</h3><p className="mt-1 text-xs text-body">By {getTeacherName(course.teacherId)}</p><p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-body">{course.description || 'Explore this course and build new skills.'}</p><div className="mt-4 flex gap-4 text-xs font-semibold text-body"><span>{course.content?.length || 0} learning items</span><span>{formatDuration(getCourseMinutes(course))}</span></div><button type="button" onClick={() => onEnroll(course._id)} disabled={enrolling} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"><Plus className="h-4 w-4" /> {enrolling ? 'Enrolling…' : 'Enrol in course'}</button></div>
    </article>
  );
}

export default function Page() {
  return <ProtectedRoute role="student"><CoursesContent /></ProtectedRoute>;
}
