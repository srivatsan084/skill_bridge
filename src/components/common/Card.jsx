import React from 'react';

/**
 * Reusable Card Container
 */
export default function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerBorder = true,
  hover = false
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 shadow-sm transition-all duration-200 ${
        hover ? 'hover:shadow-md hover:border-slate-300' : ''
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div className={`p-4 sm:p-5 flex items-start justify-between gap-4 ${headerBorder ? 'border-b border-slate-100' : ''}`}>
          <div>
            {title && <h3 className="font-semibold text-slate-900 text-base sm:text-lg">{title}</h3>}
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
}
