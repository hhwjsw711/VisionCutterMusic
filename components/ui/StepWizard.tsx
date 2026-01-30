'use client';

import { cn } from '@/lib/utils/helpers';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface StepWizardProps {
  steps: Step[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  completedSteps?: string[];
}

export function StepWizard({
  steps,
  currentStep,
  onStepClick,
  completedSteps = [],
}: StepWizardProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;
          const isClickable = onStepClick && (isCompleted || isPast || isCurrent);

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                    'text-sm font-semibold',
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-primary-500 text-white ring-4 ring-primary-200'
                      : isPast
                      ? 'bg-primary-400 text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700',
                    isClickable && 'cursor-pointer hover:scale-105'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.icon || index + 1
                  )}
                </button>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isCurrent
                      ? 'text-primary-600'
                      : isCompleted || isPast
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-4 rounded-full transition-colors duration-200',
                    isPast || isCompleted
                      ? 'bg-primary-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
