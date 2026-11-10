import React, { useState, useEffect } from 'react';
import {
  Server,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  ExternalLink,
  Search,
  Activity,
  Sliders,
  Clock,
  DollarSign,
} from 'lucide-react';

export interface ProviderRecord {
  id: string;
  name: string;
  type: 'official' | 'aggregator' | 'custom' | 'local';
  baseUrl: string;
  authHeader: 'Bearer' | 'x-api-key' | 'query_param' | 'custom';
  apiKey: string;
  status: 'connected' | 'disconnected' | 'rate_limited' | 'error' | 'not_configured';
  isEnabled: boolean;
  supportedCapabilities: string[];
  modelsCount: number;
  lastVerifiedAt: string | null;
  lastError: string | null;
  latencyMs: number;
  pricingTier: 'free' | 'pay_per_token' | 'subscription';
  description: string;
}

interface AdminProvidersTabProps {
  currentThemeHex: string;
  onShowToast: (msg: string) => void;
}

export const AdminProvidersTab: React.FC<AdminProvidersTabProps> = ({ currentThemeHex, onShowToast }) => {
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<Record<string, any>>({});

  // Add Provider Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'official' | 'aggregator' | 'custom' | 'local'>('custom');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (e) {
      console.warn('Failed to fetch providers:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleVerify = async (p: ProviderRecord) => {
    setVerifyingId(p.id);
    try {
      const res = await fetch('/api/admin/providers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: p.id,
          key: p.apiKey,
          endpoint: p.baseUrl,
        }),
      });
      const data = await res.json();
      setVerificationFeedback((prev) => ({ ...prev, [p.id]: data }));
      if (data.success) {
        onShowToast(`Verified ${p.name}: Connection active (${data.latencyMs}ms)`);
      } else {
        onShowToast(`Verification failed for ${p.name}: ${data.message}`);
      }
      fetchProviders();
    } catch (err: any) {
      onShowToast(`Network error verifying ${p.name}`);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleToggle = async (id: string, isEnabled: boolean) => {
    try {
      const res = await fetch('/api/admin/providers/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: id, isEnabled: !isEnabled }),
      });
      if (res.ok) {
        setProviders((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isEnabled: !isEnabled } : p))
        );
        onShowToast(`Provider ${id} is now ${!isEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (e) {
      onShowToast('Failed to toggle provider.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete provider "${id}" from the registry?`)) return;
    try {
      const res = await fetch(`/api/admin/providers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProviders((prev) => prev.filter((p) => p.id !== id));
        onShowToast(`Provider ${id} removed.`);
      }
    } catch (e) {
      onShowToast('Failed to delete provider.');
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) {
      onShowToast('Provider ID and Name are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: {
            id: newId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
            name: newName.trim(),
            type: newType,
            baseUrl: newBaseUrl.trim() || 'https://api.example.com/v1',
            authHeader: 'Bearer',
            apiKey: newApiKey.trim(),
            isEnabled: true,
            status: newApiKey.trim() ? 'connected' : 'not_configured',
            supportedCapabilities: ['chat', 'json'],
            modelsCount: 1,
            pricingTier: 'pay_per_token',
            description: newDescription.trim() || 'Custom AI provider endpoint.',
          },
        }),
      });
      if (res.ok) {
        onShowToast(`Provider ${newName} registered successfully.`);
        setShowAddModal(false);
        setNewId('');
        setNewName('');
        setNewBaseUrl('');
        setNewApiKey('');
        setNewDescription('');
        fetchProviders();
      } else {
        const data = await res.json();
        onShowToast(data.error || 'Failed to create provider.');
      }
    } catch (e) {
      onShowToast('Error creating provider.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProviders = providers.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'all' || p.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top summary header */}
      <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5" style={{ color: currentThemeHex }} />
            <h3 className="text-base sm:text-lg font-bold text-white">AI Provider Registry</h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/10 text-slate-300 font-mono">
              {providers.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real multi-provider registry supporting OpenRouter, Google Gemini, OpenAI, Anthropic, Groq, DeepSeek, Ollama, and enterprise endpoints with automated key verification.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchProviders}
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
            <span>Add Provider</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search provider name, ID or feature..."
            className="w-full bg-[#12141a] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-white/20"
          />
        </div>

        <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-xs self-stretch sm:self-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'aggregator', label: 'Aggregators' },
            { id: 'official', label: 'Official APIs' },
            { id: 'custom', label: 'Custom' },
            { id: 'local', label: 'Local (Ollama)' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterType(t.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                filterType === t.id ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProviders.map((p) => {
          const isVerifying = verifyingId === p.id;
          const feedback = verificationFeedback[p.id];
          const hasKey = Boolean(p.apiKey && p.apiKey.trim().length > 0);

          return (
            <div
              key={p.id}
              className={`bg-[#12141a] border rounded-2xl p-5 space-y-4 transition-all ${
                p.isEnabled ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-white truncate">{p.name}</h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-white/5 text-slate-400 border border-white/5">
                      {p.type}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 block truncate">{p.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(p.id, p.isEnabled)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                      p.isEnabled
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {p.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    title="Remove Provider"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>

              {/* Endpoint & Key Info */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px]">Endpoint URL:</span>
                  <span className="text-white font-mono text-[11px] truncate max-w-[240px]">{p.baseUrl}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px]">API Key Status:</span>
                  <span
                    className={`font-mono text-[11px] font-semibold ${
                      hasKey ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {hasKey ? `Configured (${p.apiKey.slice(0, 7)}•••)` : 'None (Uses Free / Local)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px]">Verified Latency:</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {p.latencyMs > 0 ? `${p.latencyMs} ms` : 'Not pinged'}
                  </span>
                </div>
              </div>

              {/* Capabilities & Pricing */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {p.supportedCapabilities.slice(0, 4).map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-white/5 text-slate-300 border border-white/5 font-mono"
                    >
                      {cap}
                    </span>
                  ))}
                  {p.supportedCapabilities.length > 4 && (
                    <span className="text-[10px] text-slate-500">+{p.supportedCapabilities.length - 4}</span>
                  )}
                </div>

                <span className="text-[11px] font-mono text-slate-400 capitalize">
                  {p.pricingTier.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Verification Feedback Badge if available */}
              {feedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                    feedback.success
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                      : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                  }`}
                >
                  {feedback.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold">{feedback.message}</div>
                    {feedback.details?.label && (
                      <div className="text-[11px] opacity-80 mt-0.5">Account: {feedback.details.label}</div>
                    )}
                    {feedback.details?.usage !== undefined && (
                      <div className="text-[11px] opacity-80">
                        Credits Used: ${Number(feedback.details.usage).toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {p.lastVerifiedAt ? `Pinged: ${new Date(p.lastVerifiedAt).toLocaleTimeString()}` : 'Never verified'}
                </span>

                <button
                  type="button"
                  onClick={() => handleVerify(p)}
                  disabled={isVerifying}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Activity className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{isVerifying ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Provider Modal */}
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
                <Server className="w-4 h-4" style={{ color: currentThemeHex }} />
                <span>Register AI Provider</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProvider} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Provider ID (Unique identifier)</label>
                <input
                  type="text"
                  required
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="e.g. together_ai, local_mistral, custom_corp"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Provider Display Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Together AI LLM Engine"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Provider Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="official">Official API</option>
                    <option value="aggregator">Aggregator / Gateway</option>
                    <option value="custom">Custom Endpoint</option>
                    <option value="local">Local (Ollama / vLLM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base URL Endpoint</label>
                  <input
                    type="text"
                    value={newBaseUrl}
                    onChange={(e) => setNewBaseUrl(e.target.value)}
                    placeholder="https://api.together.xyz/v1"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">API Key / Token (Optional)</label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of this provider capability..."
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
                  {isSubmitting ? 'Registering...' : 'Register Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProvidersTab;
