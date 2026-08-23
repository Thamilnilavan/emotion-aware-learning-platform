'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Backward-compatible redirect to the single canonical Session Player.
export default function LegacyLearningSessionPage() {
  const { courseId } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (courseId) router.replace(`/student/learning-session/${courseId}`);
  }, [courseId, router]);

  return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;
}
