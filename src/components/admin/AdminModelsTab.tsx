import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Search,
  Filter,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Sliders,
  DollarSign,
  Zap,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export interface ModelRecord {
  id: string;
  providerId: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  isAvailable: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  supportsTools: boolean;
  recommendedUse: string;
}

interface AdminModelsTabProps {
  currentThemeHex: string;
  onShowToast: (msg: string) => void;
}

export const AdminModelsTab: React.FC<AdminModelsTabProps> = ({ currentThemeHex, onShowToast }) => {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');

  // Add Model Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newId, setNewId] = useState('');
  const [newProviderId, setNewProviderId] = useState('openrouter');
  const [newName, setNewName] = useState('');
  const [newContextWindow, setNewContextWindow] = useState(128000);
  const [newMaxOutput, setNewMaxOutput] = useState(4096);
  const [newInputPrice, setNewInputPrice] = useState(0);
  const [newOutputPrice, setNewOutputPrice] = useState(0);
  const [newSupportsVision, setNewSupportsVision] = useState(true);
  const [newRecommendedUse, setNewRecommendedUse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
      }
    } catch (e) {
      console.warn('Failed to fetch models:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/admin/models/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: id, isEnabled: !current }),
      });
      if (res.ok) {
        setModels((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isAvailable: !current } : m))
        );
        onShowToast(`Model ${id} is now ${!current ? 'available' : 'disabled'}`);
      }
    } catch {
      onShowToast('Failed to toggle model.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete model "${id}" from catalog?`)) return;
    try {
      const res = await fetch(`/api/admin/models/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setModels((prev) => prev.filter((m) => m.id !== id));
        onShowToast(`Model ${id} deleted.`);
      }
    } catch {
      onShowToast('Failed to delete model.');
    }
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) {
      onShowToast('Model ID and Name are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: {
            id: newId.trim(),
            providerId: newProviderId,
            name: newName.trim(),
            contextWindow: Number(newContextWindow) || 128000,
            maxOutput: Number(newMaxOutput) || 4096,
            inputPricePerMillion: Number(newInputPrice) || 0,
            outputPricePerMillion: Number(newOutputPrice) || 0,
            isAvailable: true,
            supportsVision: newSupportsVision,
            supportsStreaming: true,
            supportsTools: true,
            recommendedUse: newRecommendedUse.trim() || 'Custom model deployment.',
          },
        }),
      });
      if (res.ok) {
        onShowToast(`Model ${newName} added to catalog.`);
        setShowAddModal(false);
        setNewId('');
        setNewName('');
        setNewRecommendedUse('');
        fetchModels();
      } else {
        const data = await res.json();
        onShowToast(data.error || 'Failed to create model.');
      }
    } catch {
      onShowToast('Error creating model.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueProviders = Array.from(new Set(models.map((m) => m.providerId)));

  const filteredModels = models.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.recommendedUse.toLowerCase().includes(searchQuery.toLowerCase());
    const matchProvider = providerFilter === 'all' || m.providerId === providerFilter;
    return matchSearch && matchProvider;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5" style={{ color: currentThemeHex }} />
            <h3 className="text-base sm:text-lg font-bold text-white">Model Registry & Catalog</h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/10 text-slate-300 font-mono">
              {models.length} Models
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Inspect model capabilities, context windows, real token pricing ($/M tokens), vision support, and toggle availability across the Sigma ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchModels}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:opacity-95"
            style={{ backgroundColor: currentThemeHex }}
          >
            <Plus className="w-4 h-4" />
            <span>Register Model</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search model name, slug, capability..."
            className="w-full bg-[#12141a] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Filter Provider:</span>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="bg-[#12141a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
          >
            <option value="all">All Providers ({models.length})</option>
            {uniqueProviders.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((m) => {
          const isFree = m.inputPricePerMillion === 0 && m.outputPricePerMillion === 0;

          return (
            <div
              key={m.id}
              className={`bg-[#12141a] border rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all flex flex-col justify-between ${
                m.isAvailable ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{m.name}</h4>
                    <span className="text-[11px] font-mono text-slate-500 block truncate">{m.id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(m.id, m.isAvailable)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase cursor-pointer border ${
                      m.isAvailable
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {m.isAvailable ? 'Active' : 'Offline'}
                  </button>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{m.recommendedUse}</p>
              </div>

              {/* Specs & Pricing */}
              <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Context Window:</span>
                    <span className="text-white font-mono font-bold">
                      {(m.contextWindow / 1000).toLocaleString()}k tokens
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Pricing / 1M tokens:</span>
                    <span
                      className={`font-mono font-bold ${
                        isFree ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isFree ? 'Free Tier ($0)' : `$${m.inputPricePerMillion} / $${m.outputPricePerMillion}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-white/5 text-slate-300 font-mono">
                    Provider: {m.providerId}
                  </span>
                  {m.supportsVision && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-blue-950/50 text-blue-300 font-mono border border-blue-800/30">
                      👁 Vision
                    </span>
                  )}
                  {m.supportsStreaming && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-purple-950/50 text-purple-300 font-mono border border-purple-800/30">
                      ⚡ Stream
                    </span>
                  )}
                  {m.supportsTools && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-950/50 text-emerald-300 font-mono border border-emerald-800/30">
                      🛠 Tools
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500">Max Output: {m.maxOutput} tokens</span>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                  title="Remove Model"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Model Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-[#13151b] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4" style={{ color: currentThemeHex }} />
                <span>Register Model in Catalog</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateModel} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Model Slug / ID</label>
                <input
                  type="text"
                  required
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="e.g. meta-llama/llama-3.3-70b-instruct"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Provider ID</label>
                  <input
                    type="text"
                    required
                    value={newProviderId}
                    onChange={(e) => setNewProviderId(e.target.value)}
                    placeholder="openrouter, google, etc."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Llama 3.3 70B Turbo"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Context Window (tokens)</label>
                  <input
                    type="number"
                    value={newContextWindow}
                    onChange={(e) => setNewContextWindow(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Output (tokens)</label>
                  <input
                    type="number"
                    value={newMaxOutput}
                    onChange={(e) => setNewMaxOutput(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Input Price / 1M ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInputPrice}
                    onChange={(e) => setNewInputPrice(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Output Price / 1M ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOutputPrice}
                    onChange={(e) => setNewOutputPrice(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Recommended Use / Description</label>
                <textarea
                  rows={2}
                  value={newRecommendedUse}
                  onChange={(e) => setNewRecommendedUse(e.target.value)}
                  placeholder="Optimal for deep logic reasoning and code generation."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl font-bold text-black cursor-pointer"
                  style={{ backgroundColor: currentThemeHex }}
                >
                  {isSubmitting ? 'Registering...' : 'Register Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModelsTab;
