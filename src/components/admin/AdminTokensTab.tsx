import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Zap,
  Activity,
  Layers,
  Clock,
  RefreshCw,
  BarChart2,
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

interface AdminTokensTabProps {
  currentThemeHex: string;
  onShowToast: (msg: string) => void;
}

export const AdminTokensTab: React.FC<AdminTokensTabProps> = ({ currentThemeHex, onShowToast }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterDays, setFilterDays] = useState(7);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/tokens?days=${filterDays}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.warn('Failed to fetch token analytics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filterDays]);

  const summary = analytics || {
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    totalCostUsd: 0,
    totalCalls: 0,
    perModel: {},
    perProvider: {},
    dailyTraffic: [],
    recentRecords: [],
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" style={{ color: currentThemeHex }} />
            <h3 className="text-base sm:text-lg font-bold text-white">Token Accounting & Cost Intelligence</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real prompt and completion token accounting, cost computation based on provider rate cards, and multi-model consumption telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
            {[3, 7, 14, 30].map((d) => (
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
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            label: 'Prompt Tokens',
            val: (summary.totalPromptTokens || 0).toLocaleString(),
            sub: 'Input context ingested',
            color: '#38bdf8',
          },
          {
            label: 'Completion Tokens',
            val: (summary.totalCompletionTokens || 0).toLocaleString(),
            sub: 'Generated responses',
            color: '#a855f7',
          },
          {
            label: 'Total Tokens',
            val: (summary.totalTokens || 0).toLocaleString(),
            sub: 'Combined throughput',
            color: currentThemeHex,
          },
          {
            label: 'Estimated Cost',
            val: `$${Number(summary.totalCostUsd || 0).toFixed(4)}`,
            sub: 'Net provider charges',
            color: '#10b981',
          },
          {
            label: 'Total Invocations',
            val: (summary.totalCalls || 0).toLocaleString(),
            sub: 'Executed inferences',
            color: '#f59e0b',
          },
        ].map((item, i) => (
          <div key={i} className="bg-[#12141a] border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 block">{item.label}</span>
            <div className="text-xl sm:text-2xl font-extrabold text-white font-mono" style={{ color: item.color }}>
              {item.val}
            </div>
            <span className="text-[10px] text-slate-500 block">{item.sub}</span>
          </div>
        ))}
      </div>

      {/* Chart: Daily Token Consumption */}
      <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">Daily Token Consumption</h4>
            <p className="text-xs text-slate-400">Prompt vs Completion token volume over time</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Trailing {filterDays} Days</span>
        </div>

        <div className="h-56 w-full">
          {summary.dailyTraffic && summary.dailyTraffic.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.dailyTraffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrompt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCompl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentThemeHex} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={currentThemeHex} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f3f4f6',
                  }}
                />
                <Area type="monotone" dataKey="prompt" name="Prompt Tokens" stroke="#38bdf8" fillOpacity={1} fill="url(#colorPrompt)" strokeWidth={2} />
                <Area type="monotone" dataKey="completion" name="Completion Tokens" stroke={currentThemeHex} fillOpacity={1} fill="url(#colorCompl)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 bg-black/20 rounded-xl">
              No token consumption records in this interval. Run queries or test models in the Playground.
            </div>
          )}
        </div>
      </div>

      {/* Model Breakdown & Provider Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Breakdown */}
        <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Consumption by Model Engine
          </h4>

          {Object.keys(summary.perModel || {}).length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">No model usage recorded.</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {Object.entries(summary.perModel).map(([modelId, stat]: [string, any]) => (
                <div key={modelId} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-white font-semibold truncate max-w-[200px]">{modelId}</span>
                    <span className="text-emerald-400 font-mono font-bold">${Number(stat.cost || 0).toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>{stat.total.toLocaleString()} tokens ({stat.calls} calls)</span>
                    <span>In: {stat.prompt} · Out: {stat.completion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Provider Breakdown */}
        <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Consumption by Provider Gateway
          </h4>

          {Object.keys(summary.perProvider || {}).length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">No provider usage recorded.</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {Object.entries(summary.perProvider).map(([providerId, stat]: [string, any]) => (
                <div key={providerId} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-purple-300 font-semibold uppercase">{providerId}</span>
                    <span className="text-emerald-400 font-mono font-bold">${Number(stat.cost || 0).toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>{stat.total.toLocaleString()} total tokens</span>
                    <span>{stat.calls} inferences</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTokensTab;
