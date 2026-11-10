import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Plus,
  Search,
  ExternalLink,
  Code2,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Check,
} from 'lucide-react';
import {
  AppProject,
  loadUserApps,
  deleteAppProject,
  saveAppProject,
} from '../lib/appBuilderStorage';
import { UserProfile } from '../types';

interface MyAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAppInPlayground: (app: AppProject) => void;
  onStartNewApp: () => void;
  themeColorHex?: string;
  user?: UserProfile;
  onShowToast?: (msg: string) => void;
}

export const MyAppsModal: React.FC<MyAppsModalProps> = ({
  isOpen,
  onClose,
  onOpenAppInPlayground,
  onStartNewApp,
  themeColorHex = '#00ea77',
  user,
  onShowToast = () => {},
}) => {
  const [apps, setApps] = useState<AppProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetchApps = async () => {
    setIsLoading(true);
    try {
      const list = await loadUserApps(user?.email, user?.id);
      setApps(list);
    } catch {
      onShowToast('Could not load user applications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchApps();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleDelete = async (appId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete application "${name}"? This action is permanent.`)) {
      return;
    }
    try {
      await deleteAppProject(appId, user?.id);
      setApps((prev) => prev.filter((a) => a.id !== appId));
      onShowToast(`Deleted "${name}"`);
    } catch {
      onShowToast('Failed to delete application.');
    }
  };

  const handleSaveRename = async (app: AppProject) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    const updated = { ...app, name: trimmed, updatedAt: new Date().toISOString() };
    await saveAppProject(updated, user?.id);
    setApps((prev) => prev.map((a) => (a.id === app.id ? updated : a)));
    setEditingId(null);
    onShowToast(`Renamed to "${trimmed}"`);
  };

  const filteredApps = apps.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0e121b] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-[#121624]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: `${themeColorHex}20`,
                border: `1.5px solid ${themeColorHex}40`,
                color: themeColorHex,
              }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">My Applications & Studio Hub</h3>
              <p className="text-xs text-slate-400">
                Manage, edit in Playground, export, or publish your custom Sigma AI applications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchApps}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white cursor-pointer"
              title="Refresh applications"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartNewApp();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:opacity-95"
              style={{ backgroundColor: themeColorHex }}
            >
              <Plus className="w-4 h-4" />
              <span>Create New App</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-white/5 bg-[#0b0e16] flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by application title or keywords..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredApps.length} {filteredApps.length === 1 ? 'App' : 'Apps'}
          </span>
        </div>

        {/* Apps Grid Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
              <span>Loading saved applications...</span>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-black/20 rounded-2xl border border-white/5 space-y-3">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No applications match your search query.</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartNewApp();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black cursor-pointer shadow-sm"
                style={{ backgroundColor: themeColorHex }}
              >
                + Build First Application
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApps.map((appItem) => {
                const isEditing = editingId === appItem.id;

                return (
                  <div
                    key={appItem.id}
                    className="p-5 rounded-2xl bg-[#121624] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(appItem)}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(appItem)}
                              className="p-1 rounded bg-emerald-500 text-black text-xs font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="min-w-0 flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                              {appItem.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(appItem.id);
                                setEditingName(appItem.name);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white"
                              title="Rename App"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 shrink-0">
                          {Object.keys(appItem.files || {}).length} files
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2">{appItem.description}</p>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>{new Date(appItem.updatedAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(appItem.id, appItem.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                          title="Delete App"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenAppInPlayground(appItem);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Open in Playground</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAppsModal;
