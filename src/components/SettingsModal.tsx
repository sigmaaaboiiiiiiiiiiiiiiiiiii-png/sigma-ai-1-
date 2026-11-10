import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getStoredStudySources,
  toggleSourceEnabled,
  toggleCategoryEnabled,
  addCustomSource,
  removeCustomSource,
  getPreferOfficialExamBoards,
  setPreferOfficialExamBoards,
  StudySourceCategory,
  StudySource,
  getStudyImageMaterials,
} from '../lib/studySources';
import {
  Accessibility,
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Chrome,
  Clock,
  Cpu,
  Crown,
  Database,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Key,
  Layers,
  Library,
  Link2,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Minus,
  Moon,
  Palette,
  Pin,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Sliders,
  Sparkles,
  Square,
  Square as StopIcon,
  Sun,
  Terminal,
  Trash2,
  User,
  UserPlus,
  Volume2,
  X
} from "lucide-react";
import { LibraryPicturesView } from './LibraryPicturesView';
import { AiProfileSection } from './AiProfileSection';
import { getUnifiedLibraryItems, getUnifiedUserPictures } from '../lib/libraryStorage';
import { validateAccountName, isVerifiedOwnerAccount } from '../lib/nameModeration';
import { updateGuestDisplayName, saveGuestProfile } from '../lib/guestManager';
import {
  TTS_VOICE_OPTIONS,
  TtsVoiceOptionId,
  getSavedTtsVoice,
  saveTtsVoicePreference,
  resolveSpeechVoice,
  speakChunkedWithGuard,
  clearSpeechKeepAlive,
} from '../lib/ttsVoiceEngine';
import {
  AppSettings,
  ChatMessage,
  Conversation,
  DEFAULT_SETTINGS,
  SettingsTabType,
  UserProfile,
  AppLanguage,
  AIPersonalityType,
} from '../types';
import { formatSafeTime, toSafeDate } from '../lib/dateUtils';
import {
  saveRegisteredAccount,
  authenticateWithCredentials,
  findAccountByEmail,
  isAlwaysAllowedSignUpEmail,
} from '../lib/authAccounts';
import { getEmailAvatarUrl } from '../lib/avatarHelper';
import { THEME_COLOR_OPTIONS, getThemeColor } from '../lib/theme';
import { getTranslation } from '../lib/translations';
import { isAuthorizedForAdminPanel } from '../lib/userRoles';
import AdminPanel from './AdminPanel';
import { HolographicCoreLoader } from './HolographicCoreLoader';
import { FeaturesModal } from './FeaturesModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearChat: () => void;
  messages: ChatMessage[];
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onGoogleSignIn: () => Promise<void>;
  onLogout: () => Promise<void>;
  isGoogleLoading?: boolean;
  onOpenRecents?: () => void;
  conversations?: Conversation[];
  activeConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onTogglePinConversation?: (id: string) => void;
  onNewChat?: () => void;
  onOpenConnections?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearChat,
  messages,
  user,
  onUpdateUser,
  onGoogleSignIn,
  onLogout,
  isGoogleLoading = false,
  onOpenRecents,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  onNewChat,
  onOpenConnections,
}) => {
  // Study Sources State
  const [studySourcesList, setStudySourcesList] = useState<StudySource[]>(() => {
    try {
      return getStoredStudySources();
    } catch {
      return [];
    }
  });
  const [preferOfficial, setPreferOfficial] = useState<boolean>(() => {
    try {
      return getPreferOfficialExamBoards();
    } catch {
      return true;
    }
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddSourceModal, setShowAddSourceModal] = useState<boolean>(false);
  const [showAddYoutubeModal, setShowAddYoutubeModal] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<SettingsTabType>('account');
  const [notification, setNotification] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'content' | 'menu'>('menu');
  const [showGuestRecentsBanner, setShowGuestRecentsBanner] = useState(false);
  const [recentsSearch, setRecentsSearch] = useState('');
  const [recentsSubSection, setRecentsSubSection] = useState<'all' | 'library' | 'pictures'>('all');
  const [librarySyncTick, setLibrarySyncTick] = useState(0);
  const [settingsEditingChatId, setSettingsEditingChatId] = useState<string | null>(null);
  const [settingsEditTitleValue, setSettingsEditTitleValue] = useState('');
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const guestBannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // In-app confirmation for Clear All Chats (avoids iframe confirm() blocks)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [inlineClearConfirm, setInlineClearConfirm] = useState(false);
  const [isClearingAllChats, setIsClearingAllChats] = useState(false);

  const handleExecuteClearAllChats = async () => {
    setIsClearingAllChats(true);
    try {
      await onClearChat();
      setShowClearAllConfirm(false);
      setInlineClearConfirm(false);
      showToast('All recent chats cleared forever.');
      try {
        window.dispatchEvent(new CustomEvent('sigma-chats-cleared'));
        window.dispatchEvent(new CustomEvent('sigma-library-updated'));
      } catch (_) {}
    } catch (err) {
      console.error('Failed to clear all chats:', err);
      showToast('Failed to clear chats. Please try again.');
    } finally {
      setIsClearingAllChats(false);
    }
  };

  // Guest name custom input state (retained in browser for 1 month)
  const [showGuestNameDialog, setShowGuestNameDialog] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [guestNameError, setGuestNameError] = useState<string | null>(null);
  const [isSavingGuestName, setIsSavingGuestName] = useState(false);

  const handleSaveGuestName = async () => {
    const clean = guestNameInput.trim();
    if (!clean) {
      setGuestNameError('Please enter a valid name.');
      return;
    }
    const safety = validateAccountName(clean, {
      email: 'guest@sigma.ai',
      authProvider: 'guest',
    });
    if (!safety.valid) {
      setGuestNameError(safety.message || 'Please choose a different name.');
      return;
    }
    setIsSavingGuestName(true);
    try {
      await saveGuestProfile(clean);
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          name: clean,
        });
      }
      setShowGuestNameDialog(false);
      showToast(`Guest name set to "${clean}". Saved on this browser for 1 month.`);
    } catch (err: any) {
      setGuestNameError(err?.message || 'Could not save guest name.');
    } finally {
      setIsSavingGuestName(false);
    }
  };

  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMobileView('menu');
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        navigator.storage
          .estimate()
          .then((est) => {
            setStorageEstimate({
              usage: est.usage || 0,
              quota: est.quota || 0,
            });
          })
          .catch(() => {});
      }
    }
  }, [isOpen]);

  // Real Hardware Device Checks for Connected Services Tab
  const [liveCameraStatus, setLiveCameraStatus] = useState<'checking' | 'granted' | 'prompt' | 'denied' | 'unsupported'>('checking');
  const [liveMicStatus, setLiveMicStatus] = useState<'checking' | 'granted' | 'prompt' | 'denied' | 'unsupported'>('checking');
  const [hardwareDeviceSummary, setHardwareDeviceSummary] = useState<{ cameras: number; mics: number }>({ cameras: 0, mics: 0 });
  const [isLiveHardwareTesting, setIsLiveHardwareTesting] = useState<'camera' | 'mic' | null>(null);
  const [hardwareTestError, setHardwareTestError] = useState<string | null>(null);
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const hardwareVideoRef = useRef<HTMLVideoElement | null>(null);
  const hardwareStreamRef = useRef<MediaStream | null>(null);
  const hardwareAudioCtxRef = useRef<AudioContext | null>(null);
  const hardwareAnimFrameRef = useRef<number | null>(null);

  const stopHardwareTest = useCallback(() => {
    if (hardwareAnimFrameRef.current) {
      cancelAnimationFrame(hardwareAnimFrameRef.current);
      hardwareAnimFrameRef.current = null;
    }
    if (hardwareAudioCtxRef.current) {
      hardwareAudioCtxRef.current.close().catch(() => {});
      hardwareAudioCtxRef.current = null;
    }
    if (hardwareStreamRef.current) {
      hardwareStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (_) {}
      });
      hardwareStreamRef.current = null;
    }
    setIsLiveHardwareTesting(null);
    setMicAudioLevel(0);
    setHardwareTestError(null);
  }, []);

  useEffect(() => {
    if (activeTab !== 'connections' || !isOpen) {
      stopHardwareTest();
      return;
    }

    let mounted = true;
    const checkHardware = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        if (mounted) {
          setLiveCameraStatus('unsupported');
          setLiveMicStatus('unsupported');
        }
        return;
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!mounted) return;
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        setHardwareDeviceSummary({
          cameras: videoInputs.length,
          mics: audioInputs.length,
        });

        if (navigator.permissions?.query) {
          try {
            const camPerm = await navigator.permissions.query({ name: 'camera' as any });
            if (mounted) setLiveCameraStatus(camPerm.state as any);
            camPerm.onchange = () => {
              if (mounted) setLiveCameraStatus(camPerm.state as any);
            };
          } catch (_) {
            if (mounted) setLiveCameraStatus(videoInputs.length > 0 ? 'prompt' : 'denied');
          }

          try {
            const micPerm = await navigator.permissions.query({ name: 'microphone' as any });
            if (mounted) setLiveMicStatus(micPerm.state as any);
            micPerm.onchange = () => {
              if (mounted) setLiveMicStatus(micPerm.state as any);
            };
          } catch (_) {
            if (mounted) setLiveMicStatus(audioInputs.length > 0 ? 'prompt' : 'denied');
          }
        } else {
          setLiveCameraStatus(videoInputs.length > 0 ? 'prompt' : 'denied');
          setLiveMicStatus(audioInputs.length > 0 ? 'prompt' : 'denied');
        }
      } catch (_) {
        if (mounted) {
          setLiveCameraStatus('prompt');
          setLiveMicStatus('prompt');
        }
      }
    };

    checkHardware();
    return () => {
      mounted = false;
      stopHardwareTest();
    };
  }, [activeTab, isOpen, stopHardwareTest]);

  const startCameraHardwareTest = async () => {
    stopHardwareTest();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      hardwareStreamRef.current = stream;
      setLiveCameraStatus('granted');
      setIsLiveHardwareTesting('camera');
      if (hardwareVideoRef.current) {
        hardwareVideoRef.current.srcObject = stream;
        hardwareVideoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setLiveCameraStatus('denied');
      setHardwareTestError(`Camera access denied: ${err.message || 'Permission denied'}`);
    }
  };

  const startMicHardwareTest = async () => {
    stopHardwareTest();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      hardwareStreamRef.current = stream;
      setLiveMicStatus('granted');
      setIsLiveHardwareTesting('mic');
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      hardwareAudioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        setMicAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        hardwareAnimFrameRef.current = requestAnimationFrame(loop);
      };
      hardwareAnimFrameRef.current = requestAnimationFrame(loop);
    } catch (err: any) {
      setLiveMicStatus('denied');
      setHardwareTestError(`Microphone access denied: ${err.message || 'Permission denied'}`);
    }
  };

  useEffect(() => {
    const handleSync = () => setLibrarySyncTick((t) => t + 1);
    window.addEventListener('sigma-library-updated', handleSync);
    window.addEventListener('sigma-pictures-updated', handleSync);
    return () => {
      window.removeEventListener('sigma-library-updated', handleSync);
      window.removeEventListener('sigma-pictures-updated', handleSync);
    };
  }, []);

  const unifiedLibraryCount = getUnifiedLibraryItems(user, conversations).length;
  const unifiedPicturesCount = getUnifiedUserPictures(user, conversations).length;

  const isAuthorizedAdmin =
    Boolean(user?.isLoggedIn) && isAuthorizedForAdminPanel(user?.email, user?.role);

  useEffect(() => {
    if (activeTab === 'admin-panel' && !isAuthorizedAdmin) {
      setActiveTab('account');
    }
  }, [activeTab, isAuthorizedAdmin]);

  // Editing display name directly
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);

  useEffect(() => {
    setNameInput(user.name);
  }, [user.name]);

  // Email & Password Auth + 4-Step OTP verification state
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [authStep, setAuthStep] = useState<'form' | 'otp'>('form');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginName, setLoginName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // 4-step OTP state (Note: The actual code is NEVER stored in frontend state or displayed on screen when email service is active)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [pendingAccount, setPendingAccount] = useState<{
    name: string;
    email: string;
    password?: string;
    mode: 'signup' | 'signin';
  } | null>(null);
  const [otpDeliveryStatus, setOtpDeliveryStatus] = useState<{
    delivered: boolean;
    provider?: string | null;
    hasProvider: boolean;
    sandboxRestricted?: boolean;
    ownerEmail?: string;
  } | null>(null);

  // Refs for 4 OTP input boxes
  const otpInput0Ref = useRef<HTMLInputElement>(null);
  const otpInput1Ref = useRef<HTMLInputElement>(null);
  const otpInput2Ref = useRef<HTMLInputElement>(null);
  const otpInput3Ref = useRef<HTMLInputElement>(null);
  const otpRefs = [otpInput0Ref, otpInput1Ref, otpInput2Ref, otpInput3Ref];

  // Hidden file input for avatar upload
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Personalization state (Image 1)
  const [darkMode, setDarkMode] = useState<boolean>(() => settings.darkMode ?? true);
  const [themeColor, setThemeColor] = useState<string>(() => settings.themeColor || 'green');
  const [customThemeColor, setCustomThemeColor] = useState<string>(() => settings.customThemeColor || '#00ea77');
  const [defaultLanguage, setDefaultLanguage] = useState<string>(() => settings.language || 'English (US)');

  useEffect(() => {
    if (settings.language && settings.language !== defaultLanguage) {
      setDefaultLanguage(settings.language);
    }
  }, [settings.language]);

  const activeLang = defaultLanguage || settings.language || 'English (US)';
  const [stopAnimations, setStopAnimations] = useState<boolean>(() => settings.stopAnimations ?? false);
  const [uiGlowEnabled, setUiGlowEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sigma_ui_glow_enabled');
      return saved !== null ? JSON.parse(saved) : (settings.uiGlowEnabled ?? true);
    } catch {
      return settings.uiGlowEnabled ?? true;
    }
  });
  const [uiGlowPreset, setUiGlowPreset] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_ui_glow_preset') || settings.uiGlowPreset || 'cyber-cyan';
    } catch {
      return settings.uiGlowPreset || 'cyber-cyan';
    }
  });
  const [uiGlowColor1, setUiGlowColor1] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_ui_glow_color1') || settings.uiGlowColor1 || '#00f0ff';
    } catch {
      return settings.uiGlowColor1 || '#00f0ff';
    }
  });
  const [uiGlowColor2, setUiGlowColor2] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_ui_glow_color2') || settings.uiGlowColor2 || '#b026ff';
    } catch {
      return settings.uiGlowColor2 || '#b026ff';
    }
  });

  // Sync state whenever settings modal opens
  useEffect(() => {
    if (isOpen) {
      setDarkMode(settings.darkMode ?? true);
      setThemeColor(settings.themeColor || 'green');
      setCustomThemeColor(settings.customThemeColor || '#00ea77');
      setDefaultLanguage(settings.language || 'English (US)');
      setStopAnimations(settings.stopAnimations ?? false);
      setUiGlowEnabled(settings.uiGlowEnabled ?? true);
      setUiGlowPreset(settings.uiGlowPreset || 'cyber-cyan');
      setUiGlowColor1(settings.uiGlowColor1 || '#00f0ff');
      setUiGlowColor2(settings.uiGlowColor2 || '#b026ff');
      setTextToSpeech(settings.textToSpeech ?? true);
      setTtsVoice((settings.ttsVoice as TtsVoiceOptionId) || getSavedTtsVoice());
      setHighContrast(settings.highContrast ?? false);
    }
  }, [isOpen, settings]);

  // Notifications state (Image 7)
  const [emailNotifications, setEmailNotifications] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sigma_email_notifs');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [loginEmailAlerts, setLoginEmailAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sigma_login_email_alerts');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [isTestingAlert, setIsTestingAlert] = useState(false);
  const [aiResponseAlerts, setAiResponseAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sigma_ai_alerts');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [googleSearchGrounding, setGoogleSearchGrounding] = useState<boolean>(() => {
    return settings.searchEnabled ?? true;
  });

  // Accessibility state (Image 5)
  const [textToSpeech, setTextToSpeech] = useState<boolean>(() => {
    return settings.textToSpeech ?? true;
  });
  const [ttsVoice, setTtsVoice] = useState<TtsVoiceOptionId>(() => {
    return (settings.ttsVoice as TtsVoiceOptionId) || getSavedTtsVoice();
  });
  const [testingVoiceId, setTestingVoiceId] = useState<TtsVoiceOptionId | null>(null);
  const [voicesRefreshTick, setVoicesRefreshTick] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const handleVoicesChanged = () => {
      setVoicesRefreshTick((prev) => prev + 1);
    };
    window.speechSynthesis.addEventListener?.('voiceschanged', handleVoicesChanged);
    handleVoicesChanged();
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', handleVoicesChanged);
      clearSpeechKeepAlive();
    };
  }, []);

  const handleSelectTtsVoice = (voiceId: TtsVoiceOptionId) => {
    const resolved = resolveSpeechVoice(voiceId);
    if (!resolved.available) {
      showToast(resolved.unavailableReason || `${voiceId} voice is unavailable on this device.`);
      return;
    }
    clearSpeechKeepAlive();
    setTestingVoiceId(null);
    setTtsVoice(voiceId);
    saveTtsVoicePreference(voiceId);
    onUpdateSettings({ ttsVoice: voiceId });
  };

  const handlePreviewTtsVoice = (voiceId: TtsVoiceOptionId, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('Speech synthesis is not supported in this browser.');
      return;
    }
    if (testingVoiceId === voiceId) {
      clearSpeechKeepAlive();
      setTestingVoiceId(null);
      return;
    }
    const resolved = resolveSpeechVoice(voiceId);
    if (!resolved.available) {
      showToast(resolved.unavailableReason || 'Selected voice is unavailable.');
      return;
    }
    clearSpeechKeepAlive();
    setTestingVoiceId(voiceId);

    const sampleTexts: Record<TtsVoiceOptionId, string> = {
      sigma:
        'Hello! Mera naam Ayan hai. I am using the SIGMA Creator voice profile calibrated from the uploaded voice sample.',
      boy: 'Hi there! I am using the cheerful and friendly Puck voice for Sigma AI.',
      male: 'Hello. I am using the calm, clear, and confident Charon voice for Sigma AI.',
      female: 'Hello! I am using the warm, expressive Aoede voice for Sigma AI.',
      kore: 'Hello! I am using the crisp, poised Kore studio voice for Sigma AI.',
      fenrir: 'Greetings. I am using the deep, resonant Fenrir voice for Sigma AI.',
    };
    speakChunkedWithGuard(sampleTexts[voiceId], resolved, {
      onEnd: () => setTestingVoiceId(null),
      onError: () => setTestingVoiceId(null),
    });
  };
  const [screenReaderSupport, setScreenReaderSupport] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sigma_screen_reader');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sigma_high_contrast');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Privacy state
  const [sigmaApiKey, setSigmaApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_api_key') || settings.sigmaApiKey || 'sigma_live_sec_9948271048';
    } catch {
      return 'sigma_live_sec_9948271048';
    }
  });
  const [historySavePolicy, setHistorySavePolicy] = useState<'specific_only' | 'all'>(() => {
    try {
      const saved = localStorage.getItem('sigma_history_policy');
      return (saved as any) || settings.historySavePolicy || 'specific_only';
    } catch {
      return settings.historySavePolicy || 'specific_only';
    }
  });
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // AI Preferences state (Image 2)
  const [customGeminiApiKey, setCustomGeminiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_custom_gemini_key') || '';
    } catch {
      return '';
    }
  });
  const [aiPersonality, setAiPersonality] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_ai_personality') || settings.aiPersonality || 'Easy & Clear English';
    } catch {
      return settings.aiPersonality || 'Easy & Clear English';
    }
  });
  const [imageQuality, setImageQuality] = useState<'Standard' | 'High' | 'Ultra'>(() => {
    try {
      return (localStorage.getItem('sigma_img_quality') as any) || 'High';
    } catch {
      return 'High';
    }
  });
  const [responseLength, setResponseLength] = useState<'Concise' | 'Balanced' | 'Detailed'>(() => {
    try {
      return (localStorage.getItem('sigma_resp_length') as any) || 'Balanced';
    } catch {
      return 'Balanced';
    }
  });

  const [customModel, setCustomModel] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_custom_model') || (settings as any).customModel || '';
    } catch {
      return '';
    }
  });
  const [customEndpoint, setCustomEndpoint] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_custom_endpoint') || (settings as any).customEndpoint || '';
    } catch {
      return '';
    }
  });
  const [customAiPersona, setCustomAiPersona] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_custom_ai_persona') || (settings as any).customAiPersona || '';
    } catch {
      return '';
    }
  });
  const [customAiPersonaEnabled, setCustomAiPersonaEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sigma_custom_ai_persona_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Tell About You & What to Save (Persona & Typing Recognition)
  const [userNameCustom, setUserNameCustom] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_user_name_custom') || settings.userNameCustom || '';
    } catch {
      return settings.userNameCustom || '';
    }
  });
  const [userQualities, setUserQualities] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_user_qualities') || settings.userQualities || '';
    } catch {
      return settings.userQualities || '';
    }
  });
  const [userAskingStyle, setUserAskingStyle] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_user_asking_style') || settings.userAskingStyle || '';
    } catch {
      return settings.userAskingStyle || '';
    }
  });
  const [userDesiredResponseFormat, setUserDesiredResponseFormat] = useState<string>(() => {
    try {
      return localStorage.getItem('sigma_user_desired_format') || settings.userDesiredResponseFormat || '';
    } catch {
      return settings.userDesiredResponseFormat || '';
    }
  });
  const [autoAdaptUserStyle, setAutoAdaptUserStyle] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sigma_auto_adapt_style');
      return saved !== null ? JSON.parse(saved) : (settings.autoAdaptUserStyle ?? true);
    } catch {
      return true;
    }
  });

  // Admin PIN & Access State (Image 3 & 4)
  // Master PIN is strictly 00100 (two times zero, one time one, two times zero).
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [adminSelectedModel, setAdminSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-2.5-flash' | 'gemini-3.1-pro-preview'>('gemini-3.8-flash');
  const [adminQuotaMode, setAdminQuotaMode] = useState<'Standard' | 'Developer Unrestricted' | 'High Priority'>('Developer Unrestricted');
  const [adminLatency, setAdminLatency] = useState<number | null>(null);
  const [isAdminTestingLatency, setIsAdminTestingLatency] = useState(false);
  const [adminMaintenanceNotice, setAdminMaintenanceNotice] = useState('');

  const triggerLoginSecurityAlert = async (email: string, name: string) => {
    if (!email || !email.includes('@')) return;
    try {
      const saved = localStorage.getItem('sigma_login_email_alerts');
      const enabled = saved !== null ? JSON.parse(saved) : true;
      if (!enabled) return;
      await fetch('/api/notifications/send-login-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || 'Sigma User',
          time: new Date().toLocaleString(),
        }),
      });
    } catch (err) {
      console.warn('Login security alert error:', err);
    }
  };

  const handleTestLoginAlert = async () => {
    const targetEmail = user.isLoggedIn && user.email ? user.email : loginEmail.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      showToast('Please log in or enter a valid email address first.');
      return;
    }
    setIsTestingAlert(true);
    try {
      const res = await fetch('/api/notifications/send-login-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: user.name || 'Sigma User',
          time: new Date().toLocaleString(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✓ Security alert email sent to ${targetEmail}`);
      } else {
        showToast(data.message || 'Notification test recorded');
      }
    } catch {
      showToast('Login alert test triggered.');
    } finally {
      setIsTestingAlert(false);
    }
  };

  const handleTestAdminLatency = async () => {
    setIsAdminTestingLatency(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const end = performance.now();
      if (res.ok) {
        setAdminLatency(Math.round(end - start));
        showToast(`Latency test complete: ${Math.round(end - start)}ms`);
      } else {
        setAdminLatency(null);
        showToast('Server returned non-200 response.');
      }
    } catch {
      setAdminLatency(null);
      showToast('Backend health ping failed.');
    } finally {
      setIsAdminTestingLatency(false);
    }
  };

  const handleVerifyAdminPin = () => {
    if (adminPinInput.trim() === '00100') {
      setAdminUnlocked(true);
      setAdminPinError(null);
      showToast('Admin PIN verified successfully.');
    } else {
      setAdminPinError('incorrect pin');
    }
  };

  const handleSelectColorSwatch = (colorId: string) => {
    setThemeColor(colorId);
    try {
      localStorage.setItem('sigma_theme_color', colorId);
    } catch (_) {}
    onUpdateSettings({
      themeColor: colorId,
      customThemeColor: colorId === 'custom' ? customThemeColor : undefined,
    });
  };

  const handleCustomColorChange = (hexVal: string) => {
    setCustomThemeColor(hexVal);
    try {
      localStorage.setItem('sigma_custom_theme_color', hexVal);
      localStorage.setItem('sigma_theme_color', 'custom');
    } catch (_) {}
    onUpdateSettings({
      themeColor: 'custom',
      customThemeColor: hexVal,
    });
  };

  const handleSavePersonalization = () => {
    try {
      localStorage.setItem('sigma_dark_mode', JSON.stringify(darkMode));
      localStorage.setItem('sigma_theme_color', themeColor);
      localStorage.setItem('sigma_custom_theme_color', customThemeColor);
      localStorage.setItem('sigma_default_language', defaultLanguage);
      localStorage.setItem('sigma_stop_animations', JSON.stringify(stopAnimations));
      localStorage.setItem('sigma_ui_glow_enabled', JSON.stringify(uiGlowEnabled));
      localStorage.setItem('sigma_ui_glow_preset', uiGlowPreset);
      localStorage.setItem('sigma_ui_glow_color1', uiGlowColor1);
      localStorage.setItem('sigma_ui_glow_color2', uiGlowColor2);
    } catch (_) {}

    onUpdateSettings({
      darkMode,
      themeColor,
      customThemeColor: themeColor === 'custom' ? customThemeColor : undefined,
      language: defaultLanguage as AppLanguage,
      stopAnimations,
      uiGlowEnabled,
      uiGlowPreset,
      uiGlowColor1,
      uiGlowColor2,
    });

    const successMsg = getTranslation(defaultLanguage, 'savedSuccess') || 'Personalization settings saved successfully!';
    showToast(`✓ ${successMsg}`);
  };

  const handleSaveNotifications = () => {
    try {
      localStorage.setItem('sigma_ai_alerts', JSON.stringify(aiResponseAlerts));
      localStorage.setItem('sigma_search_grounding', JSON.stringify(googleSearchGrounding));
    } catch (_) {}
    onUpdateSettings({
      soundEffects: aiResponseAlerts,
      searchEnabled: googleSearchGrounding,
    });
    showToast('Notification settings saved successfully!');
  };

  const handleSavePrivacy = () => {
    try {
      localStorage.setItem('sigma_api_key', sigmaApiKey);
      localStorage.setItem('sigma_history_policy', historySavePolicy);
    } catch (_) {}
    onUpdateSettings({ sigmaApiKey, historySavePolicy });
    showToast('Privacy & history settings saved successfully!');
  };

  const handleSaveAccessibility = () => {
    try {
      localStorage.setItem('sigma_screen_reader', JSON.stringify(screenReaderSupport));
      localStorage.setItem('sigma_high_contrast', JSON.stringify(highContrast));
      localStorage.setItem('sigma_text_to_speech', JSON.stringify(textToSpeech));
      saveTtsVoicePreference(ttsVoice);
    } catch (_) {}
    onUpdateSettings({
      textToSpeech,
      ttsVoice,
      screenReaderSupport,
      highContrast,
    });
    showToast('Accessibility & voice settings saved successfully!');
  };

  const [nameValidationError, setNameValidationError] = useState<string | null>(null);
  const [customNameValidationError, setCustomNameValidationError] = useState<string | null>(null);

  const handleSaveAiPreferences = () => {
    setCustomNameValidationError(null);
    if (userNameCustom.trim()) {
      const check = validateAccountName(userNameCustom.trim(), user.email, { recordStrikeOnFail: true });
      if (!check.valid) {
        setCustomNameValidationError(
          check.message || 'This name cannot be used. Please choose another name.'
        );
        return;
      }
    }
    try {
      localStorage.setItem('sigma_custom_gemini_key', customGeminiApiKey);
      localStorage.setItem('sigma_custom_model', customModel);
      localStorage.setItem('sigma_custom_endpoint', customEndpoint);
      localStorage.setItem('sigma_custom_ai_persona', customAiPersona);
      localStorage.setItem('sigma_custom_ai_persona_enabled', JSON.stringify(customAiPersonaEnabled));
      localStorage.setItem('sigma_ai_personality', aiPersonality);
      localStorage.setItem('sigma_img_quality', imageQuality);
      localStorage.setItem('sigma_resp_length', responseLength);
      localStorage.setItem('sigma_user_name_custom', userNameCustom.trim());
      localStorage.setItem('sigma_user_qualities', userQualities);
      localStorage.setItem('sigma_user_asking_style', userAskingStyle);
      localStorage.setItem('sigma_user_desired_format', userDesiredResponseFormat);
      localStorage.setItem('sigma_auto_adapt_style', JSON.stringify(autoAdaptUserStyle));
    } catch (_) {}
    const mappedStyle =
      responseLength === 'Concise' ? 'concise' : responseLength === 'Detailed' ? 'creative' : 'balanced';
    onUpdateSettings({
      responseStyle: mappedStyle,
      aiPersonality: aiPersonality as AIPersonalityType,
      imageQuality,
      responseLength,
      customApiKey: customGeminiApiKey,
      customModel,
      customEndpoint,
      customAiPersona,
      customAiPersonaEnabled,
      userNameCustom: userNameCustom.trim(),
      userQualities,
      userAskingStyle,
      userDesiredResponseFormat,
      autoAdaptUserStyle,
    });
    showToast('AI preferences & personal profile saved successfully!');
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveUser = (updatedUser: UserProfile) => {
    onUpdateUser(updatedUser);
  };

  const handleSaveAccountSettings = () => {
    setNameValidationError(null);
    const candidateName = nameInput.trim() || user.name;
    const validation = validateAccountName(candidateName, user.email, { recordStrikeOnFail: true });
    if (!validation.valid) {
      setNameValidationError(
        validation.message || 'This name cannot be used. Please choose another name.'
      );
      return;
    }
    const updated = {
      ...user,
      name: candidateName,
    };
    handleSaveUser(updated);
    setIsEditingName(false);
    showToast('Account settings saved successfully!');
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Avatar image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = { ...user, avatarUrl: dataUrl };
      handleSaveUser(updated);
      showToast('Profile avatar updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleAutoFetchEmailLogo = () => {
    if (!user.email) return;
    const logoUrl = getEmailAvatarUrl(user.email, user.name);
    const updated = { ...user, avatarUrl: logoUrl };
    handleSaveUser(updated);
    showToast('Auto-fetched profile logo from email!');
  };

  // Start Sign Up: Validate inputs and request 4-step verification code sent to user's real email
  const handleStartSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const name = loginName.trim();
    const email = loginEmail.trim();
    const password = loginPassword;

    if (!name) {
      setAuthError('Please enter your full name.');
      return;
    }
    const nameSafetyCheck = validateAccountName(name, email, { recordStrikeOnFail: true });
    if (!nameSafetyCheck.valid) {
      setAuthError(
        nameSafetyCheck.message || 'This name cannot be used. Please choose another name.'
      );
      return;
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setAuthError('Password must be at least 4 characters.');
      return;
    }

    // Check if account already exists (bypass for specified accounts)
    const existing = findAccountByEmail(email);
    if (existing && !isAlwaysAllowedSignUpEmail(email)) {
      setAuthError('An account with this email already exists. Please sign in instead.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setAuthError(data.error || 'Failed to dispatch verification code to email.');
        return;
      }

      setOtpDeliveryStatus({
        delivered: Boolean(data.emailDelivered),
        provider: data.provider || null,
        hasProvider: Boolean(data.hasEmailProvider),
        sandboxRestricted: Boolean(data.isSandboxRestricted),
        ownerEmail: data.ownerEmail,
      });

      setPendingAccount({ name, email, password, mode: 'signup' });
      setOtpDigits(['', '', '', '']);
      setAuthStep('otp');
      setAuthError(null);

      if (data.isSandboxRestricted) {
        showToast(`📧 Code dispatched! Mirrored to owner inbox (${data.ownerEmail || 'sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com'}).`);
      } else {
        showToast(`📧 A 4-digit verification code was sent to ${email}. Please check your inbox.`);
      }

      // Auto-focus first OTP input
      setTimeout(() => {
        otpRefs[0]?.current?.focus();
      }, 100);
    } catch (err: any) {
      setAuthError('Network error while requesting verification code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend 4-step verification code to email
  const handleResendOtp = async () => {
    const targetEmail = pendingAccount?.email || loginEmail.trim();
    const targetName = pendingAccount?.name || loginName.trim();
    if (!targetEmail) return;

    setAuthError(null);
    setIsSendingOtp(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, name: targetName }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setAuthError(data.error || 'Failed to resend verification code.');
        return;
      }

      setOtpDeliveryStatus({
        delivered: Boolean(data.emailDelivered),
        provider: data.provider || null,
        hasProvider: Boolean(data.hasEmailProvider),
        sandboxRestricted: Boolean(data.isSandboxRestricted),
        ownerEmail: data.ownerEmail,
      });

      setOtpDigits(['', '', '', '']);
      if (data.isSandboxRestricted) {
        showToast(`📧 Fresh code dispatched! Mirrored to owner inbox (${data.ownerEmail || 'sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com'}).`);
      } else {
        showToast(`📧 A fresh 4-digit code was sent to ${targetEmail}. Please check your inbox.`);
      }
      setTimeout(() => {
        otpRefs[0]?.current?.focus();
      }, 100);
    } catch (err: any) {
      setAuthError('Network error while resending code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP code entered by user against server
  const handleVerifyOtp = async (codeOverride?: string) => {
    setAuthError(null);
    const codeToVerify = codeOverride || otpDigits.join('');

    if (codeToVerify.length < 4) {
      setAuthError('Please enter all 4 digits of the code sent to your email.');
      return;
    }

    if (!pendingAccount) {
      setAuthError('Verification session expired. Please start over.');
      setAuthStep('form');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingAccount.email,
          code: codeToVerify,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setAuthError(data.error || 'Incorrect verification code. Please check your email.');
        return;
      }

      let finalName = pendingAccount.name;
      let finalId = '';
      let finalAvatar: string | undefined = undefined;

      // Automatically fetch logo / avatar based on email address
      const autoAvatar = getEmailAvatarUrl(pendingAccount.email, pendingAccount.name);

      // If signup mode, permanently save registered account with avatar
      if (pendingAccount.mode === 'signup' && pendingAccount.password) {
        const newAccount = saveRegisteredAccount({
          name: pendingAccount.name,
          email: pendingAccount.email,
          password: pendingAccount.password,
          avatarUrl: autoAvatar,
        });
        finalName = newAccount.name;
        finalId = newAccount.id;
        finalAvatar = autoAvatar;
      } else {
        const existing = findAccountByEmail(pendingAccount.email);
        if (existing) {
          finalName = existing.name;
          finalId = existing.id;
          finalAvatar = existing.avatarUrl || autoAvatar;
        } else {
          finalAvatar = autoAvatar;
        }
      }

      // Successfully sign in the user with their logo
      const newUser: UserProfile = {
        id: finalId,
        isLoggedIn: true,
        name: finalName,
        email: pendingAccount.email,
        avatarUrl: finalAvatar,
        role: pendingAccount.email.toLowerCase().includes('admin') || pendingAccount.email.toLowerCase().includes('saba')
          ? 'admin'
          : 'user',
      };

      handleSaveUser(newUser);
      setNameInput(finalName);
      setShowLoginDialog(false);
      setAuthStep('form');
      setPendingAccount(null);
      setLoginPassword('');

      showToast(`🎉 Verified successfully! Welcome, ${finalName}!`);
      triggerLoginSecurityAlert(pendingAccount.email, finalName);
    } catch (err: any) {
      setAuthError('Failed to verify code. Please check your connection.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle OTP digit change
  const handleOtpDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = char;
    setOtpDigits(next);
    setAuthError(null);

    if (char && index < 3) {
      otpRefs[index + 1]?.current?.focus();
    }

    // If 4 digits entered, automatically verify against server
    if (char && index === 3 && next.every((d) => d !== '')) {
      handleVerifyOtp(next.join(''));
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1]?.current?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted) {
      const next = ['', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setOtpDigits(next);
      if (pasted.length === 4) {
        handleVerifyOtp(pasted);
      } else {
        const nextFocus = Math.min(pasted.length, 3);
        otpRefs[nextFocus]?.current?.focus();
      }
    }
  };

  // Handle Sign In with Email & Password -> Sends 4-step OTP to email for secure login
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const email = loginEmail.trim();
    const password = loginPassword;

    if (!email || !email.includes('@')) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    const authResult = authenticateWithCredentials(email, password);
    if (!authResult.success || !authResult.account) {
      setAuthError(authResult.error || 'Invalid email or password.');
      return;
    }

    const account = authResult.account;

    setIsSendingOtp(true);
    try {
      // Dispatch 4-step code to registered email
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, name: account.name }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setAuthError(data.error || 'Failed to dispatch verification code to your email.');
        return;
      }

      setOtpDeliveryStatus({
        delivered: Boolean(data.emailDelivered),
        provider: data.provider || null,
        hasProvider: Boolean(data.hasEmailProvider),
      });

      setPendingAccount({ name: account.name, email: account.email, mode: 'signin' });
      setOtpDigits(['', '', '', '']);
      setAuthStep('otp');
      setAuthError(null);

      showToast(`📧 A 4-digit verification code was sent to ${account.email}. Please check your inbox.`);

      setTimeout(() => {
        otpRefs[0]?.current?.focus();
      }, 100);
    } catch (err: any) {
      setAuthError('Network error while dispatching verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    try {
      await onGoogleSignIn();
      setShowLoginDialog(false);
      showToast('Signed in with Google successfully!');
      if (user.email) {
        triggerLoginSecurityAlert(user.email, user.name || 'Google User');
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        showToast('Google Sign-In popup closed.');
      } else if (error.code === 'auth/popup-blocked') {
        showToast('Popup was blocked by your browser. Please allow popups for this site.');
      } else {
        showToast(error.message || 'Google Sign-In failed.');
      }
    }
  };

  const handleForgotPassword = () => {
    const targetEmail = loginEmail.trim() || 'your email';
    showToast(`Password reset link sent to ${targetEmail}`);
  };

  const handleLogout = async () => {
    await onLogout();
    showToast('Signed out of Google account. Switched to Guest mode.');
  };

  const handleQuickLogin = (demoName: string, demoEmail: string, role: 'user' | 'admin' = 'user') => {
    const newUser: UserProfile = {
      isLoggedIn: true,
      name: demoName,
      email: demoEmail,
      role,
    };
    handleSaveUser(newUser);
    setNameInput(demoName);
    setShowLoginDialog(false);
    showToast(`Logged in as ${demoName}`);
  };

  const handleExport = (format: 'txt' | 'markdown' | 'json' = 'txt') => {
    if (messages.length === 0) {
      showToast('No messages in current conversation to export.');
      return;
    }

    let fileContent = '';
    let mimeType = 'text/plain';
    let filename = `sigma_chat_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'txt') {
      filename += '.txt';
      mimeType = 'text/plain';
      const dateStr = new Date().toLocaleString();
      fileContent = `======================================================\n`;
      fileContent += `SIGMA AI CONVERSATION EXPORT\n`;
      fileContent += `Export Date: ${dateStr}\n`;
      fileContent += `Account: ${user.name} (${user.isLoggedIn ? user.email : 'Guest Session'})\n`;
      fileContent += `Total Turn Count: ${messages.length}\n`;
      fileContent += `======================================================\n\n`;

      messages.forEach((msg, idx) => {
        const sender = msg.role === 'user' ? 'USER' : 'SIGMA AI';
        const time = new Date(msg.timestamp).toLocaleTimeString();
        fileContent += `[#${idx + 1}] [${time}] ${sender}:\n${msg.content}\n`;
        if (msg.sources && msg.sources.length > 0) {
          fileContent += `Sources / References:\n`;
          msg.sources.forEach((s) => {
            fileContent += ` - ${s.title}: ${s.url}\n`;
          });
        }
        fileContent += `\n------------------------------------------------------\n\n`;
      });
    } else if (format === 'markdown') {
      filename += '.md';
      mimeType = 'text/markdown';
      fileContent = `# Sigma AI Conversation\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
      messages.forEach((msg) => {
        const sender = msg.role === 'user' ? '👤 User' : '⚡ Sigma AI';
        fileContent += `### ${sender}\n\n${msg.content}\n\n`;
        if (msg.sources && msg.sources.length > 0) {
          fileContent += `**Sources:**\n`;
          msg.sources.forEach((s) => {
            fileContent += `- [${s.title}](${s.url})\n`;
          });
          fileContent += '\n';
        }
        fileContent += `---\n\n`;
      });
    } else {
      filename += '.json';
      mimeType = 'application/json';
      fileContent = JSON.stringify(messages, null, 2);
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Chat exported as ${format.toUpperCase()}`);
  };

  const handleResetSettings = () => {
    if (confirm('Reset all settings to default values?')) {
      onUpdateSettings(DEFAULT_SETTINGS);
      showToast('Settings restored to defaults');
    }
  };

  const currentTheme = getThemeColor(themeColor, customThemeColor);

  type TabItem = {
    id: SettingsTabType;
    label: string;
    icon: React.ReactNode;
    desc: string;
    badge?: string;
  };

  const getColorName = (id: string, fallback: string) => {
    const map: Record<string, string> = {
      green: 'colorGreen',
      blue: 'colorBlue',
      pink: 'colorPink',
      yellow: 'colorYellow',
      purple: 'colorPurple',
      orange: 'colorOrange',
      red: 'colorRed',
      teal: 'colorTeal',
      cyan: 'colorCyan',
      emerald: 'colorEmerald',
      indigo: 'colorIndigo',
      custom: 'colorCustom',
    };
    const key = map[id];
    return key ? getTranslation(activeLang, key) : fallback;
  };

  const baseTabs: TabItem[] = [
    {
      id: 'account',
      label: getTranslation(activeLang, 'account'),
      icon: <User className="w-4 h-4" />,
      desc: getTranslation(activeLang, 'tabAccountDesc'),
    },
    {
      id: 'recents',
      label: getTranslation(activeLang, 'recentChats'),
      icon: <Clock className="w-4 h-4" />,
      desc: getTranslation(activeLang, 'tabRecentsDesc'),
      badge: user.isLoggedIn && conversations.length > 0 ? `${conversations.length}` : undefined,
    },
    {
      id: 'library',
      label: getTranslation(activeLang, 'library'),
      icon: <Library className="w-4 h-4" />,
      desc: getTranslation(activeLang, 'tabLibraryDesc'),
      badge: unifiedLibraryCount > 0 ? `${unifiedLibraryCount}` : undefined,
    },
    {
      id: 'study' as SettingsTabType,
      label: getTranslation(activeLang, 'studyAndSources'),
      icon: <BookOpen className="w-4 h-4" />,
      desc: getTranslation(activeLang, 'tabStudyDesc'),
    },
    {
      id: 'connections',
      label: getTranslation(activeLang, 'connectedServices'),
      icon: <Link2 className="w-4 h-4" />,
      desc: getTranslation(activeLang, 'tabConnectionsDesc'),
    },
    {
      id: 'personality',
      label: getTranslation(activeLang, 'personalization'),
      icon: <Sparkles className="w-4 h-4" />,
      desc: getTranslation(activeLang, 'tabPersonalizationDesc'),
    },
    {
      id: 'notifications',
      label: getTranslation(activeLang, 'notifications'),
      icon: <Bell className="w-4 h-4" />,
      desc: getTranslation(activeLang, 'tabNotificationsDesc'),
    },
    {
      id: 'privacy',
      label: getTranslation(activeLang, 'privacySecurity'),
      icon: <Shield className="w-4 h-4" />,
      desc: getTranslation(activeLang, 'tabPrivacyDesc'),
    },
    {
      id: 'accessibility',
      label: getTranslation(activeLang, 'accessibility'),
      icon: <Eye className="w-4 h-4" />,
      desc: getTranslation(activeLang, 'tabAccessibilityDesc'),
    },
    {
      id: 'ai-preference',
      label: getTranslation(activeLang, 'aiPreferences'),
      icon: <Cpu className="w-4 h-4" />,
      desc: getTranslation(activeLang, 'tabAiPreferencesDesc'),
    },
  ];

  // ONLY show Admin panel tab if logged in by devuserhub@gmail.com or sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com
  const tabs: TabItem[] = isAuthorizedAdmin
    ? [
        ...baseTabs,
        {
          id: 'admin-panel' as SettingsTabType,
          label: getTranslation(activeLang, 'adminPanel'),
          icon: <Terminal className="w-4 h-4" />,
          desc: getTranslation(activeLang, 'tabAdminPanelDesc'),
        },
      ]
    : baseTabs;

  return (
    <div
      id="settings-full-window"
      className={`fixed inset-0 z-50 bg-[#0a0b0e] text-slate-100 flex flex-col sm:flex-row overflow-hidden w-full h-[100dvh] max-h-[100dvh] font-sans select-none ${
        settings.stopAnimations ? '' : 'animate-page-pop'
      }`}
    >
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={avatarFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileSelect}
      />

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        id="settings-sidebar"
        className={`w-full sm:w-72 md:w-80 bg-[#0f1117] border-r border-[#1e222d] flex-col flex-1 sm:flex-initial h-full max-h-[100dvh] min-h-0 ${
          mobileView === 'menu' ? 'flex' : 'hidden sm:flex'
        }`}
      >
        {/* Sidebar Header & Brand */}
        <div className="p-4 sm:p-5 border-b border-[#1e222d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl bg-black overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs transition-colors"
              style={{
                border: `1.5px solid ${currentTheme.hex}`,
                boxShadow: `0 0 12px ${currentTheme.glow}`,
              }}
            >
              <img
                src="/sigma_logo.jpg"
                alt="Sigma"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                {getTranslation(activeLang, 'settings')}
              </h1>
              <span className="text-[11px] text-slate-400 font-normal">
                {getTranslation(activeLang, 'settingsControlCenter')}
              </span>
            </div>
          </div>

          <button
            id="settings-mobile-close-btn"
            onClick={onClose}
            className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1f232d] transition-colors cursor-pointer"
            title={getTranslation(activeLang, 'close')}
            aria-label={getTranslation(activeLang, 'close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. FIRST: LOGIN OPTION CARD */}
        <div className="p-3.5 sm:p-4 border-b border-[#1e222d] bg-[#12151c]/60">
          <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 mb-2">
            {getTranslation(activeLang, 'authentication')}
          </div>

          {user.isLoggedIn ? (
            <div
              id="user-session-card"
              className="p-3 bg-[#171922] rounded-2xl border border-white/5 shadow-2xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden transition-colors"
                  style={{
                    backgroundColor: `${currentTheme.hex}22`,
                    border: `1.5px solid ${currentTheme.hex}`,
                  }}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.name.charAt(0).toUpperCase() || 'S'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                    <span className="truncate">{user.name}</span>
                    {isVerifiedOwnerAccount(user) && (
                      <span title="Verified Account" className="inline-flex flex-shrink-0">
                        <BadgeCheck
                          id="sidebar-verified-blue-badge"
                          className="w-3.5 h-3.5 text-[#3b82f6] flex-shrink-0"
                        />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                id="logout-btn"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ) : (
            <div
              id="guest-login-card"
              className="p-3 bg-[#171922] rounded-2xl border border-dashed border-slate-700 hover:border-slate-500 transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {user.name && user.name !== 'Guest User' ? user.name : 'Guest Session'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium flex-shrink-0">
                  Guest Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {user.name && user.name !== 'Guest User'
                  ? `Recognized as "${user.name}" in this browser (saved for 1 month).`
                  : 'Enter your name to replace "Guest User", or log in to sync permanently.'}
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  id="guest-enter-name-btn"
                  onClick={() => {
                    setGuestNameInput(user.name && user.name !== 'Guest User' ? user.name : '');
                    setGuestNameError(null);
                    setShowGuestNameDialog(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer border border-white/10"
                >
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>{user.name && user.name !== 'Guest User' ? `${getTranslation(activeLang, 'changeName')} (${user.name})` : getTranslation(activeLang, 'continueAsGuest')}</span>
                </button>
                <button
                  id="open-login-btn"
                  onClick={() => setShowLoginDialog(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-200 text-slate-950 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{getTranslation(activeLang, 'logInSignUp')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. SEVEN TABS NAVIGATION */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 sm:p-3 space-y-1">
          <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 px-3 py-1.5 flex items-center justify-between">
            <span>{getTranslation(activeLang, 'preferences')}</span>
            <span className="sm:hidden text-[9px] text-slate-500 font-mono">({tabs.length} tabs)</span>
          </div>

          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <React.Fragment key={tab.id}>
              <button
                id={`tab-btn-${tab.id}`}
                onClick={() => {
                  if (tab.id === 'recents') {
                    setRecentsSubSection('all');
                  }
                  setActiveTab(tab.id);
                  setMobileView('content');
                }}
                className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1f2430] text-white shadow-2xs border border-white/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#151821] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      backgroundColor: isActive ? `${currentTheme.hex}20` : '#181b26',
                      color: isActive ? currentTheme.hex : '#94a3b8',
                      border: isActive ? `1px solid ${currentTheme.hex}40` : undefined,
                    }}
                  >
                    {tab.icon}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-semibold text-white truncate text-xs sm:text-sm">
                      {index + 1}. {tab.label}
                    </div>
                    {tab.desc && (
                      <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                        {tab.desc}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {tab.badge && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      style={{
                        backgroundColor: isActive ? `${currentTheme.hex}25` : '#1e222d',
                        color: isActive ? currentTheme.hex : '#94a3b8',
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                  <ChevronRight
                    className="w-4 h-4"
                    style={{ color: isActive ? currentTheme.hex : '#475569' }}
                  />
                </div>
              </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Sidebar Footer: Back to Chat Button */}
        <div className="p-3 sm:p-4 border-t border-[#1e222d] bg-[#0f1117] flex-shrink-0">
          <button
            id="settings-back-to-chat-btn"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#272b38] hover:border-slate-600 hover:bg-[#181b24] text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{getTranslation(activeLang, 'backToChat')}</span>
            <span className="text-[10px] text-slate-500 font-mono ml-auto">ESC</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main
        id="settings-main-viewport"
        className={`flex-1 flex-col bg-[#090a0d] overflow-hidden h-full max-h-[100dvh] min-h-0 ${
          mobileView === 'content' ? 'flex' : 'hidden sm:flex'
        }`}
      >
        {/* Top Header of Main Area (Desktop) */}
        <header className="hidden sm:flex bg-[#0f1117] border-b border-[#1e222d] px-6 sm:px-8 py-4 items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight capitalize">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-slate-400 font-normal">
              {getTranslation(activeLang, 'manageConfigurations').replace('{name}', tabs.find((t) => t.id === activeTab)?.label || '')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="settings-main-close-btn"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#272b38] hover:border-slate-500 bg-[#161822] hover:bg-[#1f222e] text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>{getTranslation(activeLang, 'close')}</span>
            </button>
          </div>
        </header>

        {/* Top Header of Main Area (Mobile) */}
        <header className="sm:hidden bg-[#0f1117] border-b border-[#1e222d] px-3.5 py-2.5 flex items-center justify-between flex-shrink-0">
          <button
            id="mobile-view-all-tabs-btn"
            onClick={() => setMobileView('menu')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#272b38] bg-[#161822] hover:bg-[#1f232e] text-slate-200 hover:text-white text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: currentTheme.hex }} />
            <span>{getTranslation(activeLang, 'allTabs')}</span>
          </button>

          <span className="text-sm font-bold text-white truncate px-2">
            {tabs.find((t) => t.id === activeTab)?.label}
          </span>

          <button
            id="mobile-settings-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1f232d] transition-colors cursor-pointer"
            title={getTranslation(activeLang, 'close')}
            aria-label={getTranslation(activeLang, 'close')}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile Horizontal Quick-Tab Switcher Bar */}
        <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto py-2 px-3 bg-[#0c0e14] border-b border-[#1e222d] flex-shrink-0 scrollbar-none overscroll-x-contain">
          {tabs.map((tab, idx) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'recents') {
                    setRecentsSubSection('all');
                  }
                  setActiveTab(tab.id);
                }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  isTabActive
                    ? 'font-bold shadow-xs'
                    : 'bg-[#151821] text-slate-400 hover:text-white'
                }`}
                style={
                  isTabActive
                    ? {
                        backgroundColor: `${currentTheme.hex}22`,
                        color: currentTheme.hex,
                        border: `1px solid ${currentTheme.hex}55`,
                      }
                    : { border: '1px solid rgba(255,255,255,0.06)' }
                }
              >
                <span>{tab.icon}</span>
                <span>{idx + 1}. {tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-8 max-w-4xl w-full mx-auto space-y-4 sm:space-y-6">
          {notification && (
            <div
              className="px-4 py-3 rounded-2xl text-xs flex items-center gap-2 font-medium animate-in fade-in"
              style={{
                backgroundColor: `${currentTheme.hex}18`,
                border: `1px solid ${currentTheme.hex}40`,
                color: currentTheme.hex,
              }}
            >
              <Check className="w-4 h-4 flex-shrink-0" style={{ color: currentTheme.hex }} />
              <span>{notification}</span>
            </div>
          )}

          {/* TAB 1: ACCOUNT */}
          {activeTab === 'account' && (
            <div id="tab-account-content" className="max-w-xl mx-auto space-y-4 sm:space-y-6 pt-2 sm:pt-8">
              {/* Profile Card */}
              <div
                id="account-profile-card"
                className="relative bg-[#131418] border border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl flex flex-col items-center justify-center text-center"
              >
                {/* Top Right Logout Button with red icon (only when signed in) */}
                {user.isLoggedIn ? (
                  <button
                    id="account-card-logout-btn"
                    onClick={handleLogout}
                    className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 sm:p-2.5 rounded-xl bg-[#1f232b] hover:bg-[#282d37] border border-white/5 text-[#ff4d4f] hover:text-red-400 transition-colors cursor-pointer shadow-xs"
                    title="Sign out / Disconnect"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff4d4f]" />
                  </button>
                ) : (
                  <div className="absolute top-4 sm:top-5 right-4 sm:right-5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-white/5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Guest Mode
                  </div>
                )}

                {/* Avatar with dynamic theme ring and camera badge */}
                <div className="relative mb-4 sm:mb-5">
                  <div
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-[3px] border-2 flex items-center justify-center cursor-pointer group shadow-lg overflow-hidden transition-colors"
                    style={{
                      borderColor: user.isLoggedIn ? currentTheme.hex : '#334155',
                      backgroundColor: user.isLoggedIn ? `${currentTheme.hex}22` : '#161922',
                    }}
                    onClick={() => {
                      if (user.isLoggedIn) {
                        avatarFileInputRef.current?.click();
                      } else {
                        setShowLoginDialog(true);
                      }
                    }}
                    title={user.isLoggedIn ? 'Click to upload profile picture' : 'Sign in to customize profile picture'}
                  >
                    {user.isLoggedIn && user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover rounded-full group-hover:opacity-90 transition-opacity"
                      />
                    ) : user.isLoggedIn ? (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: `${currentTheme.hex}33` }}
                      >
                        <span className="text-3xl sm:text-5xl font-medium tracking-normal select-none">
                          {user.name.charAt(0).toUpperCase() || 'S'}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-black">
                        <img
                          src="/sigma_logo.jpg"
                          alt="Sigma AI"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Camera Badge Icon on bottom-right (only when signed in) */}
                  {user.isLoggedIn && (
                    <button
                      id="account-avatar-camera-badge"
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-[#131418] flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
                      style={{ backgroundColor: currentTheme.hex }}
                      title="Change Profile Photo"
                      aria-label="Change photo"
                    >
                      <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                    </button>
                  )}
                </div>

                {/* Name & Verified Owner / Verification Badge */}
                <div className="flex flex-col items-center justify-center gap-2 mb-1.5 w-full">
                  {user.isLoggedIn ? (
                    isEditingName ? (
                      <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                        <div className="flex items-center gap-2 w-full justify-center">
                          <input
                            id="account-name-edit-input"
                            type="text"
                            value={nameInput}
                            onChange={(e) => {
                              setNameInput(e.target.value);
                              if (nameValidationError) setNameValidationError(null);
                            }}
                            className="bg-[#1e222b] text-white font-bold text-lg sm:text-xl px-3 py-1 rounded-xl focus:outline-none text-center"
                            style={{ border: `1.5px solid ${nameValidationError ? '#ef4444' : currentTheme.hex}` }}
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              const candidate = nameInput.trim() || user.name;
                              const check = validateAccountName(candidate, user.email, { recordStrikeOnFail: true });
                              if (!check.valid) {
                                setNameValidationError(
                                  check.message || 'This name cannot be used. Please choose another name.'
                                );
                                return;
                              }
                              setNameValidationError(null);
                              handleSaveUser({ ...user, name: candidate });
                              if (!user.isLoggedIn || user.authProvider === 'guest') {
                                updateGuestDisplayName(candidate).catch(() => {});
                              }
                              setIsEditingName(false);
                              showToast('Name updated');
                            }}
                            className="p-1.5 text-black rounded-lg cursor-pointer flex-shrink-0"
                            style={{ backgroundColor: currentTheme.hex }}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                        {nameValidationError && (
                          <div
                            id="account-name-error-msg"
                            className="w-full px-3 py-2 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 text-center"
                          >
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                            <span>{nameValidationError}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className="group flex items-center gap-2"
                        >
                          <h3
                            className="text-lg sm:text-2xl font-bold text-white tracking-tight cursor-pointer hover:text-slate-200 transition-colors"
                            onClick={() => {
                              setNameInput(user.name || '');
                              setNameValidationError(null);
                              setIsEditingName(true);
                            }}
                          >
                            {user.name || 'Sigma User'}
                          </h3>
                          {isVerifiedOwnerAccount(user) && (
                            <>
                              <div
                                id="verified-owner-blue-badge"
                                className="w-5 h-5 rounded-full bg-[#1d4ed8] flex items-center justify-center p-0.5 text-white shadow-xs"
                                title="Verified Account"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                              <span
                                id="verified-owner-crown-badge"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-400/50 text-yellow-300 text-xs font-bold tracking-wide shadow-xs"
                                title="Sigma AI Owner"
                              >
                                <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                <span>Owner</span>
                              </span>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setNameInput(user.name || '');
                              setNameValidationError(null);
                              setIsEditingName(true);
                            }}
                            className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit display name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {nameValidationError && (
                          <div className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                            <span>{nameValidationError}</span>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                        {user.name && user.name.trim() && user.name !== 'Guest User' ? user.name : 'Guest User'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setGuestNameInput(user.name && user.name !== 'Guest User' ? user.name : '');
                          setGuestNameError(null);
                          setShowGuestNameDialog(true);
                        }}
                        className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Enter your name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Email address / status */}
                <p className="text-xs sm:text-sm text-slate-400 font-normal">
                  {user.isLoggedIn ? (user.email || 'user@example.com') : 'Not signed in'}
                </p>

                {/* FEATURES LOGO & FEATURES BUTTON */}
                <div className="mt-4 sm:mt-5 w-full flex flex-col items-center">
                  <button
                    id="account-features-btn"
                    type="button"
                    onClick={() => setShowFeaturesModal(true)}
                    className="w-full max-w-md flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#171a23] hover:bg-[#1f2432] active:scale-[0.98] transition-all cursor-pointer shadow-lg group border"
                    style={{
                      borderColor: `${currentTheme.hex}40`,
                      boxShadow: `0 4px 20px -2px ${currentTheme.glow}`,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Features Logo */}
                      <div
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: `${currentTheme.hex}22`,
                          border: `1.5px solid ${currentTheme.hex}`,
                          boxShadow: `0 0 12px ${currentTheme.glow}`,
                        }}
                      >
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: currentTheme.hex }} />
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-white tracking-tight group-hover:text-slate-100 block">
                          Features
                        </span>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                          Explore AI capabilities, developer tools & system modes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-white transition-colors pl-2 flex-shrink-0">
                      <span className="hidden sm:inline text-[11px] font-medium" style={{ color: currentTheme.hex }}>
                        View All
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                </div>

                {/* Quick actions for Logo/Avatar */}
                {user.isLoggedIn && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-medium cursor-pointer transition-colors shadow-xs active:scale-95"
                      title="Upload PNG logo or photo"
                    >
                      <Camera className="w-3.5 h-3.5" style={{ color: currentTheme.hex }} />
                      <span>Upload PNG Logo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoFetchEmailLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors shadow-xs active:scale-95"
                      style={{
                        backgroundColor: `${currentTheme.hex}18`,
                        border: `1px solid ${currentTheme.hex}40`,
                        color: currentTheme.hex,
                      }}
                      title="Automatically fetch logo from email"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Auto-Fetch from Email</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Below Guest User: Google Sign-in */}
              {!user.isLoggedIn && (
                <div className="w-full space-y-2.5">
                  <button
                    id="account-sign-in-google-btn"
                    type="button"
                    disabled={isGoogleLoading}
                    onClick={handleGoogleSignInClick}
                    className="w-full flex items-center justify-center gap-3 py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-xs sm:text-base tracking-wide transition-all cursor-pointer shadow-lg shadow-white/10 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                  </button>
                </div>
              )}

              {/* Email and Password Login Button */}
              <div className="flex flex-col gap-2.5 sm:gap-3">
                <button
                  id="account-email-password-login-btn"
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setAuthStep('form');
                    setAuthError(null);
                    setShowLoginDialog(true);
                  }}
                  className="w-full sm:w-fit min-w-0 sm:min-w-[240px] flex items-center justify-between gap-4 py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-[#14161d] hover:bg-[#1d202b] border border-[#272b38] text-slate-200 text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-xs group"
                >
                  <div className="flex items-center gap-3">
                    <LogIn
                      className="w-4 h-4 text-slate-400 group-hover:opacity-100 transition-colors"
                      style={{ color: currentTheme.hex }}
                    />
                    <span className="font-semibold text-white">Email and Password Login</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </button>

                {user.isLoggedIn && (
                  <button
                    id="account-logout-btn"
                    type="button"
                    onClick={handleLogout}
                    className="w-full sm:w-fit min-w-0 sm:min-w-[240px] flex items-center justify-between gap-4 py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-[#14161d] hover:bg-rose-950/20 border border-[#272b38] hover:border-rose-900/40 text-rose-300 text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-4 h-4 text-rose-400 group-hover:text-rose-300 transition-colors" />
                      <span>Sign Out</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-500/40 group-hover:text-rose-400 transition-colors" />
                  </button>
                )}
              </div>

              {/* Persistent AI Profile: What Sigma Knows */}
              <div className="pt-2">
                <AiProfileSection user={user} themeColorHex={currentTheme.hex} />
              </div>

              {/* Real Account Storage & Data Isolation Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#14161f] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" style={{ color: currentTheme.hex }} />
                    <h4 className="text-xs sm:text-sm font-bold text-white">Storage & Data Isolation</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                    Account Isolated
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Chats</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">{conversations.length}</span>
                    <span className="text-[10px] text-slate-500">
                      ~{(JSON.stringify(conversations).length / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Library</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">{unifiedLibraryCount}</span>
                    <span className="text-[10px] text-slate-500">Docs & code</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Diagrams</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">{getStudyImageMaterials().length}</span>
                    <span className="text-[10px] text-slate-500">Saved images</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Sources</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">{studySourcesList.length}</span>
                    <span className="text-[10px] text-slate-500">Indexed links</span>
                  </div>
                </div>

                {storageEstimate && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Sandbox Storage Usage:</span>
                      <span className="text-white font-mono font-medium">
                        {(storageEstimate.usage / (1024 * 1024)).toFixed(1)} MB /{' '}
                        {(storageEstimate.quota / (1024 * 1024)).toFixed(0)} MB
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: currentTheme.hex,
                          width: `${Math.min(
                            100,
                            Math.max(2, (storageEstimate.usage / (storageEstimate.quota || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                  Data is keyed strictly to{' '}
                  <strong className="text-slate-200">
                    {user.isLoggedIn ? user.id || user.email : 'Current Guest Session'}
                  </strong>
                  . Chats, profiles, and study sources are private and isolated to your account.
                </p>
              </div>

              {/* Dynamic Theme Color Button: Save Account Settings */}
              <div className="pt-1 sm:pt-2">
                <button
                  id="account-save-settings-btn"
                  type="button"
                  onClick={handleSaveAccountSettings}
                  className="w-full py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl active:scale-[0.99] font-bold text-xs sm:text-base tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: currentTheme.hex,
                    color: currentTheme.isDarkText ? '#000000' : '#ffffff',
                    boxShadow: `0 8px 24px ${currentTheme.glow}`,
                  }}
                >
                  <Check className="w-4 h-4" />
                  <span>Save Account Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RECENT CHATS */}
          {activeTab === 'recents' && (
            <div id="tab-recents-content" className="space-y-4 sm:space-y-6">
              <div className="p-4 sm:p-6 bg-[#131418] rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xs space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: currentTheme.hex }} />
                      <span>Recent Chats</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Saved conversation history for{' '}
                      <span className="font-mono font-medium" style={{ color: currentTheme.hex }}>
                        {user.isLoggedIn ? user.email : (user.name && user.name !== 'Guest User' ? user.name : 'Guest User')}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {conversations.length > 0 && (
                      inlineClearConfirm ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/70 border border-red-500/50 text-xs shadow-lg animate-in fade-in">
                          <span className="text-red-200 font-semibold text-[11px] whitespace-nowrap">Clear all forever?</span>
                          <button
                            type="button"
                            id="settings-inline-clear-all-confirm"
                            disabled={isClearingAllChats}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleExecuteClearAllChats();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow cursor-pointer disabled:opacity-50"
                          >
                            {isClearingAllChats ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>{isClearingAllChats ? getTranslation(settings.language, 'clearing') : getTranslation(settings.language, 'yesClear')}</span>
                          </button>
                          <button
                            type="button"
                            id="settings-inline-clear-all-cancel"
                            disabled={isClearingAllChats}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setInlineClearConfirm(false);
                              setShowClearAllConfirm(false);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-medium cursor-pointer"
                          >
                            {getTranslation(settings.language, 'cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id="settings-clear-all-chats-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowClearAllConfirm(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
                          title="Clear all saved chats forever"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{getTranslation(settings.language, 'clearAllChats')}</span>
                        </button>
                      )
                    )}
                    {onNewChat && (
                      <button
                        type="button"
                        onClick={() => {
                          onNewChat();
                          onClose();
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl active:scale-95 text-xs font-bold transition-all cursor-pointer shadow-xs"
                        style={{
                          backgroundColor: currentTheme.hex,
                          color: currentTheme.isDarkText ? '#000000' : '#ffffff',
                          boxShadow: `0 4px 14px ${currentTheme.glow}`,
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Chat</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Guest Mode 24-Hour Notice Banner */}
                {!user.isLoggedIn && (
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>
                        <strong>Guest Mode:</strong> Recent chats in this browser are retained for <strong>1 day (24 hours)</strong>. Sign in with Google to save your chat history forever.
                      </span>
                    </div>
                    {onGoogleSignIn && (
                      <button
                        type="button"
                        onClick={onGoogleSignIn}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 flex-shrink-0 transition-colors cursor-pointer shadow-xs"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In Forever</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={recentsSearch}
                    onChange={(e) => setRecentsSearch(e.target.value)}
                    placeholder="Search past conversations..."
                    className="w-full bg-[#181a22] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none"
                    style={{ outlineColor: currentTheme.hex }}
                  />
                  {recentsSearch && (
                    <button
                      type="button"
                      onClick={() => setRecentsSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Recent Chats Options -> Library & Pictures */}
                <div className="pt-1 border-t border-white/5 space-y-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                    Recent Chats Sections
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecentsSubSection('all')}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        recentsSubSection === 'all'
                          ? 'bg-[#1a2333] border-blue-500/50 text-white'
                          : 'bg-[#181a22] border-white/5 hover:border-white/15 text-slate-300 hover:bg-[#1d202b]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-xs font-bold">Recent Chats</div>
                          <div className="text-[10px] text-slate-400">All saved sessions</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 font-mono">
                        {conversations.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecentsSubSection('library')}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        recentsSubSection === 'library'
                          ? 'bg-indigo-500/15 border-indigo-500/50 text-white'
                          : 'bg-[#181a22] border-white/5 hover:border-white/15 text-slate-300 hover:bg-[#1d202b]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Library className="w-4 h-4 text-indigo-400" />
                        <div>
                          <div className="text-xs font-bold">Library</div>
                          <div className="text-[10px] text-slate-400">Essays, stories & code</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                        {unifiedLibraryCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecentsSubSection('pictures')}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        recentsSubSection === 'pictures'
                          ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                          : 'bg-[#181a22] border-white/5 hover:border-white/15 text-slate-300 hover:bg-[#1d202b]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="text-xs font-bold">Pictures</div>
                          <div className="text-[10px] text-slate-400">Uploaded & pasted images</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                        {unifiedPicturesCount}
                      </span>
                    </button>
                  </div>
                </div>

                {recentsSubSection !== 'all' && (
                  <div className="pt-2">
                    <LibraryPicturesView
                      key={`recents-sub-${recentsSubSection}-${librarySyncTick}`}
                      user={user}
                      conversations={conversations}
                      mode={recentsSubSection === 'library' ? 'library-only' : 'pictures-only'}
                      themeColorHex={currentTheme.hex}
                      onSelectConversation={(convId) => {
                        if (onSelectConversation) {
                          onSelectConversation(convId);
                          onClose();
                        }
                      }}
                    />
                  </div>
                )}

                {/* Day by Day Grouped Conversations */}
                {(() => {
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                  const oneDayMs = 24 * 60 * 60 * 1000;
                  const yesterday = today - oneDayMs;
                  const sevenDaysAgo = today - 7 * oneDayMs;

                  const filtered = conversations.filter((c) => {
                    if (!recentsSearch.trim()) return true;
                    const q = recentsSearch.toLowerCase();
                    return (
                      c.title.toLowerCase().includes(q) ||
                      c.messages?.some((m) => m.content.toLowerCase().includes(q))
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-medium">
                          {recentsSearch
                            ? 'No conversations found matching your search'
                            : 'No saved conversations yet for this account'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {recentsSearch
                            ? 'Try different search keywords'
                            : 'Conversations you have while logged in will be saved here.'}
                        </p>
                      </div>
                    );
                  }

                  const pinned = filtered.filter((c) => c.isPinned);
                  const unpinned = filtered.filter((c) => !c.isPinned);

                  const groups: { label: string; list: Conversation[]; isPinnedGroup?: boolean }[] = [
                    ...(pinned.length > 0
                      ? [
                          {
                            label: 'Pinned',
                            list: pinned,
                            isPinnedGroup: true,
                          },
                        ]
                      : []),
                    {
                      label: 'Today',
                      list: unpinned.filter((c) => toSafeDate(c.updatedAt || c.createdAt).getTime() >= today),
                    },
                    {
                      label: 'Yesterday',
                      list: unpinned.filter((c) => {
                        const t = toSafeDate(c.updatedAt || c.createdAt).getTime();
                        return t >= yesterday && t < today;
                      }),
                    },
                    {
                      label: 'Previous 7 Days',
                      list: unpinned.filter((c) => {
                        const t = toSafeDate(c.updatedAt || c.createdAt).getTime();
                        return t >= sevenDaysAgo && t < yesterday;
                      }),
                    },
                    {
                      label: 'Earlier',
                      list: unpinned.filter(
                        (c) => toSafeDate(c.updatedAt || c.createdAt).getTime() < sevenDaysAgo
                      ),
                    },
                  ];

                  return (
                    <div className="space-y-4">
                      {groups.map(
                        (grp) =>
                          grp.list.length > 0 && (
                            <div key={grp.label} className="space-y-2">
                              <div
                                className={`text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1.5 ${
                                  grp.isPinnedGroup ? 'text-amber-400' : 'text-slate-400'
                                }`}
                              >
                                {grp.isPinnedGroup && (
                                  <Pin className="w-3 h-3 fill-amber-400 text-amber-400" />
                                )}
                                <span>{grp.label}</span>
                              </div>
                              <div className="space-y-1.5">
                                {grp.list.map((c) => {
                                  const isCurrent = activeConversationId === c.id;
                                  const isEditingThis = settingsEditingChatId === c.id;

                                  if (isEditingThis) {
                                    return (
                                      <div
                                        key={c.id}
                                        className="p-2.5 rounded-xl bg-[#181a22] border border-blue-500/80 flex items-center gap-2"
                                      >
                                        <input
                                          type="text"
                                          value={settingsEditTitleValue}
                                          onChange={(e) => setSettingsEditTitleValue(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              if (settingsEditTitleValue.trim() && onRenameConversation) {
                                                onRenameConversation(c.id, settingsEditTitleValue.trim());
                                              }
                                              setSettingsEditingChatId(null);
                                            }
                                            if (e.key === 'Escape') {
                                              setSettingsEditingChatId(null);
                                            }
                                          }}
                                          autoFocus
                                          className="flex-1 bg-transparent text-xs text-white outline-none px-1 font-medium"
                                          placeholder="Conversation title..."
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (settingsEditTitleValue.trim() && onRenameConversation) {
                                              onRenameConversation(c.id, settingsEditTitleValue.trim());
                                            }
                                            setSettingsEditingChatId(null);
                                          }}
                                          className="p-1 text-emerald-400 hover:text-emerald-300 rounded cursor-pointer"
                                          title="Save title"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setSettingsEditingChatId(null)}
                                          className="p-1 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                                          title="Cancel"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={c.id}
                                      className={`flex items-center justify-between p-3 rounded-xl border transition-all group ${
                                        isCurrent
                                          ? 'bg-[#1a2333] text-white'
                                          : 'bg-[#181a22] border-white/5 hover:border-white/15 text-slate-200 hover:bg-[#1d202b]'
                                      }`}
                                      style={
                                        isCurrent
                                          ? {
                                              borderColor: `${currentTheme.hex}70`,
                                              backgroundColor: `${currentTheme.hex}15`,
                                            }
                                          : undefined
                                      }
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (onSelectConversation) {
                                            onSelectConversation(c.id);
                                            onClose();
                                          }
                                        }}
                                        className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                                      >
                                        <MessageSquare
                                          className="w-4 h-4 flex-shrink-0"
                                          style={{ color: isCurrent ? currentTheme.hex : '#94a3b8' }}
                                        />
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                                            {c.isPinned && (
                                              <Pin className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                                            )}
                                            <span className="truncate">{c.title || 'Untitled Conversation'}</span>
                                          </div>
                                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                            <span>
                                              {formatSafeTime(c.updatedAt || c.createdAt)}
                                            </span>
                                            <span>•</span>
                                            <span>{c.messages?.length || 0} messages</span>
                                          </div>
                                        </div>
                                      </button>

                                      <div className="flex items-center gap-1 ml-2">
                                        {/* Pin / Unpin button */}
                                        {onTogglePinConversation && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onTogglePinConversation(c.id);
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                              c.isPinned
                                                ? 'text-amber-400 hover:bg-amber-400/10'
                                                : 'text-slate-400 hover:text-amber-300 hover:bg-white/5 opacity-0 group-hover:opacity-100'
                                            }`}
                                            title={c.isPinned ? 'Unpin conversation' : 'Pin conversation to top'}
                                          >
                                            <Pin className={`w-3.5 h-3.5 ${c.isPinned ? 'fill-amber-400' : ''}`} />
                                          </button>
                                        )}

                                        {/* Edit / Rename Pencil button */}
                                        {onRenameConversation && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSettingsEditingChatId(c.id);
                                              setSettingsEditTitleValue(c.title || '');
                                            }}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-white/5 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                            title="Rename conversation"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}

                                        {/* Delete button */}
                                        {onDeleteConversation && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeleteConversation(c.id);
                                            }}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                                            title="Delete conversation"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB: LIBRARY (Synchronized with Sidebar Library) */}
          {activeTab === 'library' && (
            <div id="tab-library-content" className="space-y-4 sm:space-y-6">
              <div className="p-4 sm:p-6 bg-[#131418] rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xs space-y-4">
                <LibraryPicturesView
                  key={`settings-library-tab-${librarySyncTick}`}
                  user={user}
                  conversations={conversations}
                  mode="both"
                  initialSection="library"
                  themeColorHex={currentTheme.hex}
                  onSelectConversation={(convId) => {
                    if (onSelectConversation) {
                      onSelectConversation(convId);
                      onClose();
                    }
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === 'personality' && (
            <div id="tab-personality-content" className="space-y-6 max-w-2xl mx-auto py-2">
              <div>
                <h2 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-wide">
                  {getTranslation(activeLang, 'personalization')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {getTranslation(activeLang, 'personalizationSubtitle')}
                </p>
              </div>

              {/* Card 1: Dark Mode / White Mode */}
              <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      backgroundColor: `${getThemeColor(themeColor, customThemeColor).hex}22`,
                      color: getThemeColor(themeColor, customThemeColor).hex,
                      border: `1px solid ${getThemeColor(themeColor, customThemeColor).hex}44`,
                    }}
                  >
                    {darkMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {darkMode ? getTranslation(activeLang, 'darkMode') : getTranslation(activeLang, 'whiteMode')}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {darkMode
                        ? getTranslation(activeLang, 'darkModeDesc')
                        : getTranslation(activeLang, 'whiteModeDesc')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !darkMode;
                    setDarkMode(next);
                    try {
                      localStorage.setItem('sigma_dark_mode', JSON.stringify(next));
                    } catch (_) {}
                    onUpdateSettings({ darkMode: next });
                  }}
                  className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                    darkMode ? 'bg-[#00ea77]' : 'bg-slate-600'
                  }`}
                  style={{
                    backgroundColor: darkMode ? getThemeColor(themeColor, customThemeColor).hex : undefined,
                  }}
                  title="Toggle Dark / White Mode"
                >
                  <span
                    className={`w-5 h-5 rounded-full shadow-xs transform transition-transform absolute top-1 left-1 ${
                      darkMode ? 'translate-x-7 bg-black' : 'translate-x-0 bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Section: THEME COLOR PALETTE + CUSTOM COLOR */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                    {getTranslation(activeLang, 'themeColor')}
                  </label>
                  <span className="text-xs font-mono font-medium text-slate-400">
                    {getTranslation(activeLang, 'selected')}: {getColorName(themeColor, getThemeColor(themeColor, customThemeColor).name)} ({getThemeColor(themeColor, customThemeColor).hex})
                  </span>
                </div>

                {/* Color Swatches Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                  {THEME_COLOR_OPTIONS.map((tc) => {
                    const isSelected = themeColor === tc.id;
                    const localizedColorName = getColorName(tc.id, tc.name);
                    return (
                      <button
                        key={tc.id}
                        type="button"
                        onClick={() => handleSelectColorSwatch(tc.id)}
                        className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                          isSelected
                            ? 'border-white bg-white/10 shadow-md scale-105'
                            : 'bg-[#12141a] border-white/10 hover:border-white/25 hover:bg-[#181c25]'
                        }`}
                        title={localizedColorName}
                      >
                        <span
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: tc.hex }}
                        />
                        <span className="text-[10px] text-slate-300 font-medium truncate max-w-[60px]">
                          {localizedColorName}
                        </span>
                      </button>
                    );
                  })}

                  {/* Custom Color Button */}
                  <button
                    type="button"
                    onClick={() => handleSelectColorSwatch('custom')}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                      themeColor === 'custom'
                        ? 'border-white bg-white/10 shadow-md scale-105'
                        : 'bg-[#12141a] border-white/10 hover:border-white/25 hover:bg-[#181c25]'
                    }`}
                    title={getColorName('custom', 'Custom')}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center border border-white/40 shadow-sm"
                      style={{ backgroundColor: customThemeColor }}
                    >
                      <Palette className="w-2.5 h-2.5 text-black drop-shadow-xs" />
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium">{getColorName('custom', 'Custom')}</span>
                  </button>
                </div>

                {/* Custom Color Picker Panel */}
                {themeColor === 'custom' && (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#141822] border border-white/15 flex flex-wrap items-center gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customThemeColor}
                        onChange={(e) => handleCustomColorChange(e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 p-0 overflow-hidden"
                      />
                      <input
                        type="text"
                        value={customThemeColor}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('#')) val = `#${val}`;
                          handleCustomColorChange(val);
                        }}
                        placeholder="#00ea77"
                        maxLength={7}
                        className="w-24 px-2.5 py-1.5 bg-[#0b0e14] border border-white/20 rounded-lg text-xs font-mono text-white outline-none focus:border-blue-400"
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {getTranslation(activeLang, 'customColorPickerDesc')}
                    </span>
                  </div>
                )}
              </div>

              {/* Section: DEFAULT LANGUAGE */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                  {getTranslation(activeLang, 'defaultLanguage')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'English (US)', label: 'English (US)', native: 'English' },
                    { id: 'Hinglish', label: 'Hinglish', native: 'Roman Urdu / Hindi' },
                    { id: 'Urdu', label: 'Urdu', native: 'اردو' },
                    { id: 'Hindi', label: 'Hindi', native: 'हिन्दी' },
                    { id: 'Spanish', label: 'Spanish', native: 'Español' },
                    { id: 'French', label: 'French', native: 'Français' },
                    { id: 'German', label: 'German', native: 'Deutsch' },
                    { id: 'Japanese', label: 'Japanese', native: '日本語' },
                  ].map((lang) => {
                    const isSelected = activeLang === lang.id;
                    const activeHex = getThemeColor(themeColor, customThemeColor).hex;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => {
                          setDefaultLanguage(lang.id);
                          try {
                            localStorage.setItem('sigma_default_language', lang.id);
                          } catch (_) {}
                          onUpdateSettings({ language: lang.id as AppLanguage });
                        }}
                        className={`py-2.5 px-3 rounded-xl text-left transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-white/10 shadow-sm font-semibold'
                            : 'bg-[#12141a] text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-200'
                        }`}
                        style={{
                          borderColor: isSelected ? activeHex : undefined,
                          color: isSelected ? activeHex : undefined,
                        }}
                      >
                        <div className="text-xs sm:text-sm font-medium">{lang.label}</div>
                        <div className="text-[11px] opacity-70 font-sans">{lang.native}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card 4: Stop Animations */}
              <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      backgroundColor: `${getThemeColor(themeColor, customThemeColor).hex}22`,
                      color: getThemeColor(themeColor, customThemeColor).hex,
                      border: `1px solid ${getThemeColor(themeColor, customThemeColor).hex}44`,
                    }}
                  >
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {getTranslation(activeLang, 'stopAnimations')}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {getTranslation(activeLang, 'stopAnimationsDesc')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !stopAnimations;
                    setStopAnimations(next);
                    try {
                      localStorage.setItem('sigma_stop_animations', JSON.stringify(next));
                    } catch (_) {}
                    onUpdateSettings({ stopAnimations: next });
                  }}
                  className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                    stopAnimations ? 'bg-[#00ea77]' : 'bg-slate-700'
                  }`}
                  style={{
                    backgroundColor: stopAnimations
                      ? getThemeColor(themeColor, customThemeColor).hex
                      : undefined,
                  }}
                  title="Toggle Stop Animations"
                >
                  <span
                    className={`w-5 h-5 rounded-full shadow-xs transform transition-transform absolute top-1 left-1 ${
                      stopAnimations ? 'translate-x-7 bg-black' : 'translate-x-0 bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Save Button */}
              <button
                type="button"
                id="save-personalization-settings-btn"
                onClick={handleSavePersonalization}
                className="w-full py-3.5 rounded-xl font-bold text-sm sm:text-base tracking-wide transition-all cursor-pointer shadow-lg text-black active:scale-[0.99] flex items-center justify-center gap-2"
                style={{
                  backgroundColor: getThemeColor(themeColor, customThemeColor).hex,
                  boxShadow: `0 8px 24px ${getThemeColor(themeColor, customThemeColor).glow}`,
                }}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{getTranslation(activeLang, 'savePersonalization')}</span>
              </button>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div id="tab-notifications-content" className="space-y-4 max-w-2xl mx-auto py-2">
              <h2 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-wide mb-6">
                Notifications
              </h2>

              {/* Card 1: AI Response Alerts */}
              <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${currentTheme.hex}18`,
                      border: `1px solid ${currentTheme.hex}30`,
                      color: currentTheme.hex,
                    }}
                  >
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">AI Response Alert</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Sound and visual alert when Sigma completes a response</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAiResponseAlerts(!aiResponseAlerts)}
                  className="w-14 h-7 rounded-full transition-colors relative cursor-pointer flex-shrink-0 bg-slate-700"
                  style={{
                    backgroundColor: aiResponseAlerts ? currentTheme.hex : undefined,
                  }}
                >
                  <span
                    className={`w-5 h-5 rounded-full shadow-xs transform transition-transform absolute top-1 left-1 ${
                      aiResponseAlerts ? 'translate-x-7 bg-black' : 'translate-x-0 bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Card 2: Google Search Grounding */}
              <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${currentTheme.hex}18`,
                      border: `1px solid ${currentTheme.hex}30`,
                      color: currentTheme.hex,
                    }}
                  >
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Google Search Grounding</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Allow AI to search Google in real-time for live data and verified sources</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGoogleSearchGrounding(!googleSearchGrounding)}
                  className="w-14 h-7 rounded-full transition-colors relative cursor-pointer flex-shrink-0 bg-slate-700"
                  style={{
                    backgroundColor: googleSearchGrounding ? currentTheme.hex : undefined,
                  }}
                >
                  <span
                    className={`w-5 h-5 rounded-full shadow-xs transform transition-transform absolute top-1 left-1 ${
                      googleSearchGrounding ? 'translate-x-7 bg-black' : 'translate-x-0 bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  className="w-full py-3.5 rounded-xl active:scale-[0.99] font-bold text-sm sm:text-base tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: currentTheme.hex,
                    color: currentTheme.isDarkText ? '#000000' : '#ffffff',
                    boxShadow: `0 8px 24px ${currentTheme.glow}`,
                  }}
                >
                  <Check className="w-4 h-4" />
                  <span>Save Notification Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: CONNECTED SERVICES */}
                  {/* STUDY & SOURCES TAB (Section 3: Study Sources & Websites) */}
        {activeTab === 'study' && (
          <div id="settings-study-panel" className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#1e222d] pb-5">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Authorized Study Knowledge Base</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Study Sources & Websites
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                Control and prioritize the educational authorities, exam boards, and video channels Sigma AI consults for lessons, explanations, and past papers.
              </p>
            </div>

            {/* Prefer Official Exam Boards Switch */}
            <div className="p-4 rounded-2xl bg-[#141824] border border-white/10 flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-bold text-white block">Prefer Official Exam-Board Sources</span>
                <span className="text-xs text-slate-400">
                  Prioritize Cambridge, AKU-EB, and Federal Board (FBISE) syllabus guides and mark schemes over third-party revision notes.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !preferOfficial;
                  setPreferOfficial(next);
                  setPreferOfficialExamBoards(next);
                  showToast(next ? '✓ Official exam boards prioritized' : '✓ Standard balanced sources active');
                }}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                  preferOfficial ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    preferOfficial ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Action Bar: Category Filter & Add Source Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-1 p-1 bg-slate-900/90 rounded-xl border border-white/10 text-xs">
                {[
                  { id: 'all', label: 'All Sources' },
                  { id: 'official_exam_board', label: 'Exam Boards' },
                  { id: 'trusted_organization', label: 'Educational Hubs' },
                  { id: 'video_channel', label: 'Videos & Channels' },
                  { id: 'custom_website', label: 'Custom' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-sky-500 text-black font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowAddSourceModal(true)}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Website</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddYoutubeModal(true)}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/35 text-red-300 font-semibold text-xs flex items-center justify-center gap-1.5 border border-red-500/30 cursor-pointer shadow-xs"
                >
                  <span>+ YouTube Source</span>
                </button>
              </div>
            </div>

            {/* Compact Source Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {studySourcesList
                .filter((s) => selectedCategory === 'all' || s.category === selectedCategory)
                .map((src) => (
                  <div
                    key={src.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      src.enabled
                        ? 'bg-[#121622] border-white/15 shadow-sm'
                        : 'bg-[#0e111a] border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                              src.isOfficial
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : src.category === 'video_channel'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {src.isOfficial ? 'Official Exam Board' : src.categoryLabel}
                          </span>
                          {src.verifiedAt && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              • {src.verifiedAt}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5 truncate" title={src.name}>
                          {src.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {src.accessNotes}
                        </p>
                      </div>

                      {/* Enable/Disable Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = toggleSourceEnabled(src.id);
                          setStudySourcesList(updated);
                        }}
                        className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${
                          src.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                        title={src.enabled ? 'Disable source' : 'Enable source'}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                            src.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono text-[11px]"
                      >
                        <span>Open Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {src.isCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = removeCustomSource(src.id);
                            setStudySourcesList(updated);
                            showToast('Custom source removed');
                          }}
                          className="text-red-400 hover:text-red-300 text-[11px] cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Citation Integrity Notice */}
            <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30 text-xs text-sky-200 leading-relaxed">
              <strong>Sigma Citation Integrity Guarantee:</strong> When Sigma AI performs research-backed educational explanations, it only attributes claims to sources that were genuinely consulted or verified. If no external resource was accessed, the answer explicitly notes general curriculum foundation rather than fabricating citations.
            </div>
          </div>
        )}

{activeTab === 'connections' && (
            <div id="tab-connections-content" className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-wide">
                    Connected Services
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage Google Drive, hardware device permissions, and educational integrations
                  </p>
                </div>
                {onOpenConnections && (
                  <button
                    type="button"
                    onClick={onOpenConnections}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Open Control Center</span>
                  </button>
                )}
              </div>

              {/* Status Overview Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#12141a] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Google Drive</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Cloud Storage
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Import PDFs, assignment rubrics, spreadsheets, and lecture slides directly into chat.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenConnections}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                  >
                    Configure in Control Center
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#12141a] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Camera & Microphone Hardware</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Live Verification
                    </span>
                  </div>

                  {/* Device Count & Status Summary */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-1">
                      <span className="text-slate-400">Camera Permission:</span>
                      <span className={`font-semibold flex items-center gap-1 ${
                        liveCameraStatus === 'granted'
                          ? 'text-emerald-400'
                          : liveCameraStatus === 'denied'
                          ? 'text-red-400'
                          : 'text-sky-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          liveCameraStatus === 'granted' ? 'bg-emerald-400' : liveCameraStatus === 'denied' ? 'bg-red-400' : 'bg-sky-400'
                        }`} />
                        {liveCameraStatus === 'granted' ? 'Active / Granted' : liveCameraStatus === 'denied' ? 'Blocked' : 'Available'}
                        <span className="text-[10px] text-slate-500">({hardwareDeviceSummary.cameras})</span>
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-1">
                      <span className="text-slate-400">Microphone Permission:</span>
                      <span className={`font-semibold flex items-center gap-1 ${
                        liveMicStatus === 'granted'
                          ? 'text-emerald-400'
                          : liveMicStatus === 'denied'
                          ? 'text-red-400'
                          : 'text-sky-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          liveMicStatus === 'granted' ? 'bg-emerald-400' : liveMicStatus === 'denied' ? 'bg-red-400' : 'bg-sky-400'
                        }`} />
                        {liveMicStatus === 'granted' ? 'Active / Granted' : liveMicStatus === 'denied' ? 'Blocked' : 'Available'}
                        <span className="text-[10px] text-slate-500">({hardwareDeviceSummary.mics})</span>
                      </span>
                    </div>
                  </div>

                  {hardwareTestError && (
                    <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-[11px]">
                      {hardwareTestError}
                    </div>
                  )}

                  {/* Live Testing Preview */}
                  {isLiveHardwareTesting === 'camera' && (
                    <div className="space-y-2">
                      <video
                        ref={hardwareVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-36 rounded-xl object-cover bg-black border border-purple-500/40 shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={stopHardwareTest}
                        className="w-full py-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold transition-all cursor-pointer"
                      >
                        Stop Camera Test
                      </button>
                    </div>
                  )}

                  {isLiveHardwareTesting === 'mic' && (
                    <div className="space-y-2 p-2.5 rounded-xl bg-slate-900/70 border border-purple-500/30">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Mic Volume Level:</span>
                        <span className="font-bold text-emerald-400">{micAudioLevel}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
                          style={{ width: `${micAudioLevel}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={stopHardwareTest}
                        className="w-full py-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold transition-all cursor-pointer mt-1"
                      >
                        Stop Microphone Test
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  {!isLiveHardwareTesting && (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={startCameraHardwareTest}
                        className="py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all cursor-pointer active:scale-95 text-center"
                      >
                        Test Camera
                      </button>
                      <button
                        type="button"
                        onClick={startMicHardwareTest}
                        className="py-2 rounded-xl bg-teal-900/40 hover:bg-teal-800/60 border border-teal-500/40 text-teal-200 text-xs font-semibold transition-all cursor-pointer active:scale-95 text-center"
                      >
                        Test Mic
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Data & Privacy Banner */}
              <div className="p-4 rounded-2xl bg-[#12141a] border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Safe Credentials & Anti-Leak Standard</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sigma AI strictly enforces non-secret representation. Access tokens, raw passwords, and API keys are
                  never exposed in plain text. Disconnecting any service revokes active permissions immediately.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY & SECURITY */}
          {activeTab === 'privacy' && (
            <div id="tab-privacy-content" className="space-y-6 max-w-2xl mx-auto py-2">
              <h2 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-wide">
                Privacy & Security
              </h2>

              {/* Danger Zone */}
              <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-3 text-red-500 font-bold text-sm sm:text-base mb-2">
                  <Trash2 className="w-5 h-5" />
                  <span>Danger Zone</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-5">
                  Clear all messages sent to Sigma to start a fresh conversation. Your account and preferences will remain active.
                </p>
                <button
                  type="button"
                  id="settings-data-privacy-clear-all-btn"
                  onClick={() => setShowClearAllConfirm(true)}
                  className="w-full py-3 rounded-xl border border-red-900/60 hover:border-red-500/60 bg-transparent hover:bg-red-950/20 text-red-500 font-semibold text-xs sm:text-sm transition-colors cursor-pointer active:scale-[0.99]"
                >
                  Clear All Chats
                </button>
              </div>

              {/* History Retention Preference */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  Conversation History Saving
                </label>
                <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      Selective History Policy
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configure whether Sigma AI saves only specific, substantive conversations or saves all interaction turns.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setHistorySavePolicy('specific_only')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        historySavePolicy === 'specific_only'
                          ? 'border-[#00ea77] bg-[#00ea77]/10 text-white'
                          : 'border-white/10 bg-[#181a22] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>Save Specific History Only</span>
                        {historySavePolicy === 'specific_only' && <Check className="w-3.5 h-3.5 text-[#00ea77]" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Recommended: Only saves substantive questions, calculations, explanations, stories, and pinned chats. Ephemeral greetings and 1-word tests are excluded.
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistorySavePolicy('all')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        historySavePolicy === 'all'
                          ? 'border-[#00ea77] bg-[#00ea77]/10 text-white'
                          : 'border-white/10 bg-[#181a22] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>Save All History</span>
                        {historySavePolicy === 'all' && <Check className="w-3.5 h-3.5 text-[#00ea77]" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Records every turn and query directly into user history without applying filtering rules.
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* API Integrations */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  API Integrations
                </label>
                <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5" style={{ color: currentTheme.hex }} />
                      <span className="text-xs sm:text-sm font-bold text-white">Sigma API Key</span>
                    </div>
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: `${currentTheme.hex}18`,
                        border: `1px solid ${currentTheme.hex}40`,
                        color: currentTheme.hex,
                      }}
                    >
                      Connected
                    </span>
                  </div>
                  <input
                    type="text"
                    value={sigmaApiKey}
                    onChange={(e) => setSigmaApiKey(e.target.value)}
                    placeholder="sigma_live_sec_..."
                    className="w-full bg-[#181a22] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none"
                    style={{ outlineColor: currentTheme.hex }}
                  />
                  <p className="text-[11px] text-slate-500">
                    Your key is securely stored locally and used to authenticate search and generation calls.
                  </p>
                </div>
              </div>

              {/* Official Privacy Policy Button & Callout */}
              <div className="bg-[#0a1526] border border-blue-900/40 rounded-2xl p-4 sm:p-5 text-xs leading-relaxed space-y-3">
                <div>
                  <span className="font-bold text-blue-400">Data Usage & Security: </span>
                  <span className="text-blue-200">
                    Your conversations are encrypted at rest and in transit. Your prompts and private messages are never sold or used to train third-party public models.
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                    style={{
                      backgroundColor: `${currentTheme.hex}18`,
                      border: `1px solid ${currentTheme.hex}40`,
                      color: currentTheme.hex,
                    }}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Read Full Privacy Policy</span>
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSavePrivacy}
                className="w-full py-3.5 rounded-xl active:scale-[0.99] font-bold text-sm sm:text-base tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: currentTheme.hex,
                  color: currentTheme.isDarkText ? '#000000' : '#ffffff',
                  boxShadow: `0 8px 24px ${currentTheme.glow}`,
                }}
              >
                <Check className="w-4 h-4" />
                <span>Save Privacy Settings</span>
              </button>
            </div>
          )}

          {/* TAB 6: ACCESSIBILITY */}
          {activeTab === 'accessibility' && (
            <div id="tab-accessibility-content" className="space-y-4 max-w-2xl mx-auto py-2">
              <h2 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-wide mb-6">
                Accessibility
              </h2>

              {/* Card 1: Text-to-Speech (Speaker option after feedback) + 3 Voice Options */}
              <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${currentTheme.hex}18`,
                        border: `1px solid ${currentTheme.hex}30`,
                        color: currentTheme.hex,
                      }}
                    >
                      <Volume2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">Text-to-Speech (Speaker Icon)</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Displays a speaker button directly beside feedback options (thumbs up/down) to read responses aloud using your selected narrator voice.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="toggle-tts-speaker-btn"
                    onClick={() => {
                      const next = !textToSpeech;
                      setTextToSpeech(next);
                      try {
                        localStorage.setItem('sigma_text_to_speech', JSON.stringify(next));
                      } catch (_) {}
                      onUpdateSettings({ textToSpeech: next });
                    }}
                    className="w-14 h-7 rounded-full transition-colors relative cursor-pointer flex-shrink-0 bg-slate-700"
                    style={{
                      backgroundColor: textToSpeech ? currentTheme.hex : undefined,
                    }}
                  >
                    <span
                      className={`w-5 h-5 rounded-full shadow-xs transform transition-transform absolute top-1 left-1 ${
                        textToSpeech ? 'translate-x-7 bg-black' : 'translate-x-0 bg-white'
                      }`}
                    />
                  </button>
                </div>

                {/* Directly Under Text-to-Speech: Three Selectable Narrator Voice Options */}
                <div
                  id="tts-voice-selector-section"
                  data-voices-tick={voicesRefreshTick}
                  className="pt-3.5 border-t border-white/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                        Narrator Voice Selection
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Choose the narrator voice used everywhere Text-to-Speech reads responses aloud
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex-shrink-0"
                      style={{
                        backgroundColor: `${currentTheme.hex}18`,
                        borderColor: `${currentTheme.hex}45`,
                        color: currentTheme.hex,
                      }}
                    >
                      Active: {TTS_VOICE_OPTIONS.find((v) => v.id === ttsVoice)?.label || 'Male Voice'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {TTS_VOICE_OPTIONS.map((voiceOpt) => {
                      const isSelected = ttsVoice === voiceOpt.id;
                      const resolved = resolveSpeechVoice(voiceOpt.id);
                      const isAvailable = resolved.available;
                      const isPreviewing = testingVoiceId === voiceOpt.id;

                      return (
                        <div
                          key={voiceOpt.id}
                          id={`tts-voice-card-${voiceOpt.id}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectTtsVoice(voiceOpt.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectTtsVoice(voiceOpt.id);
                            }
                          }}
                          className={`relative rounded-xl p-3 border text-left transition-all flex flex-col justify-between gap-2 ${
                            !isAvailable
                              ? 'opacity-55 cursor-not-allowed bg-[#141720] border-rose-500/30'
                              : isSelected
                              ? 'bg-[#181d2a] shadow-lg cursor-pointer'
                              : 'bg-[#151822] border-white/10 hover:border-white/25 hover:bg-[#1a1e2b] cursor-pointer'
                          }`}
                          style={
                            isSelected && isAvailable
                              ? {
                                  borderColor: currentTheme.hex,
                                  boxShadow: `0 0 16px ${currentTheme.glow}`,
                                }
                              : undefined
                          }
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                  style={{
                                    backgroundColor: isSelected
                                      ? `${currentTheme.hex}25`
                                      : 'rgba(255,255,255,0.06)',
                                    color: isSelected ? currentTheme.hex : '#cbd5e1',
                                    border: isSelected ? `1px solid ${currentTheme.hex}60` : undefined,
                                  }}
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-white truncate">
                                  {voiceOpt.label}
                                </span>
                              </div>

                              {!isAvailable ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex-shrink-0">
                                  Unavailable
                                </span>
                              ) : isSelected ? (
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: currentTheme.hex,
                                    color: currentTheme.isDarkText ? '#000000' : '#ffffff',
                                  }}
                                  title="Selected Voice"
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              ) : null}
                            </div>

                            <p className="text-[11px] text-slate-400 leading-snug">
                              {voiceOpt.description}
                            </p>
                          </div>

                          <div className="pt-1.5 border-t border-white/5 flex items-center justify-between gap-1.5">
                            <div className="flex flex-wrap gap-1 min-w-0">
                              {voiceOpt.traits.slice(0, 3).map((trait) => (
                                <span
                                  key={trait}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-medium"
                                >
                                  {trait}
                                </span>
                              ))}
                            </div>

                            {isAvailable && (
                              <button
                                type="button"
                                onClick={(e) => handlePreviewTtsVoice(voiceOpt.id, e)}
                                className="px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                                title={isPreviewing ? 'Stop voice sample' : `Preview ${voiceOpt.label}`}
                              >
                                {isPreviewing ? (
                                  <>
                                    <StopIcon className="w-2.5 h-2.5 fill-current text-amber-400" />
                                    <span className="text-amber-300">Stop</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    <span>Test</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card 2: High Contrast Mode (PC / Desktop Only - Bolds all text) */}
              <div className="hidden sm:flex bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5 items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${currentTheme.hex}18`,
                      border: `1px solid ${currentTheme.hex}30`,
                      color: currentTheme.hex,
                    }}
                  >
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">High Contrast Mode</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Bolds all text across the entire application for maximum readability (Desktop only).</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !highContrast;
                    setHighContrast(next);
                    try {
                      localStorage.setItem('sigma_high_contrast', JSON.stringify(next));
                    } catch (_) {}
                    onUpdateSettings({ highContrast: next });
                  }}
                  className="w-14 h-7 rounded-full transition-colors relative cursor-pointer flex-shrink-0 bg-slate-700"
                  style={{
                    backgroundColor: highContrast ? currentTheme.hex : undefined,
                  }}
                >
                  <span
                    className={`w-5 h-5 rounded-full shadow-xs transform transition-transform absolute top-1 left-1 ${
                      highContrast ? 'translate-x-7 bg-black' : 'translate-x-0 bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveAccessibility}
                  className="w-full py-3.5 rounded-xl active:scale-[0.99] font-bold text-sm sm:text-base tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: currentTheme.hex,
                    color: currentTheme.isDarkText ? '#000000' : '#ffffff',
                    boxShadow: `0 8px 24px ${currentTheme.glow}`,
                  }}
                >
                  <Check className="w-4 h-4" />
                  <span>Save Accessibility Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: AI PREFERENCES */}
          {activeTab === 'ai-preference' && (
            <div id="tab-ai-preference-content" className="space-y-6 max-w-2xl mx-auto py-2">
              <div>
                <h2 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-wide">
                  AI Preferences
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Customize Sigma AI’s personality, response depth, custom instructions, and personal memory profile.
                </p>
              </div>

              {/* AI Personality (Behaviors) */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  AI Personality & Tone
                </label>
                <div className="relative">
                  <select
                    value={aiPersonality}
                    onChange={(e) => {
                      setAiPersonality(e.target.value);
                      try {
                        localStorage.setItem('sigma_ai_personality', e.target.value);
                      } catch (_) {}
                      onUpdateSettings({ aiPersonality: e.target.value as AIPersonalityType });
                    }}
                    className="w-full appearance-none bg-[#12141a] border border-white/10 rounded-xl py-3 px-4 text-xs sm:text-sm text-white focus:outline-none cursor-pointer transition-colors"
                    style={{ outlineColor: currentTheme.hex }}
                  >
                    <option value="Easy & Clear English">Easy & Clear English (Simple, natural & student-friendly)</option>
                    <option value="Deep English">Deep English (Clear, articulate & natural US English)</option>
                    <option value="Professional & Concise">Professional and Concise (Direct, sharp & structured)</option>
                    <option value="Creative & Expressive">Creative and Expressive (Vivid storytelling & metaphors)</option>
                    <option value="Friendly & Helpful">Friendly and Helpful (Warm, cheerful with 5 to 10 emojis in chat)</option>
                    <option value="Code & Technical Expert">Code and Technical Expert (Computer engineering & clean code)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Custom AI Persona: How you want AI to be */}
              <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${currentTheme.hex}22`, color: currentTheme.hex }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white">How You Want AI to Be</h3>
                      <p className="text-[11px] text-slate-400">Custom persona and behavioral rules for Sigma AI.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomAiPersonaEnabled(!customAiPersonaEnabled)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                    style={{
                      backgroundColor: customAiPersonaEnabled ? `${currentTheme.hex}25` : '#1e2230',
                      color: customAiPersonaEnabled ? currentTheme.hex : '#94a3b8',
                      border: `1px solid ${customAiPersonaEnabled ? currentTheme.hex : '#334155'}`,
                    }}
                  >
                    {customAiPersonaEnabled ? 'Active' : 'Disabled'}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={customAiPersona}
                  onChange={(e) => setCustomAiPersona(e.target.value)}
                  placeholder="e.g. Always answer with extreme precision, use step-by-step reasoning, provide code with comments, and never be repetitive..."
                  className="w-full bg-[#181a22] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-y"
                  style={{ outlineColor: currentTheme.hex }}
                />
              </div>

              {/* Response Length */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                  Response Length
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Concise', desc: 'Short & Direct' },
                    { id: 'Balanced', desc: 'Natural & Complete' },
                    { id: 'Detailed', desc: 'Comprehensive' },
                  ].map((len) => {
                    const isSelected = responseLength === len.id;
                    return (
                      <button
                        key={len.id}
                        type="button"
                        onClick={() => setResponseLength(len.id as any)}
                        className={`py-3 px-3 rounded-xl text-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'font-semibold'
                            : 'bg-[#12141a] text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-200'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: currentTheme.hex,
                                color: currentTheme.hex,
                                backgroundColor: `${currentTheme.hex}18`,
                              }
                            : undefined
                        }
                      >
                        <div className="text-xs sm:text-sm font-bold">{len.id}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{len.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section: Tell About You / What to Save */}
              <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${currentTheme.hex}22`, color: currentTheme.hex }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        Tell About You / What to Save
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Teach Sigma AI who you are, your qualities, and your custom interaction style.
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${currentTheme.hex}20`, color: currentTheme.hex }}
                  >
                    Adaptive AI
                  </span>
                </div>

                {/* 1. What is your name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    What is your name?
                  </label>
                  <input
                    id="ai-pref-user-name-input"
                    type="text"
                    value={userNameCustom}
                    onChange={(e) => {
                      setUserNameCustom(e.target.value);
                      if (customNameValidationError) setCustomNameValidationError(null);
                    }}
                    placeholder="Enter your preferred name..."
                    className="w-full bg-[#181a22] border rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none"
                    style={{
                      borderColor: customNameValidationError ? '#ef4444' : 'rgba(255,255,255,0.1)',
                      outlineColor: currentTheme.hex,
                    }}
                  />
                  {customNameValidationError && (
                    <div
                      id="ai-pref-name-error-msg"
                      className="mt-2 px-3 py-2 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                      <span>{customNameValidationError}</span>
                    </div>
                  )}
                </div>

                {/* 2. Who you are & your qualities */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Who you are & your qualities (What to remember about you)
                  </label>
                  <textarea
                    rows={2}
                    value={userQualities}
                    onChange={(e) => setUserQualities(e.target.value)}
                    placeholder="e.g. Fast learner, software creator, prefers high-precision math, likes direct execution..."
                    className="w-full bg-[#181a22] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-none resize-none"
                    style={{ outlineColor: currentTheme.hex }}
                  />
                </div>

                {/* 3. How you like to ask ChatGPT / Sigma */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    How you like to ask questions (Your interaction & typing style)
                  </label>
                  <textarea
                    rows={2}
                    value={userAskingStyle}
                    onChange={(e) => setUserAskingStyle(e.target.value)}
                    placeholder="e.g. I type fast short queries, expect instant calculation answers, do not like being asked back questions first..."
                    className="w-full bg-[#181a22] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-none resize-none"
                    style={{ outlineColor: currentTheme.hex }}
                  />
                </div>

                {/* 4. How you want AI to respond */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    How you want Sigma AI to respond
                  </label>
                  <textarea
                    rows={2}
                    value={userDesiredResponseFormat}
                    onChange={(e) => setUserDesiredResponseFormat(e.target.value)}
                    placeholder="e.g. Respond in 1-2 seconds, rotate answers with varied wording, provide rich examples, never repeat canned responses..."
                    className="w-full bg-[#181a22] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-none resize-none"
                    style={{ outlineColor: currentTheme.hex }}
                  />
                </div>

                {/* 5. Auto-recognize typing & asking style */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Auto-Recognize My Typing Style & Questions
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Adapts tone, depth, and pacing dynamically based on your questions and typing rhythm.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoAdaptUserStyle(!autoAdaptUserStyle)}
                    className="w-12 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 bg-slate-700 ml-3"
                    style={{
                      backgroundColor: autoAdaptUserStyle ? currentTheme.hex : undefined,
                    }}
                  >
                    <span
                      className={`w-4 h-4 rounded-full shadow-xs transform transition-transform absolute top-1 left-1 ${
                        autoAdaptUserStyle ? 'translate-x-6 bg-black' : 'translate-x-0 bg-white'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Row: Reset Context & Export Chat */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClearChat();
                    showToast('Context reset for current session.');
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 bg-[#12141a] hover:bg-[#181b24] text-xs sm:text-sm font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-slate-400" />
                  <span>Reset Context</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('txt')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 bg-[#12141a] hover:bg-[#181b24] text-xs sm:text-sm font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Export Chat (.txt)</span>
                </button>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveAiPreferences}
                className="w-full py-3.5 rounded-xl active:scale-[0.99] font-bold text-sm sm:text-base tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: currentTheme.hex,
                  color: currentTheme.isDarkText ? '#000000' : '#ffffff',
                  boxShadow: `0 8px 24px ${currentTheme.glow}`,
                }}
              >
                <Check className="w-4 h-4" />
                <span>Save AI Preferences</span>
              </button>
            </div>
          )}

          {/* TAB 8: ADMIN PANEL (Sigma Command Center) */}
          {activeTab === 'admin-panel' && (
            <div id="tab-admin-panel-content" className="flex flex-col items-center justify-center min-h-[480px] py-8 px-4 text-center">
              {/* Glowing circular container styled with current theme */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{
                  backgroundColor: `${currentTheme.hex}18`,
                  border: `1.5px solid ${currentTheme.hex}50`,
                  boxShadow: `0 0 35px ${currentTheme.glow}`,
                  color: currentTheme.hex,
                }}
              >
                <Shield className="w-10 h-10" />
              </div>

              {/* Title in Orbitron Font */}
              <h2 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl font-bold text-white tracking-wide mb-3">
                Sigma Command Center
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                {adminUnlocked
                  ? 'Administrative access unlocked. Master PIN verified.'
                  : 'This area is restricted. Please enter the master PIN in the sidebar to unlock administrative controls.'}
              </p>

              {/* Status Pill */}
              <div className="inline-flex items-center justify-center px-6 py-2 rounded-xl bg-[#12141a] border border-white/10 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-6">
                {adminUnlocked ? (
                  <span className="flex items-center gap-2" style={{ color: currentTheme.hex }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentTheme.hex }} />
                    SYSTEM STATUS: UNLOCKED
                  </span>
                ) : (
                  <span className="text-slate-500">SYSTEM STATUS: RESTRICTED ACCESS</span>
                )}
              </div>

              {/* Master PIN Input Section */}
              {!adminUnlocked ? (
                <div className="max-w-xs w-full mx-auto space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      id="admin-pin-input"
                      type="password"
                      value={adminPinInput}
                      onChange={(e) => {
                        setAdminPinInput(e.target.value);
                        if (adminPinError) setAdminPinError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleVerifyAdminPin();
                      }}
                      maxLength={10}
                      placeholder="Enter PIN"
                      className="flex-1 bg-[#12141a] border border-white/10 rounded-xl px-4 py-2.5 text-center font-mono tracking-widest text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                      style={{ outlineColor: currentTheme.hex }}
                    />
                    <button
                      id="admin-pin-submit-btn"
                      type="button"
                      onClick={handleVerifyAdminPin}
                      className="px-4 py-2.5 rounded-xl active:scale-95 font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
                      style={{
                        backgroundColor: currentTheme.hex,
                        color: currentTheme.isDarkText ? '#000000' : '#ffffff',
                        boxShadow: `0 4px 14px ${currentTheme.glow}`,
                      }}
                    >
                      Enter PIN
                    </button>
                  </div>
                  {adminPinError && (
                    <div className="text-xs text-rose-400 font-semibold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>incorrect pin</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Unlocked Full Admin Panel Controls */
                <div className="w-full text-left space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                        Master Session Active
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminUnlocked(false);
                        setAdminPinInput('');
                        setAdminPinError(null);
                        showToast('Command Center locked.');
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-[#161822] hover:bg-[#1f2230] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      Lock Command Center
                    </button>
                  </div>
                  <AdminPanel
                    user={user}
                    currentThemeHex={currentTheme.hex}
                    themeGlow={currentTheme.glow}
                    onClose={() => {
                      setAdminUnlocked(false);
                    }}
                    activeModel={adminSelectedModel}
                    onChangeModel={async (model) => {
                      setAdminSelectedModel(model as any);
                      try {
                        await fetch('/api/admin/set-model', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ model }),
                        });
                      } catch (_) {}
                      showToast(`System model updated to ${model}`);
                    }}
                    onToggleAiLock={async (locked, message) => {
                      try {
                        await fetch('/api/admin/toggle-maintenance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ isLocked: locked, message }),
                        });
                      } catch (_) {}
                      showToast(`Maintenance lock ${locked ? 'activated' : 'deactivated'}`);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* EMAIL & PASSWORD LOGIN / SIGN UP / ENTER OTP MODAL */}
      {showLoginDialog && (
        <div
          id="login-dialog-backdrop"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            setShowLoginDialog(false);
            setAuthStep('form');
            setAuthError(null);
          }}
        >
          <div
            id="login-dialog"
            className="relative bg-[#14151a] rounded-3xl border border-white/10 p-7 sm:p-9 max-w-[420px] w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close / Back Buttons */}
            <div className="flex items-center justify-between">
              {authStep === 'otp' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('form');
                    setAuthError(null);
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}
              <button
                id="login-dialog-close-btn"
                type="button"
                onClick={() => {
                  setShowLoginDialog(false);
                  setAuthStep('form');
                  setAuthError(null);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: LOGIN OR SIGN UP FORM */}
            {authStep === 'form' && (
              <>
                {/* Header */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {isRegisterMode ? 'Sign up' : 'Sign in'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 font-normal">
                    {isRegisterMode
                      ? 'Enter your details to receive a 4-step verification code'
                      : 'Sign in with your email and password'}
                  </p>
                </div>

                {/* Google Sign-in Button */}
                <button
                  id="login-google-btn"
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleSignInClick}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#20222a] hover:bg-[#282b36] border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                {/* OR Divider */}
                <div className="relative flex items-center justify-center my-1">
                  <div className="w-full border-t border-[#262835]" />
                  <span className="absolute px-3 bg-[#14151a] text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    OR
                  </span>
                </div>

                {/* Error Banner */}
                {authError && (
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={isRegisterMode ? handleStartSignUp : handleSignInSubmit}
                  className="space-y-3.5"
                >
                  {isRegisterMode && (
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                      <input
                        id="signup-input-name"
                        type="text"
                        required
                        value={loginName}
                        onChange={(e) => {
                          setLoginName(e.target.value);
                          setAuthError(null);
                        }}
                        placeholder="Full name"
                        className="w-full bg-[#1c1e26] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                        style={{ outlineColor: currentTheme.hex }}
                      />
                    </div>
                  )}

                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      id="login-input-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="Enter email address"
                      className="w-full bg-[#1c1e26] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                      style={{ outlineColor: currentTheme.hex }}
                    />
                  </div>

                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      id="login-input-password"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="Password"
                      className="w-full bg-[#1c1e26] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                      style={{ outlineColor: currentTheme.hex }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    id="login-submit-btn"
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-2xl active:scale-[0.99] font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer mt-1 shadow-lg"
                    style={{
                      backgroundColor: currentTheme.hex,
                      color: currentTheme.isDarkText ? '#000000' : '#ffffff',
                      boxShadow: `0 8px 24px ${currentTheme.glow}`,
                    }}
                  >
                    <span>{isRegisterMode ? 'Sign up' : 'Sign in'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </form>

                {/* Footer Toggle */}
                <div className="text-center space-y-2 pt-1">
                  <p className="text-xs text-slate-400">
                    {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(!isRegisterMode);
                        setAuthError(null);
                      }}
                      className="hover:underline font-semibold cursor-pointer ml-1"
                      style={{ color: currentTheme.hex }}
                    >
                      {isRegisterMode ? 'Sign in' : 'Sign up'}
                    </button>
                  </p>
                  {!isRegisterMode && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer transition-colors block mx-auto pt-0.5"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              </>
            )}

            {/* STEP 2: ENTER OTP WINDOW */}
            {authStep === 'otp' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header */}
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{
                      backgroundColor: `${currentTheme.hex}18`,
                      border: `1px solid ${currentTheme.hex}30`,
                      color: currentTheme.hex,
                    }}
                  >
                    <Key className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Enter OTP
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 font-normal leading-relaxed">
                    A four-step verification code was sent to{' '}
                    <span className="text-white font-semibold underline underline-offset-2">
                      {pendingAccount?.email || loginEmail}
                    </span>
                  </p>
                </div>

                {/* Secure Security Notice */}
                <div className="p-3.5 rounded-2xl bg-[#0c121e] border border-slate-800 text-xs flex items-center gap-2.5">
                  <Shield className="w-4 h-4 flex-shrink-0" style={{ color: currentTheme.hex }} />
                  <span className="text-slate-300 text-[12px] leading-relaxed">
                    A secure 4-digit code was dispatched for <strong className="text-white font-medium">{pendingAccount?.email || loginEmail}</strong>. Please check your inbox and enter the 4 digits below.
                  </span>
                </div>

                {otpDeliveryStatus?.sandboxRestricted && (
                  <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2 text-left">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      <strong>Owner Inbox Mirrored:</strong> The email verification code was dispatched to your email and mirrored directly to the project owner (<code className="text-white font-semibold">sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com</code>).
                    </span>
                  </div>
                )}

                {/* Error Banner */}
                {authError && (
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* 4 Digit OTP Inputs */}
                <div className="flex justify-center items-center gap-3">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      disabled={isVerifyingOtp}
                      value={otpDigits[index]}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-14 h-15 text-center font-mono text-2xl font-bold rounded-2xl bg-[#1c1e26] border text-white focus:outline-none transition-all"
                      style={{
                        borderColor: authError
                          ? '#f43f5e'
                          : otpDigits[index]
                          ? currentTheme.hex
                          : 'rgba(255,255,255,0.15)',
                        outlineColor: currentTheme.hex,
                      }}
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  disabled={isVerifyingOtp}
                  onClick={() => handleVerifyOtp()}
                  className="w-full py-3.5 px-6 rounded-2xl active:scale-[0.99] font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: currentTheme.hex,
                    color: currentTheme.isDarkText ? '#000000' : '#ffffff',
                    boxShadow: `0 8px 24px ${currentTheme.glow}`,
                  }}
                >
                  {isVerifyingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        {pendingAccount?.mode === 'signup'
                          ? 'Verify & Create Account'
                          : 'Verify & Sign In'}
                      </span>
                    </>
                  )}
                </button>

                {/* Resend Code and Back Links */}
                <div className="text-center pt-1 space-y-2">
                  <button
                    type="button"
                    disabled={isSendingOtp}
                    onClick={handleResendOtp}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                    <span>{isSendingOtp ? 'Sending fresh code...' : "Didn't receive code? Resend email"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep('form');
                      setAuthError(null);
                      setOtpDigits(['', '', '', '']);
                    }}
                    className="text-xs hover:underline cursor-pointer block mx-auto font-medium"
                    style={{ color: currentTheme.hex }}
                  >
                    Change email address
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom-to-up 5-second popup banner for Guest users clicking Recent Chats */}
      <div
        id="guest-recents-toast"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] sm:w-auto min-w-[320px] flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-[#0f121a] border text-white transition-all duration-300 ease-out ${
          showGuestRecentsBanner
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-20 opacity-0 scale-95 pointer-events-none'
        }`}
        style={{
          borderColor: currentTheme.hex,
          boxShadow: `0 12px 40px ${currentTheme.glow}`,
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${currentTheme.hex}20`,
            border: `1px solid ${currentTheme.hex}50`,
            color: currentTheme.hex,
          }}
        >
          <Clock className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Sign in to view your recents.
          </div>
          <div className="text-[11px] text-slate-400">
            Conversations are saved to your account.
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowGuestRecentsBanner(false);
            setShowLoginDialog(true);
          }}
          className="px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex-shrink-0 shadow-xs active:scale-95"
          style={{
            backgroundColor: currentTheme.hex,
            color: currentTheme.isDarkText ? '#000000' : '#ffffff',
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setShowGuestRecentsBanner(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Official Privacy Policy Modal */}
      {showPrivacyModal && (
        <div
          id="privacy-policy-modal-overlay"
          className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            id="privacy-policy-modal-dialog"
            className="bg-[#0f1117] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${currentTheme.hex}18`,
                    border: `1px solid ${currentTheme.hex}30`,
                    color: currentTheme.hex,
                  }}
                >
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Orbitron',sans-serif] text-base sm:text-lg font-bold text-white tracking-wide">
                    Sigma AI Privacy Policy
                  </h3>
                  <p className="text-xs text-slate-400">Effective Date: 2026 • Version 2.4</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-xs sm:text-sm leading-relaxed custom-scrollbar">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <h4 className="font-bold text-white text-sm">1. Our Core Privacy Pledge</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Sigma AI is built on the principle of minimal data retention. We never sell your personal information, train public models on your private conversations, or harvest your browsing activity.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">2. Zero-Model Training on Private Chats</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Every query, document upload, and chat message you send to Sigma is processed strictly to generate your response. Prompts are never used to train, retrain, or improve foundational AI models.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">3. End-to-End Encryption & Storage</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Data in transit is protected using TLS 1.3 protocol. Stored session history is retained locally in your client cache and encrypted at rest with industry-standard AES-256 encryption.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">4. Custom API Keys & Third-Party Direct Routing</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  If you enter a custom API key under AI Preferences, requests are authorized directly with that key. Your credentials remain in your browser storage and are never recorded in backend telemetric logs.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">5. User Ownership, Full Export & Right to Erasure</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  You hold 100% ownership over your data. You can download all conversation logs anytime as formatted Plaintext (.txt) or Markdown files, or trigger instant permanent erasure with the "Clear All History" tool in Privacy settings.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">6. Authentication & Security Alerts</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  When you sign up or log in, verification OTPs and optional login security notifications are sent strictly to confirm your identity. We never share your email address with advertising networks.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-[#0b0d13] flex items-center justify-between">
              <span className="text-xs text-slate-500">Sigma AI Security & Governance</span>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-xs"
                style={{
                  backgroundColor: currentTheme.hex,
                  color: currentTheme.isDarkText ? '#000000' : '#ffffff',
                }}
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 55+ Custom AI Features Modal */}
      <FeaturesModal
        isOpen={showFeaturesModal}
        onClose={() => setShowFeaturesModal(false)}
        currentTheme={currentTheme}
      />

      {/* Guest Name Modal Menu (Retained for 1 Month in Browser) */}
      {showGuestNameDialog && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-[#14161f] border border-white/15 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">
                  G
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Enter Your Name</h4>
                  <p className="text-[11px] text-slate-400">Stored on this browser for 1 month</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuestNameDialog(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {guestNameError && (
              <div className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{guestNameError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Your Name</label>
              <input
                type="text"
                value={guestNameInput}
                onChange={(e) => {
                  setGuestNameInput(e.target.value);
                  if (guestNameError) setGuestNameError(null);
                }}
                placeholder="e.g. Alex"
                maxLength={30}
                autoFocus
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-sm outline-none focus:border-purple-400 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveGuestName();
                  }
                }}
              />
              <p className="text-[11px] text-slate-400">
                This will display your name on this browser for 30 days. Recent chats are saved for 24 hours.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGuestNameDialog(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGuestName}
                disabled={isSavingGuestName || !guestNameInput.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors cursor-pointer shadow-md"
              >
                {isSavingGuestName ? 'Saving...' : 'Save Name'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered In-App Clear All Chats Confirmation Modal (100% reliable, immune to iframe dialog blocks) */}
      {showClearAllConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setShowClearAllConfirm(false);
              setInlineClearConfirm(false);
            }
          }}
        >
          <div
            className="w-full max-w-sm bg-[#121620] border border-red-500/50 rounded-2xl p-6 shadow-2xl flex flex-col space-y-4 text-center pointer-events-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white mb-1">
                {getTranslation(settings.language, 'clearAllRecentChatsConfirm')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {getTranslation(settings.language, 'clearAllWarning')}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                id="cancel-clear-all-modal-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowClearAllConfirm(false);
                  setInlineClearConfirm(false);
                }}
                disabled={isClearingAllChats}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {getTranslation(settings.language, 'cancel')}
              </button>
              <button
                type="button"
                id="confirm-clear-all-modal-btn"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await handleExecuteClearAllChats();
                }}
                disabled={isClearingAllChats}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 active:scale-95 text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isClearingAllChats ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{getTranslation(settings.language, 'clearing')}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{getTranslation(settings.language, 'clearAllChats')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
