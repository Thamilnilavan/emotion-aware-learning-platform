'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { SessionHistory } from '@/components/student/SessionHistory';

export default function Page() {
  return (
    <ProtectedRoute role="student">
      <SessionHistory />
    </ProtectedRoute>
  );
}
