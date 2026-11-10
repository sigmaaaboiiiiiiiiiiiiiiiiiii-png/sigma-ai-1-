import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { PowerPointSlideIcon } from './PowerPointIcon';

export const PRESENTATION_PROGRESS_STEPS = [
  'Understanding Request',
  'Correcting Obvious Typing Errors',
  'Determining Purpose',
  'Planning Content',
  'Selecting Visual Style',
  'Designing Slide Layouts',
  'Generating Content',
  'Generating Visuals',
  'Applying Animations',
  'Applying Transitions',
  'Validating Presentation',
  'Preview',
  'Ready',
];

interface PresentationLoadingProps {
  topic?: string;
  currentStepIndex?: number;
}

export const PresentationLoading: React.FC<PresentationLoadingProps> = ({
  topic,
  currentStepIndex,
}) => {
  const [internalStep, setInternalStep] = useState(0);

  useEffect(() => {
    if (typeof currentStepIndex === 'number') return;
    const timer = setInterval(() => {
      setInternalStep((prev) =>
        prev < PRESENTATION_PROGRESS_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 320);
    return () => clearInterval(timer);
  }, [currentStepIndex]);

  const activeStep =
    typeof currentStepIndex === 'number' ? currentStepIndex : internalStep;
  const progressPercent = Math.min(
    98,
    Math.round(((activeStep + 1) / PRESENTATION_PROGRESS_STEPS.length) * 100)
  );

  return (
    <div className="my-3 w-full max-w-xl rounded-2xl border border-slate-800 bg-[#111722] p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 flex-shrink-0">
            <PowerPointSlideIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-bold text-white truncate">
              Creating your presentation...
            </h4>
            <p className="text-xs text-cyan-400 font-medium truncate mt-0.5">
              {PRESENTATION_PROGRESS_STEPS[activeStep]}...
            </p>
          </div>
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-400 font-semibold">
          {progressPercent}%
        </span>
      </div>

      {/* Animated Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-800/90 overflow-hidden mb-3.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-pink-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Checklist */}
      <div className="grid grid-cols-2 gap-1.5">
        {PRESENTATION_PROGRESS_STEPS.map((label, idx) => {
          const isCompleted = idx < activeStep;
          const isCurrent = idx === activeStep;
          return (
            <div
              key={label}
              className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                isCurrent
                  ? 'bg-violet-500/15 text-white font-semibold border border-violet-500/30'
                  : isCompleted
                  ? 'text-emerald-400/90'
                  : 'text-slate-500'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin flex-shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-slate-700 flex-shrink-0" />
              )}
              <span className="truncate">{label}</span>
            </div>
          );
        })}
      </div>

      {topic && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">Topic: {topic}</span>
          <span className="text-slate-500 flex-shrink-0">16:9 Widescreen</span>
        </div>
      )}
    </div>
  );
};
