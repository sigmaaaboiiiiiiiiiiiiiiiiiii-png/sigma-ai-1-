import React from 'react';
import { TypingGreeting } from './TypingGreeting';
import { getTranslation } from '../lib/translations';
import { Sparkles, Layers, Compass, Plus, Dice5 } from 'lucide-react';

interface EmptyStateProps {
  darkMode?: boolean;
  themeColorHex?: string;
  language?: string;
  stopAnimations?: boolean;
  onSelectMode?: (cmd: string) => void;
  onOpenModesModal?: () => void;
  onOpenNewApp?: () => void;
  onOpenMyApps?: () => void;
  onFeelingLucky?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  darkMode = true,
  themeColorHex = '#00ea77',
  language = 'English (US)',
  stopAnimations = false,
  onSelectMode,
  onOpenModesModal,
  onOpenNewApp,
  onOpenMyApps,
  onFeelingLucky,
}) => {
  return (
    <div
      id="empty-chat-state"
      className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 text-center bg-transparent my-auto max-w-3xl mx-auto w-full"
    >
      {/* Anime / Character Logo Avatar */}
      <div className="relative mb-3 group">
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-black shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
          style={{
            border: `2px solid ${themeColorHex}`,
            boxShadow: `0 0 24px ${themeColorHex}44`,
          }}
        >
          <img
            src="/sigma_logo.jpg"
            alt="Sigma AI"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Main Heading with Smooth Blur-to-Sharp Transition */}
      <h1
        className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2 transition-all duration-700 ease-out ${
          stopAnimations
            ? ''
            : 'animate-in fade-in zoom-in-95 duration-500'
        } ${darkMode ? 'text-white' : 'text-slate-900'}`}
        style={{
          textShadow: `0 0 24px ${themeColorHex}25`,
        }}
      >
        <span>{getTranslation(language, 'buildIdeasWith')} </span>
        <span
          className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400 font-['Orbitron',sans-serif]"
        >
          Sigma AI
        </span>
      </h1>

      {/* Animated Multicolor Typing Bar Container (Blue, Red, Yellow, Green, Purple Visual Accents) */}
      <div className="mb-4 flex items-center justify-center gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse delay-75" />
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse delay-150" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-200" />
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-300" />
          <span className="ml-1 text-xs font-mono text-slate-300">
            <TypingGreeting
              cursorColor={themeColorHex}
              disableAnimation={stopAnimations}
              language={language}
            />
          </span>
        </div>
      </div>

      {/* Hero Quick Action Buttons: New App, My Apps, I'm Feeling Lucky */}
      <div className="flex items-center justify-center gap-2.5 flex-wrap mb-4">
        {onOpenNewApp && (
          <button
            type="button"
            id="hero-new-app-btn"
            onClick={onOpenNewApp}
            className="px-4 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: themeColorHex }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{getTranslation(language, 'newApp')}</span>
          </button>
        )}

        {onOpenMyApps && (
          <button
            type="button"
            id="hero-my-apps-btn"
            onClick={onOpenMyApps}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#131924] hover:bg-[#1a2232] text-white border border-white/10 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-md"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>{getTranslation(language, 'myApps')}</span>
          </button>
        )}

        {onFeelingLucky && (
          <button
            type="button"
            id="hero-feeling-lucky-btn"
            onClick={onFeelingLucky}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#131924] hover:bg-[#1a2232] text-amber-300 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-md"
          >
            <Dice5 className="w-3.5 h-3.5 text-amber-400" />
            <span>{getTranslation(language, 'feelingLucky')}</span>
          </button>
        )}

        {onOpenModesModal && (
          <button
            type="button"
            onClick={onOpenModesModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#131924] hover:bg-[#1a2232] text-purple-300 border border-purple-500/30 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{getTranslation(language, 'modes100')}</span>
          </button>
        )}
      </div>

      {/* Introductory Subtitle */}
      <p
        className={`max-w-md text-xs sm:text-sm leading-relaxed font-normal ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        {getTranslation(language, 'greetingSubtitle')}
      </p>
    </div>
  );
};

export default EmptyState;
