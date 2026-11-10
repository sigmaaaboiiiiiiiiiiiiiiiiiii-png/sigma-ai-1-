import { Conversation, UserProfile } from '../types';
import { db } from './firebase';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

export type LibraryContentType =
  | 'Essay'
  | 'Story'
  | 'Article'
  | 'Summary'
  | 'Prompt'
  | 'Code'
  | 'Presentation'
  | 'Spreadsheet'
  | 'Document'
  | 'Quote';

export interface SavedLibraryItem {
  id: string;
  userId: string;
  title: string;
  contentType: LibraryContentType;
  content: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
  isDerived?: boolean;
}

export interface SavedPictureItem {
  id: string;
  userId: string;
  title: string;
  src: string;
  conversationId?: string;
  createdAt: string;
}

export function getUserStorageKey(user?: UserProfile | null): string {
  if (!user || !user.isLoggedIn) return 'guest';
  const idOrEmail = (user.email || user.id || 'guest').trim().toLowerCase();
  return idOrEmail || 'guest';
}

function getLibraryStorageKey(user?: UserProfile | null): string {
  return `sigma_library_v1_${getUserStorageKey(user)}`;
}

function getDeletedDerivedIdsKey(user?: UserProfile | null): string {
  return `sigma_library_deleted_derived_${getUserStorageKey(user)}`;
}

function getPicturesStorageKey(user?: UserProfile | null): string {
  return `sigma_pictures_v1_${getUserStorageKey(user)}`;
}

function getDeletedPictureIdsKey(user?: UserProfile | null): string {
  return `sigma_pictures_deleted_${getUserStorageKey(user)}`;
}

export function detectLibraryContentType(text: string, title = ''): LibraryContentType {
  const combined = `${title} ${text}`.toLowerCase();
  if (text.includes('sigma-powerpoint')) return 'Presentation';
  if (text.includes('sigma-excel')) return 'Spreadsheet';
  if (text.includes('```') || /\b(function|const|class|def |import |export |SELECT |<html>)\b/.test(text)) {
    return 'Code';
  }
  if (/\b(create an ultra-detailed|prompt for|image prompt|prompt template)\b/i.test(combined)) {
    return 'Prompt';
  }
  if (
    text.includes('[Add a stronger ending twist]') ||
    /\b(once upon a time|chapter \d|story|tale|protagonist)\b/i.test(combined)
  ) {
    return 'Story';
  }
  if (
    /\b(quotes?|quotations?|sayings?|inspirational quotes?|famous quotes?)\b/i.test(combined) ||
    /(?:["“][^"”]{8,}["”]\s*[-—–]\s*[A-Z])/.test(text)
  ) {
    return 'Quote';
  }
  if (/\b(summarize|summary|short summary|executive summary|key takeaways)\b/i.test(combined)) {
    return 'Summary';
  }
  if (/\b(essay|thesis|introduction|conclusion|paragraph)\b/i.test(combined)) {
    return 'Essay';
  }
  if (/\b(article|report|analysis|guide|overview)\b/i.test(combined) || text.length > 900) {
    return 'Article';
  }
  return 'Document';
}

export function cleanLibraryDisplayContent(rawContent: string): string {
  return (rawContent || '')
    .replace(/```sigma-powerpoint[\s\S]*?```/gi, '[PowerPoint Presentation Deck Attached]')
    .replace(/```sigma-excel[\s\S]*?```/gi, '[Excel Spreadsheet Workbook Attached]')
    .replace(/```sigma-ppt-slide-count-prompt[\s\S]*?```/gi, '')
    .replace(/\[Add a stronger ending twist\]/gi, '')
    .replace(/\[Show feeling more clearly\]/gi, '')
    .trim();
}

export function getStoredLibraryItems(user?: UserProfile | null): SavedLibraryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getLibraryStorageKey(user));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getDeletedDerivedIds(user?: UserProfile | null): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(getDeletedDerivedIdsKey(user));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function addDeletedDerivedId(user: UserProfile | null | undefined, id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedDerivedIds(user);
    current.add(id);
    localStorage.setItem(getDeletedDerivedIdsKey(user), JSON.stringify(Array.from(current)));
  } catch {
    // ignore
  }
}

let cachedLibraryHash = '';
let cachedLibraryList: SavedLibraryItem[] = [];

/**
 * Checks if a model message is genuine reusable material for the Library
 * (Strictly excludes greetings, short questions, ordinary chat answers, and chat transcripts)
 */
export function isReusableLibraryArtifact(modelContent: string, precedingUserPrompt = ''): boolean {
  if (!modelContent || typeof modelContent !== 'string') return false;
  const text = modelContent.trim();
  const promptLower = (precedingUserPrompt || '').trim().toLowerCase();

  // Never save short chat replies, greetings, or slide-count prompts
  if (text.includes('sigma-ppt-slide-count-prompt')) return false;
  if (
    /^(hi|hello|hey|yo|ho|how are you|what'?s up|sup|ok|okay|thanks|thank you|bye|goodbye)\b/i.test(
      promptLower
    ) &&
    promptLower.split(/\s+/).length <= 5
  ) {
    return false;
  }

  // STRICT RULE: Word meanings, vocabulary definitions, dictionary explanations are NEVER saved to library
  const isWordMeaning =
    /\b(meaning\s+of|word\s+meaning|define\b|definition\s+of|what\s+does\s+.*mean|vocabulary|synonym|antonym|kya\s+matlab|matlab\s+kya)\b/i.test(
      promptLower
    ) ||
    /^(#+\s*)?(meaning\s+of|word\s+meaning|definition\s+of)\b/im.test(text) ||
    /\b(definition:|part\s+of\s+speech:|word\s+meaning:)\b/i.test(text);
  if (isWordMeaning) return false;

  // 1. PowerPoint or Excel artifacts
  if (text.includes('sigma-powerpoint') || text.includes('sigma-excel')) {
    return true;
  }

  // 2. Generated Prompts / Templates / Image Prompts
  if (
    text.includes('Create an ultra-detailed, cinematic, professional-quality image of') ||
    text.includes('Visual style: premium cinematic realism') ||
    ((/\b(image prompt|prompt for|prompt template|midjourney prompt|dall-?e prompt|system prompt)\b/i.test(
      promptLower
    ) ||
      /\bprompt\s+template\b/i.test(promptLower)) &&
      text.length >= 100)
  ) {
    return true;
  }

  // 3. Generated Stories (fictional narrative, creative writing)
  if (
    text.includes('[Add a stronger ending twist]') ||
    (/\b(write|tell|create|generate|compose)\s+(a\s+|an\s+|me\s+a\s+)?(story|tale|narrative|fiction|kahani)\b/i.test(
      promptLower
    ) &&
      text.length >= 220) ||
    (/\b(once upon a time|chapter\s+\d|part\s*1\s*[:\-].*part\s*2\s*[:\-])\b/i.test(text) &&
      text.length >= 250)
  ) {
    return true;
  }

  // 4. Quotes / Quotations
  if (
    (/\b(quotes?|quotations?|sayings?|inspirational\s+quotes?|motivational\s+quotes?|famous\s+quotes?)\b/i.test(
      promptLower
    ) &&
      text.length >= 70) ||
    (/(?:["“][^"”]{8,}["”]\s*[-—–]\s*[A-Z])/.test(text) && text.length >= 70)
  ) {
    return true;
  }

  // 5. Big Articles & In-depth Essays (comprehensive long-form writing, NOT short Q&A or definitions)
  const isBigArticlePrompt =
    /\b(write|draft|compose|create|generate)\s+(a\s+|an\s+|the\s+|me\s+an?\s+)?(big\s+article|article|essay|comprehensive\s+guide|in[- ]depth\s+guide|research\s+paper|whitepaper)\b/i.test(
      promptLower
    ) || /\b(article\s+on|essay\s+on)\b/i.test(promptLower);

  if (isBigArticlePrompt && text.length >= 480) {
    return true;
  }

  if (
    text.length >= 850 &&
    (text.match(/^#{1,3}\s+.+$/gm) || []).length >= 2 &&
    !/\b(faq|steps\s+to|how\s+to)\b/i.test(text)
  ) {
    return true;
  }

  // 6. Substantial Code Projects
  const strippedInternal = text
    .replace(/```sigma-[a-z-]+[\s\S]*?```/gi, '')
    .trim();
  if (
    /\b(write|create|build|generate|make)\s+(code|script|program|app|game|website|component)\b/i.test(
      promptLower
    ) &&
    /```[a-zA-Z0-9_-]*\n[\s\S]{60,}?```/.test(strippedInternal)
  ) {
    return true;
  }

  return false;
}

/**
 * Returns the unified, synchronized Library items for the current authenticated user,
 * strictly excluding greetings, casual chat turns, or short noisy messages.
 */
export function getUnifiedLibraryItems(
  user: UserProfile | null | undefined,
  conversations: Conversation[] = []
): SavedLibraryItem[] {
  const userKey = getUserStorageKey(user);
  const explicitItems = getStoredLibraryItems(user).filter((item) => {
    const text = (item.content || '').trim();
    if (!text || text.length < 15) return false;
    // Filter out accidental short chat greetings
    if (
      /^(hi|hello|hey|yo|ho|how are you|what'?s up|ok|okay|thanks|thank you|bye|goodbye)\b/i.test(text) &&
      text.split(/\s+/).length <= 12
    ) {
      return false;
    }
    return true;
  });
  const deletedDerived = getDeletedDerivedIds(user);

  const hashKey = `${userKey}_${explicitItems.length}_${explicitItems[0]?.updatedAt || ''}_${conversations.length}_${conversations[0]?.updatedAt || ''}_${deletedDerived.size}`;
  if (hashKey === cachedLibraryHash && cachedLibraryList.length > 0) {
    return cachedLibraryList;
  }

  const explicitIds = new Set(explicitItems.map((item) => item.id));
  const derivedItems: SavedLibraryItem[] = [];

  for (const conv of conversations) {
    const msgs = conv.messages || [];
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      if (m.role !== 'model' || !m.content || m.isError) continue;
      const derivedId = `conv-msg-${m.id}`;
      if (explicitIds.has(derivedId) || deletedDerived.has(derivedId)) continue;

      // Find preceding user message for intent context
      let precedingPrompt = '';
      for (let j = i - 1; j >= 0; j--) {
        if (msgs[j].role === 'user') {
          precedingPrompt = msgs[j].content || '';
          break;
        }
      }

      if (!isReusableLibraryArtifact(m.content, precedingPrompt)) continue;

      const contentType = detectLibraryContentType(m.content, conv.title);
      const cleaned = cleanLibraryDisplayContent(m.content);
      if (!cleaned || cleaned.length < 120) continue;

      derivedItems.push({
        id: derivedId,
        userId: userKey,
        title: conv.title || `${contentType} Item`,
        contentType,
        content: cleaned,
        conversationId: conv.id,
        createdAt:
          typeof m.timestamp === 'string'
            ? m.timestamp
            : m.timestamp instanceof Date
            ? m.timestamp.toISOString()
            : conv.createdAt || new Date().toISOString(),
        updatedAt: conv.updatedAt || conv.createdAt || new Date().toISOString(),
        isDerived: true,
      });
    }
  }

  const combined = [...explicitItems, ...derivedItems];
  combined.sort(
    (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  );

  cachedLibraryHash = hashKey;
  cachedLibraryList = combined;
  return combined;
}

export function clearAllLibraryItems(
  user: UserProfile | null | undefined,
  conversations: Conversation[] = []
): void {
  if (typeof window === 'undefined') return;
  try {
    const allCurrent = getUnifiedLibraryItems(user, conversations);
    const deletedSet = getDeletedDerivedIds(user);
    for (const item of allCurrent) {
      if (item.id.startsWith('conv-msg-')) {
        deletedSet.add(item.id);
      }
    }
    localStorage.setItem(getDeletedDerivedIdsKey(user), JSON.stringify(Array.from(deletedSet)));
    localStorage.setItem(getLibraryStorageKey(user), JSON.stringify([]));
    cachedLibraryHash = '';
    cachedLibraryList = [];
    window.dispatchEvent(new CustomEvent('sigma-library-updated'));
  } catch {
    // ignore
  }
}

export function saveItemToLibrary(
  user: UserProfile | null | undefined,
  item: {
    id?: string;
    title: string;
    contentType?: LibraryContentType;
    content: string;
    conversationId?: string;
  }
): SavedLibraryItem {
  const userKey = getUserStorageKey(user);
  const existing = getStoredLibraryItems(user);
  const now = new Date().toISOString();
  const cleanedContent = cleanLibraryDisplayContent(item.content);
  const resolvedType = item.contentType || detectLibraryContentType(item.content, item.title);
  const itemId = item.id || `lib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const existingIndex = existing.findIndex((i) => i.id === itemId);
  let savedItem: SavedLibraryItem;

  if (existingIndex >= 0) {
    savedItem = {
      ...existing[existingIndex],
      title: item.title.trim() || existing[existingIndex].title,
      contentType: resolvedType,
      content: cleanedContent,
      updatedAt: now,
      isDerived: false,
    };
    existing[existingIndex] = savedItem;
  } else {
    savedItem = {
      id: itemId,
      userId: userKey,
      title: item.title.trim() || `${resolvedType} (${new Date().toLocaleDateString()})`,
      contentType: resolvedType,
      content: cleanedContent,
      conversationId: item.conversationId,
      createdAt: now,
      updatedAt: now,
      isDerived: false,
    };
    existing.unshift(savedItem);
  }

  try {
    cachedLibraryHash = '';
    localStorage.setItem(getLibraryStorageKey(user), JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent('sigma-library-updated'));
  } catch {
    // ignore storage quota errors
  }

  // Also persist to Firestore if logged in
  const effectiveUserId = user?.id || (user?.email ? user.email.toLowerCase().trim() : null);
  if (user?.isLoggedIn && effectiveUserId) {
    try {
      const itemRef = doc(db, 'users', effectiveUserId, 'library', savedItem.id);
      setDoc(itemRef, {
        id: savedItem.id,
        userId: effectiveUserId,
        title: savedItem.title,
        contentType: savedItem.contentType,
        content: savedItem.content,
        conversationId: savedItem.conversationId || '',
        createdAt: savedItem.createdAt,
        updatedAt: savedItem.updatedAt,
        isDerived: false,
      }).catch((err) => console.warn('Firestore library setDoc error:', err));
    } catch (e) {
      console.warn('Failed to queue Firestore library write:', e);
    }
  }

  return savedItem;
}

export function deleteLibraryItem(user: UserProfile | null | undefined, itemId: string): void {
  const existing = getStoredLibraryItems(user).filter((i) => i.id !== itemId);
  if (itemId.startsWith('conv-msg-')) {
    addDeletedDerivedId(user, itemId);
  }
  try {
    cachedLibraryHash = '';
    localStorage.setItem(getLibraryStorageKey(user), JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent('sigma-library-updated'));
  } catch {
    // ignore
  }

  // Also delete from Firestore if logged in
  const effectiveUserId = user?.id || (user?.email ? user.email.toLowerCase().trim() : null);
  if (user?.isLoggedIn && effectiveUserId) {
    try {
      const itemRef = doc(db, 'users', effectiveUserId, 'library', itemId);
      deleteDoc(itemRef).catch((err) => console.warn('Firestore library delete error:', err));
    } catch (e) {
      console.warn('Failed to queue Firestore library delete:', e);
    }
  }
}

export async function syncLibraryWithFirestore(user: UserProfile | null | undefined): Promise<SavedLibraryItem[]> {
  const effectiveUserId = user?.id || (user?.email ? user.email.toLowerCase().trim() : null);
  if (!user?.isLoggedIn || !effectiveUserId) return getStoredLibraryItems(user);
  try {
    const colRef = collection(db, 'users', effectiveUserId, 'library');
    const snapshot = await getDocs(colRef);
    const firestoreItems: SavedLibraryItem[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data && data.title && data.content) {
        firestoreItems.push({
          id: data.id || d.id,
          userId: effectiveUserId,
          title: data.title,
          contentType: data.contentType || 'Document',
          content: data.content,
          conversationId: data.conversationId,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          isDerived: false,
        });
      }
    });

    if (firestoreItems.length > 0) {
      const local = getStoredLibraryItems(user);
      const map = new Map<string, SavedLibraryItem>();
      firestoreItems.forEach((i) => map.set(i.id, i));
      local.forEach((i) => {
        if (!map.has(i.id)) map.set(i.id, i);
      });
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );
      localStorage.setItem(getLibraryStorageKey(user), JSON.stringify(merged));
      cachedLibraryHash = '';
      window.dispatchEvent(new CustomEvent('sigma-library-updated'));
      return merged;
    }
  } catch (err) {
    console.warn('Firestore library sync notice:', err);
  }
  return getStoredLibraryItems(user);
}

export function downloadLibraryItem(item: SavedLibraryItem): void {
  const ext = item.contentType === 'Code' ? 'txt' : 'md';
  const safeName = (item.title || 'sigma-library-item')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const blob = new Blob([`# ${item.title}\nType: ${item.contentType}\nDate: ${new Date(item.updatedAt || item.createdAt).toLocaleString()}\n\n${item.content}`], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName || 'sigma-library'}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * PICTURES STORAGE (Strictly user-uploaded or user-pasted images, private to the signed-in user)
 */
export function getStoredUserPictures(user?: UserProfile | null): SavedPictureItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getPicturesStorageKey(user));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getDeletedPictureIds(user?: UserProfile | null): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(getDeletedPictureIdsKey(user));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveUserUploadedPicture(
  user: UserProfile | null | undefined,
  pic: { title?: string; src: string; conversationId?: string }
): SavedPictureItem | null {
  if (!pic.src) return null;
  const userKey = getUserStorageKey(user);
  const existing = getStoredUserPictures(user);
  if (existing.some((p) => p.src === pic.src)) {
    return existing.find((p) => p.src === pic.src) || null;
  }
  const newPic: SavedPictureItem = {
    id: `pic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: userKey,
    title: pic.title?.trim() || 'Uploaded Picture',
    src: pic.src,
    conversationId: pic.conversationId,
    createdAt: new Date().toISOString(),
  };
  const updated = [newPic, ...existing].slice(0, 40);
  try {
    localStorage.setItem(getPicturesStorageKey(user), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sigma-pictures-updated'));
  } catch {
    // ignore quota
  }
  return newPic;
}

export function deleteUserPicture(user: UserProfile | null | undefined, picId: string): void {
  const existing = getStoredUserPictures(user).filter((p) => p.id !== picId);
  try {
    localStorage.setItem(getPicturesStorageKey(user), JSON.stringify(existing));
    const deleted = getDeletedPictureIds(user);
    deleted.add(picId);
    localStorage.setItem(getDeletedPictureIdsKey(user), JSON.stringify(Array.from(deleted)));
    window.dispatchEvent(new CustomEvent('sigma-pictures-updated'));
  } catch {
    // ignore
  }
}

/**
 * Returns ONLY images uploaded or pasted by the user (never AI-generated images),
 * scoped privately to the signed-in user.
 */
export function getUnifiedUserPictures(
  user: UserProfile | null | undefined,
  conversations: Conversation[] = []
): SavedPictureItem[] {
  const userKey = getUserStorageKey(user);
  const storedPics = getStoredUserPictures(user);
  const seenSrcs = new Set(storedPics.map((p) => p.src));
  const deletedIds = getDeletedPictureIds(user);
  const fromChats: SavedPictureItem[] = [];

  for (const conv of conversations) {
    for (const m of conv.messages || []) {
      // Strictly user-uploaded or pasted images (m.role === 'user' && m.images)
      if (m.role === 'user' && Array.isArray(m.images)) {
        m.images.forEach((imgUrl, idx) => {
          const picId = `up-${m.id}-${idx}`;
          if (imgUrl && !seenSrcs.has(imgUrl) && !deletedIds.has(picId)) {
            seenSrcs.add(imgUrl);
            fromChats.push({
              id: picId,
              userId: userKey,
              title: conv.title || 'Uploaded Picture',
              src: imgUrl,
              conversationId: conv.id,
              createdAt:
                typeof m.timestamp === 'string'
                  ? m.timestamp
                  : m.timestamp instanceof Date
                  ? m.timestamp.toISOString()
                  : conv.updatedAt || conv.createdAt || new Date().toISOString(),
            });
          }
        });
      }
    }
  }

  return [...storedPics, ...fromChats];
}
