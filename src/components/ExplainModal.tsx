import React, { useState } from 'react';
import { X, BookOpen, Sparkles, Check } from 'lucide-react';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendExplainPrompt: (prompt: string) => void;
  initialTopic?: string;
}

const DEPTH_LEVELS = [
  { id: 'eli5', label: 'Like I\'m 5', desc: 'Simple everyday language without jargon' },
  { id: 'analogy', label: 'Real-world Analogy', desc: 'Memorable intuitive analogies and metaphors' },
  { id: 'technical', label: 'Technical & In-depth', desc: 'Mechanisms, mathematical foundations, and proofs' },
  { id: 'faq', label: 'Mental Model & FAQ', desc: 'Core concept, common misconceptions, and practical takeaways' },
];

export const ExplainModal: React.FC<ExplainModalProps> = ({
  isOpen,
  onClose,
  onSendExplainPrompt,
  initialTopic = '',
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [selectedDepth, setSelectedDepth] = useState('analogy');

  React.useEffect(() => {
    if (isOpen && initialTopic !== undefined) {
      setTopic(initialTopic);
    }
  }, [isOpen, initialTopic]);

  if (!isOpen) return null;

  const handleExplain = () => {
    const text = topic.trim();
    if (!text) return;

    const depthObj = DEPTH_LEVELS.find((d) => d.id === selectedDepth);
    const depthLabel = depthObj ? depthObj.label : 'Intuitive explanation';

    const fullPrompt = `Please explain the following concept or question at the "${depthLabel}" level:\n\n"${text}"\n\nProvide an engaging, crystal-clear explanation with examples.`;
    onSendExplainPrompt(fullPrompt);
    onClose();
  };

  return (
    <div
      id="explain-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="explain-modal-container"
        className="bg-[#131924] border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative flex flex-col animate-in fade-in zoom-in-95 duration-200 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Sigma Concept Explainer</h3>
              <p className="text-xs text-slate-400">Demystify any topic, theory, or complex system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Depth Level */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Explanation Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DEPTH_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setSelectedDepth(lvl.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedDepth === lvl.id
                    ? 'border-indigo-500/60 bg-indigo-950/30 ring-1 ring-indigo-500/30'
                    : 'border-slate-800 bg-[#1a2333] hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{lvl.label}</span>
                  {selectedDepth === lvl.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{lvl.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Topic */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            What concept would you like explained?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
            placeholder="e.g. Quantum Entanglement, Transformer Attention, How Inflation works..."
            className="w-full bg-[#1a2333] border border-slate-700 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-slate-500"
          />
        </div>

        {/* Submit */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExplain}
            disabled={!topic.trim()}
            className="px-6 py-2.5 rounded-xl bg-white text-slate-950 font-semibold text-xs sm:text-sm hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Explain Topic</span>
          </button>
        </div>
      </div>
    </div>
  );
};
