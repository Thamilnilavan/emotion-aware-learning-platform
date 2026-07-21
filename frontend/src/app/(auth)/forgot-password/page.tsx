'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Email is required'); return; }
    toast.success('If an account exists, a reset link has been sent.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md glass-card p-8">
        <h1 className="mb-2 text-2xl font-bold text-heading">Forgot Password</h1>
        <p className="mb-6 text-sm text-body">Enter your email to receive a reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-2xl border px-4 py-3" />
          <button type="submit" className="w-full rounded-2xl bg-primary py-3 font-semibold text-white">Send Reset Link</button>
        </form>
        <Link href="/login" className="mt-4 block text-center text-sm text-primary hover:underline">Back to login</Link>
      </div>
    </div>
  );
}
