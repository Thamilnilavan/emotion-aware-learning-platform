'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { authAPI, type AppNotification } from '@/services/api/auth';

function NotificationsContent(){const [items,setItems]=useState<AppNotification[]>([]);const [loading,setLoading]=useState(true);useEffect(()=>{authAPI.getNotifications(1,100).then(async({data})=>{setItems(data.notifications||[]);await authAPI.markNotificationsRead();window.dispatchEvent(new Event('notifications-read'));}).catch(()=>toast.error('Failed to load notifications')).finally(()=>setLoading(false));},[]);if(loading)return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg"/></div>;return <div className="min-h-screen bg-background pb-20 lg:pb-0"><Navbar/><div className="flex"><Sidebar/><main className="flex-1 p-4 md:p-8"><div className="mb-7 flex items-center gap-3"><Bell className="h-8 w-8 text-primary"/><div><h1 className="text-2xl font-extrabold text-heading">Teacher Notifications</h1><p className="text-sm text-body">Engagement alerts, feedback, and platform announcements.</p></div></div><div className="space-y-3">{items.map(item=>{const Icon=item.type==='warning'?AlertTriangle:item.type==='feedback'?BookOpen:Bell;return <article key={item._id} className={`glass-card border p-5 ${item.isRead?'border-white/30':'border-warning/50'}`}><div className="flex items-start gap-3"><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${item.type==='warning'?'text-danger':'text-primary'}`}/><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold text-heading">{item.title||'Notification'}</h2><time className="text-xs text-body">{new Date(item.createdAt).toLocaleString()}</time></div><p className="mt-2 text-sm text-body">{item.message}</p></div></div></article>})}{items.length===0&&<div className="glass-card p-10 text-center text-body">No notifications yet.</div>}</div></main></div></div>;}
export default function Page(){return <ProtectedRoute role="teacher"><NotificationsContent/></ProtectedRoute>;}
