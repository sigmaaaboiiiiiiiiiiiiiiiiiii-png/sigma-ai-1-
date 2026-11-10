import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

export interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
  subject?: string;
  board?: string;
  qualification?: string;
  year?: number | string;
  session?: string;
  paperNumber?: string;
  onSolveWithAi?: (prompt: string, context: { title: string; url: string; subject?: string }) => void;
  onUploadMyPdf?: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  title,
  subject,
  board,
  qualification,
  year,
  session,
  paperNumber,
  onSolveWithAi,
  onUploadMyPdf,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isStudyPanelOpen, setIsStudyPanelOpen] = useState<boolean>(true);
  const [targetQuestion, setTargetQuestion] = useState<string>('1');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(12);
  const [embedFailed, setEmbedFailed] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setEmbedFailed(false);
      setCurrentPage(1);
    }
  }, [isOpen, pdfUrl]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(200, prev + 15));
  const handleZoomOut = () => setZoom((prev) => Math.max(50, prev - 15));
  const handleResetZoom = () => setZoom(100);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSolveAction = (type: 'q1' | 'customQ' | 'range' | 'full' | 'markScheme' | 'mistakes' | 'summary') => {
    let prompt = '';
    const paperContext = `${board ? board + ' ' : ''}${subject ? subject + ' ' : ''}${title}`;

    switch (type) {
      case 'q1':
        prompt = `Please solve Question 1 from the past paper "${paperContext}". Provide step-by-step reasoning, relevant formulas, clear calculations, the final answer, and mark scheme allocation points.`;
        break;
      case 'customQ':
        prompt = `Please solve Question ${targetQuestion || '1'} from the past paper "${paperContext}". Provide complete step-by-step working, state all required equations, calculate the final answer with units, and align with the official mark scheme criteria.`;
        break;
      case 'range':
        prompt = `Please solve Questions 1 through 5 from the past paper "${paperContext}" section-by-section with step-by-step methods and final answers.`;
        break;
      case 'full':
        prompt = `Please solve the complete past paper "${paperContext}" step-by-step. Break the solution down question-by-question, maintaining the original question numbering, showing all intermediate workings and final answers.`;
        break;
      case 'markScheme':
        prompt = `Explain the official marking requirements and breakdown for "${paperContext}". How are marks awarded, what key phrases earn method marks (M) vs accuracy marks (A), and how should an examiner grade this?`;
        break;
      case 'mistakes':
        prompt = `What are the most common student mistakes, pitfalls, and examiner report comments for "${paperContext}"? How can I ensure full marks?`;
        break;
      case 'summary':
        prompt = `Analyze "${paperContext}" and summarize the key syllabus topics and formulas tested in this exam paper.`;
        break;
    }

    if (customQuery.trim()) {
      prompt = `${prompt}\n\nAdditional student question: ${customQuery.trim()}`;
    }

    if (onSolveWithAi) {
      onSolveWithAi(prompt, { title, url: pdfUrl, subject });
    }
    onClose();
  };

  // Google Docs Viewer fallback for direct PDF viewing without CORS blocks
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-full max-w-7xl max-h-[96vh] flex flex-col bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden m-2 sm:m-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0f1422] border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-md">{title}</h3>
                {board && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold flex-shrink-0">
                    {board}
                  </span>
                )}
                {qualification && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold flex-shrink-0 hidden sm:inline-block">
                    {qualification}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                {subject && <span>{subject}</span>}
                {session && <span>• {session} {year}</span>}
                {paperNumber && <span>• {paperNumber}</span>}
              </div>
            </div>
          </div>

          {/* Top Controls: Zoom, Fullscreen, Download, Close */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-[#141b2d] border border-slate-800 rounded-lg text-slate-300 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 text-[11px] font-mono hover:text-white cursor-pointer"
                title="Reset Zoom"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Toggle Study Solver Panel */}
            <button
              type="button"
              onClick={() => setIsStudyPanelOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                isStudyPanelOpen
                  ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
                  : 'bg-[#141b2d] border-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Solve with Sigma AI Study Panel"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Solve with AI</span>
            </button>

            {/* Download Button */}
            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-[#141b2d] hover:bg-[#1c263e] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close PDF Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area: PDF Viewport + AI Study Drawer */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Document Display */}
          <div className="flex-1 bg-[#06080e] relative flex flex-col items-center justify-center overflow-auto p-4">
            {!embedFailed ? (
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-150 origin-top"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              >
                <iframe
                  src={pdfUrl.startsWith('http') ? googleDocsViewerUrl : pdfUrl}
                  title={title}
                  className="w-full h-full min-h-[600px] rounded-lg border border-slate-800/80 shadow-inner bg-white"
                  onError={() => setEmbedFailed(true)}
                />
              </div>
            ) : (
              /* Fallback when embedding is restricted by third-party CORS header */
              <div className="max-w-lg p-6 bg-[#0f1422] border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
                <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">External Embedding Security Notice</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Direct in-frame embedding of this paper from the third-party repository is restricted by the origin server’s browser security policy.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in New Tab / Download</span>
                  </a>
                  {onUploadMyPdf && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onUploadMyPdf();
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1a2234] hover:bg-[#222d45] border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span>Upload My Downloaded PDF</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Integrated "Study This Paper" / "Solve With Sigma AI" Drawer */}
          {isStudyPanelOpen && (
            <div className="w-80 sm:w-96 bg-[#0d121c] border-l border-slate-800 flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-200">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#111724]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white tracking-wide uppercase">
                    Solve & Study With Sigma AI
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStudyPanelOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* Specific Question Solver */}
                <div className="p-3 rounded-xl bg-[#131926] border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Solve Specific Question</span>
                    <span className="text-[10px] text-blue-400 font-mono">Step-by-Step</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Question #</span>
                    <input
                      type="text"
                      value={targetQuestion}
                      onChange={(e) => setTargetQuestion(e.target.value)}
                      placeholder="e.g. 1, 3(b)"
                      className="w-20 px-2 py-1 rounded bg-[#0a0e16] border border-slate-700 text-white font-mono text-center focus:border-blue-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleSolveAction('customQ')}
                      className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      Solve Now
                    </button>
                  </div>
                </div>

                {/* Pre-configured Exam Workflows */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Solvers
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSolveAction('q1')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#131926] hover:bg-[#182030] border border-slate-800/80 hover:border-blue-500/50 text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="font-medium text-slate-200 group-hover:text-blue-300">
                        Solve Question 1
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Working, formula derivation & marks breakdown
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSolveAction('range')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#131926] hover:bg-[#182030] border border-slate-800/80 hover:border-blue-500/50 text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="font-medium text-slate-200 group-hover:text-blue-300">
                        Solve Questions 1–5
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Solve opening section systematically
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSolveAction('full')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#131926] hover:bg-[#182030] border border-slate-800/80 hover:border-purple-500/50 text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="font-medium text-purple-300 group-hover:text-purple-200 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Solve Complete Paper</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Section-by-section full comprehensive solution
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>

                {/* Mark Scheme Alignment & Examiner Insights */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Exam Strategy
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSolveAction('markScheme')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#131926] hover:bg-[#182030] border border-slate-800/80 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="font-medium text-emerald-300 group-hover:text-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Scheme Analysis</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Method marks vs accuracy criteria
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSolveAction('mistakes')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#131926] hover:bg-[#182030] border border-slate-800/80 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="font-medium text-amber-300 group-hover:text-amber-200 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Common Mistakes</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Examiner report warnings & tricky parts
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                  </button>
                </div>

                {/* Custom Prompt Box */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400">
                    Ask a Specific Question
                  </span>
                  <textarea
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder="e.g. Can you explain the diagram in Question 2 and why angle theta is negative?"
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-[#0a0e16] border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSolveAction('customQ')}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-semibold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    Send to Sigma AI
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
