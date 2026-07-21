'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Bell, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { authAPI } from '@/services/api/auth';

const studentLinks = [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/learning-session', label: 'My Sessions' },
  { href: '/student/reports', label: 'History' },
];

const teacherLinks = [
  { href: '/teacher/dashboard', label: 'Dashboard' },
  { href: '/teacher/students', label: 'My Students' },
  { href: '/teacher/courses', label: 'Courses' },
];

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/ai-monitoring', label: 'System' },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const links =
    user?.role === 'teacher' ? teacherLinks :
    user?.role === 'admin' ? adminLinks :
    studentLinks;

  useEffect(() => {
    if (isAuthenticated) {
      authAPI.getNotifications().then((res) => {
        const notifications = (res.data.notifications || []) as Array<{ isRead: boolean }>;
        const unread = notifications.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-50 bg-[#0B3D6B] text-white shadow-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Brain className="h-7 w-7 text-[#00BCD4]" />
          <span>EmoLearn</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-[#00BCD4]',
                pathname.startsWith(link.href) && 'border-b-2 border-[#00838F] text-[#00BCD4] pb-0.5'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/student/notifications" className="relative p-2">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </Link>

          <div className="relative hidden md:block" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[100px] truncate">{user?.name}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white py-2 text-heading shadow-xl">
                <Link href="/student/profile" className="block px-4 py-2 text-sm hover:bg-background" onClick={() => setDropdownOpen(false)}>Profile</Link>
                <Link href="/student/settings" className="block px-4 py-2 text-sm hover:bg-background" onClick={() => setDropdownOpen(false)}>Settings</Link>
                <button onClick={logout} className="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-background">Logout</button>
              </div>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 px-4 py-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button onClick={logout} className="mt-2 block w-full py-3 text-left text-sm text-danger">Logout</button>
        </div>
      )}
    </nav>
  );
}
