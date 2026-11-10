import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { ExcelSpreadsheetIcon } from './ExcelIcon';

export const EXCEL_GENERATION_STEPS = [
  'Selecting',
  'Understanding request',
  'Planning workbook',
  'Generating sheets',
  'Applying formulas',
  'Applying formatting',
  'Generating charts if requested',
  'Validating',
  'Preview',
  'Ready',
];

interface ExcelLoadingProps {
  topic?: string;
  currentStepIndex?: number;
}

export const ExcelLoading: React.FC<ExcelLoadingProps> = ({
  topic,
  currentStepIndex,
}) => {
  const [internalStep, setInternalStep] = useState(0);

  useEffect(() => {
    if (typeof currentStepIndex === 'number') return;
    const timer = setInterval(() => {
      setInternalStep((prev) =>
        prev < EXCEL_GENERATION_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 280);
    return () => clearInterval(timer);
  }, [currentStepIndex]);

  const activeStep =
    typeof currentStepIndex === 'number' ? currentStepIndex : internalStep;
  const progressPercent = Math.min(
    98,
    Math.round(((activeStep + 1) / EXCEL_GENERATION_STEPS.length) * 100)
  );

  return (
    <div className="my-3 w-full max-w-xl rounded-2xl border border-emerald-800/60 bg-[#0d1717] p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <ExcelSpreadsheetIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-bold text-white truncate">
              Building Excel Workbook...
            </h4>
            <p className="text-xs text-emerald-400 font-medium truncate mt-0.5">
              {EXCEL_GENERATION_STEPS[activeStep]}...
            </p>
          </div>
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-400 font-semibold">
          {progressPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-800/90 overflow-hidden mb-3.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Checklist */}
      <div className="grid grid-cols-2 gap-1.5">
        {EXCEL_GENERATION_STEPS.map((label, idx) => {
          const isCompleted = idx < activeStep;
          const isCurrent = idx === activeStep;
          return (
            <div
              key={label}
              className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                isCurrent
                  ? 'bg-emerald-500/15 text-white font-semibold border border-emerald-500/30'
                  : isCompleted
                  ? 'text-emerald-400/90'
                  : 'text-slate-500'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin flex-shrink-0" />
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
          <span className="truncate">Workbook: {topic}</span>
          <span className="text-emerald-400/80 flex-shrink-0">.XLSX Multi-Sheet</span>
        </div>
      )}
    </div>
  );
};
