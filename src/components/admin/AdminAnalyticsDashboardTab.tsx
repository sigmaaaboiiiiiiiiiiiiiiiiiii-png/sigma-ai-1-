import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  DollarSign,
  Users,
  Search,
  Filter,
  RefreshCw,
  Download,
  Trash2,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  Code,
  Eye,
  FileSpreadsheet,
  Presentation,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AdminAnalyticsDashboardTabProps {
  currentThemeHex: string;
  onShowToast: (msg: string) => void;
}

export const AdminAnalyticsDashboardTab: React.FC<AdminAnalyticsDashboardTabProps> = ({
  currentThemeHex,
  onShowToast,
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterDays, setFilterDays] = useState(7);
  const [selectedFeature, setSelectedFeature] = useState('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        days: String(filterDays),
        feature: selectedFeature,
        model: selectedModel,
      });
      const res = await fetch(`/api/admin/analytics/ai?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Failed to load AI analytics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filterDays, selectedFeature, selectedModel]);

  const handleExportCsv = () => {
    window.open('/api/admin/analytics/ai/export', '_blank');
    onShowToast('Downloading real AI requests analytics CSV...');
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear the AI request analytics log? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/analytics/ai/clear', { method: 'POST' });
      if (res.ok) {
        onShowToast('AI request logs cleared successfully.');
        fetchAnalytics();
      }
    } catch {
      onShowToast('Failed to clear analytics log.');
    }
  };

  const summary = data?.summary || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    successRatePercent: 100,
    avgDurationMs: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    actualCostUsd: 0,
    freeModelUsagePercent: 100,
    activeUsersCount: 0,
  };

  const recentLogs: any[] = (data?.recentLogs || []).filter((log: any) => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(log.requestId || '').toLowerCase().includes(q);
      const matchUser = String(log.userId || '').toLowerCase().includes(q);
      const matchModel = String(log.modelName || log.modelId || '').toLowerCase().includes(q);
      const matchFeature = String(log.feature || '').toLowerCase().includes(q);
      const matchReason = String(log.selectionReason || '').toLowerCase().includes(q);
      if (!matchId && !matchUser && !matchModel && !matchFeature && !matchReason) {
        return false;
      }
    }
    return true;
  });

  const getFeatureIcon = (feat: string) => {
    switch (feat) {
      case 'vision_ocr':
        return <Eye className="w-3.5 h-3.5 text-amber-400" />;
      case 'coding':
        return <Code className="w-3.5 h-3.5 text-cyan-400" />;
      case 'excel_generator':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
      case 'presentation_generator':
        return <Presentation className="w-3.5 h-3.5 text-rose-400" />;
      case 'reasoning':
        return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
      case 'multilingual':
        return <Sparkles className="w-3.5 h-3.5 text-teal-400" />;
      case 'ghost_mode':
        return <Zap className="w-3.5 h-3.5 text-fuchsia-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: currentThemeHex }} />
            <h3 className="text-base sm:text-lg font-bold text-white">
              AI Request Monitoring & Intelligent Routing Analytics
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              100% Free Models Policy
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live OpenRouter request telemetry, pseudonymous user attribution, task-based intelligent routing diagnostics, and strict zero-cost enforcement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Days selector */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
            {[1, 3, 7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setFilterDays(d)}
                className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  filterDays === d ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Clear Log */}
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#12141a] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Requests</span>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {summary.totalRequests.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Live recorded calls</p>
        </div>

        <div className="bg-[#12141a] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Success Rate</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
            {summary.successRatePercent}%
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {summary.successfulRequests} ok / {summary.failedRequests} err
          </p>
        </div>

        <div className="bg-[#12141a] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Latency</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {summary.avgDurationMs} <span className="text-xs font-normal text-slate-400">ms</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Response turnaround</p>
        </div>

        <div className="bg-[#12141a] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Tokens</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {summary.totalTokens >= 1000000
              ? `${(summary.totalTokens / 1000000).toFixed(2)}M`
              : summary.totalTokens >= 1000
              ? `${(summary.totalTokens / 1000).toFixed(1)}k`
              : summary.totalTokens}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {summary.totalPromptTokens} in · {summary.totalCompletionTokens} out
          </p>
        </div>

        <div className="bg-[#12141a] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Free Usage</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
            {summary.freeModelUsagePercent}%
          </p>
          <p className="text-[10px] text-emerald-400/80 mt-1">Strict Free Policy</p>
        </div>

        <div className="bg-[#12141a] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Actual Cost</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            ${summary.actualCostUsd.toFixed(6)}
          </p>
          <p className="text-[10px] text-emerald-400/80 mt-1">Zero billed charges</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Requests Over Time */}
        <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Requests Over Time
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Daily volume and success trend</p>
            </div>
          </div>
          <div className="h-60">
            {data?.requestsByDate && data.requestsByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.requestsByDate}>
                  <defs>
                    <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#callsGrad)"
                    name="Total Requests"
                  />
                  <Area
                    type="monotone"
                    dataKey="success"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="none"
                    name="Successful"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No activity recorded in this time range.
              </div>
            )}
          </div>
        </div>

        {/* Requests by Model */}
        <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                Requests by Intelligently Selected Model
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Task-optimized free model allocation</p>
            </div>
          </div>
          <div className="h-60">
            {data?.requestsByModel && data.requestsByModel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.requestsByModel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" stroke="#6b7280" fontSize={11} allowDecimals={false} />
                  <YAxis
                    dataKey="id"
                    type="category"
                    stroke="#6b7280"
                    fontSize={10}
                    width={140}
                    tickFormatter={(v) => v.replace(':free', '').replace('openrouter/', '')}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="calls" fill="#a855f7" radius={[0, 6, 6, 0]} name="Calls" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No model request data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature & Task Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By Feature */}
        <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-teal-400" />
            Requests by Task / Feature
          </h4>
          <div className="space-y-2.5">
            {data?.requestsByFeature && data.requestsByFeature.length > 0 ? (
              data.requestsByFeature.map((f: any) => (
                <div key={f.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2">
                    {getFeatureIcon(f.name)}
                    <span className="font-medium text-slate-200 capitalize">
                      {f.name.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono">{f.avgDurationMs}ms</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 font-bold text-white">
                      {f.calls}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No feature breakdown data yet.</p>
            )}
          </div>
        </div>

        {/* User Attribution (Pseudonymous & Private) */}
        <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Pseudonymous User Attribution
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Privacy-preserving hashed identifiers (no private emails or raw tokens exposed)
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {summary.activeUsersCount} active identifier(s)
            </span>
          </div>

          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] text-slate-400 uppercase bg-black/40 border-b border-white/10">
                <tr>
                  <th className="py-2 px-3">Pseudonymous User ID</th>
                  <th className="py-2 px-3">Session Type</th>
                  <th className="py-2 px-3">Requests</th>
                  <th className="py-2 px-3">Tokens Used</th>
                  <th className="py-2 px-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.requestsByUser && data.requestsByUser.length > 0 ? (
                  data.requestsByUser.map((u: any) => (
                    <tr key={u.userId} className="hover:bg-white/5">
                      <td className="py-2 px-3 font-mono text-cyan-300">{u.userId}</td>
                      <td className="py-2 px-3 text-slate-400">{u.label || 'Guest / User'}</td>
                      <td className="py-2 px-3 font-semibold text-white">{u.calls}</td>
                      <td className="py-2 px-3 font-mono text-slate-400">
                        {u.tokens.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {new Date(u.lastActive).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      No user attribution records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live AI Requests Log Table */}
      <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Live AI Request Attribution & Audit Log
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Every request recorded with model selection reason, duration, token usage, and OpenRouter generation ID.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-white/5 rounded-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] text-slate-400 uppercase bg-black/40 border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Request ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Feature</th>
                <th className="py-2.5 px-3">Selected Model</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Tokens</th>
                <th className="py-2.5 px-3">Cost</th>
                <th className="py-2.5 px-3">Selection Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-cyan-300">
                      {log.requestId}
                    </td>
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-300 text-[11px]">
                      {log.userId}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-200 capitalize text-[10px]">
                        {getFeatureIcon(log.feature)}
                        {log.feature.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-purple-300">
                      {log.modelName || log.modelId}
                    </td>
                    <td className="py-2 px-3">
                      {log.status === 'success' ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          OK
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          ERR
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400">{log.durationMs}ms</td>
                    <td className="py-2 px-3 font-mono text-slate-400">
                      {log.totalTokens}
                    </td>
                    <td className="py-2 px-3 font-mono text-emerald-400">
                      ${log.actualCostUsd.toFixed(6)}
                    </td>
                    <td className="py-2 px-3 text-slate-400 max-w-xs truncate" title={log.selectionReason}>
                      {log.selectionReason}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-500">
                    No requests match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
