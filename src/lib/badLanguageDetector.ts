/**
 * Bad language & profanity detector.
 *
 * When the user uses bad language / profanity, the system must not proceed
 * with the request and instead replies:
 * "I cannot proceed with this request. Please write in proper English by yourself."
 */

const BAD_WORDS_REGEX =
  /\b(fuck|fucker|fucking|fucked|fucks|fuckin|fck|motherfucker|motherfucking|mf|shit|shits|shitty|bullshit|horseshit|dipshit|bitch|bitches|bitching|asshole|assholes|dumbass|jackass|bastard|bastards|cunt|cunts|dick|dicks|dickhead|pussy|pussies|cock|cocks|cocksucker|whore|whores|slut|sluts|skank|prick|pricks|wanker|wankers|twat|twats|bollocks|retard|retarded|fag|faggot|nigger|nigga|chutiya|chutia|bhenchod|behenchod|madarchod|gandu|gaandu|randi|harami|haramzada|kamina|kutta|kutiya|loru|loda|lund|bhosdike|bhosdi|gashti|kanjar|tatti)\b/i;

const OBFUSCATED_PATTERNS = [
  /f[\s*._-]*u[\s*._-]*c[\s*._-]*k/i,
  /s[\s*._-]*h[\s*._-]*i[\s*._-]*t/i,
  /b[\s*._-]*i[\s*._-]*t[\s*._-]*c[\s*._-]*h/i,
  /c[\s*._-]*u[\s*._-]*n[\s*._-]*t/i,
  /a[\s*._-]*s[\s*._-]*s[\s*._-]*h[\s*._-]*o[\s*._-]*l[\s*._-]*e/i,
  /b[\s*._-]*a[\s*._-]*s[\s*._-]*t[\s*._-]*a[\s*._-]*r[\s*._-]*d/i,
  /f[\s*._-]*[\*@$]+[\s*._-]*c[\s*._-]*k/i,
  /sh[\s*._-]*[\*@$]+[\s*._-]*t/i,
  /b[\s*._-]*[\*@$]+[\s*._-]*tch/i,
];

export const BAD_LANGUAGE_REJECTION_MESSAGE =
  'I cannot proceed with this request. Please write in proper English by yourself.';

/**
 * Checks if the message contains profanity, swear words, or bad language.
 */
export function detectBadLanguage(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Direct word match
  if (BAD_WORDS_REGEX.test(trimmed)) {
    return true;
  }

  // Obfuscated / spaced pattern match
  for (const pattern of OBFUSCATED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  return false;
}
