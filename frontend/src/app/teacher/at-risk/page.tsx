'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown, Heart, Eye, Mail } from 'lucide-react';
import { toast } from 'sonner';
import teacherAPI from '@/services/api/teacher';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function AtRiskContent() {
  const [atRiskData, setAtRiskData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherAPI.getAtRiskStudents()
      .then(setAtRiskData)
      .catch(() => toast.error('Failed to load at-risk students'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const atRiskStudents = atRiskData?.atRiskStudents as Array<Record<string, any>> || [];

  const sendIntervention = async (student: Record<string, any>) => {
    try {
      await teacherAPI.sendFeedback({
        studentId: String(student.student._id),
        type: 'encouragement',
        message: 'Your recent learning analytics indicate reduced engagement. Please review your study plan, revisit difficult material, or take a short restorative break before continuing.',
      });
      toast.success(`Support message sent to ${student.student.name}`);
    } catch { toast.error('Failed to send support message'); }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-danger" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">At-Risk Students</h1>
              <p className="text-sm text-body">Students requiring immediate attention</p>
            </div>
          </div>

          {atRiskStudents.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-success" />
              <h3 className="mb-2 text-lg font-bold text-heading">No At-Risk Students</h3>
              <p className="text-body">All students are performing well!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {atRiskStudents.map((student: any, index) => (
                <div key={index} className="glass-card border-l-4 border-l-danger p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-heading">{student.student.name}</h3>
                      <p className="text-sm text-body">{student.student.email}</p>
                      <p className="text-xs text-body">{student.student.programme}</p>
                    </div>
                    <div className="rounded-full bg-danger/20 p-2">
                      <AlertTriangle className="h-5 w-5 text-danger" />
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-body">Engagement</span>
                      <span className="text-sm font-bold text-danger">{student.engagement}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-body">Emotion</span>
                      <span className="text-sm font-bold text-heading capitalize">{student.emotion}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-body">Attention</span>
                      <span className="text-sm font-bold text-heading">{student.attention}%</span>
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg bg-muted/50 p-3">
                    <p className="mb-2 text-xs font-semibold text-heading">Risk Factors:</p>
                    <div className="flex flex-wrap gap-2">
                      {student.riskFactors.lowEngagement && (
                        <span className="flex items-center gap-1 rounded-full bg-danger/20 px-2 py-1 text-xs text-danger">
                          <TrendingDown className="h-3 w-3" /> Low Engagement
                        </span>
                      )}
                      {student.riskFactors.frequentNegativeEmotions && (
                        <span className="flex items-center gap-1 rounded-full bg-danger/20 px-2 py-1 text-xs text-danger">
                          <Heart className="h-3 w-3" /> Negative Emotions
                        </span>
                      )}
                      {student.riskFactors.poorAttention && (
                        <span className="flex items-center gap-1 rounded-full bg-danger/20 px-2 py-1 text-xs text-danger">
                          <Eye className="h-3 w-3" /> Poor Attention
                        </span>
                      )}
                    </div>
                  </div>

                  <button onClick={() => sendIntervention(student)} className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                    Send Intervention
                  </button>
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
      <AtRiskContent />
    </ProtectedRoute>
  );
}
