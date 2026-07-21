'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Brain, Target, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import studentAPI from '@/services/api/student';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function RecommendationsContent() {
  const [recommendationsData, setRecommendationsData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getRecommendations()
      .then((res) => setRecommendationsData(res.data))
      .catch(() => toast.error('Failed to load recommendations'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const recommendations = recommendationsData?.recommendations as Array<Record<string, any>> || [];

  const priorityColors: Record<string, string> = {
    high: 'bg-danger/10 border-danger/30 text-danger',
    medium: 'bg-warning/10 border-warning/30 text-warning',
    low: 'bg-success/10 border-success/30 text-success',
  };

  const typeIcons: Record<string, any> = {
    study_habit: Target,
    wellbeing: AlertCircle,
    engagement: Brain,
    challenge: Target,
    course: BookOpen,
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">Personalized Recommendations</h1>
              <p className="text-sm text-body">AI-powered learning suggestions based on your progress</p>
            </div>
          </div>

          {recommendations.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Brain className="mx-auto mb-4 h-12 w-12 text-muted" />
              <h3 className="mb-2 text-lg font-bold text-heading">No Recommendations Yet</h3>
              <p className="text-body">Complete more learning sessions to get personalized AI recommendations.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((rec: any, index) => {
                const Icon = typeIcons[rec.type] || Brain;
                return (
                  <div 
                    key={index} 
                    className={`glass-card border p-6 ${priorityColors[rec.priority] || 'bg-muted/10 border-muted/30'}`}
                  >
                    <div className="mb-4 flex items-start gap-3">
                      <div className="rounded-full bg-primary/20 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-heading">{rec.title}</h3>
                        <span className="text-xs capitalize font-semibold">{rec.priority} priority</span>
                      </div>
                    </div>
                    <p className="text-sm text-body">{rec.description}</p>
                    {rec.courseId && (
                      <Link 
                        href={`/student/learning-session/${rec.courseId}`}
                        className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                      >
                        Start Learning
                      </Link>
                    )}
                  </div>
                );
              })}
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
      <RecommendationsContent />
    </ProtectedRoute>
  );
}
