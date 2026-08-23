import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = '',
  variant = 'rect',
  width,
  height,
}: SkeletonProps) {
  const baseClass = 'fn-skeleton';
  const variantClass =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'text'
        ? 'rounded h-4'
        : 'rounded-[var(--fn-radius)]';

  return (
    <div
      className={`${baseClass} ${variantClass} ${className}`}
      style={{
        width: width || (variant === 'circle' ? 40 : '100%'),
        height: height || (variant === 'circle' ? 40 : variant === 'text' ? 16 : 40),
      }}
    />
  );
}

// Preset skeleton layouts
export function SkeletonCard() {
  return (
    <div className="space-y-3 p-4 border border-[var(--fn-border)] rounded-[var(--fn-radius)]">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="40%" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton variant="circle" width={32} height={32} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="60%" height={12} />
      </div>
      <Skeleton variant="rect" width={60} height={24} />
    </div>
  );
}
