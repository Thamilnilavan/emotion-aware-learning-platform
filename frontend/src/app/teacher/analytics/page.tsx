'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { EarlyWarningPanel } from '@/components/teacher/EarlyWarningPanel';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { dashboardAPI } from '@/services/api/dashboard';

function EarlyWarningsPage() {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getEarlyWarnings().then((res) => setWarnings(res.data.warnings || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <h1 className="mb-6 text-2xl font-extrabold text-heading">Early Warnings</h1>
          {loading ? <LoadingSpinner /> : <EarlyWarningPanel atRiskStudents={warnings} />}
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return <ProtectedRoute role="teacher"><EarlyWarningsPage /></ProtectedRoute>;
}
