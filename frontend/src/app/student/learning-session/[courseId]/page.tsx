'use client';

import { use } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { SessionPlayer } from '@/components/student/SessionPlayer';

export default function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  return (
    <ProtectedRoute role="student">
      <SessionPlayer courseId={courseId} />
    </ProtectedRoute>
  );
}
