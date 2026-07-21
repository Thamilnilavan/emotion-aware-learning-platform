'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api/auth';
import { loginSchema, type LoginInput } from '@/lib/validators';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await authAPI.login(data.email, data.password);
      login(res.data.user, res.data.token);
      toast.success('Welcome back!');
      const routes: Record<string, string> = {
        student: '/student/dashboard',
        teacher: '/teacher/dashboard',
        admin: '/admin/dashboard',
      };
      router.push(routes[res.data.user.role] || '/');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-[#00838F] to-primary p-12 text-white lg:flex">
        <h1 className="mb-4 text-4xl font-extrabold">EmoLearn</h1>
        <p className="text-xl text-white/90">Learn smarter with AI</p>
        <p className="mt-6 max-w-md text-white/70">
          Real-time emotion detection and adaptive interventions designed to improve your learning outcomes.
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h2 className="mb-2 text-3xl font-bold text-heading">Welcome back</h2>
          <p className="mb-8 text-body">Sign in to continue learning</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-heading">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-body" />
                <input
                  {...register('email')}
                  type="email"
                  className={cn(
                    'w-full rounded-2xl border bg-white py-3 pl-11 pr-4 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                    errors.email && 'border-danger'
                  )}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-heading">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-body" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={cn(
                    'w-full rounded-2xl border bg-white py-3 pl-11 pr-12 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                    errors.password && 'border-danger'
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-body"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-body">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
