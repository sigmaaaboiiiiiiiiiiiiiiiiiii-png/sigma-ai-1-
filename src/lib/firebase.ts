import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ChatMessage, UserProfile, Conversation } from '../types';
import { toSafeDate, toSafeIsoString } from './dateUtils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase App with real configuration
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Test Firestore connection on boot as per guidelines
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or connecting...');
    }
  }
})();

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
// Force Google account chooser so the user can select their account
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Real Google Sign-In with Firebase Auth popup window
 */
export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Sync real Google profile to Firestore
    await saveUserProfileToFirestore({
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Google User',
      email: user.email || '',
      avatarUrl: user.photoURL || undefined,
      role: (user.email && (user.email.includes('admin') || user.email.includes('saba'))) ? 'admin' : 'user',
      isLoggedIn: true,
    });

    return user;
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);
    throw error;
  }
}

/**
 * Sign out of Firebase
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Sign-Out error:', error);
    throw error;
  }
}

/**
 * Save user profile to Firestore
 */
export async function saveUserProfileToFirestore(user: Partial<UserProfile>): Promise<void> {
  if (!user.id) return;
  try {
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(
      userDocRef,
      {
        id: user.id,
        name: user.name || 'User',
        email: user.email || '',
        avatarUrl: user.avatarUrl || '',
        role: user.role || 'user',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not save user to Firestore:', error);
  }
}

/**
 * Save a single chat message to user's Firestore messages collection
 */
export async function saveChatMessageToFirestore(userId: string, message: ChatMessage): Promise<void> {
  if (!userId || !message?.id) return;
  try {
    const msgDocRef = doc(db, 'users', userId, 'messages', message.id);
    await setDoc(
      msgDocRef,
      {
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: toSafeIsoString(message.timestamp),
        sources: message.sources || [],
        searchQueries: message.searchQueries || [],
        notice: message.notice || null,
        isError: !!message.isError,
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not save message to Firestore:', error);
  }
}

/**
 * Load all saved messages for a user from Firestore
 */
export async function loadUserMessagesFromFirestore(userId: string): Promise<ChatMessage[]> {
  if (!userId) return [];
  try {
    const msgsCol = collection(db, 'users', userId, 'messages');
    const q = query(msgsCol, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    const loaded: ChatMessage[] = [];
    snapshot.forEach((snapDoc) => {
      const data = snapDoc.data();
      loaded.push({
        id: data.id || snapDoc.id,
        role: data.role as 'user' | 'model',
        content: data.content || '',
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        sources: data.sources || [],
        searchQueries: data.searchQueries || [],
        notice: data.notice || undefined,
        isError: !!data.isError,
      });
    });
    return loaded;
  } catch (error) {
    console.warn('Could not load user messages from Firestore:', error);
    return [];
  }
}

/**
 * Delete all messages for a user from Firestore (when chat is cleared)
 */
export async function clearUserMessagesInFirestore(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const msgsCol = collection(db, 'users', userId, 'messages');
    const snapshot = await getDocs(msgsCol);
    const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.warn('Could not clear user messages from Firestore:', error);
  }
}

/**
 * Save or update a conversation session in user's Firestore conversations collection
 */
export async function saveConversationToFirestore(
  userId: string,
  conversation: Conversation
): Promise<void> {
  if (!userId || !conversation?.id) return;
  try {
    const convDocRef = doc(db, 'users', userId, 'conversations', conversation.id);
    const sanitizedMessages = (conversation.messages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: toSafeIsoString(m.timestamp),
      sources: m.sources || [],
      searchQueries: m.searchQueries || [],
      notice: m.notice || null,
      isError: !!m.isError,
    }));

    await setDoc(
      convDocRef,
      {
        id: conversation.id,
        title: conversation.title,
        createdAt: toSafeIsoString(conversation.createdAt),
        updatedAt: toSafeIsoString(conversation.updatedAt),
        messages: sanitizedMessages,
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not save conversation to Firestore:', error);
  }
}

const userChatsMemoryCache = new Map<string, { timestamp: number; chats: Conversation[] }>();

export function invalidateUserChatsCache(userId?: string) {
  if (userId) {
    userChatsMemoryCache.delete(userId);
  } else {
    userChatsMemoryCache.clear();
  }
}

/**
 * Load saved conversations for a user from Firestore (ordered by updatedAt desc, paginated with limit 50)
 */
export async function loadUserConversationsFromFirestore(
  userId: string
): Promise<Conversation[]> {
  if (!userId) return [];
  try {
    const convCol = collection(db, 'users', userId, 'conversations');
    const q = query(convCol, orderBy('updatedAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const loaded: Conversation[] = [];
    snapshot.forEach((snapDoc) => {
      const data = snapDoc.data();
      const rawMsgs = data.messages || [];
      const messages: ChatMessage[] = rawMsgs.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: toSafeDate(m.timestamp),
        sources: m.sources || [],
        searchQueries: m.searchQueries || [],
        notice: m.notice || undefined,
        isError: !!m.isError,
      }));
      loaded.push({
        id: data.id || snapDoc.id,
        title: data.title || 'Chat',
        createdAt: toSafeIsoString(data.createdAt),
        updatedAt: toSafeIsoString(data.updatedAt),
        messages,
      });
    });
    return loaded;
  } catch (error) {
    console.warn('Could not load user conversations from Firestore:', error);
    return [];
  }
}

/**
 * Delete a single conversation from Firestore
 */
export async function deleteConversationInFirestore(
  userId: string,
  conversationId: string
): Promise<void> {
  if (!userId || !conversationId) return;
  try {
    const convDocRef = doc(db, 'users', userId, 'conversations', conversationId);
    await deleteDoc(convDocRef);
  } catch (error) {
    console.warn('Could not delete conversation from Firestore:', error);
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SECTION 6 DATABASE ARCHITECTURE: chats and messages collections
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface FirestoreChatDoc {
  id: string;
  chatId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
}

/**
 * Save or update a chat document in /chats/{chatId}
 */
export async function saveChatInFirestore(
  arg1: string,
  arg2: any,
  arg3?: string,
  arg4?: string,
  arg5?: string,
  arg6?: ChatMessage[]
): Promise<void> {
  let userId = '';
  let chatId = '';
  let title = 'Chat';
  const createdAt = new Date().toISOString();
  const updatedAt = new Date().toISOString();
  let lastMessagePreview = '';
  let userEmail = '';
  let messagesToSave: ChatMessage[] | undefined = undefined;

  if (typeof arg2 === 'object' && arg2 !== null) {
    userId = arg1;
    chatId = arg2.id;
    title = arg2.title || 'Chat';
    lastMessagePreview = arg2.lastMessagePreview || '';
    userEmail = arg2.userEmail || '';
    if (Array.isArray(arg2.messages)) {
      messagesToSave = arg2.messages;
    }
  } else {
    // Called as (chatId, userId, title, lastMessagePreview, userEmail, messages)
    chatId = arg1;
    userId = arg2;
    title = arg3 || 'Chat';
    lastMessagePreview = arg4 || '';
    userEmail = arg5 || '';
    if (Array.isArray(arg6)) {
      messagesToSave = arg6;
    }
  }

  if (!chatId || !userId) return;

  const sanitizedMessages = messagesToSave
    ? messagesToSave.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content || '',
        timestamp: toSafeIsoString(m.timestamp),
        sources: m.sources || [],
        searchQueries: m.searchQueries || [],
        notice: m.notice || null,
        isError: !!m.isError,
      }))
    : undefined;

  try {
    const chatDocRef = doc(db, 'chats', chatId);
    const docPayload: any = {
      chatId,
      userId,
      title,
      createdAt: toSafeIsoString(createdAt),
      updatedAt: toSafeIsoString(updatedAt),
      lastMessagePreview,
      userEmail,
    };
    if (sanitizedMessages) {
      docPayload.messages = sanitizedMessages;
    }

    await setDoc(chatDocRef, docPayload, { merge: true });
    invalidateUserChatsCache(userId);

    // Also mirror to /users/{userId}/conversations/{chatId} for redundancy
    if (sanitizedMessages) {
      await saveConversationToFirestore(userId, {
        id: chatId,
        title,
        createdAt: toSafeIsoString(createdAt),
        updatedAt: toSafeIsoString(updatedAt),
        lastMessagePreview,
        messages: sanitizedMessages.map((m: any) => ({
          ...m,
          timestamp: toSafeDate(m.timestamp),
        })),
      });
    }
  } catch (error) {
    console.warn('Failed to save chat in Firestore:', error);
  }
}

/**
 * Save a message document in /messages/{messageId}
 */
export async function saveMessageInFirestore(
  chatId: string,
  userId: string,
  message: ChatMessage
): Promise<void> {
  if (!chatId || !userId || !message?.id) return;
  try {
    const msgDocRef = doc(db, 'messages', message.id);
    await setDoc(
      msgDocRef,
      {
        messageId: message.id,
        chatId,
        userId,
        role: message.role,
        content: message.content,
        createdAt: toSafeIsoString(message.timestamp),
        sources: message.sources || [],
        searchQueries: message.searchQueries || [],
        notice: message.notice || null,
        isError: !!message.isError,
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Failed to save message in Firestore:', error);
  }
}

/**
 * Load all chats for a specific user from /chats (sorted by updatedAt desc, bounded & cached)
 */
export async function loadUserChatsFromFirestore(userId: string): Promise<Conversation[]> {
  if (!userId) return [];
  const cached = userChatsMemoryCache.get(userId);
  if (cached && Date.now() - cached.timestamp < 15000 && cached.chats.length > 0) {
    return cached.chats;
  }

  try {
    const chatsCol = collection(db, 'chats');
    const q = query(chatsCol, where('userId', '==', userId), limit(50));

    const [snapshotRes, legacyRes] = await Promise.allSettled([
      getDocs(q),
      loadUserConversationsFromFirestore(userId),
    ]);

    const chats: Conversation[] = [];

    if (snapshotRes.status === 'fulfilled') {
      snapshotRes.value.forEach((snapDoc) => {
        const data = snapDoc.data() as any;
        const rawMsgs = Array.isArray(data.messages) ? data.messages : [];
        const messages: ChatMessage[] = rawMsgs.map((m: any) => ({
          id: m.id || m.messageId || `msg-${Math.random()}`,
          role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          content: m.content || '',
          timestamp: toSafeDate(m.timestamp || m.createdAt),
          sources: m.sources || [],
          searchQueries: m.searchQueries || [],
          notice: m.notice || undefined,
          isError: !!m.isError,
        }));

        chats.push({
          id: data.chatId || snapDoc.id,
          title: data.title || 'Chat',
          createdAt: toSafeIsoString(data.createdAt),
          updatedAt: toSafeIsoString(data.updatedAt),
          lastMessagePreview: data.lastMessagePreview || '',
          messages,
        });
      });
    }

    if (legacyRes.status === 'fulfilled') {
      for (const leg of legacyRes.value) {
        const existingIdx = chats.findIndex((c) => c.id === leg.id);
        if (existingIdx === -1) {
          chats.push(leg);
        } else if (chats[existingIdx].messages.length === 0 && leg.messages.length > 0) {
          chats[existingIdx].messages = leg.messages;
        }
      }
    }

    // Sort in memory by updatedAt descending
    chats.sort((a, b) => toSafeDate(b.updatedAt).getTime() - toSafeDate(a.updatedAt).getTime());
    userChatsMemoryCache.set(userId, { timestamp: Date.now(), chats });
    return chats;
  } catch (error) {
    console.warn('Could not load user chats from Firestore:', error);
    return loadUserConversationsFromFirestore(userId);
  }
}

/**
 * Load all messages for a specific chat from /messages or direct chat doc
 */
export async function loadChatMessagesFromFirestore(
  chatId: string,
  userId?: string
): Promise<ChatMessage[]> {
  if (!chatId) return [];
  try {
    // 1. Direct document check on /chats/{chatId}
    const chatDocRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatDocRef);
    if (chatSnap.exists()) {
      const data = chatSnap.data() as any;
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        return data.messages.map((m: any) => ({
          id: m.id || m.messageId || `msg-${Math.random()}`,
          role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          content: m.content || '',
          timestamp: toSafeDate(m.timestamp || m.createdAt),
          sources: m.sources || [],
          searchQueries: m.searchQueries || [],
          notice: m.notice || undefined,
          isError: !!m.isError,
        }));
      }
    }

    // 2. Fallback: check /users/{userId}/conversations/{chatId}
    if (userId) {
      try {
        const convDocRef = doc(db, 'users', userId, 'conversations', chatId);
        const convSnap = await getDoc(convDocRef);
        if (convSnap.exists()) {
          const cData = convSnap.data() as any;
          if (Array.isArray(cData.messages) && cData.messages.length > 0) {
            return cData.messages.map((m: any) => ({
              id: m.id || m.messageId || `msg-${Math.random()}`,
              role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
              content: m.content || '',
              timestamp: toSafeDate(m.timestamp),
              sources: m.sources || [],
              searchQueries: m.searchQueries || [],
              notice: m.notice || undefined,
              isError: !!m.isError,
            }));
          }
        }
      } catch (convErr) {
        console.warn('Could not read user conversation doc:', convErr);
      }
    }

    // 3. Fallback: query /messages collection without composite order to prevent index errors
    const msgsCol = collection(db, 'messages');
    const q = userId
      ? query(msgsCol, where('chatId', '==', chatId), where('userId', '==', userId))
      : query(msgsCol, where('chatId', '==', chatId));
    const snapshot = await getDocs(q);
    const loaded: ChatMessage[] = [];

    snapshot.forEach((snapDoc) => {
      const data = snapDoc.data() as any;
      loaded.push({
        id: data.messageId || snapDoc.id,
        role: data.role as 'user' | 'model',
        content: data.content || '',
        timestamp: toSafeDate(data.createdAt || data.timestamp),
        sources: data.sources || [],
        searchQueries: data.searchQueries || [],
        notice: data.notice || undefined,
        isError: !!data.isError,
      });
    });

    // Sort in memory by timestamp
    loaded.sort((a, b) => toSafeDate(a.timestamp).getTime() - toSafeDate(b.timestamp).getTime());
    return loaded;
  } catch (error) {
    console.warn('Could not load chat messages from Firestore:', error);
    return [];
  }
}

/**
 * Permanently delete a chat and all associated messages from Firestore
 */
export async function deleteChatInFirestore(chatId: string, userId?: string): Promise<void> {
  if (!chatId) return;
  try {
    // 1. Delete chat document
    const chatDocRef = doc(db, 'chats', chatId);
    await deleteDoc(chatDocRef);
    invalidateUserChatsCache(userId);

    // 2. Query and delete all messages with this chatId
    const msgsCol = collection(db, 'messages');
    let q;
    if (userId) {
      q = query(msgsCol, where('chatId', '==', chatId), where('userId', '==', userId));
    } else {
      q = query(msgsCol, where('chatId', '==', chatId));
    }
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    // Also delete from legacy subcollection if present
    if (userId) {
      await deleteConversationInFirestore(userId, chatId);
    }
  } catch (error) {
    console.warn('Could not delete chat from Firestore:', error);
  }
}

/**
 * Permanently delete ALL chats and all associated messages for a user from Firestore.
 * Ensures chats are cleared forever and never reappear on browser reload.
 */
export async function deleteAllUserChatsInFirestore(userId: string): Promise<void> {
  if (!userId) return;
  try {
    invalidateUserChatsCache(userId);

    // 1. Delete all docs from /chats where userId == userId
    const chatsCol = collection(db, 'chats');
    const qChats = query(chatsCol, where('userId', '==', userId));
    const chatsSnap = await getDocs(qChats);
    const deleteChatPromises = chatsSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deleteChatPromises);

    // 2. Delete all docs from /messages where userId == userId
    const msgsCol = collection(db, 'messages');
    const qMsgs = query(msgsCol, where('userId', '==', userId));
    const msgsSnap = await getDocs(qMsgs);
    const deleteMsgPromises = msgsSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deleteMsgPromises);

    // 3. Delete all docs from /users/{userId}/conversations
    const convCol = collection(db, 'users', userId, 'conversations');
    const convSnap = await getDocs(convCol);
    const deleteConvPromises = convSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deleteConvPromises);

    // 4. Delete all docs from /users/{userId}/messages
    const userMsgsCol = collection(db, 'users', userId, 'messages');
    const userMsgsSnap = await getDocs(userMsgsCol);
    const deleteUserMsgPromises = userMsgsSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deleteUserMsgPromises);
  } catch (error) {
    console.warn('Could not clear all user chats in Firestore:', error);
  }
}

/**
 * Rename a chat title in Firestore
 */
export async function renameChatInFirestore(
  chatId: string,
  newTitle: string,
  userId?: string
): Promise<void> {
  if (!chatId || !newTitle.trim()) return;
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    await setDoc(
      chatDocRef,
      {
        title: newTitle.trim(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not rename chat in Firestore:', error);
  }
}

/**
 * Listen to real-time auth changes
 */
export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Save Q&A prompt and response memory record to Firestore
 */
export async function saveQaToFirestore(record: {
  id: string;
  prompt: string;
  normalizedPrompt: string;
  answer: string;
  model: string;
  userType: string;
  userEmail: string;
  createdAt: string;
  hitCount: number;
}): Promise<void> {
  try {
    const docRef = doc(db, 'ai_qa_memory', record.id);
    await setDoc(docRef, record, { merge: true });
  } catch (err) {
    console.warn('Could not save QA to Firestore:', err);
  }
}

/**
 * Search Firestore for 100% exact match
 */
export async function findExactMatchInFirestore(normalizedKey: string): Promise<any | null> {
  try {
    const q = query(collection(db, 'ai_qa_memory'), where('normalizedPrompt', '==', normalizedKey));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      return docData;
    }
  } catch (err) {
    console.warn('Could not query Firestore QA memory:', err);
  }
  return null;
}

/**
 * Record a chat message globally to Firestore so it is saved under the user's account/email forever
 * and visible on the Firebase web console and in the Admin Command Center across Cloudflare Pages & Web.
 */
export async function recordGlobalChatLog(entry: {
  id: string;
  userEmail: string;
  userName: string;
  userType: 'guest' | 'authenticated';
  userRole?: string;
  prompt: string;
  answer: string;
  model: string;
  createdAt: string;
}): Promise<void> {
  try {
    const docRef = doc(db, 'global_chat_logs', entry.id);
    await setDoc(docRef, entry, { merge: true });
  } catch (err) {
    console.warn('Could not record global chat log to Firestore:', err);
  }
}

/**
 * Fetch all global chat logs from Firestore for admin view
 */
export async function fetchFirestoreGlobalChatLogs(): Promise<any[]> {
  try {
    const q = query(collection(db, 'global_chat_logs'), orderBy('createdAt', 'desc'), limit(150));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push({ ...d.data(), id: d.id }));
    return list;
  } catch (err) {
    console.warn('Could not fetch global chat logs from Firestore:', err);
    return [];
  }
}

/**
 * Record a security event directly to Firestore (works on Cloudflare Pages, AI Studio, etc.)
 */
export async function recordSecurityAuditLog(entry: {
  id?: string;
  timestamp?: string;
  event: string;
  userEmail: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'WARNING';
  details: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    const id = entry.id || `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const timestamp = entry.timestamp || new Date().toISOString();
    const docRef = doc(db, 'security_audit_logs', id);
    await setDoc(docRef, { ...entry, id, timestamp }, { merge: true });
  } catch (err) {
    console.warn('Could not record security audit log to Firestore:', err);
  }
}

/**
 * Fetch real-time security audit logs from Firestore for the admin security tab
 */
export async function fetchFirestoreSecurityLogs(): Promise<any[]> {
  try {
    const q = query(collection(db, 'security_audit_logs'), orderBy('timestamp', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push({ ...d.data(), id: d.id }));
    return list;
  } catch (err) {
    console.warn('Could not fetch security logs from Firestore:', err);
    return [];
  }
}

/**
 * Save user profile to both /users and /all_users registry in Firestore
 */
export async function recordUserToFirestoreRegistry(userData: {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: string;
  lastLoginAt?: string;
  status?: string;
  authProvider?: string;
}): Promise<void> {
  try {
    const payload = {
      ...userData,
      lastLoginAt: userData.lastLoginAt || new Date().toISOString(),
      createdAt: userData.createdAt || new Date().toISOString(),
      status: userData.status || 'Active',
      authProvider: userData.authProvider || 'Firebase Auth',
    };
    await setDoc(doc(db, 'all_users', userData.id), payload, { merge: true });
    await setDoc(doc(db, 'users', userData.id), payload, { merge: true });
  } catch (err) {
    console.warn('Could not record user to registry:', err);
  }
}

/**
 * Fetch all registered users directly from Firestore
 */
export async function fetchFirestoreAllUsers(): Promise<any[]> {
  try {
    // Try all_users first
    const snapshot = await getDocs(collection(db, 'all_users'));
    if (!snapshot.empty) {
      const list: any[] = [];
      snapshot.forEach((d) => list.push({ ...d.data(), id: d.id }));
      return list;
    }
    // Fallback to users
    const userSnap = await getDocs(collection(db, 'users'));
    const list: any[] = [];
    userSnap.forEach((d) => list.push({ ...d.data(), id: d.id }));
    return list;
  } catch (err) {
    console.warn('Could not fetch all users from Firestore:', err);
    return [];
  }
}

export interface ActiveSessionRecord {
  sessionId: string;
  identityType: 'guest' | 'user';
  identityId: string;
  displayName: string;
  startedAt: string;
  lastHeartbeat: string;
  status: 'active' | 'inactive';
  voiceSession: boolean;
  microphonePermission?: 'granted' | 'denied' | 'prompt';
  audioStream?: 'connected' | 'disconnected' | 'connecting' | 'error';
  userEmail?: string;
  device?: string;
  resolvedName?: string;
}

/**
 * Update real-time active session presence in Firestore
 * Adheres strictly to the required Active Session model:
 * sessionId, identityType, identityId, displayName, startedAt, lastHeartbeat, status, voiceSession
 */
export async function updateActiveSessionPresence(params: {
  sessionId: string;
  identityType: 'guest' | 'user';
  identityId: string;
  displayName: string;
  voiceSession?: boolean;
  microphonePermission?: 'granted' | 'denied' | 'prompt';
  audioStream?: 'connected' | 'disconnected' | 'connecting' | 'error';
  userEmail?: string;
}): Promise<void> {
  try {
    const docRef = doc(db, 'active_sessions', params.sessionId);
    const nowIso = new Date().toISOString();

    const existingSnap = await getDoc(docRef).catch(() => null);
    const existingData = existingSnap && existingSnap.exists() ? existingSnap.data() : null;

    const startedAt = existingData?.startedAt || nowIso;
    const isVoice = params.voiceSession !== undefined ? params.voiceSession : Boolean(existingData?.voiceSession);
    const micPerm = params.microphonePermission || existingData?.microphonePermission || 'prompt';
    const streamState = params.audioStream || (isVoice ? 'connected' : 'disconnected');

    await setDoc(
      docRef,
      {
        sessionId: params.sessionId,
        identityType: params.identityType,
        identityId: params.identityId,
        displayName: params.displayName || (params.identityType === 'user' ? 'User' : 'Guest'),
        startedAt,
        lastHeartbeat: nowIso,
        status: 'active',
        voiceSession: isVoice,
        microphonePermission: micPerm,
        audioStream: streamState,
        userEmail: params.userEmail || (params.identityType === 'guest' ? 'guest@sigma.ai' : ''),
        device: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'browser',
        updatedAt: nowIso,
      },
      { merge: true }
    );
  } catch (err) {
    // Silent presence failure
  }
}

/**
 * Updates voice-specific state (microphone permission, voice session, and audio stream) on the active session
 */
export async function updateActiveSessionVoiceState(
  sessionId: string,
  state: {
    voiceSession: boolean;
    audioStream: 'connected' | 'disconnected' | 'connecting' | 'error';
    microphonePermission?: 'granted' | 'denied' | 'prompt';
  }
): Promise<void> {
  try {
    const docRef = doc(db, 'active_sessions', sessionId);
    const nowIso = new Date().toISOString();
    await updateDoc(docRef, {
      voiceSession: state.voiceSession,
      audioStream: state.audioStream,
      lastHeartbeat: nowIso,
      ...(state.microphonePermission ? { microphonePermission: state.microphonePermission } : {}),
      updatedAt: nowIso,
    });
  } catch (err) {
    // Silently handle offline/background updates
  }
}

/**
 * Marks an active session as inactive when user leaves, signs out, or disconnects
 */
export async function markActiveSessionInactive(sessionId: string): Promise<void> {
  try {
    const docRef = doc(db, 'active_sessions', sessionId);
    const nowIso = new Date().toISOString();
    await updateDoc(docRef, {
      status: 'inactive',
      voiceSession: false,
      audioStream: 'disconnected',
      lastHeartbeat: nowIso,
      updatedAt: nowIso,
    });
  } catch (_) {}
}

/**
 * Fetches all active sessions from Firestore and resolves their display names:
 * - Guests are resolved through the `guests` collection.
 * - Authenticated users are resolved through the `users` or `all_users` collection.
 * - Sessions with heartbeats older than 60s are automatically marked/treated as inactive.
 */
export async function fetchFirestoreActiveSessions(): Promise<ActiveSessionRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, 'active_sessions'));
    const now = Date.now();
    const sessions: ActiveSessionRecord[] = [];

    // Parallel fetch lookups for names to prevent N+1 serial delays
    const guestLookups = new Map<string, Promise<string>>();
    const userLookups = new Map<string, Promise<string>>();

    const getGuestName = (guestId: string): Promise<string> => {
      if (!guestLookups.has(guestId)) {
        guestLookups.set(
          guestId,
          (async () => {
            try {
              const snap = await getDoc(doc(db, 'guests', guestId));
              if (snap.exists()) {
                const data = snap.data();
                return data.displayName || data.name || 'Guest';
              }
            } catch (_) {}
            return 'Guest';
          })()
        );
      }
      return guestLookups.get(guestId)!;
    };

    const getUserName = (userId: string): Promise<string> => {
      if (!userLookups.has(userId)) {
        userLookups.set(
          userId,
          (async () => {
            try {
              const snap = await getDoc(doc(db, 'all_users', userId));
              if (snap.exists()) {
                const data = snap.data();
                return data.name || data.displayName || data.email || 'User';
              }
              const userSnap = await getDoc(doc(db, 'users', userId));
              if (userSnap.exists()) {
                const data = userSnap.data();
                return data.name || data.displayName || data.email || 'User';
              }
            } catch (_) {}
            return 'User';
          })()
        );
      }
      return userLookups.get(userId)!;
    };

    const rawDocs = snapshot.docs.map((d) => d.data() as ActiveSessionRecord);

    for (const data of rawDocs) {
      const lastHeartbeatMs = data.lastHeartbeat ? new Date(data.lastHeartbeat).getTime() : 0;
      const ageMs = now - lastHeartbeatMs;
      const isFresh = ageMs < 60000; // Recent heartbeat within past 60s
      const effectiveStatus: 'active' | 'inactive' = isFresh && data.status !== 'inactive' ? 'active' : 'inactive';
      const effectiveVoiceSession: boolean = effectiveStatus === 'active' ? Boolean(data.voiceSession) : false;
      const effectiveAudioStream = effectiveVoiceSession ? (data.audioStream || 'connected') : 'disconnected';

      let resolvedDisplayName = data.displayName;
      if (data.identityType === 'guest' && data.identityId) {
        resolvedDisplayName = await getGuestName(data.identityId);
      } else if (data.identityType === 'user' && data.identityId) {
        resolvedDisplayName = await getUserName(data.identityId);
      }

      sessions.push({
        sessionId: data.sessionId,
        identityType: data.identityType || 'guest',
        identityId: data.identityId || 'unknown',
        displayName: resolvedDisplayName || data.displayName || (data.identityType === 'user' ? 'User' : 'Guest'),
        resolvedName: resolvedDisplayName || data.displayName,
        startedAt: data.startedAt || data.lastHeartbeat || new Date().toISOString(),
        lastHeartbeat: data.lastHeartbeat || new Date().toISOString(),
        status: effectiveStatus,
        voiceSession: effectiveVoiceSession,
        microphonePermission: data.microphonePermission || 'prompt',
        audioStream: effectiveAudioStream as any,
        userEmail: data.userEmail,
        device: data.device,
      });
    }

    return sessions.sort((a, b) => {
      // Active sessions first, then by most recent heartbeat
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      return new Date(b.lastHeartbeat).getTime() - new Date(a.lastHeartbeat).getTime();
    });
  } catch (err) {
    console.warn('Could not fetch active sessions from Firestore:', err);
    return [];
  }
}

/**
 * Fetch count of real-time active users from Firestore based on recent heartbeats (< 60 seconds)
 */
export async function fetchFirestoreActiveSessionsCount(): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, 'active_sessions'));
    const now = Date.now();
    let active = 0;
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.lastHeartbeat) {
        const diff = now - new Date(data.lastHeartbeat).getTime();
        if (diff < 60000 && data.status !== 'inactive') {
          active++;
        }
      }
    });
    return Math.max(1, active);
  } catch (err) {
    return 1;
  }
}

/**
 * Generates or retrieves a persistent browser session hash
 */
export function getSessionHash(): string {
  try {
    let hash = sessionStorage.getItem('sigma_session_hash');
    if (!hash) {
      hash = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      sessionStorage.setItem('sigma_session_hash', hash);
    }
    return hash;
  } catch {
    return 'sess_' + Math.random().toString(36).substring(2, 10);
  }
}

export interface FeedbackReviewPayload {
  id: string;
  feedbackType: 'thumbs_up' | 'thumbs_down';
  userRating: 'positive' | 'negative';
  commentText: string;
  timestamp: string;
  sessionHash: string;
  messageId: string;
  userEmail?: string;
  userType?: 'guest' | 'authenticated';
  modelUsed?: string;
  promptSnippet?: string;
  responseSnippet?: string;
}

/**
 * Pushes user thumbs up/down rating and commentary to Firestore feedback_reviews collection
 */
export async function submitFeedbackReviewToFirestore(
  payload: FeedbackReviewPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, 'feedback_reviews', payload.id);
    await setDoc(docRef, {
      ...payload,
      submittedAt: new Date().toISOString(),
    }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to submit feedback to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, 'feedback_reviews');
    return { success: false, error: error?.message || 'Database write error' };
  }
}

/**
 * Fetches all developer feedback reviews stored in Firebase Firestore
 */
export async function fetchFirestoreFeedbackReviews(): Promise<FeedbackReviewPayload[]> {
  try {
    const colRef = collection(db, 'feedback_reviews');
    const snapshot = await getDocs(colRef);
    const reviews: FeedbackReviewPayload[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      reviews.push({
        id: docSnap.id,
        feedbackType: data.feedbackType || 'thumbs_up',
        userRating: data.userRating || (data.feedbackType === 'thumbs_up' ? 'positive' : 'negative'),
        commentText: data.commentText || '',
        timestamp: data.timestamp || data.submittedAt || new Date().toISOString(),
        sessionHash: data.sessionHash || 'sess_unknown',
        messageId: data.messageId || docSnap.id,
        userEmail: data.userEmail || 'Guest User',
        userType: data.userType || (data.userEmail?.includes('@') ? 'authenticated' : 'guest'),
        modelUsed: data.modelUsed,
        promptSnippet: data.promptSnippet,
        responseSnippet: data.responseSnippet,
      });
    });

    // Sort newest first
    return reviews.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.warn('Could not read feedback reviews from Firestore:', error);
    return [];
  }
}

/**
 * Deletes a feedback review document from Firestore
 */
export async function deleteFeedbackReviewFromFirestore(reviewId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'feedback_reviews', reviewId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Failed to delete feedback review:', err);
    return false;
  }
}

export interface FirestoreGuestRecord {
  guestId: string;
  displayName: string;
  deviceId: string;
  createdAt: string;
  lastActiveAt: string;
  isGuest: boolean;
  voiceSessionActive?: boolean;
  lastVoiceSessionAt?: string;
}

/**
 * Fetches all guest records from Firestore `guests` collection for the admin monitoring dashboard
 */
export async function fetchFirestoreAllGuests(): Promise<FirestoreGuestRecord[]> {
  try {
    const colRef = collection(db, 'guests');
    const snap = await getDocs(colRef);
    const guests: FirestoreGuestRecord[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      guests.push({
        guestId: docSnap.id,
        displayName: d.displayName || 'Guest User',
        deviceId: d.deviceId || docSnap.id,
        createdAt: d.createdAt || new Date().toISOString(),
        lastActiveAt: d.lastActiveAt || d.createdAt || new Date().toISOString(),
        isGuest: true,
        voiceSessionActive: Boolean(d.voiceSessionActive),
        lastVoiceSessionAt: d.lastVoiceSessionAt,
      });
    });
    return guests.sort(
      (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
    );
  } catch (err) {
    console.warn('Could not read guests collection from Firestore:', err);
    return [];
  }
}

/**
 * Fetches voice sessions for a specific user or guest from Firestore
 */
export async function fetchFirestoreVoiceSessions(
  targetId: string,
  isGuest: boolean
): Promise<any[]> {
  try {
    const path = isGuest ? `guests/${targetId}/voiceSessions` : `users/${targetId}/voiceSessions`;
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    const sessions: any[] = [];
    snap.forEach((docSnap) => {
      sessions.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });
    return sessions.sort(
      (a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime()
    );
  } catch (err) {
    console.warn(`Could not read voice sessions for ${targetId}:`, err);
    return [];
  }
}




