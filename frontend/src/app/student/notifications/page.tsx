'use client';

import { useEffect, useState } from 'react';
import { Bell, Trophy, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { dashboardAPI } from '@/services/api/dashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStudent().then((res) => {
      // Mock notifications based on dashboard data
      setNotifications([
        { id: 1, type: 'achievement', title: 'Achievement Unlocked!', message: 'You earned the First Steps badge', time: '2 hours ago', icon: Trophy },
        { id: 2, type: 'session', title: 'Session Reminder', message: 'Your scheduled session starts in 30 minutes', time: '1 hour ago', icon: BookOpen },
        { id: 3, type: 'recommendation', title: 'New Recommendation', message: 'Based on your progress, try Advanced Topics', time: 'Yesterday', icon: AlertCircle },
      ]);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const typeIcons: Record<string, any> = {
    achievement: Trophy,
    session: BookOpen,
    recommendation: AlertCircle,
  };

  const typeColors: Record<string, string> = {
    achievement: 'bg-warning/10 border-warning/30 text-warning',
    session: 'bg-primary/10 border-primary/30 text-primary',
    recommendation: 'bg-success/10 border-success/30 text-success',
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">Notifications</h1>
              <p className="text-sm text-body">Stay updated with your learning journey</p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <Bell className="mx-auto mb-4 h-12 w-12 text-muted" />
                  <h3 className="mb-2 text-lg font-bold text-heading">No Notifications</h3>
                  <p className="text-body">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notification: any) => {
                  const Icon = typeIcons[notification.type] || Bell;
                  return (
                    <div
                      key={notification.id}
                      className={`glass-card border p-4 ${typeColors[notification.type] || 'bg-muted/10 border-muted/30'}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/20 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <h4 className="font-semibold text-heading">{notification.title}</h4>
                            <span className="text-xs text-body">{notification.time}</span>
                          </div>
                          <p className="text-sm text-body">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="student">
      <NotificationsContent />
    </ProtectedRoute>
  );
}
