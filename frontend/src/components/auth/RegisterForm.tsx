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
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-primary to-secondary p-12 text-white lg:flex">
        <h1 className="mb-4 text-4xl font-extrabold">Join EmoLearn</h1>
        <p className="text-xl text-white/90">Start your adaptive learning journey</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h2 className="mb-2 text-3xl font-bold text-heading">Create account</h2>
          <p className="mb-8 text-body">Fill in your details to get started</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-heading">Full Name</label>
              <input {...register('name')} className={cn('w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-primary', errors.name && 'border-danger')} />
              {(errors.name || apiErrors.name) && <p className="mt-1 text-sm text-danger">{errors.name?.message || apiErrors.name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-heading">Email</label>
              <input {...register('email')} type="email" className={cn('w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-primary', errors.email && 'border-danger')} />
              {(errors.email || apiErrors.email) && <p className="mt-1 text-sm text-danger">{errors.email?.message || apiErrors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-heading">Password</label>
              <input {...register('password')} type="password" className={cn('w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-primary', errors.password && 'border-danger')} />
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-gray-200">
                    <div className={cn('h-full rounded-full transition-all', strength.color, strength.width)} />
                  </div>
                  <p className="mt-1 text-xs text-body">{strength.label}</p>
                </div>
              )}
              {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-heading">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" className={cn('w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-primary', errors.confirmPassword && 'border-danger')} />
              {errors.confirmPassword && <p className="mt-1 text-sm text-danger">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-heading">Role</label>
              <select {...register('role')} className="w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-primary">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-heading">ICBT Number</label>
                <input {...register('icbtNumber')} className="w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-primary" placeholder="Optional" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-heading">Programme</label>
                <input {...register('programme')} className="w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-primary" placeholder="Optional" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
              {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-body">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
