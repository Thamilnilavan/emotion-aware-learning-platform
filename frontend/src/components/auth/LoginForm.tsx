'use client';

import { useEffect, useRef, useState } from 'react';
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
import { BrandLogo } from '@/components/common/BrandLogo';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setLoginError('');
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
      setLoginError(message);
      toast.error(message, { duration: 3000 });
      errorTimerRef.current = setTimeout(() => setLoginError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
  }, []);

  return (
    <div className="public-cosmic-page relative flex min-h-screen items-center justify-center px-6 py-12 text-white">
      {/* Sleek Mesh Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-[100%] bg-primary/20 blur-[150px] opacity-70 mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-[100%] bg-primary/15 blur-[120px] opacity-60 mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[10%] w-[40%] h-[40%] rounded-[100%] bg-blue-500/10 blur-[120px] opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a]/80 p-8 shadow-2xl backdrop-blur-3xl sm:p-12">
        <div className="mb-8 text-center">
          <Link href="/" className="mx-auto mb-6 inline-flex" aria-label="Eduvo home">
            <BrandLogo showName={false} priority imageClassName="h-20 w-20" />
          </Link>
          <h2 className="mb-2 text-3xl font-bold text-white">Welcome back</h2>
          <p className="text-white/50">Sign in to continue learning</p>
        </div>

        {loginError && (
          <div role="alert" aria-live="assertive" className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-200">
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  {...register('email')}
                  type="email"
                  className={cn(
                    'w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all',
                    errors.email && 'border-danger'
                  )}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={cn(
                    'w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-12 text-white outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all',
                    errors.password && 'border-danger'
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
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

          <p className="mt-6 text-center text-sm text-white/50">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">Register</Link>
          </p>
      </div>
    </div>
  );
}
