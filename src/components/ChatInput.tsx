import React, { useState, useRef, useEffect } from 'react';
import {
  Loader2,
  Mic,
  PenTool,
  FileText,
  Code2,
  BookOpen,
  Plus,
  Image,
  Video,
  Link2,
  Send,
  AlertCircle,
  X,
  Square,
  Search,
  Brain,
  Globe,
  ArrowDown,
  MoreHorizontal,
  Play,
  Film,
  HardDrive,
  Camera,
} from 'lucide-react';
import { AudioWaveBar } from './AudioWaveBar';
import { AddUrlModal } from './AddUrlModal';
import { getTranslation } from '../lib/translations';
import { PowerPointSlideIcon } from './powerpoint/PowerPointIcon';
import { ExcelSpreadsheetIcon } from './excel/ExcelIcon';
import { VideoAttachment } from '../types';
import { processUploadedVideo, isVideoFile } from '../lib/videoUtils';
import { SIGMA_MODES, SigmaMode } from '../lib/sigmaModes';

export type ComposerSpecialMode =
  | 'powerpoint'
  | 'excel'
  | 'deep_search'
  | 'deep_think'
  | 'web_search'
  | null;

export interface AttachmentItem {
  id: string;
  type: 'image' | 'video' | 'file' | 'url';
  name: string;
  url?: string;
  dataUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  durationFormatted?: string;
  keyframes?: { timestamp: string; dataUrl: string }[];
  isProcessing?: boolean;
  processingStatus?: string;
  textContent?: string;
  size?: string;
}

interface ChatInputProps {
  onSendMessage: (
    message: string,
    images?: string[],
    forcePowerPointMode?: boolean,
    specialMode?: ComposerSpecialMode,
    videos?: VideoAttachment[]
  ) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  onOpenLiveAssistant?: () => void;
  onOpenDraw?: () => void;
  onOpenSummarize?: () => void;
  onOpenCode?: () => void;
  onOpenExplain?: () => void;
  onOpenImageInEditor?: (dataUrl: string) => void;
  isPowerPointMode?: boolean;
  onTogglePowerPointMode?: (active: boolean) => void;
  activeSpecialMode?: ComposerSpecialMode;
  onChangeSpecialMode?: (mode: ComposerSpecialMode) => void;
  themeColorHex?: string;
  language?: string;
  stopAnimations?: boolean;
  darkMode?: boolean;
  taskbarBgColor?: string;
  taskbarFocusGlowColor?: string;
  taskbarStyleMode?: 'glass' | 'solid';
  uiGlowEnabled?: boolean;
  uiGlowPreset?: string;
  uiGlowColor1?: string;
  uiGlowColor2?: string;
  showScrollToLatest?: boolean;
  onScrollToLatest?: () => void;
  onOpenConnections?: () => void;
  onOpenModesModal?: () => void;
  onOpenCameraModal?: (mode?: 'select' | 'camera' | 'upload') => void;
}

const DYNAMIC_PLACEHOLDERS = [
  'Ask Sigma anything...',
  'Transmit a signal...',
  'Type your thought...',
  'Search the web or analyze images...',
  'Code, calculate, or summarize...',
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
  onOpenLiveAssistant,
  onOpenDraw,
  onOpenSummarize,
  onOpenCode,
  onOpenExplain,
  onOpenImageInEditor,
  isPowerPointMode,
  onTogglePowerPointMode,
  activeSpecialMode,
  onChangeSpecialMode,
  themeColorHex = '#00ea77',
  language = 'English (US)',
  stopAnimations = false,
  darkMode = true,
  taskbarBgColor = '#0e1626',
  taskbarFocusGlowColor,
  taskbarStyleMode = 'glass',
  uiGlowEnabled = true,
  uiGlowPreset = 'cyber-cyan',
  uiGlowColor1 = '#00f0ff',
  uiGlowColor2 = '#b026ff',
  showScrollToLatest = false,
  onScrollToLatest,
  onOpenConnections,
  onOpenModesModal,
  onOpenCameraModal,
}) => {
  const [input, setInput] = useState('');
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [isMobileShortcutsOpen, setIsMobileShortcutsOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [internalPptMode, setInternalPptMode] = useState(false);
  const [internalSpecialMode, setInternalSpecialMode] = useState<ComposerSpecialMode>(null);
  const isSubmittingRef = useRef(false);

  // Slash commands autocomplete state (/gamer, /ghost, /rizz, etc.)
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [isSlashMenuDismissed, setIsSlashMenuDismissed] = useState(false);

  const isSlashCommandQuery = input.startsWith('/') && !input.slice(1).includes(' ');
  const slashQuery = isSlashCommandQuery ? input.slice(1).toLowerCase().trim() : '';
  const filteredSlashModes: SigmaMode[] = isSlashCommandQuery
    ? SIGMA_MODES.filter(
        (m) =>
          !slashQuery ||
          m.id.toLowerCase().startsWith(slashQuery) ||
          m.command.toLowerCase().includes(slashQuery) ||
          m.title.toLowerCase().includes(slashQuery)
      )
    : [];
  const isSlashMenuOpen = isSlashCommandQuery && !isSlashMenuDismissed && filteredSlashModes.length > 0;

  const selectSlashCommand = (cmd: string) => {
    if (cmd === '/camera') {
      setInput('');
      setIsSlashMenuDismissed(true);
      if (onOpenCameraModal) {
        onOpenCameraModal('select');
        return;
      }
    }
    if (cmd === '/mods') {
      setInput('');
      setIsSlashMenuDismissed(true);
      if (onOpenModesModal) {
        onOpenModesModal();
        return;
      }
    }
    setInput(`${cmd} `);
    setIsSlashMenuDismissed(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 20);
  };

  const effectiveMode: ComposerSpecialMode =
    activeSpecialMode !== undefined
      ? activeSpecialMode
      : isPowerPointMode
      ? 'powerpoint'
      : internalSpecialMode || (internalPptMode ? 'powerpoint' : null);

  const activePowerPointMode = effectiveMode === 'powerpoint';

  const handleSetSpecialMode = (mode: ComposerSpecialMode) => {
    setInternalSpecialMode(mode);
    setInternalPptMode(mode === 'powerpoint');
    if (onChangeSpecialMode) {
      onChangeSpecialMode(mode);
    }
    if (onTogglePowerPointMode) {
      onTogglePowerPointMode(mode === 'powerpoint');
    }
  };

  const handleSetPowerPointMode = (active: boolean) => {
    handleSetSpecialMode(active ? 'powerpoint' : null);
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  // Listen for global focus events
  useEffect(() => {
    const handleFocusSignal = () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    window.addEventListener('sigma-focus-chat-input', handleFocusSignal);
    return () => {
      window.removeEventListener('sigma-focus-chat-input', handleFocusSignal);
    };
  }, []);

  // Listen for composer input clearing (e.g. when temporary chat is toggled off or new chat)
  useEffect(() => {
    const handleClearComposer = () => {
      setInput('');
      setAttachments([]);
      setIsPlusOpen(false);
      setIsMobileShortcutsOpen(false);
    };
    window.addEventListener('sigma-clear-composer-input', handleClearComposer);
    return () => {
      window.removeEventListener('sigma-clear-composer-input', handleClearComposer);
    };
  }, []);

  // Listen for saved edited images from the Image Annotator / Draw Modal
  useEffect(() => {
    const handleSaveEditedImage = (e: any) => {
      const dataUrl = e?.detail?.dataUrl;
      if (!dataUrl) return;
      setAttachments((prev) => {
        const imageIndex = prev.findIndex((a) => a.type === 'image');
        if (imageIndex >= 0) {
          const updated = [...prev];
          updated[imageIndex] = {
            ...updated[imageIndex],
            dataUrl,
            name: updated[imageIndex].name.startsWith('edited-')
              ? updated[imageIndex].name
              : `edited-${updated[imageIndex].name}`,
          };
          return updated;
        }
        return [
          ...prev,
          {
            id: `edited-${Date.now()}`,
            name: `annotated-image-${Date.now()}.png`,
            type: 'image',
            dataUrl,
          },
        ];
      });
    };
    window.addEventListener('sigma-save-edited-image', handleSaveEditedImage);
    return () => {
      window.removeEventListener('sigma-save-edited-image', handleSaveEditedImage);
    };
  }, []);

  // Dynamic Typewriter Animated Placeholder
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Voice / Mic state
  const [isListening, setIsListening] = useState(false);
  const [micBlockedError, setMicBlockedError] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const isListeningRef = useRef(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<any>(null);
  const initialSpeechBaseInputRef = useRef<string>('');
  const accumulatedSpeechTranscriptRef = useRef<string>('');
  const micStreamTrackRef = useRef<MediaStream | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingVideoJobsRef = useRef<Map<string, Promise<any>>>(new Map());

  // Typewriter Animation Effect: Types character by character, sequence dots, pauses, and erases
  useEffect(() => {
    if (stopAnimations) {
      setDisplayedPlaceholder(DYNAMIC_PLACEHOLDERS[0]);
      return;
    }

    const currentPhrase = DYNAMIC_PLACEHOLDERS[phraseIndex % DYNAMIC_PLACEHOLDERS.length];

    if (isPaused) {
      // Pause for 2.5s once fully typed
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 2500);
      return () => clearTimeout(pauseTimer);
    }

    if (!isDeleting) {
      // Typing forward: characters appear one by one
      if (displayedPlaceholder.length < currentPhrase.length) {
        const nextChar = currentPhrase[displayedPlaceholder.length];
        // Sequential dot appearance: when reaching trailing dots (...), pause naturally (. then .. then ...)
        const isTrailingDot = nextChar === '.' && displayedPlaceholder.length >= currentPhrase.length - 3;
        const typingDelay = isTrailingDot ? 280 : 45 + Math.floor(Math.random() * 25);

        const typeTimer = setTimeout(() => {
          setDisplayedPlaceholder(currentPhrase.slice(0, displayedPlaceholder.length + 1));
        }, typingDelay);
        return () => clearTimeout(typeTimer);
      } else {
        // Full message typed with trailing dots in place
        setIsPaused(true);
      }
    } else {
      // Erasing character by character
      if (displayedPlaceholder.length > 0) {
        const eraseTimer = setTimeout(() => {
          setDisplayedPlaceholder((prev) => prev.slice(0, -1));
        }, 24);
        return () => clearTimeout(eraseTimer);
      } else {
        // Fully erased, pause briefly before next message
        setIsDeleting(false);
        const switchTimer = setTimeout(() => {
          setPhraseIndex((prev) => (prev + 1) % DYNAMIC_PLACEHOLDERS.length);
        }, 300);
        return () => clearTimeout(switchTimer);
      }
    }
  }, [displayedPlaceholder, isDeleting, isPaused, phraseIndex, stopAnimations]);

  // Attached Large Prompt Capsule state
  const [attachedPrompt, setAttachedPrompt] = useState<{
    heading: string;
    fullText: string;
    charCount: number;
  } | null>(null);

  const extractPromptHeading = (text: string): string => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const firstLine = lines[0]
        .replace(/^[#*_\-—–\s]+/, '')
        .replace(/[#*_\-—–\s]+$/, '')
        .trim();
      if (firstLine.length > 0) {
        return firstLine.slice(0, 48);
      }
    }
    const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
    return words.slice(0, 45) || 'Large Prompt';
  };

  const handleExpandPromptToTextField = () => {
    if (!attachedPrompt) return;
    const currentInput = input.trim();
    const restored = currentInput
      ? `${currentInput}\n\n${attachedPrompt.fullText}`
      : attachedPrompt.fullText;
    setInput(restored);
    setAttachedPrompt(null);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
      }
    }, 50);
  };

  const handleCollapseInputToPromptCapsule = () => {
    if (!input.trim() || input.trim().length < 50) return;
    const heading = extractPromptHeading(input.trim());
    setAttachedPrompt({
      heading,
      fullText: input.trim(),
      charCount: input.trim().length,
    });
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Close plus menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusOpen(false);
      }
    };
    if (isPlusOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isPlusOpen]);

  // Focus textarea when not loading
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  // Handle Voice Input with Live Real-time Typing and Sound Reactive Audio Waves
  const startListening = async () => {
    setMicBlockedError(null);
    initialSpeechBaseInputRef.current = input;
    accumulatedSpeechTranscriptRef.current = '';

    // Acquire microphone audio stream for real-time sound reactive wave animation
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        micStreamTrackRef.current = stream;
        setAudioStream(stream);
      } else {
        setMicBlockedError('Microphone is not supported in this browser.');
        return;
      }
    } catch (streamErr: any) {
      console.warn('Microphone permission error:', streamErr);
      setMicBlockedError('Microphone access was denied. Please allow microphone permission in your browser.');
      return;
    }

    isListeningRef.current = true;
    setIsListening(true);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang =
          language === 'Urdu'
            ? 'ur-PK'
            : language === 'Hindi' || language === 'Hinglish'
            ? 'hi-IN'
            : language === 'Japanese'
            ? 'ja-JP'
            : language === 'German'
            ? 'de-DE'
            : language === 'French'
            ? 'fr-FR'
            : language === 'Spanish'
            ? 'es-ES'
            : 'en-US';

        let committedFinalSegments = '';

        recognition.onresult = (event: any) => {
          let currentSessionFinal = '';
          let currentSessionInterim = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              currentSessionFinal += transcript + ' ';
            } else {
              currentSessionInterim += transcript + ' ';
            }
          }

          if (currentSessionFinal.trim()) {
            committedFinalSegments = (committedFinalSegments + ' ' + currentSessionFinal).trim();
          }

          const currentSpoken = `${committedFinalSegments} ${currentSessionInterim}`.trim();
          if (currentSpoken) {
            accumulatedSpeechTranscriptRef.current = currentSpoken;
            // Live real-time typing into input bar as the user speaks!
            const base = initialSpeechBaseInputRef.current.trim();
            const combined = base ? `${base} ${currentSpoken}` : currentSpoken;
            setInput(combined);
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition event warning:', event.error);
          // Do NOT abort recording on temporary silence/no-speech pause!
          if (event.error === 'no-speech') {
            return;
          }
          if (event.error === 'not-allowed') {
            setMicBlockedError('Microphone blocked, please allow mic access in browser settings.');
            cancelListening();
          }
        };

        recognition.onend = () => {
          // If user is still actively recording, restart recognition automatically
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognition.start();
            } catch (_) {}
          }
        };

        recognition.start();
      } catch (err: any) {
        console.warn('SpeechRecognition startup warning:', err);
      }
    }
  };

  // Finishes listening and cleanly releases audio stream with buffer flush
  const finishAndCommitListening = () => {
    if (!isListeningRef.current && !isListening) return;
    isListeningRef.current = false;
    setIsListening(false);

    if (micStreamTrackRef.current) {
      try {
        micStreamTrackRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      micStreamTrackRef.current = null;
    }
    setAudioStream(null);

    const rec = recognitionRef.current;
    const finalizeTranscript = () => {
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try {
          rec.stop();
        } catch (_) {}
      }
      recognitionRef.current = null;

      const spoken = accumulatedSpeechTranscriptRef.current.trim();
      const base = initialSpeechBaseInputRef.current.trim();
      const currentInput = (input || textareaRef.current?.value || '').trim();
      const finalCombined = spoken ? (base ? `${base} ${spoken}` : spoken) : currentInput;
      if (finalCombined) {
        setInput(finalCombined);
      }
      accumulatedSpeechTranscriptRef.current = '';
      textareaRef.current?.focus();
    };

    if (rec) {
      rec.onend = () => {
        finalizeTranscript();
      };
      try {
        rec.stop();
      } catch (_) {
        finalizeTranscript();
      }
      setTimeout(finalizeTranscript, 360);
    } else {
      finalizeTranscript();
    }
  };

  const cancelListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (micStreamTrackRef.current) {
      try {
        micStreamTrackRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      micStreamTrackRef.current = null;
    }
    setAudioStream(null);
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch (_) {}
    }
    accumulatedSpeechTranscriptRef.current = '';
    setInput(initialSpeechBaseInputRef.current);
  };

  // Sends recorded speech, ensuring speech engine flushes any pending final words (including the last 5 words)
  const sendFromListening = () => {
    if (!isListeningRef.current && !isListening) return;
    isListeningRef.current = false;
    setIsListening(false);

    if (micStreamTrackRef.current) {
      try {
        micStreamTrackRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      micStreamTrackRef.current = null;
    }
    setAudioStream(null);

    const rec = recognitionRef.current;
    let hasDispatched = false;

    const commitAndSend = () => {
      if (hasDispatched) return;
      hasDispatched = true;

      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try {
          rec.stop();
        } catch (_) {}
      }
      recognitionRef.current = null;

      const spoken = accumulatedSpeechTranscriptRef.current.trim();
      const base = initialSpeechBaseInputRef.current.trim();
      const currentInput = (input || textareaRef.current?.value || '').trim();
      const fullText = spoken ? (base ? `${base} ${spoken}` : spoken) : currentInput;

      accumulatedSpeechTranscriptRef.current = '';
      setInput('');
      setAttachments([]);

      if (fullText && fullText.trim()) {
        onSendMessage(
          fullText.trim(),
          attachments
            .filter((a) => a.type === 'image' && a.dataUrl)
            .map((a) => a.dataUrl as string),
          activePowerPointMode,
          effectiveMode
        );
      }
    };

    if (rec) {
      // Keep onresult listening so remaining words in the engine audio buffer are received
      rec.onend = () => {
        commitAndSend();
      };
      try {
        rec.stop();
      } catch (_) {
        commitAndSend();
      }
      // Guarantee transmission even if onend is delayed
      setTimeout(commitAndSend, 380);
    } else {
      commitAndSend();
    }
  };

  const toggleMic = () => {
    if (isListening) {
      finishAndCommitListening();
    } else {
      startListening();
    }
  };

  // Keyboard Submission & Shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Intercept slash menu keyboard navigation if open
    if (isSlashMenuOpen && filteredSlashModes.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev + 1) % filteredSlashModes.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev - 1 + filteredSlashModes.length) % filteredSlashModes.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const chosen = filteredSlashModes[slashSelectedIndex];
        if (chosen) {
          selectSlashCommand(chosen.command);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsSlashMenuDismissed(true);
        return;
      }
    }

    const isAnyProcessing = attachments.some((a) => a.isProcessing);
    const readyAttachments = attachments.filter((a) => !a.isProcessing);
    const hasReadyToSend = !isAnyProcessing && (input.trim().length > 0 || readyAttachments.length > 0);

    // Ctrl+Enter or Cmd+Enter to send immediately
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (isAnyProcessing || !hasReadyToSend) return;
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Standard Enter without Shift to send
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isAnyProcessing || !hasReadyToSend) return;
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Escape while typing: stop response if generating, or blur
    if (e.key === 'Escape') {
      if (isLoading && onStopGeneration) {
        e.preventDefault();
        onStopGeneration();
      } else {
        textareaRef.current?.blur();
      }
    }
  };

  // Paper Plane / Submit / Stop Handling
  const handleSubmit = async () => {
    if (isLoading) {
      if (onStopGeneration) {
        onStopGeneration();
      }
      return;
    }

    // Do not submit while any video or media attachment is still processing
    if (attachments.some((a) => a.isProcessing)) {
      return;
    }

    // Wait for any active video processing to finish before dispatching
    if (pendingVideoJobsRef.current.size > 0) {
      try {
        await Promise.allSettled(Array.from(pendingVideoJobsRef.current.values()));
      } catch (_) {}
    }

    const readyAttachments = attachments.filter((a) => !a.isProcessing);
    const trimmed = input.trim();
    if ((!trimmed && readyAttachments.length === 0) || isForwarding || isSubmittingRef.current) return;

    if (trimmed === '/camera' && readyAttachments.length === 0 && onOpenCameraModal) {
      setInput('');
      onOpenCameraModal('select');
      return;
    }
    if (trimmed === '/mods' && onOpenModesModal) {
      setInput('');
      onOpenModesModal();
      return;
    }

    isSubmittingRef.current = true;

    if (isListening) {
      finishAndCommitListening();
    }

    // Extract image data URLs for vision processing
    const imageBase64s = readyAttachments
      .filter((a) => a.type === 'image' && a.dataUrl)
      .map((a) => a.dataUrl as string);

    // Extract video attachments and visual payloads (including any file with video extension)
    const videoAttachments = readyAttachments.filter((a) => a.type === 'video' || isVideoFile({ name: a.name }));
    const videosPayload: VideoAttachment[] = videoAttachments.map((v) => ({
      name: v.name,
      size: v.size,
      duration: v.duration,
      durationFormatted: v.durationFormatted,
      thumbnail: v.thumbnailUrl,
      dataUrl: v.dataUrl,
      keyframesCount: v.keyframes?.length || 0,
      keyframes: v.keyframes?.map((k) => ({
        timestamp: k.timestamp,
        dataUrl: k.dataUrl,
      })),
    }));

    // Collect all media parts: images + timestamped video keyframes
    const videoMediaUrls: string[] = [];
    for (const vid of videoAttachments) {
      if (vid.keyframes && vid.keyframes.length > 0) {
        for (const k of vid.keyframes) {
          if (k.dataUrl) {
            videoMediaUrls.push(k.dataUrl);
          }
        }
      } else if (vid.dataUrl) {
        videoMediaUrls.push(vid.dataUrl);
      }
    }

    const pdfMediaUrls = readyAttachments
      .filter((a) => a.dataUrl && (a.dataUrl.startsWith('data:application/pdf') || a.name?.toLowerCase().endsWith('.pdf')))
      .map((a) => a.dataUrl!);

    const allMediaUrls = [...imageBase64s, ...videoMediaUrls, ...pdfMediaUrls];

    // Non-image, non-video attachment summaries & extracted file contents
    const nonImageAttachments = readyAttachments.filter(
      (a) => a.type !== 'image' && a.type !== 'video' && !isVideoFile({ name: a.name })
    );
    let finalPayload = trimmed;
    if (attachedPrompt) {
      finalPayload = trimmed
        ? `${attachedPrompt.fullText}\n\n${trimmed}`
        : attachedPrompt.fullText;
      setAttachedPrompt(null);
    }

    if (videoAttachments.length > 0) {
      const vidSummaries = videoAttachments
        .map((v) => {
          let line = `[Uploaded Video: "${v.name}"`;
          if (v.durationFormatted) line += ` | Duration: ${v.durationFormatted}`;
          if (v.size) line += ` | File size: ${v.size}`;
          if (v.keyframes && v.keyframes.length > 0) {
            line += ` | Sampled timeline frames: ${v.keyframes.map((k) => k.timestamp).join(', ')}`;
          }
          line += `]`;
          return line;
        })
        .join('\n');

      const fullVideoAnalysisDirective =
        `Please perform a complete, in-depth second-by-second analysis of this uploaded video:\n` +
        `1. Timeline & Scene Breakdown: Break down what is happening in each second and timestamp from start to finish.\n` +
        `2. Character Identification: Identify all characters and people, their actions, expressions, and clothing. If any character is famous (celebrity, movie/TV icon, anime, superhero, athlete, streamer, or public figure), name them explicitly!\n` +
        `3. Video Type, Genre & Tags: Specify the exact video type/genre, format, and 10-15 recommended tags/hashtags.\n` +
        `4. Cinematography & Transitions: Detail camera angles, movements, and every transition effect used between cuts.\n` +
        `5. Creative Adjustments: Provide specific recommendations for pacing, lighting, color grading, and audio/visual sync to improve the video.`;

      if (trimmed) {
        finalPayload = `${trimmed}\n\n${fullVideoAnalysisDirective}\n\n${vidSummaries}`;
      } else {
        finalPayload = `${fullVideoAnalysisDirective}\n\n${vidSummaries}`;
      }
    } else if (nonImageAttachments.length > 0) {
      const attachSummary = nonImageAttachments
        .map((a) => {
          const header = `[Attachment: ${a.name} (${a.type})]${a.url ? ` ${a.url}` : ''}`;
          if (a.textContent && a.textContent.trim()) {
            return `${header}\n--- FILE CONTENT (${a.name}) ---\n${a.textContent.trim()}\n--- END FILE CONTENT ---`;
          }
          return header;
        })
        .join('\n\n');
      finalPayload = finalPayload
        ? `${finalPayload}\n\n${attachSummary}`
        : nonImageAttachments.some((a) => a.type === 'url')
        ? `What is in the URL?\n\n${attachSummary}`
        : `Please analyze and summarize this attached file:\n\n${attachSummary}`;
    }

    setIsForwarding(true);

    const wasPptMode = activePowerPointMode;
    const currentSpecial = effectiveMode;
    onSendMessage(
      finalPayload,
      allMediaUrls.length > 0 ? allMediaUrls : undefined,
      wasPptMode,
      currentSpecial,
      videosPayload.length > 0 ? videosPayload : undefined
    );
    if (currentSpecial) {
      handleSetSpecialMode(null);
    }
    setInput('');
    setAttachments([]);
    setIsPlusOpen(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setTimeout(() => {
      isSubmittingRef.current = false;
      setIsForwarding(false);
    }, 450);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setIsSlashMenuDismissed(false);
    setSlashSelectedIndex(0);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  // Feature 21: Ctrl+V / Cmd+V Clipboard Image Paste Support
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const imageFiles: File[] = [];
    if (clipboardData.items && clipboardData.items.length > 0) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
    } else if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      const pastedText = clipboardData.getData('text/plain');
      if (!pastedText || !pastedText.trim()) {
        e.preventDefault();
      }

      const promises = imageFiles.slice(0, 10).map((file, idx) => {
        return new Promise<AttachmentItem>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const ext = file.type.split('/')[1] || 'png';
            const fileName =
              file.name && file.name !== 'image.png'
                ? file.name
                : `clipboard-screenshot-${Date.now()}-${idx + 1}.${ext}`;
            resolve({
              id: `paste-img-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              type: 'image',
              name: fileName,
              dataUrl: ev.target?.result as string,
              size: `${Math.max(0.1, file.size / 1024).toFixed(1)} KB`,
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then((newItems) => {
        setAttachments((prev) => [...prev, ...newItems]);
      });
      return;
    }

    // Large prompt paste detection: turns into attached capsule with logo & heading
    const pastedText = clipboardData.getData('text/plain');
    if (
      pastedText &&
      (pastedText.length >= 200 || pastedText.split('\n').filter(Boolean).length >= 3)
    ) {
      e.preventDefault();
      const heading = extractPromptHeading(pastedText);
      setAttachedPrompt({
        heading,
        fullText: pastedText,
        charCount: pastedText.length,
      });
    }
  };

  // Process and attach video file helper
  const handleProcessVideoFile = (vf: File, customId?: string) => {
    const tempId = customId || `vid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // Add placeholder immediately with processing indicator
    setAttachments((prev) => [
      ...prev,
      {
        id: tempId,
        type: 'video',
        name: vf.name,
        size: `${(vf.size / (1024 * 1024)).toFixed(1)} MB`,
        isProcessing: true,
        processingStatus: 'Extracting frames...',
      },
    ]);

    const jobPromise = processUploadedVideo(vf, (status, pct) => {
      setAttachments((prev) =>
        prev.map((item) =>
          item.id === tempId ? { ...item, processingStatus: `${status} (${pct}%)` } : item
        )
      );
    })
      .then((payload) => {
        setAttachments((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  id: tempId,
                  type: 'video',
                  name: payload.name,
                  size: payload.sizeFormatted,
                  duration: payload.duration,
                  durationFormatted: payload.durationFormatted,
                  thumbnailUrl: payload.thumbnailUrl,
                  dataUrl: payload.videoDataUrl,
                  keyframes: payload.keyframes.map((k) => ({
                    timestamp: k.timestamp,
                    dataUrl: k.dataUrl,
                  })),
                  isProcessing: false,
                }
              : item
          )
        );
        pendingVideoJobsRef.current.delete(tempId);
        return payload;
      })
      .catch((err) => {
        console.warn('Browser video frame extraction notice:', err);
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const res = typeof ev.target?.result === 'string' ? ev.target.result : undefined;
            setAttachments((prev) =>
              prev.map((item) =>
                item.id === tempId
                  ? {
                      id: tempId,
                      type: 'video',
                      name: vf.name,
                      size: `${(vf.size / (1024 * 1024)).toFixed(1)} MB`,
                      dataUrl: res,
                      isProcessing: false,
                    }
                  : item
              )
            );
            pendingVideoJobsRef.current.delete(tempId);
            resolve();
          };
          reader.onerror = () => {
            setAttachments((prev) =>
              prev.map((item) =>
                item.id === tempId
                  ? {
                      id: tempId,
                      type: 'video',
                      name: vf.name,
                      size: `${(vf.size / (1024 * 1024)).toFixed(1)} MB`,
                      isProcessing: false,
                    }
                  : item
              )
            );
            pendingVideoJobsRef.current.delete(tempId);
            resolve();
          };
          reader.readAsDataURL(vf);
        });
      });

    pendingVideoJobsRef.current.set(tempId, jobPromise);
  };

  // Drag-and-Drop Image, Video & File Support
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = e.dataTransfer?.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    const allFiles = Array.from(droppedFiles);
    const videoFiles = allFiles.filter((f) => isVideoFile(f));
    const imageFiles = allFiles.filter((f) => !videoFiles.includes(f) && f.type.startsWith('image/'));

    if (videoFiles.length > 0) {
      videoFiles.slice(0, 3).forEach((vf, i) => {
        handleProcessVideoFile(vf, `drop-vid-${Date.now()}-${i}`);
      });
    }

    if (imageFiles.length > 0) {
      const promises = imageFiles.slice(0, 10).map((f, i) => {
        return new Promise<AttachmentItem>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              id: `drop-img-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
              type: 'image',
              name: f.name,
              dataUrl: event.target?.result as string,
              size: `${(f.size / 1024).toFixed(1)} KB`,
            });
          };
          reader.readAsDataURL(f);
        });
      });
      Promise.all(promises).then((newItems) => {
        setAttachments((prev) => [...prev, ...newItems]);
      });
    }
  };

  // Attachment Handlers supporting images, videos, and documents
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video' | 'file'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'image') {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 10);
      const promises = imageFiles.map((f, i) => {
        return new Promise<AttachmentItem>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              id: `img-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
              type: 'image',
              name: f.name,
              dataUrl: event.target?.result as string,
              size: `${(f.size / 1024).toFixed(1)} KB`,
            });
          };
          reader.readAsDataURL(f);
        });
      });

      Promise.all(promises).then((newItems) => {
        setAttachments((prev) => [...prev, ...newItems]);
      });
    } else if (type === 'video') {
      const videoFiles = Array.from(files)
        .filter((f) => isVideoFile(f))
        .slice(0, 3);

      videoFiles.forEach((vf, i) => {
        handleProcessVideoFile(vf, `vid-${Date.now()}-${i}`);
      });
    } else {
      // type === 'file': check if user selected a video, image, or PDF via generic file picker
      const fileList = Array.from(files).slice(0, 6);
      const videoFiles = fileList.filter((f) => isVideoFile(f));
      const imageFiles = fileList.filter((f) => !videoFiles.includes(f) && f.type.startsWith('image/'));
      const pdfFiles = fileList.filter(
        (f) => !videoFiles.includes(f) && !imageFiles.includes(f) && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name))
      );
      const textFiles = fileList.filter(
        (f) => !videoFiles.includes(f) && !imageFiles.includes(f) && !pdfFiles.includes(f)
      );

      // Route any selected PDF files to Base64 document pipeline
      if (pdfFiles.length > 0) {
        const pdfPromises = pdfFiles.map((f, i) => {
          return new Promise<AttachmentItem>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              resolve({
                id: `file-pdf-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
                type: 'file',
                name: f.name,
                dataUrl,
                size: `${(f.size / 1024).toFixed(1)} KB`,
                textContent: `[Uploaded Past Paper / Exam Document: "${f.name}" (${(f.size / 1024).toFixed(1)} KB)]`,
              });
            };
            reader.onerror = () => {
              resolve({
                id: `file-pdf-${Date.now()}-${i}`,
                type: 'file',
                name: f.name,
                size: `${(f.size / 1024).toFixed(1)} KB`,
              });
            };
            reader.readAsDataURL(f);
          });
        });
        Promise.all(pdfPromises).then((newItems) => {
          setAttachments((prev) => [...prev, ...newItems]);
        });
      }

      // Route any selected video files to video pipeline
      videoFiles.forEach((vf, i) => {
        handleProcessVideoFile(vf, `file-vid-${Date.now()}-${i}`);
      });

      // Route any selected image files to image pipeline
      if (imageFiles.length > 0) {
        const imgPromises = imageFiles.map((f, i) => {
          return new Promise<AttachmentItem>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve({
                id: `file-img-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
                type: 'image',
                name: f.name,
                dataUrl: event.target?.result as string,
                size: `${(f.size / 1024).toFixed(1)} KB`,
              });
            };
            reader.readAsDataURL(f);
          });
        });
        Promise.all(imgPromises).then((newItems) => {
          setAttachments((prev) => [...prev, ...newItems]);
        });
      }

      if (textFiles.length > 0) {
        const promises = textFiles.map((f, i) => {
          return new Promise<AttachmentItem>((resolve) => {
            const isReadableText =
              f.type.startsWith('text/') ||
              /\.(txt|md|csv|tsv|json|js|jsx|ts|tsx|py|html|htm|css|xml|yaml|yml|sql|sh|log|ini|env|c|cpp|h|java|go|rs|php|rb)$/i.test(
                f.name
              );
            if (isReadableText && f.size <= 2 * 1024 * 1024) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const rawText = typeof ev.target?.result === 'string' ? ev.target.result : '';
                resolve({
                  id: `att-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
                  type: 'file',
                  name: f.name,
                  textContent: rawText.slice(0, 35000),
                  size: `${(f.size / 1024).toFixed(1)} KB`,
                });
              };
              reader.onerror = () => {
                resolve({
                  id: `att-${Date.now()}-${i}`,
                  type: 'file',
                  name: f.name,
                  size: `${(f.size / 1024).toFixed(1)} KB`,
                });
              };
              reader.readAsText(f);
            } else {
              resolve({
                id: `att-${Date.now()}-${i}`,
                type: 'file',
                name: f.name,
                size: `${(f.size / 1024).toFixed(1)} KB`,
              });
            }
          });
        });

        Promise.all(promises).then((newItems) => {
          setAttachments((prev) => [...prev, ...newItems]);
        });
      }
    }

    setIsPlusOpen(false);
    e.target.value = '';
  };

  const handleAddUrl = (url: string) => {
    setAttachments((prev) => [
      ...prev,
      {
        id: `url-${Date.now()}`,
        type: 'url',
        name: url,
        url,
      },
    ]);
    if (!input.trim()) {
      setInput('What is in the URL?');
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Check if any attachment is currently processing/extracting frames/uploading
  const isAnyProcessing = attachments.some((a) => a.isProcessing);
  // Fully processed and ready attachments
  const readyAttachments = attachments.filter((a) => !a.isProcessing);
  // Can only send when processing is finished AND there is text or at least one ready attachment
  const isReadyToSend = !isAnyProcessing && (input.trim().length > 0 || readyAttachments.length > 0);
  // When nothing is typed and no fully-processed attachments are ready yet, show the live voice assistant button (matching the empty type bar state)
  const showLiveAssistant = !isReadyToSend && !input.trim() && readyAttachments.length === 0 && !isLoading && !!onOpenLiveAssistant;

  // Static Theme Color styling customized directly from the Personality Tab
  const activeThemeColor = themeColorHex || '#00ea77';
  const activeBgColor = taskbarBgColor || (darkMode ? '#0e1626' : '#ffffff');
  const isGlass = taskbarStyleMode === 'glass';

  const containerStyle: React.CSSProperties = {
    backgroundColor: isGlass
      ? `${activeBgColor}${darkMode ? 'e6' : 'f2'}`
      : activeBgColor,
    borderColor: isFocused
      ? activeThemeColor
      : `${activeThemeColor}55`,
    boxShadow: isFocused
      ? `0 0 20px ${activeThemeColor}44, 0 0 40px ${activeThemeColor}18, inset 0 0 10px ${activeThemeColor}10`
      : `0 4px 20px rgba(0,0,0,0.25), 0 0 12px ${activeThemeColor}15`,
  };

  return (
    <footer
      id="chat-input-bar"
      style={{
        borderTopColor: `${activeThemeColor}30`,
      }}
      className={`sticky bottom-0 z-20 w-full px-3 sm:px-8 py-2 sm:py-3.5 transition-colors border-t relative ${
        darkMode
          ? 'bg-[#0b0f17]/90 text-white backdrop-blur-lg'
          : 'bg-slate-50/90 text-slate-900 shadow-xs backdrop-blur-lg'
      }`}
    >
      {/* Constant Still Scroll-to-Latest Arrow Button anchored right above the composer bar */}
      {showScrollToLatest && onScrollToLatest && (
        <div className="absolute -top-13 left-0 right-0 flex justify-center pointer-events-none z-40">
          <button
            id="scroll-to-latest-btn"
            type="button"
            onClick={onScrollToLatest}
            className={`pointer-events-auto w-10 h-10 rounded-full aspect-square border shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
              darkMode
                ? 'bg-[#131924]/95 text-slate-100 hover:bg-[#1a2232]'
                : 'bg-white/95 text-slate-800 hover:bg-slate-100'
            }`}
            style={{
              borderColor: activeThemeColor,
              boxShadow: `0 6px 24px rgba(0,0,0,0.55), 0 0 16px ${activeThemeColor}45`,
            }}
            title="Scroll to latest message"
            aria-label="Scroll to latest message"
          >
            <ArrowDown
              className="w-4 h-4 stroke-[2.5]"
              style={{
                color: activeThemeColor,
                filter: `drop-shadow(0 0 6px ${activeThemeColor}80)`,
              }}
            />
          </button>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Hidden File Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'image')}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'video')}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'file')}
        />

        {/* Add URL Dialog */}
        <AddUrlModal
          isOpen={isUrlModalOpen}
          onClose={() => setIsUrlModalOpen(false)}
          onAddUrl={handleAddUrl}
        />

        {/* Mic Blocked Alert Toast */}
        {micBlockedError && (
          <div
            id="mic-blocked-banner"
            className="mb-2 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{micBlockedError}</span>
            </div>
            <button
              type="button"
              onClick={() => setMicBlockedError(null)}
              className="p-1 text-rose-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attachments Preview Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-2 p-2 rounded-2xl bg-[#14161d] border border-white/5">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#1e222c] border border-white/10 text-xs text-slate-200 shadow-sm"
              >
                {att.type === 'image' && att.dataUrl ? (
                  <button
                    type="button"
                    onClick={() => onOpenImageInEditor && onOpenImageInEditor(att.dataUrl!)}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="Click to draw or annotate in canvas editor"
                  >
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded object-cover border border-white/20"
                    />
                    <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                  </button>
                ) : att.type === 'video' ? (
                  <div className="flex items-center gap-1.5">
                    {att.isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin flex-shrink-0" />
                    ) : att.thumbnailUrl ? (
                      <img
                        src={att.thumbnailUrl}
                        alt={att.name}
                        className="w-5 h-5 rounded object-cover border border-purple-500/40 flex-shrink-0"
                      />
                    ) : (
                      <Video className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    )}
                    <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                    {att.durationFormatted && (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {att.durationFormatted}
                      </span>
                    )}
                    {att.isProcessing && (
                      <span className="text-[10px] text-purple-300/80 animate-pulse">
                        {att.processingStatus || 'Extracting frames...'}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                  </div>
                )}
                {att.size && <span className="text-[10px] text-slate-400">{att.size}</span>}
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* MOBILE Above-Type-Bar Three-Dot Toggle + Staggered Circular Feature Icons (Pen, Page, Code, Book) */}
        <div className="flex sm:hidden items-center gap-2 mb-2.5 px-0.5">
          <button
            id="mobile-composer-three-dot-btn"
            type="button"
            onClick={() => setIsMobileShortcutsOpen((prev) => !prev)}
            title="Toggle quick tools (Draw, Summarize, Code, Explain)"
            aria-label="Toggle quick tools"
            aria-expanded={isMobileShortcutsOpen}
            style={{
              borderColor: isMobileShortcutsOpen ? activeThemeColor : `${activeThemeColor}55`,
              backgroundColor: isMobileShortcutsOpen ? `${activeThemeColor}22` : '#131924',
              color: isMobileShortcutsOpen ? activeThemeColor : '#cbd5e1',
              boxShadow: isMobileShortcutsOpen ? `0 0 14px ${activeThemeColor}40` : undefined,
            }}
            className="w-10 h-10 rounded-full aspect-square p-0 border flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-md"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMobileShortcutsOpen && (
            <div
              id="mobile-composer-staggered-shortcuts"
              className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
            >
              {onOpenModesModal && (
                <button
                  id="mobile-feature-modes-btn"
                  type="button"
                  onClick={() => {
                    setIsMobileShortcutsOpen(false);
                    onOpenModesModal();
                  }}
                  title="Sigma AI 100+ Mods"
                  aria-label="Sigma AI 100+ Mods"
                  style={{ animationDelay: '0ms' }}
                  className="w-10 h-10 aspect-square p-0 rounded-full border border-amber-500/80 bg-amber-950/40 text-amber-300 flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-md animate-three-dot-emerge"
                >
                  <span className="text-sm font-bold">⚡</span>
                </button>
              )}
              {onOpenDraw && (
                <button
                  id="mobile-feature-draw-btn"
                  type="button"
                  onClick={() => {
                    setIsMobileShortcutsOpen(false);
                    onOpenDraw();
                  }}
                  title={getTranslation(language, 'draw')}
                  aria-label={getTranslation(language, 'draw')}
                  style={{ animationDelay: '35ms' }}
                  className="w-10 h-10 aspect-square p-0 rounded-full border border-fuchsia-500/75 bg-fuchsia-950/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-md animate-three-dot-emerge"
                >
                  <PenTool className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                </button>
              )}
              {onOpenSummarize && (
                <button
                  id="mobile-feature-summarize-btn"
                  type="button"
                  onClick={() => {
                    setIsMobileShortcutsOpen(false);
                    onOpenSummarize();
                  }}
                  title={getTranslation(language, 'summarize')}
                  aria-label={getTranslation(language, 'summarize')}
                  style={{ animationDelay: '70ms' }}
                  className="w-10 h-10 aspect-square p-0 rounded-full border border-teal-400/75 bg-teal-950/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-md animate-three-dot-emerge"
                >
                  <FileText className="w-4 h-4 text-teal-400 flex-shrink-0" />
                </button>
              )}
              {onOpenCode && (
                <button
                  id="mobile-feature-code-btn"
                  type="button"
                  onClick={() => {
                    setIsMobileShortcutsOpen(false);
                    onOpenCode();
                  }}
                  title={getTranslation(language, 'code')}
                  aria-label={getTranslation(language, 'code')}
                  style={{
                    animationDelay: '105ms',
                    borderColor: `${activeThemeColor}75`,
                  }}
                  className="w-10 h-10 aspect-square p-0 rounded-full border bg-[#131924] text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-md animate-three-dot-emerge"
                >
                  <Code2 className="w-4 h-4 flex-shrink-0" style={{ color: activeThemeColor }} />
                </button>
              )}
              {onOpenExplain && (
                <button
                  id="mobile-feature-explain-btn"
                  type="button"
                  onClick={() => {
                    setIsMobileShortcutsOpen(false);
                    onOpenExplain();
                  }}
                  title={getTranslation(language, 'explain')}
                  aria-label={getTranslation(language, 'explain')}
                  style={{ animationDelay: '140ms' }}
                  className="w-10 h-10 aspect-square p-0 rounded-full border border-amber-500/75 bg-amber-950/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-md animate-three-dot-emerge"
                >
                  <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* DESKTOP Feature Shortcut Buttons above type bar */}
        <div className="hidden sm:grid sm:grid-cols-5 sm:gap-2 mb-2.5">
          {onOpenModesModal && (
            <button
              id="feature-modes-btn"
              type="button"
              onClick={onOpenModesModal}
              title="Sigma AI 100+ Mods"
              aria-label="Sigma AI 100+ Mods"
              className="w-11 h-11 sm:w-auto sm:h-auto aspect-square sm:aspect-auto p-0 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl border flex items-center justify-center sm:justify-start gap-1.5 text-xs transition-all cursor-pointer font-bold flex-shrink-0 border-amber-500/60 bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-300 hover:border-amber-400 hover:text-amber-200 shadow-2xs"
            >
              <span className="text-sm">⚡</span>
              <span className="hidden sm:inline truncate">100+ Mods</span>
            </button>
          )}
          {onOpenDraw && (
            <button
              id="feature-draw-btn"
              type="button"
              onClick={onOpenDraw}
              title={getTranslation(language, 'draw')}
              aria-label={getTranslation(language, 'draw')}
              className={`w-11 h-11 sm:w-auto sm:h-auto aspect-square sm:aspect-auto p-0 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl border flex items-center justify-center sm:justify-start gap-1.5 text-xs transition-all cursor-pointer font-medium flex-shrink-0 ${
                darkMode
                  ? 'border-fuchsia-500/70 bg-fuchsia-950/20 text-white sm:bg-[#131924] sm:border-slate-800 sm:hover:border-slate-700 sm:text-slate-300 sm:hover:text-white'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <PenTool className="w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-fuchsia-400 sm:text-inherit" />
              <span className="hidden sm:inline truncate">{getTranslation(language, 'draw')}</span>
            </button>
          )}
          {onOpenSummarize && (
            <button
              id="feature-summarize-btn"
              type="button"
              onClick={onOpenSummarize}
              title={getTranslation(language, 'summarize')}
              aria-label={getTranslation(language, 'summarize')}
              className={`w-11 h-11 sm:w-auto sm:h-auto aspect-square sm:aspect-auto p-0 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl border flex items-center justify-center sm:justify-start gap-1.5 text-xs transition-all cursor-pointer font-medium flex-shrink-0 ${
                darkMode
                  ? 'border-teal-400/70 bg-teal-950/20 text-white sm:bg-[#131924] sm:border-slate-800 sm:hover:border-slate-700 sm:text-slate-300 sm:hover:text-white'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <FileText className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-teal-400 sm:text-amber-400 flex-shrink-0" />
              <span className="hidden sm:inline truncate">{getTranslation(language, 'summarize')}</span>
            </button>
          )}
          {onOpenCode && (
            <button
              id="feature-code-btn"
              type="button"
              onClick={onOpenCode}
              title={getTranslation(language, 'code')}
              aria-label={getTranslation(language, 'code')}
              className={`w-11 h-11 sm:w-auto sm:h-auto aspect-square sm:aspect-auto p-0 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl border flex items-center justify-center sm:justify-start gap-1.5 text-xs transition-all cursor-pointer font-medium active:scale-95 shadow-2xs flex-shrink-0 ${
                darkMode
                  ? 'bg-[#131924] border-slate-800 hover:border-slate-700 hover:bg-[#182030]'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs'
              }`}
            >
              <Code2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0" style={{ color: activeThemeColor }} />
              <span className="hidden sm:inline truncate font-semibold" style={{ color: activeThemeColor }}>
                {getTranslation(language, 'code')}
              </span>
            </button>
          )}
          {onOpenExplain && (
            <button
              id="feature-explain-btn"
              type="button"
              onClick={onOpenExplain}
              title={getTranslation(language, 'explain')}
              aria-label={getTranslation(language, 'explain')}
              className={`w-11 h-11 sm:w-auto sm:h-auto aspect-square sm:aspect-auto p-0 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl border flex items-center justify-center sm:justify-start gap-1.5 text-xs transition-all cursor-pointer font-medium flex-shrink-0 ${
                darkMode
                  ? 'border-amber-500/70 bg-amber-950/20 text-white sm:bg-[#131924] sm:border-slate-800 sm:hover:border-slate-700 sm:text-slate-300 sm:hover:text-white'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <BookOpen className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400 sm:text-rose-400 flex-shrink-0" />
              <span className="hidden sm:inline truncate">{getTranslation(language, 'explain')}</span>
            </button>
          )}
        </div>

        {/* The Type Bar Box */}
        <div className="relative w-full" ref={plusMenuRef}>
          {/* Active Mode Indicator Above Typing Area (PowerPoint, Excel, Deep Search, Deep Think, Web Search) */}
          {effectiveMode && (
            <div
              id="composer-active-mode-indicator"
              className={`mb-2 flex items-center justify-between gap-2.5 w-fit max-w-full px-3 py-1.5 rounded-full border text-xs font-semibold shadow-lg animate-in fade-in duration-150 ${
                effectiveMode === 'powerpoint'
                  ? 'bg-violet-950/85 border-violet-500/50 text-violet-200'
                  : effectiveMode === 'excel'
                  ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-200'
                  : effectiveMode === 'deep_search'
                  ? 'bg-cyan-950/85 border-cyan-500/50 text-cyan-200'
                  : effectiveMode === 'deep_think'
                  ? 'bg-amber-950/85 border-amber-500/50 text-amber-200'
                  : 'bg-blue-950/85 border-blue-500/50 text-blue-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {effectiveMode === 'powerpoint' && (
                  <>
                    <PowerPointSlideIcon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    <span className="truncate">PowerPoint mode</span>
                    <span className="hidden sm:inline text-[10px] font-normal text-violet-300/80">
                      · Next request will create a PowerPoint presentation
                    </span>
                  </>
                )}
                {effectiveMode === 'excel' && (
                  <>
                    <ExcelSpreadsheetIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">Excel mode</span>
                    <span className="hidden sm:inline text-[10px] font-normal text-emerald-300/80">
                      · Next request will create an Excel workbook (.xlsx)
                    </span>
                  </>
                )}
                {effectiveMode === 'deep_search' && (
                  <>
                    <Search className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="truncate">Deep Search mode</span>
                    <span className="hidden sm:inline text-[10px] font-normal text-cyan-300/80">
                      · Multi-source comprehensive research
                    </span>
                  </>
                )}
                {effectiveMode === 'deep_think' && (
                  <>
                    <Brain className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">Deep Think mode</span>
                    <span className="hidden sm:inline text-[10px] font-normal text-amber-300/80">
                      · Step-by-step analytical reasoning
                    </span>
                  </>
                )}
                {effectiveMode === 'web_search' && (
                  <>
                    <Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="truncate">Web Search mode</span>
                    <span className="hidden sm:inline text-[10px] font-normal text-blue-300/80">
                      · Grounded live web facts & synthesis
                    </span>
                  </>
                )}
              </div>
              <button
                id="composer-mode-close-btn"
                type="button"
                onClick={() => handleSetSpecialMode(null)}
                className="p-0.5 rounded-full hover:bg-white/10 text-current hover:text-white transition-colors cursor-pointer flex-shrink-0"
                title="Deactivate active mode"
                aria-label="Deactivate active mode"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Categorized Plus (+) Menu Popup */}
          {isPlusOpen && (
            <div
              id="plus-menu-dropdown"
              className="absolute left-0 bottom-full mb-3 w-72 sm:w-80 max-h-[78vh] overflow-y-auto bg-[#14161f] border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-xl"
            >
              {/* 0. SIGMA MODES SECTION */}
              <div className="mb-2">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>SIGMA MODES</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30">100+</span>
                </div>
                <button
                  id="plus-menu-modes-btn"
                  type="button"
                  onClick={() => {
                    setIsPlusOpen(false);
                    if (onOpenModesModal) onOpenModesModal();
                  }}
                  className="w-full flex items-center gap-3 px-2.5 py-2 text-xs rounded-xl transition-colors cursor-pointer text-slate-200 hover:bg-slate-800/80 border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    ⚡
                  </div>
                  <div className="text-left min-w-0">
                    <span className="font-semibold block truncate text-amber-200">100+ Pro Modes (/modes)</span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      Gamer, Voice, Ghost, Rizz, Grind, etc.
                    </span>
                  </div>
                </button>
              </div>

              <div className="my-1.5 border-t border-slate-800/80" />

              {/* 1. CREATE SECTION */}
              <div className="mb-2">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  CREATE
                </div>
                <div className="space-y-0.5">
                  <button
                    id="plus-menu-powerpoint-btn"
                    type="button"
                    onClick={() => {
                      handleSetSpecialMode('powerpoint');
                      setIsPlusOpen(false);
                      setTimeout(() => textareaRef.current?.focus(), 20);
                    }}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                      effectiveMode === 'powerpoint'
                        ? 'bg-violet-600/20 text-violet-200 border border-violet-500/40'
                        : 'text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                      <PowerPointSlideIcon className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-semibold block truncate">PowerPoint Presentation</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        16:9 visual slides & .pptx export
                      </span>
                    </div>
                  </button>

                  <button
                    id="plus-menu-excel-btn"
                    type="button"
                    onClick={() => {
                      handleSetSpecialMode('excel');
                      setIsPlusOpen(false);
                      setTimeout(() => textareaRef.current?.focus(), 20);
                    }}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                      effectiveMode === 'excel'
                        ? 'bg-emerald-600/20 text-emerald-200 border border-emerald-500/40'
                        : 'text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <ExcelSpreadsheetIcon className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-semibold block truncate">Excel Spreadsheet</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Multi-sheet formulas, charts & .xlsx
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="my-1.5 border-t border-slate-800/80" />

              {/* 2. UPLOAD SECTION */}
              <div className="mb-2">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  UPLOAD
                </div>
                <div className="space-y-0.5">
                  {/* Real In-App Camera Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusOpen(false);
                      if (onOpenCameraModal) {
                        onOpenCameraModal('camera');
                      }
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 text-xs text-purple-200 hover:text-white hover:bg-purple-950/40 rounded-xl transition-colors cursor-pointer border border-purple-500/20"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-semibold block truncate">
                        {getTranslation(language, 'camera')}
                      </span>
                      <span className="text-[10px] text-purple-300/70 block truncate">
                        Live photo capture & solve
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                      <Image className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-semibold block truncate">
                        {getTranslation(language, 'uploadImages')}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Photos, diagrams, mockups
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-semibold block truncate">
                        {getTranslation(language, 'uploadVideo')}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        MP4, WebM clips
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-semibold block truncate">
                        {getTranslation(language, 'uploadFile')}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        PDF, TXT, CSV, Docs
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusOpen(false);
                      setIsUrlModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-semibold block truncate">
                        {getTranslation(language, 'addUrl')}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Fetch live web content
                      </span>
                    </div>
                  </button>

                  {/* Google Drive Cloud Integration */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusOpen(false);
                      if (onOpenConnections) {
                        onOpenConnections();
                      }
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0">
                        <span className="font-semibold block truncate">Google Drive</span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {typeof window !== 'undefined' && localStorage.getItem('sigma_drive_connected') === 'true'
                            ? 'Connected • Read-only access'
                            : 'Link cloud account & pick files'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border flex-shrink-0 ${
                        typeof window !== 'undefined' && localStorage.getItem('sigma_drive_connected') === 'true'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {typeof window !== 'undefined' && localStorage.getItem('sigma_drive_connected') === 'true'
                        ? 'Connected'
                        : 'Link'}
                    </span>
                  </button>

                  {/* Connected Services & Hardware */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusOpen(false);
                      if (onOpenConnections) {
                        onOpenConnections();
                      }
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-semibold block truncate">Connected Services</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Camera, Mic, Drive & Permissions
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="my-1.5 border-t border-slate-800/80" />

              {/* 3. THINK & RESEARCH SECTION */}
              <div>
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  THINK & RESEARCH
                </div>
                <div className="space-y-0.5">
                  <button
                    id="plus-menu-deep-search-btn"
                    type="button"
                    onClick={() => {
                      handleSetSpecialMode('deep_search');
                      setIsPlusOpen(false);
                      setTimeout(() => textareaRef.current?.focus(), 20);
                    }}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                      effectiveMode === 'deep_search'
                        ? 'bg-cyan-600/20 text-cyan-200 border border-cyan-500/40'
                        : 'text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Search className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-semibold block truncate">Deep Search</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Exhaustive multi-angle investigation
                      </span>
                    </div>
                  </button>

                  <button
                    id="plus-menu-deep-think-btn"
                    type="button"
                    onClick={() => {
                      handleSetSpecialMode('deep_think');
                      setIsPlusOpen(false);
                      setTimeout(() => textareaRef.current?.focus(), 20);
                    }}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                      effectiveMode === 'deep_think'
                        ? 'bg-amber-600/20 text-amber-200 border border-amber-500/40'
                        : 'text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-semibold block truncate">Deep Think</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Step-by-step reasoning & logic breakdown
                      </span>
                    </div>
                  </button>

                  <button
                    id="plus-menu-web-search-btn"
                    type="button"
                    onClick={() => {
                      handleSetSpecialMode('web_search');
                      setIsPlusOpen(false);
                      setTimeout(() => textareaRef.current?.focus(), 20);
                    }}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                      effectiveMode === 'web_search'
                        ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40'
                        : 'text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-semibold block truncate">Web Search</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Real-time web knowledge & citations
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Slash Command Autocomplete Popover */}
          {isSlashMenuOpen && (
            <div
              id="slash-command-autocomplete"
              className="absolute left-0 bottom-full mb-2 w-full max-w-lg max-h-72 overflow-y-auto bg-[#10141e]/95 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-40 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
              style={{
                boxShadow: `0 10px 30px rgba(0,0,0,0.8), 0 0 20px ${activeThemeColor}20`,
              }}
            >
              <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-1.5 mb-1">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span>⚡</span> Sigma Modes ({filteredSlashModes.length})
                </span>
                <span className="font-normal text-[10px] text-slate-500">↑↓ navigate • Enter select • Esc close</span>
              </div>
              <div className="space-y-0.5">
                {filteredSlashModes.map((mode, idx) => {
                  const isSelected = idx === slashSelectedIndex;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onMouseEnter={() => setSlashSelectedIndex(idx)}
                      onClick={() => selectSlashCommand(mode.command)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/20 text-white border border-emerald-500/40'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base flex-shrink-0">{mode.icon}</span>
                        <div className="min-w-0 truncate">
                          <span className="font-bold text-xs font-mono text-emerald-400 mr-2">{mode.command}</span>
                          <span className="text-xs text-slate-200 font-medium truncate">{mode.title}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0 hidden sm:inline">
                        {mode.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Animated & Interactive Type Bar Capsule OR Voice Recording Toolbar */}
          {/* Screenshot 9: Attached Pasted Text Chip Pill */}
          {attachedPrompt && (
            <div
              id="attached-pasted-text-chip"
              className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full sm:rounded-xl bg-[#171c28] border border-blue-500/30 text-xs text-slate-200 shadow-md w-fit max-w-full animate-in fade-in slide-in-from-bottom-1"
            >
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <FileText className="w-3 h-3" />
              </div>
              <div className="min-w-0 flex items-center gap-2 truncate">
                <span className="font-medium text-white truncate max-w-[150px] sm:max-w-[280px]">
                  {attachedPrompt.heading}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono flex-shrink-0">
                  Pasted text
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedPrompt(null)}
                className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Remove pasted text"
                aria-label="Remove pasted text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isListening ? (
            <AudioWaveBar
              isListening={isListening}
              onStopListening={finishAndCommitListening}
              onCancelListening={cancelListening}
              onSendListening={sendFromListening}
              stream={audioStream}
              themeColorHex={activeThemeColor}
            />
          ) : (
            <div
              id="chat-input-capsule"
              style={containerStyle}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-full sm:rounded-2xl px-2.5 sm:px-3 py-1.5 sm:py-2 transition-all duration-300 ease-out border ${
                isGlass ? 'backdrop-blur-xl' : ''
              } ${
                isFocused
                  ? 'scale-[1.01] sm:scale-[1.012]'
                  : 'scale-100 hover:border-slate-600'
              }`}
            >
            {/* Left '+' Icon */}
            <button
              id="chat-plus-menu-btn"
              type="button"
              onClick={() => setIsPlusOpen((prev) => !prev)}
              className={`p-1.5 sm:p-2 rounded-full sm:rounded-xl transition-all cursor-pointer flex-shrink-0 ${
                darkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              } ${isPlusOpen && !stopAnimations ? 'rotate-45 text-white bg-slate-800' : ''}`}
              title="Add attachments"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Auto-expanding Textarea with Dynamic Typewriter Placeholder & Ctrl+V Image Paste */}
            <textarea
              id="chat-message-input"
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                displayedPlaceholder || getTranslation(language, 'typeMessage')
              }
              rows={1}
              className={`flex-1 bg-transparent text-xs sm:text-base resize-none outline-none max-h-36 py-1 leading-relaxed ${
                darkMode
                  ? 'text-slate-100 placeholder-slate-400/80'
                  : 'text-slate-900 placeholder-slate-500'
              }`}
            />

            {/* Voice Input Mic Button - Turns into Cross (X) when listening, commits speech upon click */}
            <button
              id="chat-voice-input-btn"
              type="button"
              onClick={toggleMic}
              className={`p-1.5 sm:p-2 rounded-full sm:rounded-xl transition-all cursor-pointer flex-shrink-0 active:scale-95 ${
                isListening
                  ? `bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 shadow-xs ${
                      stopAnimations ? '' : 'animate-pulse'
                    }`
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
              title={isListening ? 'Done (Finish transcription)' : getTranslation(language, 'voiceInput')}
              aria-label={isListening ? 'Done transcribing' : 'Voice Input'}
            >
              {isListening ? <X className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Dynamic Primary Action Button: Perfect Circle with 4-Bar Live Logo when empty, Send when content exists and ready, Stop when generating */}
            {showLiveAssistant ? (
              <button
                id="chat-live-assistant-btn"
                type="button"
                onClick={onOpenLiveAssistant}
                className="w-9 h-9 sm:w-10 sm:h-10 aspect-square p-0 rounded-full border transition-all cursor-pointer flex-shrink-0 flex items-center justify-center active:scale-95 shadow-md"
                style={{
                  borderColor: `${activeThemeColor}75`,
                  backgroundColor: `${activeThemeColor}20`,
                  color: activeThemeColor,
                  boxShadow: `0 0 14px ${activeThemeColor}33`,
                }}
                title="Open Sigma Live Voice Assistant"
                aria-label="Live Voice Assistant"
              >
                <div className="flex items-center justify-center gap-[2.5px] h-4">
                  <span
                    className={`w-[2px] h-2 rounded-full ${stopAnimations ? '' : 'animate-pulse'}`}
                    style={{ backgroundColor: activeThemeColor }}
                  />
                  <span
                    className={`w-[2px] h-4 rounded-full ${stopAnimations ? '' : 'animate-pulse delay-75'}`}
                    style={{ backgroundColor: activeThemeColor }}
                  />
                  <span
                    className={`w-[2px] h-3 rounded-full ${stopAnimations ? '' : 'animate-pulse delay-150'}`}
                    style={{ backgroundColor: activeThemeColor }}
                  />
                  <span
                    className={`w-[2px] h-1.5 rounded-full ${stopAnimations ? '' : 'animate-pulse delay-200'}`}
                    style={{ backgroundColor: activeThemeColor }}
                  />
                </div>
              </button>
            ) : (
              <button
                id="chat-submit-btn"
                ref={sendBtnRef}
                type="button"
                onClick={handleSubmit}
                disabled={(!isReadyToSend && !isLoading) || isForwarding}
                className={`w-9 h-9 sm:w-10 sm:h-10 aspect-square p-0 rounded-full transition-all flex-shrink-0 flex items-center justify-center ${
                  isLoading
                    ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-md cursor-pointer'
                    : isReadyToSend
                    ? 'text-black shadow-md cursor-pointer active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
                style={{
                  backgroundColor: isLoading ? undefined : isReadyToSend ? (themeColorHex || '#E50914') : undefined,
                  boxShadow: isReadyToSend ? `0 0 14px ${(themeColorHex || '#E50914')}66` : undefined,
                }}
                title={
                  isLoading
                    ? 'Stop response (Esc)'
                    : isAnyProcessing
                    ? 'Please wait for file/video to finish loading...'
                    : `Send message (${isMac ? '⌘' : 'Ctrl'}+Enter)`
                }
              >
                {isLoading ? (
                  <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                ) : isForwarding ? (
                  <Loader2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stopAnimations ? '' : 'animate-spin'}`} />
                ) : (
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            )}
          </div>
          )}
        </div>

        {/* Mandatory UI Disclaimer permanently anchored at the absolute bottom of the typing bar interface */}
        <div
          id="sigma-ai-disclaimer"
          className="text-center text-[11px] sm:text-xs text-slate-400 font-medium pt-2 pb-0.5 select-none transition-opacity tracking-wide"
        >
          Sigma AI is an AI and can make mistakes.
        </div>
      </div>
    </footer>
  );
};
