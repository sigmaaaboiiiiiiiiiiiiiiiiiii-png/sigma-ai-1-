export type TtsVoiceOptionId = 'sigma' | 'boy' | 'male' | 'female' | 'kore' | 'fenrir';

export interface TtsVoiceOptionMeta {
  id: TtsVoiceOptionId;
  label: string;
  shortLabel: string;
  badgeText: string;
  geminiLiveVoice: 'Puck' | 'Aoede' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  traits: string[];
  description: string;
  defaultPitch: number;
  defaultRate: number;
  isReferenceSampleCalibrated?: boolean;
}

export const TTS_VOICE_OPTIONS: TtsVoiceOptionMeta[] = [
  {
    id: 'sigma',
    label: 'Sigma',
    shortLabel: 'Sigma',
    badgeText: 'Sigma',
    geminiLiveVoice: 'Puck',
    traits: ['Natural', 'Conversational', 'Multilingual', 'Clear'],
    description:
      'Natural conversational voice with balanced pacing for English, Urdu, Hindi & Hinglish',
    defaultPitch: 1.12,
    defaultRate: 1.05,
    isReferenceSampleCalibrated: true,
  },
  {
    id: 'boy',
    label: 'Puck',
    shortLabel: 'Puck',
    badgeText: 'Puck',
    geminiLiveVoice: 'Zephyr',
    traits: ['Soft', 'Cheerful', 'Friendly', 'Clear'],
    description: 'Bright, cheerful, friendly & clear voice',
    defaultPitch: 1.24,
    defaultRate: 1.05,
  },
  {
    id: 'male',
    label: 'Charon',
    shortLabel: 'Charon',
    badgeText: 'Charon',
    geminiLiveVoice: 'Charon',
    traits: ['Natural adult male', 'Clear', 'Calm', 'Confident'],
    description: 'Calm, confident & composed voice',
    defaultPitch: 0.94,
    defaultRate: 0.98,
  },
  {
    id: 'female',
    label: 'Aoede',
    shortLabel: 'Aoede',
    badgeText: 'Aoede',
    geminiLiveVoice: 'Aoede',
    traits: ['Natural adult female', 'Clear', 'Soft', 'Friendly'],
    description: 'Warm, expressive & friendly voice',
    defaultPitch: 1.08,
    defaultRate: 1.0,
  },
  {
    id: 'kore',
    label: 'Kore',
    shortLabel: 'Kore',
    badgeText: 'Kore',
    geminiLiveVoice: 'Kore',
    traits: ['Poised', 'Articulate', 'Crisp', 'Bright'],
    description: 'Articulate, poised & crisp studio voice',
    defaultPitch: 1.16,
    defaultRate: 1.03,
  },
  {
    id: 'fenrir',
    label: 'Fenrir',
    shortLabel: 'Fenrir',
    badgeText: 'Fenrir',
    geminiLiveVoice: 'Fenrir',
    traits: ['Deep', 'Resonant', 'Bold', 'Authoritative'],
    description: 'Deep, resonant & bold voice',
    defaultPitch: 0.84,
    defaultRate: 0.94,
  },
];

const VALID_VOICE_IDS: TtsVoiceOptionId[] = ['sigma', 'boy', 'male', 'female', 'kore', 'fenrir'];

export function getTtsVoiceMeta(voiceId?: string): TtsVoiceOptionMeta {
  const found = TTS_VOICE_OPTIONS.find((v) => v.id === voiceId);
  return found || TTS_VOICE_OPTIONS[0]; // Default to SIGMA Voice
}

export function getSavedTtsVoice(): TtsVoiceOptionId {
  try {
    const saved = localStorage.getItem('sigma_tts_voice') as TtsVoiceOptionId | null;
    if (saved && VALID_VOICE_IDS.includes(saved)) {
      return saved;
    }
    const rawSettings = localStorage.getItem('sigma_settings');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (parsed?.ttsVoice && VALID_VOICE_IDS.includes(parsed.ttsVoice)) {
        return parsed.ttsVoice;
      }
    }
  } catch {
    // ignore
  }
  return 'sigma';
}

export function saveTtsVoicePreference(voiceId: TtsVoiceOptionId): void {
  try {
    localStorage.setItem('sigma_tts_voice', voiceId);
    const rawSettings = localStorage.getItem('sigma_settings');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      parsed.ttsVoice = voiceId;
      localStorage.setItem('sigma_settings', JSON.stringify(parsed));
    }
    window.dispatchEvent(
      new CustomEvent('sigma-tts-voice-changed', { detail: { voiceId, voice: voiceId } })
    );
    window.dispatchEvent(
      new CustomEvent('sigma-tts-voice-updated', { detail: { voiceId, voice: voiceId } })
    );
  } catch {
    // ignore
  }
}

export interface ResolvedSpeechVoice {
  voice: SpeechSynthesisVoice | null;
  pitch: number;
  rate: number;
  available: boolean;
  voiceName: string;
  unavailableReason?: string;
  reason?: string;
}

const LEGACY_ROBOTIC_VOICE_REGEX =
  /\b(narrator|microsoft\s+sam|espeak|festival|mbrola| speech\s+server| desktop\b)/i;

const MODERN_NATURAL_MALE_REGEX =
  /\b(google\s+uk\s+english\s+male|microsoft\s+(guy|christopher|ryan|andrew|brian|eric|steffan|roger|liam|connor|jacob)\s+online|natural|neural|daniel|oliver|arthur|alex|aaron|rishi|gordon|fred)\b/i;

const FEMALE_NAME_REGEX =
  /\b(female|woman|girl|samantha|victoria|karen|moira|tessa|fiona|veena|siri\s*female|zira|hazel|susan|linda|heather|catherine|eva|aria|jenny|sonia|libby|natasha|clara|molly|emily|sarah|alice|amanda|allison|ava|nicky|serena|sangeeta|lekha|kendra|joanna|ivy|salli|kimberly|amy|emma|olivia|google\s+uk\s+english\s+female|google\s+us\s+english)\b/i;

const MALE_NAME_REGEX =
  /\b(male|man|daniel|alex|oliver|arthur|george|fred|tom|ralph|albert|bruce|junior|david|mark|james|richard|sean|rishi|aaron|gordon|lee|martin|guy|christopher|eric|steffan|roger|brian|andrew|ryan|thomas|connor|liam|jacob|matthew|joey|justin|stephen|google\s+uk\s+english\s+male)\b/i;

const YOUTH_OR_BRIGHT_VOICE_REGEX =
  /\b(junior|ana|maisie|eloise|justin|kevin|benjamin|ivy|luke|toby|leo|sam|noah|ethan|ryan|steffan|brian|google\s+us\s+english|samantha|jenny|aria)\b/i;

export function getLoadedVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  try {
    return window.speechSynthesis.getVoices() || [];
  } catch {
    return [];
  }
}

/**
 * Scores a voice for natural modern quality, penalizing old robotic SAPI/Narrator voices.
 */
function scoreVoiceNaturalness(v: SpeechSynthesisVoice): number {
  let score = 0;
  const name = v.name || '';
  if (/natural|online|neural|wavenet|studio|premium|enhanced/i.test(name)) score += 50;
  if (/google/i.test(name)) score += 35;
  if (/apple|siri|daniel|samantha|oliver|karen|moira/i.test(name)) score += 30;
  if (!v.localService) score += 20;
  if (LEGACY_ROBOTIC_VOICE_REGEX.test(name)) score -= 60;
  if (/microsoft\s+david/i.test(name)) score -= 45;
  return score;
}

/**
 * Resolves the best distinct SpeechSynthesisVoice + pitch/rate profile
 * for Boy Voice, Male Voice, and Female Voice.
 */
export function resolveSpeechVoice(
  voiceId: TtsVoiceOptionId,
  baseRate = 1.0
): ResolvedSpeechVoice {
  const meta = getTtsVoiceMeta(voiceId);

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    const msg = 'Your browser does not support Text-to-Speech.';
    return {
      voice: null,
      pitch: meta.defaultPitch,
      rate: meta.defaultRate * baseRate,
      available: false,
      voiceName: 'Speech Synthesis Unavailable',
      unavailableReason: msg,
      reason: msg,
    };
  }

  // Strictly exclude Windows Narrator
  const allVoices = getLoadedVoices().filter((v) => !/narrator/i.test(v.name));
  if (allVoices.length === 0) {
    return {
      voice: null,
      pitch: meta.defaultPitch,
      rate: meta.defaultRate * baseRate,
      available: true,
      voiceName: `${meta.label}`,
    };
  }

  const englishVoices = allVoices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith('en')
  );
  const rawPool = englishVoices.length > 0 ? englishVoices : allVoices;

  // Sort pool by naturalness (modern neural/online/Google/Apple voices first, old desktop SAPI last)
  const pool = [...rawPool].sort(
    (a, b) => scoreVoiceNaturalness(b) - scoreVoiceNaturalness(a)
  );

  // Filter out legacy robotic desktop voices if modern voices exist
  const nonRoboticPool = pool.filter((v) => !LEGACY_ROBOTIC_VOICE_REGEX.test(v.name));
  const bestPool = nonRoboticPool.length > 0 ? nonRoboticPool : pool;

  // Identify candidate adult male voices
  const maleCandidates = bestPool.filter(
    (v) => MALE_NAME_REGEX.test(v.name) && !/female/i.test(v.name)
  );
  // Identify candidate adult female voices
  const femaleCandidates = bestPool.filter(
    (v) => FEMALE_NAME_REGEX.test(v.name) && !/\bmale\b/i.test(v.name)
  );

  // Pick primary adult male voice (prefer natural modern voices, avoid old robotic David Desktop)
  const primaryMale =
    maleCandidates.find((v) => MODERN_NATURAL_MALE_REGEX.test(v.name)) ||
    maleCandidates.find((v) => !/microsoft\s+david/i.test(v.name)) ||
    bestPool.find((v) => !FEMALE_NAME_REGEX.test(v.name) && !/microsoft\s+david/i.test(v.name)) ||
    maleCandidates[0] ||
    bestPool[0] ||
    pool[0] ||
    null;

  // Pick primary adult female voice (guaranteed different from primaryMale when possible)
  const primaryFemale =
    femaleCandidates.find(
      (v) =>
        v.name !== primaryMale?.name &&
        /google uk english female|google us english|microsoft aria|microsoft jenny|microsoft sonia|samantha|victoria|karen|moira|zira|hazel/i.test(
          v.name
        )
    ) ||
    femaleCandidates.find((v) => v.name !== primaryMale?.name) ||
    bestPool.find((v) => v.name !== primaryMale?.name) ||
    femaleCandidates[0] ||
    pool[0] ||
    null;

  // Pick Boy Voice (soft, cheerful, friendly, younger-sounding — prefer a bright/clear voice distinct from adult male)
  const boyCandidate =
    bestPool.find(
      (v) =>
        v.name !== primaryMale?.name &&
        /junior|justin|kevin|ana|steffan|brian|google us english|elliot|connor/i.test(
          v.name
        )
    ) ||
    bestPool.find(
      (v) =>
        v.name !== primaryMale?.name &&
        v.name !== primaryFemale?.name &&
        YOUTH_OR_BRIGHT_VOICE_REGEX.test(v.name)
    ) ||
    bestPool.find(
      (v) => v.name !== primaryMale?.name && v.name !== primaryFemale?.name
    ) ||
    maleCandidates.find((v) => v.name !== primaryMale?.name) ||
    primaryFemale ||
    primaryMale ||
    pool[0] ||
    null;

  if (voiceId === 'sigma') {
    const sigmaCandidate =
      bestPool.find((v) => /rishi|aaron|guy|ryan|liam|connor|google uk english male|daniel/i.test(v.name)) ||
      boyCandidate ||
      primaryMale ||
      pool[0] ||
      null;
    if (!sigmaCandidate) {
      return {
        voice: null,
        pitch: meta.defaultPitch,
        rate: meta.defaultRate * baseRate,
        available: true,
        voiceName: 'Sigma',
      };
    }
    return {
      voice: sigmaCandidate,
      pitch: 1.12,
      rate: Math.max(0.85, Math.min(1.35, 1.05 * baseRate)),
      available: true,
      voiceName: 'Sigma',
    };
  }

  if (voiceId === 'fenrir') {
    const deepMale =
      maleCandidates.find((v) => /george|daniel|arthur|christopher|eric|roger|fred/i.test(v.name)) ||
      maleCandidates[maleCandidates.length - 1] ||
      primaryMale;
    return {
      voice: deepMale,
      pitch: 0.84,
      rate: Math.max(0.8, Math.min(1.25, 0.94 * baseRate)),
      available: Boolean(deepMale),
      voiceName: deepMale ? `${deepMale.name} (Fenrir)` : 'Fenrir',
    };
  }

  if (voiceId === 'kore') {
    const secondFemale =
      femaleCandidates.find((v) => v.name !== primaryFemale?.name) ||
      primaryFemale;
    return {
      voice: secondFemale,
      pitch: 1.16,
      rate: Math.max(0.85, Math.min(1.3, 1.03 * baseRate)),
      available: Boolean(secondFemale),
      voiceName: secondFemale ? `${secondFemale.name} (Kore)` : 'Kore',
    };
  }

  if (voiceId === 'male') {
    if (!primaryMale) {
      const msg = 'Male voice is not available on this device.';
      return {
        voice: null,
        pitch: meta.defaultPitch,
        rate: meta.defaultRate * baseRate,
        available: false,
        voiceName: 'Unavailable',
        unavailableReason: msg,
        reason: msg,
      };
    }
    // Natural, calm, modern adult male prosody (0.96 pitch, 0.98 rate — smooth, never robotic)
    return {
      voice: primaryMale,
      pitch: 0.96,
      rate: Math.max(0.82, Math.min(1.3, 0.98 * baseRate)),
      available: true,
      voiceName: primaryMale.name,
    };
  }

  if (voiceId === 'female') {
    if (!primaryFemale) {
      const msg = 'Female voice is not available on this device.';
      return {
        voice: null,
        pitch: meta.defaultPitch,
        rate: meta.defaultRate * baseRate,
        available: false,
        voiceName: 'Unavailable',
        unavailableReason: msg,
        reason: msg,
      };
    }
    return {
      voice: primaryFemale,
      pitch: 1.08,
      rate: Math.max(0.82, Math.min(1.3, 1.0 * baseRate)),
      available: true,
      voiceName: primaryFemale.name,
    };
  }

  // Boy Voice ('boy')
  if (!boyCandidate) {
    const msg = 'Boy voice is not available on this device.';
    return {
      voice: null,
      pitch: meta.defaultPitch,
      rate: meta.defaultRate * baseRate,
      available: false,
      voiceName: 'Unavailable',
      unavailableReason: msg,
      reason: msg,
    };
  }

  return {
    voice: boyCandidate,
    pitch: 1.24,
    rate: Math.max(0.85, Math.min(1.35, 1.05 * baseRate)),
    available: true,
    voiceName: boyCandidate.name,
  };
}

/**
 * Cleans markdown and hidden payload blocks (such as PowerPoint/Excel JSON)
 * into clean, natural spoken sentences for the Narrator.
 */
export function buildSpokenTextFromMessage(
  rawText: string,
  presentationTitle?: string,
  slides?: Array<{
    id: number;
    title: string;
    subtitle?: string;
    cards?: Array<{ title: string; content: string }>;
    bullets?: string[];
    leftColumn?: { title: string; items: string[] };
    rightColumn?: { title: string; items: string[] };
    takeaway?: string;
  }>
): string {
  // Remove hidden sigma blocks
  let cleaned = (rawText || '')
    .replace(/```sigma-powerpoint[\s\S]*?```/gi, '')
    .replace(/```sigma-excel[\s\S]*?```/gi, '')
    .replace(/```sigma-ppt-slide-count-prompt[\s\S]*?```/gi, '')
    .replace(/<sigma-powerpoint>[\s\S]*?<\/sigma-powerpoint>/gi, '')
    .replace(/<sigma-excel>[\s\S]*?<\/sigma-excel>/gi, '')
    .replace(/<sigma-ppt-slide-count-prompt>[\s\S]*?<\/sigma-ppt-slide-count-prompt>/gi, '')
    .replace(/\[Add a stronger ending twist\]/gi, '')
    .replace(/\[Show feeling more clearly\]/gi, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#`~>|]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (slides && slides.length > 0) {
    const slideNarration = slides
      .map((s, idx) => {
        const cardParts = (s.cards || [])
          .slice(0, 6)
          .map((c) => `${c.title}: ${c.content}`);
        const bulletParts = (s.bullets || []).slice(0, 6);
        const colParts = [
          ...(s.leftColumn?.items || []),
          ...(s.rightColumn?.items || []),
        ].slice(0, 4);
        const combinedPoints = [...cardParts, ...bulletParts, ...colParts].join('. ');
        const takeawayText = s.takeaway ? ` Key takeaway: ${s.takeaway}.` : '';
        return `Slide ${idx + 1}: ${s.title}. ${s.subtitle ? s.subtitle + '. ' : ''}${combinedPoints}.${takeawayText}`;
      })
      .join(' ');
    cleaned = cleaned
      ? `${cleaned}. Presentation: ${presentationTitle || ''}. ${slideNarration}`
      : `Presentation on ${presentationTitle || 'Topic'}. ${slideNarration}`;
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Splits long text into natural sentence chunks (~180 chars) so browser
 * SpeechSynthesis never hits the 15-second Chromium freeze bug.
 */
export function splitTextIntoSpeechChunks(text: string, maxLen = 180): string[] {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const rawSentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [normalized];
  const chunks: string[] = [];
  let current = '';

  for (const raw of rawSentences) {
    const sentence = raw.trim();
    if (!sentence) continue;

    if ((current + ' ' + sentence).trim().length <= maxLen) {
      current = (current + ' ' + sentence).trim();
    } else {
      if (current) chunks.push(current);
      if (sentence.length <= maxLen) {
        current = sentence;
      } else {
        // Split very long sentence by commas or words
        const words = sentence.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        current = sub;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

let activeKeepAliveTimer: any = null;
let activePlaybackCancelled = false;
let activePlaybackSessionId = 0;
let activeUtteranceRef: SpeechSynthesisUtterance | null = null;

/**
 * Immediately and completely halts all browser speech synthesis for all voices
 * (Boy, Male, Female, including Microsoft Online Natural voices).
 */
export function clearSpeechKeepAlive(): void {
  activePlaybackCancelled = true;
  activePlaybackSessionId += 1;

  if (activeKeepAliveTimer) {
    clearInterval(activeKeepAliveTimer);
    activeKeepAliveTimer = null;
  }

  if (activeUtteranceRef) {
    try {
      activeUtteranceRef.onstart = null;
      activeUtteranceRef.onend = null;
      activeUtteranceRef.onerror = null;
      activeUtteranceRef.onboundary = null;
    } catch {
      // ignore
    }
    activeUtteranceRef = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    // Secondary micro-cancel for online neural voices that buffer audio frames
    setTimeout(() => {
      try {
        if (activePlaybackCancelled && window.speechSynthesis?.speaking) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // ignore
      }
    }, 15);
  }
}

/**
 * Slices spoken text starting at a target progress ratio (0.0 to 1.0),
 * aligned cleanly to the nearest word boundary.
 */
export function sliceTextFromProgress(fullText: string, progressRatio: number): string {
  const normalized = (fullText || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const clamped = Math.max(0, Math.min(0.99, progressRatio));
  if (clamped <= 0.005) return normalized;

  const words = normalized.split(' ');
  const startWordIdx = Math.min(
    words.length - 1,
    Math.max(0, Math.floor(words.length * clamped))
  );
  return words.slice(startWordIdx).join(' ').trim();
}

/**
 * Computes accurate, voice-synchronized 8-bar waveform heights based on the
 * actual word/syllable and punctuation being spoken at the current progress ratio.
 */
export function computeVoiceSynchronizedWaveform(
  fullText: string,
  progressRatio: number,
  elapsedSec: number
): number[] {
  const normalized = (fullText || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [8, 8, 8, 8, 8, 8, 8, 8];

  const words = normalized.split(' ');
  const clamped = Math.max(0, Math.min(0.999, progressRatio));
  const exactPos = clamped * words.length;
  const wordIdx = Math.min(words.length - 1, Math.max(0, Math.floor(exactPos)));
  const wordFraction = exactPos - wordIdx;
  const currentWord = words[wordIdx] || '';

  // Check if we are at a punctuation pause at the end of a clause/sentence
  const endsWithPause = /[.,!?;:—\-]$/.test(currentWord);
  if (endsWithPause && wordFraction > 0.72) {
    return [6, 8, 9, 7, 8, 7, 6, 5];
  }

  // Calculate vowel/phoneme energy of the current word
  const cleanWord = currentWord.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const charIndex = Math.min(
    Math.max(0, cleanWord.length - 1),
    Math.floor(wordFraction * Math.max(1, cleanWord.length))
  );
  const activeChar = cleanWord[charIndex] || 'a';
  const isOpenVowel = /[aeiouy]/.test(activeChar);
  const isSonorant = /[mnlrw]/.test(activeChar);
  const wordEnergy = Math.min(1.35, 0.65 + cleanWord.length * 0.07);
  const phonemeBoost = isOpenVowel ? 1.25 : isSonorant ? 1.05 : 0.78;

  // Envelope across 8 frequency rods synchronized with syllable cadence
  const baseFreqs = [0.68, 0.92, 1.18, 0.88, 1.26, 1.04, 0.82, 0.96];
  return baseFreqs.map((freq, i) => {
    const wave =
      Math.sin(elapsedSec * 16 + i * 0.85) * 0.35 +
      Math.cos(elapsedSec * 23 - i * 1.1) * 0.25 +
      0.6;
    const rawHeight = 6 + 20 * freq * wordEnergy * phonemeBoost * Math.max(0.25, wave);
    return Math.max(5, Math.min(28, Math.round(rawHeight)));
  });
}

/**
 * Speaks text reliably across sentences without getting stuck in Chromium/Edge/Safari.
 */
export function speakChunkedWithGuard(
  text: string,
  resolved: ResolvedSpeechVoice,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
    onBoundaryProgress?: (spokenCharsInRun: number, totalCharsInRun: number) => void;
  }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    callbacks?.onError?.();
    return;
  }

  clearSpeechKeepAlive();

  const chunks = splitTextIntoSpeechChunks(text);
  if (chunks.length === 0) {
    callbacks?.onEnd?.();
    return;
  }

  const sessionId = activePlaybackSessionId;
  activePlaybackCancelled = false;
  let currentIndex = 0;

  const chunkOffsets: number[] = [];
  let runningChars = 0;
  for (const c of chunks) {
    chunkOffsets.push(runningChars);
    runningChars += c.length + 1;
  }
  const totalRunChars = Math.max(1, runningChars);

  const speakNext = () => {
    if (activePlaybackCancelled || sessionId !== activePlaybackSessionId) return;
    if (currentIndex >= chunks.length) {
      clearSpeechKeepAlive();
      callbacks?.onEnd?.();
      return;
    }

    const chunkIdx = currentIndex;
    const chunkText = chunks[chunkIdx];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    activeUtteranceRef = utterance;
    utterance.rate = resolved.rate;
    utterance.pitch = resolved.pitch;
    if (resolved.voice) {
      utterance.voice = resolved.voice;
    }

    if (chunkIdx === 0) {
      utterance.onstart = () => {
        if (activePlaybackCancelled || sessionId !== activePlaybackSessionId) return;
        callbacks?.onStart?.();
      };
    }

    utterance.onboundary = (ev: SpeechSynthesisEvent) => {
      if (activePlaybackCancelled || sessionId !== activePlaybackSessionId) return;
      if (typeof ev.charIndex === 'number') {
        const currentTotalSpoken = (chunkOffsets[chunkIdx] || 0) + ev.charIndex;
        callbacks?.onBoundaryProgress?.(currentTotalSpoken, totalRunChars);
      }
    };

    utterance.onend = () => {
      if (activePlaybackCancelled || sessionId !== activePlaybackSessionId) return;
      currentIndex += 1;
      speakNext();
    };

    utterance.onerror = (ev: any) => {
      if (activePlaybackCancelled || sessionId !== activePlaybackSessionId) return;
      if (ev?.error === 'interrupted' || ev?.error === 'canceled') {
        return;
      }
      currentIndex += 1;
      if (currentIndex < chunks.length) {
        speakNext();
      } else {
        clearSpeechKeepAlive();
        callbacks?.onError?.();
      }
    };

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      currentIndex += 1;
      if (currentIndex < chunks.length) {
        speakNext();
      } else {
        clearSpeechKeepAlive();
        callbacks?.onError?.();
      }
    }
  };

  speakNext();
}
