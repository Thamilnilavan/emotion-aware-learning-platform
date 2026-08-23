'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Bell, Send } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import adminAPI from '@/services/api/admin';
import { authAPI } from '@/services/api/auth';

function NotificationsContent() {
  const [items, setItems] = useState<Array<Record<string, any>>>([]);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', targetRole: '' });
  const load = async () => { try { const result = await adminAPI.getNotifications(); setItems(result.notifications || []); } catch { toast.error('Failed to load notifications'); } };
  useEffect(()=>{load();void authAPI.markNotificationsRead().then(()=>window.dispatchEvent(new Event('notifications-read')));},[]);
  const send = async (event: FormEvent) => { event.preventDefault(); setSending(true); try { const result = await adminAPI.createNotification({...form, targetRole:form.targetRole || undefined}); toast.success(`Notification delivered to ${result.delivered} user(s)`); setForm({title:'',message:'',targetRole:''}); await load(); } catch(error:any){toast.error(error?.response?.data?.message || 'Could not send notification');} finally{setSending(false);} };
  return <div className="min-h-screen bg-background pb-20 lg:pb-0"><Navbar/><div className="flex"><Sidebar/><main className="flex-1 p-4 md:p-8"><h1 className="text-2xl font-extrabold text-heading">System Notifications</h1><p className="mb-7 text-sm text-body">Send announcements to all users or a selected role.</p>
    <form onSubmit={send} className="glass-card mb-7 space-y-4 p-6"><div className="grid gap-4 md:grid-cols-2"><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Notification title" className="rounded-xl border px-4 py-2"/><select value={form.targetRole} onChange={e=>setForm({...form,targetRole:e.target.value})} className="rounded-xl border px-4 py-2"><option value="">All active users</option><option value="student">Students</option><option value="teacher">Teachers</option><option value="admin">Administrators</option></select></div><textarea required rows={4} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Message" className="w-full rounded-xl border px-4 py-3"/><button disabled={sending} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-white"><Send className="h-4 w-4"/>{sending?'Sending…':'Send notification'}</button></form>
    <div className="glass-card p-6"><div className="mb-4 flex items-center gap-2"><Bell className="h-5 w-5 text-primary"/><h2 className="font-bold text-heading">Delivery history</h2></div><div className="space-y-3">{items.map(item=><div key={String(item._id)} className="rounded-xl bg-muted/50 p-4"><div className="flex justify-between gap-3"><p className="font-semibold text-heading">{item.title}</p><time className="text-xs text-body">{new Date(item.createdAt).toLocaleString()}</time></div><p className="mt-1 text-sm text-body">{item.message}</p><p className="mt-2 text-xs text-body">Recipient: {item.recipientId?.name || 'Unknown'} ({item.recipientId?.role || 'user'})</p></div>)}{items.length===0&&<p className="text-sm text-body">No notifications sent yet.</p>}</div></div>
  </main></div></div>;
}
export default function Page(){return <ProtectedRoute role="admin"><NotificationsContent/></ProtectedRoute>;}
