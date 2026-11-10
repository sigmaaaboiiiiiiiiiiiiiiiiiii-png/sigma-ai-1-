import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  GraduationCap,
  Globe,
  Youtube,
  Image as ImageIcon,
  Activity,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Search,
  Sparkles,
  Layers,
  ShieldCheck,
  Power,
  RefreshCw,
  Upload,
} from 'lucide-react';
import {
  getStudySources,
  saveStudySources,
  isStudySourcesMasterEnabled,
  setStudySourcesMasterEnabled,
  isPreferOfficialBoard,
  setPreferOfficialBoard,
  addCustomStudySource,
  removeCustomStudySource,
  toggleSourceEnabled,
  getStudyImageMaterials,
  saveStudyImageMaterial,
  deleteStudyImageMaterial,
  StudySource,
  StudyImageMaterial,
} from '../lib/studySources';
import { PastPaperCenterModal } from './PastPaperCenterModal';
import { getFullPastPaperCatalogue } from '../lib/pastPapersCatalog';
import { PastPapersCoTab } from './PastPapersCoTab';

export interface StudySourcesWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskSigmaAi?: (prompt: string) => void;
  onOpenPdf?: (resource: any) => void;
  onUploadMyPdf?: () => void;
}

// Case-insensitive, typo-tolerant matching helper for Study Sources
function matchesFuzzyStudyQuery(text: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;

  const qTokens = q.split(/\s+/).filter(Boolean);
  if (qTokens.every((tok) => t.includes(tok))) return true;

  // Typo tolerance: if query word >= 4 chars, match if edit distance <= 2
  const textWords = t.split(/[\s,.:;!?-]+/).filter((w) => w.length >= 3);
  return qTokens.every((qToken) => {
    if (t.includes(qToken)) return true;
    if (qToken.length < 4) return false;
    return textWords.some((tWord) => {
      if (Math.abs(tWord.length - qToken.length) > 2) return false;
      let diff = 0;
      const maxL = Math.max(tWord.length, qToken.length);
      for (let i = 0; i < maxL; i++) {
        if (tWord[i] !== qToken[i]) diff++;
        if (diff > 2) return false;
      }
      return diff <= 2;
    });
  });
}

export const StudySourcesWorkspaceModal: React.FC<StudySourcesWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onAskSigmaAi,
  onOpenPdf,
  onUploadMyPdf,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'past_papers' | 'boards' | 'hubs' | 'websites' | 'youtube' | 'materials' | 'pastpapers_co' | 'activity'
  >('overview');

  const [sources, setSources] = useState<StudySource[]>(() => getStudySources());
  const [images, setImages] = useState<StudyImageMaterial[]>(() => getStudyImageMaterials());
  const [isMasterEnabled, setIsMasterEnabled] = useState<boolean>(() => isStudySourcesMasterEnabled());
  const [preferOfficial, setPreferOfficial] = useState<boolean>(() => isPreferOfficialBoard());

  // Add Website Dialog
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [webUrl, setWebUrl] = useState('');
  const [webTitle, setWebTitle] = useState('');
  const [webDesc, setWebDesc] = useState('');
  const [webIsTemp, setWebIsTemp] = useState(false);

  // Add YouTube Dialog
  const [showAddYoutube, setShowAddYoutube] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [ytDesc, setYtDesc] = useState('');
  const [ytIsChannel, setYtIsChannel] = useState(false);

  // Add Image Dialog
  const [showAddImage, setShowAddImage] = useState(false);
  const [imgName, setImgName] = useState('');
  const [imgDesc, setImgDesc] = useState('');
  const [imgDataUrl, setImgDataUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search in tabs
  const [filterQuery, setFilterQuery] = useState('');

  // Total past papers catalog size
  const totalCatalogSize = useMemo(() => getFullPastPaperCatalogue().length, []);

  useEffect(() => {
    const handleSync = () => {
      setSources(getStudySources());
      setImages(getStudyImageMaterials());
      setIsMasterEnabled(isStudySourcesMasterEnabled());
    };
    window.addEventListener('sigma-study-sources-updated', handleSync);
    window.addEventListener('sigma-study-images-updated', handleSync);
    window.addEventListener('sigma-study-sources-master-changed', handleSync);
    return () => {
      window.removeEventListener('sigma-study-sources-updated', handleSync);
      window.removeEventListener('sigma-study-images-updated', handleSync);
      window.removeEventListener('sigma-study-sources-master-changed', handleSync);
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleMaster = () => {
    const next = !isMasterEnabled;
    setIsMasterEnabled(next);
    setStudySourcesMasterEnabled(next);
  };

  const handleToggleSource = (id: string) => {
    const updated = toggleSourceEnabled(id);
    setSources(updated);
  };

  const handleTogglePreferOfficial = () => {
    const next = !preferOfficial;
    setPreferOfficial(next);
    setPreferOfficialBoard(next);
  };

  const handleAddWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webUrl.trim()) return;

    let cleanUrl = webUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    addCustomStudySource({
      name: webTitle.trim() || cleanUrl.replace(/^https?:\/\/(www\.)?/, ''),
      category: 'custom_website',
      url: cleanUrl,
      description: webDesc.trim() || 'User-added study website',
      enabled: true,
      categoryLabel: 'Custom Website',
      isTemporary: webIsTemp,
      verifiedAt: 'User Verified',
    });

    setWebUrl('');
    setWebTitle('');
    setWebDesc('');
    setWebIsTemp(false);
    setShowAddWebsite(false);
  };

  const handleAddYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytUrl.trim()) return;

    addCustomStudySource({
      name: ytTitle.trim() || (ytIsChannel ? 'Custom YouTube Channel' : 'Educational Video Lecture'),
      category: ytIsChannel ? 'video_channel' : 'video',
      url: ytUrl.trim(),
      description: ytDesc.trim() || 'User-added YouTube learning resource',
      enabled: true,
      categoryLabel: ytIsChannel ? 'YouTube Channel' : 'YouTube Video',
      verifiedAt: 'Verified Channel Resource',
    });

    setYtUrl('');
    setYtTitle('');
    setYtDesc('');
    setShowAddYoutube(false);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!imgName) setImgName(file.name.replace(/\.[^/.]+$/, ''));
      const reader = new FileReader();
      reader.onload = (event) => {
        setImgDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImageMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgName.trim() || !imgDataUrl) return;

    saveStudyImageMaterial(imgName.trim(), imgDesc.trim(), imgDataUrl);
    setImgName('');
    setImgDesc('');
    setImgDataUrl('');
    setShowAddImage(false);
  };

  const activeSourcesCount = sources.filter((s) => s.enabled).length;
  const disabledSourcesCount = sources.length - activeSourcesCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-6xl h-[92vh] bg-[#0b0f17] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header with Master Switch */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#101520] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Study Sources & Education Workspace
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-medium">
                  Centralized Hub
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official exam boards, past paper repositories, educational hubs & user learning materials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Master Switch */}
            <div className="flex items-center gap-2 bg-[#0c1017] px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Study Sources AI Retrieval:</span>
              <button
                type="button"
                onClick={handleToggleMaster}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isMasterEnabled ? 'bg-sky-600' : 'bg-slate-700'
                }`}
                title={isMasterEnabled ? 'Master ON: AI retrieves from active sources' : 'Master OFF: AI retrieval disabled'}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isMasterEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-[11px] font-bold font-mono ${isMasterEnabled ? 'text-sky-400' : 'text-slate-500'}`}>
                {isMasterEnabled ? 'ON' : 'OFF'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-[#0e131d] flex items-center gap-2 overflow-x-auto text-xs py-2 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'past_papers', label: `Past Papers (${totalCatalogSize.toLocaleString()})`, icon: GraduationCap },
            { id: 'boards', label: 'Exam Boards', icon: ShieldCheck },
            { id: 'hubs', label: 'Educational Hubs', icon: Globe },
            { id: 'websites', label: 'Websites', icon: Globe },
            { id: 'youtube', label: 'YouTube Sources', icon: Youtube },
            { id: 'materials', label: `Saved Materials (${images.length})`, icon: ImageIcon },
            { id: 'pastpapers_co', label: 'PastPapers.Co', icon: BookOpen },
            { id: 'activity', label: 'Connections & Activity', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Master OFF Warning Banner */}
        {!isMasterEnabled && (
          <div className="px-6 py-2 bg-amber-950/40 border-b border-amber-800/50 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Study Sources Retrieval is paused (Master OFF).</strong> Sigma AI will rely on its internal knowledge base without live retrieval from external sources.
              </span>
            </div>
            <button
              onClick={handleToggleMaster}
              className="px-2.5 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold cursor-pointer"
            >
              Turn ON
            </button>
          </div>
        )}

        {/* Search Bar for Study Sources (Typo-tolerant & Exact) */}
        {['boards', 'hubs', 'websites', 'youtube', 'materials'].includes(activeTab) && (
          <div className="px-6 py-2.5 bg-[#0a0e16] border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search saved titles, topics, boards (typo-tolerant)..."
                className="w-full bg-[#121722] text-xs text-white placeholder-slate-500 pl-8 pr-7 py-1.5 rounded-lg border border-slate-700/60 focus:border-sky-500 focus:outline-none transition-colors"
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {filterQuery && (
              <span className="text-[11px] text-sky-400 font-mono">
                Filtering by "{filterQuery}"
              </span>
            )}
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#121722] border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Total Saved Sources</div>
                  <div className="text-2xl font-bold text-white mt-1">{sources.length}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Official boards & custom resources</div>
                </div>

                <div className="p-4 rounded-xl bg-[#121722] border border-slate-800">
                  <div className="text-xs text-emerald-400 font-medium">Active / Enabled Sources</div>
                  <div className="text-2xl font-bold text-emerald-300 mt-1">{activeSourcesCount}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Eligible for AI context retrieval</div>
                </div>

                <div className="p-4 rounded-xl bg-[#121722] border border-slate-800">
                  <div className="text-xs text-sky-400 font-medium">Indexed Past Papers</div>
                  <div className="text-2xl font-bold text-sky-300 mt-1">{totalCatalogSize.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Verified Cambridge, AKU & FBISE</div>
                </div>

                <div className="p-4 rounded-xl bg-[#121722] border border-slate-800">
                  <div className="text-xs text-purple-400 font-medium">Saved Diagrams & Images</div>
                  <div className="text-2xl font-bold text-purple-300 mt-1">{images.length}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Private labeled study diagrams</div>
                </div>
              </div>

              {/* Prefer Official Boards Toggle Card */}
              <div className="p-4 rounded-xl bg-[#121722] border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Prefer Official Exam Boards & Syllabuses</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Prioritize Cambridge (CAIE), Aga Khan Board (AKU-EB), and Federal Board (FBISE) standards when answering syllabus and grading questions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePreferOfficial}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    preferOfficial ? 'bg-sky-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      preferOfficial ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setShowAddWebsite(true)}
                  className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/50 text-left transition-all cursor-pointer group"
                >
                  <Globe className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform mb-2" />
                  <div className="text-xs font-bold text-white">+ Add Website Source</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Index official syllabuses or educational portals.</div>
                </button>

                <button
                  onClick={() => setShowAddYoutube(true)}
                  className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-red-500/50 text-left transition-all cursor-pointer group"
                >
                  <Youtube className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform mb-2" />
                  <div className="text-xs font-bold text-white">+ Add YouTube Source</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Connect educational channels or lecture videos.</div>
                </button>

                <button
                  onClick={() => setShowAddImage(true)}
                  className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 text-left transition-all cursor-pointer group"
                >
                  <ImageIcon className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform mb-2" />
                  <div className="text-xs font-bold text-white">+ Save Study Diagram</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Upload cell diagrams, formulas, or study notes.</div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PAST PAPERS */}
          {activeTab === 'past_papers' && (
            <div className="h-full">
              <PastPaperCenterModal
                isOpen={true}
                onClose={() => {}}
                onAskSigmaAi={onAskSigmaAi}
                isEmbedded={true}
              />
            </div>
          )}

          {/* TAB 3: EXAM BOARDS */}
          {activeTab === 'boards' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Official Examination Boards</h3>
                  <p className="text-xs text-slate-400">
                    Syllabuses, assessment patterns, student learning outcomes (SLOs), and official guidelines.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources
                  .filter(
                    (s) =>
                      (s.category === 'board' || s.isOfficialBoard) &&
                      matchesFuzzyStudyQuery(`${s.name} ${s.description}`, filterQuery)
                  )
                  .map((board) => (
                    <div
                      key={board.id}
                      className="p-4 rounded-xl bg-[#121722] border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {board.categoryLabel || 'Official Board'}
                          </span>
                          <button
                            onClick={() => handleToggleSource(board.id)}
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                              board.enabled
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {board.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-2">{board.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{board.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {board.verifiedAt || 'Official Board Verified'}
                        </span>
                        <a
                          href={board.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                        >
                          Visit Portal
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: EDUCATIONAL HUBS */}
          {activeTab === 'hubs' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Educational Hubs & Learning Platforms</h3>
                  <p className="text-xs text-slate-400">
                    Interactive STEM exercises, structured revision guides, and mastery-based lessons.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources
                  .filter(
                    (s) =>
                      s.category === 'learning_platform' &&
                      matchesFuzzyStudyQuery(`${s.name} ${s.description}`, filterQuery)
                  )
                  .map((hub) => (
                    <div
                      key={hub.id}
                      className="p-4 rounded-xl bg-[#121722] border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {hub.categoryLabel || 'Learning Platform'}
                          </span>
                          <button
                            onClick={() => handleToggleSource(hub.id)}
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                              hub.enabled
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {hub.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-2">{hub.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{hub.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {hub.verifiedAt || 'Verified Resource'}
                        </span>
                        <a
                          href={hub.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                        >
                          Open Platform
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 5: WEBSITES */}
          {activeTab === 'websites' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Study Websites & Syllabuses</h3>
                  <p className="text-xs text-slate-400">
                    Curated reference websites and user-added educational URLs.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddWebsite(true)}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Website</span>
                </button>
              </div>

              <div className="space-y-3">
                {sources
                  .filter(
                    (s) =>
                      (s.category === 'custom_website' || s.category === 'curriculum') &&
                      matchesFuzzyStudyQuery(`${s.name} ${s.description} ${s.url}`, filterQuery)
                  )
                  .map((site) => (
                    <div
                      key={site.id}
                      className="p-4 rounded-xl bg-[#121722] border border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{site.name}</h4>
                          {site.isTemporary && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-semibold">
                              Session Only
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{site.description}</p>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 truncate max-w-md"
                        >
                          {site.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSource(site.id)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer ${
                            site.enabled
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {site.enabled ? 'Active' : 'Disabled'}
                        </button>
                        {site.isCustom && (
                          <button
                            onClick={() => {
                              const updated = removeCustomStudySource(site.id);
                              setSources(updated);
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                            title="Remove custom source"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 6: YOUTUBE SOURCES */}
          {activeTab === 'youtube' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">YouTube Educational Channels & Lectures</h3>
                  <p className="text-xs text-slate-400">
                    High-yield conceptual video explanations and public channel repositories.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddYoutube(true)}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add YouTube Source</span>
                </button>
              </div>

              <div className="space-y-3">
                {sources
                  .filter(
                    (s) =>
                      (s.category === 'video' || s.category === 'video_channel') &&
                      matchesFuzzyStudyQuery(`${s.name} ${s.description} ${s.url}`, filterQuery)
                  )
                  .map((yt) => (
                    <div
                      key={yt.id}
                      className="p-4 rounded-xl bg-[#121722] border border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-400" />
                          <h4 className="text-sm font-bold text-white">{yt.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 font-semibold">
                            {yt.categoryLabel || 'Educational Channel'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{yt.description}</p>
                        <a
                          href={yt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-red-400 hover:underline flex items-center gap-1 truncate max-w-md"
                        >
                          {yt.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSource(yt.id)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer ${
                            yt.enabled
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {yt.enabled ? 'Active' : 'Disabled'}
                        </button>
                        {yt.isCustom && (
                          <button
                            onClick={() => {
                              const updated = removeCustomStudySource(yt.id);
                              setSources(updated);
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                            title="Remove YouTube source"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 7: SAVED STUDY MATERIALS */}
          {activeTab === 'materials' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Saved Diagrams & Custom Materials</h3>
                  <p className="text-xs text-slate-400">
                    User-uploaded science diagrams, handwritten formulas, and custom reference charts.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddImage(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Study Diagram</span>
                </button>
              </div>

              {images.filter((img) => matchesFuzzyStudyQuery(`${img.name} ${img.description} ${(img.tags || []).join(' ')}`, filterQuery)).length === 0 ? (
                <div className="text-center py-16 px-4 bg-slate-900/30 rounded-2xl border border-slate-800">
                  <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-300">
                    {filterQuery ? `No study diagrams matching "${filterQuery}"` : 'No study diagrams saved yet'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {filterQuery
                      ? 'Try a different keyword or clear the search filter.'
                      : 'Upload cell diagrams, organ systems, or formula sheets with custom names so Sigma AI can reference them.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {images
                    .filter((img) => matchesFuzzyStudyQuery(`${img.name} ${img.description} ${(img.tags || []).join(' ')}`, filterQuery))
                    .map((img) => (
                    <div
                      key={img.id}
                      className="p-3 rounded-xl bg-[#121722] border border-slate-800 space-y-2 flex flex-col justify-between"
                    >
                      <div className="w-full h-36 bg-slate-900 rounded-lg overflow-hidden border border-slate-800/80">
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{img.name}</h4>
                        {img.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                            {img.description}
                          </p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        {onAskSigmaAi && (
                          <button
                            onClick={() => {
                              onAskSigmaAi(`Explain this saved study diagram: "${img.name}". ${img.description}`);
                              onClose();
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            Ask AI
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const updated = deleteStudyImageMaterial(img.id);
                            setImages(updated);
                          }}
                          className="p-1 text-slate-500 hover:text-red-400 rounded-md"
                          title="Delete diagram"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: PASTPAPERS.CO 5-LEVEL HIERARCHY */}
          {activeTab === 'pastpapers_co' && (
            <div className="p-6">
              <PastPapersCoTab
                onOpenPdf={(res) => {
                  if (onOpenPdf) {
                    onOpenPdf(res);
                  }
                }}
                onSolveWithAi={(prompt, ctx) => {
                  if (onAskSigmaAi) {
                    onAskSigmaAi(prompt);
                    onClose();
                  }
                }}
                onUploadMyPdf={onUploadMyPdf}
              />
            </div>
          )}

          {/* TAB 9: SOURCE CONNECTIONS & ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Source Verification & Activity Log</h3>
                <p className="text-xs text-slate-400">
                  Real-time status of connected syllabus indexes, rate limit checks, and live retrieval requests.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#121722] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Cambridge Resource Centre Index</div>
                      <div className="text-[11px] text-slate-400">Verified official CAIE past paper catalog online.</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">Live</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#121722] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Aga Khan University Examination Board (AKU-EB)</div>
                      <div className="text-[11px] text-slate-400">Student Learning Outcomes (SLO) assessment active.</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">Live</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#121722] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Federal Board (FBISE) Examination Repository</div>
                      <div className="text-[11px] text-slate-400">Matric & Inter model paper banks verified.</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">Live</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Add Website */}
        {showAddWebsite && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0e141f] border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">Add Study Website Source</h3>
                <button onClick={() => setShowAddWebsite(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddWebsite} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Website URL *</label>
                  <input
                    type="url"
                    required
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    placeholder="https://example-study.org"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Title</label>
                  <input
                    type="text"
                    value={webTitle}
                    onChange={(e) => setWebTitle(e.target.value)}
                    placeholder="e.g. Physics Revision Portal"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={webDesc}
                    onChange={(e) => setWebDesc(e.target.value)}
                    placeholder="What syllabus or subjects this site covers..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-sky-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="web-temp-check"
                    checked={webIsTemp}
                    onChange={(e) => setWebIsTemp(e.target.checked)}
                    className="rounded-sm border-slate-700 bg-slate-900 text-sky-600"
                  />
                  <label htmlFor="web-temp-check" className="text-xs text-slate-300">
                    Temporary source (expire with current session)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddWebsite(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white"
                  >
                    Save Website
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add YouTube */}
        {showAddYoutube && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0e141f] border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">Add YouTube Learning Source</h3>
                <button onClick={() => setShowAddYoutube(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddYoutube} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">YouTube URL *</label>
                  <input
                    type="url"
                    required
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    placeholder="https://www.youtube.com/@channel or watch?v=..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Channel / Video Title</label>
                  <input
                    type="text"
                    value={ytTitle}
                    onChange={(e) => setYtTitle(e.target.value)}
                    placeholder="e.g. FreeCodeCamp / Khan Academy Physics"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="yt-channel-check"
                    checked={ytIsChannel}
                    onChange={(e) => setYtIsChannel(e.target.checked)}
                    className="rounded-sm border-slate-700 bg-slate-900 text-red-600"
                  />
                  <label htmlFor="yt-channel-check" className="text-xs text-slate-300">
                    This is a full educational Channel (not a single video)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddYoutube(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white"
                  >
                    Save Source
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Image Diagram */}
        {showAddImage && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0e141f] border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">Save Study Diagram / Image</h3>
                <button onClick={() => setShowAddImage(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveImageMaterial} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Diagram Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={imgName}
                    onChange={(e) => setImgName(e.target.value)}
                    placeholder="e.g. Biology Cell Diagram"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description & Key Labels
                  </label>
                  <textarea
                    rows={2}
                    value={imgDesc}
                    onChange={(e) => setImgDesc(e.target.value)}
                    placeholder="Grade 8 biology diagram showing cell structures, mitochondria..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Image File *</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 rounded-xl border border-dashed border-slate-700 hover:border-purple-500 bg-slate-900/60 flex flex-col items-center justify-center cursor-pointer transition-colors"
                  >
                    {imgDataUrl ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden">
                        <img src={imgDataUrl} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-500 mb-1" />
                        <span className="text-xs text-slate-400">Click to choose image file</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddImage(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!imgDataUrl}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white"
                  >
                    Save Diagram
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
