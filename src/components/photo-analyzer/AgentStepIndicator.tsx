import { Check, Loader2 } from 'lucide-react';
import { AgentStep } from './types';

interface AgentStepIndicatorProps {
  currentStep: AgentStep;
}

const steps: { key: AgentStep; label: string }[] = [
  { key: 'upload', label: 'رفع الصورة' },
  { key: 'analyzing', label: 'التحليل' },
  { key: 'reasoning', label: 'التفكير' },
  { key: 'decision', label: 'القرار' },
  { key: 'final', label: 'النتيجة' },
];

const stepOrder: AgentStep[] = ['upload', 'analyzing', 'reasoning', 'decision', 'applying', 'comparing', 'final'];

export function AgentStepIndicator({ currentStep }: AgentStepIndicatorProps) {
  const currentIndex = stepOrder.indexOf(currentStep);

  const getStepStatus = (stepKey: AgentStep) => {
    const stepIndex = stepOrder.indexOf(stepKey);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
      {steps.map((step, index) => {
        const status = getStepStatus(step.key);
        
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  status === 'completed'
                    ? 'bg-green-500 text-white'
                    : status === 'current'
                    ? 'bg-primary text-primary-foreground animate-pulse'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {status === 'completed' ? (
                  <Check className="w-4 h-4" />
                ) : status === 'current' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={`text-xs mt-1 ${status === 'current' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 mx-1 transition-colors ${
                  getStepStatus(steps[index + 1].key) !== 'pending' ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
