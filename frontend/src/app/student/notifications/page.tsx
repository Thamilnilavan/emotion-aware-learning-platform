'use client';

import { useEffect, useState } from 'react';
import { Bell, Trophy, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, type AppNotification } from '@/services/api/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function NotificationsContent() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.getNotifications().then((res) => {
      setNotifications(res.data.notifications || []);
      void authAPI.markNotificationsRead().then(() => {
        window.dispatchEvent(new Event('notifications-read'));
      });
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load notifications');
      setLoading(false);
    });
  }, []);

  const typeIcons: Record<string, any> = {
    achievement: Trophy,
    session: BookOpen,
    recommendation: AlertCircle,
    feedback: BookOpen,
    warning: AlertCircle,
    encouragement: Trophy,
    system: Bell,
  };

  const typeColors: Record<string, string> = {
    achievement: 'bg-warning/10 border-warning/30 text-warning',
    session: 'bg-primary/10 border-primary/30 text-primary',
    recommendation: 'bg-success/10 border-success/30 text-success',
    feedback: 'bg-primary/10 border-primary/30 text-primary',
    warning: 'bg-danger/10 border-danger/30 text-danger',
    encouragement: 'bg-success/10 border-success/30 text-success',
    system: 'bg-primary/10 border-primary/30 text-primary',
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
                notifications.map((notification) => {
                  const Icon = typeIcons[notification.type] || Bell;
                  return (
                    <div
                      key={notification._id}
                      className={`glass-card border p-4 ${typeColors[notification.type] || 'bg-muted/10 border-muted/30'}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/20 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <h4 className="font-semibold text-heading">{notification.title}</h4>
                            <span className="text-xs text-body">{new Date(notification.createdAt).toLocaleString()}</span>
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
