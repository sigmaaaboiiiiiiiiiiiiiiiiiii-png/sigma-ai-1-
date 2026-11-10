import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  WrapText,
  FileText,
  Globe,
  ExternalLink,
  Code2,
  FileCode,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { SourceItem } from '../types';

export interface RightPreviewDrawerData {
  isOpen: boolean;
  mode: 'file' | 'sources';
  title: string;
  filename?: string;
  content?: string;
  contentType?: string;
  sources?: SourceItem[];
  searchQuery?: string;
}

interface RightPreviewDrawerProps {
  data: RightPreviewDrawerData | null;
  onClose: () => void;
  themeColorHex?: string;
}

export const RightPreviewDrawer: React.FC<RightPreviewDrawerProps> = ({
  data,
  onClose,
  themeColorHex = '#3b82f6',
}) => {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);

  if (!data || !data.isOpen) return null;

  const handleCopy = async () => {
    if (!data.content) return;
    try {
      await navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleDownload = () => {
    if (!data.content) return;
    const name = data.filename || 'sigma-document.txt';
    const isCode = data.contentType === 'Code' || name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.py');
    const mime = isCode ? 'text/plain;charset=utf-8' : name.endsWith('.md') ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    
    const blob = new Blob([data.content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right Drawer Panel */}
      <aside
        id="sigma-right-preview-drawer"
        role="dialog"
        aria-label={data.mode === 'file' ? 'File Preview Drawer' : 'Sources Citation Drawer'}
        className="relative w-full max-w-lg md:max-w-xl h-full bg-[#0d121c] border-l border-slate-800/90 shadow-2xl flex flex-col z-10 pointer-events-auto animate-in slide-in-from-right duration-300"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/90 bg-[#101624]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              {data.mode === 'file' ? (
                data.contentType === 'Code' ? <Code2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />
              ) : (
                <Globe className="w-4 h-4 text-sky-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                {data.title || (data.mode === 'file' ? 'Document Preview' : 'Verified Web Sources')}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {data.mode === 'file'
                  ? data.filename || 'Plain Text File'
                  : `${(data.sources || []).length} verified citations from web search`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {data.mode === 'file' && (
              <>
                <button
                  type="button"
                  onClick={() => setWordWrap((prev) => !prev)}
                  className={`p-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                    wordWrap
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title={wordWrap ? 'Word Wrap: ON' : 'Word Wrap: OFF'}
                  aria-label="Toggle word wrap"
                >
                  <WrapText className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                  title="Copy Content"
                  aria-label="Copy file content"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  title="Download File"
                  aria-label="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close Drawer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body (Independently Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {data.mode === 'file' ? (
            <div className="space-y-3">
              {/* File Meta Info Badge */}
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/70">
                <span className="font-mono text-slate-300">{data.filename}</span>
                <span>{data.content ? `${data.content.length} characters • ${data.content.split(/\s+/).filter(Boolean).length} words` : ''}</span>
              </div>

              {/* Text Surface with Preserved Indentation */}
              <pre
                className={`p-4 rounded-xl bg-[#090d15] border border-slate-800/90 text-slate-200 text-xs sm:text-sm font-mono leading-relaxed select-text ${
                  wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
                }`}
              >
                {data.content}
              </pre>
            </div>
          ) : (
            /* Sources List */
            <div className="space-y-3">
              {data.searchQuery && (
                <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30 text-xs text-sky-200">
                  <span className="font-bold text-sky-300">Search Query: </span>
                  {data.searchQuery}
                </div>
              )}

              {data.sources && data.sources.length > 0 ? (
                data.sources.map((s, idx) => {
                  let domain = s.domain || '';
                  if (!domain) {
                    try {
                      domain = new URL(s.url).hostname.replace(/^www\./, '');
                    } catch {
                      domain = 'web';
                    }
                  }
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#111726] border border-slate-800 hover:border-sky-500/50 transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300">
                          {domain}
                        </span>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold group-hover:underline"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-sky-200 transition-colors">
                        {s.title || domain}
                      </h4>

                      {s.snippet && (
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {s.snippet}
                        </p>
                      )}

                      <div className="text-[10px] text-slate-500 truncate pt-1 font-mono">
                        {s.url}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No web sources available for this answer.
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
