'use client';

import { SessionPlayer } from '@/components/SessionPlayer';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useParams } from 'next/navigation';

function LearningSessionContent() {
  const { courseId, sessionId } = useParams();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-hidden">
          {courseId && sessionId && (
            <SessionPlayer courseId={courseId as string} sessionId={sessionId as string} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="student">
      <LearningSessionContent />
    </ProtectedRoute>
  );
}
