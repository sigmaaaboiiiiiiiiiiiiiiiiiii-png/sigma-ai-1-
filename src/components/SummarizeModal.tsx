import React, { useState } from 'react';
import { X, FileText, Sparkles, Check, Library } from 'lucide-react';
import { saveItemToLibrary, detectLibraryContentType } from '../lib/libraryStorage';
import { UserProfile } from '../types';

interface SummarizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendSummaryPrompt: (prompt: string) => void;
  user?: UserProfile;
  initialText?: string;
}

const FORMATS = [
  { id: 'tldr', label: 'Executive TL;DR', desc: 'Short, high-impact summary in 2-3 sentences' },
  { id: 'bullets', label: 'Key Bullet Points', desc: '5-7 distilled actionable bullet points' },
  { id: 'actions', label: 'Action Items', desc: 'Extracted next steps and responsibilities' },
  { id: 'deep', label: 'Comprehensive', desc: 'Section-by-section breakdown with context' },
];

export const SummarizeModal: React.FC<SummarizeModalProps> = ({
  isOpen,
  onClose,
  onSendSummaryPrompt,
  user,
  initialText = '',
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [selectedFormat, setSelectedFormat] = useState('bullets');
  const [savedToLib, setSavedToLib] = useState(false);

  React.useEffect(() => {
    if (isOpen && initialText !== undefined) {
      setInputText(initialText);
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  const handleSummarize = () => {
    const text = inputText.trim();
    if (!text) return;

    const formatObj = FORMATS.find((f) => f.id === selectedFormat);
    const formatName = formatObj ? formatObj.label : 'bullet points';

    const fullPrompt = `Please summarize the following text using format "${formatName}":\n\n"""\n${text}\n"""`;
    onSendSummaryPrompt(fullPrompt);
    onClose();
  };

  return (
    <div
      id="summarize-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="summarize-modal-container"
        className="bg-[#131924] border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative flex flex-col animate-in fade-in zoom-in-95 duration-200 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Sigma Text Summarizer</h3>
              <p className="text-xs text-slate-400">Condense documents, articles, and meeting notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Summary Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FORMATS.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedFormat === fmt.id
                    ? 'border-emerald-500/60 bg-emerald-950/30 ring-1 ring-emerald-500/30'
                    : 'border-slate-800 bg-[#1a2333] hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{fmt.label}</span>
                  {selectedFormat === fmt.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{fmt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Paste Content to Summarize
          </label>
          <textarea
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your text, article, email draft, or lecture notes here..."
            className="w-full bg-[#1a2333] border border-slate-700 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-slate-500 resize-none leading-relaxed"
          />
        </div>

        {/* Submit */}
        <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!inputText.trim()) return;
              const firstLine = inputText.trim().split('\n')[0].slice(0, 48);
              saveItemToLibrary(user, {
                title: firstLine || 'Saved Document',
                contentType: detectLibraryContentType(inputText),
                content: inputText.trim(),
              });
              setSavedToLib(true);
              setTimeout(() => setSavedToLib(false), 2000);
            }}
            disabled={!inputText.trim()}
            className="px-3.5 py-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-semibold disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {savedToLib ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Library className="w-3.5 h-3.5" />}
            <span>{savedToLib ? 'Saved to Library' : 'Save to Library'}</span>
          </button>
          <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSummarize}
            disabled={!inputText.trim()}
            className="px-6 py-2.5 rounded-xl bg-white text-slate-950 font-semibold text-xs sm:text-sm hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Generate Summary</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};
