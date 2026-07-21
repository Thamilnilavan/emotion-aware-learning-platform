'use client';

import { ConsentScreen } from '@/components/auth/ConsentScreen';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export default function ConsentPage() {
  return (
    <ProtectedRoute role="student">
      <ConsentScreen />
    </ProtectedRoute>
  );
}
