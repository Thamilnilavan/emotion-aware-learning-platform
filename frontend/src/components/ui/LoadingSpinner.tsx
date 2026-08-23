'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-5 w-8',
    md: 'h-8 w-12',
    lg: 'h-14 w-20',
  };

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      role="status"
      aria-label="Loading"
    >
      <span className={cn('book-loader', sizes[size])} aria-hidden="true">
        <span className="book-loader__cover" />
        <span className="book-loader__paper book-loader__paper--left" />
        <span className="book-loader__paper book-loader__paper--right" />
        <span className="book-loader__page book-loader__page--one" />
        <span className="book-loader__page book-loader__page--two" />
        <span className="book-loader__page book-loader__page--three" />
        <span className="book-loader__spine" />
      </span>
      <span className="sr-only">Loading</span>
    </div>
  );
}
