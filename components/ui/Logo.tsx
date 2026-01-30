'use client';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  // Static halftone-style red logo - no AI generation
  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full flex items-center justify-center bg-[var(--red)] border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)]">
        {/* Halftone dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, var(--paper) 1px, transparent 1px)',
            backgroundSize: '4px 4px',
          }}
        />
        {/* V letter with offset effect */}
        <span className="font-display text-3xl text-[var(--paper)] relative z-10" style={{
          textShadow: '1px 1px 0 var(--ink)'
        }}>V</span>
        {/* Corner accent */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--ink)]" />
      </div>
    </div>
  );
}
