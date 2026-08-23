'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import teacherAPI from '@/services/api/teacher';

function AnalyticsIndex(){const [students,setStudents]=useState<Array<Record<string,any>>>([]);const [loading,setLoading]=useState(true);useEffect(()=>{teacherAPI.getStudents().then(result=>setStudents(result.students||[])).catch(()=>toast.error('Failed to load students')).finally(()=>setLoading(false));},[]);if(loading)return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg"/></div>;return <div className="min-h-screen bg-background pb-20 lg:pb-0"><Navbar/><div className="flex"><Sidebar/><main className="flex-1 p-4 md:p-8"><div className="mb-7 flex items-center gap-3"><BarChart3 className="h-8 w-8 text-primary"/><div><h1 className="text-2xl font-extrabold text-heading">Student Analytics</h1><p className="text-sm text-body">Select a student to review engagement, emotion and attention history.</p></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{students.map(item=><Link key={item.student._id} href={`/teacher/students/${item.student._id}`} className="glass-card p-5 transition hover:-translate-y-0.5"><h2 className="font-bold text-heading">{item.student.name}</h2><p className="text-sm text-body">{item.student.email}</p><p className="mt-4 text-sm text-body">Latest engagement: <b className="text-heading">{item.latestSession?.summary?.averageScore!=null?`${Math.round(item.latestSession.summary.averageScore)}%`:'No session data'}</b></p></Link>)}{students.length===0&&<p className="text-body">No enrolled students available.</p>}</div></main></div></div>;}
export default function Page(){return <ProtectedRoute role="teacher"><AnalyticsIndex/></ProtectedRoute>;}
