'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'default' | 'red' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className = '',
      value,
      max = 100,
      variant = 'default',
      size = 'md',
      showLabel = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
    };

    const barColors = {
      default: 'bg-[var(--ink)]',
      red: 'bg-[var(--red)]',
      cyan: 'bg-[var(--cyan)]',
    };

    return (
      <div className={`w-full ${className}`} ref={ref} {...props}>
        {showLabel && (
          <div className="flex justify-between mb-2">
            <span className="text-sm font-mono uppercase tracking-wider text-[var(--text-secondary)]">
              Progress
            </span>
            <span className="text-sm font-mono text-[var(--ink)]">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          className={`
            w-full bg-[var(--paper-dark)] border-2 border-[var(--ink)]
            ${sizes[size]}
          `}
        >
          <div
            className={`
              h-full transition-all duration-300 ease-out
              ${barColors[variant]}
            `}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// Circular progress for loading states
export function CircularProgress({
  value = 0,
  size = 48,
  strokeWidth = 4,
  className = '',
}: {
  value?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg
      className={`transform -rotate-90 ${className}`}
      width={size}
      height={size}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--paper-dark)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--red)"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-300 ease-out"
      />
    </svg>
  );
}

export { Progress };
