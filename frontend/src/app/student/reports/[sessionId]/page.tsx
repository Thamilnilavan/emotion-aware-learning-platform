'use client';

import { use } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { SessionReport } from '@/components/student/SessionReport';

export default function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  return (
    <ProtectedRoute role="student">
      <SessionReport sessionId={sessionId} />
    </ProtectedRoute>
  );
}
