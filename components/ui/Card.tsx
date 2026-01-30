'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'halftone' | 'red' | 'cyan' | 'yellow' | 'interactive';
  selected?: boolean;
  glow?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', selected = false, children, ...props }, ref) => {
    const baseStyles = `
      relative overflow-hidden
      bg-[var(--paper)] border-2 border-[var(--ink)]
      transition-all duration-150
    `;

    const variants = {
      default: `
        shadow-[4px_4px_0_var(--ink)]
      `,
      halftone: `
        shadow-[4px_4px_0_var(--ink)]
        hover:-translate-x-0.5 hover:-translate-y-0.5
        hover:shadow-[6px_6px_0_var(--ink)]
      `,
      red: `
        border-[var(--red)]
        shadow-[4px_4px_0_var(--red)]
        bg-gradient-to-br from-[var(--red-soft)] to-transparent
      `,
      cyan: `
        border-[var(--cyan)]
        shadow-[4px_4px_0_var(--cyan)]
        bg-gradient-to-br from-[var(--cyan-soft)] to-transparent
      `,
      yellow: `
        border-[var(--yellow)]
        shadow-[4px_4px_0_var(--yellow)]
        bg-gradient-to-br from-[var(--yellow-soft)] to-transparent
      `,
      interactive: `
        shadow-[4px_4px_0_var(--ink)]
        cursor-pointer
        hover:-translate-x-0.5 hover:-translate-y-0.5
        hover:shadow-[6px_6px_0_var(--ink)]
        active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_var(--ink)]
      `,
    };

    const selectedStyles = selected
      ? 'border-[var(--red)] shadow-[4px_4px_0_var(--red)] bg-[var(--red-soft)]'
      : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${selectedStyles} ${className}`}
        {...props}
      >
        {/* Halftone pattern overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 hover:opacity-[0.03] transition-opacity pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, var(--ink) 1px, transparent 1px)',
            backgroundSize: '6px 6px',
          }}
        />
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`p-6 ${className}`} {...props} />
  )
);

CardContent.displayName = 'CardContent';

export { Card, CardContent };
