import React, { useState } from 'react';
import { X, Link2, ExternalLink } from 'lucide-react';

interface AddUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUrl: (url: string) => void;
}

export const AddUrlModal: React.FC<AddUrlModalProps> = ({
  isOpen,
  onClose,
  onAddUrl,
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a valid URL');
      return;
    }
    // Auto-prefix http/https if missing
    const formatted = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    onAddUrl(formatted);
    setUrl('');
    setError(null);
    onClose();
  };

  return (
    <div
      id="add-url-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="add-url-modal-card"
        className="w-full max-w-md bg-[#181a20] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Add URL</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Enter or paste web address:
            </label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://example.com/article"
                autoFocus
                className="w-full bg-[#101216] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00ea77] focus:ring-1 focus:ring-[#00ea77] transition-all"
              />
            </div>
            {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-[#00ea77] hover:bg-[#00ff85] active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#00ea77]/20 flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Attach URL</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
