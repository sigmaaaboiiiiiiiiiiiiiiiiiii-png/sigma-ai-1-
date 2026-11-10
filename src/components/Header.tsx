import React, { useState } from 'react';
import { Plus, Settings, Loader2, Clock, PanelLeft, Menu, BadgeCheck, Crown, EyeOff, WifiOff, Brain, Link2, GraduationCap, UserX } from 'lucide-react';
import { UserProfile } from '../types';
import { getTranslation } from '../lib/translations';
import { isVerifiedOwnerAccount } from '../lib/nameModeration';

interface HeaderProps {
  onClearChat?: () => void;
  hasMessages?: boolean;
  onOpenLiveAssistant?: () => void;
  onOpenSettings?: () => void;
  onOpenRecents?: () => void;
  isRecentsOpen?: boolean;
  searchEnabled?: boolean;
  user?: UserProfile;
  onGoogleSignIn?: () => void;
  isGoogleLoading?: boolean;
  darkMode?: boolean;
  themeColorHex?: string;
  language?: string;
  stopAnimations?: boolean;
  isTemporaryChat?: boolean;
  onToggleTemporaryChat?: () => void;
  isOnline?: boolean;
  onOpenAiLab?: () => void;
  onOpenConnections?: () => void;
  onOpenPastPaperCenter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onClearChat,
  hasMessages,
  onOpenLiveAssistant,
  onOpenSettings,
  onOpenRecents,
  isRecentsOpen = false,
  searchEnabled = true,
  user,
  onGoogleSignIn,
  isGoogleLoading = false,
  darkMode = true,
  themeColorHex = '#00ea77',
  language = 'English (US)',
  stopAnimations = false,
  isTemporaryChat = false,
  onToggleTemporaryChat,
  isOnline = true,
  onOpenAiLab,
  onOpenConnections,
  onOpenPastPaperCenter,
}) => {
  const [isSignInHovered, setIsSignInHovered] = useState(false);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <header
      id="sigma-ai-header"
      className={`sticky top-0 z-10 w-full backdrop-blur-md px-4 sm:px-8 py-2.5 sm:py-3 transition-colors ${
        darkMode
          ? 'bg-[#0b0f17]/90 border-b border-slate-800/80 text-white'
          : 'bg-white/90 border-b border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-3xl mx-auto">
        {/* ============================================================ */}
        {/* MOBILE LAYOUT (sm:hidden) - Matches Gemini Generated Mockup */}
        {/* ============================================================ */}
        <div className="sm:hidden flex flex-col">
          {/* Top Row: [Menu] [Gojo Avatar + Sigma AI + Subtitle] [Google] [Settings] */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              {onOpenRecents && (
                <button
                  id="mobile-sidebar-toggle-btn"
                  type="button"
                  onClick={onOpenRecents}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-transform"
                  title="Open Menu"
                  aria-label="Open Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <a
                href="https://sigma-ai.pages.dev"
                id="mobile-brand-link"
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                title="Go to Sigma AI Home"
              >
                <div
                  className="w-9 h-9 rounded-full bg-black flex-shrink-0 relative overflow-hidden shadow-xs flex items-center justify-center"
                  style={{ border: `1.5px solid ${themeColorHex}` }}
                >
                  <img
                    src="/sigma_gojo.png"
                    alt="Sigma AI"
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover relative z-10"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white/80 font-['Orbitron',sans-serif]">
                    Σ
                  </span>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-base font-bold tracking-tight font-['Orbitron',sans-serif]"
                      style={{ color: themeColorHex }}
                    >
                      Sigma
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold leading-tight"
                      style={{
                        backgroundColor: `${themeColorHex}25`,
                        color: themeColorHex,
                        border: `1px solid ${themeColorHex}60`,
                      }}
                    >
                      AI
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5 hover:text-slate-300">
                    your advanced AI
                  </span>
                </div>
              </a>
            </div>

            {/* Right actions: Network Error (if offline) + Google Icon button + Settings Gear button */}
            <div className="flex items-center gap-2">
              {!isOnline && (
                <div
                  id="mobile-network-error-badge"
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-[10px] font-bold animate-pulse shadow-xs"
                  title="You are currently offline"
                >
                  <WifiOff className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span>{getTranslation(language, 'offline')}</span>
                </div>
              )}
              {/* Google / User Identity Squircle Button */}
              {user?.isLoggedIn ? (
                <div className="flex items-center gap-1.5">
                  {isVerifiedOwnerAccount(user) && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-400/50 text-yellow-300 text-[10px] font-bold tracking-wide shadow-xs"
                      title="Sigma AI Owner"
                    >
                      <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span>{getTranslation(language, 'owner')}</span>
                    </span>
                  )}
                  <button
                    id="mobile-user-profile-btn"
                    type="button"
                    onClick={onOpenSettings}
                    className="w-9 h-9 rounded-xl border border-slate-800 bg-[#131924] flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-xs cursor-pointer active:scale-95 transition-transform"
                    title={`Logged in as ${user.name || user.email}`}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        loading="eager"
                        decoding="sync"
                        fetchPriority="high"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{(user.email ? user.email.charAt(0) : user.name?.charAt(0) || 'U').toUpperCase()}</span>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  id="mobile-header-google-btn"
                  type="button"
                  onClick={onGoogleSignIn || onOpenSettings}
                  disabled={isGoogleLoading}
                  className="w-9 h-9 rounded-xl border border-slate-800 bg-[#131924] hover:bg-[#1a2333] flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"
                  title="Sign in with Google"
                  aria-label="Sign in with Google"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                </button>
              )}

              {/* Mobile Live Voice Waveform Pill - Hidden on mobile to avoid duplicate header button */}
              {onOpenLiveAssistant && (
                <button
                  id="mobile-live-voice-btn"
                  type="button"
                  onClick={onOpenLiveAssistant}
                  className="hidden sm:flex h-9 px-2.5 rounded-full border border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 items-center justify-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 group"
                  title="Live Voice Assistant"
                  aria-label="Live Voice Assistant"
                >
                  <div className="flex items-center gap-[2.5px] h-3.5">
                    <span className="w-[2.5px] h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="w-[2.5px] h-3.5 bg-blue-400 rounded-full animate-pulse [animation-delay:150ms]" />
                    <span className="w-[2.5px] h-2 bg-blue-300 rounded-full animate-pulse [animation-delay:300ms]" />
                    <span className="w-[2.5px] h-3 bg-blue-400 rounded-full animate-pulse [animation-delay:450ms]" />
                  </div>
                </button>
              )}

              {/* Settings Squircle Button */}
              {onOpenSettings && (
                <button
                  id="mobile-header-settings-btn"
                  type="button"
                  onClick={onOpenSettings}
                  className="w-9 h-9 rounded-xl border border-slate-800 bg-[#131924] hover:bg-[#1a2333] flex items-center justify-center text-slate-300 hover:text-white shadow-xs cursor-pointer active:scale-95 transition-transform"
                  title={getTranslation(language, 'settings')}
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4 text-slate-300" />
                </button>
              )}
            </div>
          </div>

          {/* Second Row: [🕒 Recents] [🕶️ Temp Chat] [ + New Chat ] Equal Width Pills */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 mt-2.5 pt-2.5 border-t border-slate-800/60">
            {onOpenRecents && (
              <button
                id="mobile-recents-pill-btn"
                type="button"
                onClick={onOpenRecents}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-full border border-slate-800/90 bg-[#131924]/90 text-[11px] font-medium text-slate-200 hover:text-white hover:border-slate-700 transition-all cursor-pointer active:scale-98 truncate"
                title="View recent chats"
              >
                <Clock className="w-3 h-3 text-purple-400 flex-shrink-0" />
                <span className="truncate">{getTranslation(language, 'recents')}</span>
              </button>
            )}

            {onToggleTemporaryChat && (
              <button
                id="mobile-temporary-chat-pill-btn"
                type="button"
                onClick={onToggleTemporaryChat}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-full border text-[11px] font-medium transition-all cursor-pointer active:scale-98 truncate ${
                  isTemporaryChat
                    ? 'border-purple-500/70 bg-purple-600/30 text-purple-200 shadow-sm'
                    : 'border-slate-800/90 bg-[#131924]/90 text-slate-300 hover:text-white'
                }`}
                title="Temporary Chat (Not saved)"
              >
                <EyeOff className={`w-3 h-3 flex-shrink-0 ${isTemporaryChat ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className="truncate">{isTemporaryChat ? `${getTranslation(language, 'temporaryChat')} (On)` : getTranslation(language, 'temporaryChat')}</span>
              </button>
            )}

            {onClearChat && (
              <button
                id="mobile-new-chat-pill-btn"
                type="button"
                onClick={onClearChat}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-full border border-slate-800/90 bg-[#131924]/90 text-[11px] font-medium text-slate-200 hover:text-white hover:border-slate-700 transition-all cursor-pointer active:scale-98 truncate"
                title="Start a new chat"
              >
                <Plus className="w-3 h-3 text-slate-300 flex-shrink-0" />
                <span className="truncate">{getTranslation(language, 'newChat')}</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* DESKTOP LAYOUT (hidden sm:flex)                             */}
        {/* ============================================================ */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Brand with Gojo Logo (image disappears on hover showing sidebar icon) & Home Link */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative flex items-center">
              {/* Gojo Logo on PC: Disappears on hover, revealing the Sidebar Icon in its place */}
              <button
                type="button"
                id="desktop-gojo-sidebar-trigger"
                onClick={onOpenRecents}
                className="relative w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden shadow-xs cursor-pointer select-none group/desktop-gojo transition-all hover:ring-2 hover:ring-blue-500/50 border"
                style={{ borderColor: themeColorHex }}
                title="Toggle Sidebar"
                aria-label="Toggle Sidebar"
              >
                <img
                  src="/sigma_logo.jpg"
                  alt="Sigma Logo"
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover relative z-10 pointer-events-none transition-opacity duration-200 group-hover/desktop-gojo:opacity-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center font-bold text-sm text-white/80 font-['Orbitron',sans-serif] group-hover/desktop-gojo:opacity-0 transition-opacity">
                  Σ
                </span>
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#131924] text-blue-400 opacity-0 group-hover/desktop-gojo:opacity-100 transition-opacity duration-200">
                  <PanelLeft className="w-5 h-5" />
                </div>
              </button>
            </div>

            {/* Main Heading: Link that refreshes / resets to home */}
            <a
              href="/"
              onClick={(e) => {
                if (window.location.pathname === '/' || window.location.pathname === '') {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
              className="flex flex-col select-none pl-1 cursor-pointer hover:opacity-90 transition-opacity"
              title="Refresh / Home"
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-lg font-bold tracking-tight leading-none font-['Orbitron',sans-serif]"
                  style={{ color: themeColorHex }}
                >
                  Sigma
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-sm font-mono font-bold"
                  style={{
                    backgroundColor: `${themeColorHex}25`,
                    color: themeColorHex,
                    border: `1px solid ${themeColorHex}55`,
                  }}
                >
                  AI
                </span>
              </div>
              <span
                className={`text-xs font-normal mt-0.5 ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {getTranslation(language, 'appSubtitle')}
              </span>
            </a>
          </div>

          {/* Action Controls & Status - Strictly Minimal Top Bar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Network Error Badge (only when offline) */}
            {!isOnline && (
              <div
                id="header-network-error-badge"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/60 text-red-300 text-xs font-semibold animate-pulse shadow-sm"
                title="You are currently offline. Check your internet connection."
              >
                <WifiOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span>{getTranslation(language, 'offline')}</span>
              </div>
            )}

            {/* New Chat Button */}
            {onClearChat && (
              <button
                id="clear-chat-btn"
                type="button"
                onClick={onClearChat}
                className={`group flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 transition-all cursor-pointer border ${
                  darkMode
                    ? 'text-slate-300 hover:text-white bg-[#131924] hover:bg-[#1a2333] border-slate-800 hover:border-slate-700'
                    : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
                title="Start a new chat"
              >
                <Plus
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-500 ease-in-out ${
                    stopAnimations ? '' : 'group-hover:rotate-[360deg]'
                  }`}
                />
                <span className="text-xs font-medium">{getTranslation(language, 'newChat')}</span>
              </button>
            )}


            {/* User Identity / Sign In Button */}
            {user?.isLoggedIn ? (
              <div className="relative flex items-center gap-1.5">
                {isVerifiedOwnerAccount(user) && (
                  <>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-400/50 text-yellow-300 text-[10px] font-bold tracking-wide shadow-xs"
                      title="Sigma AI Owner"
                    >
                      <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span>{getTranslation(language, 'owner')}</span>
                    </span>
                    <span
                      className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-400 text-[10px] font-bold tracking-wide shadow-xs"
                      title="Verified Sigma AI Owner"
                    >
                      <BadgeCheck className="w-3.5 h-3.5 text-[#3b82f6]" />
                      <span>{getTranslation(language, 'verified')}</span>
                    </span>
                  </>
                )}
                <button
                  id="header-user-profile-btn"
                  onClick={onOpenSettings}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-sm hover:scale-105 transition-all cursor-pointer border-2"
                  style={{
                    backgroundColor: themeColorHex,
                    borderColor: isVerifiedOwnerAccount(user) ? '#3b82f6' : `${themeColorHex}bb`,
                  }}
                  title={`Logged in as ${user.name} (${user.email || 'Account'}). Click to open Settings.`}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      loading="eager"
                      decoding="sync"
                      fetchPriority="high"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>
                      {(user.email ? user.email.charAt(0) : user.name.charAt(0) || 'U').toUpperCase()}
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <button
                id="header-signin-pill-btn"
                onClick={onGoogleSignIn || onOpenSettings}
                onMouseEnter={() => setIsSignInHovered(true)}
                onMouseLeave={() => setIsSignInHovered(false)}
                disabled={isGoogleLoading}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50 min-w-[76px]"
                style={{ backgroundColor: themeColorHex }}
                title="Sign in with Google to save chat history"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : isSignInHovered ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <svg className="w-3.5 h-3.5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="text-xs font-bold text-white leading-none">Google</span>
                  </div>
                ) : (
                  <span>{getTranslation(language, 'signIn')}</span>
                )}
              </button>
            )}

            {/* Audio Wave / Live Voice Button (Screenshot 1: Compact blue waveform pill) */}
            {onOpenLiveAssistant && (
              <button
                id="header-live-voice-btn"
                onClick={onOpenLiveAssistant}
                className="h-9 px-3.5 rounded-full border border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm hover:shadow-blue-500/20 active:scale-95 group"
                title="Live Voice Assistant & Waveform"
                aria-label="Live Voice Assistant"
              >
                <div className="flex items-center gap-[3px] h-4">
                  <span className="w-[3px] h-2 bg-blue-400 rounded-full group-hover:h-3 transition-all duration-200" />
                  <span className="w-[3px] h-3.5 bg-blue-400 rounded-full group-hover:h-4 transition-all duration-200" />
                  <span className="w-[3px] h-4.5 bg-blue-300 rounded-full group-hover:h-2.5 transition-all duration-200" />
                  <span className="w-[3px] h-2.5 bg-blue-400 rounded-full group-hover:h-4.5 transition-all duration-200" />
                  <span className="w-[3px] h-3.5 bg-blue-400 rounded-full group-hover:h-2 transition-all duration-200" />
                  <span className="w-[3px] h-2 bg-blue-400 rounded-full group-hover:h-3.5 transition-all duration-200" />
                </div>
              </button>
            )}

            {/* Settings Button */}
            {onOpenSettings && (
              <button
                id="header-settings-btn"
                onClick={onOpenSettings}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-sm group active:scale-95 ${
                  darkMode
                    ? 'bg-[#181a20] hover:bg-[#222530] border-white/10 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
                title={getTranslation(language, 'settings')}
                aria-label="Settings"
              >
                <Settings
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-700 ease-out ${
                    stopAnimations ? '' : 'group-hover:rotate-90'
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
