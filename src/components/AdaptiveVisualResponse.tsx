import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  HelpCircle,
  BookOpen,
  ArrowUpDown,
  ExternalLink,
  Clock,
  Eye,
  Check,
} from 'lucide-react';

export type AdaptiveVisualType =
  | 'mcq'
  | 'flashcard'
  | 'comparison'
  | 'steps'
  | 'timetable'
  | 'roadmap'
  | 'chart'
  | 'table'
  | 'card';

export interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FlashcardItem {
  front: string;
  back: string;
  category?: string;
  hint?: string;
}

export interface ComparisonItem {
  feature: string;
  itemA: string;
  itemB: string;
  summary?: string;
}

export interface StepItem {
  stepNumber: number;
  title: string;
  explanation: string;
  example?: string;
  tip?: string;
}

export interface TimetableSlot {
  time: string;
  topic: string;
  subject: string;
  goals: string;
}

export interface RoadmapMilestone {
  stage: string;
  title: string;
  description: string;
  status?: 'completed' | 'in_progress' | 'upcoming';
  duration?: string;
}

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
  unit?: string;
}

/**
 * Safely parses and validates potential adaptive visual payloads embedded in model text.
 * Returns null if invalid, ensuring zero crashes and graceful markdown fallback.
 */
export function parseAdaptiveVisualPayload(rawText: string): {
  type: AdaptiveVisualType;
  data: any;
  preProse?: string;
  postProse?: string;
} | null {
  if (!rawText || typeof rawText !== 'string') return null;

  // 1. Tagged format: <sigma-visual type="mcq">JSON</sigma-visual>
  const tagRegex = /<sigma-visual\s+type=["']([a-zA-Z0-9_-]+)["']>([\s\S]*?)<\/sigma-visual>/i;
  const match = rawText.match(tagRegex);

  if (match) {
    const rawType = match[1].toLowerCase().trim() as AdaptiveVisualType;
    const jsonStr = match[2].trim();
    try {
      const parsed = JSON.parse(jsonStr);
      const preProse = rawText.slice(0, match.index).trim();
      const postProse = rawText.slice((match.index || 0) + match[0].length).trim();
      return {
        type: rawType,
        data: parsed,
        preProse: preProse || undefined,
        postProse: postProse || undefined,
      };
    } catch {
      return null;
    }
  }

  // 2. Fenced code block format: ```visual-mcq or ```visual-comparison
  const fenceRegex = /```visual-([a-zA-Z0-9_-]+)\n([\s\S]*?)```/i;
  const fenceMatch = rawText.match(fenceRegex);
  if (fenceMatch) {
    const rawType = fenceMatch[1].toLowerCase().trim() as AdaptiveVisualType;
    const jsonStr = fenceMatch[2].trim();
    try {
      const parsed = JSON.parse(jsonStr);
      const preProse = rawText.slice(0, fenceMatch.index).trim();
      const postProse = rawText.slice((fenceMatch.index || 0) + fenceMatch[0].length).trim();
      return {
        type: rawType,
        data: parsed,
        preProse: preProse || undefined,
        postProse: postProse || undefined,
      };
    } catch {
      return null;
    }
  }

  return null;
}

// ==========================================
// 1. Interactive MCQ Card Component
// ==========================================
export const InteractiveMCQCard: React.FC<{
  data: {
    title?: string;
    questions?: MCQQuestion[];
    question?: string;
    options?: string[];
    correctIndex?: number;
    explanation?: string;
  };
  themeHex?: string;
}> = ({ data, themeHex = '#00ea77' }) => {
  const questions: MCQQuestion[] = useMemo(() => {
    if (Array.isArray(data.questions) && data.questions.length > 0) {
      return data.questions;
    }
    if (data.question && Array.isArray(data.options)) {
      return [
        {
          question: data.question,
          options: data.options,
          correctIndex: typeof data.correctIndex === 'number' ? data.correctIndex : 0,
          explanation: data.explanation || 'Verified correct answer based on syllabus standards.',
        },
      ];
    }
    return [];
  }, [data]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = (idx: number) => {
    if (isRevealed) return;
    setSelectedOption(idx);
    setIsRevealed(true);
    if (idx === currentQ.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsRevealed(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setIsRevealed(false);
    setCurrentIndex(0);
    setScore(0);
  };

  return (
    <div className="w-full my-4 rounded-2xl border border-white/10 bg-[#0d121c] p-4 sm:p-5 shadow-xl not-prose">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2 font-bold text-white">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>Interactive Quiz Question</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-emerald-400 font-bold">Score: {score}</span>
        </div>
      </div>

      {/* Question Text */}
      <p className="mt-3.5 text-sm sm:text-base font-semibold text-slate-100 leading-snug">
        {currentQ.question}
      </p>

      {/* Options */}
      <div className="mt-4 space-y-2">
        {currentQ.options.map((opt, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx);
          let btnClass = 'border-white/10 bg-slate-900/70 text-slate-200 hover:border-slate-500 hover:bg-slate-800/80';
          let indicatorIcon = null;

          if (isRevealed) {
            if (optIdx === currentQ.correctIndex) {
              btnClass = 'border-emerald-500/80 bg-emerald-950/40 text-emerald-200 shadow-sm';
              indicatorIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
            } else if (optIdx === selectedOption) {
              btnClass = 'border-rose-500/80 bg-rose-950/40 text-rose-200 shadow-sm';
              indicatorIcon = <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />;
            } else {
              btnClass = 'opacity-50 border-white/5 bg-slate-900/30 text-slate-400';
            }
          }

          return (
            <button
              key={optIdx}
              type="button"
              disabled={isRevealed}
              onClick={() => handleSelectOption(optIdx)}
              className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${btnClass}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                  {letter}
                </span>
                <span>{opt}</span>
              </div>
              {indicatorIcon}
            </button>
          );
        })}
      </div>

      {/* Explanation Reveal */}
      {isRevealed && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-slate-300 leading-relaxed animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-1.5 font-bold mb-1 text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Explanation & Solution</span>
          </div>
          <p>{currentQ.explanation}</p>
        </div>
      )}

      {/* Actions */}
      {isRevealed && (
        <div className="mt-3.5 flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Quiz</span>
          </button>
          {questions.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-black transition-transform active:scale-95 cursor-pointer shadow-sm"
              style={{ backgroundColor: themeHex }}
            >
              <span>Next Question</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. Interactive Flashcards Deck Component
// ==========================================
export const InteractiveFlashcardsDeck: React.FC<{
  data: {
    title?: string;
    cards: FlashcardItem[];
  };
  themeHex?: string;
}> = ({ data, themeHex = '#00ea77' }) => {
  const cards = data.cards || [];
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (cards.length === 0) return null;

  const current = cards[index] || cards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <div className="w-full my-4 rounded-2xl border border-white/10 bg-[#0d121c] p-4 sm:p-5 shadow-xl not-prose">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2 font-bold text-white">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>{data.title || 'Interactive Revision Flashcards'}</span>
        </div>
        <div className="font-mono text-slate-400 text-[11px]">
          Card {index + 1} of {cards.length}
        </div>
      </div>

      {/* Card Body with Flip interaction */}
      <div
        onClick={() => setIsFlipped((prev) => !prev)}
        className="mt-4 min-h-[160px] p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-[#121722] hover:border-purple-500/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center select-none shadow-inner group"
      >
        <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 mb-2">
          {isFlipped ? 'Answer / Concept' : 'Question / Term (Click to Flip)'}
        </span>
        <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
          {isFlipped ? current.back : current.front}
        </p>
        {current.hint && !isFlipped && (
          <p className="mt-2 text-xs text-slate-400 italic">Hint: {current.hint}</p>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10 text-xs">
        <button
          type="button"
          onClick={handlePrev}
          disabled={cards.length <= 1}
          className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer disabled:opacity-30"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setIsFlipped((p) => !p)}
          className="px-4 py-1.5 rounded-lg font-bold text-black shadow-sm cursor-pointer active:scale-95"
          style={{ backgroundColor: themeHex }}
        >
          {isFlipped ? 'Show Front' : 'Reveal Answer'}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={cards.length <= 1}
          className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 3. Interactive Comparison Card Component
// ==========================================
export const InteractiveComparisonCard: React.FC<{
  data: {
    title?: string;
    itemAName: string;
    itemBName: string;
    comparisons: ComparisonItem[];
  };
}> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'both' | 'a' | 'b'>('both');

  const comparisons = data.comparisons || [];
  if (comparisons.length === 0) return null;

  return (
    <div className="w-full my-4 rounded-2xl border border-white/10 bg-[#0d121c] p-4 sm:p-5 shadow-xl not-prose">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Concept Comparison</span>
          <h4 className="text-sm sm:text-base font-bold text-white">
            {data.itemAName} vs {data.itemBName}
          </h4>
        </div>
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('both')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'both' ? 'bg-sky-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('a')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer truncate max-w-[120px] ${
              activeTab === 'a' ? 'bg-sky-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {data.itemAName}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('b')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer truncate max-w-[120px] ${
              activeTab === 'b' ? 'bg-sky-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {data.itemBName}
          </button>
        </div>
      </div>

      <div className="mt-4 divide-y divide-white/5">
        {comparisons.map((c, idx) => (
          <div key={idx} className="py-3 text-xs sm:text-sm">
            <span className="font-bold text-slate-300 block mb-1.5">{c.feature}</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(activeTab === 'both' || activeTab === 'a') && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-sky-500/20 text-slate-200">
                  <span className="text-[10px] uppercase font-bold text-sky-400 block mb-0.5">{data.itemAName}</span>
                  {c.itemA}
                </div>
              )}
              {(activeTab === 'both' || activeTab === 'b') && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/20 text-slate-200">
                  <span className="text-[10px] uppercase font-bold text-purple-400 block mb-0.5">{data.itemBName}</span>
                  {c.itemB}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 4. Step-by-Step Lesson Panel
// ==========================================
export const StepLessonPanel: React.FC<{
  data: {
    topic: string;
    steps: StepItem[];
  };
  themeHex?: string;
}> = ({ data, themeHex = '#00ea77' }) => {
  const steps = data.steps || [];
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (num: number) => {
    setCompletedSteps((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  if (steps.length === 0) return null;

  return (
    <div className="w-full my-4 rounded-2xl border border-white/10 bg-[#0d121c] p-4 sm:p-5 shadow-xl not-prose">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Step-by-Step Lesson</span>
          <h4 className="text-sm sm:text-base font-bold text-white">{data.topic}</h4>
        </div>
        <div className="text-xs font-mono text-slate-400">
          {Object.values(completedSteps).filter(Boolean).length} of {steps.length} completed
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {steps.map((st) => {
          const isDone = !!completedSteps[st.stepNumber];
          return (
            <div
              key={st.stepNumber}
              className={`p-3.5 rounded-xl border transition-all ${
                isDone ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-white/10 bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleStep(st.stepNumber)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                      isDone ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/20 bg-black/40 text-transparent hover:border-white/40'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <div>
                    <h5 className={`text-xs sm:text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                      Step {st.stepNumber}: {st.title}
                    </h5>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">{st.explanation}</p>
                    {st.example && (
                      <div className="mt-2 p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-400">
                        <strong className="text-slate-300">Example:</strong> {st.example}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 5. Revision Timetable Layout
// ==========================================
export const RevisionTimetableLayout: React.FC<{
  data: {
    title?: string;
    targetExam?: string;
    slots: TimetableSlot[];
  };
}> = ({ data }) => {
  const slots = data.slots || [];
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  if (slots.length === 0) return null;

  return (
    <div className="w-full my-4 rounded-2xl border border-white/10 bg-[#0d121c] p-4 sm:p-5 shadow-xl not-prose">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white">{data.title || 'Revision Timetable'}</span>
        </div>
        {data.targetExam && <span className="font-mono text-amber-400">{data.targetExam}</span>}
      </div>

      <div className="mt-3 divide-y divide-white/5">
        {slots.map((s, idx) => {
          const isDone = !!checked[idx];
          return (
            <div
              key={idx}
              onClick={() => setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }))}
              className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isDone ? 'bg-emerald-950/20 line-through text-slate-500' : 'hover:bg-slate-900/60 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-sky-400 w-18">{s.time}</span>
                <div>
                  <span className="font-bold text-xs text-white block">{s.topic}</span>
                  <span className="text-[11px] text-slate-400">{s.goals}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300">
                {s.subject}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 6. Data Visualization Chart (CSS/SVG)
// ==========================================
export const DataVisualChart: React.FC<{
  data: {
    title: string;
    chartType?: 'bar' | 'distribution';
    data: ChartDatum[];
  };
}> = ({ data }) => {
  const items = data.data || [];
  if (items.length === 0) return null;

  const maxVal = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="w-full my-4 rounded-2xl border border-white/10 bg-[#0d121c] p-4 sm:p-5 shadow-xl not-prose">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-xs font-bold text-white">
        <BarChart3 className="w-4 h-4 text-emerald-400" />
        <span>{data.title}</span>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, idx) => {
          const percent = Math.min(100, Math.round((item.value / maxVal) * 100));
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span>{item.label}</span>
                <span className="font-mono tabular-nums text-emerald-400">
                  {item.value} {item.unit || ''}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: item.color || '#00ea77',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// Master Root Adaptive Visual Dispatcher
// ==========================================
export const AdaptiveVisualResponse: React.FC<{
  type: AdaptiveVisualType;
  data: any;
  themeHex?: string;
}> = ({ type, data, themeHex = '#00ea77' }) => {
  switch (type) {
    case 'mcq':
      return <InteractiveMCQCard data={data} themeHex={themeHex} />;
    case 'flashcard':
      return <InteractiveFlashcardsDeck data={data} themeHex={themeHex} />;
    case 'comparison':
      return <InteractiveComparisonCard data={data} />;
    case 'steps':
      return <StepLessonPanel data={data} themeHex={themeHex} />;
    case 'timetable':
      return <RevisionTimetableLayout data={data} />;
    case 'chart':
      return <DataVisualChart data={data} />;
    default:
      return null;
  }
};
