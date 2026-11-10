import { doc, getDoc, setDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { BASIC_CONVERSATIONS_100, INITIAL_WORD_DEFINITIONS, PreloadedQA } from './basicConversations';

export interface QAMemoryItem {
  id: string;
  question: string;
  normalizedQuestion: string;
  answer: string;
  timestamp: string;
  lastRecalledAt?: string;
  recallCount: number;
  tags?: string[];
  category?: 'conversation' | 'meaning' | 'calculation' | 'general_qa';
  userId?: string;
}

const LOCAL_QA_CACHE_KEY = 'sigma_qa_memory_database_v2';
const OFFLINE_ARCHIVE_KEY = 'sigma_offline_archive_v2';

let inMemoryQACache: QAMemoryItem[] = [];
let inMemoryOfflineArchive: QAMemoryItem[] = [];
let isInitialized = false;

/**
 * Normalizes question strings for ultra-fast, robust matching
 */
export function normalizeQuestion(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes math expressions for consistent cache indexing (e.g., "25 * 40", "25*40", "what is 25 * 40")
 */
export function normalizeMathExpression(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/^(what is|calculate|solve|find|compute|the answer to)\s+/i, '')
    .replace(/[?=$]/g, '')
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/');
}

/**
 * Extracts target word from a meaning / definition query.
 * Examples:
 * - "meaning of word jargon" -> "jargon"
 * - "meaning of jargon" -> "jargon"
 * - "what is the meaning of jargon" -> "jargon"
 * - "what does jargon mean" -> "jargon"
 * - "define jargon" -> "jargon"
 * - "what is jargon" -> "jargon"
 * - "what is a jargon" -> "jargon"
 * - "what is an algorithm" -> "algorithm"
 * - "jargon meaning" -> "jargon"
 * - "jargon" -> "jargon"
 */
export function extractWordMeaningTarget(prompt: string): string | null {
  if (!prompt || typeof prompt !== 'string') return null;
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  // Exclude greetings, affirmations, and math
  if (/^(hello|hi|hey|bye|goodbye|ok|okay|yes|no|thanks|thank you|help|who are you|how are you)$/i.test(lower)) {
    return null;
  }
  if (/[+\-*/×÷^=]/.test(lower) && /\d/.test(lower)) {
    return null;
  }

  // 1. "meaning of (the )?(word )?<target>" or "what is the meaning of (the )?(word )?<target>"
  const meaningOfMatch = lower.match(/^(?:what\s+is\s+(?:the\s+)?)?meaning\s+of\s+(?:the\s+)?(?:word\s+)?([a-z0-9\-\s]{2,35})\??$/i);
  if (meaningOfMatch) {
    const target = meaningOfMatch[1].trim();
    if (target && !/^(story|explanation|news|summary)$/i.test(target)) {
      return target;
    }
  }

  // 2. "what does <target> mean" or "what do you mean by <target>"
  const doesMeanMatch = lower.match(/^what\s+does\s+([a-z0-9\-\s]{2,35})\s+mean\??$/i);
  if (doesMeanMatch) {
    return doesMeanMatch[1].trim();
  }

  const meanByMatch = lower.match(/^what\s+(?:do\s+you\s+mean|is\s+meant)\s+by\s+([a-z0-9\-\s]{2,35})\??$/i);
  if (meanByMatch) {
    return meanByMatch[1].trim();
  }

  // 3. "define <target>" or "definition of <target>"
  const defineMatch = lower.match(/^(?:define|definition\s+of)\s+(?:the\s+)?(?:word\s+)?([a-z0-9\-\s]{2,35})\??$/i);
  if (defineMatch) {
    return defineMatch[1].trim();
  }

  // 4. "what is (a |an )?<target>"
  const whatIsMatch = lower.match(/^what\s+(?:is|are)\s+(?:a\s+|an\s+|the\s+)?([a-z0-9\-]{2,30})\??$/i);
  if (whatIsMatch) {
    const target = whatIsMatch[1].trim();
    if (!/^(the\s+time|today|your\s+name|ai|gravity|water|pi|weather)$/i.test(target)) {
      return target;
    }
  }

  // 5. "<target> meaning"
  const wordMeaningMatch = lower.match(/^([a-z0-9\-]{2,30})\s+meaning\??$/i);
  if (wordMeaningMatch) {
    return wordMeaningMatch[1].trim();
  }

  // 6. Single word (e.g. "jargon", "algorithm", "serendipity")
  if (/^[a-z]{3,25}$/i.test(lower)) {
    // If it's a known dictionary word or in definitions, treat as meaning request
    if (INITIAL_WORD_DEFINITIONS[lower] || lower === 'jargon') {
      return lower;
    }
  }

  return null;
}

/**
 * Checks if a query is a Summary request.
 * Summaries must ALWAYS generate dynamic AI responses with fresh wording, preserving core ideas.
 */
export function isSummaryQuery(text: string): boolean {
  if (!text) return false;
  return /\b(summarize|summary|summarise|sum up|give a summary|brief summary|in summary|tl;dr|tldr)\b/i.test(text);
}

/**
 * Checks if a query is a Story or Creative Narrative request.
 * Stories must NEVER be saved as static instant responses when online.
 */
export function isStoryQuery(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (/^(what|how|why|when|where|who|which|explain|define|solve|calculate)\b/i.test(trimmed) && !/\b(story|tale|fable)\b/i.test(trimmed)) {
    return false;
  }
  return /\b(write\s+(?:me\s+)?(?:a\s+|an\s+)?(?:short\s+|long\s+|friendship\s+|scary\s+|bedtime\s+|adventure\s+)?story|tell\s+(?:me\s+)?a\s+story|story\s+about|short\s+story|friendship\s+story|bedtime\s+story|fairy\s+tale|fable|fiction\s+story|\bstory\b|\btale\b)\b/i.test(trimmed);
}

/**
 * Checks if a query is a News, Current Events, or Trending query.
 * News must ALWAYS be fetched fresh from API.
 */
export function isNewsOrTrendingQuery(text: string): boolean {
  if (!text) return false;
  return /\b(news|latest news|breaking news|current events|today's news|headlines|trending|latest tags|recent updates)\b/i.test(text);
}

/**
 * Checks if a query is an In-depth Explanation or Deep Dive.
 * When online, explanations should be searched on API for the best comprehensive answer.
 */
export function isExplanationQuery(text: string): boolean {
  if (!text) return false;
  return /\b(explain in detail|comprehensive explanation|elaborate on|in-depth breakdown|detailed guide)\b/i.test(text);
}

/**
 * Checks if a query is a dynamic query that must bypass instant static caching when online.
 */
export function isDynamicQuery(text: string): boolean {
  return isSummaryQuery(text) || isStoryQuery(text) || isNewsOrTrendingQuery(text) || isExplanationQuery(text);
}

/**
 * Initialize and seed cache with 100+ basic conversations and core word meanings (including jargon)
 */
export function initCache(): QAMemoryItem[] {
  if (isInitialized && inMemoryQACache.length > 0) return inMemoryQACache;

  const itemsMap = new Map<string, QAMemoryItem>();

  // 1. Preload 100+ Basic Conversations
  for (const item of BASIC_CONVERSATIONS_100) {
    const qItem: QAMemoryItem = {
      id: item.id,
      question: item.normalizedKey,
      normalizedQuestion: normalizeQuestion(item.normalizedKey),
      answer: item.answer,
      timestamp: new Date().toISOString(),
      recallCount: 0,
      category: 'conversation',
      tags: ['basic_conversation', ...item.aliases],
    };
    itemsMap.set(qItem.normalizedQuestion, qItem);

    // Also register aliases
    for (const alias of item.aliases) {
      const normAlias = normalizeQuestion(alias);
      if (!itemsMap.has(normAlias)) {
        itemsMap.set(normAlias, {
          ...qItem,
          id: `${item.id}-${normAlias.replace(/\s+/g, '_')}`,
          question: alias,
          normalizedQuestion: normAlias,
        });
      }
    }
  }

  // 2. Preload Word Definitions (including JARGON)
  for (const [word, def] of Object.entries(INITIAL_WORD_DEFINITIONS)) {
    const wordKey = word.toLowerCase();
    const primaryItem: QAMemoryItem = {
      id: `def-${wordKey}`,
      question: `meaning of ${wordKey}`,
      normalizedQuestion: `meaning of ${wordKey}`,
      answer: def,
      timestamp: new Date().toISOString(),
      recallCount: 0,
      category: 'meaning',
      tags: ['meaning', wordKey],
    };

    itemsMap.set(`meaning of ${wordKey}`, primaryItem);
    itemsMap.set(`meaning of word ${wordKey}`, primaryItem);
    itemsMap.set(`what is the meaning of ${wordKey}`, primaryItem);
    itemsMap.set(`what does ${wordKey} mean`, primaryItem);
    itemsMap.set(`what is ${wordKey}`, primaryItem);
    itemsMap.set(`define ${wordKey}`, primaryItem);
    itemsMap.set(`${wordKey} meaning`, primaryItem);
    itemsMap.set(wordKey, primaryItem);
    itemsMap.set(`meaning:${wordKey}`, primaryItem);
  }

  // 3. Load user-saved and previously persisted definitions/conversations/calculations from localStorage
  try {
    const raw = localStorage.getItem(LOCAL_QA_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.normalizedQuestion && item.answer) {
            itemsMap.set(item.normalizedQuestion, item);
          }
        }
      }
    }
  } catch (_) {}

  // 4. Load offline archive from localStorage
  try {
    const rawArchive = localStorage.getItem(OFFLINE_ARCHIVE_KEY);
    if (rawArchive) {
      const parsed = JSON.parse(rawArchive);
      if (Array.isArray(parsed)) {
        inMemoryOfflineArchive = parsed;
      }
    }
  } catch (_) {}

  inMemoryQACache = Array.from(itemsMap.values());
  isInitialized = true;
  return inMemoryQACache;
}

/**
 * Save in-memory cache to localStorage
 */
function persistCache(): void {
  try {
    localStorage.setItem(LOCAL_QA_CACHE_KEY, JSON.stringify(inMemoryQACache.slice(0, 3000)));
  } catch (_) {}
}

/**
 * Save item into offline knowledge archive
 */
function persistOfflineArchive(item: QAMemoryItem): void {
  const existingIdx = inMemoryOfflineArchive.findIndex(
    (a) => a.normalizedQuestion === item.normalizedQuestion
  );
  if (existingIdx >= 0) {
    inMemoryOfflineArchive[existingIdx] = item;
  } else {
    inMemoryOfflineArchive.unshift(item);
    if (inMemoryOfflineArchive.length > 500) {
      inMemoryOfflineArchive = inMemoryOfflineArchive.slice(0, 500);
    }
  }
  try {
    localStorage.setItem(OFFLINE_ARCHIVE_KEY, JSON.stringify(inMemoryOfflineArchive));
  } catch (_) {}
}

/**
 * Check in milliseconds if question has been previously answered and memorized.
 * - Word Meanings: replied FAST & IMMEDIATELY.
 * - 100+ Basic Conversations: replied FAST & IMMEDIATELY.
 * - Calculations: replied FAST & IMMEDIATELY.
 * - Stories, News, Explanations, Summaries: when online, returns null to fetch fresh from API!
 * - When offline: provides saved answer from memory database.
 */
export function lookupInstantQAMemory(
  question: string,
  isOfflineMode = false
): { item: QAMemoryItem | null; isOfflineRecall?: boolean } {
  const norm = normalizeQuestion(question);
  if (!norm || norm.length < 2) return { item: null };

  const cache = initCache();

  // A. Check for Word Meaning query (e.g., "meaning of word jargon", "what is jargon", "jargon")
  const targetWord = extractWordMeaningTarget(question);
  if (targetWord) {
    const wordKey = targetWord.toLowerCase();
    // 1. Direct dictionary check
    if (INITIAL_WORD_DEFINITIONS[wordKey]) {
      const match = cache.find(
        (c) =>
          c.category === 'meaning' &&
          (c.normalizedQuestion === `meaning:${wordKey}` ||
            c.normalizedQuestion === `meaning of ${wordKey}` ||
            c.normalizedQuestion === wordKey)
      );
      if (match) {
        match.recallCount = (match.recallCount || 0) + 1;
        match.lastRecalledAt = new Date().toISOString();
        persistCache();
        return { item: match };
      }
      // Return synthetic item if preloaded definition exists
      return {
        item: {
          id: `def-${wordKey}`,
          question: `meaning of ${wordKey}`,
          normalizedQuestion: `meaning of ${wordKey}`,
          answer: INITIAL_WORD_DEFINITIONS[wordKey],
          timestamp: new Date().toISOString(),
          recallCount: 1,
          category: 'meaning',
        },
      };
    }

    // 2. Check saved user definitions in cache
    const savedMeaningMatch = cache.find(
      (c) =>
        c.category === 'meaning' &&
        (c.normalizedQuestion === `meaning:${wordKey}` ||
          c.normalizedQuestion === `meaning of ${wordKey}` ||
          c.normalizedQuestion === `meaning of word ${wordKey}` ||
          c.normalizedQuestion === `what is ${wordKey}` ||
          c.normalizedQuestion === `define ${wordKey}` ||
          c.normalizedQuestion === wordKey)
    );
    if (savedMeaningMatch) {
      savedMeaningMatch.recallCount = (savedMeaningMatch.recallCount || 0) + 1;
      savedMeaningMatch.lastRecalledAt = new Date().toISOString();
      persistCache();
      return { item: savedMeaningMatch };
    }
  }

  // B. Check for Calculation in cache
  const mathNorm = normalizeMathExpression(question);
  if (mathNorm && /[+\-*/^]/.test(mathNorm)) {
    const calcMatch = cache.find(
      (c) =>
        c.category === 'calculation' &&
        (c.normalizedQuestion === `calc:${mathNorm}` ||
          normalizeMathExpression(c.question) === mathNorm)
    );
    if (calcMatch) {
      calcMatch.recallCount = (calcMatch.recallCount || 0) + 1;
      calcMatch.lastRecalledAt = new Date().toISOString();
      persistCache();
      return { item: calcMatch };
    }
  }

  // C. Check for 100+ Basic Conversations & Greetings
  const conversationMatch = cache.find(
    (c) => c.category === 'conversation' && c.normalizedQuestion === norm
  );
  if (conversationMatch) {
    conversationMatch.recallCount = (conversationMatch.recallCount || 0) + 1;
    conversationMatch.lastRecalledAt = new Date().toISOString();
    persistCache();
    return { item: conversationMatch };
  }

  // D. Online dynamic bypass: If online and query is a story, news, explanation, or summary,
  // do NOT serve static cache! Search live API for the freshest, richest, varied response.
  if (!isOfflineMode && isDynamicQuery(question)) {
    return { item: null };
  }

  // E. Exact Match for other saved Q&A
  const exactMatch = cache.find((c) => c.normalizedQuestion === norm);
  if (exactMatch) {
    // If it's a creative story and we're online, bypass it
    if (!isOfflineMode && isStoryQuery(exactMatch.question)) {
      return { item: null };
    }
    exactMatch.recallCount = (exactMatch.recallCount || 0) + 1;
    exactMatch.lastRecalledAt = new Date().toISOString();
    persistCache();
    return { item: exactMatch };
  }

  // F. Offline Recall Mode ("when net is gone and the same answer got asked")
  if (isOfflineMode) {
    // Check in-memory offline archive for previously answered questions
    const archiveMatch = inMemoryOfflineArchive.find(
      (a) => a.normalizedQuestion === norm || normalizeQuestion(a.question) === norm
    );
    if (archiveMatch) {
      return { item: archiveMatch, isOfflineRecall: true };
    }

    // Check if any item in cache matches partially
    const partialMatch = cache.find(
      (c) => c.normalizedQuestion.includes(norm) || norm.includes(c.normalizedQuestion)
    );
    if (partialMatch && partialMatch.normalizedQuestion.length > 4) {
      return { item: partialMatch, isOfflineRecall: true };
    }
  }

  return { item: null };
}

/**
 * Save a newly answered Word Meaning into permanent database.
 * Accessible immediately forever on all platforms, published or preview.
 */
export async function saveWordMeaningMemory(
  targetWord: string,
  meaning: string,
  userId?: string
): Promise<QAMemoryItem | null> {
  const wordKey = targetWord.trim().toLowerCase();
  if (!wordKey || !meaning) return null;

  const cache = initCache();
  const id = `meaning_${wordKey}_${Date.now()}`;
  const now = new Date().toISOString();

  const primaryItem: QAMemoryItem = {
    id,
    question: `meaning of ${wordKey}`,
    normalizedQuestion: `meaning of ${wordKey}`,
    answer: meaning.trim(),
    timestamp: now,
    recallCount: 1,
    category: 'meaning',
    tags: ['meaning', wordKey],
    userId: userId || 'guest',
  };

  // Register all common question variations so any phrasing hits immediately
  const variations = [
    `meaning of ${wordKey}`,
    `meaning of word ${wordKey}`,
    `what is the meaning of ${wordKey}`,
    `what does ${wordKey} mean`,
    `what is ${wordKey}`,
    `define ${wordKey}`,
    `${wordKey} meaning`,
    wordKey,
    `meaning:${wordKey}`,
  ];

  for (const v of variations) {
    const vNorm = normalizeQuestion(v);
    const existingIdx = cache.findIndex((c) => c.normalizedQuestion === vNorm);
    if (existingIdx >= 0) {
      cache[existingIdx].answer = meaning.trim();
      cache[existingIdx].lastRecalledAt = now;
      cache[existingIdx].recallCount = (cache[existingIdx].recallCount || 0) + 1;
    } else {
      cache.unshift({
        ...primaryItem,
        id: `${id}-${vNorm.replace(/[\s:]+/g, '_')}`,
        question: v,
        normalizedQuestion: vNorm,
      });
    }
  }

  persistCache();
  persistOfflineArchive(primaryItem);

  // Sync to Firestore ai_qa_memory collection
  try {
    const docRef = doc(db, 'ai_qa_memory', `meaning-${wordKey}`);
    await setDoc(
      docRef,
      {
        id: `meaning-${wordKey}`,
        prompt: `meaning of ${wordKey}`,
        normalizedPrompt: `meaning of ${wordKey}`,
        answer: meaning.trim(),
        category: 'meaning',
        targetWord: wordKey,
        createdAt: now,
        hitCount: 1,
        userType: userId ? 'authenticated' : 'guest',
        userEmail: userId || 'system',
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[QA-DATABASE] Firestore meaning sync deferred:', err);
  }

  // Also sync to Express backend /api/qa/save if server is active
  fetch('/api/qa/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `meaning of ${wordKey}`,
      answer: meaning.trim(),
      category: 'meaning',
      userType: userId ? 'authenticated' : 'guest',
      userEmail: userId || 'Guest User',
    }),
  }).catch(() => {});

  return primaryItem;
}

/**
 * Save a Mathematical Calculation into permanent database.
 * If asked again, gives the calculation immediately.
 */
export async function saveCalculationMemory(
  expression: string,
  formattedResult: string,
  userId?: string
): Promise<QAMemoryItem | null> {
  const normExpr = normalizeMathExpression(expression);
  if (!normExpr || !formattedResult) return null;

  const cache = initCache();
  const id = `calc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const item: QAMemoryItem = {
    id,
    question: expression.trim(),
    normalizedQuestion: `calc:${normExpr}`,
    answer: formattedResult.trim(),
    timestamp: now,
    recallCount: 1,
    category: 'calculation',
    tags: ['calculation', normExpr],
    userId: userId || 'guest',
  };

  const existingIdx = cache.findIndex(
    (c) => c.normalizedQuestion === `calc:${normExpr}` || c.normalizedQuestion === normalizeQuestion(expression)
  );
  if (existingIdx >= 0) {
    cache[existingIdx].answer = formattedResult.trim();
    cache[existingIdx].lastRecalledAt = now;
    cache[existingIdx].recallCount = (cache[existingIdx].recallCount || 0) + 1;
  } else {
    cache.unshift(item);
  }

  persistCache();
  persistOfflineArchive(item);

  // Sync to Firestore
  try {
    const docRef = doc(db, 'ai_qa_memory', `calc-${normExpr.replace(/[^a-zA-Z0-9]/g, '_')}`);
    await setDoc(
      docRef,
      {
        id: `calc-${normExpr.replace(/[^a-zA-Z0-9]/g, '_')}`,
        prompt: expression.trim(),
        normalizedPrompt: `calc:${normExpr}`,
        answer: formattedResult.trim(),
        category: 'calculation',
        createdAt: now,
        hitCount: 1,
        userType: userId ? 'authenticated' : 'guest',
        userEmail: userId || 'system',
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[QA-DATABASE] Firestore calc sync deferred:', err);
  }

  // Also sync to server store
  fetch('/api/qa/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: expression.trim(),
      answer: formattedResult.trim(),
      category: 'calculation',
      userType: userId ? 'authenticated' : 'guest',
      userEmail: userId || 'Guest User',
    }),
  }).catch(() => {});

  return item;
}

/**
 * Save general answered questions (explanations, questions) into offline archive.
 * NOTE: As requested, when net is available, dynamic queries (stories, explanations, news)
 * will be searched on API for the freshest answer, but if there is NO net, the saved answer
 * will be provided!
 */
export async function saveGeneralAnswerForOffline(
  question: string,
  answer: string,
  userId?: string
): Promise<void> {
  const norm = normalizeQuestion(question);
  if (!norm || norm.length < 3 || !answer) return;

  // Never save stories into static cache
  if (isStoryQuery(question) || /once upon a time|chapter \d|setting:|protagonist:/i.test(answer)) {
    return;
  }

  const now = new Date().toISOString();
  const item: QAMemoryItem = {
    id: `qa_offline_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    question: question.trim(),
    normalizedQuestion: norm,
    answer: answer.trim(),
    timestamp: now,
    recallCount: 1,
    category: 'general_qa',
    userId: userId || 'guest',
  };

  persistOfflineArchive(item);

  // Sync to Firestore for permanent preservation
  try {
    const docRef = doc(db, 'ai_qa_memory', `qa-${norm.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}`);
    await setDoc(
      docRef,
      {
        id: `qa-${norm.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}`,
        prompt: question.trim(),
        normalizedPrompt: norm,
        answer: answer.trim(),
        category: 'general_qa',
        createdAt: now,
        hitCount: 1,
        userType: userId ? 'authenticated' : 'guest',
        userEmail: userId || 'system',
      },
      { merge: true }
    );
  } catch (_) {}
}

/**
 * Legacy wrapper function for backwards compatibility
 */
export async function saveQAMemory(
  question: string,
  answer: string,
  userId?: string
): Promise<QAMemoryItem | null> {
  const wordTarget = extractWordMeaningTarget(question);
  if (wordTarget) {
    return saveWordMeaningMemory(wordTarget, answer, userId);
  }
  const mathNorm = normalizeMathExpression(question);
  if (mathNorm && /[+\-*/^]/.test(mathNorm)) {
    return saveCalculationMemory(question, answer, userId);
  }
  await saveGeneralAnswerForOffline(question, answer, userId);
  return null;
}

/**
 * Get all cached Q&A memories
 */
export function getAllQAMemories(): QAMemoryItem[] {
  return initCache();
}
