import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Library,
  Image as ImageIcon,
  Plus,
  Search,
  Edit2,
  Copy,
  Check,
  Download,
  Trash2,
  ExternalLink,
  X,
  FileText,
  Code2,
  BookOpen,
  Sparkles,
  FileSpreadsheet,
  Presentation,
  Quote,
  Eye,
  Upload,
} from 'lucide-react';
import { Conversation, UserProfile } from '../types';
import {
  SavedLibraryItem,
  SavedPictureItem,
  LibraryContentType,
  getUnifiedLibraryItems,
  getUnifiedUserPictures,
  saveItemToLibrary,
  deleteLibraryItem,
  downloadLibraryItem,
  clearAllLibraryItems,
  saveUserUploadedPicture,
  deleteUserPicture,
} from '../lib/libraryStorage';
import { formatSafeTime } from '../lib/dateUtils';

const CONTENT_TYPES: LibraryContentType[] = [
  'Article',
  'Prompt',
  'Story',
  'Quote',
  'Presentation',
  'Spreadsheet',
  'Essay',
  'Code',
  'Document',
  'Summary',
];

interface LibraryPicturesViewProps {
  mode: 'library' | 'pictures' | 'library-only' | 'pictures-only' | 'both';
  initialSection?: string;
  user: UserProfile | { id: string; name: string; email: string; isLoggedIn: boolean; role?: any };
  conversations: Conversation[];
  themeColorHex?: string;
  compact?: boolean;
  onSelectConversation?: (conversationId: string) => void;
  onOpenImage?: (imgSrc: string) => void;
}

export const LibraryPicturesView: React.FC<LibraryPicturesViewProps> = ({
  mode: rawMode,
  initialSection,
  user: rawUser,
  conversations,
  themeColorHex = '#3b82f6',
  compact = false,
  onSelectConversation,
  onOpenImage,
}) => {
  const mode: 'library' | 'pictures' =
    rawMode === 'pictures' || rawMode === 'pictures-only' || initialSection === 'pictures'
      ? 'pictures'
      : 'library';
  const user: UserProfile = {
    role: 'user',
    ...rawUser,
  };
  const [refreshTick, setRefreshTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Editor / Viewer modal state for Library items
  const [activeEditorItem, setActiveEditorItem] = useState<SavedLibraryItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorType, setEditorType] = useState<LibraryContentType>('Essay');
  const [editorContent, setEditorContent] = useState('');

  // Lightbox state for Pictures
  const [previewPicture, setPreviewPicture] = useState<SavedPictureItem | null>(null);
  const pictureUploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleSync = () => setRefreshTick((t) => t + 1);
    window.addEventListener('sigma-library-updated', handleSync);
    window.addEventListener('sigma-pictures-updated', handleSync);
    return () => {
      window.removeEventListener('sigma-library-updated', handleSync);
      window.removeEventListener('sigma-pictures-updated', handleSync);
    };
  }, []);

  const libraryItems = useMemo(
    () => getUnifiedLibraryItems(user, conversations),
    [user, conversations, refreshTick]
  );

  const pictureItems = useMemo(
    () => getUnifiedUserPictures(user, conversations),
    [user, conversations, refreshTick]
  );

  const filteredLibraryItems = useMemo(() => {
    return libraryItems.filter((item) => {
      if (selectedTypeFilter !== 'All' && item.contentType !== selectedTypeFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.contentType.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
      );
    });
  }, [libraryItems, selectedTypeFilter, searchQuery]);

  const filteredPictures = useMemo(() => {
    if (!searchQuery.trim()) return pictureItems;
    const q = searchQuery.toLowerCase();
    return pictureItems.filter((p) => p.title.toLowerCase().includes(q));
  }, [pictureItems, searchQuery]);

  const handleOpenCreateEditor = () => {
    setActiveEditorItem(null);
    setIsCreatingNew(true);
    setEditorTitle('');
    setEditorType('Essay');
    setEditorContent('');
  };

  const handleOpenEditItem = (item: SavedLibraryItem) => {
    setIsCreatingNew(false);
    setActiveEditorItem(item);
    setEditorTitle(item.title);
    setEditorType(item.contentType);
    setEditorContent(item.content);
  };

  const handleSaveEditor = () => {
    if (!editorContent.trim()) return;
    saveItemToLibrary(user, {
      id: activeEditorItem?.id,
      title: editorTitle.trim() || `${editorType} Note`,
      contentType: editorType,
      content: editorContent,
      conversationId: activeEditorItem?.conversationId,
    });
    setActiveEditorItem(null);
    setIsCreatingNew(false);
  };

  const handleCopyItem = async (item: SavedLibraryItem) => {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleUploadPictureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 6)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          if (dataUrl) {
            saveUserUploadedPicture(user, {
              title: file.name.replace(/\.[^/.]+$/, '') || 'Uploaded Picture',
              src: dataUrl,
            });
          }
        };
        reader.readAsDataURL(file);
      });
    e.target.value = '';
  };

  const getTypeBadgeIcon = (type: LibraryContentType) => {
    switch (type) {
      case 'Code':
        return <Code2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Story':
        return <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />;
      case 'Quote':
        return <Quote className="w-3.5 h-3.5 text-pink-400" />;
      case 'Essay':
      case 'Article':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'Presentation':
        return <Presentation className="w-3.5 h-3.5 text-orange-400" />;
      case 'Spreadsheet':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  if (mode === 'pictures') {
    return (
      <div className="space-y-3">
        <input
          ref={pictureUploadInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUploadPictureFile}
        />

        {/* Header & Upload Action */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-xs sm:text-sm font-bold text-white">
              Uploaded Pictures ({pictureItems.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => pictureUploadInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Picture</span>
          </button>
        </div>

        {/* Pictures Grid */}
        {filteredPictures.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-[#11151f] border border-white/5 space-y-2">
            <ImageIcon className="w-7 h-7 text-slate-600 mx-auto" />
            <p className="text-xs font-medium text-slate-300">
              No uploaded pictures yet
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Images you upload or paste in chat are privately saved to your account here.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-2.5 ${
              compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            }`}
          >
            {filteredPictures.map((pic) => (
              <div
                key={pic.id}
                className="group relative rounded-xl overflow-hidden bg-[#141926] border border-slate-800 hover:border-cyan-500/50 transition-all shadow-sm flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => setPreviewPicture(pic)}
                  className="relative aspect-square w-full overflow-hidden bg-black/40 cursor-pointer"
                  title={`Open ${pic.title}`}
                >
                  <img
                    src={pic.src}
                    alt={pic.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </button>
                <div className="p-2 flex items-center justify-between gap-1 bg-[#10141f]">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-200 truncate">
                      {pic.title}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {formatSafeTime(pic.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewPicture(pic)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      title="View picture"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteUserPicture(user, pic.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                      title="Remove picture"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Individual Picture Lightbox Modal */}
        {previewPicture && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewPicture(null)}
          >
            <div
              className="bg-[#111622] border border-slate-700 rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white">{previewPicture.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    Uploaded {formatSafeTime(previewPicture.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenImage && (
                    <button
                      type="button"
                      onClick={() => {
                        const src = previewPicture.src;
                        setPreviewPicture(null);
                        onOpenImage(src);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer"
                    >
                      Open in Canvas
                    </button>
                  )}
                  {previewPicture.conversationId && onSelectConversation && (
                    <button
                      type="button"
                      onClick={() => {
                        const cid = previewPicture.conversationId!;
                        setPreviewPicture(null);
                        onSelectConversation(cid);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      Open Chat
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewPicture(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-[70vh] overflow-auto rounded-xl bg-black/60 flex items-center justify-center p-2">
                <img
                  src={previewPicture.src}
                  alt={previewPicture.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[65vh] w-auto object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIBRARY MODE
  return (
    <div className="space-y-3">
      {/* Top Controls: Search, Filter & Save New Item */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved essays, stories, articles, prompts, code..."
            className="w-full bg-[#161924] border border-white/10 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {libraryItems.length > 0 && (
            confirmClearAll ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs">
                <span className="text-rose-200 font-semibold text-[11px]">Clear all?</span>
                <button
                  type="button"
                  onClick={() => {
                    clearAllLibraryItems(user, conversations);
                    setConfirmClearAll(false);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                title="Clear all saved Library items"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Library</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={handleOpenCreateEditor}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 shadow-xs"
            style={{
              backgroundColor: `${themeColorHex}22`,
              border: `1px solid ${themeColorHex}55`,
              color: themeColorHex,
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Library Item</span>
          </button>
        </div>
      </div>

      {/* Content Type Filter Chips */}
      {!compact && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'Essay', 'Story', 'Article', 'Summary', 'Prompt', 'Code', 'Presentation', 'Spreadsheet'].map(
            (type) => {
              const active = selectedTypeFilter === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedTypeFilter(type);
                    setVisibleCount(12);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex-shrink-0 ${
                    active
                      ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/50'
                      : 'bg-[#151822] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {type}
                </button>
              );
            }
          )}
        </div>
      )}

      {/* Library Items List */}
      {filteredLibraryItems.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-2xl bg-[#11151f] border border-white/5 space-y-2">
          <Library className="w-7 h-7 text-slate-600 mx-auto" />
          <p className="text-xs font-medium text-slate-300">
            No saved Library items found
          </p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Reusable generated material (stories, long-form documents, code, summaries, presentations, and spreadsheets) appears here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLibraryItems.slice(0, visibleCount).map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-[#151924] hover:bg-[#191e2c] border border-white/8 hover:border-indigo-500/30 transition-all flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditItem(item)}
                  className="flex items-start gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800/90 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getTypeBadgeIcon(item.contentType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                        {item.contentType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.content}
                    </p>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>Updated {formatSafeTime(item.updatedAt || item.createdAt)}</span>
                    </div>
                  </div>
                </button>

                {/* Item Actions: Open/Edit, Copy, Download, Delete */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditItem(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Open & Edit item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyItem(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Copy content"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadLibraryItem(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Download item"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {item.conversationId && onSelectConversation && (
                    <button
                      type="button"
                      onClick={() => onSelectConversation(item.conversationId!)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Open original chat"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteLibraryItem(user, item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Delete from Library"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredLibraryItems.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="w-full py-2 px-3 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Load More ({filteredLibraryItems.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}

      {/* Library Item Open / Edit / Create Modal */}
      {(activeEditorItem || isCreatingNew) && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            setActiveEditorItem(null);
            setIsCreatingNew(false);
          }}
        >
          <div
            className="bg-[#121622] border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isCreatingNew ? 'Save Content to Library' : 'Library Item Editor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveEditorItem(null);
                  setIsCreatingNew(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  placeholder="Enter a meaningful title..."
                  className="w-full bg-[#181d2c] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">
                  Content Type
                </label>
                <select
                  value={editorType}
                  onChange={(e) => setEditorType(e.target.value as LibraryContentType)}
                  className="w-full bg-[#181d2c] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">
                Saved Content
              </label>
              <textarea
                rows={10}
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder="Write or paste essay, story, article, prompt, or code..."
                className="w-full bg-[#181d2c] border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-y"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {activeEditorItem && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyItem(activeEditorItem)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId === activeEditorItem.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadLibraryItem({
                          ...activeEditorItem,
                          title: editorTitle || activeEditorItem.title,
                          contentType: editorType,
                          content: editorContent,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveEditorItem(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditor}
                  disabled={!editorContent.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                >
                  Save to Library
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
