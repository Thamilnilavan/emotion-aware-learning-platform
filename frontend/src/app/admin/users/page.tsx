'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function Page() {
  return (
    <ProtectedRoute role="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
}
