import React, { useState, useMemo } from 'react';
import { X, Search, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { SIGMA_MODES, SigmaMode, SIGMA_START_MESSAGE } from '../lib/sigmaModes';

interface SigmaModesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (command: string) => void;
  themeColorHex?: string;
  darkMode?: boolean;
}

const CATEGORIES = ['All', 'Study', 'Coding', 'Gaming', 'Content', 'Psychology', 'Lifestyle', 'Finance', 'Productivity'] as const;

export const SigmaModesModal: React.FC<SigmaModesModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  themeColorHex = '#00ea77',
  darkMode = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredModes = useMemo(() => {
    return SIGMA_MODES.filter((mode) => {
      const matchesCategory = selectedCategory === 'All' || mode.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        mode.command.toLowerCase().includes(q) ||
        mode.title.toLowerCase().includes(q) ||
        mode.description.toLowerCase().includes(q) ||
        mode.id.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      id="sigma-modes-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="sigma-modes-modal"
        className={`relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          darkMode
            ? 'bg-[#0f141f] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        style={{
          boxShadow: `0 0 40px ${themeColorHex}22`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 sm:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md"
              style={{
                backgroundColor: `${themeColorHex}20`,
                borderColor: `${themeColorHex}50`,
                color: themeColorHex,
                borderWidth: 1,
              }}
            >
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Sigma AI 100 Pro Modes</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {SIGMA_MODES.length} Unlocked
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Type <code className="text-amber-400 font-mono font-semibold">/mode</code> or select any mode below for deep step-by-step answers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-3 sm:px-6 sm:py-3 border-b border-white/5 sm:border-slate-800/60 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between bg-black/10">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mode (/gamer, /ghost, /rizz, /money)..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick All Modes / Start Message Button */}
          <button
            type="button"
            onClick={() => {
              onSelectMode('/modes');
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Show /modes intro</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-4 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/5 sm:border-slate-800/40">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Mode Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredModes.map((mode: SigmaMode) => (
            <div
              key={mode.id}
              onClick={() => {
                onSelectMode(mode.command);
                onClose();
              }}
              className="group relative p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800 hover:border-emerald-500/50 bg-[#131926]/80 hover:bg-[#182134] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">{mode.icon}</span>
                    <span className="font-semibold text-sm sm:text-base text-white group-hover:text-emerald-400 transition-colors">
                      {mode.title}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    {mode.command}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
                  {mode.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 group-hover:text-slate-300">
                <span className="text-slate-400 font-medium">{mode.category}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Launch <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}

          {filteredModes.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm">
              No modes found matching &quot;{searchQuery}&quot;. Try typing &quot;/&quot; in chat to see all commands.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-6 sm:py-3 border-t border-white/5 sm:border-slate-800/80 bg-black/20 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: You can type <code className="text-emerald-400 font-mono">/command</code> anywhere in the chat box!</span>
          <span className="text-[11px] font-mono">sigma-ai.pages.dev</span>
        </div>
      </div>
    </div>
  );
};
