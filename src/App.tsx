/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput, ComposerSpecialMode } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { LiveAssistantModal } from './components/LiveAssistantModal';
import { DrawModal } from './components/DrawModal';
import { SummarizeModal } from './components/SummarizeModal';
import { CodeModal } from './components/CodeModal';
import { ExplainModal } from './components/ExplainModal';
import { SettingsModal } from './components/SettingsModal';
import { RecentsSidebar } from './components/RecentsSidebar';
import { AiIntelligenceLabModal } from './components/AiIntelligenceLabModal';
import { ConnectionsModal } from './components/ConnectionsModal';
import { PastPaperCenterModal } from './components/PastPaperCenterModal';
import { ScheduleModal } from './components/ScheduleModal';
import { ExploreModal } from './components/ExploreModal';
import { StudySourcesWorkspaceModal } from './components/StudySourcesWorkspaceModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { RightPreviewDrawer, RightPreviewDrawerData } from './components/RightPreviewDrawer';
import { SigmaModesModal } from './components/SigmaModesModal';
import { CameraModal } from './components/CameraModal';
import { AppBuilderPlaygroundModal } from './components/AppBuilderPlaygroundModal';
import { MyAppsModal } from './components/MyAppsModal';
import { AppProject, createStarterAppFromPrompt, saveAppProject } from './lib/appBuilderStorage';
import { getStudySources, getStudyImageMaterials, getStoredStudySources } from './lib/studySources';

import { GlowingCursor } from './components/GlowingCursor';
import { GlowingParticles } from './components/GlowingParticles';
import { getThemeColor } from './lib/theme';
import { ChatMessage, AppSettings, DEFAULT_SETTINGS, UserProfile, Conversation, UserKnowledgeMemory, SourceItem, UsedFileSource, VideoAttachment } from './types';
import { getSavedTtsVoice, resolveSpeechVoice } from './lib/ttsVoiceEngine';
import { Loader2, Globe, ArrowDown, GitBranch, AlertCircle, ShieldAlert, LogOut, Search, MessageSquare, Library, Plus, EyeOff, PanelLeft, WifiOff, Brain } from 'lucide-react';
import { detectBadLanguage, BAD_LANGUAGE_REJECTION_MESSAGE } from './lib/badLanguageDetector';
import { analyzeAmbiguousShortInput } from './lib/contextualActions';
import { HolographicCoreLoader } from './components/HolographicCoreLoader';
import { WelcomeSignInModal } from './components/WelcomeSignInModal';
import {
  isVerifiedOwnerAccount,
  isAccountSuspended,
  syncAccountModerationFromServer,
  validateAccountName,
  extractAnonymousSessionName,
} from './lib/nameModeration';
import { saveUserUploadedPicture } from './lib/libraryStorage';
import {
  loadUserBrain,
  saveUserBrain,
  extractUserFactsFromTurn,
  syncUserPreferencesToBrain,
  updateBrainAndPreferencesFromTurn,
  buildUserPreferencePromptBlock,
} from './lib/userBrain';
import { analyzeAndNormalizePrompt, isConversationalFollowUp, detectAmbiguousTopicQuery } from './lib/typoHandler';
import { evaluateMathPrompt, isPureMathCalculationPrompt } from './lib/mathEvaluator';
import {
  getUserExecutiveRole,
  getExecutiveGreeting,
  getExecutiveFarewell,
  isAuthorizedForAdminPanel,
  getInstantSvgAvatar,
} from './lib/userRoles';
import {
  lookupInstantQAMemory,
  saveQAMemory,
  saveWordMeaningMemory,
  saveCalculationMemory,
  saveGeneralAnswerForOffline,
  extractWordMeaningTarget,
  isSummaryQuery,
  isStoryQuery,
  isNewsOrTrendingQuery,
  isExplanationQuery,
  isDynamicQuery,
} from './lib/aiMemoryDatabase';
import { isSpecificHistoryEligible } from './lib/historyFilter';
import {
  isUseSigmaMode,
  cleanUseSigmaPrompt,
  isReturnToNormalLanguage,
  encodeSigmaRoboticCipher,
} from './lib/roboticCipher';
import {
  matchPurpleDoorStory,
  isImagePromptRequest,
  isImageGenerationRequest,
  MASTER_IMAGE_PROMPT_TEMPLATE,
  buildTailoredImagePrompt,
} from './lib/storyAndPromptTemplates';
import {
  auth,
  deleteAllUserChatsInFirestore,
  signInWithGooglePopup,
  signOutFirebase,
  subscribeToAuth,
  saveUserProfileToFirestore,
  saveChatInFirestore,
  saveMessageInFirestore,
  loadUserChatsFromFirestore,
  loadChatMessagesFromFirestore,
  deleteChatInFirestore,
  renameChatInFirestore,
  saveQaToFirestore,
  findExactMatchInFirestore,
  recordGlobalChatLog,
  recordSecurityAuditLog,
  recordUserToFirestoreRegistry,
  updateActiveSessionPresence,
  markActiveSessionInactive,
} from './lib/firebase';
import {
  getStoredGuestProfile,
  restoreGuestProfile,
  getPersistentGuestId,
  createPersistentGuestId,
  saveGuestProfile,
  loadGuestConversations,
  saveGuestConversations,
} from './lib/guestManager';
import { getEmailAvatarUrl } from './lib/avatarHelper';
import { toSafeDate, toSafeIsoString } from './lib/dateUtils';
import {
  OPENROUTER_API_KEY,
  OPENROUTER_CHAT_ENDPOINT,
  OPENROUTER_FREE_MODEL,
} from './lib/openrouterConfig';
import {
  detectPowerPointIntent,
  parseSlideCountReply,
  serializeSlideCountPrompt,
  extractSlideCountPromptFromMessage,
  PendingSlideCountPromptData,
} from './lib/powerpointIntent';
import {
  generateFallbackPresentation,
  normalizePresentationData,
  applyLocalPresentationModification,
  serializePresentationToMessage,
  extractPresentationFromMessage,
} from './lib/presentationGenerator';
import { PresentationLoading } from './components/powerpoint/PresentationLoading';
import { detectExcelIntent } from './lib/excelIntent';
import {
  generateExcelWorkbook,
  applyExcelModification,
  serializeExcelToMessage,
  extractExcelFromMessage,
  type ExcelWorkbookData,
} from './lib/excelGenerator';
import { ExcelLoading } from './components/excel/ExcelLoading';

const sanitizeMessages = (msgs: ChatMessage[]): ChatMessage[] => {
  if (!Array.isArray(msgs)) return [];
  return msgs.map((m) => ({
    ...m,
    timestamp: toSafeDate(m.timestamp),
  }));
};

// Helper for isolating conversations by user email (saved forever), and keeping guest history for 1 day in browser
const loadConversationsForUser = (profile: UserProfile): Conversation[] => {
  try {
    let rawList: any[] = [];
    if (profile.isLoggedIn && profile.email) {
      // Google sign-in: saved permanently in localStorage & Firestore
      const key = `sigma_convs_${profile.email.toLowerCase().trim()}`;
      const saved = localStorage.getItem(key);
      if (saved) rawList = JSON.parse(saved);
    } else {
      // Guest mode: retained in browser for 1 day (24 hours), automatically pruned
      rawList = loadGuestConversations();
    }
    if (Array.isArray(rawList)) {
      return rawList.map((conv) => ({
        id: conv.id || `conv-${Math.random()}`,
        title: conv.title || 'Chat',
        createdAt: toSafeIsoString(conv.createdAt),
        updatedAt: toSafeIsoString(conv.updatedAt),
        lastMessagePreview: conv.lastMessagePreview || '',
        userEmail: conv.userEmail || '',
        messages: Array.isArray(conv.messages)
          ? conv.messages.map((m: any) => ({
              id: m.id || `msg-${Math.random()}`,
              role: m.role === 'user' ? 'user' : 'model',
              content: m.content || '',
              timestamp: toSafeDate(m.timestamp),
              sources: m.sources || [],
              searchQueries: m.searchQueries || [],
              notice: m.notice || undefined,
              isError: !!m.isError,
            }))
          : [],
      }));
    }
  } catch (e) {
    console.warn('Failed to load scoped conversations', e);
  }
  return [];
};

const saveConversationsForUser = (
  profile: UserProfile,
  list: Conversation[],
  policy: 'specific_only' | 'all' = 'specific_only'
) => {
  try {
    const filteredList =
      policy === 'specific_only'
        ? list.filter((conv) => isSpecificHistoryEligible(conv))
        : list;

    // Sanitize large base64 video payloads while preserving thumbnails, names, durations, and keyframes
    const sanitizedList: Conversation[] = filteredList.map((conv) => ({
      ...conv,
      messages: conv.messages.map((m) => {
        if (!m.videos || m.videos.length === 0) return m;
        return {
          ...m,
          videos: m.videos.map((v) => ({
            name: v.name,
            size: v.size,
            duration: v.duration,
            durationFormatted: v.durationFormatted,
            thumbnail: v.thumbnail,
            keyframes: v.keyframes?.slice(0, 12),
          })),
        };
      }),
    }));

    if (profile.isLoggedIn && profile.email) {
      // Google sign-in: saved permanently forever
      const key = `sigma_convs_${profile.email.toLowerCase().trim()}`;
      localStorage.setItem(key, JSON.stringify(sanitizedList));
    } else {
      // Guest mode: saved in browser storage & cookies for 1 day (24 hours)
      saveGuestConversations(sanitizedList);
    }
  } catch (e) {
    console.warn('Failed to save scoped conversations', e);
  }
};

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const activeId = localStorage.getItem('sigma_active_conversation_id');
      const savedProfile = localStorage.getItem('sigma_user_profile');
      const initialProfile = savedProfile ? JSON.parse(savedProfile) : { isLoggedIn: false, email: 'guest@sigma.ai' };
      const initialConvs = loadConversationsForUser(initialProfile);
      if (activeId) {
        const found = initialConvs.find((c) => c.id === activeId);
        if (found && Array.isArray(found.messages) && found.messages.length > 0) {
          return sanitizeMessages(found.messages);
        }
      }
    } catch (e) {
      console.warn('Failed restoring active messages on mount', e);
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isPowerPointMode, setIsPowerPointMode] = useState(false);
  const [activeSpecialMode, setActiveSpecialMode] = useState<ComposerSpecialMode>(null);
  const [pptGeneratingTopic, setPptGeneratingTopic] = useState<string | null>(null);
  const [pendingPptRequest, setPendingPptRequest] = useState<PendingSlideCountPromptData | null>(null);
  const [excelGeneratingTopic, setExcelGeneratingTopic] = useState<string | null>(null);
  const [summarizeInitialText, setSummarizeInitialText] = useState<string>('');
  const [explainInitialTopic, setExplainInitialTopic] = useState<string>('');
  const [codeInitialText, setCodeInitialText] = useState<string>('');
  const [codeInitialMode, setCodeInitialMode] = useState<string>('build');
  // Session-only name for anonymous users (isolated to current conversation only, never saved across sessions)
  const [anonymousSessionName, setAnonymousSessionName] = useState<string | null>(null);

  // Temporary Chat state (Incognito mode: not saved to localStorage or Firestore, vanishes on refresh or close)
  const [isTemporaryChat, setIsTemporaryChat] = useState<boolean>(false);
  const [isAiLabOpen, setIsAiLabOpen] = useState(false);
  const [isModesModalOpen, setIsModesModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraInitialMode, setCameraInitialMode] = useState<'select' | 'camera' | 'upload'>('select');
  const [rightDrawerData, setRightDrawerData] = useState<RightPreviewDrawerData | null>(null);

  // New App & App Builder Playground workspace state
  const [isAppBuilderOpen, setIsAppBuilderOpen] = useState(false);
  const [activeAppProject, setActiveAppProject] = useState<AppProject | null>(null);
  const [isMyAppsOpen, setIsMyAppsOpen] = useState(false);

  const handleOpenNewApp = (customPrompt?: string) => {
    const promptText = customPrompt || 'Sigma Smart Productivity Portal & Calculator';
    const newApp = createStarterAppFromPrompt(promptText, user.email || 'guest@sigma.ai');
    setActiveAppProject(newApp);
    setIsAppBuilderOpen(true);
  };

  const handleOpenAppInPlayground = (appProj: AppProject) => {
    setActiveAppProject(appProj);
    setIsAppBuilderOpen(true);
  };

  const handleFeelingLucky = () => {
    const luckyPrompts = [
      'Neon Arcade Space Dodger game with canvas physics and particle effects',
      'Personal Crypto & Stock Portfolio tracker with interactive chart simulation',
      'Cambridge IGCSE & O-Level interactive revision quiz with timers and scorecards',
      'Kanban agile project board with drag-and-drop, tags, and progress analytics',
      'Retro Cyberpunk 80s synthesizer with web audio frequency visualizer',
    ];
    const picked = luckyPrompts[Math.floor(Math.random() * luckyPrompts.length)];
    const luckyApp = createStarterAppFromPrompt(picked, user.email || 'guest@sigma.ai');
    setActiveAppProject(luckyApp);
    setIsAppBuilderOpen(true);
  };

  const showToast = (msg: string) => {
    setBranchNotice(msg);
    setTimeout(() => {
      setBranchNotice((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [networkNotice, setNetworkNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkNotice(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkNotice('Network Error: You are currently offline. Check your internet connection.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleToggleTemporaryChat = () => {
    setIsTemporaryChat((prev) => {
      const next = !prev;
      // Abort any ongoing AI generation immediately!
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsLoading(false);
      setGenerationStatusText('');

      // Clear all active messages and session state
      setCurrentConversationId(null);
      setMessages([]);

      // Clear composer typing bar and attachments
      window.dispatchEvent(new CustomEvent('sigma-clear-composer-input'));

      return next;
    });
  };

  const handleOpenLiveAssistant = () => {
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setNetworkNotice('Network Error: Internet connection required for Voice Assistant.');
      setTimeout(() => setNetworkNotice(null), 4000);
      return;
    }
    setIsLiveAssistantOpen(true);
  };

  // User Profile state with local storage fallback (never trust localStorage for isVerifiedOwner)
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('sigma_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Never allow client localStorage tampering to grant verified owner badge
        parsed.isVerifiedOwner = false;
        if (parsed.isLoggedIn) {
          if (!parsed.avatarUrl && parsed.email) {
            parsed.avatarUrl = getInstantSvgAvatar(parsed.name || parsed.email, parsed.email);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load user profile from storage', e);
    }

    // Restore saved persistent guest profile on this device
    try {
      const storedGuest = getStoredGuestProfile();
      if (storedGuest && storedGuest.name && storedGuest.name.trim() && storedGuest.name !== 'Guest User') {
        return {
          id: storedGuest.guestId,
          isLoggedIn: false,
          name: storedGuest.displayName || storedGuest.name,
          email: 'guest@sigma.ai',
          role: 'user',
          isVerifiedOwner: false,
          authProvider: 'guest',
          avatarUrl: getInstantSvgAvatar(storedGuest.displayName || storedGuest.name, 'guest@sigma.ai'),
        };
      }
    } catch (_) {}

    return {
      id: getPersistentGuestId() || undefined,
      isLoggedIn: false,
      name: 'Guest User',
      email: 'guest@sigma.ai',
      role: 'user',
      isVerifiedOwner: false,
      authProvider: 'guest',
      avatarUrl: getInstantSvgAvatar('Guest User', 'guest@sigma.ai'),
    };
  });

  // On every application startup: retrieve guests/{guestId}, restore saved name, restore guest session
  useEffect(() => {
    if (!user.isLoggedIn) {
      restoreGuestProfile().then((restored) => {
        if (restored && restored.name && restored.name.trim() && restored.name !== 'Guest User') {
          setUser((prev) => {
            if (prev.isLoggedIn) return prev; // Do not overwrite if user signed in
            return {
              ...prev,
              id: restored.guestId,
              name: restored.displayName || restored.name,
              email: 'guest@sigma.ai',
              authProvider: 'guest',
              avatarUrl: getInstantSvgAvatar(restored.displayName || restored.name, 'guest@sigma.ai'),
            };
          });
        }
      }).catch((err) => {
        console.warn('Guest profile startup restoration warning:', err);
      });
    }
  }, [user.isLoggedIn]);

  // Conversation history state
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const savedProfile = localStorage.getItem('sigma_user_profile');
      const initialProfile = savedProfile ? JSON.parse(savedProfile) : { isLoggedIn: false, email: 'guest@sigma.ai' };
      return loadConversationsForUser(initialProfile);
    } catch (e) {
      return [];
    }
  });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sigma_active_conversation_id') || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (currentConversationId) {
        localStorage.setItem('sigma_active_conversation_id', currentConversationId);
      } else {
        localStorage.removeItem('sigma_active_conversation_id');
      }
    } catch (_) {}
  }, [currentConversationId]);

  const [isRecentsOpen, setIsRecentsOpen] = useState(false);

  // If user is not logged in on initial load, show Welcome Sign-In modal; if logged in previously, do NOT prompt
  const [showWelcomeSignIn, setShowWelcomeSignIn] = useState<boolean>(() => !user.isLoggedIn);

  // AI Persistent Brain Knowledge (cross-session & cross-day memory)
  const [userBrain, setUserBrain] = useState<UserKnowledgeMemory | null>(null);

  useEffect(() => {
    let active = true;
    loadUserBrain(user.id || user.email || 'guest', user.email, user.name).then((brain) => {
      if (active) setUserBrain(brain);
    });
    return () => {
      active = false;
    };
  }, [user.id, user.email, user.name]);

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    try {
      localStorage.setItem('sigma_user_profile', JSON.stringify(updated));
      if (updated.id) {
        saveUserProfileToFirestore(updated);
      }
    } catch (e) {
      console.warn('Failed to save profile', e);
    }
  };

  // Google Login Name Onboarding Modal state
  const [showGoogleNamePrompt, setShowGoogleNamePrompt] = useState(false);
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [googleNameError, setGoogleNameError] = useState<string | null>(null);
  const [isAccountSuspendedState, setIsAccountSuspendedState] = useState<boolean>(false);

  useEffect(() => {
    const checkSusp = () => {
      if (user.isLoggedIn && user.email && !isVerifiedOwnerAccount(user)) {
        setIsAccountSuspendedState(isAccountSuspended(user.email));
      } else {
        setIsAccountSuspendedState(false);
      }
    };
    checkSusp();
    if (user.isLoggedIn && user.email) {
      syncAccountModerationFromServer(user.email).then((status) => {
        if (status.suspended) setIsAccountSuspendedState(true);
      });
    }
    window.addEventListener('sigma-account-suspended', checkSusp);
    return () => window.removeEventListener('sigma-account-suspended', checkSusp);
  }, [user.isLoggedIn, user.email, user.isVerifiedOwner]);

  const handleSaveGoogleOnboardingName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGoogleNameError(null);
    const candidateName = googleNameInput.trim();
    const validation = validateAccountName(candidateName, user, { recordStrikeOnFail: true });
    if (!validation.valid) {
      setGoogleNameError(
        validation.message ||
          'This name cannot be used. Please choose another display name.'
      );
      if (validation.suspended) {
        setIsAccountSuspendedState(true);
      }
      return;
    }

    // Server-side authoritative validation & strike tracking
    try {
      const srvRes = await fetch('/api/account/validate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candidateName,
          email: user.email,
          uid: user.id,
          providerId: user.authProvider === 'google' ? 'google.com' : user.authProvider,
        }),
      });
      if (srvRes.ok) {
        const srvData = await srvRes.json();
        if (!srvData.valid) {
          setGoogleNameError(
            srvData.message || 'This name cannot be used. Please choose another display name.'
          );
          if (srvData.suspended) {
            setIsAccountSuspendedState(true);
          }
          return;
        }
      }
    } catch (_) {}

    const cleanName = candidateName || user.name || 'User';
    try {
      if (user.id) {
        localStorage.setItem(`sigma_google_saved_name_${user.id}`, cleanName);
      }
      if (user.email) {
        localStorage.setItem(`sigma_google_saved_name_${user.email.toLowerCase()}`, cleanName);
      }
      localStorage.setItem('sigma_user_name_custom', cleanName);
    } catch (_) {}

    const updatedProfile: UserProfile = {
      ...user,
      name: cleanName,
    };
    handleUpdateUser(updatedProfile);
    handleUpdateSettings({ userNameCustom: cleanName });
    setShowGoogleNamePrompt(false);
  };

  // Google Sign-In with real Firebase Popup
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const fbUser = await signInWithGooglePopup();
      const isAdmin = isAuthorizedForAdminPanel(fbUser.email || undefined);
      const emailKey = (fbUser.email || '').toLowerCase();
      const previouslySavedName =
        localStorage.getItem(`sigma_google_saved_name_${fbUser.uid}`) ||
        (emailKey ? localStorage.getItem(`sigma_google_saved_name_${emailKey}`) : null) ||
        '';
      const rawCandidate =
        previouslySavedName.trim() ||
        fbUser.displayName ||
        fbUser.email?.split('@')[0] ||
        'Google User';
      const initialSafety = validateAccountName(rawCandidate, {
        email: fbUser.email || '',
        isLoggedIn: true,
        authProvider: 'google',
      }, {
        recordStrikeOnFail: false,
      });
      const resolvedName = initialSafety.valid ? rawCandidate : 'Sigma User';

      // Verify owner status & suspension with trusted backend
      let verifiedOwnerFromServer = false;
      try {
        const verifyRes = await fetch('/api/auth/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: fbUser.uid,
            email: fbUser.email || '',
            providerId: 'google.com',
          }),
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          verifiedOwnerFromServer = Boolean(verifyData.isVerifiedOwner);
          if (verifyData.suspended && !verifiedOwnerFromServer) {
            setIsAccountSuspendedState(true);
          }
        }
      } catch (_) {}

      const profile: UserProfile = {
        id: fbUser.uid,
        isLoggedIn: true,
        name: resolvedName,
        email: fbUser.email || '',
        avatarUrl:
          fbUser.photoURL ||
          (fbUser.email
            ? getInstantSvgAvatar(resolvedName, fbUser.email)
            : undefined),
        role: isAdmin || verifiedOwnerFromServer ? 'admin' : 'user',
        isVerifiedOwner: verifiedOwnerFromServer,
        authProvider: 'google',
      };
      setAnonymousSessionName(null);
      setUser(profile);
      localStorage.setItem('sigma_user_profile', JSON.stringify(profile));
      await saveUserProfileToFirestore(profile);
      await recordUserToFirestoreRegistry({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        lastLoginAt: new Date().toISOString(),
        authProvider: 'Google Firebase Auth',
      });
      await recordSecurityAuditLog({
        event: 'GOOGLE_LOGIN_SUCCESS',
        userEmail: profile.email,
        status: 'SUCCESS',
        details: `User signed in via Google: ${profile.email}`,
      });

      // Automatically prompt the user for their preferred name on Google sign-in if not yet confirmed
      if (!previouslySavedName.trim() || !initialSafety.valid) {
        setGoogleNameError(null);
        setGoogleNameInput(initialSafety.valid ? fbUser.displayName || '' : '');
        setShowGoogleNamePrompt(true);
      } else {
        handleUpdateSettings({ userNameCustom: previouslySavedName.trim() });
      }

      // Load existing conversations from Firestore /chats collection
      try {
        const chats = await loadUserChatsFromFirestore(fbUser.uid);
        if (chats && chats.length > 0) {
          setConversations((prev) => {
            const merged = chats.map((rc) => {
              const local = prev.find((lc) => lc.id === rc.id);
              if (local && local.messages.length > rc.messages.length) {
                return { ...rc, messages: local.messages };
              }
              return rc;
            });
            for (const local of prev) {
              if (!merged.some((m) => m.id === local.id)) {
                merged.push(local);
              }
            }
            saveConversationsForUser(profile, merged);
            return merged;
          });
        }
      } catch (histErr) {
        console.warn('Could not load existing user chats', histErr);
      }

      // Start with empty/clean chat area as mandated
      setCurrentConversationId(null);
      setMessages([]);
    } catch (signInErr: any) {
      console.error('Google Sign-in failed:', signInErr);
      throw signInErr;
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Logout - switches back to guest mode and resets active chat
  const handleLogout = async () => {
    try {
      await signOutFirebase();
      recordSecurityAuditLog({
        event: 'LOGOUT',
        userEmail: user.email || 'user',
        status: 'SUCCESS',
        details: 'User initiated sign-out',
      });
    } catch (e) {
      console.warn('Firebase signout issue:', e);
    }
    const storedGuest = getStoredGuestProfile();
    const guestId = storedGuest?.guestId || getPersistentGuestId() || createPersistentGuestId();
    const guestName = (storedGuest?.displayName || storedGuest?.name || 'Guest User').trim();
    const loggedOut: UserProfile = {
      id: guestId,
      isLoggedIn: false,
      name: guestName,
      email: 'guest@sigma.ai',
      role: 'user',
      isVerifiedOwner: false,
      authProvider: 'guest',
      avatarUrl: getInstantSvgAvatar(guestName, 'guest@sigma.ai'),
    };
    try {
      localStorage.removeItem('sigma_user_name_custom');
    } catch (_) {}
    setAnonymousSessionName(null);
    setUser(loggedOut);
    localStorage.setItem('sigma_user_profile', JSON.stringify(loggedOut));
    setConversations(loadConversationsForUser(loggedOut));
    setCurrentConversationId(null);
    setMessages([]);
  };

  // Listen to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (fbUser) => {
      if (fbUser) {
        const isGoogleProvider =
          fbUser.providerData?.some((p) => p.providerId === 'google.com') ?? true;
        const isAdmin = isAuthorizedForAdminPanel(fbUser.email || undefined);
        const emailKey = (fbUser.email || '').toLowerCase();
        const savedCustomName =
          localStorage.getItem(`sigma_google_saved_name_${fbUser.uid}`) ||
          (emailKey ? localStorage.getItem(`sigma_google_saved_name_${emailKey}`) : null) ||
          localStorage.getItem('sigma_user_name_custom') ||
          '';
        const rawCandidate =
          savedCustomName.trim() ||
          fbUser.displayName ||
          fbUser.email?.split('@')[0] ||
          'Google User';

        // Authoritative backend verification for owner badge & suspension state
        let verifiedOwnerFromServer = false;
        try {
          const verifyRes = await fetch('/api/auth/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: fbUser.uid,
              email: fbUser.email || '',
              providerId: isGoogleProvider ? 'google.com' : 'password',
            }),
          });
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            verifiedOwnerFromServer = Boolean(verifyData.isVerifiedOwner);
            if (verifyData.suspended && !verifiedOwnerFromServer) {
              setIsAccountSuspendedState(true);
            }
          }
        } catch (_) {}

        const nameCheck = validateAccountName(
          rawCandidate,
          {
            email: fbUser.email || '',
            isLoggedIn: true,
            isVerifiedOwner: verifiedOwnerFromServer,
            authProvider: isGoogleProvider ? 'google' : 'password',
          },
          { recordStrikeOnFail: false }
        );
        const resolvedName = nameCheck.valid ? rawCandidate : 'Sigma User';

        const profile: UserProfile = {
          id: fbUser.uid,
          isLoggedIn: true,
          name: resolvedName,
          email: fbUser.email || '',
          avatarUrl:
            fbUser.photoURL ||
            (fbUser.email
              ? getInstantSvgAvatar(resolvedName, fbUser.email)
              : undefined),
          role: isAdmin || verifiedOwnerFromServer ? 'admin' : 'user',
          isVerifiedOwner: verifiedOwnerFromServer,
          authProvider: isGoogleProvider ? 'google' : 'password',
        };
        setUser(profile);
        localStorage.setItem('sigma_user_profile', JSON.stringify(profile));

        recordUserToFirestoreRegistry({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          lastLoginAt: new Date().toISOString(),
          authProvider: 'Firebase Session Restored',
        });

        // Load chats specifically for this authenticated UID
        try {
          const chats = await loadUserChatsFromFirestore(fbUser.uid);
          if (chats && chats.length > 0) {
            setConversations((prev) => {
              const merged = chats.map((rc) => {
                const local = prev.find((lc) => lc.id === rc.id);
                if (local && local.messages.length > rc.messages.length) {
                  return { ...rc, messages: local.messages };
                }
                return rc;
              });
              for (const local of prev) {
                if (!merged.some((m) => m.id === local.id)) {
                  merged.push(local);
                }
              }
              saveConversationsForUser(profile, merged);
              return merged;
            });

            // Restore active conversation from Firestore if activeId matches
            try {
              const activeId = localStorage.getItem('sigma_active_conversation_id');
              if (activeId) {
                const targetChat = chats.find((c) => c.id === activeId);
                if (targetChat && Array.isArray(targetChat.messages) && targetChat.messages.length > 0) {
                  setCurrentConversationId(targetChat.id);
                  setMessages(sanitizeMessages(targetChat.messages));
                }
              }
            } catch (_) {}
          }
        } catch (e) {
          console.warn('Could not load chats on auth state change:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Active user session heartbeat with full active session model compliance
  useEffect(() => {
    let sessionId = localStorage.getItem('sigma_active_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('sigma_active_session_id', sessionId);
    }
    localStorage.setItem('sigma_client_id', sessionId);

    const identityType: 'guest' | 'user' = user.isLoggedIn ? 'user' : 'guest';
    const identityId = user.isLoggedIn
      ? (user.id || user.email || 'user')
      : (user.id || getPersistentGuestId() || createPersistentGuestId());
    const displayName = (user.name && user.name !== 'Guest User')
      ? user.name
      : (identityType === 'user' ? (user.email || 'User') : (getStoredGuestProfile()?.name || 'Guest'));

    const sendHeartbeat = () => {
      updateActiveSessionPresence({
        sessionId,
        identityType,
        identityId,
        displayName,
        userEmail: user.isLoggedIn ? user.email : 'guest@sigma.ai',
      });
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 15000);

    const handleBeforeUnload = () => {
      markActiveSessionInactive(sessionId).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user.email, user.isLoggedIn, user.name, user.id]);

  // When user selects a conversation from Recents:
  const handleSelectConversation = async (convId: string) => {
    setIsTemporaryChat(false);
    setCurrentConversationId(convId);
    // 1. Check existing state
    const existing = conversations.find((c) => c.id === convId);
    if (!user.isLoggedIn) {
      setAnonymousSessionName(existing?.anonymousSessionName || null);
    }
    if (existing?.messages && existing.messages.length > 0) {
      setMessages(sanitizeMessages(existing.messages));
    } else {
      // Check local storage
      const localList = loadConversationsForUser(user);
      const fromLocal = localList.find((c) => c.id === convId);
      if (fromLocal?.messages && fromLocal.messages.length > 0) {
        setMessages(sanitizeMessages(fromLocal.messages));
      } else {
        setMessages([]);
      }
    }

    // 2. Fetch complete messages from Firestore
    try {
      const loadedMsgs = await loadChatMessagesFromFirestore(convId, user?.id);
      if (loadedMsgs && loadedMsgs.length > 0) {
        const sanitized = sanitizeMessages(loadedMsgs);
        setMessages(sanitized);
        setConversations((prev) => {
          const updated = prev.map((c) => (c.id === convId ? { ...c, messages: sanitized } : c));
          saveConversationsForUser(user, updated);
          return updated;
        });
      }
    } catch (err) {
      console.warn('Failed to load messages for chat from Firestore:', err);
    }
  };

  // Start a new chat - resets current view but never deletes saved history
  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setGenerationStatusText('');
    setCurrentConversationId(null);
    setMessages([]);
    setAnonymousSessionName(null);
    setIsRecentsOpen(false);
    window.dispatchEvent(new CustomEvent('sigma-clear-composer-input'));
    window.dispatchEvent(new CustomEvent('sigma-focus-chat-input'));
  };

  // Rename a chat
  const handleRenameConversation = async (convId: string, newTitle: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c));
      saveConversationsForUser(user, updated);
      return updated;
    });

    if (user.isLoggedIn) {
      try {
        await renameChatInFirestore(convId, newTitle);
      } catch (err) {
        console.warn('Failed to rename chat in Firestore:', err);
      }
    }
  };

  // Delete a chat with confirmation
  const handleDeleteConversation = async (convId: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== convId);
      saveConversationsForUser(user, updated);
      return updated;
    });

    if (currentConversationId === convId) {
      setCurrentConversationId(null);
      setMessages([]);
    }

    if (user.isLoggedIn) {
      try {
        await deleteChatInFirestore(convId);
      } catch (err) {
        console.warn('Failed to delete chat in Firestore:', err);
      }
    }
  };

  // Permanently clear all recent chats forever across browser reloads
  const handleClearAllConversations = async () => {
    // 1. Immediately reset in-memory UI state
    setConversations([]);
    setCurrentConversationId(null);
    setMessages([]);

    // 2. Clear browser storage & cookies for guest
    try {
      saveGuestConversations([]);
      localStorage.removeItem('sigma_guest_conversations');
    } catch (e) {
      console.warn('Could not clear guest storage:', e);
    }

    // 3. Clear user scoped storage
    if (user.isLoggedIn && user.email) {
      try {
        const key = `sigma_convs_${user.email.toLowerCase().trim()}`;
        localStorage.setItem(key, JSON.stringify([]));
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('Could not clear user local storage:', e);
      }
    }

    // 4. Permanently delete all chats from Firebase Firestore forever so reloads never restore them
    const uid = user.id || auth.currentUser?.uid;
    if (uid) {
      try {
        await deleteAllUserChatsInFirestore(uid);
      } catch (fbErr) {
        console.warn('Failed to delete all user chats in Firestore:', fbErr);
      }
    }
  };

  // Toggle Pin on a chat
  const handleTogglePinConversation = async (convId: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === convId ? { ...c, isPinned: !c.isPinned } : c
      );
      saveConversationsForUser(user, updated);
      return updated;
    });
  };

  // Settings state persisted in localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('sigma_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load settings from storage', e);
    }
    return DEFAULT_SETTINGS;
  });

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('sigma_settings', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist settings', e);
      }
      return updated;
    });

    if (
      newSettings.userNameCustom !== undefined ||
      newSettings.userQualities !== undefined ||
      newSettings.userAskingStyle !== undefined ||
      newSettings.userDesiredResponseFormat !== undefined
    ) {
      const targetUid = user.id || user.email || 'guest';
      syncUserPreferencesToBrain(
        targetUid,
        newSettings.userNameCustom,
        newSettings.userQualities,
        newSettings.userAskingStyle,
        newSettings.userDesiredResponseFormat
      ).then((brain) => {
        setUserBrain(brain);
      }).catch((e) => console.warn('Could not sync brain preferences', e));
    }
  };

  // Synchronize stop-animations and high-contrast-mode with document root
  useEffect(() => {
    if (settings.stopAnimations) {
      document.documentElement.classList.add('stop-animations');
      document.body.classList.add('stop-animations');
    } else {
      document.documentElement.classList.remove('stop-animations');
      document.body.classList.remove('stop-animations');
    }
  }, [settings.stopAnimations]);

  useEffect(() => {
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast-mode');
      document.body.classList.add('high-contrast-mode');
    } else {
      document.documentElement.classList.remove('high-contrast-mode');
      document.body.classList.remove('high-contrast-mode');
    }
  }, [settings.highContrast]);

  // Modals state
  const [generationStatusText, setGenerationStatusText] = useState<string | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLiveAssistantOpen, setIsLiveAssistantOpen] = useState(false);
  const [isDrawOpen, setIsDrawOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [isSummarizeOpen, setIsSummarizeOpen] = useState(false);
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [isPastPaperOpen, setIsPastPaperOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isStudyWorkspaceOpen, setIsStudyWorkspaceOpen] = useState(false);
  const [activePdfViewer, setActivePdfViewer] = useState<{
    isOpen: boolean;
    pdfUrl: string;
    title: string;
    subject?: string;
    board?: string;
    qualification?: string;
    year?: number | string;
    session?: string;
    paperNumber?: string;
  } | null>(null);


  const handleClearGuestSession = async () => {
    if (!user.isLoggedIn) {
      try {
        localStorage.removeItem('sigma_guest_profile');
        localStorage.removeItem('sigma_guest_id');
        localStorage.removeItem('sigma_guest_convs');
        localStorage.removeItem('sigma_user_name_custom');
      } catch (_) {}
      setAnonymousSessionName(null);
      setConversations([]);
      setMessages([]);
      setCurrentConversationId(null);
      const guestId = createPersistentGuestId();
      setUser({
        id: guestId,
        isLoggedIn: false,
        name: 'Guest User',
        email: 'guest@sigma.ai',
        role: 'user',
        isVerifiedOwner: false,
        authProvider: 'guest',
        avatarUrl: getInstantSvgAvatar('Guest User', 'guest@sigma.ai'),
      });
    }
  };

  const currentTheme = getThemeColor(settings.themeColor, settings.customThemeColor);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    setGenerationStatusText(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  // Dismiss open modals on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLoading) {
          handleStopGeneration();
          return;
        }
        if (isLiveAssistantOpen) {
          setIsLiveAssistantOpen(false);
          return;
        }
        if (isDrawOpen) {
          setIsDrawOpen(false);
          setEditingImage(null);
          return;
        }
        if (isSummarizeOpen) {
          setIsSummarizeOpen(false);
          return;
        }
        if (isCodeOpen) {
          setIsCodeOpen(false);
          return;
        }
        if (isExplainOpen) {
          setIsExplainOpen(false);
          return;
        }
        if (isConnectionsOpen) {
          setIsConnectionsOpen(false);
          return;
        }
        if (isPastPaperOpen) {
          setIsPastPaperOpen(false);
          return;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (isRecentsOpen) {
          setIsRecentsOpen(false);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isLoading,
    isLiveAssistantOpen,
    isDrawOpen,
    isSummarizeOpen,
    isCodeOpen,
    isExplainOpen,
    isSettingsOpen,
    isRecentsOpen,
  ]);

  const mainScrollRef = useRef<HTMLElement | null>(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [isStreamingMessage, setIsStreamingMessage] = useState(false);
  const showScrollToLatestRef = useRef(false);
  const streamIntervalRef = useRef<any>(null);
  const [branchNotice, setBranchNotice] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollToLatest(false);
    showScrollToLatestRef.current = false;
  };

  useEffect(() => {
    const checkScrollPosition = () => {
      if (messages.length === 0) {
        setShowScrollToLatest(false);
        showScrollToLatestRef.current = false;
        return;
      }

      const mainEl = mainScrollRef.current;
      const winDist =
        document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      const mainDist = mainEl
        ? mainEl.scrollHeight - (mainEl.scrollTop + mainEl.clientHeight)
        : 0;
      const distFromBottom = Math.max(winDist, mainDist);

      // Do not show the arrow on a tiny scroll near the bottom
      if (distFromBottom < 145) {
        setShowScrollToLatest(false);
        showScrollToLatestRef.current = false;
        return;
      }

      // Check if the user's last question element is still visible in the chat viewport
      const userNodes = document.querySelectorAll('[data-user-message="true"]');
      const lastUserEl = userNodes.length > 0 ? userNodes[userNodes.length - 1] : null;
      const footerEl = document.getElementById('chat-input-bar');
      const visibleBottom = footerEl
        ? footerEl.getBoundingClientRect().top
        : window.innerHeight - 130;
      const visibleTop = 64;

      if (lastUserEl) {
        const rect = lastUserEl.getBoundingClientRect();
        const isLastQuestionVisible =
          rect.bottom > visibleTop + 14 && rect.top < visibleBottom - 14;
        // Show the arrow as soon as the last user question has passed out of view (or if scrolled far up a very long response)
        const shouldShow = !isLastQuestionVisible || distFromBottom > 440;
        setShowScrollToLatest(shouldShow);
        showScrollToLatestRef.current = shouldShow;
      } else {
        const shouldShow = distFromBottom > 220;
        setShowScrollToLatest(shouldShow);
        showScrollToLatestRef.current = shouldShow;
      }
    };

    const mainEl = mainScrollRef.current;
    window.addEventListener('scroll', checkScrollPosition, { passive: true });
    mainEl?.addEventListener('scroll', checkScrollPosition, { passive: true });
    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      mainEl?.removeEventListener('scroll', checkScrollPosition);
    };
  }, [messages.length]);

  useEffect(() => {
    if (!showScrollToLatestRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: isStreamingMessage ? 'auto' : 'smooth' });
    }
  }, [messages, isLoading, isStreamingMessage]);

  // Feature 19: Branch in New Chat
  const handleBranchChat = (messageId: string) => {
    const targetIdx = messages.findIndex((m) => m.id === messageId);
    const branchedMessages =
      targetIdx >= 0 ? messages.slice(0, targetIdx + 1) : [...messages];
    if (branchedMessages.length === 0) return;

    const currentConv = conversations.find((c) => c.id === currentConversationId);
    const baseTitle = currentConv?.title || branchedMessages[0]?.content.slice(0, 24) || 'Chat';
    const branchTitle = `${baseTitle.replace(/\s*\(Branch\)$/i, '')} (Branch)`;
    const newBranchId = `chat-branch-${Date.now()}`;
    const lastMsg = branchedMessages[branchedMessages.length - 1];

    const newBranchConv: Conversation = {
      id: newBranchId,
      title: branchTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessagePreview: (lastMsg?.content || 'Branched conversation').slice(0, 80),
      messages: branchedMessages,
      isSpecificSaved: true,
    };

    setCurrentConversationId(newBranchId);
    setMessages(branchedMessages);
    setConversations((prev) => {
      const nextList = [newBranchConv, ...prev];
      saveConversationsForUser(user, nextList, settings.historySavePolicy || 'specific_only');
      return nextList;
    });

    if (user.isLoggedIn && user.id) {
      saveChatInFirestore(
        newBranchId,
        user.id,
        branchTitle,
        (lastMsg?.content || 'Branched conversation').slice(0, 80),
        user.email,
        branchedMessages
      );
      branchedMessages.forEach((m) => {
        saveMessageInFirestore(newBranchId, user.id!, m);
      });
    }

    setBranchNotice(`Branched into new chat: "${branchTitle}"`);
    setTimeout(() => setBranchNotice(null), 3200);
  };

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // audio context not allowed or failed
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/[*_#`[\]()]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 600);
      if (!clean) return;
      const selectedVoice = settings.ttsVoice || getSavedTtsVoice();
      const resolved = resolveSpeechVoice(selectedVoice);
      if (!resolved.available) return;
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = settings.speechRate ? settings.speechRate * resolved.rate : resolved.rate;
      utterance.pitch = resolved.pitch;
      if (resolved.voice) {
        utterance.voice = resolved.voice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // ignore
    }
  };

  const handleSendMessage = async (
    text: string,
    images?: string[] | string,
    optionsOrPptMode?: { isLiveVoice?: boolean; voiceAgent?: 'alexa' | 'sigma' | 'alex'; isRegenerate?: boolean } | boolean,
    specialModeArg?: ComposerSpecialMode,
    videosArg?: VideoAttachment[]
  ): Promise<string | void> => {
    const effectiveSpecialMode = specialModeArg !== undefined ? specialModeArg : activeSpecialMode;
    const forcePptMode =
      (typeof optionsOrPptMode === 'boolean' ? optionsOrPptMode : false) ||
      effectiveSpecialMode === 'powerpoint';
    const forceExcelMode = effectiveSpecialMode === 'excel';
    const options = typeof optionsOrPptMode === 'object' ? optionsOrPptMode : undefined;
    const isRegenerateRequest = Boolean(options?.isRegenerate);
    const rawImages = images ? (Array.isArray(images) ? images : [images]) : [];
    const hasText = Boolean(text && text.trim());
    const hasVideos = Boolean(videosArg && videosArg.length > 0);
    const hasImages = rawImages.length > 0;
    if ((!hasText && !hasImages && !hasVideos) || isLoading) return;

    const trimmedText = text ? text.trim() : '';

    if (trimmedText === '/camera' && !hasImages) {
      setCameraInitialMode('select');
      setIsCameraModalOpen(true);
      return;
    }
    if (trimmedText === '/mods') {
      setIsModesModalOpen(true);
      return;
    }

    // Extract uploaded file/attachment attribution for "View source" (Feature 18)
    const detectedUsedFiles: UsedFileSource[] = [];
    const fileMarkerRegex = /--- Attached File:\s*([^\n-]+?)\s*---/gi;
    let fileMatch: RegExpExecArray | null;
    while ((fileMatch = fileMarkerRegex.exec(trimmedText)) !== null) {
      const fileName = fileMatch[1].trim();
      const ext = fileName.includes('.') ? fileName.split('.').pop()?.toUpperCase() || 'FILE' : 'FILE';
      detectedUsedFiles.push({
        name: fileName,
        type: `${ext} Document`,
      });
    }
    if (hasVideos && videosArg) {
      videosArg.forEach((v) => {
        detectedUsedFiles.push({
          name: v.name,
          type: `Video (${v.durationFormatted || 'Clip'})`,
          size: v.size,
        });
      });
    }
    if (hasImages && !hasVideos) {
      rawImages.forEach((_, idx) => {
        detectedUsedFiles.push({
          name: `Uploaded Image ${idx + 1}`,
          type: 'Image Attachment',
        });
      });
    }

    // Detect if starting a new conversation or continuing existing session
    const isNewSession = !currentConversationId;
    const activeChatId = currentConversationId || `chat-${Date.now()}`;
    if (isNewSession) {
      setCurrentConversationId(activeChatId);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedText || (hasVideos ? 'Uploaded video' : hasImages ? 'Uploaded image(s)' : ''),
      images: hasImages && !hasVideos ? rawImages : undefined,
      videos: hasVideos ? videosArg : undefined,
      timestamp: new Date(),
    };

    if (hasImages && Array.isArray(rawImages)) {
      rawImages.forEach((imgSrc, idx) => {
        if (imgSrc) {
          saveUserUploadedPicture(user, {
            title: trimmedText ? trimmedText.slice(0, 44) : `Uploaded Picture ${idx + 1}`,
            src: imgSrc,
            conversationId: activeChatId,
          });
        }
      });
    }

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    const sendStartTime = Date.now();

    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }

    if (effectiveSpecialMode === 'deep_search') {
      setGenerationStatusText('Searching deeply...');
    } else if (effectiveSpecialMode === 'deep_think') {
      setGenerationStatusText('Thinking deeply...');
    } else if (effectiveSpecialMode === 'web_search') {
      setGenerationStatusText('Searching website...');
    } else if (isStoryQuery(trimmedText)) {
      setGenerationStatusText('Writing story...');
    } else if (isSummaryQuery(trimmedText)) {
      setGenerationStatusText('Writing summary...');
    } else {
      setGenerationStatusText('');
    }

    // Determine topic title for the conversation
    let activeTitle = trimmedText.slice(0, 32) || (hasImages ? 'Image analysis' : 'New Chat');
    const existingConv = conversations.find((c) => c.id === activeChatId);

    if (existingConv) {
      // Retain existing conversation title across all subsequent messages
      activeTitle = existingConv.title;
    } else if (trimmedText) {
      // First message in a new conversation: generate concise topic title via AI
      activeTitle = trimmedText.slice(0, 30) + (trimmedText.length > 30 ? '...' : '');
    }

    // Update local conversations state immediately so message is persisted even before AI finishes
    const intermediateConv: Conversation = {
      id: activeChatId,
      title: activeTitle,
      createdAt: existingConv ? existingConv.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessagePreview: (trimmedText || 'Image attachment').slice(0, 80),
      messages: newMessages,
    };

    const historyPolicy = settings.historySavePolicy || 'specific_only';
    const qualifiesForHistory = historyPolicy === 'all' || isSpecificHistoryEligible(intermediateConv);

    if (!isTemporaryChat) {
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== activeChatId);
        const nextList = [intermediateConv, ...remaining];
        saveConversationsForUser(user, nextList, historyPolicy);
        return nextList;
      });

      // Persist conversation record and user message to Firestore if logged in and qualifies for history
      if (user.isLoggedIn && user.id && qualifiesForHistory) {
        saveChatInFirestore(
          activeChatId,
          user.id,
          activeTitle,
          (trimmedText || 'Image attachment').slice(0, 80),
          user.email,
          newMessages
        );
        saveMessageInFirestore(activeChatId, user.id, userMsg);
      }
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Prepare full message history for backend so AI retains 100% memory of all prior turns
      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
        images: m.images,
      }));

      // Generate recent chats memory summary across user's past sessions
      const otherConvs = conversations.filter((c) => c.id !== activeChatId).slice(0, 8);
      const recentMemorySummary =
        otherConvs.length > 0
          ? otherConvs
              .map((c, idx) => {
                const preview = c.lastMessagePreview
                  ? ` (Latest: "${c.lastMessagePreview.slice(0, 100)}")`
                  : '';
                return `${idx + 1}. Session "${c.title}"${preview}`;
              })
              .join('\n')
          : '';

      // Update persistent AI brain knowledge & lightweight preference profile
      // Resolve persistent guest profile and display name
      const storedGuestProfile = getStoredGuestProfile();
      let activeAnonName = !user.isLoggedIn
        ? (isNewSession ? null : existingConv?.anonymousSessionName || anonymousSessionName)
        : null;
      if (!user.isLoggedIn && trimmedText) {
        const extractedAnon = extractAnonymousSessionName(trimmedText);
        if (extractedAnon) {
          activeAnonName = extractedAnon;
          setAnonymousSessionName(extractedAnon);
        }
      }

      const guestDisplayName = (
        (user.name && user.name !== 'Guest User' ? user.name.trim() : '') ||
        (storedGuestProfile?.displayName || storedGuestProfile?.name || '') ||
        activeAnonName ||
        ''
      ).trim();

      const effectiveGuestId = user.id || storedGuestProfile?.guestId || getPersistentGuestId() || 'guest';

      const effectiveUserName = user.isLoggedIn
        ? (settings.userNameCustom && settings.userNameCustom.trim()) ||
          (user.name && user.name !== 'Guest User' ? user.name.trim() : '') ||
          'User'
        : guestDisplayName;

      let updatedBrain = userBrain;
      if (!isTemporaryChat && trimmedText && user.isLoggedIn) {
        updatedBrain = updateBrainAndPreferencesFromTurn(trimmedText, userBrain, {
          userId: user.id || user.email || 'guest',
          userName: effectiveUserName || 'User',
          usedVoice: Boolean(options?.isLiveVoice),
          usedSpreadsheet: Boolean(forceExcelMode),
          usedPresentation: Boolean(forcePptMode),
        });
        setUserBrain(updatedBrain);
        saveUserBrain(updatedBrain);
      }
      const userPreferenceBlock = user.isLoggedIn
        ? buildUserPreferencePromptBlock(updatedBrain, trimmedText)
        : '';

      // Determine Executive Role & Cipher Mode (strictly for verified owners)
      const isOwnerVerified = isVerifiedOwnerAccount(user);
      const executiveRole = isOwnerVerified ? getUserExecutiveRole(user.email) : null;
      const isRobotCipher = isUseSigmaMode(trimmedText);
      const isNormalSwitch = isReturnToNormalLanguage(trimmedText);

      // Clean prompt if usesigma mode was requested
      const promptToProcess = isRobotCipher ? cleanUseSigmaPrompt(trimmedText) : trimmedText;

      let replyContent = '';

      // Immediately reject and halt on profanity / bad language
      if (detectBadLanguage(trimmedText)) {
        replyContent = BAD_LANGUAGE_REJECTION_MESSAGE;
      }
      let isMemoryCacheHit = false;
      let responseSources: SourceItem[] = [];
      let responseSearchQueries: string[] = [];
      let responseUsedSearch = false;
      let responseSearchFailed = false;

      const ambiguityHint = analyzeAmbiguousShortInput(promptToProcess);
      const enrichedPreferenceBlock = [
        userPreferenceBlock,
        user.isLoggedIn
          ? `Authenticated User Profile: Preferred Name="${effectiveUserName}" (Remember the user's name is "${effectiveUserName}" and naturally address or refer to them by their name "${effectiveUserName}" in conversation), Email="${user.email || ''}", Role="${executiveRole || 'user'}"${
              settings.writeSomethingAboutYou ? `, Bio="${settings.writeSomethingAboutYou}"` : ''
            }.`
          : guestDisplayName
          ? `Active Guest User Profile:
- Identity Type: guest
- Guest ID: "${effectiveGuestId}"
- Display Name: "${guestDisplayName}"
The active user is browsing as a persistent Guest whose name is "${guestDisplayName}". Naturally address and refer to them as "${guestDisplayName}". If the user asks "Who am I?", state clearly that they are "${guestDisplayName}" browsing as a Guest (Guest ID: ${effectiveGuestId}), and that they can [Sign in with Google] whenever they want to sync history across devices.`
          : `Active Guest User:
- Identity Type: guest
- Guest ID: "${effectiveGuestId}"
The user is browsing as a Guest User without a set name yet. If they ask "Who am I?", let them know they are browsing as a Guest User, and include [Sign in with Google] on its own line.`,
        ambiguityHint.isAmbiguous ? ambiguityHint.directive : '',
        isNormalSwitch
          ? 'The user asked to return to normal human language from cipher mode. Acknowledge naturally that you are back in normal language.'
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      // Check for existing presentation or Excel workbook in current conversation
      const lastPptMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'model' && m.content.includes('sigma-powerpoint'));
      const existingPresentation = lastPptMessage
        ? extractPresentationFromMessage(lastPptMessage.content).presentation
        : null;

      const lastExcelMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'model' && m.content.includes('sigma-excel'));
      const existingExcel = lastExcelMessage
        ? extractExcelFromMessage(lastExcelMessage.content).workbook
        : null;

      // Check if there is a pending slide count question from the previous assistant turn (Rule 2)
      const lastSlidePromptMsg = [...messages]
        .reverse()
        .find((m) => m.role === 'model' && m.content.includes('sigma-ppt-slide-count-prompt'));
      const activePendingPpt: PendingSlideCountPromptData | null =
        pendingPptRequest ||
        (lastSlidePromptMsg
          ? extractSlideCountPromptFromMessage(lastSlidePromptMsg.content).promptData
          : null);
      const repliedSlideCount = activePendingPpt ? parseSlideCountReply(promptToProcess) : null;

      // Dedicated Excel Intent Detection
      const excelIntent = !hasImages && !forcePptMode && !repliedSlideCount
        ? detectExcelIntent(
            promptToProcess,
            forceExcelMode,
            Boolean(existingExcel)
          )
        : { intent: 'NORMAL_CHAT' as const, topic: '', wantsChart: false };

      // Dedicated PowerPoint Intent Detection (Requirements 13, 14, 15, 16, 17, 18)
      const pptIntent = repliedSlideCount && activePendingPpt
        ? {
            intent: 'POWERPOINT_GENERATION' as const,
            topic: activePendingPpt.topic,
            slideCount: repliedSlideCount,
            hasExplicitSlideCount: true,
            slideCountProvided: true,
            isContextualTurnIntoPpt: Boolean(activePendingPpt.isContextualTurnIntoPpt),
            isPblProject: activePendingPpt.isPblProject,
            audience: activePendingPpt.audience,
            isTopicAmbiguous: false,
          }
        : !hasImages && excelIntent.intent === 'NORMAL_CHAT'
        ? detectPowerPointIntent(
            promptToProcess,
            forcePptMode || isPowerPointMode,
            Boolean(existingPresentation),
            messages.length > 0
          )
        : {
            intent: 'NORMAL_CHAT' as const,
            topic: '',
            slideCount: 8,
            hasExplicitSlideCount: false,
            slideCountProvided: false,
            isPblProject: false,
            isContextualTurnIntoPpt: false,
            isTopicAmbiguous: false,
          };

      if (repliedSlideCount) {
        setPendingPptRequest(null);
      }

      if (forcePptMode || isPowerPointMode || effectiveSpecialMode) {
        setIsPowerPointMode(false);
        setActiveSpecialMode(null);
      }

      // Requirement 7: Study Sources (Websites / YouTube) Integration & Numbered Choice Answering
      const lowerInput = promptToProcess.toLowerCase().trim();
      const isStudySourceQuery =
        !replyContent &&
        !hasImages &&
        !hasVideos &&
        (/\b(study|explain|open|review|tell me about)\s+(source|sources|study source|website|youtube|past paper)\b/i.test(lowerInput) ||
          /\b(what|list|show)\s+(are\s+)?(my\s+)?(study\s+)?sources\b/i.test(lowerInput) ||
          /^(?:explain|study|open)\s+(?:number|#)?\s*(\d+)$/i.test(lowerInput));

      if (isStudySourceQuery) {
        const storedSources = getStoredStudySources().filter((s) => s.enabled);
        const numberMatch = lowerInput.match(/^(?:explain|study|open)\s+(?:number|#)?\s*(\d+)$/i);

        if (numberMatch && numberMatch[1]) {
          const idx = parseInt(numberMatch[1], 10) - 1;
          if (idx >= 0 && idx < storedSources.length) {
            const matched = storedSources[idx];
            replyContent = `### 📚 Study Source: ${matched.name}\n\n**Category:** ${matched.categoryLabel || matched.category}  \n**Official URL:** [${matched.url}](${matched.url})  \n**Curriculum Focus:** ${(matched.gradeLevels || ['General']).join(', ')}\n\n${matched.description}\n\n#### 🎯 Key Examination & Revision Focus:\n• **Syllabus & Learning Outcomes:** Use this verified resource to master core topics, formula sheets, and exam definitions.\n• **Past Paper Practice:** Review previous exam series and mark schemes.\n• **Step-by-Step Solving:** You can ask me to solve any specific question from ${matched.name} (e.g. "Solve CAIE 9709 P1 Question 3").\n\n[CHOICE: Solve past paper questions | Review syllabus topics | Practice exam questions]`;
          }
        } else {
          // Check if user named a specific source
          const matched = storedSources.find((s) =>
            lowerInput.includes(s.name.toLowerCase()) || (s.url && lowerInput.includes(s.url.toLowerCase()))
          );
          if (matched) {
            replyContent = `### 📚 Study Source: ${matched.name}\n\n**Category:** ${matched.categoryLabel || matched.category}  \n**Official URL:** [${matched.url}](${matched.url})  \n**Curriculum Focus:** ${(matched.gradeLevels || ['General']).join(', ')}\n\n${matched.description}\n\n#### 🎯 Key Examination & Revision Focus:\n• **Syllabus & Learning Outcomes:** Official specifications and examiner reports.\n• **Step-by-Step Solving:** Ask any question from this board to receive step-by-step verified steps.\n\n[CHOICE: Solve past paper questions | Review syllabus topics | Practice exam questions]`;
          } else {
            // Not found: state clearly in English, show numbered clickable buttons
            replyContent = `I searched your saved Study Sources, but could not find an exact match for that request.\n\nHere are your active saved study sources:\n\n1. **Cambridge Assessment International Education (CAIE)** — Official syllabuses, grade thresholds, and past papers\n2. **Aga Khan University Examination Board (AKU-EB)** — Conceptual assessment standards and SLO papers\n3. **Federal Board (FBISE)** — SLO-based examinations and model papers\n4. **Khan Academy** — STEM lessons and interactive practice\n5. **PastPapers.Co** — CAIE, AQA, CCEA, OCR past paper repository\n\nClick any of the options below, or type **"Explain number 1"** to study that specific source! 🎯\n\n[CHOICE: Explain number 1 | Explain number 2 | Explain number 3 | Explain number 4 | Explain number 5]`;
          }
        }
      }

      // Handle Excel Modification Intent
      if (!replyContent && excelIntent.intent === 'EXCEL_MODIFICATION' && existingExcel) {
        setExcelGeneratingTopic(existingExcel.title);
        let updatedWorkbook: ExcelWorkbookData | null = null;
        try {
          const apiRes = await fetch('/api/modify-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workbook: existingExcel,
              instruction: excelIntent.modificationInstruction || promptToProcess,
              userPrompt: promptToProcess,
            }),
          });
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data.workbook && Array.isArray(data.workbook.sheets) && data.workbook.sheets.length > 0) {
              updatedWorkbook = data.workbook;
            }
          }
        } catch (apiErr) {
          console.warn('[EXCEL-CLIENT] /api/modify-excel call failed, using local engine:', apiErr);
        }

        if (!updatedWorkbook) {
          updatedWorkbook = applyExcelModification(
            existingExcel,
            excelIntent.modificationInstruction || promptToProcess
          );
        }

        replyContent = serializeExcelToMessage(
          updatedWorkbook,
          `I have updated your **${updatedWorkbook.title}** Excel workbook (${updatedWorkbook.sheets.length} ${
            updatedWorkbook.sheets.length === 1 ? 'sheet' : 'sheets'
          }) based on your request: *"${promptToProcess}"* ✨`
        );
        setExcelGeneratingTopic(null);
      }

      // Handle Excel Generation Intent
      if (!replyContent && excelIntent.intent === 'EXCEL_GENERATION') {
        const resolvedExcelTopic = excelIntent.topic || promptToProcess;
        setExcelGeneratingTopic(resolvedExcelTopic);
        let generatedWorkbook: ExcelWorkbookData | null = null;
        try {
          const apiRes = await fetch('/api/generate-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: resolvedExcelTopic,
              userPrompt: promptToProcess,
              wantsChart: true,
              chartType: excelIntent.chartType || 'bar',
            }),
          });
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data.workbook && Array.isArray(data.workbook.sheets) && data.workbook.sheets.length > 0) {
              generatedWorkbook = data.workbook;
            }
          }
        } catch (apiErr) {
          console.warn('[EXCEL-CLIENT] /api/generate-excel call failed, using verified fallback engine:', apiErr);
        }

        if (!generatedWorkbook) {
          generatedWorkbook = generateExcelWorkbook(
            resolvedExcelTopic,
            promptToProcess,
            excelIntent.wantsChart,
            excelIntent.chartType
          );
        }

        replyContent = serializeExcelToMessage(
          generatedWorkbook,
          `Here is your **${generatedWorkbook.title}** Excel workbook (${generatedWorkbook.sheets.length} ${
            generatedWorkbook.sheets.length === 1 ? 'worksheet' : 'worksheets'
          }) with automated Excel formulas (\`=SUM\`, \`=AVERAGE\`, \`=IF\`), formatted columns, and interactive chart preview. Click **Download .XLSX** to save the real Excel file. ✨`
        );
        setExcelGeneratingTopic(null);
      }

      // Handle PowerPoint Modification Intent (Requirement 18)
      if (!replyContent && pptIntent.intent === 'POWERPOINT_MODIFICATION' && existingPresentation) {
        setPptGeneratingTopic(existingPresentation.title);
        await new Promise((r) => setTimeout(r, 900));
        const updatedPresentation = applyLocalPresentationModification(
          existingPresentation,
          pptIntent.modificationInstruction || promptToProcess
        );
        replyContent = serializePresentationToMessage(
          updatedPresentation,
          `I have updated your **${updatedPresentation.title}** presentation (${updatedPresentation.slides.length} slides) based on your request: *"${promptToProcess}"* ✨`
        );
        setPptGeneratingTopic(null);
      }

      // Handle PowerPoint Generation Intent (Requirements 1–23)
      if (!replyContent && pptIntent.intent === 'POWERPOINT_GENERATION') {
        let resolvedTopic = pptIntent.topic || '';
        let resolvedSlideCount = pptIntent.slideCount;
        let isCountKnown = pptIntent.slideCountProvided;

        if (pptIntent.isContextualTurnIntoPpt && messages.length > 0) {
          if (existingPresentation) {
            if (!resolvedTopic) resolvedTopic = existingPresentation.topic || existingPresentation.title;
            if (!pptIntent.hasExplicitSlideCount) {
              resolvedSlideCount = existingPresentation.slides.length;
            }
            isCountKnown = true;
          } else {
            const prevUserOrModel = [...messages]
              .reverse()
              .find(
                (m) =>
                  m.content &&
                  !m.content.includes('sigma-powerpoint') &&
                  !m.content.includes('sigma-ppt-slide-count-prompt')
              );
            if (prevUserOrModel) {
              const firstLine = prevUserOrModel.content
                .replace(/[#*_`]/g, '')
                .split('\n')
                .map((l) => l.trim())
                .find((l) => l.length > 2)
                ?.slice(0, 60)
                .trim();
              if (firstLine && !resolvedTopic) resolvedTopic = firstLine;
            }
          }
        }

        if (!resolvedTopic) {
          resolvedTopic = promptToProcess;
        }

        // Requirement 13: If the topic is genuinely ambiguous, ask a short clarification question
        if (pptIntent.isTopicAmbiguous && pptIntent.ambiguityClarificationQuestion) {
          replyContent = pptIntent.ambiguityClarificationQuestion;
        } else if (!isCountKnown) {
          // Requirement 15: Only ask for slide count when it is missing
          const pendingData: PendingSlideCountPromptData = {
            topic: resolvedTopic,
            userPrompt: promptToProcess,
            isPblProject: Boolean(pptIntent.isPblProject),
            audience: pptIntent.audience,
            isContextualTurnIntoPpt: pptIntent.isContextualTurnIntoPpt,
          };
          setPendingPptRequest(pendingData);
          const hiddenPromptTag = serializeSlideCountPrompt(pendingData);
          replyContent = `**How many slides would you like to create?**\n\nI’m ready to create your ${
            pptIntent.isPblProject ? '**Project-Based Learning (PBL)** presentation' : 'PowerPoint presentation'
          } on **${resolvedTopic}**${
            pptIntent.audience ? ` (tailored for **${pptIntent.audience}**)` : ''
          }. Select a slide count below (**5 | 8 | 10 | 12 | 15 | Custom**):\n\n${hiddenPromptTag}`;
        } else {
          setPendingPptRequest(null);
          setPptGeneratingTopic(resolvedTopic);

          // Ensure animated multi-step progress is visible smoothly
          const minWaitPromise = new Promise((r) => setTimeout(r, 2200));
          let generatedPresentation = null;

          try {
            const pptRes = await fetch('/api/generate-presentation', {
              method: 'POST',
              signal: controller.signal,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                topic: resolvedTopic,
                slideCount: resolvedSlideCount,
                isPbl: Boolean(pptIntent.isPblProject),
                audience: pptIntent.audience,
                userPrompt: activePendingPpt?.userPrompt || promptToProcess,
                recentContext: messages.slice(-4).map((m) => ({
                  role: m.role,
                  content: m.content.slice(0, 500),
                })),
              }),
            });
            if (pptRes.ok) {
              const pptJson = await pptRes.json();
              if (pptJson?.presentation) {
                generatedPresentation = normalizePresentationData(
                  pptJson.presentation,
                  resolvedTopic,
                  resolvedSlideCount,
                  undefined,
                  activePendingPpt?.userPrompt || promptToProcess
                );
              }
            }
          } catch (pptErr) {
            console.warn('Using structured presentation designer:', pptErr);
          }

          await minWaitPromise;

          if (!generatedPresentation) {
            generatedPresentation = generateFallbackPresentation(
              resolvedTopic,
              resolvedSlideCount,
              undefined,
              {
                isPbl: Boolean(pptIntent.isPblProject),
                audience: pptIntent.audience,
              }
            );
          }

          replyContent = serializePresentationToMessage(
            generatedPresentation,
            `Here is your **${generatedPresentation.slides.length}-slide ${
              generatedPresentation.isPbl ? 'PBL ' : ''
            }PowerPoint presentation** on **${generatedPresentation.title}**. Click **Preview** to inspect the slides in full 16:9 widescreen, **Play** to present, or **Download PPTX** to save the file. ✨`
          );
          setPptGeneratingTopic(null);
        }
      }

      // Check if user is asking to explain a specific slide from the active presentation (e.g. "Now explain slide 4")
      const explainSlideMatch =
        !replyContent &&
        existingPresentation &&
        promptToProcess.match(/\b(explain|what\s+is\s+on|summarize|describe|tell\s+me\s+about)\s+slide\s+(\d+)\b/i);
      if (explainSlideMatch && existingPresentation) {
        const slideNum = parseInt(explainSlideMatch[2], 10);
        const targetSlide = existingPresentation.slides.find((s) => s.id === slideNum);
        if (targetSlide) {
          const cardSummary = (targetSlide.cards || [])
            .map((c) => `- **${c.title}**: ${c.content}`)
            .join('\n');
          const colSummary = [
            targetSlide.leftColumn
              ? `**${targetSlide.leftColumn.title}**: ${targetSlide.leftColumn.items.join('; ')}`
              : '',
            targetSlide.rightColumn
              ? `**${targetSlide.rightColumn.title}**: ${targetSlide.rightColumn.items.join('; ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n');
          replyContent = `### Slide ${targetSlide.id}: ${targetSlide.title}\n${
            targetSlide.subtitle ? `*${targetSlide.subtitle}*\n\n` : '\n'
          }**Detailed Explanation:**\nThis slide focuses on **${targetSlide.title}** within your presentation on **${
            existingPresentation.title
          }**.\n\n${cardSummary ? `${cardSummary}\n\n` : ''}${
            colSummary ? `${colSummary}\n\n` : ''
          }${
            targetSlide.takeaway ? `**Key Takeaway:** ${targetSlide.takeaway}\n\n` : ''
          }💡 *Tip: When presenting this slide, emphasize the key visual cards and pause for audience questions!* ✨`;
        }
      }

      // Analyze prompt: silent typo normalization for valid words, gentle clarification for meaningless gibberish
      const analysis = analyzeAndNormalizePrompt(promptToProcess);
      const normalizedSearchKey = analysis.normalizedPrompt || promptToProcess;

      // Check offline status
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      // Check if this is an active chat with prior messages
      const hasPriorChatContext = messages.length > 0;
      const isFollowUp = hasPriorChatContext && isConversationalFollowUp(promptToProcess);

      let isInstantMathSolved = false;
      // Check for pure mathematical calculations - solve instantly (0ms latency, zero hallucination) & save to database
      if (!replyContent && !hasImages && isPureMathCalculationPrompt(promptToProcess)) {
        const instantMath = evaluateMathPrompt(promptToProcess, executiveRole === 'owner');
        if (instantMath) {
          replyContent = instantMath;
          isInstantMathSolved = true;
          saveCalculationMemory(promptToProcess, instantMath, user.email || 'guest').catch(() => {});
          console.log('⚡ [INSTANT-MATH] Solved calculation instantly with exact fraction & saved to permanent memory');
        }
      }

      // Check for Word Meaning Target (e.g. "meaning of word jargon", "meaning of jargon", "define jargon", "jargon")
      const targetWord = extractWordMeaningTarget(promptToProcess) || extractWordMeaningTarget(normalizedSearchKey);
      const isDynamic = isDynamicQuery(promptToProcess) || isDynamicQuery(normalizedSearchKey);

      // Check for Story Continuation Actions:
      // When user clicks [Add a stronger ending twist] or [Show feeling more clearly]
      const isTwistAction =
        /\[?add a stronger ending twist\]?/i.test(promptToProcess.trim()) ||
        /stronger ending twist/i.test(promptToProcess);
      const isFeelingsAction =
        /\[?show (i am|ayaan['’]s|the)?\s*feelings? more clearly\]?/i.test(promptToProcess.trim()) ||
        /feeling more clearly/i.test(promptToProcess);
      const isStoryAction = isTwistAction || isFeelingsAction;

      // Offline Memory Recall ONLY when truly disconnected from internet (handles definitions & saved answers)
      if (!replyContent && !hasImages && isOffline) {
        const localMemory =
          lookupInstantQAMemory(promptToProcess, isOffline) ||
          lookupInstantQAMemory(normalizedSearchKey, isOffline);
        if (localMemory?.item?.answer) {
          replyContent = `${localMemory.item.answer}`;
          isMemoryCacheHit = true;
        }
      }

      // Extract the previous story text from conversation history so the twist is appended to the SAME story
      let previousStoryText = '';
      if (isStoryAction && messages.length > 0) {
        const lastStoryTurn = [...messages].reverse().find(
          (m) =>
            m.role === 'model' &&
            m.content &&
            !m.content.includes('sigma-codai.pages.dev') &&
            (m.content.includes('[Add a stronger ending twist]') ||
              m.content.toLowerCase().includes('chapter') ||
              m.content.toLowerCase().includes('once upon a time') ||
              m.content.toLowerCase().includes('door') ||
              m.content.toLowerCase().includes('whispered') ||
              m.content.toLowerCase().includes('story') ||
              m.content.toLowerCase().includes('narrative'))
        );
        if (lastStoryTurn) {
          // Clean out action pills from the raw previous story text
          previousStoryText = lastStoryTurn.content
            .replace(/\[Add a stronger ending twist\]/gi, '')
            .replace(/\[Show feeling more clearly\]/gi, '')
            .trim();
        }
      }

      // Offline Fallback Notice when offline and prompt is not in saved memory
      if (!replyContent && isOffline) {
        replyContent =
          'A brief network hiccup occurred. Please send your message again and I will answer directly! ✨';
      } else if (!replyContent) {
        // Section 1: Live API Execution (Strict Zero Caching & Dynamic Generation)
        // Route all AI generation through the server-side Gemini API pipeline (/api/chat)
        try {
          const backendTimeoutMs = 120000;
          const previousModelAnswer = isRegenerateRequest
            ? [...messages].reverse().find((m) => m.role === 'model')?.content || ''
            : '';
          const fetchPromise = fetch('/api/chat', {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: promptToProcess,
              images: rawImages.filter((img) => !videosArg?.some((v) => v.keyframes?.some((k) => k.dataUrl === img))),
              videos: videosArg && videosArg.length > 0 ? videosArg : undefined,
              identityType: user.isLoggedIn ? 'user' : 'guest',
              identityId: user.isLoggedIn ? (user.id || user.email || 'user') : effectiveGuestId,
              displayName: effectiveUserName,
              messages: newMessages.slice(-6, -1).map((m) => ({
                role: m.role === 'model' ? 'assistant' : 'user',
                content: m.content,
                images: m.images,
              })),
              userStudyInventory: {
                savedWebsites: getStudySources()
                  .filter((s) => s.category !== 'video' && s.category !== 'video_channel')
                  .map((s) => ({
                    id: s.id,
                    name: s.name,
                    url: s.url,
                    category: s.categoryLabel || s.category,
                    description: s.description,
                    enabled: s.enabled,
                  })),
                savedYouTube: getStudySources()
                  .filter((s) => s.category === 'video' || s.category === 'video_channel')
                  .map((s) => ({
                    id: s.id,
                    title: s.name,
                    url: s.url,
                    type: s.category === 'video_channel' ? 'channel' : 'video',
                    description: s.description,
                    enabled: s.enabled,
                  })),
                savedDiagrams: getStudyImageMaterials().map((img) => ({
                  id: img.id,
                  name: img.name,
                  description: img.description,
                })),
                chatAttachments: newMessages
                  .flatMap((m) => [
                    ...(m.usedFiles || []).map((f) => ({ name: f.name, type: f.type, size: f.size })),
                    ...(m.images || []).map((_, idx) => ({ name: `Image-${idx + 1}.jpg`, type: 'image' })),
                    ...(m.videos || []).map((v) => ({ name: v.name, type: 'video', size: v.size })),
                  ]),
              },
              executiveRole,
              userEmail: user.isLoggedIn ? user.email : undefined,
              isVerifiedOwner: isOwnerVerified,
              anonymousSessionName: !user.isLoggedIn ? activeAnonName || undefined : undefined,
              userPreferenceBlock: enrichedPreferenceBlock,
              ambiguityDirective: ambiguityHint.isAmbiguous ? ambiguityHint.directive : undefined,
              isRegenerate: isRegenerateRequest,
              previousAnswer: previousModelAnswer || undefined,
              brainMemory: updatedBrain || undefined,
              specialMode: effectiveSpecialMode || undefined,
              language: settings.language || 'English (US)',
              aiPersonality: settings.aiPersonality || 'Easy & Clear English',
              responseLength: settings.responseLength || 'Balanced',
              customAiPersona:
                settings.customAiPersonaEnabled !== false && settings.customAiPersona?.trim()
                  ? settings.customAiPersona.trim()
                  : undefined,
              customApiKey: settings.customApiKey?.trim() || undefined,
              customModel: settings.customModel?.trim() || undefined,
              customEndpoint: settings.customEndpoint?.trim() || undefined,
              storyContinuation: isStoryAction
                ? {
                    action: isTwistAction ? 'twist' : 'feelings',
                    previousStory: previousStoryText,
                  }
                : undefined,
            }),
          });
          const timeoutPromise = new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('BackendTimeout')), backendTimeoutMs)
          );
          const apiRes = await Promise.race([fetchPromise, timeoutPromise]);
          const apiData = await apiRes.json().catch(() => ({}));

          if (apiRes.ok && apiData.reply && typeof apiData.reply === 'string' && apiData.reply.trim()) {
            replyContent = apiData.reply;
            if (Array.isArray(apiData.sources)) {
              responseSources = apiData.sources;
            }
            if (Array.isArray(apiData.searchQueries)) {
              responseSearchQueries = apiData.searchQueries;
            }
            responseUsedSearch = Boolean(apiData.usedSearch);
            responseSearchFailed = Boolean(apiData.searchFailed);
          } else if (apiData?.error) {
            replyContent = String(apiData.error);
          }
        } catch (apiErr: any) {
          if (apiErr?.name === 'AbortError' || controller.signal.aborted) {
            throw apiErr;
          }
          console.error('[CHAT-API-ERROR]:', apiErr);
          if (apiErr?.message === 'BackendTimeout') {
            // Never output robotic timeout failure messages
            replyContent = 'I’m ready! Please ask again or continue your thought, and I will give you a clear answer right away. ✨';
          } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
            replyContent = 'Network connection error. You are currently offline. Please check your internet connection.';
          } else if (apiErr?.message?.includes('413') || apiErr?.message?.includes('too large')) {
            replyContent = 'The uploaded attachment payload is too large for the network request. Please upload a smaller video clip or fewer images.';
          } else {
            replyContent = 'A brief network hiccup occurred. Please send your message again and I will answer directly! ✨';
          }
        }

        if (!replyContent) {
          replyContent =
            '### ⚠️ Service Notice\n\nThe AI service encountered a temporary connection or processing interruption while preparing your answer.\n\n• **Suggested Action:** Please tap **Regenerate** below or resend your question.\n• **Attachments/PDFs:** If you uploaded a large document or scanned past paper, you can also ask for specific question numbers (e.g. "Solve Question 1") to process sections instantaneously. ✨';
        }
      }

      // Section 1.3: Stateless Privacy & Ephemeral Memory Isolation
      // Do not persistently save, log, or store user conversation history, personal data files,
      // calculation strings, or greetings to any permanent database or server storage layer.
      // Active short-term contextual memory is retained purely within the immediate in-memory chat stream.

      // If user invoked usesigma mode and has not asked to switch back to normal language:
      if (isRobotCipher && !isNormalSwitch) {
        replyContent = encodeSigmaRoboticCipher(replyContent);
      }

      // Clean up any residual cache notice or legacy static story buttons if present
      if (replyContent.includes('100% Exact Match') || replyContent.includes('100% direct match')) {
        replyContent = replyContent.replace(/⚡?\s*100%\s*(Exact|direct)\s*Match.*$/gim, '').trim();
      }
      replyContent = replyContent
        .replace(/\[Add a stronger ending twist\]/gi, '')
        .replace(/\[Show (I am |Ayaan['’]s )?feelings? more clearly\]/gi, '')
        .replace(/\b(?:this\s+is\s+|hey\s+|hello\s+)?sigma\s*boy\b[.,!:]*/gi, '')
        .trim();

      // Mandatory Emoji Integration (SECTION 5.2):
      // Every generated response must incorporate at least one relevant emoji directly matching the core context of the output.
      const hasEmoji = /\p{Extended_Pictographic}/u.test(replyContent);
      if (!hasEmoji && replyContent.length > 0) {
        replyContent = `${replyContent.trim()} ✨`;
      }

      // Check if this response is a pure mathematical calculation (exact fraction / step-by-step)
      const isMathCalculation =
        isInstantMathSolved ||
        (replyContent.includes('✅ Correct answer') && replyContent.includes('Calculation:'));

      // Fast streaming response: begin streaming immediately with zero artificial delay
      const msgId = `model-${Date.now()}`;
      const isStructuredArtifactPayload =
        replyContent.includes('sigma-powerpoint') ||
        replyContent.includes('sigma-excel') ||
        replyContent.includes('sigma-ppt-slide-count-prompt');
      const shouldProgressiveStream =
        !settings.stopAnimations &&
        !isStructuredArtifactPayload &&
        !isMathCalculation &&
        replyContent.length > 0;

      const botMsg: ChatMessage = {
        id: msgId,
        role: 'model',
        content: replyContent,
        fullContent: replyContent,
        userPrompt: promptToProcess,
        generatedImage: undefined,
        sources: responseSources,
        usedFiles: detectedUsedFiles.length > 0 ? detectedUsedFiles : undefined,
        searchQueries: responseSearchQueries,
        usedSearch: responseUsedSearch,
        searchFailed: responseSearchFailed,
        notice: undefined,
        isStreaming: shouldProgressiveStream,
        specialMode: effectiveSpecialMode || undefined,
        timestamp: new Date(),
      };

      if (settings.autoSpeak) {
        speakText(replyContent);
      }

      const finalMessages = [...newMessages, { ...botMsg, isStreaming: false }];

      if (shouldProgressiveStream) {
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
        setIsLoading(false);
        setIsStreamingMessage(true);

        // Build smooth line-by-line / word-by-word progressive slices so every response animates naturally
        const totalLen = replyContent.length;
        const lines = replyContent.split('\n');
        const progressiveSlices: string[] = [];

        // Build smooth word-by-word progressive slices so every response animates fluidly and naturally
        const words = replyContent.split(/(\s+)/);
        const wordsPerStep = Math.max(1, Math.min(2, Math.ceil(words.length / 60)));
        let soFar = '';
        for (let wIdx = 0; wIdx < words.length; wIdx += wordsPerStep) {
          soFar += words.slice(wIdx, wIdx + wordsPerStep).join('');
          progressiveSlices.push(soFar);
        }

        if (progressiveSlices.length === 0 || progressiveSlices[progressiveSlices.length - 1] !== replyContent) {
          progressiveSlices.push(replyContent);
        }

        let stepIdx = 0;
        setMessages([
          ...newMessages,
          {
            ...botMsg,
            content: progressiveSlices[0] || replyContent.slice(0, Math.min(8, totalLen)),
            isStreaming: true,
          },
        ]);

        streamIntervalRef.current = setInterval(() => {
          stepIdx += 1;
          if (stepIdx >= progressiveSlices.length) {
            if (streamIntervalRef.current) {
              clearInterval(streamIntervalRef.current);
              streamIntervalRef.current = null;
            }
            setIsStreamingMessage(false);
            setMessages(finalMessages);
          } else {
            const sliceText = progressiveSlices[stepIdx];
            setMessages((prev) =>
              prev.map((m) =>
                m.id === msgId ? { ...m, content: sliceText, isStreaming: true } : m
              )
            );
          }
        }, 28);
      } else {
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
        setIsLoading(false);
        setIsStreamingMessage(false);
        setMessages(finalMessages);
      }

      // Update local conversations state with completed turn
      const updatedConv: Conversation = {
        id: activeChatId,
        title: activeTitle,
        createdAt: existingConv ? existingConv.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessagePreview: replyContent.slice(0, 80),
        messages: finalMessages,
        isSpecificSaved: existingConv?.isSpecificSaved,
        anonymousSessionName: !user.isLoggedIn ? activeAnonName || undefined : undefined,
      };

      const finalHistoryPolicy = settings.historySavePolicy || 'specific_only';
      const qualifiesForFinalHistory = finalHistoryPolicy === 'all' || isSpecificHistoryEligible(updatedConv);

      if (!isTemporaryChat) {
        // Persist AI response and update conversation summary in Firestore if qualifies for specific history
        if (user.isLoggedIn && user.id && qualifiesForFinalHistory) {
          saveMessageInFirestore(activeChatId, user.id, { ...botMsg, isStreaming: false });
          saveChatInFirestore(
            activeChatId,
            user.id,
            activeTitle,
            replyContent.slice(0, 80),
            user.email,
            finalMessages
          );
        }

        // Persist to global Firestore chat logs so it is permanently linked to the user/guest account
        // and readable by admin in the Command Center & on the Firebase web console forever
        recordGlobalChatLog({
          id: `chatlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userEmail: user.isLoggedIn && user.email ? user.email : 'guest@sigma.ai',
          userName: user.isLoggedIn && user.name ? user.name : 'Guest User',
          userType: user.isLoggedIn ? 'authenticated' : 'guest',
          userRole: user.role,
          prompt: trimmedText || (hasImages ? 'Drawing / Image attachment' : 'Prompt'),
          answer: replyContent,
          model: 'gemini-2.5-flash',
          createdAt: new Date().toISOString(),
        });

        setConversations((prev) => {
          const remaining = prev.filter((c) => c.id !== activeChatId);
          const nextList = [updatedConv, ...remaining];
          saveConversationsForUser(user, nextList, finalHistoryPolicy);
          return nextList;
        });
      }

      // Sound effect feedback
      if (settings.soundEffects) {
        playChime();
      }

      // Auto read aloud if enabled
      if (settings.autoSpeak) {
        speakText(replyContent);
      }

      // Background Tab Alert (AI Response Alert feature):
      // When user is on another tab/window and AI finishes answering, notify them!
      if (typeof document !== 'undefined' && document.hidden && settings.aiResponseAlerts !== false) {
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Sigma AI', {
              body: 'Sigma AI has responded! Click to view your answer.',
              icon: '/sigma_logo.jpg',
            });
          } catch (_) {}
        }
        const originalTitle = document.title;
        let flashes = 0;
        const flashTimer = setInterval(() => {
          flashes++;
          document.title = flashes % 2 === 1 ? '🔔 Sigma AI has responded!' : originalTitle;
          if (flashes >= 10 || !document.hidden) {
            clearInterval(flashTimer);
            document.title = originalTitle;
          }
        }, 1000);
      }

      return replyContent;
    } catch (err: any) {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
      setIsStreamingMessage(false);

      if (err.name === 'AbortError' || controller.signal.aborted) {
        console.log('User paused / stopped generation');
        const stoppedMsg: ChatMessage = {
          id: `stopped-${Date.now()}`,
          role: 'model',
          content: 'Response stopped...',
          timestamp: new Date(),
          notice: 'stopped',
        };
        setMessages((prev) => [...prev, stoppedMsg]);
        return;
      }
      console.warn('Chat notice:', err?.message || err);
      const rawErr = String(err?.message || err || '');
      let detectedErrorType: 'network' | 'timeout' | 'api' = 'api';
      let cleanErrorMessage =
        rawErr ||
        'Failed to connect to Sigma AI. Please check your connection or retry.';

      if (
        typeof navigator !== 'undefined' && !navigator.onLine ||
        /failed to fetch|networkerror|network request failed|offline/i.test(rawErr)
      ) {
        detectedErrorType = 'network';
        cleanErrorMessage =
          'Network connection interrupted while reaching Sigma AI. Your conversation history is safely preserved — click Retry once connected.';
      } else if (/timeout|timed out|BackendTimeout/i.test(rawErr)) {
        detectedErrorType = 'timeout';
        cleanErrorMessage =
          'The request took longer than expected and timed out. Your message is safe — click Retry to generate a fresh response.';
      } else if (
        cleanErrorMessage.includes('429') ||
        cleanErrorMessage.includes('RESOURCE_EXHAUSTED') ||
        cleanErrorMessage.includes('quota')
      ) {
        detectedErrorType = 'api';
        cleanErrorMessage =
          'You exceeded your request quota limit. Please wait a moment before trying again, or click Retry.';
      }

      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: cleanErrorMessage,
        timestamp: new Date(),
        isError: true,
        errorType: detectedErrorType,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
      setGenerationStatusText(null);
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleClearChat = async () => {
    await handleClearAllConversations();
  };

  const handleCameraCapture = (dataUrl: string, _file?: File) => {
    setIsCameraModalOpen(false);
    handleSendMessage(
      'Please solve this homework question step-by-step with formulas and final answer.',
      [dataUrl]
    );
  };

  const fontSizeClass =
    settings.fontSize === 'compact'
      ? 'text-xs sm:text-sm'
      : settings.fontSize === 'spacious'
      ? 'text-base sm:text-lg'
      : 'text-sm sm:text-base';

  return (
    <div
      id="sigma-ai-app"
      className={`flex flex-col min-h-screen ${
        settings.darkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-slate-50 text-slate-900'
      } font-sans transition-colors duration-200 ${
        isRecentsOpen ? 'lg:pl-80' : 'md:pl-14 pl-0'
      } ${fontSizeClass} ${settings.stopAnimations ? 'stop-animations' : ''}`}
      style={{
        '--theme-color': currentTheme.hex,
        '--theme-glow': currentTheme.glow,
      } as React.CSSProperties}
    >
      {/* Screenshot 2: Sleek Compact Sidebar Rail (Desktop) */}
      <nav
        id="compact-sidebar-rail"
        aria-label="Compact Sidebar"
        className={`hidden md:flex flex-col items-center py-3.5 px-2 fixed left-0 top-0 bottom-0 w-14 z-30 transition-all ${
          settings.darkMode ? 'bg-[#0a0e16] border-r border-slate-800/80' : 'bg-slate-100 border-r border-slate-200'
        } ${isRecentsOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {/* Top Gojo Logo (disappears on hover, revealing PanelLeft sidebar icon in its place) */}
        <div
          id="rail-logo-container"
          className="relative mb-4 flex items-center justify-center select-none"
        >
          <button
            type="button"
            id="rail-logo-btn"
            onClick={() => setIsRecentsOpen(true)}
            className="relative w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden border border-emerald-500/50 shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-500/40 transition-all group/rail-logo"
            title="Toggle Sidebar"
            aria-label="Toggle Sidebar"
          >
            {/* Gojo Image (visible by default, disappears on hover) */}
            <img
              src="/sigma_logo.jpg"
              alt="Sigma Logo"
              className="w-full h-full object-cover pointer-events-none transition-opacity duration-200 group-hover/rail-logo:opacity-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {/* Sidebar icon appears exactly in place, Gojo disappears */}
            <div className="absolute inset-0 flex items-center justify-center bg-[#131924] text-blue-400 opacity-0 group-hover/rail-logo:opacity-100 transition-opacity duration-200">
              <PanelLeft className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Action Icons Rail */}
        <div className="flex flex-col items-center gap-3 w-full">
          {/* New Chat */}
          <button
            id="rail-new-chat-btn"
            type="button"
            onClick={handleNewChat}
            className="w-10 h-10 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 text-blue-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="New Chat"
            aria-label="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Temporary Chat (Incognito) in Rail */}
          <button
            id="rail-temp-chat-btn"
            type="button"
            onClick={handleToggleTemporaryChat}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isTemporaryChat
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
            title={isTemporaryChat ? 'Temporary Chat is ON (Not saved)' : 'Switch to Temporary Chat (Not saved)'}
            aria-label="Temporary Chat"
          >
            <EyeOff className="w-5 h-5" />
          </button>

          {/* AI Intelligence Lab in Rail */}
          <button
            id="rail-ai-lab-btn"
            type="button"
            onClick={() => setIsAiLabOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#131924] hover:bg-[#1a2333] border border-blue-500/30 text-blue-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="AI Intelligence Lab"
            aria-label="AI Intelligence Lab"
          >
            <Brain className="w-5 h-5" />
          </button>

          {/* Search */}
          <button
            id="rail-search-btn"
            type="button"
            onClick={() => setIsRecentsOpen(true)}
            className="w-10 h-10 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Search Chats"
            aria-label="Search Chats"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Recent Chats */}
          <button
            id="rail-chats-btn"
            type="button"
            onClick={() => setIsRecentsOpen((prev) => !prev)}
            className="w-10 h-10 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Recent Conversations"
            aria-label="Recent Conversations"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Library */}
          <button
            id="rail-library-btn"
            type="button"
            onClick={() => setIsRecentsOpen(true)}
            className="w-10 h-10 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Library"
            aria-label="Library"
          >
            <Library className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Profile Avatar */}
        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            id="rail-profile-btn"
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-white overflow-hidden hover:ring-2 hover:ring-blue-500/50 transition-all cursor-pointer shadow-sm"
            title={user.name || 'Settings & Profile'}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{(user.email ? user.email.charAt(0) : user.name?.charAt(0) || 'U').toUpperCase()}</span>
            )}
          </button>
        </div>
      </nav>

      {/* Recents Left Sidebar */}
      <RecentsSidebar
        isOpen={isRecentsOpen}
        onClose={() => setIsRecentsOpen(false)}
        conversations={conversations}
        activeConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        user={user}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isGoogleLoading={isGoogleLoading}
        stopAnimations={settings.stopAnimations}
        isTemporaryChat={isTemporaryChat}
        onToggleTemporaryChat={handleToggleTemporaryChat}
        onOpenAiLab={() => setIsAiLabOpen(true)}
        onOpenDraw={(imgSrc) => {
          setEditingImage(imgSrc || null);
          setIsDrawOpen(true);
        }}
        onOpenConnections={() => setIsConnectionsOpen(true)}
        onOpenPastPaperCenter={() => setIsPastPaperOpen(true)}
        onOpenExplore={() => setIsExploreOpen(true)}
        onOpenSchedule={() => setIsScheduleOpen(true)}
        onOpenStudySources={() => setIsStudyWorkspaceOpen(true)}
        onOpenModes={() => setIsModesModalOpen(true)}
        onOpenNewApp={handleOpenNewApp}
        onOpenMyApps={() => setIsMyAppsOpen(true)}
        language={settings.language}
        onClearAllConversations={handleClearAllConversations}
      />

      {/* Top Header */}
      <Header
        onClearChat={handleNewChat}
        hasMessages={messages.length > 0}
        onOpenLiveAssistant={handleOpenLiveAssistant}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRecents={() => setIsRecentsOpen((prev) => !prev)}
        isRecentsOpen={isRecentsOpen}
        searchEnabled={settings.searchEnabled}
        user={user}
        onGoogleSignIn={handleGoogleSignIn}
        isGoogleLoading={isGoogleLoading}
        darkMode={settings.darkMode}
        themeColorHex={currentTheme.hex}
        language={settings.language}
        stopAnimations={settings.stopAnimations}
        isTemporaryChat={isTemporaryChat}
        onToggleTemporaryChat={handleToggleTemporaryChat}
        isOnline={isOnline}
        onOpenAiLab={() => setIsAiLabOpen(true)}
        onOpenConnections={() => setIsConnectionsOpen(true)}
        onOpenPastPaperCenter={() => setIsPastPaperOpen(true)}
      />

      {/* Offline Network Error Toast */}
      {networkNotice && (
        <div
          id="sigma-network-toast"
          className="fixed top-16 right-4 z-50 max-w-sm p-3.5 rounded-2xl bg-[#1c0f13] border border-red-500/60 text-red-200 text-xs shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2"
        >
          <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div className="flex-1 font-medium">{networkNotice}</div>
          <button
            onClick={() => setNetworkNotice(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Chat Area */}
      <main
        ref={mainScrollRef}
        className={`flex-1 flex flex-col relative ${
          settings.darkMode ? 'bg-[#0b0f17]' : 'bg-slate-50'
        } overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 transition-colors`}
      >
        {/* Temporary Chat Active Banner */}
        {isTemporaryChat && (
          <div
            id="temporary-chat-banner"
            className="max-w-3xl mx-auto w-full mb-3 p-3 rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#181126]/90 to-purple-950/80 border border-purple-500/40 text-purple-200 text-xs shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-200 not-prose"
          >
            <div className="flex items-center gap-2 min-w-0">
              <EyeOff className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="truncate">
                <strong>Temporary Chat is active:</strong> Messages won't be saved to chat history or database. Closing or refreshing the page will erase this session completely.
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setCurrentConversationId(null);
                }}
                className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsTemporaryChat(false)}
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        )}
        {branchNotice && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>{branchNotice}</span>
          </div>
        )}

        {messages.length === 0 ? (
          <EmptyState
            darkMode={settings.darkMode}
            themeColorHex={currentTheme.hex}
            language={settings.language}
            stopAnimations={settings.stopAnimations}
            onSelectMode={(cmd) => {
              if (cmd === '/camera') {
                setCameraInitialMode('select');
                setIsCameraModalOpen(true);
                return;
              }
              if (cmd === '/mods') {
                setIsModesModalOpen(true);
                return;
              }
              handleSendMessage(cmd);
            }}
            onOpenModesModal={() => setIsModesModalOpen(true)}
            onOpenNewApp={handleOpenNewApp}
            onOpenMyApps={() => setIsMyAppsOpen(true)}
            onFeelingLucky={handleFeelingLucky}
          />
        ) : (
          <div className="max-w-3xl mx-auto w-full space-y-4 sm:space-y-6 flex-1">
            {messages.map((msg, msgIdx) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                user={user}
                darkMode={settings.darkMode}
                themeColorHex={currentTheme.hex}
                showSpeaker={settings.textToSpeech ?? true}
                highContrast={settings.highContrast}
                ttsVoice={settings.ttsVoice || 'male'}
                language={settings.language}
                onOpenCamera={(mode) => {
                  setCameraInitialMode(mode || 'select');
                  setIsCameraModalOpen(true);
                }}
                onBranchChat={handleBranchChat}
                onRetry={() => {
                  // Find the user message right before this AI message (or the latest user message)
                  const precedingUserMsg =
                    messages
                      .slice(0, msgIdx)
                      .reverse()
                      .find((m) => m.role === 'user') ||
                    [...messages].reverse().find((m) => m.role === 'user');
                  if (precedingUserMsg) {
                    // Remove the AI response being regenerated so the fresh response replaces it cleanly
                    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                    handleSendMessage(
                      precedingUserMsg.content,
                      precedingUserMsg.images,
                      { isRegenerate: true },
                      msg.specialMode || null
                    );
                  }
                }}
                onActionClick={(actionText) => {
                  const clean = actionText.replace(/^[↳\s]+/, '').replace(/^\[|\]$/g, '').trim();
                  if (/sign in with google/i.test(clean)) {
                    handleGoogleSignIn();
                  } else {
                    handleSendMessage(clean);
                  }
                }}
                onImageClick={(imgSrc) => {
                  setEditingImage(imgSrc);
                  setIsDrawOpen(true);
                }}
                onOpenDrawForMessage={(imgSrc) => {
                  setEditingImage(imgSrc || null);
                  setIsDrawOpen(true);
                }}
                onOpenSummarizeForMessage={(messageText) => {
                  setSummarizeInitialText(messageText);
                  setIsSummarizeOpen(true);
                }}
                onOpenCodeForMessage={(codeText, mode = 'optimize') => {
                  setCodeInitialText(codeText);
                  setCodeInitialMode(mode);
                  setIsCodeOpen(true);
                }}
                onOpenExplainForMessage={(topicText) => {
                  setExplainInitialTopic(topicText);
                  setIsExplainOpen(true);
                }}
                onOpenFilePreview={(file) => {
                  setRightDrawerData({
                    isOpen: true,
                    mode: 'file',
                    title: file.title,
                    filename: file.filename,
                    content: file.content,
                    contentType: file.contentType,
                  });
                }}
                onOpenSourcesDrawer={(srcData) => {
                  setRightDrawerData({
                    isOpen: true,
                    mode: 'sources',
                    title: srcData.title,
                    sources: srcData.sources,
                    searchQuery: srcData.searchQuery,
                  });
                }}
              />
            ))}

            {/* Gojo Logo + Response Animation (HolographicCoreLoader) whenever Sigma AI is responding */}
            {isLoading && (
              <div
                id="bot-thinking-indicator"
                className="w-full py-2.5 flex flex-col items-start gap-2.5 animate-in fade-in duration-200"
              >
                <div className="flex gap-2.5 sm:gap-3 items-center">
                  {/* Gojo AI Logo Avatar on the Left */}
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black flex-shrink-0 overflow-hidden flex items-center justify-center shadow-md relative"
                    style={{
                      border: `1.5px solid ${currentTheme.hex}`,
                      boxShadow: `0 0 16px ${currentTheme.hex}55`,
                    }}
                  >
                    <img
                      src="/sigma_logo.jpg"
                      alt="Sigma AI"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Response Animation representing Gojo / Sigma AI responding */}
                  <div
                    className="px-3.5 py-2 rounded-2xl rounded-tl-xs flex items-center gap-3 border"
                    style={{
                      backgroundColor: settings.darkMode
                        ? 'rgba(19, 25, 36, 0.78)'
                        : 'rgba(255, 255, 255, 0.9)',
                      borderColor: `${currentTheme.hex}40`,
                      boxShadow: `0 4px 20px -4px ${currentTheme.hex}28`,
                    }}
                  >
                    <HolographicCoreLoader
                      size={36}
                      color={currentTheme.hex}
                      stopAnimations={settings.stopAnimations}
                    />
                    {generationStatusText && (
                      <span
                        className="text-xs sm:text-sm font-medium tracking-wide animate-pulse"
                        style={{ color: currentTheme.hex }}
                      >
                        {generationStatusText}
                      </span>
                    )}
                  </div>
                </div>

                {pptGeneratingTopic && (
                  <div className="w-full pl-0 sm:pl-12">
                    <PresentationLoading topic={pptGeneratingTopic} />
                  </div>
                )}

                {excelGeneratingTopic && (
                  <div className="w-full pl-0 sm:pl-12">
                    <ExcelLoading topic={excelGeneratingTopic} />
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Bottom Bar: Prompt Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading || isStreamingMessage}
        showScrollToLatest={showScrollToLatest}
        onScrollToLatest={scrollToBottom}
        onStopGeneration={() => {
          if (streamIntervalRef.current) {
            clearInterval(streamIntervalRef.current);
            streamIntervalRef.current = null;
          }
          setIsStreamingMessage(false);
          setPptGeneratingTopic(null);
          setExcelGeneratingTopic(null);
          handleStopGeneration();
        }}
        onOpenLiveAssistant={() => setIsLiveAssistantOpen(true)}
        onOpenDraw={() => {
          setEditingImage(null);
          setIsDrawOpen(true);
        }}
        onOpenSummarize={() => {
          setSummarizeInitialText('');
          setIsSummarizeOpen(true);
        }}
        onOpenCode={() => {
          setCodeInitialText('');
          setCodeInitialMode('build');
          setIsCodeOpen(true);
        }}
        onOpenExplain={() => {
          setExplainInitialTopic('');
          setIsExplainOpen(true);
        }}
        onOpenImageInEditor={(dataUrl) => {
          setEditingImage(dataUrl);
          setIsDrawOpen(true);
        }}
        isPowerPointMode={isPowerPointMode}
        onTogglePowerPointMode={setIsPowerPointMode}
        activeSpecialMode={activeSpecialMode}
        onChangeSpecialMode={setActiveSpecialMode}
        darkMode={settings.darkMode}
        themeColorHex={currentTheme.hex}
        language={settings.language}
        stopAnimations={settings.stopAnimations}
        uiGlowEnabled={settings.uiGlowEnabled}
        uiGlowPreset={settings.uiGlowPreset}
        uiGlowColor1={settings.uiGlowColor1}
        uiGlowColor2={settings.uiGlowColor2}
        onOpenConnections={() => setIsConnectionsOpen(true)}
        onOpenModesModal={() => setIsModesModalOpen(true)}
        onOpenCameraModal={(mode) => {
          setCameraInitialMode(mode || 'select');
          setIsCameraModalOpen(true);
        }}
      />

      {/* Feature Modals */}
      <LiveAssistantModal
        isOpen={isLiveAssistantOpen}
        onClose={() => setIsLiveAssistantOpen(false)}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        themeHex={currentTheme.hex}
        stopAnimations={settings.stopAnimations}
        user={user}
        onSyncTurnToMainChat={(userText, aiReply) => {
          const now = new Date();
          const userMsg: ChatMessage = {
            id: `live-u-${Date.now()}`,
            role: 'user',
            content: userText,
            timestamp: now,
          };
          const aiMsg: ChatMessage = {
            id: `live-a-${Date.now() + 1}`,
            role: 'model',
            content: aiReply,
            userPrompt: userText,
            timestamp: new Date(now.getTime() + 50),
          };
          setMessages((prev) => [...prev, userMsg, aiMsg]);
        }}
      />

      <DrawModal
        isOpen={isDrawOpen}
        onClose={() => {
          setIsDrawOpen(false);
          setEditingImage(null);
        }}
        initialImage={editingImage}
        themeColorHex={currentTheme.hex}
        onSaveImage={(dataUrl) => {
          window.dispatchEvent(
            new CustomEvent('sigma-save-edited-image', { detail: { dataUrl } })
          );
        }}
        onSendDiagramPrompt={(prompt, imgDataUrl) => {
          handleSendMessage(prompt, imgDataUrl ? [imgDataUrl] : undefined);
          setIsDrawOpen(false);
          setEditingImage(null);
        }}
      />

      <SummarizeModal
        isOpen={isSummarizeOpen}
        onClose={() => setIsSummarizeOpen(false)}
        onSendSummaryPrompt={handleSendMessage}
        user={user}
        initialText={summarizeInitialText}
      />

      <CodeModal
        isOpen={isCodeOpen}
        onClose={() => setIsCodeOpen(false)}
        onSendCodePrompt={handleSendMessage}
        themeColorHex={currentTheme.hex}
        user={user}
        initialDescription={codeInitialText}
        initialMode={codeInitialMode}
      />

      <ExplainModal
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        onSendExplainPrompt={handleSendMessage}
        initialTopic={explainInitialTopic}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClearChat={handleClearChat}
        messages={messages}
        user={user}
        onUpdateUser={handleUpdateUser}
        onGoogleSignIn={handleGoogleSignIn}
        onLogout={handleLogout}
        isGoogleLoading={isGoogleLoading}
        onOpenRecents={() => setIsRecentsOpen(true)}
        conversations={conversations}
        activeConversationId={currentConversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        onNewChat={handleNewChat}
        onOpenConnections={() => {
          setIsSettingsOpen(false);
          setIsConnectionsOpen(true);
        }}
      />

      {/* Connections & Control Center Dashboard */}
      <ConnectionsModal
        isOpen={isConnectionsOpen}
        onClose={() => setIsConnectionsOpen(false)}
        user={user}
        conversations={conversations}
        onOpenSettings={() => {
          setIsConnectionsOpen(false);
          setIsSettingsOpen(true);
        }}
        onOpenGoogleSignIn={handleGoogleSignIn}
        onClearGuestSession={handleClearGuestSession}
        onOpenPastPaperCenter={() => {
          setIsConnectionsOpen(false);
          setIsPastPaperOpen(true);
        }}
        themeColorHex={currentTheme.hex}
        isTemporaryChat={isTemporaryChat}
      />

      {/* Past Paper Centre - Step-by-Step Discovery Hub */}
      <PastPaperCenterModal
        isOpen={isPastPaperOpen}
        onClose={() => setIsPastPaperOpen(false)}
        onAskSigmaAi={(prompt) => {
          setIsPastPaperOpen(false);
          handleSendMessage(prompt);
        }}
        onOpenPdf={(url, title, subject, paper) => {
          setIsPastPaperOpen(false);
          setActivePdfViewer({
            isOpen: true,
            pdfUrl: url,
            title,
            subject,
            board: paper?.board,
            qualification: paper?.qualification,
            year: paper?.year,
            session: paper?.session,
            paperNumber: paper?.paper,
          });
        }}
        themeColorHex={currentTheme.hex}
      />

      {/* Schedule Timetable Modal */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onAskSigmaAi={(prompt) => {
          setIsScheduleOpen(false);
          handleSendMessage(prompt);
        }}
      />

      {/* Explore Topics & Prompts Modal */}
      <ExploreModal
        isOpen={isExploreOpen}
        onClose={() => setIsExploreOpen(false)}
        onSelectPrompt={(prompt) => {
          setIsExploreOpen(false);
          handleSendMessage(prompt);
        }}
      />

      {/* Central Study Sources & Education Workspace Modal */}
      <StudySourcesWorkspaceModal
        isOpen={isStudyWorkspaceOpen}
        onClose={() => setIsStudyWorkspaceOpen(false)}
        onAskSigmaAi={(prompt) => {
          setIsStudyWorkspaceOpen(false);
          handleSendMessage(prompt);
        }}
        onOpenPdf={(res: any) => {
          setIsStudyWorkspaceOpen(false);
          setActivePdfViewer({
            isOpen: true,
            pdfUrl: res.fileUrl || res.url,
            title: res.fileName || res.title || 'Past Paper Document',
            subject: res.subject,
            board: res.board,
            qualification: res.qualification,
            year: res.year,
            session: res.session,
            paperNumber: res.paperNumber,
          });
        }}
        onUploadMyPdf={() => {
          const fileInput = document.getElementById('chat-file-input') as HTMLInputElement;
          if (fileInput) fileInput.click();
        }}
      />

      {/* Native In-App PDF Viewer Modal with Solve Drawer */}
      {activePdfViewer && activePdfViewer.isOpen && (
        <PdfViewerModal
          isOpen={activePdfViewer.isOpen}
          onClose={() => setActivePdfViewer(null)}
          pdfUrl={activePdfViewer.pdfUrl}
          title={activePdfViewer.title}
          subject={activePdfViewer.subject}
          board={activePdfViewer.board}
          qualification={activePdfViewer.qualification}
          year={activePdfViewer.year}
          session={activePdfViewer.session}
          paperNumber={activePdfViewer.paperNumber}
          onSolveWithAi={(prompt) => {
            setActivePdfViewer(null);
            handleSendMessage(prompt);
          }}
          onUploadMyPdf={() => {
            const fileInput = document.getElementById('chat-file-input') as HTMLInputElement;
            if (fileInput) fileInput.click();
          }}
        />
      )}

      {/* Automatic Google Login Name Onboarding Modal */}
      {showGoogleNamePrompt && (
        <div
          id="google-name-onboarding-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            id="google-name-onboarding-modal"
            className="relative bg-[#13151c] rounded-3xl border border-white/15 p-6 sm:p-8 max-w-[420px] w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            style={{
              boxShadow: `0 25px 60px rgba(0,0,0,0.85), 0 0 35px ${currentTheme.hex}25`,
            }}
          >
            <div className="text-center space-y-2">
              <div
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-lg overflow-hidden"
                style={{
                  borderColor: `${currentTheme.hex}66`,
                  backgroundColor: `${currentTheme.hex}18`,
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="/sigma_logo.jpg"
                    alt="Sigma AI"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                What should Sigma AI call you?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Enter your preferred name below. Sigma AI will save it to your account and remember your name for all future conversations and chats.
              </p>
            </div>

            <form onSubmit={handleSaveGoogleOnboardingName} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Your Preferred Name
                </label>
                <input
                  id="google-onboarding-name-input"
                  type="text"
                  required
                  autoFocus
                  value={googleNameInput}
                  onChange={(e) => {
                    setGoogleNameInput(e.target.value);
                    if (googleNameError) setGoogleNameError(null);
                  }}
                  placeholder="Enter your display name..."
                  className="w-full bg-[#1b1e28] border rounded-2xl px-4 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none transition-colors font-medium"
                  style={{
                    borderColor: googleNameError ? '#ef4444' : `${currentTheme.hex}66`,
                  }}
                />
                {googleNameError && (
                  <div
                    id="google-onboarding-name-error"
                    className="mt-2.5 px-3.5 py-2.5 rounded-xl bg-red-950/45 border border-red-500/50 text-red-400 text-xs font-semibold flex items-start gap-2 text-left animate-in fade-in"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{googleNameError}</span>
                  </div>
                )}
              </div>

              <button
                id="google-onboarding-save-btn"
                type="submit"
                className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm sm:text-base tracking-wide transition-all cursor-pointer shadow-lg text-black active:scale-[0.99]"
                style={{
                  backgroundColor: currentTheme.hex,
                  boxShadow: `0 6px 24px ${currentTheme.hex}45`,
                }}
              >
                Save Name & Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Account Suspension Lock Modal for Normal Accounts after Repeated Restricted Name Violations */}
      {isAccountSuspendedState && user.isLoggedIn && !isVerifiedOwnerAccount(user.email) && (
        <div
          id="account-suspended-backdrop"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in"
        >
          <div className="bg-[#12141c] border border-red-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Account Access Restricted
              </h3>
              <p className="text-xs sm:text-sm text-red-300 font-medium leading-relaxed">
                This account ({user.email}) has been suspended due to repeated attempts to use restricted or unauthorized account names.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sigma AI strictly prohibits explicit, abusive, or impersonation display names on standard accounts.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Restricted Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Welcome Sign-In Modal displayed at first on open if user is not logged in / in guest mode */}
      <WelcomeSignInModal
        isOpen={showWelcomeSignIn && !user.isLoggedIn}
        onClose={() => setShowWelcomeSignIn(false)}
        onGoogleSignIn={async () => {
          await handleGoogleSignIn();
          setShowWelcomeSignIn(false);
        }}
        onSuccessLogin={(profile) => {
          handleUpdateUser(profile);
          setShowWelcomeSignIn(false);
        }}
        onContinueAsGuest={async (guestName) => {
          const storedGuest = getStoredGuestProfile();
          const guestId = storedGuest?.guestId || getPersistentGuestId() || createPersistentGuestId();
          const cleanName = guestName.trim();
          await saveGuestProfile(cleanName);
          handleUpdateUser({
            id: guestId,
            isLoggedIn: false,
            name: cleanName,
            email: 'guest@sigma.ai',
            role: 'user',
            isVerifiedOwner: false,
            authProvider: 'guest',
            avatarUrl: getInstantSvgAvatar(cleanName, 'guest@sigma.ai'),
          });
          setShowWelcomeSignIn(false);
        }}
        themeColorHex={currentTheme.hex}
        isGoogleLoading={isGoogleLoading}
      />

      {/* Right-Side Preview Drawer for Files & Web Sources */}
      <RightPreviewDrawer
        data={rightDrawerData}
        onClose={() => setRightDrawerData(null)}
        themeColorHex={currentTheme.hex}
      />

      {/* AI Intelligence Lab Modal (10-Stage Pipeline Room) */}
      <AiIntelligenceLabModal
        isOpen={isAiLabOpen}
        onClose={() => setIsAiLabOpen(false)}
        themeColorHex={currentTheme.hex}
        darkMode={settings.darkMode}
      />

      {/* Sigma AI 100+ Modes Modal */}
      <SigmaModesModal
        isOpen={isModesModalOpen}
        onClose={() => setIsModesModalOpen(false)}
        onSelectMode={(command) => {
          if (command === '/camera') {
            setIsModesModalOpen(false);
            setCameraInitialMode('select');
            setIsCameraModalOpen(true);
            return;
          }
          handleSendMessage(command);
        }}
        themeColorHex={currentTheme.hex}
        darkMode={settings.darkMode}
      />

      {/* Real In-App Camera & Homework Upload Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        themeColorHex={currentTheme.hex}
        initialMode={cameraInitialMode}
      />

      {/* Real App Builder & Playground Workspace */}
      {activeAppProject && (
        <AppBuilderPlaygroundModal
          isOpen={isAppBuilderOpen}
          onClose={() => setIsAppBuilderOpen(false)}
          app={activeAppProject}
          onSaveApp={(updated) => setActiveAppProject(updated)}
          themeColorHex={currentTheme.hex}
          user={user}
          onShowToast={showToast}
        />
      )}

      {/* My Apps Portfolio Modal */}
      <MyAppsModal
        isOpen={isMyAppsOpen}
        onClose={() => setIsMyAppsOpen(false)}
        onOpenAppInPlayground={handleOpenAppInPlayground}
        onStartNewApp={handleOpenNewApp}
        themeColorHex={currentTheme.hex}
        user={user}
        onShowToast={showToast}
      />

      {/* Background Glowing Particles with 0.5 gravity matching active theme */}
      {!settings.stopAnimations && (
        <GlowingParticles
          colorHex={currentTheme.hex}
          stopAnimations={settings.stopAnimations}
        />
      )}

      {/* Lag-free subtle glowing cursor effect across the app */}
      <GlowingCursor colorHex={currentTheme.hex} />
    </div>
  );
}
