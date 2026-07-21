'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { TeacherDashboard } from '@/components/teacher/TeacherDashboard';

export default function Page() {
  return (
    <ProtectedRoute role="teacher">
      <TeacherDashboard />
    </ProtectedRoute>
  );
}
