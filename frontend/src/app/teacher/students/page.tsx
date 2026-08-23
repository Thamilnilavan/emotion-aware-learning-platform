'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import teacherAPI from '@/services/api/teacher';

function StudentsContent(){
  const [items,setItems]=useState<Array<Record<string,any>>>([]);const [loading,setLoading]=useState(true);const [search,setSearch]=useState('');
  useEffect(()=>{teacherAPI.getStudents().then(result=>setItems(result.students||[])).catch(()=>toast.error('Failed to load students')).finally(()=>setLoading(false));},[]);
  const filtered=useMemo(()=>items.filter(item=>`${item.student?.name} ${item.student?.email} ${item.student?.programme}`.toLowerCase().includes(search.toLowerCase())),[items,search]);
  if(loading)return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg"/></div>;
  return <div className="min-h-screen bg-background pb-20 lg:pb-0"><Navbar/><div className="flex"><Sidebar/><main className="flex-1 p-4 md:p-8"><div className="mb-6"><h1 className="text-2xl font-extrabold text-heading">My Students</h1><p className="text-sm text-body">Students enrolled in your courses.</p></div><label className="glass-card relative mb-5 block p-4"><Search className="absolute left-7 top-6 h-4 w-4 text-body"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search students" className="w-full rounded-xl border py-2 pl-9 pr-3"/></label><div className="glass-card overflow-x-auto p-6"><table className="w-full text-left text-sm"><thead><tr className="border-b text-body"><th className="pb-3">Student</th><th className="pb-3">Programme</th><th className="pb-3">Latest engagement</th><th className="pb-3">Last active</th><th className="pb-3"></th></tr></thead><tbody>{filtered.map(item=><tr key={item.student._id} className="border-b border-white/10"><td className="py-3"><p className="font-semibold text-heading">{item.student.name}</p><p className="text-xs text-body">{item.student.email}</p></td><td className="text-body">{item.student.programme||'—'}</td><td className="font-semibold text-heading">{item.latestSession?.summary?.averageScore!=null?`${Math.round(item.latestSession.summary.averageScore)}%`:'No sessions'}</td><td className="text-body">{item.latestSession?.endTime?new Date(item.latestSession.endTime).toLocaleDateString():'—'}</td><td className="text-right"><Link href={`/teacher/students/${item.student._id}`} className="text-primary hover:underline">View analytics</Link></td></tr>)}</tbody></table>{filtered.length===0&&<div className="py-10 text-center"><Users className="mx-auto mb-2 h-8 w-8 text-body"/><p className="text-body">No enrolled students found. Enrol students from Course Management.</p></div>}</div></main></div></div>;
}
export default function Page(){return <ProtectedRoute role="teacher"><StudentsContent/></ProtectedRoute>;}
