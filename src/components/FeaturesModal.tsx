import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Search,
  CheckCircle2,
  Code2,
  Brain,
  Palette,
  Volume2,
  Shield,
  Layers,
  Zap,
  Globe,
  Sliders,
  Terminal,
  Smartphone,
  Monitor,
  Eye,
  Camera,
  MessageSquare,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { ThemeColorOption } from '../lib/theme';

export interface AIFeatureItem {
  id: string;
  name: string;
  category: 'core' | 'code' | 'personalization' | 'multimodal' | 'accessibility' | 'privacy';
  icon: string;
  badge?: string;
  desc: string; // concise small definition
}

export const SIGMA_AI_FEATURES: AIFeatureItem[] = [
  // 1. Core AI & Fallback Engine
  {
    id: 'f1',
    name: 'Multi-Model Fallback Engine',
    category: 'core',
    icon: '⚡',
    badge: 'Zero Quota Halts',
    desc: 'Auto-switches across Gemini 2.5, 3.6, Lite, 3.8, and OpenRouter to prevent quota errors.',
  },
  {
    id: 'f2',
    name: 'OpenRouter & 3P API Support',
    category: 'core',
    icon: '🔌',
    badge: 'BYO Keys',
    desc: 'Query Claude 3.5, GPT-4o, and DeepSeek directly using your own custom API key and endpoint.',
  },
  {
    id: 'f3',
    name: 'Model Quick Switcher',
    category: 'core',
    icon: '🎛️',
    badge: 'Instant',
    desc: 'One-tap switching between top frontier AI language models without page reloads.',
  },
  {
    id: 'f4',
    name: 'Google Search Grounding',
    category: 'core',
    icon: '🌐',
    badge: 'Live Web',
    desc: 'Deep real-time web search for factually cited responses on current events and news.',
  },
  {
    id: 'f5',
    name: 'Instant Stop Generation',
    category: 'core',
    icon: '🛑',
    desc: 'Immediately cancels in-flight AI token streaming with a single click.',
  },
  {
    id: 'f6',
    name: 'Message Regeneration',
    category: 'core',
    icon: '🔄',
    desc: 'Rerun any response turn with alternate thoughts or refreshed contextual perspective.',
  },
  {
    id: 'f7',
    name: 'Branching Prompt Editor',
    category: 'core',
    icon: '✏️',
    desc: 'Edit any previous user message and fork the conversation into a new discussion.',
  },
  {
    id: 'f8',
    name: 'Auto-Scroll with Manual Breakout',
    category: 'core',
    icon: '📜',
    desc: 'Follows streaming output and automatically pauses scrolling the moment you scroll up.',
  },
  {
    id: 'f9',
    name: 'Token & Speed Indicators',
    category: 'core',
    icon: '⏱️',
    desc: 'Live word and token speed metrics displayed unobtrusively for power users.',
  },
  {
    id: 'f10',
    name: 'Zero-Telemetry Architecture',
    category: 'core',
    icon: '🛡️',
    desc: 'Pure client-first proxy architecture; your prompts and data are never sold or tracked.',
  },

  // 2. Code & Developer Tools
  {
    id: 'f11',
    name: 'Interactive Code Artifacts',
    category: 'code',
    icon: '💻',
    badge: 'Live Sandbox',
    desc: 'Execute JavaScript, HTML/CSS, React components, and Python scripts safely in-browser.',
  },
  {
    id: 'f12',
    name: 'Prism.js Syntax Highlighting',
    category: 'code',
    icon: '🎨',
    desc: 'Dark-themed code formatting with line numbering and syntax coloring for 40+ languages.',
  },
  {
    id: 'f13',
    name: 'One-Click Code Copy',
    category: 'code',
    icon: '📋',
    desc: 'Instant clipboard copying with visual confirmation on every code block.',
  },
  {
    id: 'f14',
    name: 'Phone-Optimized Code Modal',
    category: 'code',
    icon: '📱',
    badge: 'Mobile First',
    desc: 'Concise touch button labels ("Write Code", "Debug") fitted specifically for phone screens.',
  },
  {
    id: 'f15',
    name: 'LaTeX Math Formula Engine',
    category: 'code',
    icon: '📐',
    desc: 'Render complex mathematical formulas, matrix calculations, and Greek variables cleanly.',
  },
  {
    id: 'f16',
    name: 'Markdown Tables & Blocks',
    category: 'code',
    icon: '📊',
    desc: 'Structured comparison tables, formatted blockquotes, and nested lists rendered with elegance.',
  },
  {
    id: 'f17',
    name: 'Smart Diagnostic Tooltips',
    category: 'code',
    icon: '💡',
    desc: 'Diagnostic guides that pinpoint provider or syntax errors when custom API keys fail.',
  },
  {
    id: 'f18',
    name: 'Canvas / Scratchpad Mode',
    category: 'code',
    icon: '📝',
    desc: 'Side-by-side editing canvas for writing long documents and iterative code development.',
  },

  // 3. Personalization & Personas
  {
    id: 'f19',
    name: 'Adaptive AI Memory',
    category: 'personalization',
    icon: '🧠',
    badge: 'Smart Context',
    desc: 'Learns from your bio and preferences to personalize explanation depth and tone.',
  },
  {
    id: 'f20',
    name: 'Custom AI Persona Builder',
    category: 'personalization',
    icon: '🎭',
    badge: 'Custom Behavior',
    desc: 'Define custom system instructions ("How you want AI to be") with a dedicated toggle.',
  },
  {
    id: 'f21',
    name: 'Deep English Personality',
    category: 'personalization',
    icon: '📖',
    desc: 'Articulate, sophisticated native US vocabulary ideal for literature and deep essays.',
  },
  {
    id: 'f22',
    name: 'Professional & Concise Mode',
    category: 'personalization',
    icon: '💼',
    desc: 'Direct, sharp, no-fluff answers structured for executive business communication.',
  },
  {
    id: 'f23',
    name: 'Creative & Expressive Mode',
    category: 'personalization',
    icon: '✨',
    desc: 'Imaginative metaphors, vivid narratives, and evocative storytelling.',
  },
  {
    id: 'f24',
    name: 'Friendly & Helpful Mode',
    category: 'personalization',
    icon: '😊',
    desc: 'Warm, cheerful, delightful responses infused with 5 to 10 emojis in every chat.',
  },
  {
    id: 'f25',
    name: 'Code & Technical Expert Mode',
    category: 'personalization',
    icon: '🛠️',
    desc: 'Deep software engineering principles, clean code snippets, and debugging logic.',
  },
  {
    id: 'f26',
    name: 'Adaptive AI Status Indicator',
    category: 'personalization',
    icon: '🔴',
    desc: 'Red cross indicator appears above the Signed In badge when Adaptive AI is switched off.',
  },
  {
    id: 'f27',
    name: 'Signed In Dual-Line Badge',
    category: 'personalization',
    icon: '🟢',
    desc: 'Vertically aligned glowing badge with "in" centered under the "g" of "Signed".',
  },
  {
    id: 'f28',
    name: 'Multi-Language UI & Persona',
    category: 'personalization',
    icon: '🗣️',
    desc: 'Translates all settings, labels, and AI conversational tone into your chosen language.',
  },
  {
    id: 'f29',
    name: 'Custom Creativity Slider',
    category: 'personalization',
    icon: '🎚️',
    desc: 'Adjust temperature between deterministic, factual replies and high creative freedom.',
  },

  // 4. Voice, Vision & Multimodal
  {
    id: 'f30',
    name: 'Natural Deep-Voice TTS',
    category: 'multimodal',
    icon: '🔊',
    badge: 'Realistic Audio',
    desc: 'Reads AI responses aloud in a natural, deep, confident cadence right from the chat bubble.',
  },
  {
    id: 'f31',
    name: 'Speaker Audio Waveform',
    category: 'multimodal',
    icon: '🎵',
    desc: 'Visual audio pulsation indicating active speech playback with instant pause toggle.',
  },
  {
    id: 'f32',
    name: 'Speech-to-Text Microphone',
    category: 'multimodal',
    icon: '🎙️',
    desc: 'Hands-free voice dictation with automatic speech-to-text and punctuation.',
  },
  {
    id: 'f33',
    name: 'Multimodal Vision Analysis',
    category: 'multimodal',
    icon: '👁️',
    badge: 'Image AI',
    desc: 'Attach screenshots, diagrams, and photos for instant structural and visual breakdown.',
  },
  {
    id: 'f34',
    name: 'Webcam Snapshot Capture',
    category: 'multimodal',
    icon: '📷',
    desc: 'Snap real-time photos with your device camera and send them directly to the AI.',
  },
  {
    id: 'f35',
    name: 'Smart Document Reader',
    category: 'multimodal',
    icon: '📄',
    desc: 'Upload text files, markdown, and code repositories to inject whole documents into context.',
  },
  {
    id: 'f36',
    name: 'Prompt Enhancer & Polisher',
    category: 'multimodal',
    icon: '🪄',
    desc: 'Upgrades brief casual prompts into structured, high-accuracy master prompts.',
  },

  // 5. Accessibility & UI Themes
  {
    id: 'f37',
    name: 'Stop Animations Toggle',
    category: 'accessibility',
    icon: '⏹️',
    badge: 'Sensory Comfort',
    desc: 'Instantly halts all UI pulses, spinners, and keyframe transitions across the entire app.',
  },
  {
    id: 'f38',
    name: 'High Contrast Mode (Desktop)',
    category: 'accessibility',
    icon: '👁️‍🗨️',
    desc: 'Bolds all typography and boosts luminance borders on PC for maximum visual clarity.',
  },
  {
    id: 'f39',
    name: '12+ Neon & Cyberpunk Themes',
    category: 'accessibility',
    icon: '🎨',
    desc: 'Vibrant custom accent themes: Cyber Cyan, Neon Purple, Emerald, Crimson, Amber, and more.',
  },
  {
    id: 'f40',
    name: 'Responsive Mobile Drawer',
    category: 'accessibility',
    icon: '📱',
    desc: 'Fluid full-height mobile viewport with zero off-screen clippings on touch devices.',
  },
  {
    id: 'f41',
    name: 'Mobile Quick-Tab Switcher',
    category: 'accessibility',
    icon: '📑',
    desc: 'Horizontal swipeable strip allowing one-tap jumps between all 7 settings tabs on phones.',
  },
  {
    id: 'f42',
    name: 'Sigma Logo Quick Navigation',
    category: 'accessibility',
    icon: '💠',
    desc: 'Clicking the Sigma logo smoothly navigates to sigma/ai and resets back to main chat.',
  },
  {
    id: 'f43',
    name: 'Custom Profile Avatar Upload',
    category: 'accessibility',
    icon: '🖼️',
    desc: 'Upload custom PNG logos or profile photos with real-time circular crop preview.',
  },
  {
    id: 'f44',
    name: 'Power Keyboard Shortcuts',
    category: 'accessibility',
    icon: '⌨️',
    desc: 'Fast desktop hotkeys (Ctrl+Enter to send, Esc to dismiss, / to search).',
  },

  // 6. Privacy, Storage & Notifications
  {
    id: 'f45',
    name: 'Background AI Response Alerts',
    category: 'privacy',
    icon: '🔔',
    badge: 'Smart Alerts',
    desc: 'Native browser alerts trigger when AI completes responses while you are in another tab.',
  },
  {
    id: 'f46',
    name: 'Dynamic Tab Title Flashes',
    category: 'privacy',
    icon: '💬',
    desc: 'Tab title flashes "Sigma AI responded!" in your browser bar when output completes.',
  },
  {
    id: 'f47',
    name: 'Selective History Policy',
    category: 'privacy',
    icon: '🗂️',
    desc: 'Choose between "Save All History" or "Save Specific History Only" for privacy.',
  },
  {
    id: 'f48',
    name: 'One-Click Clear Account History',
    category: 'privacy',
    icon: '🗑️',
    desc: 'Permanently wipes conversation history strictly scoped to your active account with confirmation.',
  },
  {
    id: 'f49',
    name: 'Export to Markdown & JSON',
    category: 'privacy',
    icon: '💾',
    desc: 'Download your full conversation transcript with timestamps, markdown, and code blocks.',
  },
  {
    id: 'f50',
    name: 'Guest Session Isolation',
    category: 'privacy',
    icon: '👤',
    desc: 'Safe sandboxed local guest mode for instant testing before signing in with Google.',
  },
  {
    id: 'f51',
    name: 'Google & Firebase Cloud Sync',
    category: 'privacy',
    icon: '☁️',
    desc: 'Sync preferences, custom personas, and chat history securely to Firebase Firestore.',
  },
  {
    id: 'f52',
    name: 'Searchable Chat History',
    category: 'privacy',
    icon: '🔍',
    desc: 'Instant keyword filter to search and retrieve any past conversation in milliseconds.',
  },
  {
    id: 'f53',
    name: 'Pin & Star Priority Chats',
    category: 'privacy',
    icon: '⭐',
    desc: 'Keep your most important project discussions permanently pinned to the top.',
  },
  {
    id: 'f54',
    name: 'Custom Thread Renaming',
    category: 'privacy',
    icon: '🏷️',
    desc: 'Rename any conversation title to maintain neat, organized project workspaces.',
  },
  {
    id: 'f55',
    name: 'Offline LocalStorage Cache',
    category: 'privacy',
    icon: '📦',
    desc: 'Resilient client caching preserves your themes and draft queries during network drops.',
  },
  {
    id: 'f56',
    name: 'Interactive Story & Twist Engine',
    category: 'personalization',
    icon: '🎭',
    badge: 'Narrative',
    desc: 'Continue narratives with emotional depth or sudden plot twists without restarting context.',
  },
  {
    id: 'f57',
    name: 'Context Compression & Trimming',
    category: 'core',
    icon: '🗜️',
    badge: 'Smart Context',
    desc: 'Intelligently manages long multi-turn context windows to eliminate token overflow errors.',
  },
  {
    id: 'f58',
    name: 'Sub-2-Second High-Speed Routing',
    category: 'core',
    icon: '⚡',
    badge: 'Ultra Fast',
    desc: 'Dynamically routes prompts to low-latency Flash models for rapid sub-2-second answers.',
  },
  {
    id: 'f59',
    name: 'Live HTML/CSS/JS Sandbox Preview',
    category: 'code',
    icon: '🖥️',
    badge: 'Live Run',
    desc: 'Isolated iframe sandbox for rendering live interactive web prototypes directly in chat.',
  },
  {
    id: 'f60',
    name: 'Code Debug & Stack Trace Diagnosis',
    category: 'code',
    icon: '🐞',
    badge: 'Diagnostic',
    desc: 'Parses runtime exceptions, syntax errors, and type mismatches with exact line fixes.',
  },
  {
    id: 'f61',
    name: 'Algorithm Complexity & Big-O Analyzer',
    category: 'code',
    icon: '📈',
    desc: 'Calculates asymptotic time and space complexity with step-by-step performance breakdowns.',
  },
  {
    id: 'f62',
    name: 'Multi-File Context Injection',
    category: 'code',
    icon: '📁',
    desc: 'Attach and analyze multiple code files, JSON payloads, and text schemas simultaneously.',
  },
  {
    id: 'f63',
    name: 'Firestore Real-Time Cloud Persistence',
    category: 'privacy',
    icon: '🔥',
    badge: 'Cloud Sync',
    desc: 'Real-time database syncing conversations, preferences, and personas across all sessions.',
  },
  {
    id: 'f64',
    name: 'Client-Side Google OAuth 2.0',
    category: 'privacy',
    icon: '🔒',
    badge: 'Secure',
    desc: 'Browser-native popup authentication avoiding server-side token vulnerability exposure.',
  },
  {
    id: 'f65',
    name: 'Role-Based Access Control (RBAC)',
    category: 'privacy',
    icon: '👑',
    desc: 'Cryptographically verifies email accounts to unlock executive-tier control dashboards.',
  },
  {
    id: 'f66',
    name: 'Streaming Markdown Parser',
    category: 'accessibility',
    icon: '📝',
    desc: 'Zero-flicker incremental parser formatting live tables, lists, and code during streaming.',
  },
  {
    id: 'f67',
    name: 'Taskbar Accent Synchronization',
    category: 'accessibility',
    icon: '🎯',
    desc: 'Unifies navigation controls, modal borders, and neon indicators with your active palette.',
  },
  {
    id: 'f68',
    name: 'Natural Pitch & Cadence Modulation',
    category: 'multimodal',
    icon: '🎙️',
    desc: 'Calibrated voice synthesis tuning rate and pitch to eliminate synthetic robot distortion.',
  },
  {
    id: 'f69',
    name: 'Structured JSON Schema Export',
    category: 'privacy',
    icon: '📊',
    desc: 'Standardized JSON transcript export ready for model evaluation and dataset training.',
  },
  {
    id: 'f70',
    name: 'Live Query Metrics Diagnostics',
    category: 'core',
    icon: '📡',
    desc: 'Tracks latency benchmarks and model availability without recording conversational content.',
  },
];

interface FeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeColorOption;
}

export const FeaturesModal: React.FC<FeaturesModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Features', icon: Sparkles, count: SIGMA_AI_FEATURES.length },
    { id: 'core', label: 'Core AI', icon: Zap, count: SIGMA_AI_FEATURES.filter((f) => f.category === 'core').length },
    { id: 'code', label: 'Code & Dev', icon: Code2, count: SIGMA_AI_FEATURES.filter((f) => f.category === 'code').length },
    { id: 'personalization', label: 'Personalization', icon: Brain, count: SIGMA_AI_FEATURES.filter((f) => f.category === 'personalization').length },
    { id: 'multimodal', label: 'Voice & Vision', icon: Volume2, count: SIGMA_AI_FEATURES.filter((f) => f.category === 'multimodal').length },
    { id: 'accessibility', label: 'UI & Themes', icon: Palette, count: SIGMA_AI_FEATURES.filter((f) => f.category === 'accessibility').length },
    { id: 'privacy', label: 'Privacy & Sync', icon: Shield, count: SIGMA_AI_FEATURES.filter((f) => f.category === 'privacy').length },
  ];

  const filteredFeatures = useMemo(() => {
    return SIGMA_AI_FEATURES.filter((feature) => {
      const matchesCategory =
        selectedCategory === 'all' || feature.category === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (feature.badge && feature.badge.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      id="features-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="features-modal-container"
        className="relative bg-[#0d1017] border border-white/10 w-full sm:max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="p-4 sm:p-6 border-b border-[#1e222d] bg-[#11141c] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Features Logo Badge */}
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{
                backgroundColor: `${currentTheme.hex}25`,
                border: `1.5px solid ${currentTheme.hex}`,
                boxShadow: `0 0 16px ${currentTheme.glow}`,
              }}
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: currentTheme.hex }} />
            </div>

            <div>
              <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">
                Sigma AI Features
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Explore built-in capabilities, developer tools & system modes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Close features"
            aria-label="Close features"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH & CATEGORY BAR */}
        <div className="p-3 sm:p-4 bg-[#0e1118] border-b border-[#1e222d] space-y-2.5 flex-shrink-0">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search capabilities by name or keyword..."
              className="w-full bg-[#161a24] text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 pl-10 pr-9 py-2.5 rounded-xl border border-white/5 focus:outline-none transition-colors"
              style={{
                borderColor: searchQuery ? currentTheme.hex : undefined,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Pills (Horizontal scroll on mobile, wrap on desktop) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none overscroll-x-contain">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'font-bold shadow-xs'
                      : 'bg-[#151922] text-slate-400 hover:text-white hover:bg-[#1a202c]'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${currentTheme.hex}22`,
                          color: currentTheme.hex,
                          border: `1px solid ${currentTheme.hex}60`,
                        }
                      : { border: '1px solid rgba(255,255,255,0.05)' }
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-white/10' : 'bg-black/30 text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FEATURES CONTENT VIEWPORT */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 min-h-0 overscroll-contain">
          {filteredFeatures.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No features matched "{searchQuery}"</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-3 text-xs underline cursor-pointer"
                style={{ color: currentTheme.hex }}
              >
                Reset search & categories
              </button>
            </div>
          ) : (
            <>
              {/* PC LAYOUT: 2-3 Column Responsive Grid */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredFeatures.map((feat, idx) => (
                  <div
                    key={feat.id}
                    className="p-3.5 rounded-2xl bg-[#131620] border border-white/5 hover:border-white/15 transition-all hover:-translate-y-0.5 shadow-sm group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg flex-shrink-0">{feat.icon}</span>
                          <h4 className="text-xs font-bold text-white group-hover:text-slate-100 truncate">
                            {idx + 1}. {feat.name}
                          </h4>
                        </div>
                        {feat.badge && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide flex-shrink-0"
                            style={{
                              backgroundColor: `${currentTheme.hex}18`,
                              color: currentTheme.hex,
                              border: `1px solid ${currentTheme.hex}33`,
                            }}
                          >
                            {feat.badge}
                          </span>
                        )}
                      </div>
                      {/* Short concise definition */}
                      <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                        {feat.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="capitalize">{feat.category}</span>
                      <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-400">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* MOBILE LAYOUT: Touch-friendly vertical stack with compact 1-line definitions */}
              <div className="sm:hidden space-y-2">
                {filteredFeatures.map((feat, idx) => (
                  <div
                    key={feat.id}
                    className="p-2.5 rounded-xl bg-[#131620] border border-white/5 flex items-start gap-2.5 active:bg-[#181d29] transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                      style={{ backgroundColor: `${currentTheme.hex}15` }}
                    >
                      {feat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-0.5">
                        <h4 className="text-xs font-bold text-white truncate">
                          {idx + 1}. {feat.name}
                        </h4>
                        {feat.badge && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[8px] font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: `${currentTheme.hex}20`,
                              color: currentTheme.hex,
                            }}
                          >
                            {feat.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 bg-[#11141c] border-t border-[#1e222d] flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span className="text-[11px]">
            Showing <strong className="text-white">{filteredFeatures.length}</strong> of{' '}
            {SIGMA_AI_FEATURES.length} features
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-black transition-transform active:scale-95 cursor-pointer shadow-md"
            style={{ backgroundColor: currentTheme.hex }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
