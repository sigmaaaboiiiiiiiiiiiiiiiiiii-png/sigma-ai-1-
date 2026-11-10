/**
 * Robotic Language Cipher for Sigma AI
 * Secret operational mode triggered exclusively when the message starts with "usesigma".
 */

// Helper to convert digits to words so the cipher contains strictly letters without any numbers
const DIGIT_WORDS: Record<string, string> = {
  '0': 'ZERO',
  '1': 'ONE',
  '2': 'TWO',
  '3': 'THREE',
  '4': 'FOUR',
  '5': 'FIVE',
  '6': 'SIX',
  '7': 'SEVEN',
  '8': 'EIGHT',
  '9': 'NINE',
};

function replaceNumbersWithWords(text: string): string {
  return text.replace(/[0-9]/g, (d) => ` ${DIGIT_WORDS[d] || ''} `);
}

/**
 * Checks whether a user prompt triggers the secret robotic mode
 */
export function isUseSigmaMode(prompt: string): boolean {
  if (!prompt || typeof prompt !== 'string') return false;
  return /^\s*usesigma\b/i.test(prompt);
}

/**
 * Strips the 'usesigma' trigger keyword from the front of the prompt
 */
export function cleanUseSigmaPrompt(prompt: string): string {
  return prompt.replace(/^\s*usesigma\s*/i, '').trim();
}

/**
 * Checks if user is requesting to return to normal language
 */
export function isReturnToNormalLanguage(prompt: string): boolean {
  if (!prompt || typeof prompt !== 'string') return false;
  return /come\s+to\s+normal\s+language|switch\s+to\s+normal|back\s+to\s+normal|speak\s+normal/i.test(prompt);
}

/**
 * Encodes text strictly into the [SIGMA-REV] cipher:
 * - Step 1: Spell every word completely backward.
 * - Step 2: Convert all letters to ALL CAPS.
 * - Step 3: Add futuristic formatting punctuation—put a dot (.) before each word, and a slash (/) after each word.
 * - Step 4: Prefix the entire response with [SIGMA-REV].
 * - Strict Rule: Zero digits/numbers.
 */
export function encodeSigmaRoboticCipher(text: string): string {
  if (!text || typeof text !== 'string') {
    return '[SIGMA-REV] .MA/ .AMGIS/ .IA/';
  }

  // 1. Remove markdown bold/italics/urls that disrupt word parsing
  let sanitized = text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[*_`~#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Replace any numbers with spoken words
  sanitized = replaceNumbersWithWords(sanitized);

  // 3. Extract words (sequences of letters/apostrophes)
  const tokens = sanitized.split(/\s+/).filter(Boolean);
  const cipherWords: string[] = [];

  for (const token of tokens) {
    // Keep only alphabetic characters
    const cleanWord = token.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (!cleanWord) continue;

    // Step 1 & 2: Reverse letters and ensure ALL CAPS
    const reversed = cleanWord.split('').reverse().join('');

    // Step 3: Format with leading dot (.) and trailing slash (/)
    cipherWords.push(`.${reversed}/`);
  }

  if (cipherWords.length === 0) {
    return '[SIGMA-REV] .MA/ .AMGIS/ .IA/';
  }

  // Step 4: Prefix entire response with [SIGMA-REV]
  return `[SIGMA-REV] ${cipherWords.join(' ')}`;
}
