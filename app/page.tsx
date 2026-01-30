'use client';

import { useState, useEffect } from 'react';
import { useAppStore, Step } from '@/stores/app-store';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { initFalClient } from '@/lib/fal/client';
import {
  AudioStep,
  StyleStep,
  StoryStep,
  GenerateStep,
  ExportStep,
} from '@/components/steps';

const steps: { id: Step; label: string; number: string }[] = [
  { id: 'audio', label: 'Upload', number: '01' },
  { id: 'style', label: 'Style', number: '02' },
  { id: 'story', label: 'Story', number: '03' },
  { id: 'generate', label: 'Generate', number: '04' },
  { id: 'export', label: 'Export', number: '05' },
];

function getCompletedSteps(state: ReturnType<typeof useAppStore.getState>): string[] {
  const completed: string[] = [];
  if (state.audioFile && state.bpm) completed.push('audio');
  if (state.selectedStyle) completed.push('style');
  if (state.scenes.length > 0) completed.push('story');
  if (state.scenes.some((s) => s.status === 'video-ready')) completed.push('generate');
  if (state.finalVideoUrl) completed.push('export');
  return completed;
}

export default function Home() {
  const {
    currentStep,
    setCurrentStep,
    audioFile,
    bpm,
    selectedStyle,
    scenes,
    falApiKey,
    setFalApiKey,
  } = useAppStore();

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (falApiKey) {
      setApiKeyInput(falApiKey);
    }
  }, [falApiKey]);

  const saveApiKey = () => {
    if (apiKeyInput.trim()) {
      setFalApiKey(apiKeyInput.trim());
      initFalClient(apiKeyInput.trim());
      setShowApiKeyModal(false);
    }
  };

  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const completedSteps = getCompletedSteps(useAppStore.getState());

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'audio':
        return audioFile !== null && bpm !== null;
      case 'style':
        return selectedStyle !== null;
      case 'story':
        return scenes.length > 0;
      case 'generate':
        return scenes.some((s) => s.status === 'video-ready');
      case 'export':
        return false;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'audio':
        return <AudioStep />;
      case 'style':
        return <StyleStep />;
      case 'story':
        return <StoryStep />;
      case 'generate':
        return <GenerateStep />;
      case 'export':
        return <ExportStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Decorative halftone corners */}
      <div className="fixed top-0 left-0 w-32 h-32 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, var(--red) 1.5px, transparent 1.5px)',
          backgroundSize: '8px 8px',
        }}
      />
      <div className="fixed bottom-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, var(--cyan) 1.5px, transparent 1.5px)',
          backgroundSize: '8px 8px',
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--paper)] border-b-2 border-[var(--ink)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="h-16 md:h-20 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <div className="hidden sm:block">
                <h1 className="font-display text-xl tracking-wider text-[var(--ink)]">
                  VISIONCUTTER
                </h1>
                <p className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)]">
                  Music Video Generator
                </p>
              </div>
            </div>

            {/* Step Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = step.id === currentStep;
                const isPast = index < currentIndex;
                const isClickable = isCompleted || isPast || isCurrent;

                return (
                  <button
                    key={step.id}
                    onClick={() => isClickable && setCurrentStep(step.id)}
                    disabled={!isClickable}
                    className={`
                      relative px-4 py-2 font-mono text-sm uppercase tracking-wider
                      transition-all duration-150 border-2
                      ${isCurrent
                        ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                        : isCompleted || isPast
                          ? 'text-[var(--ink)] border-transparent hover:border-[var(--ink)]'
                          : 'text-[var(--text-muted)] border-transparent cursor-not-allowed'
                      }
                    `}
                  >
                    <span className="text-xs mr-1 opacity-50">{step.number}</span>
                    {step.label}
                    {isCompleted && !isCurrent && (
                      <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-[var(--red)] text-white text-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile step indicator */}
            <div className="md:hidden flex items-center gap-2">
              <span className="font-mono text-sm text-[var(--red)]">
                {steps[currentIndex].number}
              </span>
              <span className="font-display text-sm uppercase tracking-wider text-[var(--ink)]">
                {steps[currentIndex].label}
              </span>
            </div>

            {/* API Key Button */}
            <button
              onClick={() => setShowApiKeyModal(true)}
              className={`
                flex items-center gap-2 px-3 py-2 border-2 transition-all duration-150
                ${mounted && falApiKey
                  ? 'border-[var(--cyan)] text-[var(--cyan)] hover:bg-[var(--cyan-soft)]'
                  : 'border-[var(--red)] text-[var(--red)] hover:bg-[var(--red-soft)] animate-pulse'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
                {mounted && falApiKey ? 'API Key Set' : 'Add API Key'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[var(--ink)]/80"
            onClick={() => setShowApiKeyModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-[var(--paper)] border-2 border-[var(--ink)] shadow-[8px_8px_0_var(--ink)] animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-[var(--ink)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--red)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--paper)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-xl uppercase tracking-wider text-[var(--ink)]">FAL API Key</h3>
                  <p className="text-xs text-[var(--text-muted)]">Required for AI generation</p>
                </div>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-[var(--paper-dark)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex gap-3 mb-4">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter your FAL API key..."
                  className="flex-1 bg-[var(--paper)] border-2 border-[var(--ink)] px-4 py-3 text-[var(--text-primary)] focus:border-[var(--red)] focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && saveApiKey()}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowApiKeyModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="red"
                  onClick={saveApiKey}
                  disabled={!apiKeyInput.trim()}
                  className="flex-1"
                >
                  {mounted && falApiKey ? 'Update Key' : 'Save Key'}
                </Button>
              </div>

              {mounted && falApiKey && (
                <p className="mt-4 text-sm text-[var(--cyan)] flex items-center gap-2 justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  API key is currently set
                </p>
              )}

              <p className="mt-4 text-xs text-[var(--text-muted)] text-center">
                Get your API key from{' '}
                <a href="https://fal.ai" target="_blank" rel="noopener noreferrer" className="text-[var(--red)] hover:underline">
                  fal.ai
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile step dots */}
      <div className="md:hidden fixed top-[68px] left-0 right-0 z-40 px-4 py-3 bg-[var(--paper)] border-b-2 border-[var(--ink)]">
        <div className="flex justify-center gap-3">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            return (
              <button
                key={step.id}
                onClick={() => (isCompleted || index <= currentIndex) && setCurrentStep(step.id)}
                className={`
                  w-3 h-3 border-2 transition-all duration-150
                  ${isCurrent
                    ? 'bg-[var(--red)] border-[var(--red)] w-8'
                    : isCompleted
                      ? 'bg-[var(--ink)] border-[var(--ink)]'
                      : 'bg-transparent border-[var(--ink)]'
                  }
                `}
              />
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-28 md:pt-32 pb-32">
        {renderStep()}
      </main>

      {/* Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--paper)] border-t-2 border-[var(--ink)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="h-20 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </Button>

            {/* Progress indicator */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`
                      h-2 transition-all duration-300 border-2 border-[var(--ink)]
                      ${index <= currentIndex
                        ? 'w-8 bg-[var(--red)] border-[var(--red)]'
                        : 'w-4 bg-transparent'
                      }
                    `}
                  />
                ))}
              </div>
              <span className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)]">
                {currentIndex + 1}/{steps.length}
              </span>
            </div>

            <Button
              variant={canGoNext() ? 'red' : 'primary'}
              onClick={goNext}
              disabled={!canGoNext() || currentIndex === steps.length - 1}
              className="gap-2"
            >
              <span className="hidden sm:inline">Continue</span>
              <span className="sm:hidden">Next</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
