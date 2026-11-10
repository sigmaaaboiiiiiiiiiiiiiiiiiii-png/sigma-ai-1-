/**
 * History Filter & Specific History Management
 * Ensures only specific, substantive, and meaningful conversations are saved
 * in user history, preventing clutter from transient greetings, 1-word tests, or ephemeral queries.
 */

import { ChatMessage, Conversation } from '../types';

/**
 * Checks whether a conversation qualifies as "specific history" to be saved.
 */
export function isSpecificHistoryEligible(conv: {
  messages: ChatMessage[];
  title?: string;
  isSpecificSaved?: boolean;
  isPinned?: boolean;
}): boolean {
  if (conv.isSpecificSaved || conv.isPinned) return true;

  const msgs = conv.messages || [];
  if (msgs.length === 0) return false;

  const userMsgs = msgs.filter((m) => m.role === 'user');
  const modelMsgs = msgs.filter((m) => m.role === 'model' && !m.isError);

  // Keep if has image attachments
  if (userMsgs.some((m) => m.images && m.images.length > 0)) return true;

  // Store actual conversations that have at least one user message and assistant response,
  // or an active user prompt in progress
  const firstUserMsg = userMsgs[0]?.content?.trim() || '';
  if (!firstUserMsg) return false;

  if (userMsgs.length >= 1 && modelMsgs.length >= 1) {
    return true;
  }

  return firstUserMsg.length >= 2;
}
