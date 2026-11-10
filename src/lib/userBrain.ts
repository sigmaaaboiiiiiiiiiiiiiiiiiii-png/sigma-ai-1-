import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserKnowledgeMemory, UserPreferenceProfile } from '../types';

const BRAIN_STORAGE_PREFIX = 'sigma_user_brain_';

export const DEFAULT_PREFERENCE_PROFILE: UserPreferenceProfile = {
  preferredLanguage: 'English',
  frequentlyUsedLanguage: 'English',
  hinglishEstablished: false,
  responseLengthPreference: 'balanced',
  explanationStyle: 'concise',
  commonTaskCategories: [],
  preferredFormattingStyle: 'structured',
  commonlyAsksForCode: false,
  commonlyAsksForStories: false,
  commonlyWorksWithSpreadsheets: false,
  commonlyUsesVoice: false,
};

/**
 * Get storage key for user memory
 */
function getStorageKey(userIdOrEmail: string): string {
  const clean = (userIdOrEmail || 'guest').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `${BRAIN_STORAGE_PREFIX}${clean}`;
}

/**
 * Load user brain knowledge & lightweight preference profile from local storage and sync with Firestore
 */
export async function loadUserBrain(
  userId: string,
  userEmail?: string,
  userName?: string
): Promise<UserKnowledgeMemory> {
  const fallbackKey = userEmail || userId || 'guest';
  let memory: UserKnowledgeMemory = {
    userId: userId || 'guest',
    name: userName || 'User',
    facts: [],
    summary: '',
    preferences: { ...DEFAULT_PREFERENCE_PROFILE },
    lastUpdated: new Date().toISOString(),
  };

  // 1. Try Local Storage
  try {
    const raw = localStorage.getItem(getStorageKey(fallbackKey));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memory = {
          ...memory,
          ...parsed,
          facts: Array.isArray(parsed.facts) ? parsed.facts : [],
          preferences: {
            ...DEFAULT_PREFERENCE_PROFILE,
            ...(parsed.preferences || {}),
          },
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse local brain memory:', err);
  }

  // 2. Try Firestore if userId is present and not guest
  if (userId && userId !== 'guest') {
    try {
      const brainDocRef = doc(db, 'users', userId, 'brain', 'knowledge');
      const snap = await getDoc(brainDocRef);
      if (snap.exists()) {
        const firestoreData = snap.data() as any;
        const mergedFacts = Array.from(
          new Set([...(memory.facts || []), ...(firestoreData.facts || [])])
        ).slice(0, 35);
        const mergedPrefs: UserPreferenceProfile = {
          ...DEFAULT_PREFERENCE_PROFILE,
          ...(memory.preferences || {}),
          ...(firestoreData.preferences || {}),
          commonTaskCategories: Array.from(
            new Set([
              ...(memory.preferences?.commonTaskCategories || []),
              ...(firestoreData.preferences?.commonTaskCategories || []),
            ])
          ).slice(0, 10),
        };
        memory = {
          userId,
          name: firestoreData.name || memory.name,
          facts: mergedFacts,
          summary: firestoreData.summary || memory.summary,
          preferences: mergedPrefs,
          lastUpdated: firestoreData.lastUpdated || new Date().toISOString(),
        };
        // Update local storage cache
        localStorage.setItem(getStorageKey(fallbackKey), JSON.stringify(memory));
      }
    } catch (err) {
      console.warn('Could not read user brain from Firestore:', err);
    }
  }

  return memory;
}

/**
 * Persist user brain memory & lightweight preference profile to local storage and Firestore
 */
export async function saveUserBrain(memory: UserKnowledgeMemory): Promise<void> {
  if (!memory) return;
  const key = getStorageKey(memory.userId || 'guest');

  // Save to Local Storage immediately
  try {
    localStorage.setItem(key, JSON.stringify(memory));
  } catch (err) {
    console.warn('Failed to save user brain to localStorage:', err);
  }

  // Save to Firestore if authenticated user
  if (memory.userId && memory.userId !== 'guest') {
    try {
      const brainDocRef = doc(db, 'users', memory.userId, 'brain', 'knowledge');
      await setDoc(
        brainDocRef,
        {
          userId: memory.userId,
          name: memory.name || 'User',
          facts: (memory.facts || []).slice(0, 35),
          summary: memory.summary || '',
          preferences: memory.preferences || DEFAULT_PREFERENCE_PROFILE,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Failed to sync user brain to Firestore:', err);
    }
  }
}

const HINGLISH_KEYWORDS_REGEX =
  /\b(haan|han|bhai|kya|scene|hai|hain|bolo|acha|accha|theek|thik|mujhe|mujhko|bana|banao|karo|karna|kardo|yaar|kaise|kaisa|kaisi|batao|bata|samjhao|nahi|nhi|chahiye|mera|meri|mere|tera|teri|apna|sahi|jaldi|abhi|dekho|sun|suno|likho|matlab|kyun|kyu|aur|lekin|par|toh|bhi|wala|wali|raha|rahi|gaya|hogaya|krdo|krna|bta|btana|kuch|koi|sab)\b/i;

/**
 * Detects explicit language switch commands or implicit language style from a message
 */
export function detectLanguageFromMessage(text: string): {
  explicitLanguageCommand: 'English' | 'Hinglish' | 'Urdu' | 'Hindi' | null;
  detectedMessageLanguage: 'English' | 'Hinglish' | 'Urdu' | 'Hindi';
} {
  const clean = (text || '').trim();
  const lower = clean.toLowerCase();

  // Explicit commands: "Speak English", "Speak Hinglish", "Speak Urdu", "Speak Hindi"
  if (/\b(speak|talk|reply|respond|answer|chat)\s+(in\s+)?english\b/i.test(lower) || /^english\s+mein\s+(baat\s+karo|bolo)/i.test(lower)) {
    return { explicitLanguageCommand: 'English', detectedMessageLanguage: 'English' };
  }
  if (/\b(speak|talk|reply|respond|answer|chat)\s+(in\s+)?hinglish\b/i.test(lower) || /^hinglish\s+mein\s+(baat\s+karo|bolo)/i.test(lower)) {
    return { explicitLanguageCommand: 'Hinglish', detectedMessageLanguage: 'Hinglish' };
  }
  if (/\b(speak|talk|reply|respond|answer|chat)\s+(in\s+)?urdu\b/i.test(lower) || /^urdu\s+mein\s+(baat\s+karo|bolo)/i.test(lower)) {
    return { explicitLanguageCommand: 'Urdu', detectedMessageLanguage: 'Urdu' };
  }
  if (/\b(speak|talk|reply|respond|answer|chat)\s+(in\s+)?hindi\b/i.test(lower) || /^hindi\s+mein\s+(baat\s+karo|bolo)/i.test(lower)) {
    return { explicitLanguageCommand: 'Hindi', detectedMessageLanguage: 'Hindi' };
  }

  // Script-based detection
  if (/[\u0600-\u06FF]/.test(clean)) {
    return { explicitLanguageCommand: null, detectedMessageLanguage: 'Urdu' };
  }
  if (/[\u0900-\u097F]/.test(clean)) {
    return { explicitLanguageCommand: null, detectedMessageLanguage: 'Hindi' };
  }

  // Roman Urdu / Hinglish detection
  const words = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  let hinglishHits = 0;
  for (const w of words) {
    if (HINGLISH_KEYWORDS_REGEX.test(w)) {
      hinglishHits++;
    }
  }
  if (hinglishHits >= 1 && (words.length <= 5 || hinglishHits >= 2)) {
    return { explicitLanguageCommand: null, detectedMessageLanguage: 'Hinglish' };
  }

  return { explicitLanguageCommand: null, detectedMessageLanguage: 'English' };
}

/**
 * Updates the lightweight UserPreferenceProfile and non-sensitive user facts from a turn.
 * Strictly avoids storing individual messages, generated answers, typos, or surveillance logs.
 */
export function updateBrainAndPreferencesFromTurn(
  userText: string,
  currentBrain: UserKnowledgeMemory | null,
  options?: {
    userId?: string;
    userName?: string;
    usedVoice?: boolean;
    usedSpreadsheet?: boolean;
    usedPresentation?: boolean;
  }
): UserKnowledgeMemory {
  const base: UserKnowledgeMemory = currentBrain || {
    userId: options?.userId || 'guest',
    name: options?.userName || 'User',
    facts: [],
    summary: '',
    preferences: { ...DEFAULT_PREFERENCE_PROFILE },
    lastUpdated: new Date().toISOString(),
  };

  const prefs: UserPreferenceProfile = {
    ...DEFAULT_PREFERENCE_PROFILE,
    ...(base.preferences || {}),
    commonTaskCategories: [...(base.preferences?.commonTaskCategories || [])],
  };

  const text = (userText || '').trim();
  const lower = text.toLowerCase();

  if (text) {
    const langInfo = detectLanguageFromMessage(text);
    if (langInfo.explicitLanguageCommand) {
      prefs.preferredLanguage = langInfo.explicitLanguageCommand;
      prefs.frequentlyUsedLanguage = langInfo.explicitLanguageCommand;
      prefs.hinglishEstablished = langInfo.explicitLanguageCommand === 'Hinglish';
    } else if (langInfo.detectedMessageLanguage === 'Hinglish') {
      prefs.frequentlyUsedLanguage = 'Hinglish';
      prefs.hinglishEstablished = true;
    } else if (langInfo.detectedMessageLanguage === 'Urdu') {
      prefs.frequentlyUsedLanguage = 'Urdu';
    } else if (langInfo.detectedMessageLanguage === 'Hindi') {
      prefs.frequentlyUsedLanguage = 'Hindi';
    } else if (langInfo.detectedMessageLanguage === 'English' && text.split(/\s+/).length >= 4) {
      // If user writes full sentences in English and hasn't locked Hinglish explicitly
      if (prefs.preferredLanguage !== 'Hinglish' && prefs.preferredLanguage !== 'Urdu' && prefs.preferredLanguage !== 'Hindi') {
        prefs.frequentlyUsedLanguage = 'English';
      }
    }

    // Detect response length / explanation preference
    if (/\b(concise|short|brief|in short|one line|quick summary|tldr)\b/i.test(lower)) {
      prefs.responseLengthPreference = 'concise';
      prefs.explanationStyle = 'concise';
    } else if (/\b(in detail|detailed|comprehensive|deep dive|thoroughly|step by step|elaborate)\b/i.test(lower)) {
      prefs.responseLengthPreference = 'detailed';
      prefs.explanationStyle = 'detailed';
    }

    // Detect common task categories (non-sensitive behavioral preferences)
    const addCategory = (cat: string) => {
      if (!prefs.commonTaskCategories?.includes(cat)) {
        prefs.commonTaskCategories = [...(prefs.commonTaskCategories || []), cat].slice(-8);
      }
    };

    if (/\b(code|function|react|typescript|javascript|python|html|css|sql|bug|script|api)\b/i.test(lower)) {
      prefs.commonlyAsksForCode = true;
      addCategory('coding');
    }
    if (/\b(story|tale|narrative|fiction|chapter|character)\b/i.test(lower)) {
      prefs.commonlyAsksForStories = true;
      addCategory('stories');
    }
    if (options?.usedSpreadsheet || /\b(excel|spreadsheet|workbook|xlsx|sheet|table)\b/i.test(lower)) {
      prefs.commonlyWorksWithSpreadsheets = true;
      addCategory('spreadsheets');
    }
    if (options?.usedPresentation || /\b(powerpoint|presentation|slides|pptx|deck)\b/i.test(lower)) {
      addCategory('presentations');
    }
    if (options?.usedVoice) {
      prefs.commonlyUsesVoice = true;
      addCategory('voice');
    }
  }

  const nextFacts = extractUserFactsFromTurn(text, base.facts || []);

  return {
    ...base,
    userId: options?.userId || base.userId || 'guest',
    name: options?.userName || base.name || 'User',
    facts: nextFacts,
    preferences: prefs,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Builds a concise prompt context block representing the user's language and interaction preferences
 */
export function buildUserPreferencePromptBlock(
  brain: UserKnowledgeMemory | null | undefined,
  currentPrompt: string
): string {
  const prefs = brain?.preferences || DEFAULT_PREFERENCE_PROFILE;
  const langDetection = detectLanguageFromMessage(currentPrompt);

  let activeLang = prefs.preferredLanguage || 'English';
  if (langDetection.explicitLanguageCommand) {
    activeLang = langDetection.explicitLanguageCommand;
  } else if (langDetection.detectedMessageLanguage !== 'English') {
    activeLang = langDetection.detectedMessageLanguage;
  } else if (prefs.preferredLanguage && prefs.preferredLanguage !== 'English') {
    activeLang = prefs.preferredLanguage;
  } else if (prefs.hinglishEstablished && currentPrompt.trim().split(/\s+/).length <= 3) {
    // Short ambiguous message when Hinglish is established
    activeLang = 'English or Hinglish';
  }

  const lines: string[] = [
    `- Active / Preferred Language: ${activeLang} (Primary default is English unless user writes in or requests Hinglish, Urdu, or Hindi).`,
    `- Hinglish Context: ${
      prefs.hinglishEstablished || langDetection.detectedMessageLanguage === 'Hinglish'
        ? 'User has used Roman Urdu/Hinglish ("haan bhai", "kya scene hai", "bolo", "acha", "theek hai"). You may naturally respond in conversational Hinglish when appropriate or when the user writes in Hinglish.'
        : 'User primarily communicates in English. Respond in natural English unless they switch to Hinglish/Urdu/Hindi.'
    }`,
    `- Explanation & Length Preference: ${prefs.responseLengthPreference || 'balanced'} (adapt automatically: concise for simple questions, detailed with headings/bullets for complex questions).`,
  ];

  if (prefs.commonTaskCategories && prefs.commonTaskCategories.length > 0) {
    lines.push(`- Common Task Categories: ${prefs.commonTaskCategories.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Intelligent client-side heuristic to extract learned non-sensitive facts about the user
 * (Never stores raw chat messages, typos, or punctuation)
 */
export function extractUserFactsFromTurn(
  userText: string,
  existingFacts: string[]
): string[] {
  if (!userText || typeof userText !== 'string') return existingFacts;
  const text = userText.trim();
  const newFacts: string[] = [];

  // Name extraction
  const nameMatch =
    text.match(/(?:my name is|i am called|call me|mera naam)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch && nameMatch[1]) {
    const rawName = nameMatch[1].trim().replace(/\s+hai$/i, '');
    if (!['sorry', 'happy', 'fine', 'good', 'ready', 'back', 'just', 'here', 'tired'].includes(rawName.toLowerCase())) {
      newFacts.push(`User's name is ${rawName}`);
    }
  }

  // Explicit "remember that" or "remember:"
  const rememberMatch = text.match(/(?:remember\s+(?:that\s+)?|note\s+that\s+|keep\s+in\s+mind\s+that\s+)(.+)/i);
  if (rememberMatch && rememberMatch[1]) {
    const fact = rememberMatch[1].trim().replace(/[.!?]+$/, '');
    if (fact.length > 3 && fact.length < 120) {
      newFacts.push(`Preference note: ${fact}`);
    }
  }

  // Identity / Profession / Role
  const roleMatch = text.match(/(?:i am a|i'm an?|i work as an?)\s+([a-zA-Z\s]{3,35})(?:\.|\,|$)/i);
  if (roleMatch && roleMatch[1]) {
    const role = roleMatch[1].trim();
    if (!['human', 'person', 'bot', 'user'].includes(role.toLowerCase())) {
      newFacts.push(`User role: ${role}`);
    }
  }

  if (newFacts.length === 0) return existingFacts;

  // Deduplicate and merge
  const combined = [...existingFacts];
  for (const f of newFacts) {
    const exists = combined.some(
      (c) => c.toLowerCase() === f.toLowerCase() || c.toLowerCase().includes(f.toLowerCase())
    );
    if (!exists) {
      combined.push(f);
    }
  }

  return combined.slice(-25); // Keep up to 25 lightweight facts
}

/**
 * Synchronize explicit user preference settings (qualities, name, asking style) to Brain
 */
export async function syncUserPreferencesToBrain(
  userId: string,
  userName?: string,
  qualities?: string,
  askingStyle?: string,
  desiredFormat?: string
): Promise<UserKnowledgeMemory> {
  const current = await loadUserBrain(userId);
  const updatedFacts = [...current.facts];
  const prefs: UserPreferenceProfile = {
    ...DEFAULT_PREFERENCE_PROFILE,
    ...(current.preferences || {}),
  };

  if (userName && userName.trim()) {
    const nameFact = `User's name is ${userName.trim()}`;
    if (!updatedFacts.includes(nameFact)) updatedFacts.unshift(nameFact);
    current.name = userName.trim();
  }
  if (qualities && qualities.trim()) {
    const qFact = `User qualities: ${qualities.trim()}`;
    if (!updatedFacts.includes(qFact)) updatedFacts.push(qFact);
  }
  if (askingStyle && askingStyle.trim()) {
    const sFact = `User asking style: ${askingStyle.trim()}`;
    if (!updatedFacts.includes(sFact)) updatedFacts.push(sFact);
  }
  if (desiredFormat && desiredFormat.trim()) {
    const fFact = `Desired response format: ${desiredFormat.trim()}`;
    if (!updatedFacts.includes(fFact)) updatedFacts.push(fFact);
    prefs.preferredFormattingStyle = desiredFormat.trim();
  }

  const updatedMemory: UserKnowledgeMemory = {
    ...current,
    facts: Array.from(new Set(updatedFacts)).slice(0, 30),
    preferences: prefs,
    lastUpdated: new Date().toISOString(),
  };

  await saveUserBrain(updatedMemory);
  return updatedMemory;
}

