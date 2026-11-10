import React, { useState } from 'react';
import {
  X,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Globe,
  Brain,
  MessageSquare,
  Shield,
  FileCode,
  CheckCircle2,
  Activity,
  Terminal,
  Zap,
  Sliders,
  HelpCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface AiIntelligenceLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeColorHex?: string;
  darkMode?: boolean;
}

interface PipelineStage {
  id: string;
  stepNumber: number;
  title: string;
  shortDesc: string;
  purpose: string;
  example: string;
  technicalRequirements: string;
  status: 'active' | 'optimized' | 'monitoring';
  tags: string[];
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'input',
    stepNumber: 1,
    title: 'User Input',
    shortDesc: 'Captures text, voice transcription, or image/video media.',
    purpose: 'Accepts raw multimodal signals from the message composer, dictation mic, or uploaded attachments.',
    example: 'User types: "Assalam-o-Alaikum, speech opening yaad karne ka formula batao"',
    technicalRequirements: 'UTF-8 sanitization, payload size verification, MIME type inspection, boundary checking.',
    status: 'active',
    tags: ['Multimodal', 'Text', 'Voice', 'Vision'],
  },
  {
    id: 'lang_detect',
    stepNumber: 2,
    title: 'Language Detection',
    shortDesc: 'Identifies Urdu, Hindi, English, Roman Urdu, Arabic, or mixed dialects.',
    purpose: 'Determines the input script and dialect (including code-switching like Hinglish or Roman Urdu) to preserve linguistic nuance in the answer.',
    example: 'Detected: Urdu (Roman Script / Nastaliq compatible), mixed conversational tone.',
    technicalRequirements: 'Character entropy scoring, ngram lexicon lookup, dialect classifier.',
    status: 'active',
    tags: ['Roman Urdu', 'Hindi', 'English', 'Multilingual'],
  },
  {
    id: 'processing',
    stepNumber: 3,
    title: 'Input Processing',
    shortDesc: 'Cleans typos, checks profanity, strips artifacts.',
    purpose: 'Normalizes spelling variations, filters abusive terms via strict zero-tolerance detector, and prepares canonical tokens.',
    example: 'Sanitized input checked against bad language detector: Clean. Typo normalization applied.',
    technicalRequirements: 'Bad language filter, regex token normalization, math expression pre-evaluator.',
    status: 'active',
    tags: ['Safety', 'Normalization', 'Zero-Slop'],
  },
  {
    id: 'intent',
    stepNumber: 4,
    title: 'Intent Understanding',
    shortDesc: 'Decodes intent: Debate, Coding, Presentation, Calculation, or Chat.',
    purpose: 'Identifies whether the request needs a presentation, spreadsheet, step-by-step tutorial, direct answer, or image generation.',
    example: 'Recognized Intent: Educational / Speech preparation with structured steps and interactive options.',
    technicalRequirements: 'Intent pattern matcher, presentation trigger heuristics, formula evaluator.',
    status: 'optimized',
    tags: ['Intent Parser', 'Structured Actions'],
  },
  {
    id: 'context',
    stepNumber: 5,
    title: 'Relevant Context',
    shortDesc: 'Connects conversation turns while respecting privacy isolation.',
    purpose: 'Retrieves previous turns from active session memory. In Temporary Chat, context is strictly ephemeral and never reads or writes to persistent storage.',
    example: 'Prior turn: "Debate topic: Masnooi Zehanat par bharosa". Current turn continues speech practice.',
    technicalRequirements: 'Sliding window buffer, session isolation, token budget enforcement.',
    status: 'active',
    tags: ['In-Memory', 'Ephemeral', 'Isolation'],
  },
  {
    id: 'instructions',
    stepNumber: 6,
    title: 'Instruction Handling',
    shortDesc: 'Applies tone, formatting, language rules & emoji guidelines.',
    purpose: 'Merges developer system instructions with user preferences (e.g. professional, friendly, exam-focused, structured steps, emoji integration).',
    example: 'System instruction: Use structured step cards, contextual icons, and zero-pill discipline.',
    technicalRequirements: 'System prompt compiler, role executive policy, safety guardrails.',
    status: 'optimized',
    tags: ['Formatting', 'System Rules', 'Tone'],
  },
  {
    id: 'model_api',
    stepNumber: 7,
    title: 'Model / API Processing',
    shortDesc: 'Dispatches payload to high-speed AI inference models.',
    purpose: 'Executes inference via legitimate free-tier OpenRouter/Gemini endpoints with automatic backoff and retry mechanisms.',
    example: 'Payload dispatched to Gemini Flash with temperature 0.7 for creative yet accurate structuring.',
    technicalRequirements: 'HTTPS fetch stream, AbortController timeout handling, auth token headers.',
    status: 'active',
    tags: ['Inference', 'OpenRouter', 'Gemini'],
  },
  {
    id: 'tools',
    stepNumber: 8,
    title: 'Optional Tools',
    shortDesc: 'Calculates math, searches offline memory, or builds files.',
    purpose: 'Calls specialized local tools: instant math solver, offline dictionary lookup, PowerPoint PPTX compiler, or Excel XLSX builder.',
    example: 'Tool activated: Math solver for instant fraction evaluation without network latency.',
    technicalRequirements: 'Client-side tool handlers, XLSX/PPTX binary builders, offline memory database.',
    status: 'active',
    tags: ['Client Tools', 'Offline Memory', 'Generators'],
  },
  {
    id: 'streaming',
    stepNumber: 9,
    title: 'Response Streaming',
    shortDesc: 'Tokens arrive incrementally with zero perceived latency.',
    purpose: 'Renders incoming text chunks as they arrive from the network stream so the user sees thoughts appear immediately.',
    example: 'First token received in 320ms. Streaming rate: ~45 tokens/second.',
    technicalRequirements: 'ReadableStream reader, chunk decoder, throttle requestAnimationFrame dispatch.',
    status: 'active',
    tags: ['Real-time', 'Chunking', 'Smooth Scroll'],
  },
  {
    id: 'ui_output',
    stepNumber: 10,
    title: 'Final UI Output',
    shortDesc: 'Transforms markdown into interactive cards, copy blocks & steps.',
    purpose: 'Converts raw response text into rich interactive components: numbered steps, checklists, code blocks with syntax highlighting, and media previews.',
    example: 'Rendered: 4-step speech memorization trick with colorful icons (Salam, Mauzoo, Support, Final jawab).',
    technicalRequirements: 'Custom React markdown renderer, LaTeX formula parser, syntax highlighter.',
    status: 'optimized',
    tags: ['Interactive Cards', 'Rich Markdown', 'Accessible'],
  },
];

const MULTILINGUAL_EXAMPLES = [
  {
    lang: 'Roman Urdu / Urdu',
    input: 'Debate speech opening yaad karne ka short trick batao',
    outputSummary: '4-step structured method: 1. Salam, 2. Mauzoo, 3. Support, 4. Final jawab with practice input box.',
  },
  {
    lang: 'English',
    input: 'Explain how neural network backpropagation works simply',
    outputSummary: 'Visual breakdown using forward pass, loss calculation, gradients, and weight adjustments with formulas.',
  },
  {
    lang: 'Hindi',
    input: 'कंप्यूटर नेटवर्क में पैकेट स्विचिंग क्या होती है?',
    outputSummary: 'विस्तृत विवरण: डेटा पैकेट, राउटर रूटिंग, बैंडविड्थ उपयोग और सर्किट स्विचिंग से तुलना।',
  },
  {
    lang: 'Arabic',
    input: 'ما هي أهم ميزات الذكاء الاصطناعي التوليدي؟',
    outputSummary: 'نقاط رئيسية: معالجة اللغات الطبيعية، توليد الوسائط المتعددة، التعلم العميق والسرعة الفائقة.',
  },
  {
    lang: 'Spanish',
    input: 'Explica la diferencia entre API REST y GraphQL',
    outputSummary: 'Tabla comparativa con endpoints, overfetching, flexibilidad y ejemplos prácticos.',
  },
];

export const AiIntelligenceLabModal: React.FC<AiIntelligenceLabModalProps> = ({
  isOpen,
  onClose,
  themeColorHex = '#00ea77',
  darkMode = true,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>('input');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'examples' | 'architecture' | 'privacy'>('pipeline');
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);

  if (!isOpen) return null;

  const currentStage = PIPELINE_STAGES.find((s) => s.id === selectedStageId) || PIPELINE_STAGES[0];

  return (
    <div
      id="ai-intelligence-lab-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="ai-intelligence-lab-modal"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          darkMode
            ? 'bg-[#0c111a] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-[#0e1420]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: `${themeColorHex}20`,
                border: `1.5px solid ${themeColorHex}60`,
                color: themeColorHex,
              }}
            >
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white font-['Orbitron',sans-serif]">
                  AI Intelligence Lab
                </h2>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                  style={{
                    backgroundColor: `${themeColorHex}25`,
                    color: themeColorHex,
                    border: `1px solid ${themeColorHex}50`,
                  }}
                >
                  Interactive Architecture
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Understand how Sigma AI interprets input, parses intent, and streams intelligence
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close Lab"
            aria-label="Close AI Intelligence Lab"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-slate-800/60 bg-[#0b0f17] overflow-x-auto scrollbar-none">
          {[
            { id: 'pipeline', label: 'Processing Pipeline (10 Stages)', icon: Layers },
            { id: 'examples', label: 'Multilingual Examples', icon: Globe },
            { id: 'architecture', label: 'Latency & Streaming', icon: Zap },
            { id: 'privacy', label: 'Memory & Ephemeral Isolation', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              {/* Pipeline Flow Stepper */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Interactive 10-Stage Pipeline (Click any step to inspect)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Step {currentStage.stepNumber} of 10
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PIPELINE_STAGES.map((stage) => {
                    const isSelected = stage.id === selectedStageId;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => setSelectedStageId(stage.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-950/70 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                            : 'bg-[#101622] border-slate-800/80 hover:border-slate-700 hover:bg-[#141b2a]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {stage.stepNumber}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-blue-300' : 'text-slate-200'
                          }`}
                        >
                          {stage.title}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate mt-0.5">
                          {stage.tags[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Stage Detail Card */}
              <div className="rounded-2xl border border-slate-800 bg-[#101624] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 font-mono text-xs font-bold">
                      STAGE {currentStage.stepNumber}: {currentStage.title.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">{currentStage.shortDesc}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {currentStage.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Purpose & Example */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Purpose & Role
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {currentStage.purpose}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#090d14] border border-slate-800/80 p-3">
                      <h4 className="text-[11px] font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Real Execution Example</span>
                      </h4>
                      <p className="text-xs font-mono text-slate-300 bg-black/40 p-2 rounded-lg border border-slate-800/60">
                        {currentStage.example}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Technical Requirements & Status */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Technical Requirements
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono bg-black/30 p-2.5 rounded-xl border border-slate-800/70">
                        {currentStage.technicalRequirements}
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300">
                          Active & Optimized
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Latency impact: minimal
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Multilingual Understanding & Dialect Handling
                </span>
                <span className="text-[11px] text-slate-400">
                  Select a language to see how it is parsed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {MULTILINGUAL_EXAMPLES.map((ex, idx) => (
                  <button
                    key={ex.lang}
                    type="button"
                    onClick={() => setSelectedExampleIndex(idx)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedExampleIndex === idx
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-[#101622] text-slate-300 border-slate-800 hover:bg-[#151c2c]'
                    }`}
                  >
                    {ex.lang}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#101624] p-5 space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Prompt Input ({MULTILINGUAL_EXAMPLES[selectedExampleIndex].lang})
                  </span>
                  <div className="p-3 rounded-xl bg-[#080c14] border border-slate-800/90 text-sm font-medium text-white">
                    "{MULTILINGUAL_EXAMPLES[selectedExampleIndex].input}"
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Structured Output Strategy
                  </span>
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs sm:text-sm text-emerald-200 leading-relaxed">
                    {MULTILINGUAL_EXAMPLES[selectedExampleIndex].outputSummary}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="rounded-2xl border border-slate-800 bg-[#101624] p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Streaming vs Batch & Latency Factors</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sigma AI uses token-by-token streaming via HTTP chunking to ensure you never wait for an entire 1,000-word essay or code block to finish generating before reading it.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                  <h4 className="text-xs font-bold text-blue-400 mb-1">Time to First Token (TTFT)</h4>
                  <p className="text-[11px] text-slate-300">
                    Typically ~300ms to 600ms depending on prompt token length and model warm-up.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                  <h4 className="text-xs font-bold text-purple-400 mb-1">Streaming Speed</h4>
                  <p className="text-[11px] text-slate-300">
                    35–60 tokens/sec. Text renders fluidly using smooth markdown chunk decoders.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                  <h4 className="text-xs font-bold text-emerald-400 mb-1">Generative Variability</h4>
                  <p className="text-[11px] text-slate-300">
                    Temperature is balanced (~0.7) for creative variety without losing factual fidelity.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="rounded-2xl border border-slate-800 bg-[#101624] p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Memory Isolation & Ephemeral Session Lifecycle</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When you activate **Temporary Chat**, the conversation is placed in strict volatile RAM isolation:
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span><strong>Zero Persistent Storage:</strong> No entries written to localStorage, cookies, or Firestore.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span><strong>Instant Wipe on Close or Refresh:</strong> As soon as the browser tab is closed or reloaded, the entire session is permanently erased.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span><strong>Immediate Abort on Toggle:</strong> Turning off Temporary Chat halts ongoing model generation and purges the input composer.</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800/80 bg-[#0e1420] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Sigma AI Intelligence Engine • Free-Tier Provider Architecture
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Lab
          </button>
        </div>
      </div>
    </div>
  );
};
