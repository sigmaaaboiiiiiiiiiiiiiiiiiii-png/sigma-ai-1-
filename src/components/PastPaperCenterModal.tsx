import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Filter,
  FileText,
  X,
  Layers,
  HelpCircle,
  Download,
  Send,
  RefreshCw,
  Globe,
  Tag,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  searchPastPapers,
  PastPaperItem,
  PastPaperFilterOptions,
  ExamBoardId,
} from '../lib/pastPapersCatalog';

export interface PastPaperCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskSigmaAi?: (prompt: string) => void;
  onOpenPdf?: (url: string, title: string, subject?: string, paper?: any) => void;
  themeColorHex?: string;
  isEmbedded?: boolean;
}

export const PastPaperCenterModal: React.FC<PastPaperCenterModalProps> = ({
  isOpen,
  onClose,
  onAskSigmaAi,
  onOpenPdf,
  themeColorHex,
  isEmbedded = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedPaperForAi, setSelectedPaperForAi] = useState<PastPaperItem | null>(null);

  // Search results
  const searchResult = useMemo(() => {
    const opts: PastPaperFilterOptions = {
      searchQuery,
      board: selectedBoard !== 'all' ? selectedBoard : undefined,
      subject: selectedSubject !== 'all' ? selectedSubject : undefined,
      year: selectedYear !== 'all' ? parseInt(selectedYear, 10) : undefined,
      session: selectedSession !== 'all' ? selectedSession : undefined,
      resourceType: selectedType !== 'all' ? selectedType : undefined,
      page: currentPage,
      pageSize: 15,
    };
    return searchPastPapers(opts);
  }, [searchQuery, selectedBoard, selectedSubject, selectedYear, selectedSession, selectedType, currentPage]);

  if (!isOpen && !isEmbedded) return null;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBoard('all');
    setSelectedSubject('all');
    setSelectedYear('all');
    setSelectedSession('all');
    setSelectedType('all');
    setCurrentPage(1);
  };

  const content = (
    <div className={`w-full ${isEmbedded ? '' : 'max-w-5xl max-h-[90vh] bg-[#0c1017] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100'}`}>
      {/* Header (Only if standalone modal) */}
      {!isEmbedded && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#101622]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Global Past Paper Catalogue
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  {searchResult.totalCatalogSize.toLocaleString()} Verified Papers
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official past examination papers, mark schemes, examiner reports & specimen papers for Cambridge, Edexcel, AKU-EB & FBISE.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-800 bg-[#0e131d] space-y-3">
        {/* Search input */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by subject (e.g. Biology, Mathematics), syllabus code (e.g. 0610, 9709), paper..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            Reset Filters
          </button>
        </div>

        {/* Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {/* Board */}
          <div>
            <select
              value={selectedBoard}
              onChange={(e) => {
                setSelectedBoard(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Boards</option>
              <option value="Cambridge International">Cambridge (CAIE)</option>
              <option value="Pearson Edexcel">Pearson Edexcel</option>
              <option value="AKU-EB">Aga Khan Board (AKU-EB)</option>
              <option value="FBISE">Federal Board (FBISE)</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Subjects</option>
              {searchResult.subjectsAvailable.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Years</option>
              {searchResult.yearsAvailable.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Session */}
          <div>
            <select
              value={selectedSession}
              onChange={(e) => {
                setSelectedSession(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Sessions</option>
              <option value="May/June">May / June (Summer)</option>
              <option value="October/November">Oct / Nov (Winter)</option>
              <option value="Feb/March">Feb / March (Spring)</option>
              <option value="Annual">Annual Exam</option>
            </select>
          </div>

          {/* Resource Type */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Resource Types</option>
              <option value="Question Paper">Question Paper (QP)</option>
              <option value="Mark Scheme">Mark Scheme (MS)</option>
              <option value="Examiner Report">Examiner Report (ER)</option>
              <option value="Specimen Paper">Specimen Paper</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="px-6 py-2.5 bg-[#0b0f17] border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-white">{searchResult.items.length}</span> of{' '}
          <span className="font-semibold text-emerald-400">{searchResult.totalMatches.toLocaleString()}</span> matching papers (Catalog: {searchResult.totalCatalogSize.toLocaleString()})
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px]">
          Page {searchResult.page} of {searchResult.totalPages}
        </div>
      </div>

      {/* Papers Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-[300px]">
        {searchResult.items.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/30 rounded-2xl border border-slate-800">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No past papers found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No verified papers match your selected search criteria. Try choosing &quot;All Subjects&quot; or clearing your query.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold cursor-pointer transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          searchResult.items.map((paper) => (
            <div
              key={paper.id}
              className="p-4 rounded-xl bg-[#111622] hover:bg-[#151c2c] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {paper.board}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                    {paper.qualification}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-semibold">
                    {paper.resourceType}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300">
                    {paper.session} {paper.year}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white truncate">{paper.title}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span>
                    Subject: <span className="text-slate-200">{paper.subject}</span> ({paper.subjectCode})
                  </span>
                  <span>
                    Component: <span className="text-slate-200">{paper.paper}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Archive
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {paper.pdfUrl ? (
                  onOpenPdf ? (
                    <button
                      type="button"
                      onClick={() => onOpenPdf(paper.pdfUrl, paper.title, paper.subject, paper)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Open PDF inside Sigma AI"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Open PDF</span>
                    </button>
                  ) : (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                      title="Open or Download Verified Paper PDF"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Open PDF</span>
                    </a>
                  )
                ) : (
                  <a
                    href={paper.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Official Hub</span>
                  </a>
                )}

                {onAskSigmaAi && (
                  <button
                    onClick={() => {
                      onAskSigmaAi(
                        `Let's solve past paper: ${paper.subject} (${paper.subjectCode}) ${paper.session} ${paper.year} ${paper.paper}. Provide a question-by-question walkthrough, key formula reminders, and Cambridge mark scheme insights.`
                      );
                      if (!isEmbedded) onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Solve with Sigma AI"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask Sigma AI</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {searchResult.totalPages > 1 && (
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0e131d] flex items-center justify-between text-xs">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-slate-400">
            Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
            <span className="font-semibold text-white">{searchResult.totalPages}</span>
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(searchResult.totalPages, p + 1))}
            disabled={currentPage === searchResult.totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 cursor-pointer"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      {content}
    </div>
  );
};
