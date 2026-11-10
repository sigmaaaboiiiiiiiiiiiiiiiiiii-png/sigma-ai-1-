import React, { useState, useMemo, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Copy,
  Check,
  ExternalLink,
  Globe,
  AlertCircle,
  PenTool,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  Send,
  Play,
  Pause,
  RotateCcw,
  Rewind,
  FastForward,
  Square,
  Brain,
  Search,
  Library,
  MoreHorizontal,
  GitBranch,
  FileText,
  Maximize2,
  Minimize2,
  Code2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Video,
  Camera,
  Upload,
} from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';
import { HolographicCoreLoader } from './HolographicCoreLoader';
import { saveItemToLibrary, detectLibraryContentType } from '../lib/libraryStorage';
import {
  generateContextualFollowUpActions,
  classifyResponseArtifact,
} from '../lib/contextualActions';
import {
  TtsVoiceOptionId,
  TTS_VOICE_OPTIONS,
  getSavedTtsVoice,
  resolveSpeechVoice,
  buildSpokenTextFromMessage,
  speakChunkedWithGuard,
  clearSpeechKeepAlive,
  sliceTextFromProgress,
  computeVoiceSynchronizedWaveform,
} from '../lib/ttsVoiceEngine';
import { formatSafeTime, formatMessageTimestamp } from '../lib/dateUtils';
import { submitFeedbackReviewToFirestore, getSessionHash } from '../lib/firebase';
import { extractPresentationFromMessage } from '../lib/presentationGenerator';
import { extractSlideCountPromptFromMessage } from '../lib/powerpointIntent';
import { PresentationResultCard } from './powerpoint/PresentationResultCard';
import { PowerPointIcon } from './powerpoint/PowerPointIcon';
import { extractExcelFromMessage } from '../lib/excelGenerator';
import { getTranslation } from '../lib/translations';
import { ExcelResultCard } from './excel/ExcelResultCard';
import {
  AdaptiveVisualResponse,
  parseAdaptiveVisualPayload,
  AdaptiveVisualType,
} from './AdaptiveVisualResponse';

interface MarkdownSegment {
  type: 'markdown' | 'table';
  content: string;
  headers?: string[];
  rows?: string[][];
}

/**
 * Section 8: Ensures explanatory prose is never accidentally trapped inside a code block.
 * If a code fence starts with natural conversational sentences followed by code statements,
 * hoists the conversational prose out above the code fence.
 */
export function separateProseFromCodeFence(md: string): string {
  if (!md || !md.includes('```')) return md;

  return md.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (fullMatch, lang, body) => {
    const lines = String(body).split('\n');
    if (lines.length < 3) return fullMatch;

    const codeStartRegex =
      /^\s*(import\s+|from\s+\S+\s+import|#include|using\s+|package\s+|def\s+\w+|class\s+\w+|function\s+\w*|const\s+\w+|let\s+\w+|var\s+\w+|local\s+\w+|public\s+|private\s+|export\s+|async\s+|return\s+|if\s*\(|for\s*\(|while\s*\(|<\!DOCTYPE|<html|<div|<script|@|\w+\.\w+\(|\/\/|\/\*|--\s|#\s*!)/;

    const proseLines: string[] = [];
    let codeStartIndex = 0;

    for (let i = 0; i < Math.min(5, lines.length - 1); i++) {
      const line = lines[i].trim();
      if (!line) {
        if (proseLines.length > 0) {
          codeStartIndex = i + 1;
        }
        continue;
      }
      if (codeStartRegex.test(line) || /[{}();=<>[\]]/.test(line)) {
        break;
      }
      // Check if it looks like a natural conversational sentence (e.g. "Building a game with huge leaps...")
      const wordCount = line.split(/\s+/).length;
      if (wordCount >= 5 && /[.!:]$/.test(line)) {
        proseLines.push(line);
        codeStartIndex = i + 1;
      } else {
        break;
      }
    }

    if (proseLines.length > 0 && codeStartIndex < lines.length) {
      const remainingCode = lines.slice(codeStartIndex).join('\n').trim();
      if (remainingCode.length > 0) {
        const effectiveLang =
          !lang || lang.toLowerCase() === 'text' || lang.toLowerCase() === 'plaintext'
            ? 'code'
            : lang;
        return `${proseLines.join('\n\n')}\n\n\`\`\`${effectiveLang}\n${remainingCode}\n\`\`\``;
      }
    }

    return fullMatch;
  });
}

/**
 * Sections 8, 9, 10, 11, 13: Dedicated Professional Code Block Component
 * - Clearly distinct darker code surface (#070b12)
 * - Subtle personalization theme border & accent
 * - Dedicated Code Block Header with programming language label, Copy-Only-Code button, and optional code actions
 * - Intelligent screen management for long code blocks (collapsible preview when > 32 lines)
 */
const CodeBlockView: React.FC<{
  language: string;
  code: string;
  themeColorHex: string;
  onActionClick?: (actionText: string) => void;
  onOpenCodeForMessage?: (codeText: string, mode?: string) => void;
}> = ({ language, code, themeColorHex, onActionClick, onOpenCodeForMessage }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);

  const cleanCode = code.replace(/\n$/, '');
  const codeLines = cleanCode.split('\n');
  const isLongCode = codeLines.length > 32;

  const handleCopyCodeOnly = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const displayLang = (language || 'code').trim().toUpperCase();

  return (
    <div
      className="not-prose my-3.5 rounded-2xl overflow-hidden shadow-xl transition-all"
      style={{
        backgroundColor: '#070b12',
        border: `1px solid ${themeColorHex}45`,
        boxShadow: `0 8px 28px rgba(0, 0, 0, 0.45), 0 0 14px ${themeColorHex}14`,
      }}
    >
      {/* Subtle Theme Accent Line */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, ${themeColorHex}, ${themeColorHex}40, transparent)`,
        }}
      />

      {/* Code Block Header */}
      <div
        className="flex items-center justify-between gap-2 px-3.5 sm:px-4 py-2 border-b text-xs select-none"
        style={{
          backgroundColor: '#0d1320',
          borderColor: `${themeColorHex}28`,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: themeColorHex }}
            />
            <Code2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: themeColorHex }} />
          </div>
          <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-slate-200 truncate">
            {displayLang}
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            · {codeLines.length} {codeLines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onOpenCodeForMessage && (
            <button
              type="button"
              onClick={() => onOpenCodeForMessage(cleanCode, 'optimize')}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-95"
              title="Open in Code Assistant"
            >
              <Code2 className="w-3 h-3" style={{ color: themeColorHex }} />
              <span>Code Tool</span>
            </button>
          )}
          {onActionClick && (
            <button
              type="button"
              onClick={() =>
                onActionClick(`Explain and walk through this ${displayLang} code step by step`)
              }
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-95"
              title="Explain this code"
            >
              <BookOpen className="w-3 h-3" style={{ color: themeColorHex }} />
              <span>Explain</span>
            </button>
          )}

          {/* Copy ONLY the actual code inside this code block */}
          <button
            type="button"
            onClick={handleCopyCodeOnly}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer active:scale-95 border"
            style={{
              backgroundColor: copiedCode ? 'rgba(16, 185, 129, 0.16)' : `${themeColorHex}18`,
              borderColor: copiedCode ? 'rgba(16, 185, 129, 0.45)' : `${themeColorHex}50`,
              color: copiedCode ? '#34d399' : '#f1f5f9',
            }}
            title="Copy only this code block"
            aria-label="Copy code"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" style={{ color: themeColorHex }} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Readable Professional Code Surface with Long-Code Screen Management */}
      <div
        className={`relative transition-all duration-200 ${
          isLongCode && !isCodeExpanded ? 'max-h-[360px] overflow-hidden' : ''
        }`}
      >
        <pre className="p-3.5 sm:p-4 overflow-x-auto text-xs sm:text-[13px] leading-relaxed font-mono text-slate-100 bg-[#070b12] m-0 select-text">
          <code>{cleanCode}</code>
        </pre>
        {isLongCode && !isCodeExpanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, #070b12 15%, transparent)',
            }}
          />
        )}
      </div>

      {isLongCode && (
        <div
          className="px-4 py-2 border-t flex items-center justify-center bg-[#0b101b]"
          style={{ borderColor: `${themeColorHex}25` }}
        >
          <button
            type="button"
            onClick={() => setIsCodeExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
            style={{ color: themeColorHex }}
          >
            {isCodeExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Collapse code</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Show all {codeLines.length} lines</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

function splitMarkdownAndTables(md: string): MarkdownSegment[] {
  const lines = md.split('\n');
  const segments: MarkdownSegment[] = [];
  let currentMdLines: string[] = [];
  let i = 0;

  const isTableRow = (line: string) => {
    const t = line.trim();
    return t.startsWith('|') && t.endsWith('|') && t.split('|').length >= 3;
  };

  const isTableSeparator = (line: string) => {
    const t = line.trim();
    return /^\|(\s*:?-+:?\s*\|)+$/.test(t);
  };

  const parseCells = (line: string): string[] =>
    line
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim());

  while (i < lines.length) {
    if (
      i + 1 < lines.length &&
      isTableRow(lines[i]) &&
      isTableSeparator(lines[i + 1])
    ) {
      if (currentMdLines.length > 0) {
        segments.push({ type: 'markdown', content: currentMdLines.join('\n') });
        currentMdLines = [];
      }
      const headers = parseCells(lines[i]);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        if (!isTableSeparator(lines[i])) {
          rows.push(parseCells(lines[i]));
        }
        i++;
      }
      segments.push({
        type: 'table',
        content: '',
        headers,
        rows,
      });
    } else {
      currentMdLines.push(lines[i]);
      i++;
    }
  }

  if (currentMdLines.length > 0) {
    segments.push({ type: 'markdown', content: currentMdLines.join('\n') });
  }

  return segments;
}

interface ChatMessageItemProps {
  message: ChatMessage;
  user?: UserProfile;
  onImageClick?: (imageSrc: string) => void;
  onActionClick?: (actionText: string) => void;
  onRetry?: () => void;
  onBranchChat?: (messageId: string) => void;
  onOpenDrawForMessage?: (imageOrContext?: string) => void;
  onOpenSummarizeForMessage?: (messageText: string) => void;
  onOpenCodeForMessage?: (codeText: string, mode?: string) => void;
  onOpenExplainForMessage?: (topicText: string) => void;
  darkMode?: boolean;
  themeColorHex?: string;
  screenReaderSupport?: boolean;
  showSpeaker?: boolean;
  highContrast?: boolean;
  ttsVoice?: TtsVoiceOptionId;
  onOpenFilePreview?: (file: {
    title: string;
    filename: string;
    content: string;
    contentType?: string;
  }) => void;
  onOpenSourcesDrawer?: (data: {
    title: string;
    sources: any[];
    searchQuery?: string;
  }) => void;
  onOpenCamera?: (mode?: 'select' | 'camera' | 'upload') => void;
  language?: string;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  user,
  onImageClick,
  onActionClick,
  onRetry,
  onBranchChat,
  onOpenDrawForMessage,
  onOpenSummarizeForMessage,
  onOpenCodeForMessage,
  onOpenExplainForMessage,
  darkMode = true,
  themeColorHex = '#2563eb',
  screenReaderSupport = false,
  showSpeaker = true,
  highContrast = false,
  ttsVoice,
  onOpenFilePreview,
  onOpenSourcesDrawer,
  onOpenCamera,
  language = 'English (US)',
}) => {
  const [copied, setCopied] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWordWrap, setIsWordWrap] = useState(true);
  const [customChoiceInput, setCustomChoiceInput] = useState('');
  const [isThreeDotMenuOpen, setIsThreeDotMenuOpen] = useState(false);
  const [isViewSourceOpen, setIsViewSourceOpen] = useState(false);
  const [isArtifactExpanded, setIsArtifactExpanded] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [timeTick, setTimeTick] = useState(() => Date.now());
  const threeDotMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileThreeDotRef = useRef<HTMLDivElement | null>(null);
  const [activeVoiceId, setActiveVoiceId] = useState<TtsVoiceOptionId>(() =>
    ttsVoice || getSavedTtsVoice()
  );
  const [activeResolvedVoiceName, setActiveResolvedVoiceName] = useState<string>('');
  const [voiceUnavailableNotice, setVoiceUnavailableNotice] = useState<string | null>(null);

  const [answerViewMode, setAnswerViewMode] = useState<'standard' | 'visual' | 'steps' | 'table'>('visual');

  const visualPayload = useMemo(() => {
    if (message.role === 'user' || !message.content) return null;
    return parseAdaptiveVisualPayload(message.content);
  }, [message.role, message.content]);

  const hasTableInMessage = useMemo(() => {
    return /\|[\s-:]+\|/.test(message.content);
  }, [message.content]);

  const hasNumberedSteps = useMemo(() => {
    return /\b(?:step\s+\d+|1\.\s+.+\n2\.\s+)/i.test(message.content);
  }, [message.content]);

  const showViewSelector =
    message.role !== 'user' &&
    !message.isStreaming &&
    (visualPayload !== null || hasTableInMessage || hasNumberedSteps);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isThreeDotMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktop = threeDotMenuRef.current && threeDotMenuRef.current.contains(target);
      const inMobile = mobileThreeDotRef.current && mobileThreeDotRef.current.contains(target);
      if (!inDesktop && !inMobile) {
        setIsThreeDotMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isThreeDotMenuOpen]);

  useEffect(() => {
    if (ttsVoice) {
      setActiveVoiceId(ttsVoice);
    }
  }, [ttsVoice]);

  useEffect(() => {
    const handleVoiceUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ voice?: TtsVoiceOptionId; voiceId?: TtsVoiceOptionId }>;
      const nextVoice = customEvent.detail?.voice || customEvent.detail?.voiceId;
      if (nextVoice) {
        setActiveVoiceId(nextVoice);
        setVoiceUnavailableNotice(null);
      } else {
        setActiveVoiceId(getSavedTtsVoice());
      }
    };
    window.addEventListener('sigma-tts-voice-updated', handleVoiceUpdate);
    window.addEventListener('sigma-tts-voice-changed', handleVoiceUpdate);
    return () => {
      window.removeEventListener('sigma-tts-voice-updated', handleVoiceUpdate);
      window.removeEventListener('sigma-tts-voice-changed', handleVoiceUpdate);
    };
  }, []);
  const [feedbackState, setFeedbackState] = useState<'none' | 'choose' | 'up' | 'down'>('none');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showCustomSlideInput, setShowCustomSlideInput] = useState(false);
  const [customSlideCount, setCustomSlideCount] = useState('10');
  const isUser = message.role === 'user';

  // Section 1: Google Studio TTS / PC Narrator Floating Player States
  const [isBufferingAudio, setIsBufferingAudio] = useState(false);
  const [showAudioBar, setShowAudioBar] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElapsed, setAudioElapsed] = useState(0);
  const [audioTotalDuration, setAudioTotalDuration] = useState(10);
  const [waveformHeights, setWaveformHeights] = useState<number[]>([6, 6, 6, 6, 6, 6, 6, 6]);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceChecked, setPracticeChecked] = useState(false);
  const [copiedLinkUrl, setCopiedLinkUrl] = useState<string | null>(null);
  const [selectedEditorApp, setSelectedEditorApp] = useState('CapCut');
  const [selectedEditStyle, setSelectedEditStyle] = useState('Fast-paced & punchy');
  const [editSubmitted, setEditSubmitted] = useState(false);

  const audioTimerRef = useRef<any>(null);
  const bufferTimerRef = useRef<any>(null);
  const waveTimerRef = useRef<any>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const fullSpokenTextRef = useRef<string>('');
  const audioElapsedRef = useRef<number>(0);
  const audioTotalDurationRef = useRef<number>(10);
  const isPlayingAudioRef = useRef<boolean>(false);

  // Stop speech synthesis when message changes, another message starts speaking, or component unmounts
  useEffect(() => {
    const handleOtherPlayerStarted = (e: Event) => {
      const customEv = e as CustomEvent<{ messageId?: string }>;
      if (customEv.detail?.messageId && customEv.detail.messageId !== message.id) {
        if (audioTimerRef.current) clearInterval(audioTimerRef.current);
        if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
        if (waveTimerRef.current) clearInterval(waveTimerRef.current);
        setIsBufferingAudio(false);
        setIsPlayingAudio(false);
        isPlayingAudioRef.current = false;
        setIsSpeaking(false);
        setWaveformHeights([6, 6, 6, 6, 6, 6, 6, 6]);
      }
    };
    window.addEventListener('sigma-tts-player-started', handleOtherPlayerStarted);
    return () => {
      window.removeEventListener('sigma-tts-player-started', handleOtherPlayerStarted);
      clearSpeechKeepAlive();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
      if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
    };
  }, [message.id]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const copyPromptText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // ignore
    }
  };

  // Immediate Firebase Feedback Handler (Section 4)
  const handleFeedbackClick = async (type: 'up' | 'down') => {
    if (feedbackState === type) {
      setFeedbackState('none');
      return;
    }
    setFeedbackState(type);
    setFeedbackSubmitted(false);

    // Push initial rating event to Firestore immediately
    try {
      const fbId = `fb_${message.id}_${type}_${Date.now()}`;
      await submitFeedbackReviewToFirestore({
        id: fbId,
        feedbackType: type === 'up' ? 'thumbs_up' : 'thumbs_down',
        userRating: type === 'up' ? 'positive' : 'negative',
        commentText: feedbackComment || '',
        timestamp: new Date().toISOString(),
        sessionHash: getSessionHash(),
        messageId: message.id,
        userEmail: user?.email || 'Guest User',
        userType: user?.email ? 'authenticated' : 'guest',
        responseSnippet: message.content.slice(0, 240),
      });
    } catch (e) {
      console.warn('Initial feedback rating logged locally:', e);
    }
  };

  // Submit Feedback Commentary to Firebase
  const handleFeedbackCommentSubmit = async () => {
    if (feedbackState === 'none' || feedbackState === 'choose') return;
    setIsSubmittingFeedback(true);
    try {
      const fbId = `fb_${message.id}_${feedbackState}_${Date.now()}`;
      await submitFeedbackReviewToFirestore({
        id: fbId,
        feedbackType: feedbackState === 'up' ? 'thumbs_up' : 'thumbs_down',
        userRating: feedbackState === 'up' ? 'positive' : 'negative',
        commentText: feedbackComment.trim(),
        timestamp: new Date().toISOString(),
        sessionHash: getSessionHash(),
        messageId: message.id,
        userEmail: user?.email || 'Guest User',
        userType: user?.email ? 'authenticated' : 'guest',
        responseSnippet: message.content.slice(0, 240),
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback review to Firebase:', err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Parse structured elements: High-Quality Image Prompt and Interactive Action Buttons (↳ or [Options])
  const {
    displayMarkdown,
    promptCard,
    actionButtons,
    codingReferral,
    presentationData,
    excelData,
    slideCountPromptData,
  } = useMemo(() => {
    const raw = message.content || '';
    if (isUser) {
      return {
        displayMarkdown: raw,
        promptCard: null,
        actionButtons: [],
        codingReferral: null,
        presentationData: null,
        excelData: null,
        slideCountPromptData: null,
      };
    }

    const { promptData: extractedSlideCountPrompt, cleanText: afterSlidePromptText } =
      extractSlideCountPromptFromMessage(raw);
    const { presentation, cleanText: afterPptText } = extractPresentationFromMessage(afterSlidePromptText);
    const { workbook: excelWorkbook, cleanText } = extractExcelFromMessage(afterPptText);
    const lines = cleanText.split('\n');
    const actions: string[] = [];
    const textLines: string[] = [];

    for (const line of lines) {
      if (
        /\[(Add a stronger ending twist|Show I am feeling more clearly|Show Ayaan’s feelings more clearly|Show feelings more clearly|Show feeling more clearly)\]/i.test(
          line
        )
      ) {
        // Feature 12: Strip legacy static story buttons
        continue;
      } else if (line.includes('↳')) {
        // Extract all ↳ dynamic contextual action buttons
        const parts = line.split(/(?=↳)/g).map((p) => p.trim()).filter(Boolean);
        for (const part of parts) {
          if (part.startsWith('↳')) {
            const cleaned = part.replace(/^↳\s*/, '').trim();
            if (
              cleaned &&
              !/add a stronger ending twist/i.test(cleaned) &&
              !/show (i am |ayaan['’]s )?feelings? more clearly/i.test(cleaned) &&
              !actions.includes(cleaned)
            ) {
              actions.push(cleaned);
            }
          }
        }
      } else if (/\[(Sign in with Google)\]/i.test(line)) {
        if (!actions.includes('Sign in with Google')) {
          actions.push('Sign in with Google');
        }
      } else {
        textLines.push(line);
      }
    }

    const filteredText = textLines.join('\n').trim();

    // Check for High-Quality AI Image Prompt card
    // Markers: "Create an ultra-detailed, cinematic" or explicit bracketed prompt structure with Camera/Lighting/Scene
    let promptText: string | null = null;
    let introText = filteredText;

    const promptRegex = /(Create an ultra-detailed[\s\S]+)/i;
    const match = filteredText.match(promptRegex);
    if (match && filteredText.includes('Camera:') && filteredText.includes('Lighting:')) {
      const matchStart = filteredText.indexOf(match[0]);
      introText = filteredText.substring(0, matchStart).trim();
      promptText = match[0].trim();
    }

    // Extract Coding Referral Callout (Section: sigma-codai referral):
    // "I'm not too much good in coding, but the other agent created by my owner sigma-codai.pages.dev can give you code way more better than me."
    // User requirement: "that need to be more bold, highlighted, and big, bigger than all text. If the text is 2x, so that text will be 10x. Also, sigma-codai.pages.dev is a link, clickable link, and it can be clickable."
    let codingReferralText: string | null = null;
    const referralRegex = /(I'm not too much good in coding[\s\S]*?sigma-codai\.pages\.dev[\s\S]*?(?:way more better than me\.?|better than me\.?|better than me|better than me!\s*|$))/i;
    let refMatch = introText.match(referralRegex);
    if (!refMatch && filteredText.match(referralRegex)) {
      refMatch = filteredText.match(referralRegex);
    }

    if (refMatch) {
      codingReferralText = refMatch[0].trim();
      introText = introText.replace(refMatch[0], '').trim();
    } else if (introText.includes('sigma-codai.pages.dev') || filteredText.includes('sigma-codai.pages.dev')) {
      const fallbackRegex = /([^\n]*sigma-codai\.pages\.dev[^\n]*)/i;
      const fbMatch = introText.match(fallbackRegex) || filteredText.match(fallbackRegex);
      if (fbMatch) {
        codingReferralText = fbMatch[0].trim();
        introText = introText.replace(fbMatch[0], '').trim();
      }
    }

    const finalDisplayMarkdown = separateProseFromCodeFence(
      promptText
        ? introText
        : codingReferralText
        ? introText
        : filteredText
    );

    const dynamicActions = extractedSlideCountPrompt
      ? []
      : actions.includes('Sign in with Google')
      ? actions
      : generateContextualFollowUpActions(
          finalDisplayMarkdown || raw,
          actions,
          message.userPrompt || ''
        );

    return {
      displayMarkdown: finalDisplayMarkdown,
      promptCard: promptText,
      actionButtons: dynamicActions,
      codingReferral: codingReferralText,
      presentationData: presentation,
      excelData: excelWorkbook,
      slideCountPromptData: extractedSlideCountPrompt,
    };
  }, [message.content, message.userPrompt, isUser]);

  const artifactInfo = useMemo(
    () =>
      isUser
        ? { isArtifact: false, artifactTitle: '', artifactType: 'Document' as const }
        : classifyResponseArtifact(message.content, displayMarkdown, {
            hasPresentation: Boolean(presentationData),
            presentationTitle: presentationData?.title,
            hasExcel: Boolean(excelData),
            excelTitle: excelData?.title,
            hasPromptCard: Boolean(promptCard),
            fullContent: message.fullContent,
            userPrompt: message.userPrompt,
          }),
    [
      message.content,
      message.fullContent,
      message.userPrompt,
      displayMarkdown,
      presentationData,
      excelData,
      promptCard,
      isUser,
    ]
  );

  const hasCodeInMessage = useMemo(() => {
    const checkStr = message.fullContent || message.content || '';
    return /```[a-zA-Z0-9_-]*\n[\s\S]{15,}/.test(checkStr);
  }, [message.content, message.fullContent]);

  const extractedCodeFromMessage = useMemo(() => {
    const checkStr = displayMarkdown || message.content || '';
    const matches = Array.from(checkStr.matchAll(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g));
    if (matches.length > 0) {
      return matches.map((m) => m[1].trim()).join('\n\n');
    }
    return checkStr;
  }, [displayMarkdown, message.content]);

  const hasVideoEditOptions = useMemo(() => {
    if (isUser) return false;
    const content = (message.content || '').toLowerCase();
    const prompt = (message.userPrompt || '').toLowerCase();
    return (
      (content.includes('video editor') ||
        content.includes('editing app') ||
        content.includes('capcut') ||
        content.includes('premiere pro') ||
        content.includes('davinci') ||
        content.includes('edit style') ||
        content.includes("let's make the edit")) &&
      !content.includes('practice answer:')
    );
  }, [isUser, message.content, message.userPrompt]);

  const markdownComponents = useMemo(
    () => ({
      p({ children }: any) {
        return (
          <p className="my-4 first:mt-0 last:mb-0 leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-200">
            {children}
          </p>
        );
      },
      ul({ children }: any) {
        return <ul className="my-4 space-y-4 list-disc pl-5">{children}</ul>;
      },
      ol({ children }: any) {
        return <ol className="my-4 space-y-4 list-decimal pl-5">{children}</ol>;
      },
      li({ children }: any) {
        return (
          <li className="my-3.5 leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-200">
            {children}
          </li>
        );
      },
      a({ href, children }: any) {
        const isYouTube = href && (href.includes('youtube.com') || href.includes('youtu.be'));
        if (isYouTube) {
          return (
            <div className="my-3.5 not-prose flex items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-red-950/30 via-slate-900/80 to-[#131924] border border-red-500/30 shadow-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-white truncate">
                    {children || 'Watch on YouTube'}
                  </div>
                  <div className="text-[11px] text-red-300/80 truncate font-mono">
                    {href}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(href);
                    setCopiedLinkUrl(href);
                    setTimeout(() => setCopiedLinkUrl(null), 1800);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy YouTube Link"
                >
                  {copiedLinkUrl === href ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>

                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                  title="Open video in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        }

        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors font-medium break-all"
          >
            <span>{children}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        );
      },
      h2({ children }: any) {
        const textStr = String(children || '');
        const isStep = /^(step\s*\d|1\.|2\.|3\.|4\.)/i.test(textStr);
        const isPractice = /bina upar dekhe|practice/i.test(textStr);

        if (isPractice) {
          return (
            <div className="my-4 not-prose p-4 rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-950/30 via-slate-900/90 to-[#121622] shadow-lg">
              <div className="flex items-center gap-2 mb-2 text-blue-300 font-bold text-sm">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Bina upar dekhe bolo:</span>
              </div>
              <p className="text-xs text-slate-300 mb-3">{children}</p>
              <div className="space-y-2">
                <textarea
                  value={practiceInput}
                  onChange={(e) => setPracticeInput(e.target.value)}
                  placeholder="Apna jawab yahan likhein bina upar dekhe..."
                  rows={2}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (practiceInput.trim()) {
                      onActionClick?.(`Practice answer: ${practiceInput.trim()}`);
                      setPracticeChecked(true);
                      setTimeout(() => setPracticeChecked(false), 2000);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {practiceChecked ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Practice Sent!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Meri practice check karo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        }

        if (isStep) {
          return (
            <div className="my-3.5 px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 font-bold text-sm sm:text-base flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{children}</span>
            </div>
          );
        }

        return <h2 className="my-4 font-bold text-base sm:text-lg text-white">{children}</h2>;
      },
      h3({ children }: any) {
        const textStr = String(children || '');
        const isStep = /^(step\s*\d|1\.|2\.|3\.|4\.)/i.test(textStr);
        if (isStep) {
          return (
            <div className="my-3 px-3 py-2 rounded-xl border border-blue-500/30 bg-blue-950/20 text-blue-300 font-semibold text-xs sm:text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>{children}</span>
            </div>
          );
        }
        return <h3 className="my-3 font-semibold text-sm sm:text-base text-slate-100">{children}</h3>;
      },
      blockquote({ children }: any) {
        return (
          <blockquote className="my-3.5 pl-4 py-1.5 border-l-4 border-emerald-500/70 bg-emerald-950/15 rounded-r-xl text-slate-200 text-xs sm:text-sm italic">
            {children}
          </blockquote>
        );
      },
      code({ node, className, children, ...props }: any) {
        const rawCode = String(children ?? '').replace(/\n$/, '');
        const langMatch = /language-([a-zA-Z0-9_-]+)/.exec(className || '');
        const isMultiLineBlock = Boolean(langMatch || rawCode.includes('\n') || rawCode.length > 85);

        if (isMultiLineBlock) {
          return (
            <CodeBlockView
              language={langMatch?.[1] || 'code'}
              code={rawCode}
              themeColorHex={themeColorHex}
              onActionClick={onActionClick}
              onOpenCodeForMessage={onOpenCodeForMessage}
            />
          );
        }

        return (
          <code
            className="px-1.5 py-0.5 rounded-md font-mono text-[0.88em] border"
            style={{
              backgroundColor: `${themeColorHex}16`,
              borderColor: `${themeColorHex}35`,
              color: darkMode ? '#e2e8f0' : '#0f172a',
            }}
            {...props}
          >
            {children}
          </code>
        );
      },
    }),
    [themeColorHex, darkMode, onActionClick]
  );

  const isLibraryWorthy = Boolean(artifactInfo.isArtifact || message.generatedImage);

  const handleSaveArtifactToLibrary = () => {
    const rawTitle =
      artifactInfo.artifactTitle ||
      presentationData?.title ||
      excelData?.title ||
      (displayMarkdown || message.content)
        .replace(/[#*_`]/g, '')
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.length > 3)
        ?.slice(0, 56) ||
      'Saved AI Artifact';
    saveItemToLibrary(user, {
      id: `conv-msg-${message.id}`,
      title: rawTitle,
      contentType: artifactInfo.isArtifact
        ? artifactInfo.artifactType
        : detectLibraryContentType(message.content, rawTitle),
      content: displayMarkdown || message.content,
    });
    setSavedToLibrary(true);
    setTimeout(() => setSavedToLibrary(false), 2200);
  };

  const formatDuration = (sec: number) => {
    const safeSec = Math.max(0, Math.round(sec));
    const m = Math.floor(safeSec / 60);
    const s = Math.floor(safeSec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const stopAllTimersAndSpeech = () => {
    clearSpeechKeepAlive();
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (audioTimerRef.current) {
      clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
    if (bufferTimerRef.current) {
      clearTimeout(bufferTimerRef.current);
      bufferTimerRef.current = null;
    }
    if (waveTimerRef.current) {
      clearInterval(waveTimerRef.current);
      waveTimerRef.current = null;
    }
  };

  const handleStopSpeechOnly = () => {
    stopAllTimersAndSpeech();
    setIsBufferingAudio(false);
    setIsPlayingAudio(false);
    isPlayingAudioRef.current = false;
    setIsSpeaking(false);
    setWaveformHeights([6, 6, 6, 6, 6, 6, 6, 6]);
  };

  const handleCloseAudioBar = () => {
    stopAllTimersAndSpeech();
    setIsBufferingAudio(false);
    setShowAudioBar(false);
    setIsPlayingAudio(false);
    isPlayingAudioRef.current = false;
    setIsSpeaking(false);
    setAudioElapsed(0);
    audioElapsedRef.current = 0;
    setWaveformHeights([6, 6, 6, 6, 6, 6, 6, 6]);
  };

  const startAudioProgressAndWaveform = (initialSec = 0, totalDur = audioTotalDurationRef.current) => {
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    if (waveTimerRef.current) clearInterval(waveTimerRef.current);

    const safeTotal = Math.max(1, totalDur);
    audioElapsedRef.current = Math.max(0, Math.min(safeTotal, initialSec));
    setAudioElapsed(audioElapsedRef.current);

    let lastTick = performance.now();
    audioTimerRef.current = setInterval(() => {
      if (!isPlayingAudioRef.current) return;
      const now = performance.now();
      const deltaSec = (now - lastTick) / 1000;
      lastTick = now;

      const nextSec = Math.min(safeTotal, audioElapsedRef.current + deltaSec);
      audioElapsedRef.current = nextSec;
      setAudioElapsed(nextSec);
    }, 80);

    waveTimerRef.current = setInterval(() => {
      if (!isPlayingAudioRef.current) {
        setWaveformHeights([6, 6, 6, 6, 6, 6, 6, 6]);
        return;
      }
      const ratio = Math.min(1, Math.max(0, audioElapsedRef.current / safeTotal));
      const syncedBars = computeVoiceSynchronizedWaveform(
        fullSpokenTextRef.current,
        ratio,
        audioElapsedRef.current
      );
      setWaveformHeights(syncedBars);
    }, 75);
  };

  const playFromSeconds = (targetSec: number) => {
    if (!window.speechSynthesis) return;

    const cleanText =
      fullSpokenTextRef.current ||
      buildSpokenTextFromMessage(
        displayMarkdown || message.content,
        presentationData?.title,
        presentationData?.slides as any
      );
    if (!cleanText) return;
    fullSpokenTextRef.current = cleanText;

    const currentVoiceOption = getSavedTtsVoice() || activeVoiceId;
    setActiveVoiceId(currentVoiceOption);
    const resolved = resolveSpeechVoice(currentVoiceOption);

    if (!resolved.available) {
      setVoiceUnavailableNotice(
        resolved.unavailableReason ||
          resolved.reason ||
          `The selected ${currentVoiceOption} voice is not available on this device.`
      );
      return;
    }
    setVoiceUnavailableNotice(null);
    setActiveResolvedVoiceName(resolved.voiceName);

    const words = cleanText.split(/\s+/).filter(Boolean).length;
    const wordsPerMin = Math.round(140 * resolved.rate);
    const totalDur =
      audioTotalDurationRef.current > 0
        ? audioTotalDurationRef.current
        : Math.max(3, Math.round((words / wordsPerMin) * 60));
    audioTotalDurationRef.current = totalDur;
    setAudioTotalDuration(totalDur);

    const clampedSec = Math.max(0, Math.min(totalDur, targetSec));
    audioElapsedRef.current = clampedSec;
    setAudioElapsed(clampedSec);

    // Immediately stop any active speech before starting from the new position
    stopAllTimersAndSpeech();

    // If scrubbed right to the very end, mark as finished without speaking
    if (clampedSec >= totalDur - 0.15) {
      audioElapsedRef.current = totalDur;
      setAudioElapsed(totalDur);
      setIsPlayingAudio(false);
      isPlayingAudioRef.current = false;
      setIsSpeaking(false);
      setWaveformHeights([6, 6, 6, 6, 6, 6, 6, 6]);
      return;
    }

    const startRatio = clampedSec / totalDur;
    const slicedText = sliceTextFromProgress(cleanText, startRatio);
    if (!slicedText) {
      setIsPlayingAudio(false);
      isPlayingAudioRef.current = false;
      setIsSpeaking(false);
      setWaveformHeights([6, 6, 6, 6, 6, 6, 6, 6]);
      return;
    }

    window.dispatchEvent(
      new CustomEvent('sigma-tts-player-started', { detail: { messageId: message.id } })
    );

    setShowAudioBar(true);
    setIsPlayingAudio(true);
    isPlayingAudioRef.current = true;
    setIsSpeaking(true);

    startAudioProgressAndWaveform(clampedSec, totalDur);

    speakChunkedWithGuard(slicedText, resolved, {
      onBoundaryProgress: (spokenCharsInRun, totalCharsInRun) => {
        if (!isPlayingAudioRef.current) return;
        const remainingDur = Math.max(0.5, totalDur - clampedSec);
        const runFraction = Math.min(1, Math.max(0, spokenCharsInRun / Math.max(1, totalCharsInRun)));
        const syncedElapsed = Math.min(totalDur, clampedSec + runFraction * remainingDur);
        audioElapsedRef.current = syncedElapsed;
        setAudioElapsed(syncedElapsed);
      },
      onEnd: () => {
        if (audioTimerRef.current) clearInterval(audioTimerRef.current);
        if (waveTimerRef.current) clearInterval(waveTimerRef.current);
        audioElapsedRef.current = totalDur;
        setAudioElapsed(totalDur);
        setIsPlayingAudio(false);
        isPlayingAudioRef.current = false;
        setIsSpeaking(false);
        setWaveformHeights([6, 6, 6, 6, 6, 6, 6, 6]);
      },
      onError: () => {
        handleStopSpeechOnly();
      },
    });
  };

  const handleTogglePlayPause = () => {
    if (!window.speechSynthesis) return;

    if (isPlayingAudioRef.current || isPlayingAudio) {
      // Immediately cancel speech synthesis so Female, Male, and Boy voices stop speaking instantly
      handleStopSpeechOnly();
    } else {
      // If finished or at the end, restart from 00:00; otherwise resume from exact paused second
      const resumeSec =
        audioElapsedRef.current >= audioTotalDurationRef.current - 0.25
          ? 0
          : audioElapsedRef.current;
      playFromSeconds(resumeSec);
    }
  };

  const handleSeekByOffset = (deltaSeconds: number) => {
    const nextSec = Math.max(
      0,
      Math.min(audioTotalDurationRef.current, audioElapsedRef.current + deltaSeconds)
    );
    playFromSeconds(nextSec);
  };

  const handleReplayFromStart = () => {
    playFromSeconds(0);
  };

  const calculateScrubSecondsFromClientX = (clientX: number): number => {
    const bar = progressBarRef.current;
    if (!bar) return audioElapsedRef.current;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    return ratio * audioTotalDurationRef.current;
  };

  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const bar = progressBarRef.current;
    if (!bar) return;

    const wasPlaying = isPlayingAudioRef.current || isPlayingAudio;
    // Halt ongoing speech while dragging so it never gets stuck or overlaps
    stopAllTimersAndSpeech();
    setIsPlayingAudio(false);
    isPlayingAudioRef.current = false;
    setIsSpeaking(false);
    setIsDraggingScrubber(true);

    const updatePosition = (clientX: number) => {
      const targetSec = calculateScrubSecondsFromClientX(clientX);
      audioElapsedRef.current = targetSec;
      setAudioElapsed(targetSec);
      const ratio = Math.min(1, Math.max(0, targetSec / Math.max(1, audioTotalDurationRef.current)));
      setWaveformHeights(
        computeVoiceSynchronizedWaveform(fullSpokenTextRef.current, ratio, targetSec)
      );
    };

    updatePosition(e.clientX);

    const handlePointerMove = (moveEv: PointerEvent) => {
      updatePosition(moveEv.clientX);
    };

    const handlePointerUp = (upEv: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setIsDraggingScrubber(false);
      const finalSec = calculateScrubSecondsFromClientX(upEv.clientX);
      audioElapsedRef.current = finalSec;
      setAudioElapsed(finalSec);
      if (wasPlaying || finalSec < audioTotalDurationRef.current) {
        playFromSeconds(finalSec);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Section 1: Interactive Narrator Trigger with Simulated Studio Loading Buffer
  const triggerStudioNarrator = () => {
    if (!window.speechSynthesis) return;

    if (showAudioBar) {
      handleTogglePlayPause();
      return;
    }

    if (isBufferingAudio) {
      handleCloseAudioBar();
      return;
    }

    // Build clean spoken narration text (including PowerPoint slide summary if present, without raw JSON blocks)
    const cleanText = buildSpokenTextFromMessage(
      displayMarkdown || message.content,
      presentationData?.title,
      presentationData?.slides as any
    );
    if (!cleanText) return;
    fullSpokenTextRef.current = cleanText;

    const currentVoiceOption = getSavedTtsVoice() || activeVoiceId;
    setActiveVoiceId(currentVoiceOption);
    const resolved = resolveSpeechVoice(currentVoiceOption);

    if (!resolved.available) {
      setVoiceUnavailableNotice(
        resolved.unavailableReason ||
          resolved.reason ||
          `The selected ${currentVoiceOption} voice is not available on this device.`
      );
      return;
    }
    setVoiceUnavailableNotice(null);
    setActiveResolvedVoiceName(resolved.voiceName);

    // Estimate accurate duration based on word count and voice speech rate
    const words = cleanText.split(/\s+/).filter(Boolean).length;
    const wordsPerMin = Math.round(140 * resolved.rate);
    const estimatedDuration = Math.max(3, Math.round((words / wordsPerMin) * 60));
    audioTotalDurationRef.current = estimatedDuration;
    setAudioTotalDuration(estimatedDuration);
    audioElapsedRef.current = 0;
    setAudioElapsed(0);

    // Cancel any prior speech across all messages
    stopAllTimersAndSpeech();
    window.dispatchEvent(
      new CustomEvent('sigma-tts-player-started', { detail: { messageId: message.id } })
    );

    // 1. Show Simulated Studio Loading Buffer
    setIsBufferingAudio(true);

    bufferTimerRef.current = setTimeout(() => {
      setIsBufferingAudio(false);
      playFromSeconds(0);
    }, 280);
  };

  const handleDownloadImage = (imgSrc: string) => {
    const link = document.createElement('a');
    link.href = imgSrc;
    link.download = `sigma-ai-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formattedTime = useMemo(
    () => formatMessageTimestamp(message.timestamp, timeTick),
    [message.timestamp, timeTick]
  );

  if (isUser) {
    const rawUserText = message.content || '';
    const lineCount = rawUserText.split('\n').length;
    const charLen = rawUserText.length;

    // Section 12: Adaptive Truncation for Large User Prompts
    const isLongPrompt = charLen >= 240 || lineCount >= 6;
    const collapsedClampClass =
      charLen >= 1200 || lineCount > 18
        ? 'line-clamp-3 max-h-20'
        : charLen >= 550 || lineCount >= 10
        ? 'line-clamp-4 max-h-24'
        : 'line-clamp-5 max-h-32';

    return (
      <div
        id={`chat-message-${message.id}`}
        data-user-message="true"
        className="w-full py-2.5 flex justify-end"
      >
        <div className="flex gap-2.5 sm:gap-3 items-start max-w-[85%] sm:max-w-[78%] flex-row justify-end">
          {/* User Message Bubble */}
          <div className="space-y-1 flex flex-col items-end min-w-0">
            {/* Attached Videos preview */}
            {message.videos && message.videos.length > 0 && (
              <div className="flex flex-col gap-2 items-end mb-2 max-w-sm w-full">
                {message.videos.map((vid, idx) => (
                  <div
                    key={idx}
                    className="w-full rounded-2xl overflow-hidden border border-purple-500/40 bg-[#121622] p-3 shadow-lg space-y-2.5 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {vid.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                            {vid.durationFormatted && <span>{vid.durationFormatted}</span>}
                            {vid.size && <span>• {vid.size}</span>}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0">
                        Video Analyzed
                      </span>
                    </div>

                    {vid.dataUrl ? (
                      <div className="rounded-xl overflow-hidden bg-black/70 max-h-52 flex items-center justify-center border border-white/10">
                        <video
                          src={vid.dataUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-52 object-contain rounded-xl"
                        />
                      </div>
                    ) : vid.thumbnail ? (
                      <div className="relative rounded-xl overflow-hidden bg-black/70 max-h-44 border border-white/10">
                        <img
                          src={vid.thumbnail}
                          alt={vid.name}
                          className="w-full h-36 object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg">
                            <Video className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {vid.keyframes && vid.keyframes.length > 0 && (
                      <div className="pt-1.5 border-t border-white/10">
                        <div className="text-[10px] text-purple-300 font-medium mb-1 flex items-center justify-between">
                          <span>Timeline Keyframes ({vid.keyframes.length} frames)</span>
                          <span className="text-[9px] text-slate-400 font-mono">Second-by-second</span>
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                          {vid.keyframes.map((kf, kfIdx) => (
                            <div key={kfIdx} className="flex-shrink-0 relative rounded-lg overflow-hidden border border-purple-500/20 shadow-xs">
                              <img src={kf.dataUrl} alt={`Frame ${kf.timestamp}`} className="w-14 h-9 object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-purple-200 text-center font-mono py-0.2">
                                {kf.timestamp}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Attached Images preview */}
            {message.images && message.images.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end mb-1">
                {message.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onImageClick?.(img)}
                    className="group relative rounded-xl overflow-hidden border border-white/20 hover:border-white/70 transition-all cursor-pointer shadow-md bg-black/40"
                    title="Click to view / edit in Sigma Image Editor"
                  >
                    <img
                      src={img}
                      alt={`Attached image ${idx + 1}`}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <PenTool className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {message.content && (
              <div
                className="text-white px-4 sm:px-5 py-3 rounded-2xl rounded-tr-xs leading-relaxed text-sm sm:text-base shadow-md select-text transition-all duration-200 max-w-full overflow-hidden"
                style={{ backgroundColor: themeColorHex }}
              >
                <div
                  className={`whitespace-pre-wrap break-words [overflow-wrap:anywhere] transition-all duration-200 ${
                    isLongPrompt && !isPromptExpanded ? `${collapsedClampClass} overflow-hidden` : ''
                  }`}
                >
                  {message.content}
                </div>

                {isLongPrompt && (
                  <button
                    type="button"
                    id={`toggle-user-prompt-${message.id}`}
                    onClick={() => setIsPromptExpanded((prev) => !prev)}
                    className="mt-2 pt-1.5 border-t border-white/25 w-full flex items-center justify-end gap-1 text-xs font-bold text-white/95 hover:text-white transition-colors cursor-pointer"
                  >
                    {isPromptExpanded ? (
                      <>
                        <span>Show less</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Show more</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            <span className="text-[10px] text-slate-500 uppercase tracking-wider px-1 font-mono">
              {formattedTime}
            </span>
          </div>

          {/* User Avatar - positioned on the right */}
          <div
            id={`user-avatar-${message.id}`}
            data-user-avatar="true"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs sm:text-sm font-bold text-white overflow-hidden shadow-sm"
            style={{ backgroundColor: themeColorHex }}
            title={user?.isLoggedIn ? (user.name || user.email || 'User') : 'Guest User'}
          >
            {user?.isLoggedIn && user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : user?.isLoggedIn ? (
              <span>{(user.email ? user.email.charAt(0) : user.name?.charAt(0) || 'U').toUpperCase()}</span>
            ) : (
              <span className="font-bold tracking-tight">G</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Model / AI Response - positioned on the LEFT
  return (
    <div
      id={`chat-message-${message.id}`}
      className="w-full py-2.5 flex justify-start"
    >
      <div
        className={`flex gap-2 sm:gap-3 items-start ${
          presentationData || excelData
            ? 'w-full max-w-full md:max-w-[85%]'
            : 'max-w-[92%] sm:max-w-[85%]'
        }`}
      >
        {/* Model Avatar (Gojo Logo) - Left side */}
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black flex-shrink-0 overflow-hidden flex items-center justify-center shadow-xs transition-all duration-200"
          style={{
            border: message.isStreaming
              ? `1.5px solid ${themeColorHex}`
              : `1.5px solid ${themeColorHex}66`,
            boxShadow: message.isStreaming ? `0 0 16px ${themeColorHex}66` : undefined,
          }}
        >
          <img
            src="/sigma_logo.jpg"
            alt="Sigma AI"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Model Bubble & Sources */}
        <div
          className="space-y-2.5 flex-1 min-w-0"
          role={screenReaderSupport ? 'region' : undefined}
          aria-label={screenReaderSupport ? 'Sigma AI Response' : undefined}
          aria-live={screenReaderSupport ? 'polite' : undefined}
        >
          {/* Generated Image Showcase (Nano Banana 2 / Gemini Image) */}
          {message.generatedImage && (
            <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-black/50 p-2 sm:p-3 shadow-lg space-y-2.5 max-w-md">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: themeColorHex }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Generated Artwork</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(message.generatedImage!)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    title="Download Image"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onImageClick?.(message.generatedImage!)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    title="Open in Draw / Image Editor"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Edit</span>
                  </button>
                </div>
              </div>

              <div className="relative group rounded-xl overflow-hidden cursor-pointer" onClick={() => onImageClick?.(message.generatedImage!)}>
                <img
                  src={message.generatedImage}
                  alt="Generated AI artwork"
                  className="w-full h-auto max-h-96 object-contain rounded-xl group-hover:scale-[1.02] transition-transform duration-200"
                />
              </div>
            </div>
          )}

          {message.notice === 'stopped' || message.content.trim() === 'Response stopped...' ? (
            <div className="w-full bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-2xl text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="font-semibold text-amber-300">Response stopped...</span>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Retry generating response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          ) : message.isError ? (
            <div className="w-full bg-red-950/40 border border-red-900/60 px-5 py-3.5 rounded-2xl rounded-tl-xs text-red-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <div>{message.content}</div>
            </div>
          ) : (
            <div
              className={`group/msg w-full relative ${
                presentationData || excelData
                  ? 'px-3 md:px-6 py-3 md:py-4 rounded-2xl border'
                  : artifactInfo.isArtifact
                  ? 'rounded-2xl border overflow-hidden shadow-md'
                  : 'px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl rounded-tl-xs'
              } leading-relaxed text-sm sm:text-base text-left break-words [overflow-wrap:anywhere] ${
                highContrast
                  ? 'bg-black border border-white/60 text-white font-bold tracking-wide shadow-md'
                  : artifactInfo.isArtifact || presentationData || excelData
                  ? darkMode
                    ? 'bg-[#131924] border-slate-800 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                  : darkMode
                  ? 'bg-transparent text-slate-200'
                  : 'bg-transparent text-slate-800'
              }`}
            >
              {/* Feature 14 & 15: Artifact Container Header Bar with Title, Hover/Focus Add to Library, Copy, and Expand/Open */}
              {artifactInfo.isArtifact && !presentationData && !excelData && (
                <div
                  className={`flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 border-b not-prose ${
                    darkMode
                      ? 'bg-slate-900/85 border-slate-800 text-slate-200'
                      : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: themeColorHex }}
                    />
                    <span className="text-xs font-semibold truncate">
                      {artifactInfo.artifactTitle}
                    </span>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
                      · {artifactInfo.artifactType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Add to Library button — emphasized on hover/focus near the response title */}
                    <button
                      type="button"
                      onClick={handleSaveArtifactToLibrary}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white opacity-90 group-hover/msg:opacity-100 focus:opacity-100 border border-slate-700/70"
                      title="Add to Library"
                    >
                      {savedToLibrary ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Saved to Library</span>
                        </>
                      ) : (
                        <>
                          <Library className="w-3.5 h-3.5" style={{ color: themeColorHex }} />
                          <span>Add to Library</span>
                        </>
                      )}
                    </button>

                    {/* Copy Artifact */}
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/70"
                      title="Copy artifact"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Expand / Open Artifact */}
                    <button
                      type="button"
                      onClick={() => setIsArtifactExpanded((prev) => !prev)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/70"
                      title={isArtifactExpanded ? 'Collapse view' : 'Expand / Open artifact'}
                    >
                      {isArtifactExpanded ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div
                className={
                  artifactInfo.isArtifact && !presentationData && !excelData
                    ? isArtifactExpanded
                      ? 'px-5 sm:px-7 py-4 sm:py-6 max-h-none'
                      : 'px-5 sm:px-6 py-3.5 sm:py-4'
                    : ''
                }
              >
              {/* Active Mode Badge for Deep Search / Deep Think / Web Search */}
              {(message.specialMode === 'deep_search' ||
                message.specialMode === 'deep_think' ||
                message.specialMode === 'web_search') && (
                <div className="mb-3 pb-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 not-prose">
                  {message.specialMode === 'deep_search' && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/35 text-indigo-300 text-[11px] font-bold tracking-wide">
                      <Search className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Deep Search Research</span>
                      <span className="text-indigo-400/70">•</span>
                      <span className="text-[10px] font-normal text-indigo-200/90">
                        Multi-Source Verified
                      </span>
                    </div>
                  )}
                  {message.specialMode === 'deep_think' && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/35 text-fuchsia-300 text-[11px] font-bold tracking-wide">
                      <Brain className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>Deep Think Analysis</span>
                      <span className="text-fuchsia-400/70">•</span>
                      <span className="text-[10px] font-normal text-fuchsia-200/90">
                        Structured Step-by-Step Reasoning
                      </span>
                    </div>
                  )}
                  {message.specialMode === 'web_search' && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/35 text-sky-300 text-[11px] font-bold tracking-wide">
                      <Globe className="w-3.5 h-3.5 text-sky-400" />
                      <span>Live Web Search</span>
                    </div>
                  )}
                </div>
              )}

              {/* Fixed-Height Content Panel Header for Essays, Stories, Articles, Summaries, Prompts, and Code */}
              {!isUser && (artifactInfo.isArtifact || hasCodeInMessage) && displayMarkdown.length > 250 && (
                <div className="not-prose mb-3 p-3 rounded-xl bg-[#0c1018] border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      {artifactInfo.artifactType === 'Code' ? (
                        <Code2 className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate">
                        {artifactInfo.artifactTitle || artifactInfo.artifactType}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {artifactInfo.artifactType} • {displayMarkdown.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsWordWrap((prev) => !prev)}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                        isWordWrap
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="Toggle Word Wrap"
                    >
                      <span>{isWordWrap ? 'Wrap ON' : 'Wrap OFF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const filename = `${(artifactInfo.artifactTitle || artifactInfo.artifactType || 'document')
                          .toLowerCase()
                          .replace(/[^a-z0-9-_]+/g, '-')
                          .slice(0, 32)}.${artifactInfo.artifactType === 'Code' ? 'js' : artifactInfo.artifactType === 'Prompt' ? 'txt' : 'md'}`;
                        onOpenFilePreview?.({
                          title: artifactInfo.artifactTitle || artifactInfo.artifactType,
                          filename,
                          content: displayMarkdown,
                          contentType: artifactInfo.artifactType,
                        });
                      }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer flex items-center gap-1"
                      title="Open in Right Side Preview Drawer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Preview File</span>
                    </button>
                  </div>
                </div>
              )}

              <div
                className={`prose max-w-none text-left prose-p:my-4 prose-p:leading-relaxed prose-headings:mt-5 prose-headings:mb-3 prose-headings:font-bold prose-pre:rounded-xl prose-pre:p-4 prose-ul:my-4 prose-li:my-3.5 break-words [overflow-wrap:anywhere] ${
                  !isUser && (artifactInfo.isArtifact || hasCodeInMessage) && displayMarkdown.length > 250
                    ? 'max-h-[380px] overflow-y-auto pr-2 custom-scrollbar ' + (isWordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto')
                    : ''
                } ${
                  highContrast
                    ? 'prose-invert text-white font-bold prose-pre:bg-black prose-pre:border-white prose-pre:text-white prose-code:text-yellow-300 prose-a:text-cyan-300'
                    : darkMode
                    ? 'prose-invert text-slate-200 prose-pre:bg-[#0b0f17] prose-pre:border prose-pre:border-slate-800 prose-pre:text-slate-100 prose-code:text-emerald-300 prose-code:bg-slate-800/80 prose-a:text-blue-400'
                    : 'text-slate-800 prose-pre:bg-slate-100 prose-pre:border prose-pre:border-slate-300 prose-pre:text-slate-900 prose-code:text-emerald-700 prose-code:bg-slate-100 prose-a:text-blue-600'
                }`}
              >
                {displayMarkdown &&
                  splitMarkdownAndTables(displayMarkdown).map((seg, idx) =>
                    seg.type === 'table' && seg.headers ? (
                      <div
                        key={`tbl-${idx}`}
                        className="not-prose my-4 overflow-x-auto rounded-xl border border-slate-700/80 shadow-sm"
                      >
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr
                              className={
                                darkMode
                                  ? 'bg-slate-800/90 text-slate-100 border-b border-slate-700'
                                  : 'bg-slate-100 text-slate-900 border-b border-slate-300'
                              }
                            >
                              {seg.headers.map((h, hIdx) => (
                                <th key={hIdx} className="px-3.5 py-2.5 font-bold">
                                  <Markdown>{h}</Markdown>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {(seg.rows || []).map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className={
                                  darkMode
                                    ? rIdx % 2 === 0
                                      ? 'bg-slate-900/40'
                                      : 'bg-slate-900/70'
                                    : rIdx % 2 === 0
                                    ? 'bg-white'
                                    : 'bg-slate-50'
                                }
                              >
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-3.5 py-2 align-top">
                                    <Markdown>{cell}</Markdown>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Markdown key={`md-${idx}`} components={markdownComponents}>
                        {seg.content}
                      </Markdown>
                    )
                  )}

                {/* Real Downloadable File Card with extension */}
                {!isUser && (artifactInfo.isArtifact || hasCodeInMessage) && displayMarkdown.length > 250 && (
                  <div
                    onClick={() => {
                      const filename = `${(artifactInfo.artifactTitle || artifactInfo.artifactType || 'document')
                        .toLowerCase()
                        .replace(/[^a-z0-9-_]+/g, '-')
                        .slice(0, 32)}.${artifactInfo.artifactType === 'Code' ? 'js' : artifactInfo.artifactType === 'Prompt' ? 'txt' : 'md'}`;
                      onOpenFilePreview?.({
                        title: artifactInfo.artifactTitle || artifactInfo.artifactType,
                        filename,
                        content: displayMarkdown,
                        contentType: artifactInfo.artifactType,
                      });
                    }}
                    className="not-prose mt-3.5 p-3 rounded-xl bg-[#090d15] hover:bg-[#0e1422] border border-blue-500/30 hover:border-blue-500/60 shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform flex-shrink-0">
                        {artifactInfo.artifactType === 'Code' ? <Code2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors block truncate font-mono">
                          {`${(artifactInfo.artifactTitle || artifactInfo.artifactType || 'document').toLowerCase().replace(/[^a-z0-9-_]+/g, '-').slice(0, 28)}.${artifactInfo.artifactType === 'Code' ? 'js' : artifactInfo.artifactType === 'Prompt' ? 'txt' : 'md'}`}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {`${(displayMarkdown.length / 1024).toFixed(1)} KB`} • Click to preview in Right Side Drawer & download
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold group-hover:text-blue-300 flex-shrink-0">
                      <span>Preview File</span>
                      <Download className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}

                {/* Interactive Video Edit Selection Card (Screenshot 6) */}
                {hasVideoEditOptions && (
                  <div className="my-4 not-prose p-4 rounded-2xl border border-purple-500/35 bg-gradient-to-br from-purple-950/25 via-slate-900/90 to-[#121622] shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <Video className="w-4 h-4 text-purple-400" />
                        <span>Choose Your Video Edit Configuration</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Interactive Setup
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Editing App */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                          Editing App
                        </label>
                        <div className="space-y-1.5">
                          {['CapCut', 'Adobe Premiere Pro', 'DaVinci Resolve', 'VN Video Editor'].map((app) => (
                            <label
                              key={app}
                              className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                selectedEditorApp === app
                                  ? 'bg-purple-600/20 border-purple-500/60 text-white font-medium shadow-xs'
                                  : 'bg-slate-950/50 border-white/5 text-slate-300 hover:border-white/15'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`editor-app-${message.id}`}
                                value={app}
                                checked={selectedEditorApp === app}
                                onChange={() => setSelectedEditorApp(app)}
                                className="accent-purple-500"
                              />
                              <span>{app}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Edit Style */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                          Edit Style
                        </label>
                        <div className="space-y-1.5">
                          {['Fast-paced & punchy', 'Cinematic & clean', 'Aesthetic vlog vibe', 'Minimalist text focus'].map((style) => (
                            <label
                              key={style}
                              className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                selectedEditStyle === style
                                  ? 'bg-purple-600/20 border-purple-500/60 text-white font-medium shadow-xs'
                                  : 'bg-slate-950/50 border-white/5 text-slate-300 hover:border-white/15'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`edit-style-${message.id}`}
                                value={style}
                                checked={selectedEditStyle === style}
                                onChange={() => setSelectedEditStyle(style)}
                                className="accent-purple-500"
                              />
                              <span>{style}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditSubmitted(true);
                        onActionClick?.(`Let's make the edit in ${selectedEditorApp} with ${selectedEditStyle} style 🔥`);
                        setTimeout(() => setEditSubmitted(false), 2000);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98"
                    >
                      {editSubmitted ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Edit Prompt Sent!</span>
                        </>
                      ) : (
                        <>
                          <span>Let's make the edit 🔥</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Active Moving Glowing Cursor & Response Animation while text reveals line by line */}
                {message.isStreaming && (
                  <span
                    className="inline-flex items-center gap-2 ml-1.5 align-middle not-prose"
                    aria-hidden="true"
                  >
                    <span
                      className="inline-block w-2 h-4 rounded-xs animate-pulse"
                      style={{
                        backgroundColor: themeColorHex,
                        boxShadow: `0 0 10px ${themeColorHex}`,
                      }}
                    />
                    <HolographicCoreLoader size={22} color={themeColorHex} />
                  </span>
                )}

                {/* PowerPoint Presentation Result Card */}
                {presentationData && (
                  <div className="not-prose mt-3">
                    <PresentationResultCard presentation={presentationData} />
                  </div>
                )}

                {/* Excel Workbook Result Card */}
                {excelData && (
                  <div className="not-prose mt-3">
                    <ExcelResultCard
                      workbook={excelData}
                      onRequestModification={(instruction) => onActionClick?.(instruction)}
                    />
                  </div>
                )}

                {/* Interactive Slide Count Quick-Choice Selector (Rule 2) */}
                {slideCountPromptData && (
                  <div className="not-prose mt-3.5 p-3.5 sm:p-4 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/25 via-slate-900/90 to-slate-950/90 shadow-lg">
                    <div className="flex items-center gap-2 mb-2.5">
                      <PowerPointIcon className="w-4 h-4 text-orange-400 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-300">
                        Select Slide Count • {slideCountPromptData.topic}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {[1, 3, 5, 8, 10, 15].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => onActionClick?.(`${count} slide${count === 1 ? '' : 's'}`)}
                          className="px-3.5 py-2 rounded-xl border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/25 hover:border-orange-400 text-orange-200 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                        >
                          {count} slide{count === 1 ? '' : 's'}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowCustomSlideInput((prev) => !prev)}
                        className={`px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                          showCustomSlideInput
                            ? 'border-orange-400 bg-orange-500/30 text-white'
                            : 'border-slate-700 bg-slate-800/80 hover:border-orange-500/40 text-slate-300 hover:text-white'
                        }`}
                      >
                        Custom
                      </button>
                    </div>

                    {showCustomSlideInput && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                        <label className="text-xs text-slate-300 font-medium">
                          Custom number of slides (1–25):
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={25}
                          value={customSlideCount}
                          onChange={(e) => setCustomSlideCount(e.target.value)}
                          className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-orange-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = parseInt(customSlideCount, 10);
                            const num = Math.max(1, Math.min(25, isNaN(parsed) ? 10 : parsed));
                            onActionClick?.(`${num} slide${num === 1 ? '' : 's'}`);
                            setShowCustomSlideInput(false);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
                        >
                          Create {Math.max(1, Math.min(25, parseInt(customSlideCount, 10) || 10))} Slide{parseInt(customSlideCount, 10) === 1 ? '' : 's'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Ultra-Bold, Highlighted, Giant (10x prominence) Coding Referral Banner styled with themeColorHex */}
                {codingReferral && (
                  <div
                    id={`coding-referral-banner-${message.id}`}
                    className="mt-6 mb-3 p-5 sm:p-7 rounded-3xl border-3 sm:border-4 shadow-2xl not-prose relative overflow-hidden transition-all"
                    style={{
                      borderColor: themeColorHex,
                      background: `linear-gradient(135deg, ${themeColorHex}30, ${themeColorHex}15, rgba(15, 23, 42, 0.95))`,
                      boxShadow: `0 0 45px ${themeColorHex}45, inset 0 0 24px ${themeColorHex}20`,
                    }}
                  >
                    <div
                      className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40"
                      style={{ backgroundColor: themeColorHex }}
                    />

                    <div className="relative z-10 flex flex-col gap-4 text-left">
                      <div
                        className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase w-fit shadow-md text-white"
                        style={{ backgroundColor: themeColorHex }}
                      >
                        <span>⚡ OFFICIAL CODING SPECIALIST</span>
                      </div>

                      {/* Giant, Extra Bold, Highlighted Typography (10x prominent feel) */}
                      <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug drop-shadow-md">
                        I'm not too much good in coding, but the other agent created by my owner{' '}
                        <a
                          href="https://sigma-codai.pages.dev"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: `${themeColorHex}50`,
                            borderColor: themeColorHex,
                          }}
                          className="underline decoration-4 sm:decoration-[6px] underline-offset-4 text-white hover:brightness-125 px-2.5 py-1 rounded-2xl inline-flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 border"
                        >
                          <span>sigma-codai.pages.dev</span>
                          <ExternalLink className="w-5 h-5 sm:w-7 sm:h-7 text-white inline-block" />
                        </a>{' '}
                        can give you code way more better than me.
                      </p>

                      {/* Clickable Button to open sigma-codai.pages.dev */}
                      <div className="pt-2">
                        <a
                          href="https://sigma-codai.pages.dev"
                          target="_blank"
                          rel="noopener noreferrer"
                          id={`btn-open-codai-${message.id}`}
                          style={{
                            background: `linear-gradient(135deg, ${themeColorHex}, ${themeColorHex}dd)`,
                            boxShadow: `0 8px 25px ${themeColorHex}50`,
                            color: '#ffffff',
                          }}
                          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm sm:text-base tracking-wide shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <span className="text-lg">🚀</span>
                          <span>Open sigma-codai.pages.dev</span>
                          <ExternalLink className="w-4 h-4 text-white" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* High-Quality AI Image Prompt Card (Section 5.4 / Screenshot 4) */}
                {promptCard && (
                  <div className="mt-4 rounded-2xl border border-slate-700/80 bg-[#0d121c] overflow-hidden shadow-xl not-prose">
                    <div className="px-4 py-3 bg-slate-800/70 border-b border-slate-700/70 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
                        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>High-Quality AI Image Prompt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyPromptText(promptCard)}
                          className="text-xs text-slate-200 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600/90 border border-slate-600/60 transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Copy image prompt to clipboard"
                        >
                          {copiedPrompt ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-300" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 text-xs sm:text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap select-text bg-[#090d15]/80 overflow-x-auto">
                      {promptCard}
                    </div>
                  </div>
                )}

                {/* Interactive Action Buttons (↳ ...) - Section 5.3 / Screenshot 1 */}
                {/* Centered 3-Dot Indicator ONLY when writing Library Material (Essay, Story, Article, Prompt, Code, Document, Summary) */}
                {message.isStreaming && artifactInfo.isArtifact && (
                  <div
                    id={`streaming-dots-${message.id}`}
                    className="w-full flex justify-center py-2.5 not-prose"
                  >
                    <div
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-md"
                      style={{
                        backgroundColor: `${themeColorHex}18`,
                        borderColor: `${themeColorHex}55`,
                      }}
                    >
                      {[0, 1, 2].map((dIdx) => (
                        <span
                          key={dIdx}
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{
                            backgroundColor: themeColorHex,
                            boxShadow: `0 0 6px ${themeColorHex}`,
                            animationDelay: `${dIdx * 140}ms`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Graceful Error Recovery Action Banner (Features 47, 48, 49) */}
                {message.isError && (
                  <div
                    id={`error-recovery-banner-${message.id}`}
                    className="mt-3 p-3 rounded-xl bg-amber-950/35 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2.5 not-prose"
                  >
                    <div className="flex items-center gap-2 text-xs text-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {message.errorType === 'network'
                          ? 'Network Interrupted'
                          : message.errorType === 'timeout'
                          ? 'Request Timeout'
                          : 'Service Notice'}
                      </span>
                      <span className="text-slate-300 text-[11px]">
                        Your conversation history is preserved.
                      </span>
                    </div>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
                        style={{
                          backgroundColor: themeColorHex,
                          boxShadow: `0 0 12px ${themeColorHex}45`,
                        }}
                      >
                        <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Retry Now</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Contextual Follow-Up Action Buttons & Clarification Choices */}
                {!message.isStreaming &&
                  !slideCountPromptData &&
                  actionButtons.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5 not-prose">
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {actionButtons.map((action, idx) => (
                        <button
                          key={idx}
                          id={`story-action-btn-${message.id}-${idx}`}
                          type="button"
                          onClick={() => onActionClick?.(action)}
                          style={{
                            borderColor: `${themeColorHex}66`,
                            backgroundColor: `${themeColorHex}14`,
                            boxShadow: `0 4px 14px ${themeColorHex}18`,
                          }}
                          className="px-3.5 py-2 rounded-2xl border text-slate-100 hover:text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all cursor-pointer active:scale-95 hover:brightness-125 group"
                          title={`Click to trigger: ${action}`}
                        >
                          <span
                            className="font-bold text-sm group-hover:translate-x-0.5 transition-transform"
                            style={{ color: themeColorHex }}
                          >
                            ↳
                          </span>
                          <span className="font-mono text-xs sm:text-sm">{action}</span>
                        </button>
                      ))}
                    </div>

                    {/* Inline 'Write your own answer' custom choice input */}
                    <div className="flex items-center gap-2 pt-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Write your own answer or question..."
                        value={customChoiceInput}
                        onChange={(e) => setCustomChoiceInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customChoiceInput.trim()) {
                            onActionClick?.(customChoiceInput.trim());
                            setCustomChoiceInput('');
                          }
                        }}
                        className="flex-1 bg-[#0c1018] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customChoiceInput.trim()) {
                            onActionClick?.(customChoiceInput.trim());
                            setCustomChoiceInput('');
                          }
                        }}
                        disabled={!customChoiceInput.trim()}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}

                {/* Sigma AI Studio Card */}
                {message.content.includes('gemini.google.com') && (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-purple-950/40 border border-blue-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/10 p-1.5 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-md">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#gemini-sparkle-grad)" />
                          <defs>
                            <linearGradient id="gemini-sparkle-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#4285F4" />
                              <stop offset="0.5" stopColor="#9B72CB" />
                              <stop offset="1" stopColor="#D96570" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>Sigma AI</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Studio
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Click to open image generator and create this 8K masterpiece prompt
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://gemini.google.com/app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap self-stretch sm:self-auto justify-center"
                    >
                      <span>Open in Gemini</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Smart Contextual Camera & Homework Upload Suggestion */}
                {onOpenCamera && (message.action === 'open_camera_options' || /open_camera_options|\/camera\b|take a picture|upload.*homework|upload.*notes|solve this math/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 flex-shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {getTranslation(language, 'cameraModalTitle')}
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          {getTranslation(language, 'solveThisQuestion')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenCamera('camera')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{getTranslation(language, 'openCamera')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenCamera('upload')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{getTranslation(language, 'uploadFileOrPhoto')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 1. Friends & Social Chat Checker (/chatcheck) Inline Interactive Card */}
                {onActionClick && (message.content.includes('/chatcheck') || /Friends & Social Chat Checker|chat analyzer|paste the conversation snippet with your friend/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-900 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-lg flex-shrink-0">
                        💬
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Friends & Social Chat Checker
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Understand conversations with friends, group dynamics & healthy responses
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onActionClick('/chatcheck Here is our conversation snippet: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        <span>📋 Paste Chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/chatcheck Analyze the emotional tone, subtext, and communication patterns of this conversation: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>🔍 Tone & Dynamics</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/chatcheck What is the best, most thoughtful and high-value next message I should send in reply?')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 active:scale-95 border border-teal-700 text-teal-100 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>💡 Suggest Reply</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Maths & Step-by-Step Solver (/maths, /solve) Inline Interactive Card */}
                {onActionClick && (/^\/maths|\/solve\b|Maths & Calculation|Step-by-step calculus/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-blue-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 text-lg flex-shrink-0">
                        📐
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Maths & Problem Solver
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Step-by-step calculus, trigonometry, algebra derivations & proofs
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      {onOpenCamera && (
                        <button
                          type="button"
                          onClick={() => onOpenCamera('camera')}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Photo Problem</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onActionClick('/maths Solve: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>🧮 Type Equation</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/maths Show syllabus formula and step-by-step derivation for: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 active:scale-95 border border-indigo-700 text-indigo-100 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>📑 Formula Sheet</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Past Papers & Cambridge Solver (/pastpapers) Inline Interactive Card */}
                {onActionClick && (/^\/pastpapers|\/exam\b|Past Paper & Question Solution|Marking Scheme/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-orange-950/40 to-slate-900 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg flex-shrink-0">
                        📚
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Past Paper & Marking Scheme Engine
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Cambridge 9709, 9702, 0580 with official [M1], [A1], [B1] marks
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onActionClick('/pastpapers Solve Cambridge 9709 with full Mark Scheme method marks: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/30 cursor-pointer"
                      >
                        <span>📝 Solve 9709 / 9702</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/pastpapers What are the official marking scheme criteria and threshold standards for this question?')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>🎯 Mark Scheme [MS]</span>
                      </button>
                      {onOpenCamera && (
                        <button
                          type="button"
                          onClick={() => onOpenCamera('upload')}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-900/60 hover:bg-orange-800 active:scale-95 border border-orange-700 text-orange-100 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Paper</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. YouTube Thumbnail & Clickbait Architect (/thumbnail) Inline Interactive Card */}
                {onActionClick && (/^\/thumbnail\b|YouTube.*thumbnail|Visual Hook Architect/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-rose-950/40 to-slate-900 border border-red-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-300 text-lg flex-shrink-0">
                        🖼️
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          YouTube 16:9 Thumbnail Architect
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          High-CTR visual concepts, 3-word bold text overlays & AI prompt
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onActionClick('/thumbnail Create 3 viral 16:9 thumbnail concepts for my video: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer"
                      >
                        <span>🎬 3 Concepts (16:9)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/thumbnail Give 5 high-CTR title hooks with emotional curiosity for: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>🔥 5 Viral Hooks</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/thumbnail Give ready-to-use AI image generation prompt for: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 active:scale-95 border border-rose-700 text-rose-100 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>🎨 Image Prompt</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. ATS Resume Builder (/cv, /resume) Inline Interactive Card */}
                {onActionClick && (/^\/cv|\/resume\b|ATS Resume|Job-Winning Tailored Cover Letter/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-sky-950/40 to-slate-900 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-lg flex-shrink-0">
                        📄
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          ATS Resume & Career Architect
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Single-column ATS format, action verbs & quantified metric bullets
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onActionClick('/cv Build an ATS-compliant resume section for: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
                      >
                        <span>📑 Build Resume</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/cv Rewrite my experience with high-impact action verbs and quantified results: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>🚀 Boost Bullets</span>
                      </button>
                      {onOpenCamera && (
                        <button
                          type="button"
                          onClick={() => onOpenCamera('upload')}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-900/60 hover:bg-sky-800 active:scale-95 border border-sky-700 text-sky-100 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload CV</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Voice Studio & Audio Synthesis (/voice) Inline Interactive Card */}
                {onActionClick && (/^\/voice\b|Voice Studio|Voice Synthesis|audio studio/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-purple-950/40 to-slate-900 border border-violet-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 text-lg flex-shrink-0">
                        🎙️
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Voice Studio & Audio Synthesis
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Ultra-low latency speech, studio vocal presets & multilingual narrator
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onActionClick('/voice Generate an ultra-realistic voice prompt script for: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/30 cursor-pointer"
                      >
                        <span>🎤 Voice Script</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/voice Explain acoustic parameters, pitch modulation and RMS waveform for: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>🔊 Acoustic Tuning</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. WhatsApp Ghost Writer (/ghost) Inline Interactive Card */}
                {onActionClick && (/^\/ghost\b|WhatsApp Ghost Writer|Ghost Writer Replies|dry reply/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-slate-900 border border-pink-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300 text-lg flex-shrink-0">
                        👻
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          WhatsApp Ghost Writer
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Savage comebacks, mysterious excuses & calculated dry replies
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onActionClick('/ghost Give me a savage witty reply to this message: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-pink-600/30 cursor-pointer"
                      >
                        <span>🔥 Savage Reply</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/ghost Give me a polite but firm excuse to cancel plans: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>🚪 Polite Excuse</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/ghost Give me a cold, mysterious dry reply to: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 active:scale-95 border border-purple-700 text-purple-100 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>❄️ Dry ("K")</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 8. Meme Caption Maker (/meme) Inline Interactive Card */}
                {onActionClick && (/^\/meme\b|Meme Caption Maker|Viral Meme/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-yellow-950/40 via-amber-950/40 to-slate-900 border border-yellow-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-300 text-lg flex-shrink-0">
                        🎭
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Viral Meme Caption Architect
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Reels, TikTok, Pakistani desi context & relatable humor hooks
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onActionClick('/meme Make 3 viral Reel hooks and captions for: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-yellow-600/30 cursor-pointer"
                      >
                        <span>🎬 Reel Hook</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/meme Give 3 funny Desi / Pakistani relatable memes on: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>🇵🇰 Desi Humor</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 9. Free Fire & BGMI Coach (/gamer) Inline Interactive Card */}
                {onActionClick && (/^\/gamer\b|Free Fire.*BGMI|Gaming Coach|Rush vs Hold/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-green-950/40 to-slate-900 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-lg flex-shrink-0">
                        🎮
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Free Fire & BGMI Pro Coach
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          One-tap headshot DPI settings, custom room clutch tactics & rotations
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onActionClick('/gamer Best sensitivity and DPI settings for headshots on: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        <span>🎯 Headshot DPI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/gamer Custom room 4v4 rush vs hold strategy for: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>⚔️ 4v4 Rush Strategy</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 10. Gym & Diet Bro (/gym, /grind) Inline Interactive Card */}
                {onActionClick && (/^\/gym|\/grind\b|Gym & Diet Bro|Desi Diet|Bulking Diet/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-orange-950/40 via-amber-950/40 to-slate-900 border border-orange-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-300 text-lg flex-shrink-0">
                        💪
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Gym & Desi Diet Coach
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Budget desi protein (daal, eggs, chana), PPL split & fat-loss schedules
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onActionClick('/gym Create a budget Pakistani desi diet plan for bulking: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/30 cursor-pointer"
                      >
                        <span>🍛 Desi Bulking Diet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/gym Best 4-day workout split for muscle growth without supplements: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>🏋️ 4-Day Split</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 11. Code Debugger (/code) Inline Interactive Card */}
                {onActionClick && (/^\/code\b|Code Debugger|What error.*Why error.*Fixed code/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/40 to-slate-900 border border-blue-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 text-lg flex-shrink-0">
                        💻
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Code Debugger & Refactor
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Error diagnosis, line-by-line breakdown, time complexity & drop-in fix
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onActionClick('/code Debug this snippet and explain root cause: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                      >
                        <span>🐛 Debug Snippet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/code Refactor and optimize this code for maximum performance: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>⚡ Optimize Speed</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 12. Teen Money Ideas PK (/money) Inline Interactive Card */}
                {onActionClick && (/^\/money\b|Teen Money Ideas PK|PKR Earn|student side hustles/i.test(message.content)) && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-900 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-lg flex-shrink-0">
                        💸
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Teen Money Ideas PK (PKR Earn)
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Zero-investment online skills, local Pakistani freelance niches & payouts (Easypaisa/JazzCash)
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onActionClick('/money Give 5 realistic ways a student in Pakistan can earn 30k-50k PKR/month online: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        <span>🇵🇰 5 Student Hustles</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionClick('/money Best high-demand skill to learn in 30 days for Fiverr/Upwork from Pakistan: ')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>🚀 30-Day Skill Roadmap</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}

          {/* Notice (e.g. fallback mode or quota advice) */}
          {message.notice &&
            !message.notice.toLowerCase().includes('exact match') &&
            !message.notice.toLowerCase().includes('q&a') &&
            !message.notice.toLowerCase().includes('cache') && (
            <div className="w-full text-xs text-slate-400 bg-[#131924] border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{message.notice}</span>
            </div>
          )}

          {/* Honest Web Search Provenance & Clickable Source Citations */}
          {message.sources && message.sources.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-start w-full px-1">
              <div className="w-full flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-sky-400 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Web Search Used · Verified Sources ({message.sources.length})</span>
                </div>
                {onOpenSourcesDrawer && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenSourcesDrawer({
                        title: 'Verified Citations',
                        sources: message.sources || [],
                        searchQuery: message.searchQueries?.[0],
                      })
                    }
                    className="text-[11px] font-medium text-sky-300 hover:text-white px-2.5 py-1 rounded-full bg-sky-950/60 border border-sky-500/40 hover:bg-sky-900/60 transition-all cursor-pointer flex items-center gap-1"
                    title="Open Right Side Sources Drawer"
                  >
                    <span>Open in Drawer</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
              {message.sources.map((source, idx) => {
                let domain = source.domain || '';
                if (!domain) {
                  try {
                    domain = new URL(source.url).hostname.replace(/^www\./, '');
                  } catch {
                    domain = '';
                  }
                }
                return (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#131924] border border-slate-800 hover:border-sky-500/50 hover:bg-[#1a2333] rounded-xl text-xs text-slate-200 hover:text-white transition-colors inline-flex items-center gap-1.5 max-w-xs truncate shadow-2xs"
                    title={`${source.title || domain} — ${source.url}`}
                  >
                    {domain && (
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/25 flex-shrink-0">
                        {domain}
                      </span>
                    )}
                    <span className="truncate">{source.title || domain || source.url}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          ) : message.searchFailed ? (
            <div className="w-full text-xs text-amber-300/90 bg-amber-950/25 border border-amber-500/30 rounded-xl px-3.5 py-2 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>
                Live web search returned no external sources for this query — answered using general model knowledge.
              </span>
            </div>
          ) : null}

          {/* Embedded Feedback Widget System (Good Response / Bad Response + Quick Points + Custom Input) */}
          {!message.isError && feedbackState !== 'none' && (
            <div
              id={`feedback-panel-${message.id}`}
              className={`w-full p-3.5 rounded-2xl border text-xs animate-in fade-in slide-in-from-bottom-1 duration-150 not-prose ${
                feedbackState === 'up'
                  ? 'bg-emerald-950/25 border-emerald-500/35 text-emerald-200'
                  : feedbackState === 'down'
                  ? 'bg-rose-950/25 border-rose-500/35 text-rose-200'
                  : 'bg-[#131924] border-slate-700/80 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center rounded-xl bg-slate-900/90 border border-slate-700/80 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => handleFeedbackClick('up')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        feedbackState === 'up'
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-xs'
                          : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Good response</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedbackClick('down')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        feedbackState === 'down'
                          ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 shadow-xs'
                          : 'text-slate-300 hover:text-rose-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Bad response</span>
                    </button>
                  </div>
                  <span className="font-semibold flex items-center gap-1.5 text-xs">
                    {feedbackState === 'up' ? (
                      <span>What did you like about this response?</span>
                    ) : feedbackState === 'down' ? (
                      <span>What could be improved in this response?</span>
                    ) : (
                      <span>Rate this response: Choose Good response or Bad response</span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackState('none')}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer rounded-lg hover:bg-slate-800/60"
                  title="Close feedback"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {(feedbackState === 'up' || feedbackState === 'down') && !feedbackSubmitted && (
                <div className="space-y-2.5">
                  {/* Selectable Quick Feedback Points */}
                  <div className="flex flex-wrap gap-1.5">
                    {(feedbackState === 'up'
                      ? [
                          'Writing is better than expected',
                          'Clear & easy to understand',
                          'Accurate & helpful',
                          'Great structure & examples',
                          'Followed all instructions',
                        ]
                      : [
                          'Writing could be better',
                          'Missing key details',
                          'Inaccurate or incomplete',
                          'Too long or repetitive',
                          "Didn't follow instructions",
                        ]
                    ).map((pointText) => {
                      const isSelected = feedbackComment
                        .toLowerCase()
                        .includes(pointText.toLowerCase());
                      return (
                        <button
                          key={pointText}
                          type="button"
                          onClick={() => {
                            setFeedbackComment((prev) => {
                              if (!prev.trim()) return pointText;
                              if (prev.toLowerCase().includes(pointText.toLowerCase())) {
                                return prev;
                              }
                              return `${prev.trim()}, ${pointText}`;
                            });
                          }}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer active:scale-95 ${
                            isSelected
                              ? feedbackState === 'up'
                                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                                : 'bg-rose-500/25 border-rose-400 text-rose-200'
                              : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500'
                          }`}
                        >
                          {pointText}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder={
                        feedbackState === 'up'
                          ? 'Write what you liked by yourself (optional)...'
                          : 'Write what went wrong by yourself (optional)...'
                      }
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFeedbackCommentSubmit();
                      }}
                    />
                    <button
                      type="button"
                      disabled={isSubmittingFeedback}
                      onClick={handleFeedbackCommentSubmit}
                      className={`px-3.5 py-1.5 rounded-xl text-white font-semibold text-xs transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 ${
                        feedbackState === 'up'
                          ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
                          : 'bg-rose-600 hover:bg-rose-500 active:scale-95'
                      }`}
                    >
                      {isSubmittingFeedback ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Submit</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {feedbackSubmitted && (
                <div className="text-xs font-medium flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {feedbackState === 'up'
                      ? 'Thank you for your valuable feedback! Logged to Firebase database. ✨'
                      : 'Thank you for helping us improve Sigma AI! Logged to Firebase database. 🛡️'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Unavailable Voice Warning Banner */}
          {voiceUnavailableNotice && (
            <div className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs not-prose">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{voiceUnavailableNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setVoiceUnavailableNotice(null)}
                className="p-1 text-amber-300 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section 1: Simulated Studio Loading Buffer */}
          {isBufferingAudio && (
            <div
              id={`studio-tts-buffer-${message.id}`}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/50 to-blue-950/60 border border-blue-500/40 text-blue-200 text-xs shadow-lg animate-in fade-in duration-200 not-prose"
            >
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400 flex-shrink-0" />
                <span className="font-semibold text-blue-200 tracking-wide">
                  Preparing {TTS_VOICE_OPTIONS.find((v) => v.id === activeVoiceId)?.label || 'Narrator'} audio...
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono uppercase tracking-wider">
                {TTS_VOICE_OPTIONS.find((v) => v.id === activeVoiceId)?.badgeText || 'STUDIO TTS'}
              </span>
            </div>
          )}

          {/* Section 1: Floating Audio Control Bar (Narrator Experience) */}
          {showAudioBar && (
            <div
              id={`studio-tts-player-${message.id}`}
              className="w-full p-3.5 rounded-2xl bg-[#0e1422] border border-blue-500/40 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 not-prose select-none"
            >
              <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* Play / Pause Toggle Button */}
                  <button
                    type="button"
                    onClick={handleTogglePlayPause}
                    className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex-shrink-0"
                    title={isPlayingAudio ? 'Stop / Pause Narrator' : 'Play Narrator'}
                    aria-label={isPlayingAudio ? 'Stop / Pause Narrator' : 'Play Narrator'}
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    )}
                  </button>

                  {/* Voice-Synchronized Waveform Rods */}
                  <div
                    className="flex items-center gap-1 h-7 px-1 flex-shrink-0"
                    title="Voice-synchronized audio waveform"
                  >
                    {waveformHeights.map((h, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-75 ${
                          isPlayingAudio
                            ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.65)]'
                            : 'bg-slate-600'
                        }`}
                        style={{ height: `${ isPlayingAudio ? h : 6 }px` }}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span>
                        {TTS_VOICE_OPTIONS.find((v) => v.id === activeVoiceId)?.label || 'Narrator Voice'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                        {TTS_VOICE_OPTIONS.find((v) => v.id === activeVoiceId)?.badgeText || 'ACTIVE VOICE'}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                      {isPlayingAudio
                        ? `Speaking with ${activeResolvedVoiceName || TTS_VOICE_OPTIONS.find((v) => v.id === activeVoiceId)?.label || 'Narrator'}...`
                        : audioElapsed >= audioTotalDuration - 0.2
                        ? 'Playback finished — Click Replay or drag circle to listen again'
                        : 'Playback stopped — Click Play or drag circle to resume'}
                    </span>
                  </div>
                </div>

                {/* Progress Timers, Rewind / Forward / Replay Controls, and Dismiss Close Button */}
                <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                  {/* Accurate Elapsed / Total Duration Numbers */}
                  <div className="text-[11px] font-mono text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center">
                    <span className="text-blue-300 font-semibold">{formatDuration(audioElapsed)}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-slate-400">{formatDuration(audioTotalDuration)}</span>
                  </div>

                  {/* Rewind (-5s) Button */}
                  <button
                    type="button"
                    onClick={() => handleSeekByOffset(-5)}
                    className="p-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-500/20 border border-blue-500/25 transition-colors cursor-pointer"
                    title="Rewind 5 seconds"
                    aria-label="Rewind 5 seconds"
                  >
                    <Rewind className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Forward (+5s) Button */}
                  <button
                    type="button"
                    onClick={() => handleSeekByOffset(5)}
                    className="p-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-500/20 border border-blue-500/25 transition-colors cursor-pointer"
                    title="Forward 5 seconds"
                    aria-label="Forward 5 seconds"
                  >
                    <FastForward className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Replay from Start Button */}
                  <button
                    type="button"
                    onClick={handleReplayFromStart}
                    className="p-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-500/20 border border-blue-500/25 transition-colors cursor-pointer"
                    title="Replay from beginning"
                    aria-label="Replay from beginning"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Close & Stop Button */}
                  <button
                    type="button"
                    onClick={handleCloseAudioBar}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Stop and close audio player"
                    aria-label="Stop and close audio player"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Movable YouTube-Style Interactive Progress Bar with Draggable Circle Thumb */}
              <div
                ref={progressBarRef}
                onPointerDown={handleScrubberPointerDown}
                role="slider"
                aria-label="Audio playback timeline"
                aria-valuemin={0}
                aria-valuemax={Math.round(audioTotalDuration)}
                aria-valuenow={Math.round(audioElapsed)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    handleSeekByOffset(-2);
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    handleSeekByOffset(2);
                  }
                }}
                className="w-full py-2 cursor-pointer group relative flex items-center touch-none"
                title="Drag circle or click anywhere on the line to rewind or move forward"
              >
                {/* Unplayed Track Line */}
                <div className="w-full bg-slate-800/95 h-2 rounded-full relative shadow-inner">
                  {/* Played Progress Line */}
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-400 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, (audioElapsed / Math.max(1, audioTotalDuration)) * 100))}%`,
                    }}
                  />

                  {/* YouTube-Style Circle Thumb at the exact end of the played line */}
                  <div
                    className={`w-4 h-4 rounded-full bg-sky-400 border-2 border-white shadow-[0_0_10px_rgba(56,189,248,0.9)] absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform ${
                      isDraggingScrubber ? 'scale-125 bg-blue-300' : 'group-hover:scale-115'
                    }`}
                    style={{
                      left: `${Math.min(100, Math.max(0, (audioElapsed / Math.max(1, audioTotalDuration)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer: Mobile Circular Action Bar (Copy, Speaker, Merged Rate Response + Three-Dot Menu) + Desktop Full Action Bar */}
          <div className="w-full px-1 flex flex-col gap-2">
            {/* MOBILE ACTION BAR (sm:hidden): Copy, Speaker, Merged Rate Response + Three-Dot Menu */}
            <div ref={mobileThreeDotRef} className="flex sm:hidden flex-col gap-2 w-full">
              {isThreeDotMenuOpen && !message.isError && (
                <div
                  id={`mobile-staggered-actions-${message.id}`}
                  className="flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-[#131924]/95 border border-slate-700/80 shadow-xl not-prose animate-in fade-in slide-in-from-bottom-1 duration-150"
                >
                  {[
                    {
                      id: 'summarize',
                      label: 'Summarize',
                      icon: <FileText className="w-3.5 h-3.5 text-teal-400" />,
                      onClick: () => {
                        setIsThreeDotMenuOpen(false);
                        const cleanTextForSummary = (displayMarkdown || message.content || '').trim();
                        if (onOpenSummarizeForMessage) {
                          onOpenSummarizeForMessage(cleanTextForSummary);
                        } else {
                          onActionClick?.(
                            `Summarize this response clearly:\n\n${cleanTextForSummary.slice(0, 600)}`
                          );
                        }
                      },
                    },
                    {
                      id: 'explain',
                      label: 'Explain',
                      icon: <BookOpen className="w-3.5 h-3.5 text-amber-400" />,
                      onClick: () => {
                        setIsThreeDotMenuOpen(false);
                        const topicSnippet = (displayMarkdown || message.content || '')
                          .replace(/```[\s\S]*?```/g, '')
                          .trim()
                          .slice(0, 300);
                        if (onOpenExplainForMessage) {
                          onOpenExplainForMessage(topicSnippet || message.userPrompt || 'Explain this');
                        } else {
                          onActionClick?.('Simplify and explain this in easy terms');
                        }
                      },
                    },
                    ...(hasCodeInMessage
                      ? [
                          {
                            id: 'improve-code',
                            label: 'Improve Code',
                            icon: <Code2 className="w-3.5 h-3.5" style={{ color: themeColorHex }} />,
                            onClick: () => {
                              setIsThreeDotMenuOpen(false);
                              if (onOpenCodeForMessage) {
                                onOpenCodeForMessage(extractedCodeFromMessage, 'optimize');
                              } else {
                                onActionClick?.('Improve and extend this code with the next key feature');
                              }
                            },
                          },
                        ]
                      : []),
                    // Add to Library — ONLY shown for Library Materials (isLibraryWorthy)
                    ...(isLibraryWorthy
                      ? [
                          {
                            id: 'add-to-library',
                            label: savedToLibrary ? 'Saved to Library' : 'Add to Library',
                            icon: savedToLibrary ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Library className="w-3.5 h-3.5" style={{ color: themeColorHex }} />
                            ),
                            onClick: () => {
                              handleSaveArtifactToLibrary();
                              setIsThreeDotMenuOpen(false);
                            },
                          },
                        ]
                      : []),
                    ...(onRetry
                      ? [
                          {
                            id: 'redo',
                            label: 'Redo',
                            icon: <RotateCcw className="w-3.5 h-3.5 text-slate-300" />,
                            onClick: () => {
                              setIsThreeDotMenuOpen(false);
                              onRetry();
                            },
                          },
                        ]
                      : []),
                    {
                      id: 'view-source',
                      label: 'View source',
                      icon: <Globe className="w-3.5 h-3.5 text-sky-400" />,
                      onClick: () => {
                        setIsThreeDotMenuOpen(false);
                        setIsViewSourceOpen((prev) => !prev);
                      },
                    },
                    ...(onBranchChat
                      ? [
                          {
                            id: 'branch-chat',
                            label: 'Branch chat',
                            icon: <GitBranch className="w-3.5 h-3.5 text-emerald-400" />,
                            onClick: () => {
                              setIsThreeDotMenuOpen(false);
                              onBranchChat(message.id);
                            },
                          },
                        ]
                      : []),
                  ].map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      style={{
                        borderColor: `${themeColorHex}45`,
                        animationDelay: `${idx * 40}ms`,
                      }}
                      className="px-2.5 py-1.5 rounded-full border bg-slate-900/90 hover:bg-slate-800 text-slate-100 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 animate-three-dot-emerge"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 w-full min-h-[36px]">
                <div className="flex items-center gap-2">
                  {!message.isError ? (
                    <>
                      {/* 1. Mobile Copy Circle Icon Button */}
                      <button
                        id={`mobile-copy-btn-${message.id}`}
                        type="button"
                        onClick={copyToClipboard}
                        className="w-8 h-8 rounded-full aspect-square bg-[#131924] border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-xs"
                        title={copied ? 'Copied' : 'Copy response'}
                        aria-label="Copy response"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* 2. Mobile Speaker / Narrator Circle Icon Button */}
                      {showSpeaker && (
                        <button
                          id={`mobile-tts-btn-${message.id}`}
                          type="button"
                          onClick={triggerStudioNarrator}
                          className="w-8 h-8 rounded-full aspect-square bg-[#131924] border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-xs"
                          style={{
                            borderColor:
                              showAudioBar || isBufferingAudio ? themeColorHex : undefined,
                            color:
                              showAudioBar || isBufferingAudio ? themeColorHex : undefined,
                          }}
                          title={showAudioBar && isPlayingAudio ? 'Pause Narrator' : 'Read aloud'}
                          aria-label="Read aloud"
                        >
                          {isBufferingAudio ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          ) : showAudioBar && isPlayingAudio ? (
                            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* 3. Mobile Merged Like/Dislike (Rate Response) Circle Icon Button */}
                      <button
                        id={`mobile-feedback-merged-btn-${message.id}`}
                        type="button"
                        onClick={() => {
                          setFeedbackState((prev) => (prev === 'none' ? 'choose' : 'none'));
                        }}
                        className={`w-8 h-8 rounded-full aspect-square border flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-xs ${
                          feedbackState === 'up'
                            ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/60'
                            : feedbackState === 'down'
                            ? 'text-rose-400 bg-rose-950/40 border-rose-500/60'
                            : feedbackState === 'choose'
                            ? 'text-white bg-slate-800 border-slate-500'
                            : 'bg-[#131924] border-slate-700/80 text-slate-300 hover:text-white'
                        }`}
                        title="Rate response (Good response / Bad response)"
                        aria-label="Rate response"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 8.5h2.2v6H2z" />
                          <path d="M4.2 8.5l2.6-4.5a1.3 1.3 0 0 1 2.4.7v2.8h3.1a1.4 1.4 0 0 1 1.4 1.6l-.7 4.2a1.4 1.4 0 0 1-1.4 1.2H4.2" />
                          <path d="M22 15.5h-2.2v-6H22z" />
                          <path d="M19.8 15.5l-2.6 4.5a1.3 1.3 0 0 1-2.4-.7v-2.8h-3.1a1.4 1.4 0 0 1-1.4-1.6l.7-4.2a1.4 1.4 0 0 1 1.4-1.2h7.4" />
                        </svg>
                      </button>

                      {/* 4. Mobile Three-Dot Circle Icon Button */}
                      <button
                        id={`mobile-three-dot-btn-${message.id}`}
                        type="button"
                        onClick={() => setIsThreeDotMenuOpen((prev) => !prev)}
                        className="w-8 h-8 rounded-full aspect-square flex items-center justify-center transition-all cursor-pointer active:scale-90 border flex-shrink-0 shadow-xs"
                        style={{
                          backgroundColor: isThreeDotMenuOpen ? `${themeColorHex}25` : '#131924',
                          borderColor: isThreeDotMenuOpen ? themeColorHex : 'rgba(51,65,85,0.8)',
                          color: isThreeDotMenuOpen ? themeColorHex : '#cbd5e1',
                          boxShadow: isThreeDotMenuOpen ? `0 0 12px ${themeColorHex}40` : 'none',
                        }}
                        title="More options (Summarize, Explain, Redo, View source)"
                        aria-label="Message actions"
                        aria-expanded={isThreeDotMenuOpen}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase">Retry</span>
                      </button>
                    )
                  )}
                </div>

                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap flex-shrink-0">
                  {formattedTime}
                </span>
              </div>
            </div>

            {/* DESKTOP ACTION BAR (hidden sm:flex): Clean Single-Line Layout */}
            <div className="hidden sm:flex items-center justify-between w-full gap-3 flex-nowrap">
              <div className="flex items-center gap-2.5 flex-nowrap min-w-0">
                {!message.isError && (
                  <>
                    {/* Copy Button */}
                    <button
                      id={`copy-btn-${message.id}`}
                      onClick={copyToClipboard}
                      className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
                      title="Copy response"
                      aria-label="Copy response"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="text-[10px] text-emerald-400 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-[10px] uppercase tracking-wider">Copy</span>
                        </>
                      )}
                    </button>

                    {/* Single Merged Like/Dislike Button */}
                    <div className="flex items-center pl-2 border-l border-slate-700/60 flex-shrink-0">
                      <button
                        id={`feedback-merged-btn-${message.id}`}
                        type="button"
                        onClick={() => {
                          setFeedbackState((prev) => (prev === 'none' ? 'choose' : 'none'));
                        }}
                        className={`p-1 rounded-md transition-colors cursor-pointer flex items-center justify-center ${
                          feedbackState === 'up'
                            ? 'text-emerald-400 bg-emerald-950/40'
                            : feedbackState === 'down'
                            ? 'text-rose-400 bg-rose-950/40'
                            : feedbackState === 'choose'
                            ? 'text-white bg-slate-800'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                        title="Rate response (Good response / Bad response)"
                        aria-label="Rate response"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 8.5h2.2v6H2z" />
                          <path d="M4.2 8.5l2.6-4.5a1.3 1.3 0 0 1 2.4.7v2.8h3.1a1.4 1.4 0 0 1 1.4 1.6l-.7 4.2a1.4 1.4 0 0 1-1.4 1.2H4.2" />
                          <path d="M22 15.5h-2.2v-6H22z" />
                          <path d="M19.8 15.5l-2.6 4.5a1.3 1.3 0 0 1-2.4-.7v-2.8h-3.1a1.4 1.4 0 0 1-1.4-1.6l.7-4.2a1.4 1.4 0 0 1 1.4-1.2h7.4" />
                        </svg>
                      </button>
                    </div>

                    {/* Text-to-Speech Speaker Icon Button */}
                    {showSpeaker && (
                      <button
                        id={`tts-btn-${message.id}`}
                        type="button"
                        onClick={triggerStudioNarrator}
                        className={`text-xs flex items-center gap-1 transition-colors cursor-pointer pl-2 border-l border-slate-700/60 whitespace-nowrap flex-shrink-0 ${
                          showAudioBar || isBufferingAudio
                            ? 'font-semibold text-blue-400'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        style={{ color: (showAudioBar || isBufferingAudio) ? (themeColorHex || '#3b82f6') : undefined }}
                        title={
                          showAudioBar
                            ? isPlayingAudio
                              ? `Pause ${TTS_VOICE_OPTIONS.find((v) => v.id === activeVoiceId)?.label || 'Narrator'}`
                              : `Resume ${TTS_VOICE_OPTIONS.find((v) => v.id === activeVoiceId)?.label || 'Narrator'}`
                            : isBufferingAudio
                            ? 'Preparing voice...'
                            : `Listen (${TTS_VOICE_OPTIONS.find((v) => v.id === activeVoiceId)?.label || 'Male Voice'})`
                        }
                        aria-label={`Listen in ${TTS_VOICE_OPTIONS.find((v) => v.id === activeVoiceId)?.label || 'Narrator Voice'}`}
                      >
                        {isBufferingAudio ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 flex-shrink-0" />
                            <span className="text-[10px] uppercase tracking-wider text-blue-300 whitespace-nowrap">Loading...</span>
                          </>
                        ) : showAudioBar ? (
                          isPlayingAudio ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 animate-pulse text-blue-400 flex-shrink-0" />
                              <span className="text-[10px] uppercase tracking-wider text-blue-300 whitespace-nowrap">Playing</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 whitespace-nowrap">Paused</span>
                            </>
                          )
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-[10px] uppercase tracking-wider whitespace-nowrap">
                              Listen ({TTS_VOICE_OPTIONS.find((v) => v.id === activeVoiceId)?.shortLabel || 'Male'})
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Save to Library Button — ONLY shown for Library-worthy artifacts */}
                    {isLibraryWorthy && (
                      <button
                        id={`save-library-btn-${message.id}`}
                        type="button"
                        onClick={handleSaveArtifactToLibrary}
                        className="text-slate-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors cursor-pointer pl-2 border-l border-slate-700/60 whitespace-nowrap flex-shrink-0"
                        title="Add to Library"
                        aria-label="Add to Library"
                      >
                        {savedToLibrary ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span className="text-[10px] text-emerald-400 font-medium whitespace-nowrap">Saved</span>
                          </>
                        ) : (
                          <>
                            <Library className="w-3 h-3 flex-shrink-0" />
                            <span className="text-[10px] uppercase tracking-wider whitespace-nowrap">Add to Library</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Regenerate Response Button */}
                    {onRetry && (
                      <button
                        id={`regenerate-btn-${message.id}`}
                        type="button"
                        onClick={onRetry}
                        className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer pl-2 border-l border-slate-700/60 whitespace-nowrap flex-shrink-0"
                        title="Regenerate a fresh response"
                        aria-label="Regenerate response"
                      >
                        <RotateCcw className="w-3 h-3 flex-shrink-0" />
                        <span className="text-[10px] uppercase tracking-wider whitespace-nowrap">Regenerate</span>
                      </button>
                    )}

                    {/* Desktop Three-Dot Menu */}
                    <div ref={threeDotMenuRef} className="relative pl-2 border-l border-slate-700/60 flex-shrink-0">
                      <button
                        id={`three-dot-menu-btn-${message.id}`}
                        type="button"
                        onClick={() => setIsThreeDotMenuOpen((prev) => !prev)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer flex items-center justify-center"
                        title="More actions (View source, Branch in new chat, Read aloud)"
                        aria-label="Message menu"
                        aria-expanded={isThreeDotMenuOpen}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {isThreeDotMenuOpen && (
                        <div
                          className={`absolute left-0 bottom-full mb-2 w-48 rounded-xl border shadow-2xl z-40 py-1.5 not-prose ${
                            darkMode
                              ? 'bg-[#131924] border-slate-700/90 text-slate-200'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setIsThreeDotMenuOpen(false);
                              setIsViewSourceOpen((prev) => !prev);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer"
                          >
                            <Globe className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                            <span>View source</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsThreeDotMenuOpen(false);
                              onBranchChat?.(message.id);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer"
                          >
                            <GitBranch className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>Branch in new chat</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsThreeDotMenuOpen(false);
                              triggerStudioNarrator();
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <span>Read aloud</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {message.isError && onRetry && (
                  <button
                    id={`retry-error-btn-${message.id}`}
                    type="button"
                    onClick={onRetry}
                    className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    title="Retry generating response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase tracking-wider">Retry</span>
                  </button>
                )}
              </div>

              <span className="text-[11px] text-slate-500 ml-auto font-mono whitespace-nowrap flex-shrink-0">
                {formattedTime}
              </span>
            </div>
          </div>

          {/* Feature 18: View Source Inspection Panel (Web sources, Uploaded files, or General Model Knowledge) */}
          {isViewSourceOpen && (
            <div
              id={`view-source-panel-${message.id}`}
              className={`w-full mt-2 p-4 rounded-2xl border shadow-lg not-prose text-xs sm:text-sm ${
                darkMode
                  ? 'bg-[#0e1420] border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Globe className="w-4 h-4" style={{ color: themeColorHex }} />
                  <span>Response Source Attribution</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsViewSourceOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  aria-label="Close source view"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {message.sources && message.sources.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">
                    This response used verified external web sources ({message.sources.length}):
                  </p>
                  <div className="space-y-1.5">
                    {message.sources.map((src, sIdx) => {
                      let domain = src.url;
                      try {
                        domain = new URL(src.url).hostname.replace(/^www\./, '');
                      } catch {
                        // keep raw url
                      }
                      return (
                        <a
                          key={sIdx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors group"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-200 group-hover:text-white truncate">
                              {src.title || domain}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {domain} · {src.url}
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white flex-shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : message.usedFiles && message.usedFiles.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">
                    This response was generated using your uploaded file(s) / attachment(s):
                  </p>
                  <div className="space-y-1.5">
                    {message.usedFiles.map((fileItem, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-sky-400 flex-shrink-0" />
                          <span className="font-medium text-slate-200 truncate">
                            {fileItem.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex-shrink-0">
                          {fileItem.type}
                          {fileItem.size ? ` · ${fileItem.size}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  No external source was used for this answer. This response was generated from general model knowledge without consulting external websites or uploaded files.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
