import React from 'react';

/**
 * Reusable Badge component for skills, status and categories
 */
export default function Badge({
  children,
  variant = 'blue',
  size = 'sm',
  className = ''
}) {
  const variants = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    navy: 'bg-slate-900 text-white border-transparent'
  };

  const sizes = {
    xs: 'text-[11px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variants[variant] || variants.blue} ${sizes[size] || sizes.sm} ${className}`}>
      {children}
    </span>
  );
}
