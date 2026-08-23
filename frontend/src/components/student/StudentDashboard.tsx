'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Camera,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Eye,
  Lightbulb,
  Sparkles,
  ShieldCheck,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import studentAPI from '@/services/api/student';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { getScoreColor } from '@/lib/utils';

type DataRecord = Record<string, any>;

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
};

const formatRelativeDate = (value?: string) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  const today = new Date();
  const days = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export function StudentDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DataRecord | null>(null);
  const [progressData, setProgressData] = useState<DataRecord | null>(null);
  const [achievementsData, setAchievementsData] = useState<DataRecord | null>(null);
  const [recommendationsData, setRecommendationsData] = useState<DataRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentAPI.getDashboard(),
      studentAPI.getProgress(),
      studentAPI.getAchievements(),
      studentAPI.getRecommendations(),
    ])
      .then(([dashboard, progress, achievements, recommendations]) => {
        setDashboardData(dashboard);
        setProgressData(progress);
        setAchievementsData(achievements);
        setRecommendationsData(recommendations);
      })
      .catch((error) => {
        console.error('Dashboard error:', error);
        toast.error('Unable to load your learning dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  const recentSessions = (dashboardData?.recentSessions || []) as DataRecord[];
  const courseProgress = (progressData?.courseProgress || []) as DataRecord[];
  const recommendations = (recommendationsData?.recommendations || []) as DataRecord[];
  const badges = (achievementsData?.badges || []) as DataRecord[];
  const averageEngagement = Math.round(Number(dashboardData?.averageEngagement) || 0);
  const streakDays = Number(dashboardData?.streakDays) || 0;
  const totalStudyMinutes = Number(progressData?.totalStudyMinutes) || 0;
  const completedSessions = Number(progressData?.totalSessions) || 0;
  const earnedBadges = badges.filter((badge) => badge.earned);
  const latestEmotion = recentSessions[0]?.summary?.dominantEmotion || 'No data yet';
  const focusLabel = averageEngagement >= 75 ? 'Highly focused' : averageEngagement >= 50 ? 'Building focus' : completedSessions ? 'Needs attention' : 'Awaiting session';

  const activeCourses = useMemo(
    () => [...courseProgress].filter((course) => Number(course.progress) < 100).sort((a, b) => Number(b.progress) - Number(a.progress)),
    [courseProgress]
  );
  const nextCourse = activeCourses[0] || courseProgress[0];
  const overallProgress = courseProgress.length
    ? Math.round(courseProgress.reduce((sum, course) => sum + Number(course.progress || 0), 0) / courseProgress.length)
    : 0;

  const weeklyFocus = useMemo(() => {
    const backendWeek = (dashboardData?.weeklyProgress || []) as DataRecord[];
    return backendWeek.map((entry) => ({
      day: new Date(`${entry.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }),
      score: Math.round(Number(entry.averageScore) || 0),
    }));
  }, [dashboardData]);

  if (loading) {
    return <div className="universe-shell flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="universe-shell pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 md:p-6 xl:p-8">
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#F1FEC8]"><Sparkles className="h-4 w-4" /> AI LEARNING SPACE</p>
              <h1 className="universe-page-title text-2xl font-extrabold tracking-tight md:text-3xl">
                Welcome back, {user?.name?.split(' ')[0] || 'Learner'}
              </h1>
              <p className="universe-page-copy mt-1 text-sm">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · Keep your momentum going.
              </p>
            </div>
            <Link href="/student/courses" className="liquid-control inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-primary transition hover:-translate-y-0.5 hover:shadow-md">
              <BookOpen className="h-4 w-4" /> Browse courses
            </Link>
          </header>

          <section className="mb-6">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {[
                { label: 'Overall progress', value: `${overallProgress}%`, detail: `${courseProgress.length} enrolled`, icon: Target, tone: 'text-primary bg-primary/10' },
                { label: 'Avg. engagement', value: `${averageEngagement}%`, detail: averageEngagement >= 70 ? 'Strong focus' : 'Keep improving', icon: Brain, tone: 'text-primary bg-secondary/60' },
                { label: 'Study time', value: formatMinutes(totalStudyMinutes), detail: `${completedSessions} sessions`, icon: Clock3, tone: 'text-sky-600 bg-sky-100' },
                { label: 'Learning streak', value: `${streakDays} day${streakDays === 1 ? '' : 's'}`, detail: streakDays ? 'Keep it alive' : 'Start today', icon: Flame, tone: 'text-amber-600 bg-amber-100' },
              ].map(({ label, value, detail, icon: Icon, tone }) => (
                <div key={label} className="liquid-glass rounded-2xl p-4">
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div>
                  <p className="text-xl font-extrabold text-heading">{value}</p>
                  <p className="mt-0.5 text-xs font-semibold text-heading">{label}</p>
                  <p className="mt-1 text-xs text-body">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="universe-panel mb-6 rounded-2xl">
            <div className="relative z-[1] grid divide-y divide-white/10 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:divide-x md:divide-y-0">
              <div className="flex items-center gap-4 p-5">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                  <Brain className="h-6 w-6" /><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <div><p className="text-xs font-bold uppercase tracking-wider text-[#F1FEC8]">AI learning profile</p><p className="mt-1 text-sm font-semibold text-white">Personalised from {completedSessions} session{completedSessions === 1 ? '' : 's'}</p></div>
              </div>
              <div className="flex items-center gap-3 p-5"><div className="rounded-xl bg-[#F1FEC8]/15 p-2 text-[#F1FEC8]"><Camera className="h-5 w-5" /></div><div><p className="text-xs text-white/55">Latest emotion</p><p className="font-bold capitalize text-white">{latestEmotion}</p></div></div>
              <div className="flex items-center gap-3 p-5"><div className="rounded-xl bg-[#F1FEC8]/15 p-2 text-[#F1FEC8]"><Eye className="h-5 w-5" /></div><div><p className="text-xs text-white/55">Focus profile</p><p className="font-bold text-white">{focusLabel}</p></div></div>
              <div className="flex items-center gap-3 p-5"><div className="rounded-xl bg-[#F1FEC8]/15 p-2 text-[#F1FEC8]"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-xs text-white/55">Privacy mode</p><p className="font-bold text-white">No video stored</p></div></div>
            </div>
          </section>

          <section className="mb-6 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
            <div className="liquid-glass rounded-2xl p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div><h2 className="font-extrabold text-heading">Your courses</h2><p className="text-sm text-body">Continue where you left off</p></div>
                <Link href="/student/courses" className="text-sm font-bold text-primary hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {courseProgress.slice(0, 4).map((course) => (
                  <Link key={course.courseId} href={`/student/learning-session/${course.courseId}`} className="group flex items-center gap-4 rounded-2xl border border-border/60 p-4 transition hover:border-primary/30 hover:bg-primary/[0.03]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3"><p className="truncate text-sm font-bold text-heading">{course.title}</p><span className="text-xs font-bold text-primary">{Math.round(Number(course.progress) || 0)}%</span></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Number(course.progress) || 0)}%` }} /></div>
                      <p className="mt-2 text-xs text-body">{course.sessionsCompleted || 0} learning sessions completed</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-body transition group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                ))}
                {!courseProgress.length && <EmptyState icon={BookOpen} text="You are not enrolled in a course yet." href="/student/courses" action="Find a course" />}
              </div>
            </div>

            <div className="liquid-glass rounded-2xl p-5 md:p-6">
              <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-secondary/60 p-2 text-primary"><Zap className="h-5 w-5" /></div><div><h2 className="font-extrabold text-heading">AI recommendations</h2><p className="text-sm text-body">Generated from your learning patterns</p></div></div>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((item, index) => (
                  <Link key={`${item.title}-${index}`} href={item.courseId ? `/student/learning-session/${item.courseId}` : '/student/recommendations'} className="block rounded-2xl bg-muted/60 p-4 transition hover:bg-primary/10">
                    <div className="flex items-start gap-3"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-sm font-bold text-heading">{item.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-body">{item.description}</p></div></div>
                  </Link>
                ))}
                {!recommendations.length && <p className="rounded-xl bg-muted/60 p-4 text-sm text-body">Complete a learning session to receive personalised recommendations.</p>}
              </div>
              <Link href="/student/recommendations" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">All recommendations <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </section>

          <section className="mb-6 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
            <div className="liquid-glass rounded-2xl p-5 md:p-6">
              <div className="mb-6 flex items-center justify-between"><div><h2 className="font-extrabold text-heading">Focus this week</h2><p className="text-sm text-body">Engagement score from completed sessions</p></div><BarChart3 className="h-5 w-5 text-primary" /></div>
              <div className="grid h-48 grid-cols-7 gap-2 md:gap-4">
                {weeklyFocus.map(({ day, score }) => (
                  <div key={day} className="flex min-w-0 flex-col items-center justify-end gap-2">
                    <span className="text-xs font-bold text-heading">{score || '—'}</span>
                    <div className="flex h-32 w-full items-end overflow-hidden rounded-lg bg-muted"><div className="w-full rounded-lg bg-primary/75 transition-all" style={{ height: `${Math.max(score ? 8 : 0, score)}%` }} /></div>
                    <span className="text-xs text-body">{day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="liquid-glass rounded-2xl p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="font-extrabold text-heading">Recent achievements</h2><p className="text-sm text-body">{Number(achievementsData?.xp) || 0} total XP</p></div><Trophy className="h-5 w-5 text-amber-500" /></div>
              <div className="space-y-3">
                {earnedBadges.slice(0, 3).map((badge) => (
                  <div key={badge.name} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Trophy className="h-4 w-4" /></div><div><p className="text-sm font-bold text-heading">{badge.name}</p><p className="text-xs text-body">{badge.description || `${badge.tier} achievement`}</p></div></div>
                ))}
                {!earnedBadges.length && <div className="rounded-xl bg-muted/60 p-4 text-sm text-body">Your first achievement is waiting—complete a session to unlock it.</div>}
              </div>
              <Link href="/student/achievements" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">View achievements <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </section>

          <section className="liquid-glass rounded-2xl p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="font-extrabold text-heading">Recent learning sessions</h2><p className="text-sm text-body">Review your latest engagement reports</p></div><Link href="/student/reports" className="text-sm font-bold text-primary hover:underline">View reports</Link></div>
            <div className="divide-y divide-border/60">
              {recentSessions.slice(0, 5).map((session) => {
                const score = Math.round(Number(session.summary?.averageScore) || 0);
                return (
                  <Link key={session._id} href={`/student/reports/${session._id}`} className="grid items-center gap-3 py-4 transition hover:bg-muted/30 md:grid-cols-[1fr_150px_130px_32px] md:px-2">
                    <div className="flex min-w-0 items-center gap-3"><div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-heading">{typeof session.courseId === 'object' ? session.courseId?.title : 'Learning session'}</p><p className="text-xs text-body">{formatRelativeDate(session.endTime || session.startTime)}</p></div></div>
                    <div className="flex items-center gap-2 text-xs text-body"><CalendarDays className="h-4 w-4" /> {Math.max(1, Math.round(Number(session.durationSeconds || 0) / 60))} minutes</div>
                    <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getScoreColor(score) }} /><span className="text-sm font-bold text-heading">{score}% focus</span></div>
                    <ChevronRight className="hidden h-5 w-5 text-body md:block" />
                  </Link>
                );
              })}
              {!recentSessions.length && <EmptyState icon={Brain} text="No completed sessions yet. Your reports will appear here." href={nextCourse ? `/student/learning-session/${nextCourse.courseId}` : '/student/courses'} action="Start learning" />}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, href, action }: { icon: typeof BookOpen; text: string; href: string; action: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-7 text-center">
      <Icon className="mb-3 h-7 w-7 text-body" />
      <p className="text-sm text-body">{text}</p>
      <Link href={href} className="mt-3 text-sm font-bold text-primary hover:underline">{action}</Link>
    </div>
  );
}
