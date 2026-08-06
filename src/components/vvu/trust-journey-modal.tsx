'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  MousePointerClick,
  Eye,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Clock,
  X,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CAPABILITY_MAP,
  type Capability,
  type TrustJourneyStep,
} from '@/lib/vvu/capability-registry';
import { useWorkspaceStore } from '@/lib/vvu/workspace-store';

// ---------------------------------------------------------------------------
// Step Type Config
// ---------------------------------------------------------------------------

const STEP_TYPE_CONFIG: Record<
  TrustJourneyStep['type'],
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  discover: {
    label: 'Discover',
    icon: BookOpen,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  learn: {
    label: 'Learn',
    icon: GraduationCap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  interactive: {
    label: 'Interactive',
    icon: MousePointerClick,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  reveal: {
    label: 'Reveal',
    icon: Eye,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  license: {
    label: 'License',
    icon: FileCheck,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
};

// ---------------------------------------------------------------------------
// Knowledge Check Component
// ---------------------------------------------------------------------------

function KnowledgeCheck({
  step,
  onAnswer,
  answered,
}: {
  step: TrustJourneyStep;
  onAnswer: (correct: boolean) => void;
  answered: boolean | null;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!step.knowledgeCheck) return null;

  const { question, options, correctIndex } = step.knowledgeCheck;

  return (
    <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-950/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-amber-400" />
        <span className="text-xs font-semibold text-amber-400">Knowledge Check</span>
      </div>
      <p className="text-sm text-foreground/90">{question}</p>
      <div className="mt-3 flex flex-col gap-2">
        {options.map((option, idx) => {
          let optionStyle = 'border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground hover:border-white/[0.15]';

          if (answered !== null) {
            if (idx === correctIndex) {
              optionStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
            } else if (idx === selectedIdx && idx !== correctIndex) {
              optionStyle = 'border-red-500/40 bg-red-500/10 text-red-400';
            }
          } else if (idx === selectedIdx) {
            optionStyle = 'border-amber-500/40 bg-amber-500/10 text-amber-400';
          }

          return (
            <button
              key={idx}
              onClick={() => {
                if (answered !== null) return;
                setSelectedIdx(idx);
              }}
              disabled={answered !== null}
              className={`rounded-lg border p-3 text-left text-xs transition-all ${optionStyle}`}
            >
              <span className="mr-2 font-mono text-[10px] text-muted-foreground/60">
                {String.fromCharCode(65 + idx)}.
              </span>
              {option}
            </button>
          );
        })}
      </div>
      {selectedIdx !== null && answered === null && (
        <Button
          onClick={() => onAnswer(selectedIdx === correctIndex)}
          size="sm"
          className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
        >
          Check Answer
        </Button>
      )}
      {answered !== null && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 flex items-center gap-2 rounded-lg p-3 text-xs ${
            answered
              ? 'bg-emerald-950/30 text-emerald-400'
              : 'bg-red-950/30 text-red-400'
          }`}
        >
          {answered ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {answered
            ? 'Correct! You can proceed.'
            : 'Not quite right. You can still proceed — this is a learning opportunity.'}
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Step Content
// ---------------------------------------------------------------------------

function StepContent({
  step,
  isCompleted,
  onStepComplete,
  knowledgeAnswered,
  onKnowledgeAnswer,
}: {
  step: TrustJourneyStep;
  isCompleted: boolean;
  onStepComplete: () => void;
  knowledgeAnswered: boolean | null;
  onKnowledgeAnswer: (correct: boolean) => void;
}) {
  const typeConfig = STEP_TYPE_CONFIG[step.type];
  const StepIcon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col gap-4"
    >
      {/* Step type badge */}
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${typeConfig.bg}`}
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <StepIcon className={`h-4 w-4 ${typeConfig.color}`} strokeWidth={1.8} />
        </div>
        <Badge
          variant="outline"
          className={`${typeConfig.color} border-current/20 gap-1 font-mono text-[9px]`}
        >
          {typeConfig.label}
        </Badge>
        {step.optional && (
          <Badge
            variant="outline"
            className="border-white/[0.08] bg-white/[0.03] text-muted-foreground font-mono text-[9px] gap-1"
          >
            <SkipForward className="h-2.5 w-2.5" />
            Optional
          </Badge>
        )}
        {isCompleted && (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        )}
      </div>

      {/* Step title & description */}
      <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground/80">{step.description}</p>

      {/* Duration hint */}
      <div className="flex items-center gap-1.5 text-muted-foreground/50">
        <Clock className="h-3 w-3" />
        <span className="font-mono text-[10px]">{step.duration}</span>
      </div>

      {/* Knowledge check for learn steps */}
      {step.knowledgeCheck && (
        <KnowledgeCheck
          step={step}
          onAnswer={onKnowledgeAnswer}
          answered={knowledgeAnswered}
        />
      )}

      {/* Interactive step action */}
      {step.type === 'interactive' && !isCompleted && (
        <Button
          onClick={onStepComplete}
          className="self-start bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
        >
          <MousePointerClick className="h-4 w-4" />
          Start Interactive Demo
        </Button>
      )}

      {/* Reveal step action */}
      {step.type === 'reveal' && !isCompleted && (
        <Button
          onClick={onStepComplete}
          className="self-start bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Eye className="h-4 w-4" />
          Reveal Dashboard
        </Button>
      )}

      {/* License step action */}
      {step.type === 'license' && !isCompleted && (
        <Button
          onClick={onStepComplete}
          className="self-start bg-amber-600 hover:bg-amber-700 text-white gap-2"
        >
          <FileCheck className="h-4 w-4" />
          Accept & Continue
        </Button>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Trust Journey Modal
// ---------------------------------------------------------------------------

interface TrustJourneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capabilityId: string;
}

export function TrustJourneyModal({
  open,
  onOpenChange,
  capabilityId,
}: TrustJourneyModalProps) {
  const capability = CAPABILITY_MAP[capabilityId];
  const updateTrustProgress = useWorkspaceStore((s) => s.updateTrustProgress);
  const trustPassport = useWorkspaceStore((s) => s.trustPassport);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [knowledgeAnswered, setKnowledgeAnswered] = useState<boolean | null>(null);
  const [skipOptional, setSkipOptional] = useState(false);
  const [completedInSession, setCompletedInSession] = useState<Set<string>>(new Set());

  // Get steps for this capability
  const steps = capability?.trustJourney ?? [];

  // Get completed steps from store
  const completedStepIds = useMemo(() => {
    const progress = trustPassport[capabilityId];
    return new Set(progress?.completedSteps ?? []);
  }, [trustPassport, capabilityId]);

  const currentStep = steps[currentStepIdx];

  // Determine if current step is completed
  const isCurrentStepCompleted =
    completedStepIds.has(currentStep?.id) || completedInSession.has(currentStep?.id);

  // Calculate progress
  const totalCompleted = steps.filter(
    (s) => completedStepIds.has(s.id) || completedInSession.has(s.id),
  ).length;
  const progressPercentage = steps.length > 0 ? (totalCompleted / steps.length) * 100 : 0;

  // Handle completing a step
  const handleStepComplete = useCallback(() => {
    if (!currentStep) return;

    updateTrustProgress(capabilityId, currentStep.id, true);
    setCompletedInSession((prev) => new Set([...prev, currentStep.id]));
  }, [currentStep, capabilityId, updateTrustProgress]);

  // Handle knowledge check answer
  const handleKnowledgeAnswer = useCallback(
    (correct: boolean) => {
      setKnowledgeAnswered(correct);
      // Auto-complete the step when answered
      handleStepComplete();
    },
    [handleStepComplete],
  );

  // Navigate to next step
  const goNext = useCallback(() => {
    if (currentStepIdx < steps.length - 1) {
      // If skip optional is on, skip optional steps
      if (skipOptional) {
        const nextIdx = steps.findIndex(
          (s, i) => i > currentStepIdx && !s.optional,
        );
        if (nextIdx !== -1) {
          setCurrentStepIdx(nextIdx);
        } else {
          setCurrentStepIdx(steps.length - 1);
        }
      } else {
        setCurrentStepIdx((prev) => prev + 1);
      }
      setKnowledgeAnswered(null);
    }
  }, [currentStepIdx, steps, skipOptional]);

  // Navigate to previous step
  const goPrev = useCallback(() => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
      setKnowledgeAnswered(null);
    }
  }, [currentStepIdx]);

  // Reset when opening
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setCurrentStepIdx(0);
        setKnowledgeAnswered(null);
        setCompletedInSession(new Set());
      }
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  // Consent receipt generation
  const generateConsentReceipt = useCallback(() => {
    const completedSteps = steps.filter(
      (s) => completedStepIds.has(s.id) || completedInSession.has(s.id),
    );
    return {
      capabilityId,
      capabilityLabel: capability?.label,
      completedSteps: completedSteps.map((s) => s.id),
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
  }, [capabilityId, capability, steps, completedStepIds, completedInSession]);

  if (!capability) return null;

  const isLastStep = currentStepIdx === steps.length - 1;
  const allCompleted = totalCompleted === steps.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg border-white/[0.08] bg-[#0f0f18] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Trust Journey — {capability.label}</DialogTitle>
          <DialogDescription>
            Progressive trust onboarding for {capability.label}
          </DialogDescription>
        </DialogHeader>

        {/* Custom header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">
              {capability.label}
            </span>
            <span className="font-mono text-[9px] text-muted-foreground/50">
              Trust Journey
            </span>
          </div>
          <button
            onClick={() => handleOpenChange(false)}
            className="rounded-md border border-white/[0.08] p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-[9px] text-muted-foreground/60">
              Step {currentStepIdx + 1} of {steps.length}
            </span>
            <span className="font-mono text-[9px] text-emerald-400/70">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-1.5 bg-white/[0.06]"
          />
          {/* Step indicators */}
          <div className="mt-3 flex gap-1">
            {steps.map((step, idx) => {
              const isCompleted =
                completedStepIds.has(step.id) || completedInSession.has(step.id);
              const isActive = idx === currentStepIdx;
              const typeConfig = STEP_TYPE_CONFIG[step.type];

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setCurrentStepIdx(idx);
                    setKnowledgeAnswered(null);
                  }}
                  className={`flex h-6 flex-1 items-center justify-center rounded border transition-all ${
                    isActive
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : isCompleted
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                  title={step.title}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                  ) : isActive ? (
                    <div className={`h-1.5 w-1.5 rounded-full ${typeConfig.color}`} style={{ background: 'currentColor' }} />
                  ) : (
                    <div className="h-1 w-1 rounded-full bg-white/[0.1]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skip optional toggle */}
        <div className="px-5 pt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={skipOptional}
              onChange={(e) => setSkipOptional(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.04] accent-emerald-500"
            />
            <span className="font-mono text-[10px] text-muted-foreground/70">
              Skip optional steps
            </span>
          </label>
        </div>

        {/* Step content */}
        <div className="min-h-[200px] px-5 pt-4 pb-2">
          <AnimatePresence mode="wait">
            {currentStep && (
              <StepContent
                key={currentStep.id}
                step={currentStep}
                isCompleted={isCurrentStepCompleted}
                onStepComplete={handleStepComplete}
                knowledgeAnswered={knowledgeAnswered}
                onKnowledgeAnswer={handleKnowledgeAnswer}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Completion state */}
        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-5 mb-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-4 text-center"
          >
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <h4 className="mt-2 text-sm font-semibold text-foreground">
              Journey Complete
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              You&apos;ve completed the trust journey for {capability.label}.
            </p>
            <div className="mt-3 rounded border border-white/[0.06] bg-black/30 p-2">
              <span className="font-mono text-[9px] text-muted-foreground/60">
                Consent Receipt v1.0
              </span>
              <pre className="mt-1 text-[9px] text-emerald-400/70 overflow-x-auto">
                {JSON.stringify(generateConsentReceipt(), null, 2)}
              </pre>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={currentStepIdx === 0}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {/* Auto-complete discover/learn steps */}
            {!isCurrentStepCompleted && currentStep?.type === 'discover' && (
              <Button
                size="sm"
                onClick={() => {
                  handleStepComplete();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                Continue
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
            {!isCurrentStepCompleted &&
              currentStep?.type === 'learn' &&
              !currentStep.knowledgeCheck && (
                <Button
                  size="sm"
                  onClick={() => {
                    handleStepComplete();
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1"
                >
                  Continue
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
            {isCurrentStepCompleted && !isLastStep && (
              <Button
                size="sm"
                onClick={goNext}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                Next Step
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
            {isLastStep && isCurrentStepCompleted && (
              <Button
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                Done
              </Button>
            )}
            {isCurrentStepCompleted && isLastStep && (
              <Button
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                Finish
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
