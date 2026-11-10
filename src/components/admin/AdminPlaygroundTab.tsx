import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Copy,
  Check,
  Zap,
  Clock,
  DollarSign,
  Cpu,
  Layers,
  History,
  AlertTriangle,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface PlaygroundHistoryItem {
  id: string;
  timestamp: string;
  providerId: string;
  modelId: string;
  prompt: string;
  output: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

interface AdminPlaygroundTabProps {
  currentThemeHex: string;
  onShowToast: (msg: string) => void;
}

export const AdminPlaygroundTab: React.FC<AdminPlaygroundTabProps> = ({ currentThemeHex, onShowToast }) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [selectedModel, setSelectedModel] = useState('openrouter/free');

  const [systemInstruction, setSystemInstruction] = useState('You are Sigma AI, an advanced AI engine engineered by Sigma Cooperation.');
  const [prompt, setPrompt] = useState('Analyze the key architectural trade-offs between monolithic and microservice systems in 3 concise bullet points.');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  const [isRunning, setIsRunning] = useState(false);
  const [activeResult, setActiveResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // History
  const [historyList, setHistoryList] = useState<PlaygroundHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load models and providers
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resP, resM] = await Promise.all([
          fetch('/api/admin/providers'),
          fetch('/api/admin/models'),
        ]);
        if (resP.ok) {
          const dataP = await resP.json();
          setProviders(dataP.providers || []);
        }
        if (resM.ok) {
          const dataM = await resM.json();
          setModels(dataM.models || []);
        }
      } catch (e) {
        console.warn('Playground setup load notice:', e);
      }
    };
    loadData();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/admin/playground/history');
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      }
    } catch {
      // non-blocking
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRun = async () => {
    if (!prompt.trim()) {
      onShowToast('Please enter a prompt.');
      return;
    }
    setIsRunning(true);
    setActiveResult(null);

    try {
      const res = await fetch('/api/admin/playground/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider,
          modelId: selectedModel,
          prompt: prompt.trim(),
          temperature,
          maxTokens,
          systemInstruction: systemInstruction.trim(),
        }),
      });

      const data = await res.json();
      const normalizedData = {
        ...data,
        output: data.output || data.response || '',
      };
      setActiveResult(normalizedData);
      if (data.success) {
        onShowToast(`Completed in ${data.latencyMs}ms (${data.totalTokens} tokens)`);
      } else {
        onShowToast(`Execution notice: ${normalizedData.output || 'Check logs'}`);
      }
      fetchHistory();
    } catch (err: any) {
      onShowToast('Playground execution network error.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyOutput = () => {
    if (!activeResult?.output) return;
    navigator.clipboard.writeText(activeResult.output);
    setCopied(true);
    onShowToast('Copied output to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5" style={{ color: currentThemeHex }} />
            <h3 className="text-base sm:text-lg font-bold text-white">Sigma API Playground</h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/10 text-slate-300 font-mono">
              Live Testbed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Test and benchmark prompts against OpenRouter, Google Gemini, OpenAI, or custom LLM backends with real token consumption metrics and latency profiling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-black flex items-center gap-2 cursor-pointer shadow-lg transition-all hover:opacity-95"
            style={{ backgroundColor: currentThemeHex }}
          >
            <Play className={`w-3.5 h-3.5 fill-black ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Executing Prompt...' : 'Run Prompt'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prompt inputs & Execution Result */}
        <div className="lg:col-span-2 space-y-4">
          {/* System Instruction */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>System Persona & Instructions</span>
              <span className="text-[11px] text-slate-500 font-normal">Optional</span>
            </label>
            <textarea
              rows={2}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-white/20 resize-none font-sans"
              placeholder="System prompt context..."
            />
          </div>

          {/* User Prompt */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">User Prompt</label>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Reasoning', p: 'Solve step-by-step: If a plane travels 800 km/h with a 50 km/h headwind for 3 hours, then turns with a 50 km/h tailwind for 2 hours, what is its total displacement?' },
                  { label: 'Code Gen', p: 'Write an idempotent TypeScript function to recursively merge two deep JSON objects without mutating inputs.' },
                  { label: 'Urdu/Hindi', p: 'Translate: "The cloud architecture provides high availability and automatic failover" into Urdu and Hindi.' },
                ].map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => setPrompt(sample.p)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-white/20 resize-none font-sans"
              placeholder="Enter your prompt here..."
            />
          </div>

          {/* Output Inspector */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Engine Response
                </h4>
              </div>

              {activeResult?.output && (
                <button
                  type="button"
                  onClick={handleCopyOutput}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {isRunning ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
                <Sparkles className="w-6 h-6 animate-spin text-purple-400" />
                <span>Streaming response from {selectedModel}...</span>
              </div>
            ) : activeResult ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-black/50 border border-white/5 text-slate-200 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {activeResult.output}
                </div>

                {/* Response Telemetry Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Prompt Tokens:</span>
                    <span className="text-white font-mono font-bold">{activeResult.promptTokens}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Completion Tokens:</span>
                    <span className="text-white font-mono font-bold">{activeResult.completionTokens}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Total Tokens:</span>
                    <span className="text-emerald-400 font-mono font-bold">{activeResult.totalTokens}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Round-trip Latency:</span>
                    <span className="text-purple-400 font-mono font-bold">{activeResult.latencyMs} ms</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500 text-xs bg-black/20 rounded-xl border border-white/5">
                Ready. Select your model parameters and click "Run Prompt" to benchmark.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Model Parameters & Quick History */}
        <div className="space-y-4">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Model & Hyperparameters</span>
            </h4>

            {/* Provider Selector */}
            <div className="space-y-1 text-xs">
              <label className="text-slate-300 font-semibold block">Target Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  const matching = models.find((m) => m.providerId === e.target.value);
                  if (matching) setSelectedModel(matching.id);
                }}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-hidden"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selector */}
            <div className="space-y-1 text-xs">
              <label className="text-slate-300 font-semibold block">Target Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-hidden"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.providerId})
                  </option>
                ))}
              </select>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Temperature</span>
                <span className="font-mono text-white font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 (Deterministic)</span>
                <span>1.5 (Creative)</span>
              </div>
            </div>

            {/* Max Output Tokens Slider */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Max Output Tokens</span>
                <span className="font-mono text-white font-bold">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Recent Runs */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Recent Runs</span>
              </h4>
              <button
                type="button"
                onClick={fetchHistory}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <RotateCcw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {historyList.length === 0 ? (
              <div className="text-[11px] text-slate-500 text-center py-4">No recent executions.</div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                {historyList.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setPrompt(item.prompt);
                      setSelectedModel(item.modelId);
                      setActiveResult({
                        ...item,
                        output: item.output || (item as any).response || '',
                      });
                    }}
                    className="p-2.5 rounded-xl bg-black/30 border border-white/5 hover:border-white/20 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-purple-300 font-semibold truncate max-w-[130px]">
                        {item.modelId}
                      </span>
                      <span className="text-slate-400 text-[10px] font-mono">{item.latencyMs}ms</span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">{item.prompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPlaygroundTab;
