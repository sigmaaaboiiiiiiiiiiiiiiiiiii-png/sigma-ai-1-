/**
 * Bad language & profanity filter
 * Enforces the safety policy requested by the user:
 * "no bad languages if said bad languages he will say i cannot prcedd this request write english by your self"
 */

const PROFANITY_PATTERNS = [
  /\b(fuck|fucking|fucked|fucker|fuckers|fucks|motherfucker|motherfucking)\b/i,
  /\b(shit|shits|shitty|bullshit)\b/i,
  /\b(bitch|bitches|bitching)\b/i,
  /\b(bastard|bastards)\b/i,
  /\b(asshole|assholes|arsehole)\b/i,
  /\b(dick|dicks|cunt|cunts|pussy|pussies)\b/i,
  /\b(whore|whores|slut|sluts)\b/i,
  /\b(f\*ck|s\*it|b\*tch|a\*\*hole)\b/i,
];

export function containsBadLanguage(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return PROFANITY_PATTERNS.some((pattern) => pattern.test(text));
}

export const BAD_LANGUAGE_REJECTION_MESSAGE =
  'I cannot proceed with this request. Please write clean English by yourself.';
