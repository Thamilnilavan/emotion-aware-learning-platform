'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, Search, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import adminAPI from '@/services/api/admin';

type AdminUser = { _id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string };

function UsersContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getUsers({ search: search || undefined, role: role || undefined, limit: 100 });
      setUsers(result.users || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, role]);

  useEffect(() => { const timer = setTimeout(loadUsers, 250); return () => clearTimeout(timer); }, [loadUsers]);

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await adminAPI.createUser(form);
      toast.success('User created');
      setForm({ name: '', email: '', password: '', role: 'student' });
      setShowCreate(false);
      await loadUsers();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Could not create user'); }
  };

  const updateUser = async (user: AdminUser, changes: { role?: string; isActive?: boolean }) => {
    try { await adminAPI.updateUser(user._id, changes); toast.success('User updated'); await loadUsers(); }
    catch { toast.error('Could not update user'); }
  };

  return <div className="min-h-screen bg-background pb-20 lg:pb-0"><Navbar /><div className="flex"><Sidebar />
    <main className="flex-1 p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-extrabold text-heading">User Management</h1><p className="text-sm text-body">Create accounts, assign roles and control access.</p></div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-white"><Plus className="h-4 w-4" /> Add user</button></div>
      {showCreate && <form onSubmit={createUser} className="glass-card mb-6 grid gap-3 p-5 md:grid-cols-5">
        <input required placeholder="Full name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} className="rounded-xl border px-3 py-2" />
        <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} className="rounded-xl border px-3 py-2" />
        <input required minLength={8} type="password" placeholder="Temporary password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} className="rounded-xl border px-3 py-2" />
        <select value={form.role} onChange={e => setForm({...form, role:e.target.value})} className="rounded-xl border px-3 py-2"><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select>
        <button className="rounded-xl bg-primary px-4 py-2 font-semibold text-white">Create account</button>
      </form>}
      <div className="glass-card mb-5 flex flex-wrap gap-3 p-4"><label className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-body" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email" className="w-full rounded-xl border py-2 pl-9 pr-3" /></label>
        <select value={role} onChange={e=>setRole(e.target.value)} className="rounded-xl border px-3 py-2"><option value="">All roles</option><option value="student">Students</option><option value="teacher">Teachers</option><option value="admin">Admins</option></select></div>
      {loading ? <LoadingSpinner size="lg" /> : <div className="glass-card overflow-x-auto p-5"><table className="w-full text-left text-sm"><thead><tr className="border-b text-body"><th className="pb-3">User</th><th className="pb-3">Role</th><th className="pb-3">Status</th><th className="pb-3">Joined</th><th className="pb-3 text-right">Access</th></tr></thead><tbody>{users.map(user=><tr key={user._id} className="border-b border-white/10"><td className="py-3"><p className="font-semibold text-heading">{user.name}</p><p className="text-xs text-body">{user.email}</p></td><td><select value={user.role} onChange={e=>updateUser(user,{role:e.target.value})} className="rounded-lg border px-2 py-1"><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select></td><td className={user.isActive?'text-success':'text-danger'}>{user.isActive?'Active':'Inactive'}</td><td className="text-body">{new Date(user.createdAt).toLocaleDateString()}</td><td className="text-right"><button onClick={()=>updateUser(user,{isActive:!user.isActive})} className="rounded-lg border p-2" title={user.isActive?'Deactivate':'Reactivate'}>{user.isActive?<UserX className="h-4 w-4 text-danger"/>:<UserCheck className="h-4 w-4 text-success"/>}</button></td></tr>)}</tbody></table>{users.length===0&&<p className="py-8 text-center text-body">No users found.</p>}</div>}
    </main></div></div>;
}

export default function Page(){return <ProtectedRoute role="admin"><UsersContent /></ProtectedRoute>;}
