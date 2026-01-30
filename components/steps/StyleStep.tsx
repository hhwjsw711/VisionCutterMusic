'use client';

import { useState } from 'react';
import { useAppStore, StylePreset } from '@/stores/app-store';
import { stylePresets } from '@/data/style-presets';
import { Card, CardContent } from '@/components/ui/Card';

interface StyleCardProps {
  style: StylePreset;
  isSelected: boolean;
  onClick: () => void;
}

function StyleCard({ style, isSelected, onClick }: StyleCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      variant="interactive"
      selected={isSelected}
      onClick={onClick}
      className={`group overflow-hidden ${isSelected ? 'scale-[1.02]' : ''}`}
    >
      {/* Preview Image or Color Palette Fallback */}
      <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-[var(--ink)]">
        {style.preview && !imageError ? (
          <img
            src={style.preview}
            alt={style.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex">
            {style.colors.map((color, i) => (
              <div
                key={i}
                className="flex-1 transition-transform duration-300"
                style={{
                  backgroundColor: color,
                  transform: isSelected ? 'scaleY(1.05)' : 'scaleY(1)',
                }}
              />
            ))}
          </div>
        )}

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-[var(--red)] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Halftone overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, var(--ink) 1px, transparent 1px)',
            backgroundSize: '4px 4px',
          }}
        />
      </div>

      <CardContent className="relative pt-4 pb-5">
        <h3 className={`
          font-display text-xl uppercase tracking-wider mb-1 transition-colors duration-150
          ${isSelected ? 'text-[var(--red)]' : 'text-[var(--ink)]'}
        `}>
          {style.name}
        </h3>
        <p className="text-sm text-[var(--text-muted)] line-clamp-2">
          {style.description}
        </p>

        {/* Color dots */}
        <div className="flex gap-2 mt-3">
          {style.colors.map((color, i) => (
            <div
              key={i}
              className="w-4 h-4 border-2 border-[var(--ink)]"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function StyleStep() {
  const { selectedStyle, setSelectedStyle } = useAppStore();

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="text-center mb-12 animate-slide-up">
        <h2 className="font-display text-5xl md:text-6xl uppercase tracking-wider mb-4">
          <span className="gradient-text">Choose Your Vibe</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg max-w-lg mx-auto">
          Select a visual style that matches your music&apos;s energy
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {stylePresets.map((style) => (
          <StyleCard
            key={style.id}
            style={style}
            isSelected={selectedStyle?.id === style.id}
            onClick={() => setSelectedStyle(style)}
          />
        ))}
      </div>

      {/* Style suffix preview */}
      {selectedStyle && (
        <div className="mt-8 animate-slide-up">
          <Card variant="cyan">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--cyan)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[var(--ink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    <span className="font-display uppercase tracking-wider text-[var(--ink)]">{selectedStyle.name}</span> adds this style suffix:
                  </p>
                  <p className="text-xs font-mono text-[var(--text-muted)] bg-[var(--paper-dark)] p-3 border-2 border-[var(--ink)] break-words">
                    {selectedStyle.suffix}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
