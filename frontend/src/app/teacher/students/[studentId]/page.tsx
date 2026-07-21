'use client';

import { use } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { StudentDetail } from '@/components/teacher/StudentDetail';

export default function Page({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  return (
    <ProtectedRoute role="teacher">
      <StudentDetail studentId={studentId} />
    </ProtectedRoute>
  );
}
