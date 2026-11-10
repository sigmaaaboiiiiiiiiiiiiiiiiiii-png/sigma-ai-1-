import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  AlertTriangle,
  UserCheck,
  Lock,
} from 'lucide-react';

export interface ConnectionRecord {
  id: string;
  clientId: string;
  clientName: string;
  applicationType: 'web' | 'mobile' | 'cli' | 'enterprise' | 'agent';
  contactEmail: string;
  requestedScopes: string[];
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  requestedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  rejectionReason: string | null;
  apiKey: string | null;
  rateLimitRpm: number;
  totalRequests: number;
  lastUsedAt: string | null;
  notes?: string;
}

interface AdminConnectionsTabProps {
  currentThemeHex: string;
  onShowToast: (msg: string) => void;
  adminEmail: string;
}

export const AdminConnectionsTab: React.FC<AdminConnectionsTabProps> = ({
  currentThemeHex,
  onShowToast,
  adminEmail,
}) => {
  const [subTab, setSubTab] = useState<'requests' | 'approved'>('requests');
  const [pendingRequests, setPendingRequests] = useState<ConnectionRecord[]>([]);
  const [approvedConnections, setApprovedConnections] = useState<ConnectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Key reveal toggle & copy state
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // New Request Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [appType, setAppType] = useState<'web' | 'mobile' | 'cli' | 'enterprise' | 'agent'>('web');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/connections/list');
      if (res.ok) {
        const data = await res.json();
        setPendingRequests(data.requests || []);
        setApprovedConnections(data.approved || []);
      }
    } catch (e) {
      console.warn('Failed to fetch connections:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/connections/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, adminEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        onShowToast(`Connection approved! Live API Key issued: ${data.apiKey?.slice(0, 14)}...`);
        fetchConnections();
      } else {
        onShowToast(data.error || 'Failed to approve request.');
      }
    } catch {
      onShowToast('Error approving connection.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Enter rejection reason (optional):', 'Does not meet API qualification criteria');
    if (reason === null) return;

    try {
      const res = await fetch('/api/connections/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, reason }),
      });
      if (res.ok) {
        onShowToast('Connection request rejected.');
        fetchConnections();
      }
    } catch {
      onShowToast('Error rejecting connection.');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this live API connection? The client will immediately lose access.')) return;
    try {
      const res = await fetch('/api/connections/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: id, reason: 'Revoked by master admin' }),
      });
      if (res.ok) {
        onShowToast('API Connection revoked.');
        fetchConnections();
      }
    } catch {
      onShowToast('Error revoking connection.');
    }
  };

  const handleCopyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    onShowToast('API Key copied to clipboard.');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !contactEmail.trim()) {
      onShowToast('Please provide client name and email.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientEmail: contactEmail.trim(),
          requestedTier: appType,
          purpose: notes.trim() || 'Third-party integration test',
        }),
      });
      if (res.ok) {
        onShowToast('New connection request submitted for approval.');
        setShowRequestModal(false);
        setClientName('');
        setContactEmail('');
        setNotes('');
        fetchConnections();
      } else {
        const data = await res.json();
        onShowToast(data.error || 'Failed to submit request.');
      }
    } catch {
      onShowToast('Error submitting request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5" style={{ color: currentThemeHex }} />
            <h3 className="text-base sm:text-lg font-bold text-white">API Client Connection & Approval Lifecycle</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Review incoming integration requests, grant scoped credentials, generate production keys (<code className="text-emerald-400">sig_live_...</code>), and revoke credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchConnections}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:opacity-95"
            style={{ backgroundColor: currentThemeHex }}
          >
            <Plus className="w-4 h-4" />
            <span>Test Request</span>
          </button>
        </div>
      </div>

      {/* Sub-nav: Requests vs Approved */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
            subTab === 'requests'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
          style={{ color: subTab === 'requests' ? currentThemeHex : undefined }}
        >
          <span>Pending Requests</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
            {pendingRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('approved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
            subTab === 'approved'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
          style={{ color: subTab === 'approved' ? currentThemeHex : undefined }}
        >
          <span>Approved Live Clients</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
            {approvedConnections.length}
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: PENDING REQUESTS */}
      {subTab === 'requests' && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-[#12141a] rounded-2xl border border-white/10">
              No pending connection requests. All requests have been reviewed.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-[#12141a] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-white truncate">{req.clientName}</h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-mono bg-blue-950/60 text-blue-300 border border-blue-800/40">
                        {req.applicationType}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-mono bg-amber-950/60 text-amber-300 border border-amber-800/40">
                        Pending Approval
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                      <span>Contact: <code className="text-slate-300">{req.contactEmail}</code></span>
                      <span>Client ID: <code className="text-slate-300">{req.clientId}</code></span>
                      <span>Requested: {new Date(req.requestedAt).toLocaleString()}</span>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-slate-400 italic">"{req.notes}"</p>
                    )}

                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500">Scopes:</span>
                      {req.requestedScopes.map((sc) => (
                        <span key={sc} className="px-1.5 py-0.2 rounded text-[10px] bg-white/5 text-slate-400 font-mono">
                          {sc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(req.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve & Issue Key</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: APPROVED CLIENTS */}
      {subTab === 'approved' && (
        <div className="space-y-3">
          {approvedConnections.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-[#12141a] rounded-2xl border border-white/10">
              No approved connections yet. Approve a pending request above to issue credentials.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {approvedConnections.map((conn) => {
                const isKeyRevealed = visibleKeys[conn.id];
                const isCopied = copiedKeyId === conn.id;

                return (
                  <div
                    key={conn.id}
                    className="bg-[#12141a] border border-white/10 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-white">{conn.clientName}</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                            Active Key
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {conn.rateLimitRpm} RPM Quota
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                          <span>Email: <code className="text-slate-300">{conn.contactEmail}</code></span>
                          <span>Approved By: <code className="text-slate-300">{conn.decidedBy || 'System Admin'}</code></span>
                          <span>Total Invocations: <strong className="text-white font-mono">{conn.totalRequests}</strong></span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevoke(conn.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Revoke Access
                      </button>
                    </div>

                    {/* Live Key Box */}
                    {conn.apiKey && (
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-2">
                          <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono text-xs text-slate-300 truncate">
                            {isKeyRevealed ? conn.apiKey : `${conn.apiKey.slice(0, 12)}••••••••••••••••••••••••••••••••`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setVisibleKeys((prev) => ({ ...prev, [conn.id]: !prev[conn.id] }))
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title={isKeyRevealed ? 'Hide API key' : 'Show API key'}
                          >
                            {isKeyRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(conn.id, conn.apiKey!)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center gap-1 text-xs"
                            title="Copy key"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Test Connection Request Modal */}
      {showRequestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowRequestModal(false)}
        >
          <div
            className="bg-[#13151b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4" style={{ color: currentThemeHex }} />
                <span>Simulate Client Connection Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Client / App Name</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Acme Mobile App, Partner CRM"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="developer@client.com"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Application Type</label>
                <select
                  value={appType}
                  onChange={(e) => setAppType(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                >
                  <option value="web">Web Application</option>
                  <option value="mobile">Mobile App (iOS/Android)</option>
                  <option value="cli">CLI Tool</option>
                  <option value="agent">Autonomous AI Agent</option>
                  <option value="enterprise">Enterprise Backend</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Use Case / Purpose</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Production chatbot integration for customer support..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
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
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConnectionsTab;
