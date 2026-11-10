import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Clock,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  Search,
  LogIn,
  LogOut,
  Settings,
  Calendar,
  Compass,
  AlertTriangle,
  PanelLeftClose,
  PanelLeft,
  Pin,
  Library,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Presentation,
  FileText,
  Sparkles,
  Quote,
  Copy,
  Download,
  ExternalLink,
  BadgeCheck,
  Crown,
  EyeOff,
  Brain,
  Link2,
  GraduationCap,
  BookOpen,
  Zap,
  Layers,
} from 'lucide-react';
import { Conversation, UserProfile } from '../types';
import { isStudySourcesMasterEnabled, setStudySourcesMasterEnabled } from '../lib/studySources';
import { toSafeDate, formatSafeTime } from '../lib/dateUtils';
import { isVerifiedOwnerAccount } from '../lib/nameModeration';
import {
  SavedLibraryItem,
  SavedPictureItem,
  LibraryContentType,
  getUnifiedLibraryItems,
  getUnifiedUserPictures,
  saveItemToLibrary,
  deleteLibraryItem,
  downloadLibraryItem,
  deleteUserPicture,
} from '../lib/libraryStorage';
import { getTranslation } from '../lib/translations';

interface RecentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  onOpenNewApp?: () => void;
  onOpenMyApps?: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => void;
  onTogglePinConversation: (conversationId: string) => void;
  user: UserProfile;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  isGoogleLoading?: boolean;
  stopAnimations?: boolean;
  onOpenDraw?: (imgSrc?: string) => void;
  isTemporaryChat?: boolean;
  onToggleTemporaryChat?: () => void;
  onOpenAiLab?: () => void;
  onOpenConnections?: () => void;
  onOpenPastPaperCenter?: () => void;
  onOpenExplore?: () => void;
  onOpenSchedule?: () => void;
  onOpenStudySources?: () => void;
  onOpenModes?: () => void;
  onClearAllConversations?: () => void;
}

export const RecentsSidebar: React.FC<RecentsSidebarProps> = ({
  isOpen,
  onClose,
  language = 'English (US)',
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  user,
  onOpenNewApp,
  onOpenMyApps,
  onGoogleSignIn,
  onSignOut,
  onOpenSettings,
  isGoogleLoading = false,
  stopAnimations = false,
  onOpenDraw,
  isTemporaryChat = false,
  onToggleTemporaryChat,
  onOpenAiLab,
  onOpenConnections,
  onOpenPastPaperCenter,
  onOpenExplore,
  onOpenSchedule,
  onOpenStudySources,
  onOpenModes,
  onClearAllConversations,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [clearAllCountdown, setClearAllCountdown] = useState(3);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);
  const [selectedLibCategory, setSelectedLibCategory] = useState<string>('All');
  const [isImagesExpanded, setIsImagesExpanded] = useState(false);
  const [studyMasterOn, setStudyMasterOn] = useState<boolean>(() => isStudySourcesMasterEnabled());

  useEffect(() => {
    const handleMasterChange = (e: any) => {
      setStudyMasterOn(e.detail?.enabled ?? isStudySourcesMasterEnabled());
    };
    window.addEventListener('sigma-study-sources-master-changed', handleMasterChange);
    return () => window.removeEventListener('sigma-study-sources-master-changed', handleMasterChange);
  }, []);
  const [syncTick, setSyncTick] = useState(0);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<SavedLibraryItem | null>(null);
  const [isEditingLibraryItem, setIsEditingLibraryItem] = useState(false);
  const [libEditTitle, setLibEditTitle] = useState('');
  const [libEditType, setLibEditType] = useState<LibraryContentType>('Essay');
  const [libEditContent, setLibEditContent] = useState('');
  const [copiedLibId, setCopiedLibId] = useState<string | null>(null);
  const [selectedPicture, setSelectedPicture] = useState<SavedPictureItem | null>(null);

  useEffect(() => {
    const handleSync = () => setSyncTick((t) => t + 1);
    window.addEventListener('sigma-library-updated', handleSync);
    window.addEventListener('sigma-pictures-updated', handleSync);
    return () => {
      window.removeEventListener('sigma-library-updated', handleSync);
      window.removeEventListener('sigma-pictures-updated', handleSync);
    };
  }, []);

  // 3-2-1 countdown timer for Clear All Recent Chats modal
  useEffect(() => {
    if (!isClearAllModalOpen) {
      setClearAllCountdown(3);
      return;
    }
    if (clearAllCountdown <= 0) return;
    const timer = setTimeout(() => {
      setClearAllCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isClearAllModalOpen, clearAllCountdown]);

  const prefersReducedMotion = useMemo(() => {
    if (stopAnimations) return true;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, [stopAnimations]);

  // Synchronized Library items (shared with Settings -> Library and Recent Chats -> Library)
  const libraryItems = useMemo(() => {
    return getUnifiedLibraryItems(user, conversations);
  }, [user, conversations, syncTick]);

  const filteredLibraryItems = useMemo(() => {
    if (selectedLibCategory === 'All') return libraryItems;
    return libraryItems.filter(
      (item) => item.contentType?.toLowerCase() === selectedLibCategory.toLowerCase()
    );
  }, [libraryItems, selectedLibCategory]);

  // Synchronized Pictures (strictly user-uploaded or pasted images, private to signed-in user)
  const sidebarImages = useMemo(() => {
    return getUnifiedUserPictures(user, conversations);
  }, [user, conversations, syncTick]);

  // Filter and group conversations: Today, Yesterday, Previous 7 Days, Earlier
  const groupedConversations = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const yesterday = today - oneDayMs;
    const sevenDaysAgo = today - 7 * oneDayMs;

    const filtered = conversations.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(q);
      const previewMatch = c.lastMessagePreview?.toLowerCase().includes(q);
      const msgMatch = c.messages?.some((m) => m.content.toLowerCase().includes(q));
      return titleMatch || previewMatch || msgMatch;
    });

    const groups: {
      pinned: Conversation[];
      today: Conversation[];
      yesterday: Conversation[];
      last7Days: Conversation[];
      earlier: Conversation[];
    } = {
      pinned: [],
      today: [],
      yesterday: [],
      last7Days: [],
      earlier: [],
    };

    filtered.forEach((conv) => {
      if (conv.isPinned) {
        groups.pinned.push(conv);
        return;
      }
      const convDate = toSafeDate(conv.updatedAt || conv.createdAt).getTime();
      if (convDate >= today) {
        groups.today.push(conv);
      } else if (convDate >= yesterday) {
        groups.yesterday.push(conv);
      } else if (convDate >= sevenDaysAgo) {
        groups.last7Days.push(conv);
      } else {
        groups.earlier.push(conv);
      }
    });

    return groups;
  }, [conversations, searchQuery]);

  const handleStartRename = (conv: Conversation) => {
    setEditingChatId(conv.id);
    setEditTitleValue(conv.title);
  };

  const handleSaveRename = (convId: string) => {
    if (editTitleValue.trim()) {
      onRenameConversation(convId, editTitleValue.trim());
    }
    setEditingChatId(null);
  };

  const totalCount = conversations.length;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="recents-sidebar-backdrop"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="recents-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-[#0a0e16] border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Continuous Unified Scroll Container for Entire Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col scrollbar-thin select-none">
          {/* Top Header: Brand & Close */}
          <div className="p-3.5 border-b border-slate-800/80 flex flex-col gap-2.5 bg-[#0d121c]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black border border-blue-500/50 flex items-center justify-center overflow-hidden">
                <img
                  src="/sigma_logo.jpg"
                  alt="Sigma Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white tracking-tight font-['Orbitron',sans-serif]">
                    Sigma AI
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-400 font-mono font-bold border border-blue-500/40">
                    HUB
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Workspace & Chats</span>
              </div>
            </div>
            <button
              id="close-sidebar-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons Above Recents */}
          <div className="space-y-1.5 pt-1">
            {/* 1. New Chat Primary Button */}
            <button
              id="sidebar-new-chat-btn"
              onClick={() => {
                onNewChat();
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{getTranslation(language, 'newChat')}</span>
            </button>

            {/* New App & My Apps Primary Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              {onOpenNewApp && (
                <button
                  id="sidebar-new-app-btn"
                  type="button"
                  onClick={() => {
                    onOpenNewApp();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-black font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                  title="Create New AI Application"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{getTranslation(language, 'newApp')}</span>
                </button>
              )}
              {onOpenMyApps && (
                <button
                  id="sidebar-my-apps-btn"
                  type="button"
                  onClick={() => {
                    onOpenMyApps();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#131924] hover:bg-[#1a2232] border border-white/10 active:scale-[0.98] text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
                  title="My Applications Portfolio"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>{getTranslation(language, 'myApps')}</span>
                </button>
              )}
            </div>

            {/* 2. Temporary Chat Toggle Button */}
            {onToggleTemporaryChat && (
              <button
                id="sidebar-temp-chat-toggle-btn"
                type="button"
                onClick={() => {
                  onToggleTemporaryChat();
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  isTemporaryChat
                    ? 'bg-purple-950/60 border-purple-500/80 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'bg-[#101624] border-slate-800/90 text-slate-300 hover:text-white hover:bg-[#151c2e] hover:border-slate-700'
                }`}
                title="Toggle Temporary Chat"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isTemporaryChat
                        ? 'bg-purple-600/30 text-purple-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </div>
                  <span>{getTranslation(language, 'temporaryChat')}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isTemporaryChat
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isTemporaryChat ? getTranslation(language, 'active') : getTranslation(language, 'off')}
                </span>
              </button>
            )}

            {/* 3. 100+ Pro Mods Quick Access (Featured next to Temporary Chat) */}
            {onOpenModes && (
              <button
                id="sidebar-hero-mods-btn"
                type="button"
                onClick={() => {
                  onOpenModes();
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 hover:text-white hover:bg-emerald-900/40 hover:border-emerald-400/70 transition-all cursor-pointer shadow-xs"
                title="Open 100+ Pro Mods Catalog"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                    <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  </div>
                  <span>{getTranslation(language, 'modes100')}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 font-mono font-bold border border-emerald-500/40">
                  100 Modes
                </span>
              </button>
            )}

            {/* 2. Explore Topics & Prompts */}
            {onOpenExplore && (
              <button
                id="sidebar-explore-btn"
                type="button"
                onClick={() => {
                  onOpenExplore();
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[#101624] border border-slate-800/90 text-purple-300 hover:text-white hover:bg-[#151c2e] hover:border-purple-500/50 transition-all cursor-pointer"
                title="Explore Study Prompts & Curricula"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <span>{getTranslation(language, 'explore')}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono">
                  Prompts
                </span>
              </button>
            )}

            {/* 3. Images Navigation */}
            <button
              id="sidebar-images-btn"
              type="button"
              onClick={() => setIsImagesExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[#101624] border border-slate-800/90 text-pink-300 hover:text-white hover:bg-[#151c2e] hover:border-pink-500/50 transition-all cursor-pointer"
              title="User Generated & Uploaded Images"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <span>{getTranslation(language, 'images')}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300 font-mono">
                {sidebarImages.length}
              </span>
            </button>

            {/* 4. Schedule Timetable */}
            {onOpenSchedule && (
              <button
                id="sidebar-schedule-btn"
                type="button"
                onClick={() => {
                  onOpenSchedule();
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[#101624] border border-slate-800/90 text-amber-300 hover:text-white hover:bg-[#151c2e] hover:border-amber-500/50 transition-all cursor-pointer"
                title="Study Timetable & Scheduled Tasks"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span>{getTranslation(language, 'schedule')}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono">
                  Timetable
                </span>
              </button>
            )}

            {/* 5. Library */}
            <button
              id="sidebar-library-nav-btn"
              type="button"
              onClick={() => setIsLibraryExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[#101624] border border-slate-800/90 text-indigo-300 hover:text-white hover:bg-[#151c2e] hover:border-indigo-500/50 transition-all cursor-pointer"
              title="Saved Library Items & Notes"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Library className="w-3.5 h-3.5" />
                </div>
                <span>{getTranslation(language, 'library')}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono">
                {libraryItems.length}
              </span>
            </button>

            {/* 6. Study Sources with Master ON/OFF Switch */}
            <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#101624] border border-slate-800/90 hover:border-sky-500/50 text-xs font-semibold transition-all group">
              {/* Click label/icon to open workspace */}
              <button
                type="button"
                id="sidebar-study-sources-open-btn"
                onClick={() => {
                  if (onOpenStudySources) {
                    onOpenStudySources();
                  } else {
                    onOpenSettings();
                  }
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className="flex items-center gap-2 text-sky-300 hover:text-white cursor-pointer flex-1 text-left"
                title="Open Study Sources & Past Paper Workspace"
              >
                <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <span>{getTranslation(language, 'studySources')}</span>
              </button>

              {/* Master ON/OFF Toggle Switch */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800/80">
                <button
                  type="button"
                  id="sidebar-study-sources-master-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = !studyMasterOn;
                    setStudyMasterOn(next);
                    setStudySourcesMasterEnabled(next);
                  }}
                  className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    studyMasterOn ? 'bg-sky-600' : 'bg-slate-700'
                  }`}
                  title={studyMasterOn ? 'Study Sources Retrieval: ON' : 'Study Sources Retrieval: OFF'}
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      studyMasterOn ? 'translate-x-3' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-[10px] font-mono font-bold ${studyMasterOn ? 'text-sky-400' : 'text-slate-500'}`}>
                  {studyMasterOn ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* 7. Command & Control Center */}
            {(onOpenConnections || onOpenSettings) && (
              <button
                id="sidebar-command-center-btn"
                type="button"
                onClick={() => {
                  if (onOpenConnections) onOpenConnections();
                  else onOpenSettings();
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[#101624] border border-slate-800/90 text-blue-300 hover:text-white hover:bg-[#151c2e] hover:border-blue-500/50 transition-all cursor-pointer"
                title="Open Command & Control Center"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Link2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Command & Control</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              </button>
            )}

            {/* 8. 100 Pro Mods Catalog */}
            {onOpenModes && (
              <button
                id="sidebar-mods-catalog-btn"
                type="button"
                onClick={() => {
                  onOpenModes();
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[#101624] border border-slate-800/90 text-emerald-300 hover:text-white hover:bg-[#151c2e] hover:border-emerald-500/50 transition-all cursor-pointer"
                title="Open 100 Pro Mods Control Panel"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <span>100 Pro Mods</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                  100 Modes
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {totalCount > 0 && (
          <div className="p-3 border-b border-slate-800/60 bg-[#0b0f17]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="sidebar-search-input"
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#131924] border border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-lg pl-8 pr-7 py-1.5 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Expandable Library & Images Sections + Conversation List Groups */}
        <div className="p-3 space-y-4">
          {/* Expandable Sidebar Navigation: Library & Images */}
          <div className="space-y-2 pb-2.5 border-b border-slate-800/80">
            {/* LIBRARY SECTION */}
            <div className="rounded-xl bg-[#0e131e]/90 border border-slate-800/80 overflow-hidden">
              <button
                id="sidebar-library-toggle"
                type="button"
                aria-expanded={isLibraryExpanded}
                onClick={() => setIsLibraryExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#131924] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Library className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 tracking-wide">
                    Library
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {libraryItems.length}
                  </span>
                </div>
                {isLibraryExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {isLibraryExpanded && (
                <div
                  id="sidebar-library-panel"
                  className="px-2.5 pb-2.5 pt-1.5 space-y-1.5 border-t border-slate-800/60"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLibraryItem(null);
                      setLibEditTitle('');
                      setLibEditType('Essay');
                      setLibEditContent('');
                      setIsEditingLibraryItem(true);
                    }}
                    className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold transition-colors cursor-pointer ${
                      prefersReducedMotion ? '' : 'animate-sidebar-stagger-item'
                    }`}
                    style={
                      prefersReducedMotion
                        ? undefined
                        : ({ '--stagger-delay': '0ms' } as React.CSSProperties)
                    }
                  >
                    <Plus className="w-3 h-3" />
                    <span>Save New Item to Library</span>
                  </button>

                  {/* Category Filter Tabs for Library */}
                  {libraryItems.length > 0 && (
                    <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                      {['All', 'Essay', 'Article', 'Story', 'Code', 'Summary'].map((cat) => {
                        const active = selectedLibCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedLibCategory(cat)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer flex-shrink-0 ${
                              active
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {libraryItems.length === 0 ? (
                    <div
                      className={`py-3 px-2 text-center text-[11px] text-slate-500 ${
                        prefersReducedMotion ? '' : 'animate-sidebar-stagger-item'
                      }`}
                      style={
                        prefersReducedMotion
                          ? undefined
                          : ({ '--stagger-delay': '55ms' } as React.CSSProperties)
                      }
                    >
                      Essays, stories, articles, prompts & code saved by you appear here.
                    </div>
                  ) : filteredLibraryItems.length === 0 ? (
                    <div className="py-2.5 px-2 text-center text-[11px] text-slate-500">
                      No items found in {selectedLibCategory}.
                    </div>
                  ) : (
                    filteredLibraryItems.slice(0, 15).map((item, idx) => (
                      <div
                        key={item.id}
                        className={`group flex items-center justify-between gap-1.5 p-2 rounded-lg bg-[#121826]/80 hover:bg-[#172033] border border-slate-800/70 hover:border-slate-700 transition-colors ${
                          prefersReducedMotion ? '' : 'animate-sidebar-stagger-item'
                        }`}
                        style={
                          prefersReducedMotion
                            ? undefined
                            : ({
                                '--stagger-delay': `${(idx + 1) * 55}ms`,
                              } as React.CSSProperties)
                        }
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLibraryItem(item);
                            setIsEditingLibraryItem(false);
                          }}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          {item.contentType === 'Presentation' ? (
                            <Presentation className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                          ) : item.contentType === 'Spreadsheet' ? (
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : item.contentType === 'Quote' ? (
                            <Quote className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-slate-200 font-medium truncate">
                              {item.title}
                            </div>
                            <div className="text-[9px] text-slate-500 uppercase font-mono">
                              {item.contentType}
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(item.content);
                              setCopiedLibId(item.id);
                              setTimeout(() => setCopiedLibId(null), 1600);
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                            title="Copy content"
                          >
                            {copiedLibId === item.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadLibraryItem(item);
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLibraryItem(user, item.id);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Chats Section Header */}
          <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-blue-950/70 border border-blue-800/60 flex items-center justify-center text-blue-400">
                <Clock className="w-3 h-3" />
              </div>
              <span className="text-xs font-bold text-slate-200 tracking-wide">
                Recent Chats
              </span>
              {totalCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {totalCount}
                </span>
              )}
            </div>
            {totalCount > 0 && (
              <button
                type="button"
                id="sidebar-clear-all-chats-btn"
                onClick={() => {
                  setClearAllCountdown(3);
                  setIsClearAllModalOpen(true);
                }}
                className="text-[11px] text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10 cursor-pointer"
                title="Clear all recent chats"
              >
                <Trash2 className="w-3 h-3" />
                <span>{getTranslation(language, 'clearAll')}</span>
              </button>
            )}
          </div>

          {totalCount === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#131924] border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-slate-300 mb-1">
                {getTranslation(language, 'noSavedChats')}
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px]">
                {getTranslation(language, 'noSavedChatsDesc')}
              </p>
            </div>
          ) : (
            <>
              {/* Group: Pinned Chats (Pinned permanently to top) */}
              {groupedConversations.pinned.length > 0 && (
                <div className="space-y-1 pb-2 mb-2 border-b border-slate-800/80">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Pinned ({groupedConversations.pinned.length})</span>
                  </div>
                  {groupedConversations.pinned.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      isEditing={conv.id === editingChatId}
                      editTitleValue={editTitleValue}
                      onEditChange={setEditTitleValue}
                      onSaveRename={() => handleSaveRename(conv.id)}
                      onCancelRename={() => setEditingChatId(null)}
                      onStartRename={() => handleStartRename(conv)}
                      onTogglePin={() => onTogglePinConversation?.(conv.id)}
                      onSelect={() => {
                        onSelectConversation(conv.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      onPromptDelete={() => setConfirmDeleteId(conv.id)}
                    />
                  ))}
                </div>
              )}

              {/* Group: Today */}
              {groupedConversations.today.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Today</span>
                  </div>
                  {groupedConversations.today.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      isEditing={conv.id === editingChatId}
                      editTitleValue={editTitleValue}
                      onEditChange={setEditTitleValue}
                      onSaveRename={() => handleSaveRename(conv.id)}
                      onCancelRename={() => setEditingChatId(null)}
                      onStartRename={() => handleStartRename(conv)}
                      onTogglePin={() => onTogglePinConversation?.(conv.id)}
                      onSelect={() => {
                        onSelectConversation(conv.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      onPromptDelete={() => setConfirmDeleteId(conv.id)}
                    />
                  ))}
                </div>
              )}

              {/* Group: Yesterday */}
              {groupedConversations.yesterday.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span>Yesterday</span>
                  </div>
                  {groupedConversations.yesterday.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      isEditing={conv.id === editingChatId}
                      editTitleValue={editTitleValue}
                      onEditChange={setEditTitleValue}
                      onSaveRename={() => handleSaveRename(conv.id)}
                      onCancelRename={() => setEditingChatId(null)}
                      onStartRename={() => handleStartRename(conv)}
                      onTogglePin={() => onTogglePinConversation?.(conv.id)}
                      onSelect={() => {
                        onSelectConversation(conv.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      onPromptDelete={() => setConfirmDeleteId(conv.id)}
                    />
                  ))}
                </div>
              )}

              {/* Group: Previous 7 Days */}
              {groupedConversations.last7Days.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Previous 7 Days</span>
                  </div>
                  {groupedConversations.last7Days.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      isEditing={conv.id === editingChatId}
                      editTitleValue={editTitleValue}
                      onEditChange={setEditTitleValue}
                      onSaveRename={() => handleSaveRename(conv.id)}
                      onCancelRename={() => setEditingChatId(null)}
                      onStartRename={() => handleStartRename(conv)}
                      onTogglePin={() => onTogglePinConversation?.(conv.id)}
                      onSelect={() => {
                        onSelectConversation(conv.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      onPromptDelete={() => setConfirmDeleteId(conv.id)}
                    />
                  ))}
                </div>
              )}

              {/* Group: Earlier */}
              {groupedConversations.earlier.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Earlier</span>
                  </div>
                  {groupedConversations.earlier.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      isEditing={conv.id === editingChatId}
                      editTitleValue={editTitleValue}
                      onEditChange={setEditTitleValue}
                      onSaveRename={() => handleSaveRename(conv.id)}
                      onCancelRename={() => setEditingChatId(null)}
                      onStartRename={() => handleStartRename(conv)}
                      onTogglePin={() => onTogglePinConversation?.(conv.id)}
                      onSelect={() => {
                        onSelectConversation(conv.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      onPromptDelete={() => setConfirmDeleteId(conv.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* User Account / Footer Status */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0d121c] flex flex-col gap-2">
          {user.isLoggedIn ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#131924] border border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 border border-blue-400/60 overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {(user.email ? user.email.charAt(0) : user.name.charAt(0) || 'U').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                    <span className="truncate">{user.name || 'Account'}</span>
                    {isVerifiedOwnerAccount(user) && (
                      <>
                        <span title="Verified Account" className="inline-flex flex-shrink-0">
                          <BadgeCheck className="w-3.5 h-3.5 text-[#3b82f6] flex-shrink-0" />
                        </span>
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-400/50 text-yellow-300 text-[9px] font-bold tracking-wide flex-shrink-0"
                          title="Sigma AI Owner"
                        >
                          <Crown className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                          <span>Owner</span>
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {user.email || 'Signed in'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  id="sidebar-settings-btn"
                  onClick={onOpenSettings}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  id="sidebar-signout-btn"
                  onClick={onSignOut}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#131924] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px]">
                  G
                </div>
                <span className="font-medium truncate">
                  {user.name && user.name.trim() && user.name !== 'Guest User' ? user.name : 'Guest User'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Sign in with Google to save your chat history permanently.
              </p>
              <button
                id="sidebar-signin-btn"
                onClick={onGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>
        </div>
      </aside>

      {/* Library Item Open / Edit Modal */}
      {(selectedLibraryItem || isEditingLibraryItem) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => {
            setSelectedLibraryItem(null);
            setIsEditingLibraryItem(false);
          }}
        >
          <div
            className="w-full max-w-2xl bg-[#0e131d] border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Library className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <h3 className="text-sm font-bold text-white truncate">
                  {isEditingLibraryItem
                    ? selectedLibraryItem
                      ? 'Edit Library Item'
                      : 'Save Item to Library'
                    : selectedLibraryItem?.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedLibraryItem(null);
                  setIsEditingLibraryItem(false);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isEditingLibraryItem ? (
              <div className="space-y-3 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={libEditTitle}
                      onChange={(e) => setLibEditTitle(e.target.value)}
                      placeholder="Enter title..."
                      className="w-full bg-[#131924] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Type
                    </label>
                    <select
                      value={libEditType}
                      onChange={(e) => setLibEditType(e.target.value as LibraryContentType)}
                      className="w-full bg-[#131924] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Essay">Essay</option>
                      <option value="Story">Story</option>
                      <option value="Article">Article</option>
                      <option value="Quote">Quote</option>
                      <option value="Presentation">Presentation</option>
                      <option value="Spreadsheet">Spreadsheet</option>
                      <option value="Prompt">Prompt</option>
                      <option value="Code">Code</option>
                      <option value="Document">Document</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Content
                  </label>
                  <textarea
                    rows={10}
                    value={libEditContent}
                    onChange={(e) => setLibEditContent(e.target.value)}
                    placeholder="Write or paste content to save in your Library..."
                    className="w-full bg-[#131924] border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono leading-relaxed focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingLibraryItem(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!libEditContent.trim()) return;
                      const saved = saveItemToLibrary(user, {
                        id: selectedLibraryItem?.id,
                        title: libEditTitle.trim() || `${libEditType} Item`,
                        contentType: libEditType,
                        content: libEditContent,
                        conversationId: selectedLibraryItem?.conversationId,
                      });
                      setSelectedLibraryItem(saved);
                      setIsEditingLibraryItem(false);
                    }}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                  >
                    Save to Library
                  </button>
                </div>
              </div>
            ) : (
              selectedLibraryItem && (
                <>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      {selectedLibraryItem.contentType}
                    </span>
                    <span>
                      Updated {formatSafeTime(selectedLibraryItem.updatedAt || selectedLibraryItem.createdAt)}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-[#090d14] border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans max-h-[50vh]">
                    {selectedLibraryItem.content}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLibEditTitle(selectedLibraryItem.title);
                          setLibEditType(selectedLibraryItem.contentType);
                          setLibEditContent(selectedLibraryItem.content);
                          setIsEditingLibraryItem(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedLibraryItem.content);
                          setCopiedLibId(selectedLibraryItem.id);
                          setTimeout(() => setCopiedLibId(null), 1600);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium cursor-pointer"
                      >
                        {copiedLibId === selectedLibraryItem.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span>{copiedLibId === selectedLibraryItem.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadLibraryItem(selectedLibraryItem)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Download</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {selectedLibraryItem.conversationId && (
                        <button
                          type="button"
                          onClick={() => {
                            const cId = selectedLibraryItem.conversationId!;
                            setSelectedLibraryItem(null);
                            onSelectConversation(cId);
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Chat</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          deleteLibraryItem(user, selectedLibraryItem.id);
                          setSelectedLibraryItem(null);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}

      {/* Picture Viewer Modal */}
      {selectedPicture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setSelectedPicture(null)}
        >
          <div
            className="w-full max-w-xl bg-[#0e131d] border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="text-sm font-bold text-white truncate">
                  {selectedPicture.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPicture(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black/70 border border-slate-800 flex items-center justify-center max-h-[60vh]">
              <img
                src={selectedPicture.src}
                alt={selectedPicture.title}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Uploaded {formatSafeTime(selectedPicture.createdAt)}
              </span>
              <div className="flex items-center gap-2">
                {selectedPicture.conversationId && (
                  <button
                    type="button"
                    onClick={() => {
                      const cId = selectedPicture.conversationId!;
                      setSelectedPicture(null);
                      onSelectConversation(cId);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-medium cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Chat</span>
                  </button>
                )}
                <a
                  href={selectedPicture.src}
                  download={selectedPicture.title || 'uploaded-picture.png'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    deleteUserPicture(user, selectedPicture.id);
                    setSelectedPicture(null);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div
          id="delete-chat-confirm-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="w-full max-w-sm bg-[#0e131d] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Chat</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to delete this conversation? This will permanently remove the chat and its messages.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                id="delete-chat-clear-all-opt-btn"
                onClick={() => {
                  setConfirmDeleteId(null);
                  setIsClearAllModalOpen(true);
                  setClearAllCountdown(3);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/25 transition-colors cursor-pointer"
                title="Clear all recent chats instead"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="cancel-delete-chat-btn"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-chat-btn"
                  onClick={() => {
                    onDeleteConversation(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered Clear All Recent Chats Confirmation Modal with 3-2-1 Countdown */}
      {isClearAllModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm bg-[#121620] border border-red-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white mb-1">
                {getTranslation(language, 'clearAllRecentChatsConfirm')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {getTranslation(language, 'clearAllWarning')}
              </p>
            </div>

            {clearAllCountdown > 0 && (
              <div className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Please wait: {clearAllCountdown}s remaining</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                id="cancel-clear-all-chats-modal-btn"
                onClick={() => {
                  setIsClearAllModalOpen(false);
                  setClearAllCountdown(3);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                {getTranslation(language, 'cancel')}
              </button>
              <button
                type="button"
                id="confirm-clear-all-chats-modal-btn"
                disabled={clearAllCountdown > 0}
                onClick={() => {
                  onClearAllConversations?.();
                  setIsClearAllModalOpen(false);
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  clearAllCountdown > 0
                    ? 'bg-red-950/40 text-red-400/50 border border-red-900/30 cursor-not-allowed opacity-60'
                    : 'bg-red-600 hover:bg-red-500 active:scale-95 text-white shadow-lg shadow-red-600/30 cursor-pointer'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {clearAllCountdown > 0 ? `${getTranslation(language, 'clearAll')} (${clearAllCountdown}s)` : getTranslation(language, 'clearAllChats')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editTitleValue: string;
  onEditChange: (val: string) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onStartRename: () => void;
  onTogglePin?: () => void;
  onSelect: () => void;
  onPromptDelete: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  isEditing,
  editTitleValue,
  onEditChange,
  onSaveRename,
  onCancelRename,
  onStartRename,
  onTogglePin,
  onSelect,
  onPromptDelete,
}) => {
  const formattedTime = useMemo(
    () => formatSafeTime(conversation.updatedAt || conversation.createdAt),
    [conversation.updatedAt, conversation.createdAt]
  );

  if (isEditing) {
    return (
      <div className="p-2 rounded-xl bg-[#131924] border border-blue-500/80 flex items-center gap-1.5">
        <input
          type="text"
          value={editTitleValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveRename();
            if (e.key === 'Escape') onCancelRename();
          }}
          autoFocus
          className="flex-1 bg-transparent text-xs text-white outline-hidden px-1"
        />
        <button
          onClick={onSaveRename}
          className="p-1 text-emerald-400 hover:text-emerald-300 rounded cursor-pointer"
          title="Save title"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onCancelRename}
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
      id={`recent-chat-${conversation.id}`}
      onClick={onSelect}
      className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
        isActive
          ? 'bg-blue-950/30 border-blue-600/80 text-white'
          : 'bg-[#101520]/60 hover:bg-[#131924] border-slate-800/60 hover:border-slate-700 text-slate-300 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1.5">
        <div
          className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
            isActive ? 'text-blue-400 bg-blue-500/20' : 'text-slate-500 group-hover:text-slate-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium truncate leading-tight flex items-center gap-1.5">
              {conversation.isPinned && (
                <Pin className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
              )}
              <span className="truncate">{conversation.title || 'Conversation'}</span>
            </span>
            <span className="text-[9px] text-slate-500 font-mono flex-shrink-0">
              {formattedTime}
            </span>
          </div>
          {conversation.lastMessagePreview && (
            <p className="text-[10px] text-slate-500 truncate mt-0.5 opacity-80">
              {conversation.lastMessagePreview}
            </p>
          )}
        </div>
      </div>

      {/* Action icons on hover: Pin, Rename, and Delete */}
      <div className={`flex items-center gap-0.5 transition-opacity ${conversation.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin?.();
          }}
          className={`p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer ${
            conversation.isPinned ? 'text-amber-400' : 'text-slate-400 hover:text-amber-300'
          }`}
          title={conversation.isPinned ? 'Unpin chat' : 'Pin chat to top'}
        >
          <Pin className={`w-3 h-3 ${conversation.isPinned ? 'fill-amber-400' : ''}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartRename();
          }}
          className="p-1 text-slate-400 hover:text-blue-400 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          title="Rename conversation"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPromptDelete();
          }}
          className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          title="Delete conversation"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
