'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api/auth';
import { registerSchema, type RegisterInput } from '@/lib/validators';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import { Brain } from 'lucide-react';
function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length < 8) return { label: 'Weak', color: 'bg-danger', width: 'w-1/3' };
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (hasNumber && hasSpecial) return { label: 'Strong', color: 'bg-success', width: 'w-full' };
  return { label: 'Medium', color: 'bg-warning', width: 'w-2/3' };
}

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const { login } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'student' },
  });

  const password = watch('password', '');
  const strength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setApiErrors({});
    try {
      const { confirmPassword, ...payload } = data;
      void confirmPassword;
      const res = await authAPI.register(payload);
      login(res.data.user, res.data.token);
      toast.success('Account created successfully!');
      if (res.data.user.role === 'student') {
        router.push('/consent');
      } else {
        const routes: Record<string, string> = {
          teacher: '/teacher/dashboard',
          admin: '/admin/dashboard',
        };
        router.push(routes[res.data.user.role] || '/');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Array<{ path: string; msg: string }>; message?: string } } };
      if (error.response?.data?.errors) {
        const fieldErrors: Record<string, string> = {};
        error.response.data.errors.forEach((e) => {
          fieldErrors[e.path] = e.msg;
        });
        setApiErrors(fieldErrors);
      } else {
        toast.error(error.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050505] px-6 py-12 text-white">
      {/* Sleek Mesh Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-[100%] bg-primary/20 blur-[150px] opacity-70 mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-[100%] bg-primary/15 blur-[120px] opacity-60 mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[10%] w-[40%] h-[40%] rounded-[100%] bg-blue-500/10 blur-[120px] opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a]/80 p-8 shadow-2xl backdrop-blur-3xl sm:p-12">
        <div className="mb-8 text-center">
          <Link href="/" className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg">
             <Brain className="h-6 w-6 text-white" />
          </Link>
          <h2 className="mb-2 text-3xl font-bold text-white">Create account</h2>
          <p className="text-white/50">Fill in your details to get started</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Full Name</label>
              <input {...register('name')} className={cn('w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all', errors.name && 'border-danger')} />
              {(errors.name || apiErrors.name) && <p className="mt-1 text-sm text-danger">{errors.name?.message || apiErrors.name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Email</label>
              <input {...register('email')} type="email" className={cn('w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all', errors.email && 'border-danger')} />
              {(errors.email || apiErrors.email) && <p className="mt-1 text-sm text-danger">{errors.email?.message || apiErrors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Password</label>
              <input {...register('password')} type="password" className={cn('w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all', errors.password && 'border-danger')} />
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-white/10">
                    <div className={cn('h-full rounded-full transition-all', strength.color, strength.width)} />
                  </div>
                  <p className="mt-1 text-xs text-white/50">{strength.label}</p>
                </div>
              )}
              {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" className={cn('w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all', errors.confirmPassword && 'border-danger')} />
              {errors.confirmPassword && <p className="mt-1 text-sm text-danger">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Role</label>
              <select {...register('role')} className="w-full rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">ICBT Number</label>
                <input {...register('icbtNumber')} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Optional" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Programme</label>
                <input {...register('programme')} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Optional" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60">
              {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">Sign in</Link>
          </p>
      </div>
    </div>
  );
}
