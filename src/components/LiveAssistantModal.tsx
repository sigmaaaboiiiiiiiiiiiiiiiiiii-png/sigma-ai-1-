import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import {
  getSavedTtsVoice,
  resolveSpeechVoice,
  speakChunkedWithGuard,
  clearSpeechKeepAlive,
} from '../lib/ttsVoiceEngine';
import { getThemeColor } from '../lib/theme';
import { UserProfile } from '../types';

interface LiveAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage?: (...args: any[]) => any;
  isLoading?: boolean;
  themeHex?: string;
  stopAnimations?: boolean;
  user?: UserProfile | null;
  userName?: string;
  userOccupation?: string;
  userInterests?: string;
  userExtraInfo?: string;
  customInstructions?: string;
  aiTone?: string;
  aiWarmth?: string;
  aiEnthusiasm?: string;
  aiEmojiUsage?: string;
  isOwner?: boolean;
  authenticatedEmail?: string | null;
  themeColorHex?: string;
  onSyncTurnToMainChat?: (userText: string, aiReply: string) => void;
}

type LiveState = 'listening' | 'user_speaking' | 'responding' | 'ai_speaking' | 'muted';

interface SmokeParticle {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  vx: number;
  vy: number;
  alpha: number;
  age: number;
  lifespan: number;
  seed: number;
  wanderSpeed: number;
  rotation: number;
  vRot: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = (hex || '#ec4899').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 236, g: 72, b: 153 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export const LiveAssistantModal: React.FC<LiveAssistantModalProps> = ({
  isOpen,
  onClose,
  themeHex = '#ec4899',
  themeColorHex = '#ec4899',
  user,
  userName = '',
  userOccupation,
  userInterests,
  userExtraInfo,
  customInstructions,
  aiTone,
  aiWarmth,
  aiEnthusiasm,
  aiEmojiUsage,
  isOwner = false,
  authenticatedEmail = null,
  onSyncTurnToMainChat,
}) => {
  // Dynamically synchronize cloud color with personalization settings (the Color tab)
  const [personalizationColor, setPersonalizationColor] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('sigma_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.themeColor) {
          const tc = getThemeColor(parsed.themeColor, parsed.customThemeColor);
          if (tc?.hex) return tc.hex;
        }
      }
    } catch (_) {}
    return themeColorHex || themeHex || '#ec4899';
  });

  useEffect(() => {
    const syncTheme = () => {
      try {
        const raw = localStorage.getItem('sigma_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.themeColor) {
            const tc = getThemeColor(parsed.themeColor, parsed.customThemeColor);
            if (tc?.hex) {
              setPersonalizationColor(tc.hex);
              return;
            }
          }
        }
      } catch (_) {}
      if (themeColorHex || themeHex) {
        setPersonalizationColor(themeColorHex || themeHex);
      }
    };

    syncTheme();
    window.addEventListener('storage', syncTheme);
    window.addEventListener('sigma-theme-changed', syncTheme);
    return () => {
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener('sigma-theme-changed', syncTheme);
    };
  }, [themeColorHex, themeHex]);

  const activeColor = personalizationColor;
  const rgb = hexToRgb(activeColor);
  const effectiveUserName = (userName || user?.name || '').trim();

  // Core Live State
  const [liveState, setLiveState] = useState<LiveState>('listening');
  const [captionText, setCaptionText] = useState<string>('');
  const [captionSpeaker, setCaptionSpeaker] = useState<'user' | 'ai' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Refs for audio, speech, and animation
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const isSpeakerMutedRef = useRef(isSpeakerMuted);
  isSpeakerMutedRef.current = isSpeakerMuted;
  const liveStateRef = useRef<LiveState>(liveState);
  liveStateRef.current = liveState;

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const accumulatedTranscriptRef = useRef('');
  const silenceTimerRef = useRef<any>(null);
  const isAiSpeakingRef = useRef(false);
  const lastAiSpokenTextRef = useRef('');
  const aiSpeakingFinishedAtRef = useRef(0);
  const isProcessingTurnRef = useRef(false);
  const turnsHistoryRef = useRef<Array<{ role: 'user' | 'model'; content: string }>>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smokeParticlesRef = useRef<SmokeParticle[]>([]);
  const aiZoomPhaseRef = useRef<number>(0);

  // Initialize realistic drifting smoke particles inside the circle (billowing "here and there")
  const initSmokeParticles = useCallback(() => {
    const particles: SmokeParticle[] = [];
    const count = 44;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 48;
      const baseRadius = 24 + Math.random() * 32;
      const lifespan = 130 + Math.random() * 180;
      particles.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35 - 0.15, // gentle natural smoke rise
        radius: baseRadius,
        baseRadius,
        alpha: 0,
        age: Math.floor(Math.random() * lifespan),
        lifespan,
        seed: Math.random() * 100,
        wanderSpeed: 0.2 + Math.random() * 0.42,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.008,
      });
    }
    smokeParticlesRef.current = particles;
  }, []);

  // Update Live State
  const updateLiveState = useCallback((next: LiveState) => {
    setLiveState(next);
    liveStateRef.current = next;
  }, []);

  // Mobile Audio Unlock: Synchronously primes AudioContext & SpeechSynthesis on user touch/click
  const unlockMobileAudio = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
        const dummy = new SpeechSynthesisUtterance('');
        dummy.volume = 0;
        dummy.rate = 10;
        window.speechSynthesis.speak(dummy);
      }
    } catch (_) {}
  }, []);

  // Subtle Chime Sound
  const playChime = useCallback((freqStart: number, freqEnd: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.17);
      setTimeout(() => {
        try {
          ctx.close();
        } catch (_) {}
      }, 250);
    } catch (_) {}
  }, []);

  // Stop AI Speech Immediately
  const stopAiSpeakingImmediately = useCallback((switchToListening = true) => {
    isAiSpeakingRef.current = false;
    clearSpeechKeepAlive();
    aiSpeakingFinishedAtRef.current = Date.now();
    if (switchToListening && isOpenRef.current) {
      if (isMutedRef.current) {
        updateLiveState('muted');
      } else {
        updateLiveState('listening');
        // Restart speech recognition so user can speak immediately
        try {
          recognitionRef.current?.start();
        } catch (_) {}
      }
    }
  }, [updateLiveState]);

  // Speak AI response with voice synthesis (Mobile-friendly: stops mic during TTS to avoid OS mute/ducking)
  const speakAiResponse = useCallback(
    (text: string) => {
      const cleanText = String(text || '').trim();
      if (!cleanText || !isOpenRef.current) {
        if (!isMutedRef.current) updateLiveState('listening');
        return;
      }

      if (isSpeakerMutedRef.current) {
        if (!isMutedRef.current) updateLiveState('listening');
        else updateLiveState('muted');
        return;
      }

      // Mobile Audio Optimization: Pause SpeechRecognition while AI is speaking
      // so mobile OS (iOS/Android) doesn't duck or mute speaker playback due to mic contention
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        }
      } catch (_) {}

      // Prime speech synthesis on mobile browsers
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
        } catch (_) {}
      }

      const activeVoice = getSavedTtsVoice();
      isAiSpeakingRef.current = true;
      lastAiSpokenTextRef.current = cleanText;
      updateLiveState('ai_speaking');
      setCaptionSpeaker('ai');
      setCaptionText(cleanText);

      // Fast, snappy, articulate 1.1x speech speed
      const resolved = resolveSpeechVoice(activeVoice, 1.1);
      speakChunkedWithGuard(cleanText, resolved, {
        onStart: () => {
          if (!isOpenRef.current) {
            clearSpeechKeepAlive();
            return;
          }
          isAiSpeakingRef.current = true;
          updateLiveState('ai_speaking');
        },
        onEnd: () => {
          isAiSpeakingRef.current = false;
          aiSpeakingFinishedAtRef.current = Date.now();
          if (!isOpenRef.current) return;
          if (isMutedRef.current) {
            updateLiveState('muted');
          } else {
            updateLiveState('listening');
            // Resume speech recognition immediately on mobile
            try {
              recognitionRef.current?.start();
            } catch (_) {}
          }
        },
        onError: () => {
          isAiSpeakingRef.current = false;
          aiSpeakingFinishedAtRef.current = Date.now();
          if (!isOpenRef.current) return;
          if (isMutedRef.current) {
            updateLiveState('muted');
          } else {
            updateLiveState('listening');
            try {
              recognitionRef.current?.start();
            } catch (_) {}
          }
        },
      });
    },
    [updateLiveState]
  );

  // Send captured user speech to the fast live API endpoint
  const processUserUtterance = useCallback(
    async (rawUtterance: string) => {
      const cleanUtterance = rawUtterance.trim();
      if (!cleanUtterance || !isOpenRef.current) return;
      if (isProcessingTurnRef.current) return;

      isProcessingTurnRef.current = true;
      accumulatedTranscriptRef.current = '';

      // Live simultaneous display of user query
      setCaptionSpeaker('user');
      setCaptionText(cleanUtterance);
      updateLiveState('responding');

      const history = [...turnsHistoryRef.current, { role: 'user' as const, content: cleanUtterance }];
      turnsHistoryRef.current = history.slice(-10);

      try {
        const response = await fetch('/api/live-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: cleanUtterance,
            messages: history,
            history,
            voiceId: getSavedTtsVoice() || 'sigma',
            userName: effectiveUserName,
            userEmail: authenticatedEmail,
            isVerifiedOwner: isOwner,
            userOccupation,
            userInterests,
            userExtraInfo,
            customInstructions,
            aiTone,
            aiWarmth,
            aiEnthusiasm,
            aiEmojiUsage,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const replyText = String(
          data?.reply || data?.spokenReply || data?.spokenSummary || "I'm right here with you!"
        ).trim();
        const spokenText = String(data?.spokenReply || data?.spokenSummary || replyText).trim();

        if (!isOpenRef.current) return;

        // Save AI turn
        turnsHistoryRef.current.push({ role: 'model', content: replyText });

        // Sync with main chat
        if (onSyncTurnToMainChat) {
          onSyncTurnToMainChat(cleanUtterance, replyText);
        }

        isProcessingTurnRef.current = false;
        speakAiResponse(spokenText);
      } catch (err) {
        console.warn('[SIGMA-LIVE] Fast turn error:', err);
        isProcessingTurnRef.current = false;
        if (!isOpenRef.current) return;
        updateLiveState('listening');
      }
    },
    [
      aiEmojiUsage,
      aiEnthusiasm,
      aiTone,
      aiWarmth,
      authenticatedEmail,
      customInstructions,
      effectiveUserName,
      isOwner,
      onSyncTurnToMainChat,
      speakAiResponse,
      updateLiveState,
      userExtraInfo,
      userInterests,
      userOccupation,
    ]
  );

  // Setup Live Speech Recognition Engine
  const startSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      updateLiveState('listening');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (_) {}
      }

      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      let committedFinalSegments = '';

      recognition.onresult = (event: any) => {
        if (!isOpenRef.current || isMutedRef.current) return;

        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            sessionFinal += transcript + ' ';
          } else {
            sessionInterim += transcript + ' ';
          }
        }

        const heardText = (sessionFinal + ' ' + sessionInterim).trim();
        if (!heardText) return;

        // Acoustic Echo Suppression: Ignore mic pickup of AI's own voice
        const isEchoTail = Date.now() < aiSpeakingFinishedAtRef.current + 650;
        if (isAiSpeakingRef.current || isEchoTail) {
          const spoken = (lastAiSpokenTextRef.current || '')
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, ' ');
          const heardWords = heardText
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, ' ')
            .split(/\s+/)
            .filter(Boolean);

          const isAiEcho =
            heardWords.length > 0 &&
            heardWords.every((w) => spoken.includes(w));

          if (isAiEcho) {
            return;
          }

          // Intentional Barge-in: User speaks new content or says stop/wait
          const interruptionKeywords = /^(stop|wait|hold on|pause|cancel|listen|hey sigma|ayaan|sigma)\b/i;
          if (interruptionKeywords.test(heardText) || heardWords.length >= 3) {
            stopAiSpeakingImmediately(true);
            committedFinalSegments = '';
            accumulatedTranscriptRef.current = '';
          } else {
            return;
          }
        }

        if (sessionFinal.trim()) {
          committedFinalSegments = (committedFinalSegments + ' ' + sessionFinal).trim();
        }

        const displayTranscript = (
          committedFinalSegments +
          (sessionInterim ? ' ' + sessionInterim : '')
        ).trim();

        if (displayTranscript) {
          accumulatedTranscriptRef.current = displayTranscript;

          // Simultaneous Real-Time Understanding: Display text live as human speaks
          setCaptionSpeaker('user');
          setCaptionText(displayTranscript);
          if (!isAiSpeakingRef.current && !isProcessingTurnRef.current) {
            updateLiveState('user_speaking');
          }

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Ultra-fast sub-second submission debounce (~360ms after speaking finishes)
          const silenceDelayMs = sessionFinal.trim() ? 340 : 480;
          silenceTimerRef.current = setTimeout(() => {
            if (
              isAiSpeakingRef.current ||
              Date.now() < aiSpeakingFinishedAtRef.current + 450
            ) {
              return;
            }
            const readyText = accumulatedTranscriptRef.current.trim();
            if (
              readyText &&
              !isProcessingTurnRef.current &&
              !isMutedRef.current
            ) {
              processUserUtterance(readyText);
              committedFinalSegments = '';
              accumulatedTranscriptRef.current = '';
            }
          }, silenceDelayMs);
        }
      };

      recognition.onerror = () => {
        // Continue smoothly
      };

      recognition.onend = () => {
        if (isOpenRef.current && !isMutedRef.current && !isAiSpeakingRef.current) {
          setTimeout(() => {
            if (isOpenRef.current && !isMutedRef.current && !isAiSpeakingRef.current) {
              try {
                recognition.start();
              } catch (_) {}
            }
          }, 200);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (_) {}
  }, [processUserUtterance, stopAiSpeakingImmediately, updateLiveState]);

  // Real-time Audio Analyser for User Voice Energy & Smoke Swirl
  const startAudioAnalyzer = useCallback(async () => {
    // Avoid acquiring raw stream on mobile to prevent hardware mic conflict with SpeechRecognition
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch (err) {
      console.warn('Microphone permission fallback:', err);
    }
  }, []);

  // Main Animation Loop: Smoke/Cloud Swirl + AI Zoom In/Out
  useEffect(() => {
    if (!isOpen) return;

    initSmokeParticles();
    let isCancelled = false;
    const dataArray = new Uint8Array(32);

    const render = () => {
      if (isCancelled) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      // 1. Compute Mic Energy
      let currentMicVolume = 0;
      if (analyserRef.current && !isMutedRef.current && !isAiSpeakingRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 16; i++) {
          sum += dataArray[i];
        }
        currentMicVolume = Math.min(1, (sum / 16) / 75);
      } else if (liveStateRef.current === 'user_speaking' && !isMutedRef.current) {
        currentMicVolume = 0.65;
      }
      setMicLevel(currentMicVolume);

      // 2. AI Voice Zoom In / Zoom Out Pulsing
      if (isAiSpeakingRef.current) {
        aiZoomPhaseRef.current += 0.08;
        // Rhythmically zooms in and out with vocal cadence
        const zoom = 1.0 + Math.sin(aiZoomPhaseRef.current) * 0.08 + Math.cos(aiZoomPhaseRef.current * 1.8) * 0.04;
        setZoomScale(zoom);
      } else if (currentMicVolume > 0.05) {
        // Human is speaking: subtle voice reactive presence
        setZoomScale(1.0 + currentMicVolume * 0.05);
      } else {
        setZoomScale(1.0);
      }

      // 3. Render Smoke Cloud Simulation on Canvas
      if (canvas && ctx) {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.clearRect(0, 0, width, height);

        // Circular clipping boundary so smoke stays strictly inside the circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, width / 2 - 2, 0, Math.PI * 2);
        ctx.clip();

        // Dark celestial background gradient tinted with the user's personalization color
        const bgGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          10,
          centerX,
          centerY,
          width / 2
        );
        bgGrad.addColorStop(0, `rgba(${Math.floor(rgb.r * 0.16)}, ${Math.floor(rgb.g * 0.16)}, ${Math.floor(rgb.b * 0.16)}, 0.95)`);
        bgGrad.addColorStop(0.7, '#07080b');
        bgGrad.addColorStop(1, '#020305');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Realistic billowing smoke dynamics:
        // Drifting organically across 2D space ("over here and there") without rigid rotation
        const timeSec = performance.now() * 0.001;
        const voiceTurbulence = currentMicVolume > 0.05 ? currentMicVolume * 3.8 : 0;
        const particles = smokeParticlesRef.current;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Age and lifecycle renewal
          p.age += 1;
          if (p.age >= p.lifespan) {
            p.age = 0;
            p.lifespan = 130 + Math.random() * 180;
            p.seed = Math.random() * 100;
            p.baseRadius = 24 + Math.random() * 32;
            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnDist = Math.random() * 26;
            p.x = Math.cos(spawnAngle) * spawnDist;
            p.y = Math.sin(spawnAngle) * spawnDist + 12; // gentle rise from lower center
            p.vx = (Math.random() - 0.5) * 0.35;
            p.vy = -0.15 - Math.random() * 0.25;
          }

          // Smooth billowing lifecycle opacity: fade in, billow, fade out
          const lifeProgress = p.age / p.lifespan;
          let lifeOpacity = 0;
          if (lifeProgress < 0.25) {
            lifeOpacity = lifeProgress / 0.25;
          } else if (lifeProgress < 0.72) {
            lifeOpacity = 1;
          } else {
            lifeOpacity = (1 - lifeProgress) / 0.28;
          }

          // Dynamic multi-directional drift ("here and there") with sine/cosine curl wavefields
          const wanderX = Math.sin(timeSec * 0.75 + p.seed * 3.1) * p.wanderSpeed;
          const wanderY = Math.cos(timeSec * 0.65 + p.seed * 2.3) * p.wanderSpeed - 0.18;

          // Vocal surge: human speech accelerates smoke diffusion & multi-directional billow
          const surgeMultiplier = 1 + voiceTurbulence * 2.8;
          p.x += (p.vx + wanderX) * surgeMultiplier;
          p.y += (p.vy + wanderY) * surgeMultiplier;
          p.rotation += p.vRot * surgeMultiplier;

          // Soft boundary containment within circle
          const dist = Math.sqrt(p.x * p.x + p.y * p.y);
          const maxDist = width / 2 - 14;
          if (dist > maxDist) {
            p.x *= 0.94;
            p.y *= 0.94;
            p.vx *= -0.65;
            p.vy *= -0.65;
          }

          // Expanding smoke puff radius as it billows and rises
          const currentRadius =
            p.baseRadius * (1 + lifeProgress * 0.75) * (1 + voiceTurbulence * 0.25);

          // Render soft volumetric smoke puff in the personalization color
          ctx.save();
          ctx.translate(centerX + p.x, centerY + p.y);
          ctx.rotate(p.rotation);

          const { r, g, b } = rgb;
          const r1 = Math.min(255, r + 50);
          const g1 = Math.min(255, g + 50);
          const b1 = Math.min(255, b + 50);

          const smokeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);

          if (isAiSpeakingRef.current) {
            // Radiant glowing smoke when AI speaks
            const op = lifeOpacity * 0.65;
            smokeGrad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${op * 0.85})`);
            smokeGrad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${op * 0.55})`);
            smokeGrad.addColorStop(0.68, `rgba(${r}, ${g}, ${b}, ${op * 0.20})`);
            smokeGrad.addColorStop(1, 'transparent');
          } else if (currentMicVolume > 0.05) {
            // Energetic voice-reactive smoke highlights in personalization color
            const op = lifeOpacity * 0.58;
            smokeGrad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${op * 0.75})`);
            smokeGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${op * 0.45})`);
            smokeGrad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${op * 0.15})`);
            smokeGrad.addColorStop(1, 'transparent');
          } else {
            // Volumetric cloudy smoke drifting peacefully over here and there
            const op = lifeOpacity * 0.40;
            smokeGrad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${op * 0.65})`);
            smokeGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${op * 0.35})`);
            smokeGrad.addColorStop(0.72, `rgba(${r}, ${g}, ${b}, ${op * 0.08})`);
            smokeGrad.addColorStop(1, 'transparent');
          }

          ctx.fillStyle = smokeGrad;
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Inner core glow aura in personalization color
        const coreGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          width / 2.2
        );
        coreGrad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isAiSpeakingRef.current ? '0.45' : '0.25'})`);
        coreGrad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
        coreGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, width / 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      isCancelled = true;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isOpen, activeColor, rgb]);

  // Open / Close Lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopAiSpeakingImmediately(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      return;
    }

    unlockMobileAudio();
    playChime(320, 580);
    startAudioAnalyzer();
    startSpeechRecognition();

    const welcomeGreeting = effectiveUserName
      ? `Hey ${effectiveUserName}! Listening... speak now.`
      : "Listening... speak now.";
    setCaptionSpeaker('ai');
    setCaptionText(welcomeGreeting);
    updateLiveState('listening');

    return () => {
      stopAiSpeakingImmediately(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isOpen, effectiveUserName, playChime, startAudioAnalyzer, startSpeechRecognition, stopAiSpeakingImmediately, unlockMobileAudio, updateLiveState]);

  // Toggle Mute
  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      setIsMuted(false);
      isMutedRef.current = false;
      updateLiveState('listening');
      playChime(320, 620);
      try {
        recognitionRef.current?.start();
      } catch (_) {}
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      updateLiveState('muted');
      playChime(520, 320);
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
    }
  };

  // Toggle Speaker Sound
  const handleToggleSpeaker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeakerMuted) {
      setIsSpeakerMuted(false);
      isSpeakerMutedRef.current = false;
    } else {
      setIsSpeakerMuted(true);
      isSpeakerMutedRef.current = true;
      clearSpeechKeepAlive();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="sigma-live-floating-root"
      className="fixed inset-x-0 bottom-24 sm:bottom-28 z-[75] flex flex-col items-center justify-end pointer-events-none select-none px-4"
    >
      {/* 1. Live Simultaneous Caption Bubble: Understands and displays text live right above the circle */}
      {captionText && (
        <div
          id="sigma-live-caption-bubble"
          className="pointer-events-auto max-w-[92vw] sm:max-w-md mb-3 px-3.5 py-2 rounded-2xl bg-[#0d0f15]/95 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] text-center transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
          style={{
            borderColor: `${activeColor}40`,
            boxShadow: `0 8px 28px rgba(0,0,0,0.5), 0 0 16px ${activeColor}20`,
          }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor:
                  captionSpeaker === 'user' ? '#38bdf8' : activeColor,
              }}
            />
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              {captionSpeaker === 'user'
                ? effectiveUserName || 'You'
                : 'Sigma Live'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed line-clamp-3">
            {captionText}
          </p>
        </div>
      )}

      {/* 2. Central Floating Smoke Circle Orb: Positioned right above the type bar */}
      <div className="relative pointer-events-auto flex items-center justify-center">
        {/* Ambient Pulsing Aura around Circle */}
        <div
          className="absolute inset-0 rounded-full transition-transform duration-100 pointer-events-none"
          style={{
            transform: `scale(${zoomScale * 1.15})`,
            background: `radial-gradient(circle, ${activeColor}25 0%, transparent 70%)`,
            filter: 'blur(14px)',
          }}
        />

        {/* The Interactive Smoke Circle: Zooms in/out when AI speaks, smoke swirls when Human speaks */}
        <div
          id="sigma-live-smoke-circle"
          onTouchStart={unlockMobileAudio}
          onClick={() => {
            unlockMobileAudio();
            if (isAiSpeakingRef.current) {
              stopAiSpeakingImmediately(true);
            }
          }}
          className="relative w-[116px] h-[116px] sm:w-[130px] sm:h-[130px] rounded-full overflow-hidden cursor-pointer shadow-2xl border border-white/15 transition-transform duration-100 ease-out flex items-center justify-center active:scale-95"
          style={{
            transform: `scale(${zoomScale})`,
            borderColor: `${activeColor}55`,
            boxShadow: `0 0 28px ${activeColor}35, 0 8px 32px rgba(0,0,0,0.8)`,
          }}
          title={isAiSpeakingRef.current ? 'Tap circle to stop speaking' : 'Sigma Live Assistant'}
        >
          {/* High-Performance Canvas for Procedural Smoke Clouds inside the Circle */}
          <canvas
            ref={canvasRef}
            width={260}
            height={260}
            className="w-full h-full rounded-full block pointer-events-none"
          />

          {/* Status Label on center when idle or listening */}
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {liveState === 'ai_speaking'
                ? 'Speaking'
                : liveState === 'user_speaking'
                ? 'Listening'
                : isMuted
                ? 'Muted'
                : 'Live'}
            </span>
          </div>
        </div>

        {/* Floating Quick Action Buttons: Close (X) & Mic Mute */}
        {/* Close Button on Right */}
        <button
          type="button"
          onClick={onClose}
          id="sigma-live-close-btn"
          className="absolute -right-10 sm:-right-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#181a20]/90 hover:bg-[#23262f] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-lg cursor-pointer"
          title="Close Live Assistant"
          aria-label="Close Live Assistant"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mic Toggle Button on Left */}
        <button
          type="button"
          onClick={handleToggleMute}
          id="sigma-live-mic-btn"
          className="absolute -left-10 sm:-left-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#181a20]/90 hover:bg-[#23262f] border border-white/10 flex items-center justify-center transition-all active:scale-95 shadow-lg cursor-pointer"
          style={{
            color: isMuted ? '#ef4444' : '#ffffff',
          }}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Audio Mute on Top */}
        <button
          type="button"
          onClick={handleToggleSpeaker}
          id="sigma-live-speaker-btn"
          className="absolute -top-4 right-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-[#181a20]/90 hover:bg-[#23262f] border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer"
          title={isSpeakerMuted ? 'Unmute AI voice output' : 'Mute AI voice output'}
          aria-label={isSpeakerMuted ? 'Unmute AI voice output' : 'Mute AI voice output'}
        >
          {isSpeakerMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
};
