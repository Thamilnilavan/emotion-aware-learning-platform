'use client';

import Link from 'next/link';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { getScoreColor } from '@/lib/utils';

interface WarningStudent {
  student: { _id: string; name: string; email: string };
  averageScore: number;
  recentScores?: number[];
}

interface EarlyWarningPanelProps {
  atRiskStudents: WarningStudent[];
}

export function EarlyWarningPanel({ atRiskStudents }: EarlyWarningPanelProps) {
  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-danger" />
        <h3 className="font-bold text-heading">Early Warnings</h3>
        {atRiskStudents.length > 0 && (
          <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">{atRiskStudents.length}</span>
        )}
      </div>

      {atRiskStudents.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle className="mb-3 h-12 w-12 text-success" />
          <p className="text-sm text-body">All students are performing well this week</p>
        </div>
      ) : (
        <div className="space-y-3">
          {atRiskStudents.map((w) => (
            <div key={w.student._id} className="flex items-center justify-between rounded-2xl border border-danger/20 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                  {w.student.name.charAt(0)}
                </span>
                <div>
                  <p className="font-semibold text-heading">{w.student.name}</p>
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: getScoreColor(w.averageScore) }}>
                    Avg: {w.averageScore}%
                  </span>
                </div>
              </div>
              <Link href={`/teacher/students/${w.student._id}`} className="text-sm font-semibold text-primary hover:underline">
                View Sessions
              </Link>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-body">Students with average &lt; 45 over last 3 sessions</p>
    </div>
  );
}
