'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TrendingUp, Smile, Eye, Brain, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import teacherAPI from '@/services/api/teacher';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function StudentAnalyticsContent() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [analyticsData, setAnalyticsData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherAPI.getStudentAnalytics(studentId)
      .then((res) => setAnalyticsData(res.data))
      .catch(() => toast.error('Failed to load student analytics'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const student = analyticsData?.student as Record<string, any> | undefined;
  const analytics = analyticsData?.analytics as Record<string, any> | undefined;
  const engagementTrend = analytics?.engagementTrend as Array<Record<string, any>> || [];
  const emotionTrend = analytics?.emotionTrend as Array<Record<string, any>> || [];
  const attentionTrend = analytics?.attentionTrend as Array<Record<string, any>> || [];
  const aiSuggestions = analytics?.aiSuggestions as Array<Record<string, any>> || [];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-extrabold text-heading">Student Analytics</h1>
            <p className="text-body">{String(student?.name)} · {String(student?.email)}</p>
          </div>

          {/* Engagement Trend */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">Engagement Trend</h3>
            </div>
            <div className="space-y-2">
              {engagementTrend.slice(-10).map((data: any, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-20 text-sm text-body">{data.date}</span>
                  <div className="flex-1 h-6 rounded-full bg-muted">
                    <div 
                      className="h-6 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(data.score, 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-sm font-bold text-heading">{Math.round(data.score)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emotion Trend */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Smile className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">Emotion Trend</h3>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {emotionTrend.slice(-10).map((data: any, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                  <span className="text-sm text-body">{data.date}</span>
                  <span className="text-sm font-bold text-heading capitalize">{data.emotion}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attention Trend */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">Attention Trend</h3>
            </div>
            <div className="space-y-2">
              {attentionTrend.slice(-10).map((data: any, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-20 text-sm text-body">{data.date}</span>
                  <div className="flex-1 h-6 rounded-full bg-muted">
                    <div 
                      className="h-6 rounded-full bg-success transition-all"
                      style={{ width: `${Math.min(data.attention, 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-sm font-bold text-heading">{Math.round(data.attention)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">AI Suggestions History</h3>
            </div>
            <div className="space-y-3">
              {aiSuggestions.length > 0 ? (
                aiSuggestions.map((suggestion: any, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-lg bg-primary/10 border border-primary/20 p-4">
                    <Calendar className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-body">{suggestion.date}</p>
                      <p className="text-sm text-heading">{suggestion.suggestion}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-body">No AI suggestions generated yet</p>
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
    <ProtectedRoute role="teacher">
      <StudentAnalyticsContent />
    </ProtectedRoute>
  );
}
