'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { CourseManager } from '@/components/teacher/CourseManager';

export default function Page() {
  return (
    <ProtectedRoute role="teacher">
      <CourseManager />
    </ProtectedRoute>
  );
}
