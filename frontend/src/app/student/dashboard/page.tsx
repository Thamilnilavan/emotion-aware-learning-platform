'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { StudentDashboard } from '@/components/student/StudentDashboard';

export default function Page() {
  return (
    <ProtectedRoute role="student">
      <StudentDashboard />
    </ProtectedRoute>
  );
}
