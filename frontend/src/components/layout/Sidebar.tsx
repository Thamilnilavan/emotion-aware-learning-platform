'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Play, History, Shield, BookOpen, Users,
  BarChart3, AlertTriangle, Settings, Database, Activity, ChevronLeft,
  Bot, Award, Target, Calendar, Bell, User, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const studentItems: NavItem[] = [
  { href: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/student/courses', label: 'My Courses', icon: <BookOpen className="h-5 w-5" /> },
  { href: '/student/ai-assistant', label: 'AI Assistant', icon: <Bot className="h-5 w-5" /> },
  { href: '/student/reports', label: 'Session Reports', icon: <BarChart3 className="h-5 w-5" /> },
  { href: '/student/progress', label: 'Progress', icon: <TrendingUp className="h-5 w-5" /> },
  { href: '/student/achievements', label: 'Achievements', icon: <Award className="h-5 w-5" /> },
  { href: '/student/recommendations', label: 'Recommendations', icon: <Target className="h-5 w-5" /> },
  { href: '/student/planner', label: 'Planner', icon: <Calendar className="h-5 w-5" /> },
  { href: '/student/notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
  { href: '/student/privacy', label: 'Privacy Center', icon: <Shield className="h-5 w-5" /> },
  { href: '/student/profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
  { href: '/student/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
];

const teacherItems: NavItem[] = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/teacher/class-overview', label: 'Classes', icon: <BookOpen className="h-5 w-5" /> },
  { href: '/teacher/students', label: 'Students', icon: <Users className="h-5 w-5" /> },
  { href: '/teacher/live-sessions', label: 'Live Sessions', icon: <Activity className="h-5 w-5" /> },
  { href: '/teacher/at-risk', label: 'At-Risk', icon: <AlertTriangle className="h-5 w-5" /> },
  { href: '/teacher/emotions', label: 'Emotions', icon: <BarChart3 className="h-5 w-5" /> },
  { href: '/teacher/engagement-reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" /> },
  { href: '/teacher/courses', label: 'Manage', icon: <BookOpen className="h-5 w-5" /> },
];

const adminItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
  { href: '/admin/ai-monitoring', label: 'AI Monitoring', icon: <Activity className="h-5 w-5" /> },
  { href: '/admin/datasets', label: 'Datasets', icon: <Database className="h-5 w-5" /> },
  { href: '/admin/research', label: 'Research', icon: <BarChart3 className="h-5 w-5" /> },
  { href: '/admin/privacy', label: 'Privacy', icon: <Shield className="h-5 w-5" /> },
  { href: '/admin/system-health', label: 'System Health', icon: <Activity className="h-5 w-5" /> },
  { href: '/admin/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
];

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const items =
    user?.role === 'teacher' ? teacherItems :
    user?.role === 'admin' ? adminItems :
    studentItems;

  return (
    <>
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-dark-card text-white transition-all duration-300 min-h-[calc(100vh-4rem)]',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex items-center justify-between p-4">
          {!collapsed && <span className="text-sm font-semibold text-white/70">Menu</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 hover:bg-white/10"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-white font-bold' : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/10 bg-dark-card lg:hidden">
        {items.slice(0, 5).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-[10px]',
                active ? 'text-primary' : 'text-white/60'
              )}
            >
              {item.icon}
              <span className="truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
