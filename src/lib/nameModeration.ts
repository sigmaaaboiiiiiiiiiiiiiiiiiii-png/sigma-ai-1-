import { getUserExecutiveRole } from './userRoles';
import { UserProfile } from '../types';

export interface NameValidationResult {
  valid: boolean;
  reason?:
    | 'authority_impersonation'
    | 'explicit_sexual'
    | 'profanity_vulgar'
    | 'slur_harassment'
    | 'invalid_format'
    | 'account_suspended';
  message?: string;
  strikeCount?: number;
  suspended?: boolean;
  suspendedUntil?: number | null;
  remainingMinutes?: number;
}

const STRIKE_STORAGE_PREFIX = 'sigma_name_mod_strikes_v3_';
const SUSPENSION_UNTIL_PREFIX = 'sigma_account_susp_until_v3_';
export const MAX_ALLOWED_REJECTED_NAME_ATTEMPTS = 10; // Exceeding 10 attempts (> 10) triggers 1-hour suspension
export const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Checks if the account is one of the 3 authorized Owner/Development Google accounts.
 * Never trusts display name or unauthenticated state.
 */
export function isVerifiedOwnerAccount(
  emailOrUser?: string | Partial<UserProfile> | null
): boolean {
  if (!emailOrUser) return false;

  if (typeof emailOrUser === 'object') {
    if (!emailOrUser.isLoggedIn) return false;
    if (emailOrUser.authProvider && emailOrUser.authProvider !== 'google') {
      return false;
    }
    if (emailOrUser.isVerifiedOwner === true) {
      return true;
    }
    if (emailOrUser.isVerifiedOwner === false) {
      return false;
    }
    const role = getUserExecutiveRole(emailOrUser.email);
    return role === 'owner' || role === 'coo';
  }

  const role = getUserExecutiveRole(emailOrUser);
  return role === 'owner' || role === 'coo';
}

const CHAR_SUBSTITUTION_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '!': 'i',
  '|': 'l',
  '3': 'e',
  '4': 'a',
  '@': 'a',
  '5': 's',
  '$': 's',
  '6': 'g',
  '7': 't',
  '+': 't',
  '8': 'b',
  '9': 'g',
};

/**
 * Normalizes a candidate name to catch obfuscation:
 * - Lowercases and strips accents/diacritics
 * - Converts leetspeak/symbol substitutions
 * - Removes punctuation/separators between letters
 * - Collapses repeated characters (e.g. "ooowwwnnneeerrr" -> "owner")
 */
function normalizeForModeration(raw: string): {
  cleaned: string;
  collapsed: string;
  compact: string;
  compactCollapsed: string;
  tokens: string[];
  collapsedTokens: string[];
} {
  const lower = (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  let substituted = '';
  for (const ch of lower) {
    substituted += CHAR_SUBSTITUTION_MAP[ch] ?? ch;
  }

  // Replace non-alphanumeric with spaces for token analysis
  const cleaned = substituted.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Collapse 2+ consecutive identical letters into 1 letter
  const collapsed = cleaned.replace(/([a-z])\1+/g, '$1');

  // Remove all spaces & punctuation to detect split-letter or combined-word tricks ("o w n e r", "s.e.x", "theowner")
  const compact = substituted.replace(/[^a-z0-9]/g, '');
  const compactCollapsed = compact.replace(/([a-z])\1+/g, '$1');

  const tokens = cleaned.split(' ').filter(Boolean);
  const collapsedTokens = collapsed.split(' ').filter(Boolean);

  return {
    cleaned,
    collapsed,
    compact,
    compactCollapsed,
    tokens,
    collapsedTokens,
  };
}

// 1. Authority & Impersonation tokens/phrases restricted for normal accounts
const AUTHORITY_EXACT_OR_TOKEN_PATTERNS = [
  'owner',
  'owners',
  'theowner',
  'sigmaowner',
  'realowner',
  'appowner',
  'aiowner',
  'admin',
  'admins',
  'administrator',
  'administrators',
  'sigmaadmin',
  'sysadmin',
  'superadmin',
  'ceo',
  'ceos',
  'sigmaceo',
  'theceo',
  'creator',
  'creators',
  'sigmacreator',
  'thecreator',
  'founder',
  'founders',
  'cofounder',
  'sigmafounder',
  'developer',
  'developers',
  'sigmadeveloper',
  'leaddev',
  'official',
  'sigmaofficial',
  'officialsigma',
  'moderator',
  'moderators',
  'staff',
  'sigmastaff',
  'system',
  'root',
  'superuser',
  'hacker',
  'hackers',
  'anonymoushacker',
  'ayaanharis',
  'ayanharis',
  'wahajhaider',
];

const AUTHORITY_SUBSTRING_REGEX =
  /\b(the\s*owner|sigma\s*owner|sigma\s*admin|sigma\s*ceo|sigma\s*creator|sigma\s*founder|sigma\s*developer|sigma\s*official|official\s*sigma|system\s*admin|app\s*owner|real\s*owner|i\s*am\s*owner|im\s*owner|ayaan\s*haris|ayan\s*haris|wahaj\s*haider)\b/i;

// 2. Explicit Sexual & Suggestive Patterns
const EXPLICIT_SEXUAL_PATTERNS = [
  'sex',
  'sexy',
  'sexual',
  'porn',
  'porno',
  'pornography',
  'xxx',
  'nsfw',
  'nude',
  'nudes',
  'naked',
  'boob',
  'boobs',
  'tits',
  'titties',
  'penis',
  'vagina',
  'pussy',
  'dick',
  'cock',
  'dildo',
  'vibrator',
  'orgasm',
  'masturbate',
  'masturbation',
  'blowjob',
  'handjob',
  'cum',
  'cumshot',
  'horny',
  'erotic',
  'hentai',
  'onlyfans',
  'hooker',
  'escort',
  'prostitute',
  'stripper',
  'milf',
  'bdsm',
  'fetish',
  'anal',
  'deepthroat',
];

// 3. Profanity, Vulgar Insults & Obscene Expressions (English + Roman Urdu/Hindi)
const PROFANITY_VULGAR_PATTERNS = [
  'fuck',
  'fucker',
  'fucking',
  'motherfucker',
  'mf',
  'shit',
  'bullshit',
  'shitty',
  'bitch',
  'bitches',
  'sonofabitch',
  'asshole',
  'bastard',
  'dumbass',
  'jackass',
  'cunt',
  'whore',
  'slut',
  'skank',
  'hoe',
  'prick',
  'wanker',
  'twat',
  'bollocks',
  ' piss',
  'pissed',
  // Common Roman Urdu / Hindi severe vulgarities
  'chutiya',
  'chutia',
  'bhenchod',
  'behenchod',
  'madarchod',
  'mc',
  'bc',
  'gandu',
  'gaandu',
  'randi',
  'harami',
  'haramzada',
  'kamina',
  'kutta',
  'kutiya',
  'loru',
  'loda',
  'lund',
  'bhosdike',
  'bhosdi',
  'gashti',
  'kanjar',
  'tatti',
];

// 4. Slurs, Hate Speech & Severe Harassment
const SLUR_HARASSMENT_PATTERNS = [
  'nigger',
  'nigga',
  'faggot',
  'fag',
  'retard',
  'retarded',
  'tranny',
  'kike',
  'spic',
  'chink',
  'wetback',
  'raghead',
  'towelhead',
  'nazi',
  'hitler',
  'terrorist',
  'jihadist',
  'rapist',
  'rape',
  'pedophile',
  'pedo',
  'childabuse',
  'killall',
  'kys',
  'suicidal',
];

function getAccountKey(email?: string | null): string {
  return (email || 'guest').trim().toLowerCase() || 'guest';
}

export function getNameViolationStrikes(email?: string | null): number {
  if (!email || isVerifiedOwnerAccount(email)) return 0;
  try {
    const key = STRIKE_STORAGE_PREFIX + getAccountKey(email);
    const val = parseInt(localStorage.getItem(key) || '0', 10);
    return Number.isFinite(val) && val > 0 ? val : 0;
  } catch {
    return 0;
  }
}

export function getAccountSuspensionRemainingMs(email?: string | null): number {
  if (!email || isVerifiedOwnerAccount(email)) return 0;
  try {
    const key = SUSPENSION_UNTIL_PREFIX + getAccountKey(email);
    const until = parseInt(localStorage.getItem(key) || '0', 10);
    if (!Number.isFinite(until) || until <= 0) return 0;
    const remaining = until - Date.now();
    if (remaining <= 0) {
      // Automatically expire the 1-hour suspension and reset strike counter
      localStorage.removeItem(key);
      localStorage.removeItem(STRIKE_STORAGE_PREFIX + getAccountKey(email));
      return 0;
    }
    return remaining;
  } catch {
    return 0;
  }
}

export function isAccountSuspended(email?: string | null): boolean {
  return getAccountSuspensionRemainingMs(email) > 0;
}

export function syncModerationStateFromServer(
  email: string,
  state: { attempts?: number; suspendedUntil?: number | null }
): void {
  if (!email || isVerifiedOwnerAccount(email)) return;
  try {
    const accKey = getAccountKey(email);
    if (typeof state.attempts === 'number') {
      localStorage.setItem(STRIKE_STORAGE_PREFIX + accKey, String(state.attempts));
    }
    if (state.suspendedUntil && state.suspendedUntil > Date.now()) {
      localStorage.setItem(SUSPENSION_UNTIL_PREFIX + accKey, String(state.suspendedUntil));
      window.dispatchEvent(
        new CustomEvent('sigma-account-suspended', {
          detail: { email: accKey, suspendedUntil: state.suspendedUntil },
        })
      );
    } else if (state.suspendedUntil === null || (state.suspendedUntil && state.suspendedUntil <= Date.now())) {
      localStorage.removeItem(SUSPENSION_UNTIL_PREFIX + accKey);
    }
  } catch {
    // ignore
  }
}

export async function syncAccountModerationFromServer(
  email: string
): Promise<{ suspended: boolean; attempts: number }> {
  if (!email || isVerifiedOwnerAccount(email)) {
    return { suspended: false, attempts: 0 };
  }
  try {
    const accKey = getAccountKey(email);
    const res = await fetch(`/api/account/moderation-status?email=${encodeURIComponent(accKey)}`);
    if (res.ok) {
      const data = await res.json();
      syncModerationStateFromServer(accKey, {
        attempts: typeof data.attempts === 'number' ? data.attempts : undefined,
        suspendedUntil: data.suspendedUntilMs ?? data.suspendedUntil ?? null,
      });
      return {
        suspended: Boolean(data.suspended),
        attempts: typeof data.attempts === 'number' ? data.attempts : 0,
      };
    }
  } catch {
    // ignore network errors
  }
  return {
    suspended: isAccountSuspended(email),
    attempts: getNameViolationStrikes(email),
  };
}

export function recordNameViolationStrike(email?: string | null): {
  strikeCount: number;
  suspended: boolean;
  suspendedUntil: number | null;
} {
  if (!email || isVerifiedOwnerAccount(email)) {
    return { strikeCount: 0, suspended: false, suspendedUntil: null };
  }
  const accKey = getAccountKey(email);
  let nextStrikes = getNameViolationStrikes(accKey) + 1;
  let suspendedUntil: number | null = null;
  let suspended = false;

  try {
    localStorage.setItem(STRIKE_STORAGE_PREFIX + accKey, String(nextStrikes));
    // Section 6: If a normal account exceeds 10 rejected restricted-name attempts (> 10),
    // temporarily suspend the account for exactly 1 hour.
    if (nextStrikes > MAX_ALLOWED_REJECTED_NAME_ATTEMPTS) {
      suspended = true;
      suspendedUntil = Date.now() + ONE_HOUR_MS;
      localStorage.setItem(SUSPENSION_UNTIL_PREFIX + accKey, String(suspendedUntil));
      window.dispatchEvent(
        new CustomEvent('sigma-account-suspended', {
          detail: { email: accKey, strikeCount: nextStrikes, suspendedUntil },
        })
      );
    }
  } catch {
    // ignore storage errors
  }

  // Also record on backend securely (non-blocking sync so server is authoritative)
  fetch('/api/account/record-name-strike', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: accKey }),
  })
    .then((r) => r.json())
    .then((serverData) => {
      if (serverData && typeof serverData.attempts === 'number') {
        syncModerationStateFromServer(accKey, {
          attempts: serverData.attempts,
          suspendedUntil: serverData.suspendedUntilMs ?? serverData.suspendedUntil ?? null,
        });
      }
    })
    .catch(() => {});

  return { strikeCount: nextStrikes, suspended, suspendedUntil };
}

/**
 * Extracts a safe display name if an anonymous user introduces their name during a chat session
 * (e.g., "My name is Alex", "Call me Alex", "I'm Alex", "Mera naam Alex hai").
 * Never accepts restricted/owner/impersonating names.
 */
export function extractAnonymousSessionName(messageText: string): string | null {
  const text = (messageText || '').trim();
  if (!text || text.length > 140) return null;

  const patterns = [
    /\b(?:my\s+name\s+is|call\s+me|you\s+can\s+call\s+me|i\s+am\s+called|mera\s+naam)\s+([a-zA-Z][a-zA-Z\s'-]{1,24}?)(?:\s+hai\b|[.,!?]|$)/i,
    /^(?:i'm|i\s+am)\s+([A-Z][a-zA-Z'-]{1,18})(?:[.,!?]|$)/,
  ];

  for (const reg of patterns) {
    const m = text.match(reg);
    if (m && m[1]) {
      const candidate = m[1].trim().replace(/\s+/g, ' ');
      // Reject common non-name adjectives/phrases after "I'm" or "I am"
      if (
        /^(good|fine|great|okay|ok|here|ready|asking|looking|trying|working|happy|sad|tired|back|new|a\s+user|an?\s+\w+)$/i.test(
          candidate
        )
      ) {
        continue;
      }
      const check = validateAccountName(candidate, 'guest', { recordStrikeOnFail: false });
      if (check.valid) {
        return candidate;
      }
    }
  }
  return null;
}

/**
 * Validates a profile/display name before accepting it.
 * - Authorized Owner accounts bypass normal name restrictions.
 * - Normal accounts are checked against authority impersonation, explicit sexual content,
 *   profanity/vulgarity, and slurs/harassment including obfuscated variations.
 */
export function validateAccountName(
  candidateName: string,
  userEmailOrProfile?: string | Partial<UserProfile> | null,
  options?: { recordStrikeOnFail?: boolean }
): NameValidationResult {
  const trimmed = (candidateName || '').trim();
  const userEmail: string | null =
    typeof userEmailOrProfile === 'object' && userEmailOrProfile !== null
      ? userEmailOrProfile.email || null
      : typeof userEmailOrProfile === 'string'
      ? userEmailOrProfile
      : null;

  if (!trimmed) {
    return {
      valid: false,
      reason: 'invalid_format',
      message: 'Please enter a valid display name before continuing.',
    };
  }

  // Authorized Owner accounts have unrestricted display names
  if (isVerifiedOwnerAccount(userEmailOrProfile)) {
    return { valid: true };
  }

  // Check if normal account is currently under a 1-hour temporary suspension
  const remainingMs = getAccountSuspensionRemainingMs(userEmail);
  if (remainingMs > 0) {
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
    return {
      valid: false,
      reason: 'account_suspended',
      suspended: true,
      remainingMinutes,
      message: `Your account has been temporarily suspended for 1 hour (${remainingMinutes} min remaining) due to repeated attempts to use restricted, abusive, or impersonating profile names.`,
    };
  }

  if (trimmed.length < 2 || trimmed.length > 45) {
    return {
      valid: false,
      reason: 'invalid_format',
      message: 'Display name must be between 2 and 45 characters long. Please choose another name.',
    };
  }

  const norm = normalizeForModeration(trimmed);

  // Helper to check if any pattern matches tokens, collapsed tokens, or compact forms
  const matchesCategory = (
    patterns: string[],
    allowSubstringOnLongWords = true
  ): boolean => {
    for (const pat of patterns) {
      const cleanPat = pat.trim().toLowerCase();
      const collapsedPat = cleanPat.replace(/([a-z])\1+/g, '$1');

      if (
        norm.tokens.includes(cleanPat) ||
        norm.collapsedTokens.includes(cleanPat) ||
        norm.collapsedTokens.includes(collapsedPat) ||
        norm.compact === cleanPat ||
        norm.compactCollapsed === collapsedPat
      ) {
        return true;
      }

      // Check plural/singular variations (e.g., owners, admins, hackers, bitches)
      if (
        norm.tokens.includes(`${cleanPat}s`) ||
        norm.collapsedTokens.includes(`${collapsedPat}s`)
      ) {
        return true;
      }

      if (allowSubstringOnLongWords && cleanPat.length >= 4) {
        if (
          norm.compact.includes(cleanPat) ||
          norm.compactCollapsed.includes(collapsedPat)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  let violationReason: NameValidationResult['reason'] | null = null;

  if (
    AUTHORITY_SUBSTRING_REGEX.test(trimmed) ||
    AUTHORITY_SUBSTRING_REGEX.test(norm.cleaned) ||
    AUTHORITY_SUBSTRING_REGEX.test(norm.collapsed) ||
    matchesCategory(AUTHORITY_EXACT_OR_TOKEN_PATTERNS, true)
  ) {
    violationReason = 'authority_impersonation';
  } else if (matchesCategory(SLUR_HARASSMENT_PATTERNS, true)) {
    violationReason = 'slur_harassment';
  } else if (matchesCategory(EXPLICIT_SEXUAL_PATTERNS, true)) {
    violationReason = 'explicit_sexual';
  } else if (matchesCategory(PROFANITY_VULGAR_PATTERNS, true)) {
    violationReason = 'profanity_vulgar';
  }

  if (violationReason) {
    let strikeInfo = {
      strikeCount: getNameViolationStrikes(userEmail),
      suspended: isAccountSuspended(userEmail),
      suspendedUntil: null as number | null,
    };
    if (options?.recordStrikeOnFail !== false) {
      strikeInfo = recordNameViolationStrike(userEmail);
    }

    if (strikeInfo.suspended) {
      return {
        valid: false,
        reason: violationReason,
        strikeCount: strikeInfo.strikeCount,
        suspended: true,
        suspendedUntil: strikeInfo.suspendedUntil,
        remainingMinutes: 60,
        message:
          'Your account has been temporarily suspended for 1 hour because of repeated attempts to use restricted, abusive, or impersonating profile names.',
      };
    }

    const userFacingMessage =
      violationReason === 'authority_impersonation'
        ? 'This selected name cannot be used because authority or owner titles are reserved. Please choose another name.'
        : 'This selected name cannot be used under Sigma AI safety guidelines. Please choose another name.';

    return {
      valid: false,
      reason: violationReason,
      strikeCount: strikeInfo.strikeCount,
      suspended: false,
      message: userFacingMessage,
    };
  }

  return { valid: true };
}
