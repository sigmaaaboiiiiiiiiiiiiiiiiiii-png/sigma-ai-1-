export interface SourceItem {
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
}

export interface UsedFileSource {
  name: string;
  type: string;
  size?: string;
}

export interface VideoAttachment {
  name: string;
  size?: string;
  duration?: number;
  durationFormatted?: string;
  thumbnail?: string;
  dataUrl?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  keyframesCount?: number;
  keyframes?: { timestamp: string; dataUrl: string }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  images?: string[];
  videos?: VideoAttachment[];
  generatedImage?: string;
  sources?: SourceItem[];
  usedFiles?: UsedFileSource[];
  searchQueries?: string[];
  usedSearch?: boolean;
  searchFailed?: boolean;
  followUpActions?: string[];
  notice?: string;
  errorType?: 'network' | 'timeout' | 'api';
  isStreaming?: boolean;
  fullContent?: string;
  userPrompt?: string;
  specialMode?: 'powerpoint' | 'excel' | 'deep_search' | 'deep_think' | 'web_search' | null;
  action?: string;
  timestamp: Date;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
  userEmail?: string;
  isSpecificSaved?: boolean;
  isPinned?: boolean;
  anonymousSessionName?: string;
}

export interface UserProfile {
  id?: string;
  isLoggedIn: boolean;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  isVerifiedOwner?: boolean;
  authProvider?: 'google' | 'password' | 'guest';
}

export type SettingsTabType =
  | 'account'
  | 'recents'
  | 'library'
  | 'connections'
  | 'personality'
  | 'notifications'
  | 'privacy'
  | 'accessibility'
  | 'ai-preference'
  | 'admin-panel' | 'study';

export type AppLanguage =
  | 'English (US)'
  | 'Hinglish'
  | 'Urdu'
  | 'Hindi'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Japanese';

export type AIPersonalityType =
  | 'Easy & Clear English'
  | 'Deep English'
  | 'Professional & Concise'
  | 'Creative/Expressive'
  | 'Friendly/Helpful'
  | 'Code/Technical Expert';

export type ImageQualityType = 'Standard' | 'High' | 'Ultra';

export type ResponseLengthType = 'Concise' | 'Balanced' | 'Detailed';

export type TtsVoiceType = 'sigma' | 'boy' | 'male' | 'female' | 'kore' | 'fenrir';

export interface AppSettings {
  searchEnabled: boolean;
  responseStyle: 'concise' | 'balanced' | 'creative';
  customInstructions: string;
  autoSpeak: boolean;
  speechRate: number;
  fontSize: 'compact' | 'normal' | 'spacious';
  showCodeLineNumbers: boolean;
  soundEffects: boolean;
  darkMode: boolean;
  themeColor: string;
  customThemeColor?: string;
  language: AppLanguage;
  stopAnimations: boolean;
  aiPersonality: AIPersonalityType;
  imageQuality: ImageQualityType;
  responseLength: ResponseLengthType;
  emailNotifications: boolean;
  loginEmailAlerts: boolean;
  textToSpeech: boolean;
  ttsVoice?: TtsVoiceType;
  screenReaderSupport: boolean;
  highContrast: boolean;
  customApiKey: string;
  customModel?: string;
  customEndpoint?: string;
  customAiPersona?: string;
  customAiPersonaEnabled?: boolean;
  aiResponseAlerts?: boolean;
  googleSearchGrounding?: boolean;
  historyClearedAt?: number;
  sigmaApiKey: string;
  hologramRingPreset?: string;
  hologramRing1Color?: string;
  hologramRing2Color?: string;
  taskbarBgColor?: string;
  taskbarFocusGlowColor?: string;
  taskbarStyleMode?: 'glass' | 'solid';
  uiGlowEnabled?: boolean;
  uiGlowPreset?: string;
  uiGlowColor1?: string;
  uiGlowColor2?: string;
  historySavePolicy?: 'specific_only' | 'all';
  userNameCustom?: string;
  userQualities?: string;
  userAskingStyle?: string;
  userDesiredResponseFormat?: string;
  autoAdaptUserStyle?: boolean;
  adaptiveAiEnabled?: boolean;
  writeSomethingAboutYou?: string;
}

export interface UserPreferenceProfile {
  preferredLanguage?: 'English' | 'Hinglish' | 'Urdu' | 'Hindi' | string;
  frequentlyUsedLanguage?: 'English' | 'Hinglish' | 'Urdu' | 'Hindi' | string;
  hinglishEstablished?: boolean;
  responseLengthPreference?: 'concise' | 'balanced' | 'detailed';
  explanationStyle?: 'concise' | 'detailed';
  commonTaskCategories?: string[];
  preferredFormattingStyle?: string;
  commonlyAsksForCode?: boolean;
  commonlyAsksForStories?: boolean;
  commonlyWorksWithSpreadsheets?: boolean;
  commonlyUsesVoice?: boolean;
}

export interface UserKnowledgeMemory {
  userId: string;
  name: string;
  facts: string[];
  summary?: string;
  preferences?: UserPreferenceProfile;
  lastUpdated?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  searchEnabled: true,
  responseStyle: 'balanced',
  customInstructions: '',
  autoSpeak: false,
  speechRate: 1.0,
  fontSize: 'normal',
  showCodeLineNumbers: true,
  soundEffects: false,
  darkMode: true,
  themeColor: 'green',
  language: 'English (US)',
  stopAnimations: false,
  aiPersonality: 'Easy & Clear English',
  imageQuality: 'High',
  responseLength: 'Balanced',
  emailNotifications: true,
  loginEmailAlerts: true,
  textToSpeech: true,
  ttsVoice: 'male',
  screenReaderSupport: false,
  highContrast: false,
  customApiKey: '',
  customModel: '',
  customEndpoint: '',
  aiResponseAlerts: true,
  googleSearchGrounding: true,
  historyClearedAt: 0,
  sigmaApiKey: 'sigma_live_sec_9948271048',
  hologramRingPreset: 'neon-purple-cyan',
  hologramRing1Color: '#b026ff',
  hologramRing2Color: '#00f0ff',
  taskbarBgColor: '#0e1626',
  taskbarFocusGlowColor: undefined,
  taskbarStyleMode: 'glass',
  uiGlowEnabled: true,
  uiGlowPreset: 'cyber-cyan',
  uiGlowColor1: '#00f0ff',
  uiGlowColor2: '#b026ff',
  historySavePolicy: 'specific_only',
  userNameCustom: '',
  userQualities: '',
  userAskingStyle: '',
  userDesiredResponseFormat: '',
  autoAdaptUserStyle: true,
  adaptiveAiEnabled: true,
  writeSomethingAboutYou: '',
};



