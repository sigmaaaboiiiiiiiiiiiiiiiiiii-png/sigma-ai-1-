import React, { useState } from 'react';
import { X, Code2, Sparkles, Terminal, Check, ExternalLink, Library } from 'lucide-react';
import { getTranslation } from '../lib/translations';
import { saveItemToLibrary } from '../lib/libraryStorage';
import { UserProfile } from '../types';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendCodePrompt: (prompt: string) => void;
  themeColorHex?: string;
  language?: string;
  user?: UserProfile;
  initialDescription?: string;
  initialMode?: string;
}

const LANGUAGES = ['TypeScript', 'Python', 'React / Next.js', 'JavaScript', 'SQL', 'Go', 'HTML/CSS'];

const MODES = [
  { id: 'build', labelKey: 'writeCode', descKey: 'writeCodeDesc', defaultLabel: 'Write Code', defaultDesc: 'Create functions, scripts, or components from scratch' },
  { id: 'debug', labelKey: 'debugFix', descKey: 'debugFixDesc', defaultLabel: 'Debug & Fix', defaultDesc: 'Find errors, fix bugs, and handle edge cases' },
  { id: 'optimize', labelKey: 'optimize', descKey: 'optimizeDesc', defaultLabel: 'Optimize', defaultDesc: 'Improve runtime complexity, cleanliness, and types' },
  { id: 'explain', labelKey: 'explainCode', descKey: 'explainCodeDesc', defaultLabel: 'Explain Code', defaultDesc: 'Step-by-step walkthrough of what the logic does' },
];

export const CodeModal: React.FC<CodeModalProps> = ({
  isOpen,
  onClose,
  onSendCodePrompt,
  themeColorHex = '#3b82f6',
  language = 'English (US)',
  user,
  initialDescription = '',
  initialMode = 'build',
}) => {
  const [selectedLang, setSelectedLang] = useState('TypeScript');
  const [mode, setMode] = useState(initialMode);
  const [description, setDescription] = useState(initialDescription);
  const [savedToLib, setSavedToLib] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialDescription !== undefined) setDescription(initialDescription);
      if (initialMode) setMode(initialMode);
    }
  }, [isOpen, initialDescription, initialMode]);

  if (!isOpen) return null;

  const t = (key: string, fallback: string) => getTranslation(language, key) || fallback;

  const handleSubmit = () => {
    const text = description.trim();
    if (!text) return;

    const modeObj = MODES.find((m) => m.id === mode);
    const modeLabel = modeObj ? t(modeObj.labelKey, modeObj.defaultLabel) : 'Code assistance';

    const fullPrompt = `[Programming Assistant - ${selectedLang} - ${modeLabel}]\n\nRequirement / Problem:\n${text}\n\nPlease provide complete, well-commented, robust code with concise explanation and edge case notes.`;
    onSendCodePrompt(fullPrompt);
    onClose();
  };

  return (
    <div
      id="code-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="code-modal-container"
        className="bg-[#131924] border border-slate-800 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors flex-shrink-0"
              style={{
                backgroundColor: `${themeColorHex}25`,
                borderColor: `${themeColorHex}50`,
                color: themeColorHex,
              }}
            >
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white leading-tight">
                {t('sigmaCodeAssistant', 'Sigma Code Assistant')}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {t('codeAssistantSubtitle', 'Generate, debug, and optimize production code')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode selector: On mobile, headings only & compact padding; on PC, full descriptions */}
        <div className="mt-3.5 sm:mt-4">
          <label className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            {t('objective', 'Objective')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => {
              const isSelected = mode === m.id;
              const label = t(m.labelKey, m.defaultLabel);
              const desc = t(m.descKey, m.defaultDesc);
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={
                    isSelected
                      ? {
                          borderColor: themeColorHex,
                          backgroundColor: `${themeColorHex}20`,
                          boxShadow: `0 0 12px ${themeColorHex}25`,
                        }
                      : undefined
                  }
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-1'
                      : 'border-slate-800 bg-[#1a2333] hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-200 truncate">{label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: themeColorHex }} />}
                  </div>
                  {/* Shorter on phone: description hidden on mobile phone layout, shown on sm+ */}
                  <p className="hidden sm:block text-[10px] text-slate-400 mt-0.5 leading-tight">{desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language selector */}
        <div className="mt-3.5 sm:mt-4">
          <label className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            {t('ecosystem', 'Language / Ecosystem')}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang;
              return (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  style={
                    isSelected
                      ? {
                          backgroundColor: themeColorHex,
                          color: '#ffffff',
                          boxShadow: `0 2px 10px ${themeColorHex}40`,
                        }
                      : undefined
                  }
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'font-semibold'
                      : 'bg-[#1a2333] border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt description */}
        <div className="mt-3.5 sm:mt-4">
          <label className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            {t('codePromptDetails', 'Code Prompt / Error Details')}
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you want to build or paste your error snippet..."
            className="w-full bg-[#1a2333] border border-slate-700 rounded-2xl p-3 sm:p-4 text-xs sm:text-sm font-mono text-white placeholder-slate-500 outline-none focus:border-slate-500 resize-none leading-relaxed"
          />
        </div>

        {/* Submit & Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex-1 flex items-center text-xs text-slate-400">
            <Terminal className="w-3.5 h-3.5 mr-1.5" style={{ color: themeColorHex }} />
            <span>Production-ready code with clear explanations</span>
          </div>

          <div className="flex items-center justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!description.trim()) return;
                saveItemToLibrary(user, {
                  title: `${selectedLang} Code (${mode})`,
                  contentType: 'Code',
                  content: description.trim(),
                });
                setSavedToLib(true);
                setTimeout(() => setSavedToLib(false), 2000);
              }}
              disabled={!description.trim()}
              className="px-3 py-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-semibold disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Save code/prompt to Library"
            >
              {savedToLib ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Library className="w-3.5 h-3.5" />}
              <span>{savedToLib ? 'Saved' : 'Save to Library'}</span>
            </button>
            <button
              id="code-modal-cancel-btn"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              id="code-modal-generate-btn"
              onClick={handleSubmit}
              disabled={!description.trim()}
              style={{
                background: `linear-gradient(135deg, ${themeColorHex}, ${themeColorHex}dd)`,
                boxShadow: `0 4px 15px ${themeColorHex}40`,
                color: '#ffffff',
              }}
              className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>{t('generateCode', 'Generate Code')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
