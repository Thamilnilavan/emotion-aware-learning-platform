'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu, X, ChevronDown, UserRound, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { authAPI } from '@/services/api/auth';
import { BrandLogo } from '@/components/common/BrandLogo';

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
  const notificationHref =
    user?.role === 'teacher' ? '/teacher/notifications' :
    user?.role === 'admin' ? '/admin/notifications' :
    '/student/notifications';
  const accountLinks = user?.role === 'student'
    ? [
        { href: '/student/profile', label: 'Profile', icon: UserRound },
        { href: '/student/settings', label: 'Settings', icon: Settings },
      ]
    : user?.role === 'admin'
      ? [{ href: '/admin/settings', label: 'Settings', icon: Settings }]
      : [];

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    let requestInFlight = false;

    const refreshNotifications = async () => {
      if (!active || requestInFlight) return;
      requestInFlight = true;

      try {
        const res = await authAPI.getNotifications();
        if (!active) return;
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        // A notification badge should never interrupt the rest of the app.
      } finally {
        requestInFlight = false;
      }
    };

    void refreshNotifications();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshNotifications();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    const handleNotificationsRead = () => setUnreadCount(0);
    window.addEventListener('notifications-read', handleNotificationsRead);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('notifications-read', handleNotificationsRead);
    };
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

  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    logout();
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/15 bg-dark-card/90 text-white shadow-lg backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" aria-label="Eduvo home">
          <BrandLogo priority imageClassName="h-11 w-11" nameClassName="text-lg text-white" />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-[#F1FEC8]',
                pathname.startsWith(link.href) && 'border-b-2 border-[#F1FEC8] text-[#F1FEC8] pb-0.5'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href={notificationHref} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} className="relative p-2">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="relative hidden md:block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 py-1.5 pl-1.5 pr-3 text-sm transition hover:border-white/25 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#F1FEC8]/60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold shadow-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[120px] truncate font-semibold">{user?.name}</span>
              <ChevronDown className={cn('h-4 w-4 text-white/70 transition-transform', dropdownOpen && 'rotate-180')} />
            </button>
            {dropdownOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-white/70 bg-background text-heading shadow-2xl backdrop-blur-xl">
                <div className="border-b border-border/70 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold">{user?.name}</p>
                      <p className="truncate text-xs text-body">{user?.email}</p>
                    </div>
                  </div>
                  <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">{user?.role}</span>
                </div>
                {accountLinks.length > 0 && <div className="p-2">
                  {accountLinks.map((item) => <Link key={item.href} role="menuitem" href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-primary/10 focus:bg-primary/10 focus:outline-none" onClick={() => setDropdownOpen(false)}><item.icon className="h-4 w-4 text-body" />{item.label}</Link>)}
                </div>}
                <div className="border-t border-border/70 p-2">
                  <button type="button" role="menuitem" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-danger transition hover:bg-danger/10 focus:bg-danger/10 focus:outline-none"><LogOut className="h-4 w-4" />Log out</button>
                </div>
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
          {accountLinks.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 py-3 text-sm font-medium" onClick={() => setMobileOpen(false)}><item.icon className="h-4 w-4" />{item.label}</Link>)}
          <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 border-t border-white/10 py-3 text-left text-sm text-danger"><LogOut className="h-4 w-4" />Log out</button>
        </div>
      )}
    </nav>
  );
}
