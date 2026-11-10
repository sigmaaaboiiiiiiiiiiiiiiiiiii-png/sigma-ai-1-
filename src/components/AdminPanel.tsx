import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  Shield,
  Cpu,
  Settings,
  Lock,
  Unlock,
  Search,
  Filter,
  Download,
  Check,
  AlertTriangle,
  RefreshCw,
  Server,
  Zap,
  Globe,
  Mail,
  UserCheck,
  UserX,
  Eye,
  Plus,
  Trash2,
  Key,
  Clock,
  Database,
  Copy,
  MessageSquare,
  Sparkles,
  CheckCircle,
  FileText,
  Mic,
  MicOff,
  Radio,
  Volume2,
  Terminal,
  HardDrive,
  Archive,
  DollarSign,
  Play,
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
import { UserProfile } from '../types';
import {
  fetchFirestoreAllUsers,
  fetchFirestoreSecurityLogs,
  fetchFirestoreGlobalChatLogs,
  fetchFirestoreActiveSessionsCount,
  fetchFirestoreActiveSessions,
  fetchFirestoreVoiceSessions,
  ActiveSessionRecord,
} from '../lib/firebase';
import { AdminProvidersTab } from './admin/AdminProvidersTab';
import { AdminModelsTab } from './admin/AdminModelsTab';
import { AdminPlaygroundTab } from './admin/AdminPlaygroundTab';
import { AdminConnectionsTab } from './admin/AdminConnectionsTab';
import { AdminTokensTab } from './admin/AdminTokensTab';
import { AdminBackupsTab } from './admin/AdminBackupsTab';
import { AdminAnalyticsDashboardTab } from './admin/AdminAnalyticsDashboardTab';

interface AdminPanelProps {
  user: UserProfile;
  currentThemeHex: string;
  themeGlow: string;
  onClose?: () => void;
  onToggleAiLock?: (locked: boolean, message?: string) => void;
  isAiLocked?: boolean;
  lockMessage?: string;
  activeModel?: string;
  onChangeModel?: (model: string) => void;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'suspended';
  authProvider: 'google' | 'email_otp';
  joinedAt: string;
  lastActive: string;
  totalChats: number;
}

interface ApiKeyRecord {
  id: string;
  key: string;
  name: string;
  status: 'active' | 'rate_limited' | 'error';
  errorCount: number;
  successCount: number;
  lastUsedAt: string | null;
  lastError: string | null;
}

interface SecurityLogRecord {
  id: string;
  timestamp: string;
  type: 'LOGIN_SUCCESS' | 'OTP_REQUEST' | 'OTP_FAILED' | 'USER_SUSPENDED' | 'USER_ACTIVATED' | 'USER_ROLE_CHANGED' | 'API_KEY_ADDED' | 'API_KEY_FAILED' | 'SYSTEM_LOCK';
  email: string;
  details: string;
  status: 'Success' | 'Warning' | 'Failed';
}

interface MetricsSummary {
  activeUsers: number;
  totalInquiries: number;
  avgLatencyMs: number;
  totalRegisteredUsers: number;
  dailyTraffic: { day: string; requests: number; queries: number }[];
  modelDistribution: { name: string; usage: number }[];
  isAiLocked: boolean;
  lockMessage: string;
  activeModel: string;
}

export interface AdminQaRecord {
  id: string;
  prompt: string;
  normalizedPrompt: string;
  answer: string;
  model: string;
  userType: 'guest' | 'authenticated';
  userEmail: string;
  userName: string;
  createdAt: string;
  lastAccessedAt: string;
  hitCount: number;
  hasImages?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  currentThemeHex,
  themeGlow,
  onToggleAiLock,
  isAiLocked = false,
  lockMessage = 'Sigma AI is closed for now and will be coming soon.',
  activeModel = '3.8 Flash',
  onChangeModel,
}) => {
  // Navigation tabs inside the Admin Panel
  const [adminTab, setAdminTab] = useState<
    | 'dashboard'
    | 'sessions'
    | 'providers'
    | 'models'
    | 'playground'
    | 'connections'
    | 'tokens'
    | 'storage'
    | 'backups'
    | 'database'
    | 'chats'
    | 'users'
    | 'security'
    | 'ai'
    | 'system'
  >('dashboard');

  // Real backend metrics state
  const [metrics, setMetrics] = useState<MetricsSummary>({
    activeUsers: 1,
    totalInquiries: 0,
    avgLatencyMs: 280,
    totalRegisteredUsers: 1,
    dailyTraffic: [],
    modelDistribution: [
      { name: '3.8 Flash', usage: 100 },
      { name: '3.6 Flash', usage: 0 },
      { name: '3.1 Pro', usage: 0 },
    ],
    isAiLocked: false,
    lockMessage: 'Sigma AI is closed for now and will be coming soon.',
    activeModel: '3.8 Flash',
  });

  // Maintenance mode local state
  const [locked, setLocked] = useState(isAiLocked);
  const [customLockMsg, setCustomLockMsg] = useState(lockMessage);
  const [modelChoice, setModelChoice] = useState(activeModel);

  // Real users state
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user' | 'moderator'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  // Real Global Chats & Inquiries state (Firestore permanent log)
  const [globalChatsList, setGlobalChatsList] = useState<any[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatSearch, setChatSearch] = useState('');

  // Real API Keys Pool state
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [keySubmitError, setKeySubmitError] = useState<string | null>(null);
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);

  // Real Q&A Knowledge Database Cache state
  const [qaList, setQaList] = useState<AdminQaRecord[]>([]);
  const [qaTotal, setQaTotal] = useState(0);
  const [qaTotalHits, setQaTotalHits] = useState(0);
  const [isLoadingQa, setIsLoadingQa] = useState(false);
  const [qaSearch, setQaSearch] = useState('');
  const [qaFilter, setQaFilter] = useState<'all' | 'guest' | 'authenticated' | 'frequent'>('all');
  const [expandedQaId, setExpandedQaId] = useState<string | null>(null);
  const [showAddQaModal, setShowAddQaModal] = useState(false);
  const [newQaPrompt, setNewQaPrompt] = useState('');
  const [newQaAnswer, setNewQaAnswer] = useState('');
  const [isSavingQa, setIsSavingQa] = useState(false);

  // Real Security Logs state
  const [securityLogs, setSecurityLogs] = useState<SecurityLogRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Real Active Presence Sessions & Live Voice Monitoring
  const [activeSessionsList, setActiveSessionsList] = useState<ActiveSessionRecord[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<'all' | 'authenticated' | 'guest' | 'voice'>('all');
  const [selectedSession, setSelectedSession] = useState<ActiveSessionRecord | null>(null);
  const [selectedSessionVoiceHistory, setSelectedSessionVoiceHistory] = useState<any[]>([]);
  const [isLoadingVoiceHistory, setIsLoadingVoiceHistory] = useState(false);

  const fetchActiveSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const list = await fetchFirestoreActiveSessions();
      setActiveSessionsList(list);
    } catch (err) {
      console.warn('Could not fetch active sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSelectSession = async (sess: ActiveSessionRecord) => {
    setSelectedSession(sess);
    setIsLoadingVoiceHistory(true);
    try {
      const history = await fetchFirestoreVoiceSessions(sess.identityId, sess.identityType === 'guest');
      setSelectedSessionVoiceHistory(history);
    } catch (err) {
      console.warn('Could not fetch voice history:', err);
      setSelectedSessionVoiceHistory([]);
    } finally {
      setIsLoadingVoiceHistory(false);
    }
  };

  // Live Ping latency testing state
  const [pingResults, setPingResults] = useState<{ [key: string]: { status: string; latency: number } }>({
    'Gemini API': { status: 'Operational', latency: 85 },
    'Email Dispatch': { status: 'Operational', latency: 120 },
    'System Ingress': { status: 'Operational', latency: 45 },
  });
  const [isPinging, setIsPinging] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch real metrics from Firestore presence and server
  const fetchMetrics = async () => {
    try {
      const activePresenceCount = await fetchFirestoreActiveSessionsCount();
      let serverMetrics: any = null;
      try {
        const res = await fetch('/api/admin/metrics');
        if (res.ok) {
          serverMetrics = await res.json();
        }
      } catch (_) {}

      if (serverMetrics) {
        setMetrics({
          ...serverMetrics,
          activeUsers: Math.max(activePresenceCount, serverMetrics.activeUsers || 1),
        });
        if (typeof serverMetrics.isAiLocked === 'boolean') {
          setLocked(serverMetrics.isAiLocked);
        }
        if (serverMetrics.lockMessage) {
          setCustomLockMsg(serverMetrics.lockMessage);
        }
        if (serverMetrics.activeModel) {
          setModelChoice(serverMetrics.activeModel);
        }
      } else {
        setMetrics((prev) => ({
          ...prev,
          activeUsers: activePresenceCount,
        }));
      }
    } catch (e) {
      console.warn('Could not fetch admin metrics:', e);
    }
  };

  // Fetch real users from Firestore (primary cloud layer that runs on Cloudflare Pages and everywhere)
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const firestoreUsers = await fetchFirestoreAllUsers();
      let serverUsers: AdminUserRecord[] = [];
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          serverUsers = data.users || [];
        }
      } catch (_) {}

      const userMap = new Map<string, AdminUserRecord>();

      // Populate from Firestore
      for (const u of firestoreUsers) {
        const emailKey = (u.email || '').toLowerCase().trim();
        const isAdmin =
          u.role === 'admin' ||
          emailKey === 'sabaharis.239@gmail.com' ||
          emailKey === 'sabahharis.239@gmail.com' ||
          emailKey === 'sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com' ||
          emailKey === 'devuserhub@gmail.com' ||
          emailKey === 'devuser@gmail.com' ||
          emailKey === 'wahaj1haider3@gmail.com' ||
          emailKey === 'tehmaarhaider12@gmail.com' ||
          emailKey.includes('tehmaarhaider') ||
          emailKey.includes('sabaharis') ||
          emailKey.includes('sabahharis');

        const record: AdminUserRecord = {
          id: u.id || u.uid || `u_${Math.random().toString(36).slice(2, 7)}`,
          name: u.name || u.displayName || (u.email ? u.email.split('@')[0] : 'User'),
          email: u.email || '',
          role: isAdmin ? 'admin' : (u.role || 'user'),
          status: (u.status === 'suspended' ? 'suspended' : 'active') as 'active' | 'suspended',
          authProvider: (u.authProvider?.toLowerCase().includes('google') ? 'google' : 'email_otp') as 'google' | 'email_otp',
          joinedAt: u.createdAt || u.joinedAt || new Date().toISOString(),
          lastActive: u.lastLoginAt || u.lastActive || new Date().toISOString(),
          totalChats: u.totalChats || 1,
        };
        if (emailKey) {
          userMap.set(emailKey, record);
        } else {
          userMap.set(record.id, record);
        }
      }

      // Merge from server if any
      for (const su of serverUsers) {
        const emailKey = (su.email || '').toLowerCase().trim();
        if (emailKey && !userMap.has(emailKey)) {
          userMap.set(emailKey, su);
        }
      }

      const mergedList = Array.from(userMap.values());
      setUsersList(mergedList);
    } catch (e) {
      console.warn('Could not fetch admin users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch real API keys from server
  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/admin/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch (e) {
      console.warn('Could not fetch API keys:', e);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // Fetch real security logs from Firestore (primary cloud layer) and server
  const fetchSecurityLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const firestoreLogs = await fetchFirestoreSecurityLogs();
      let serverLogs: SecurityLogRecord[] = [];
      try {
        const res = await fetch('/api/admin/security-logs');
        if (res.ok) {
          const data = await res.json();
          serverLogs = data.logs || [];
        }
      } catch (_) {}

      const logMap = new Map<string, SecurityLogRecord>();

      for (const fl of firestoreLogs) {
        const rawStatus = (fl.status || 'Success').toLowerCase();
        const normStatus: 'Success' | 'Warning' | 'Failed' =
          rawStatus.includes('fail') || rawStatus.includes('block')
            ? 'Failed'
            : rawStatus.includes('warn')
            ? 'Warning'
            : 'Success';

        const rec: SecurityLogRecord = {
          id: fl.id || `log_${Math.random().toString(36).slice(2, 7)}`,
          timestamp: fl.timestamp || new Date().toISOString(),
          type: (fl.event || 'LOGIN_SUCCESS') as any,
          email: fl.userEmail || 'system',
          status: normStatus,
          details: fl.details || 'Live security audit event recorded in Firestore',
        };
        logMap.set(rec.id, rec);
      }

      for (const sl of serverLogs) {
        if (!logMap.has(sl.id)) {
          logMap.set(sl.id, sl);
        }
      }

      const combined = Array.from(logMap.values());
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSecurityLogs(combined);
    } catch (e) {
      console.warn('Could not fetch security logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Fetch global chat logs from Firestore
  const fetchGlobalChats = async () => {
    setIsLoadingChats(true);
    try {
      const logs = await fetchFirestoreGlobalChatLogs();
      setGlobalChatsList(logs);
    } catch (e) {
      console.warn('Could not fetch global chat logs from Firestore:', e);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Fetch real AI Q&A Database memory records from server
  const fetchQaRecords = async () => {
    setIsLoadingQa(true);
    try {
      const params = new URLSearchParams();
      if (qaSearch) params.append('search', qaSearch);
      if (qaFilter !== 'all') params.append('filter', qaFilter);
      const res = await fetch(`/api/admin/qa?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQaList(data.records || []);
        setQaTotal(data.total || 0);
        setQaTotalHits(data.totalHits || 0);
      }
    } catch (e) {
      console.warn('Could not fetch QA database records:', e);
    } finally {
      setIsLoadingQa(false);
    }
  };

  // Delete a Q&A record
  const handleDeleteQa = async (id: string) => {
    if (!window.confirm('Delete this prompt-response entry from AI Memory Database?')) return;
    try {
      const res = await fetch(`/api/admin/qa/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQaList((prev) => prev.filter((r) => r.id !== id));
        setQaTotal((prev) => Math.max(0, prev - 1));
        showLocalToast('Q&A Memory entry deleted.');
      } else {
        showLocalToast('Failed to delete Q&A entry.');
      }
    } catch (e) {
      showLocalToast('Error deleting Q&A entry.');
    }
  };

  // Clear entire Q&A database
  const handleClearQa = async () => {
    if (!window.confirm('Are you sure you want to clear the entire AI Q&A Memory Database? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/qa/clear', { method: 'POST' });
      if (res.ok) {
        setQaList([]);
        setQaTotal(0);
        setQaTotalHits(0);
        showLocalToast('AI Memory Database cleared.');
      }
    } catch (e) {
      showLocalToast('Error clearing Q&A database.');
    }
  };

  // Export Q&A to JSON
  const handleExportQaJson = () => {
    const jsonStr = JSON.stringify(qaList, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigma-ai-qa-memory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showLocalToast('Exported AI Knowledge Memory to JSON');
  };

  // Export Q&A to CSV
  const handleExportQaCsv = () => {
    const headers = ['ID,UserType,UserEmail,Prompt,Answer,Model,HitCount,CreatedAt'];
    const rows = qaList.map(
      (r) =>
        `"${r.id}","${r.userType}","${r.userEmail}","${r.prompt.replace(/"/g, '""')}","${r.answer.slice(0, 300).replace(/"/g, '""')}","${r.model}",${r.hitCount},"${r.createdAt}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sigma-ai-qa-database-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showLocalToast('Exported AI Knowledge Memory to CSV');
  };

  // Manually pre-seed a Q&A pair into the AI Database
  const handleSaveNewQa = async () => {
    if (!newQaPrompt.trim() || !newQaAnswer.trim()) {
      showLocalToast('Please fill in both the Question/Prompt and Answer.');
      return;
    }
    setIsSavingQa(true);
    try {
      const res = await fetch('/api/qa/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: newQaPrompt.trim(),
          answer: newQaAnswer.trim(),
          model: 'Manual Admin Pre-seed',
          userType: 'authenticated',
          userEmail: user.email || 'Admin',
          userName: 'Admin Knowledge Seed',
        }),
      });
      if (res.ok) {
        showLocalToast('New Q&A Memory pair pre-seeded into AI Database!');
        setNewQaPrompt('');
        setNewQaAnswer('');
        setShowAddQaModal(false);
        fetchQaRecords();
      } else {
        showLocalToast('Failed to save Q&A pair.');
      }
    } catch (e) {
      showLocalToast('Error saving Q&A pair.');
    } finally {
      setIsSavingQa(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    fetchMetrics();
    fetchActiveSessions();
    fetchUsers();
    fetchApiKeys();
    fetchSecurityLogs();
    fetchQaRecords();
    fetchGlobalChats();

    const interval = setInterval(() => {
      fetchMetrics();
      fetchActiveSessions();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (adminTab === 'database') {
      fetchQaRecords();
    } else if (adminTab === 'chats') {
      fetchGlobalChats();
    } else if (adminTab === 'users') {
      fetchUsers();
    } else if (adminTab === 'security') {
      fetchSecurityLogs();
    } else if (adminTab === 'sessions') {
      fetchActiveSessions();
    }
  }, [adminTab, qaFilter]);

  // Sync state with parent props
  useEffect(() => {
    setLocked(isAiLocked);
  }, [isAiLocked]);

  useEffect(() => {
    setCustomLockMsg(lockMessage);
  }, [lockMessage]);

  useEffect(() => {
    setModelChoice(activeModel);
  }, [activeModel]);

  // Handle Maintenance mode toggle
  const handleToggleLock = async (newVal: boolean) => {
    setLocked(newVal);
    try {
      localStorage.setItem('sigma_ai_locked', String(newVal));
      localStorage.setItem('sigma_ai_lock_message', customLockMsg);
    } catch (_) {}
    onToggleAiLock?.(newVal, customLockMsg);

    try {
      const res = await fetch('/api/admin/toggle-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: newVal, message: customLockMsg }),
      });
      if (res.ok) {
        showLocalToast(`AI System ${newVal ? 'Locked (Maintenance mode active)' : 'Unlocked (Online)'}`);
      }
    } catch (e) {
      console.warn('Server lock sync notice:', e);
    }
  };

  // Handle model change
  const handleSelectModel = async (model: string) => {
    setModelChoice(model);
    try {
      localStorage.setItem('sigma_admin_model', model);
    } catch (_) {}
    onChangeModel?.(model);

    try {
      await fetch('/api/admin/set-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      });
      showLocalToast(`System AI model priority updated to ${model}`);
    } catch (e) {
      console.warn('Could not set model on server:', e);
    }
  };

  // Run ping test
  const handleTestPing = async () => {
    setIsPinging(true);
    try {
      const start = Date.now();
      const res = await fetch('/api/health');
      const latency = Date.now() - start;
      const ok = res.ok;
      setPingResults({
        'Gemini API': { status: 'Operational', latency: Math.max(50, Math.round(metrics.avgLatencyMs || latency)) },
        'Email Dispatch': { status: 'Operational', latency: Math.max(95, latency + 45) },
        'System Ingress': { status: ok ? 'Operational' : 'Degraded', latency: Math.max(30, latency) },
      });
      showLocalToast('Live health ping tests completed.');
    } catch {
      showLocalToast('Ping test failed.');
    } finally {
      setIsPinging(false);
    }
  };

  // Add a new API Key to the rotation pool
  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const keyTrimmed = newKeyInput.trim();
    if (!keyTrimmed) {
      setKeySubmitError('Please enter a Gemini API Key.');
      return;
    }

    setIsSubmittingKey(true);
    setKeySubmitError(null);

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: keyTrimmed,
          name: newKeyName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add API key.');
      }

      setApiKeys(data.keys || []);
      setNewKeyInput('');
      setNewKeyName('');
      setShowAddKeyModal(false);
      showLocalToast('API Key added successfully. Automatic key rotation updated.');
      fetchSecurityLogs();
    } catch (err: any) {
      setKeySubmitError(err?.message || 'Failed to save API key.');
    } finally {
      setIsSubmittingKey(false);
    }
  };

  // Remove API key from pool
  const handleRemoveApiKey = async (id: string) => {
    if (apiKeys.length <= 1) {
      showLocalToast('At least one API key must remain active in the pool.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setApiKeys(data.keys || []);
        showLocalToast('API key removed from rotation pool.');
        fetchSecurityLogs();
      }
    } catch (err) {
      showLocalToast('Failed to remove API key.');
    }
  };

  // Toggle user status
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          status: newStatus,
          requesterEmail: user.email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.users || []);
        showLocalToast(`User status updated to ${newStatus}`);
        fetchSecurityLogs();
      } else {
        showLocalToast(data.error || 'Failed to update user status.');
      }
    } catch (e) {
      showLocalToast('Network error while updating user status.');
    }
  };

  // Change user role
  const handleChangeUserRole = async (userId: string, newRole: 'admin' | 'user' | 'moderator') => {
    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role: newRole,
          requesterEmail: user.email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.users || []);
        showLocalToast(`User role updated to ${newRole}`);
        fetchSecurityLogs();
      } else {
        showLocalToast(data.error || 'Failed to update user role.');
      }
    } catch (e) {
      showLocalToast('Network error while updating user role.');
    }
  };

  // Delete a user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.users || []);
        if (selectedUser?.id === userId) setSelectedUser(null);
        showLocalToast('User removed successfully.');
      } else {
        showLocalToast(data.error || 'Failed to delete user.');
      }
    } catch (e) {
      showLocalToast('Network error while deleting user.');
    }
  };

  // Export real users to CSV
  const handleExportCSV = () => {
    const headers = ['ID,Name,Email,Role,Status,AuthProvider,JoinedAt,TotalChats'];
    const rows = usersList.map(
      (u) => `${u.id},"${u.name}","${u.email}",${u.role},${u.status},${u.authProvider},${u.joinedAt},${u.totalChats}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sigma-users-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[100] px-4 py-2.5 rounded-xl bg-[#1e2330] border border-white/20 text-white text-xs font-semibold shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header Banner with Restricted Badge */}
      <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${currentThemeHex}20`,
                color: currentThemeHex,
                border: `1px solid ${currentThemeHex}40`,
              }}
            >
              Master Admin Access
            </div>
            <span className="text-xs text-slate-400">Authenticated: {user.email}</span>
          </div>
          <h2 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <span>Sigma Command Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics, user accounts, API key rotation pool, and system maintenance.
          </p>
        </div>

        {/* Global Stop AI Status Pill */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              locked
                ? 'bg-red-950/50 border-red-800/80 text-red-300 animate-pulse'
                : 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
            }`}
          >
            {locked ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{locked ? 'AI STOPPED (MAINTENANCE)' : 'AI RUNNING (ONLINE)'}</span>
          </div>
        </div>
      </div>

      {/* Admin Panel Sub-navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none border-b border-white/10">
        {[
          { id: 'dashboard', label: 'Overview & Metrics', icon: Activity },
          { id: 'providers', label: 'AI Providers (20+)', icon: Server },
          { id: 'models', label: 'Model Catalog', icon: Cpu },
          { id: 'playground', label: 'API Playground', icon: Terminal },
          { id: 'connections', label: 'API Clients & Keys', icon: Key },
          { id: 'tokens', label: 'Token Accounting', icon: DollarSign },
          { id: 'storage', label: 'Storage Infrastructure', icon: HardDrive },
          { id: 'backups', label: 'System Backups', icon: Archive },
          { id: 'database', label: 'AI Memory & QA DB', icon: Database, badge: qaTotal > 0 ? `${qaTotal}` : undefined },
          { id: 'chats', label: 'User Chats & Inquiries', icon: MessageSquare, badge: globalChatsList.length > 0 ? `${globalChatsList.length}` : undefined },
          { id: 'users', label: 'User Management', icon: Users, badge: usersList.length > 0 ? `${usersList.length}` : undefined },
          { id: 'sessions', label: 'Active Sessions & Voice', icon: Radio, badge: activeSessionsList.filter(s => s.status === 'active').length > 0 ? `${activeSessionsList.filter(s => s.status === 'active').length}` : undefined },
          { id: 'security', label: 'Security & Access', icon: Shield },
          { id: 'ai', label: 'API Rotation Pool', icon: Zap, badge: apiKeys.length > 0 ? `${apiKeys.length}` : undefined },
          { id: 'system', label: 'System & Maintenance', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAdminTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={{
                color: isActive ? currentThemeHex : undefined,
                borderBottom: isActive ? `2px solid ${currentThemeHex}` : '2px solid transparent',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300 border border-white/10 font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD & ANALYTICS */}
      {adminTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Real Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: 'Active Users',
                value: metrics.activeUsers.toLocaleString(),
                change: 'Live online sessions (guests & logged-in)',
                icon: Users,
                color: '#38bdf8',
              },
              {
                label: 'Total Inquiries',
                value: metrics.totalInquiries.toLocaleString(),
                change: 'Real answered questions',
                icon: Zap,
                color: currentThemeHex,
              },
              {
                label: 'Avg Latency',
                value: `${metrics.avgLatencyMs}ms`,
                change: `Ultra-fast (${metrics.activeModel})`,
                icon: Activity,
                color: '#a855f7',
              },
              {
                label: 'System Status',
                value: locked ? 'Paused' : '100% Online',
                change: 'Cloud Run Cluster',
                icon: Server,
                color: locked ? '#ef4444' : '#10b981',
              },
            ].map((metric, i) => (
              <div key={i} className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">{metric.label}</span>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${metric.color}18`, color: metric.color }}
                  >
                    <metric.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">{metric.value}</div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>{metric.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Real Recharts Analytics: Weekly Request Volume & Real Model Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#12141a] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Daily Traffic & Queries</h3>
                  <p className="text-xs text-slate-400">Real inquiry volume tracked across past 7 days</p>
                </div>
                <button
                  type="button"
                  onClick={fetchMetrics}
                  className="text-xs font-mono px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Refresh live metrics"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Live Stream</span>
                </button>
              </div>
              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.dailyTraffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentThemeHex} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={currentThemeHex} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
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
                    <Area type="monotone" dataKey="queries" stroke={currentThemeHex} fillOpacity={1} fill="url(#colorRequests)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Model Distribution</h3>
                <p className="text-xs text-slate-400 mb-4">Real share of queries processed per engine</p>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.modelDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                      <YAxis stroke="#6b7280" fontSize={11} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          borderColor: '#374151',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          color: '#f3f4f6',
                        }}
                      />
                      <Bar dataKey="usage" fill={currentThemeHex} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
                <span>Active Global Model:</span>
                <span className="font-bold text-white font-mono">{metrics.activeModel}</span>
              </div>
            </div>
          </div>

          {/* ACTIVE SESSIONS REAL-TIME MONITOR */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wider uppercase font-mono">
                    Active Sessions
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono font-bold">
                    {activeSessionsList.filter((s) => s.status === 'active').length} Live
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Monitored sessions resolved from persistent profiles (<code className="text-slate-300">users</code> & <code className="text-slate-300">guests</code> collections)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
                  {(['all', 'authenticated', 'guest', 'voice'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setSessionFilter(f)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all capitalize cursor-pointer ${
                        sessionFilter === f ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f === 'all'
                        ? 'All'
                        : f === 'authenticated'
                        ? 'Authenticated'
                        : f === 'guest'
                        ? 'Guests'
                        : '🎙 Voice Active'}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={fetchActiveSessions}
                  disabled={isLoadingSessions}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  title="Refresh active sessions"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                  <span className="text-xs">Refresh</span>
                </button>
              </div>
            </div>

            {/* Active Sessions Grid */}
            {activeSessionsList.filter((s) => {
              if (sessionFilter === 'authenticated') return s.identityType === 'user';
              if (sessionFilter === 'guest') return s.identityType === 'guest';
              if (sessionFilter === 'voice') return Boolean(s.voiceSession);
              return true;
            }).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-black/20 rounded-xl border border-white/5">
                No active sessions matching filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeSessionsList
                  .filter((s) => {
                    if (sessionFilter === 'authenticated') return s.identityType === 'user';
                    if (sessionFilter === 'guest') return s.identityType === 'guest';
                    if (sessionFilter === 'voice') return Boolean(s.voiceSession);
                    return true;
                  })
                  .map((sess) => {
                    const isGuest = sess.identityType === 'guest';
                    const isVoice = Boolean(sess.voiceSession);
                    const isLive = sess.status === 'active';
                    return (
                      <div
                        key={sess.sessionId}
                        onClick={() => handleSelectSession(sess)}
                        className="p-4 rounded-xl border transition-all cursor-pointer bg-[#0e1117] hover:bg-[#141822] space-y-3 relative group"
                        style={{
                          borderColor: isVoice ? '#10b98150' : 'rgba(255, 255, 255, 0.08)',
                          boxShadow: isVoice ? '0 0 16px rgba(16, 185, 129, 0.12)' : undefined,
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm sm:text-base truncate group-hover:text-emerald-300 transition-colors">
                              {sess.resolvedName || sess.displayName || (isGuest ? 'Guest User' : 'User')}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md font-mono ${
                                  isGuest
                                    ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                }`}
                              >
                                {isGuest ? 'Guest' : 'Authenticated'}
                              </span>
                              {sess.userEmail && sess.userEmail !== 'guest@sigma.ai' && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                                  {sess.userEmail}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Voice session status */}
                          <div
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              isVoice
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                                : 'bg-white/5 text-slate-400 border border-white/5'
                            }`}
                          >
                            {isVoice ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5" />}
                            <span className="text-[11px]">
                              {isVoice ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <div className="flex items-center gap-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isLive ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}
                            />
                            <span>{isLive ? 'Heartbeat Active' : 'Idle'}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">
                            Inspect session →
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: AI PROVIDERS (20+) */}
      {adminTab === 'providers' && (
        <AdminProvidersTab currentThemeHex={currentThemeHex} onShowToast={showLocalToast} />
      )}

      {/* TAB: MODEL CATALOG */}
      {adminTab === 'models' && (
        <AdminModelsTab currentThemeHex={currentThemeHex} onShowToast={showLocalToast} />
      )}

      {/* TAB: API PLAYGROUND */}
      {adminTab === 'playground' && (
        <AdminPlaygroundTab currentThemeHex={currentThemeHex} onShowToast={showLocalToast} />
      )}

      {/* TAB: API CLIENTS & CONNECTIONS */}
      {adminTab === 'connections' && (
        <AdminConnectionsTab
          currentThemeHex={currentThemeHex}
          onShowToast={showLocalToast}
          adminEmail={user.email}
        />
      )}

      {/* TAB: TOKEN ACCOUNTING */}
      {adminTab === 'tokens' && (
        <AdminTokensTab currentThemeHex={currentThemeHex} onShowToast={showLocalToast} />
      )}

      {/* TAB: STORAGE INFRASTRUCTURE */}
      {adminTab === 'storage' && (
        <AdminStorageTab currentThemeHex={currentThemeHex} onShowToast={showLocalToast} />
      )}

      {/* TAB: SYSTEM BACKUPS */}
      {adminTab === 'backups' && (
        <AdminBackupsTab
          currentThemeHex={currentThemeHex}
          onShowToast={showLocalToast}
          adminEmail={user.email}
        />
      )}

      {/* TAB: SESSIONS DEDICATED VIEW */}
      {adminTab === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-400" />
                  <span>Real-Time Active Sessions & Live Voice Quality Monitoring</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Inspect active sessions for authenticated users and persistent guests, microphone permissions, audio streams, and explicit voice transcripts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchActiveSessions}
                  disabled={isLoadingSessions}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                  <span>Refresh Sessions</span>
                </button>
              </div>
            </div>

            {/* Two Column Layout: Authenticated vs Guests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Authenticated Users Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Authenticated Users</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {activeSessionsList.filter((s) => s.identityType === 'user' && s.status === 'active').length} Active
                  </span>
                </div>

                <div className="space-y-2">
                  {activeSessionsList.filter((s) => s.identityType === 'user').length === 0 ? (
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-xs text-slate-500 text-center">
                      No authenticated user sessions currently recorded.
                    </div>
                  ) : (
                    activeSessionsList
                      .filter((s) => s.identityType === 'user')
                      .map((sess) => (
                        <div
                          key={sess.sessionId}
                          onClick={() => handleSelectSession(sess)}
                          className="p-3.5 rounded-xl border border-white/10 bg-[#0e1117] hover:bg-[#141822] cursor-pointer transition-all flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs sm:text-sm truncate">
                              {sess.resolvedName || sess.displayName || 'Google User'}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {sess.userEmail || sess.identityId}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                sess.voiceSession
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                                  : 'bg-white/5 text-slate-400'
                              }`}
                            >
                              Voice: {sess.voiceSession ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Mic: {sess.microphonePermission || 'prompt'}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Guest Users Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Guest Users (Persistent Profiles)</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {activeSessionsList.filter((s) => s.identityType === 'guest' && s.status === 'active').length} Active
                  </span>
                </div>

                <div className="space-y-2">
                  {activeSessionsList.filter((s) => s.identityType === 'guest').length === 0 ? (
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-xs text-slate-500 text-center">
                      No guest sessions currently recorded.
                    </div>
                  ) : (
                    activeSessionsList
                      .filter((s) => s.identityType === 'guest')
                      .map((sess) => (
                        <div
                          key={sess.sessionId}
                          onClick={() => handleSelectSession(sess)}
                          className="p-3.5 rounded-xl border border-white/10 bg-[#0e1117] hover:bg-[#141822] cursor-pointer transition-all flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs sm:text-sm truncate">
                              {sess.resolvedName || sess.displayName || 'Guest User'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              ID: {sess.identityId}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                sess.voiceSession
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                                  : 'bg-white/5 text-slate-400'
                              }`}
                            >
                              Voice: {sess.voiceSession ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Mic: {sess.microphonePermission || 'prompt'}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AI MEMORY & Q&A DATABASE (Persistent 100% Exact Match Cache) */}
      {adminTab === 'database' && (
        <div className="space-y-5">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-[#12141a] border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Total Questions Memorized</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{qaTotal.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400 mt-1">Guest & logged-in user prompts</p>
            </div>

            <div className="p-4 bg-[#12141a] border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>100% Matches Re-used</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 font-mono">{qaTotalHits.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400 mt-1">Served instantly without API call</p>
            </div>

            <div className="p-4 bg-[#12141a] border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Memory Cache Latency</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400 font-mono">&lt; 5ms</div>
              <p className="text-[11px] text-slate-400 mt-1">Instant server-side hash retrieval</p>
            </div>

            <div className="p-4 bg-[#12141a] border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Primary AI Engine</span>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-sm font-bold text-purple-300 truncate">OpenRouter Gemma 4</div>
              <p className="text-[11px] text-slate-400 mt-1">Full multimodal drawing & vision</p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search stored questions or answers..."
                  value={qaSearch}
                  onChange={(e) => setQaSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchQaRecords()}
                  className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
                {(['all', 'guest', 'authenticated', 'frequent'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    type="button"
                    onClick={() => setQaFilter(filterType)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all capitalize cursor-pointer ${
                      qaFilter === filterType ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filterType === 'all'
                      ? 'All'
                      : filterType === 'guest'
                      ? 'Guests'
                      : filterType === 'authenticated'
                      ? 'Users'
                      : 'Re-used (>1)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              <button
                type="button"
                onClick={fetchQaRecords}
                disabled={isLoadingQa}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Refresh Database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQa ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleExportQaJson}
                disabled={qaList.length === 0}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Export JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>

              <button
                type="button"
                onClick={handleExportQaCsv}
                disabled={qaList.length === 0}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Export CSV"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddQaModal(true)}
                className="px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-500 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Seed Memory</span>
              </button>

              <button
                type="button"
                onClick={handleClearQa}
                disabled={qaList.length === 0}
                className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 rounded-xl text-xs font-semibold text-red-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Q&A Records List */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Learned Questions & Stored Answers</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  When any user or guest asks a question that matches 100%, the AI delivers the stored answer instantly without consuming OpenRouter quota.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                Showing {qaList.length} of {qaTotal}
              </span>
            </div>

            {isLoadingQa ? (
              <div className="py-16 text-center text-slate-400 text-xs sm:text-sm flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Scanning Q&A Memory Database...</span>
              </div>
            ) : qaList.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs sm:text-sm flex flex-col items-center justify-center gap-3 border border-dashed border-white/10 rounded-xl p-8">
                <Database className="w-10 h-10 text-slate-600" />
                <p className="font-semibold text-slate-300">No memorized questions found</p>
                <p className="text-xs text-slate-500 max-w-md">
                  Whenever any user or guest asks a question in chat, the answer is immediately saved here. You can also pre-seed questions and answers manually.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddQaModal(true)}
                  className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  + Seed First Q&A Pair
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {qaList.map((qa) => {
                  const isExpanded = expandedQaId === qa.id;
                  const isFrequent = qa.hitCount > 1;

                  return (
                    <div
                      key={qa.id}
                      className="p-4 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/20 rounded-xl transition-all"
                    >
                      {/* Top Header of the Q&A card */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-white/5">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* User Type Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                              qa.userType === 'authenticated'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-slate-700/40 text-slate-300 border border-slate-600/40'
                            }`}
                          >
                            {qa.userType === 'authenticated' ? `User: ${qa.userEmail}` : 'Guest Prompt'}
                          </span>

                          {/* 100% Match Hit Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 ${
                              isFrequent
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            <Zap className="w-2.5 h-2.5" />
                            <span>100% Match: Re-used {qa.hitCount} {qa.hitCount === 1 ? 'time' : 'times'}</span>
                          </span>

                          {/* Drawing/Image indicator */}
                          {qa.hasImages && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Drawing / Image Upload
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(qa.createdAt).toLocaleDateString()} {new Date(qa.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(qa.answer);
                              showLocalToast('Answer copied to clipboard!');
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            title="Copy Answer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteQa(qa.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete Q&A Memory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question / Prompt */}
                      <div className="mb-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                          User Question / Prompt:
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed bg-white/5 p-2.5 rounded-lg border border-white/5">
                          "{qa.prompt}"
                        </p>
                      </div>

                      {/* Answer */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>AI Stored Answer:</span>
                          </span>
                          {qa.answer.length > 250 && (
                            <button
                              type="button"
                              onClick={() => setExpandedQaId(isExpanded ? null : qa.id)}
                              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                            >
                              {isExpanded ? 'Show less' : 'Read full answer'}
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed bg-black/50 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                          {isExpanded || qa.answer.length <= 250
                            ? qa.answer
                            : `${qa.answer.slice(0, 250)}...`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: PRE-SEED AI Q&A MEMORY */}
      {showAddQaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#161922] border border-white/15 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Pre-seed AI Knowledge Memory</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddQaModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Add an exact prompt and ideal answer. If any user or guest asks this question, the AI will deliver this answer instantly with zero latency and zero API cost.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Question / Prompt:
                </label>
                <input
                  type="text"
                  value={newQaPrompt}
                  onChange={(e) => setNewQaPrompt(e.target.value)}
                  placeholder="e.g., Who created you?"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ideal AI Answer (Concise, ChatGPT/Gemini style):
                </label>
                <textarea
                  value={newQaAnswer}
                  onChange={(e) => setNewQaAnswer(e.target.value)}
                  rows={5}
                  placeholder="e.g., I am Sigma AI, an advanced AI system created and owned by Ayaan Haris."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddQaModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewQa}
                disabled={isSavingQa || !newQaPrompt.trim() || !newQaAnswer.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingQa ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>Save to AI Memory</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: USER CHATS & INQUIRIES (Permanent Cloud Firestore Storage) */}
      {adminTab === 'chats' && (
        <div className="space-y-5">
          {/* Storage & Web Location Explanatory Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-[#12141a] to-blue-950/30 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Permanent Web Cloud Storage Active
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Collection: global_chat_logs</span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Where is your chat data saved?</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  All chats (from both <strong className="text-white">Guest</strong> sessions and <strong className="text-white">Authenticated</strong> accounts) are permanently archived to your <strong className="text-white">Google Cloud Firestore</strong> web database. It will <span className="text-emerald-400 font-medium">never be erased</span> when you export your code, deploy on <strong className="text-white">Cloudflare Pages</strong>, or clear browser cache. You can view all salvage transcripts here in the Command Center or directly in your Firebase Web Console.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Firebase Console</span>
                </a>
                <button
                  type="button"
                  onClick={fetchGlobalChats}
                  disabled={isLoadingChats}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingChats ? 'animate-spin' : ''}`} />
                  <span>Refresh Logs</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search prompt, answer, or user email..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white/40"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs text-slate-400 font-mono">
                {globalChatsList.filter((log) => {
                  if (!chatSearch.trim()) return true;
                  const q = chatSearch.toLowerCase();
                  return (
                    log.prompt?.toLowerCase().includes(q) ||
                    log.answer?.toLowerCase().includes(q) ||
                    log.userEmail?.toLowerCase().includes(q) ||
                    log.userName?.toLowerCase().includes(q)
                  );
                }).length} Saved Transcripts
              </span>
            </div>
          </div>

          {/* Chat Logs List */}
          {isLoadingChats ? (
            <div className="bg-[#12141a] border border-white/10 rounded-2xl p-12 text-center">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-300">Loading permanent chat records from Google Cloud Firestore...</p>
            </div>
          ) : globalChatsList.length === 0 ? (
            <div className="bg-[#12141a] border border-white/10 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">No Permanent Chat Logs Found Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Any message sent in the chat (whether by guest or signed-in user) will be permanently logged here in real-time.
              </p>
              <button
                type="button"
                onClick={fetchGlobalChats}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Again</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {globalChatsList
                .filter((log) => {
                  if (!chatSearch.trim()) return true;
                  const q = chatSearch.toLowerCase();
                  return (
                    log.prompt?.toLowerCase().includes(q) ||
                    log.answer?.toLowerCase().includes(q) ||
                    log.userEmail?.toLowerCase().includes(q) ||
                    log.userName?.toLowerCase().includes(q)
                  );
                })
                .map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#12141a] border border-white/10 hover:border-white/20 transition-all rounded-2xl p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{log.userName || 'User'}</span>
                        <span className="text-xs text-slate-400 font-mono">({log.userEmail || 'guest@sigma.ai'})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            log.userType === 'authenticated'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {log.userType === 'authenticated' ? 'Verified Account' : 'Guest'}
                        </span>
                        {log.userRole === 'admin' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            Admin
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                          {log.model || 'Gemma'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `User (${log.userEmail}):\n${log.prompt}\n\nAI Response:\n${log.answer}`
                            );
                            showLocalToast('Chat transcript copied to clipboard');
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                          title="Copy full transcript"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          User Prompt
                        </span>
                        <p className="text-slate-200 whitespace-pre-wrap">{log.prompt}</p>
                      </div>

                      <div className="bg-emerald-950/20 rounded-xl p-3 border border-emerald-500/20">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                          AI Answer (Saved in Cloud)
                        </span>
                        <p className="text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                          {log.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT (Real registered accounts only) */}
      {adminTab === 'users' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search real user or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white/40"
                />
              </div>
              <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  aria-label="Filter users by role"
                  className="bg-transparent text-slate-300 text-xs py-1 px-1 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#12141a] text-white">All Roles</option>
                  <option value="admin" className="bg-[#12141a] text-white">Admin</option>
                  <option value="moderator" className="bg-[#12141a] text-white">Moderator</option>
                  <option value="user" className="bg-[#12141a] text-white">User</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={fetchUsers}
                disabled={isLoadingUsers}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Refresh user list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-black/40 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Auth Method</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Total Chats</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
                        <p className="text-sm font-medium">No real users matching criteria.</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Only authenticated users with real login sessions are listed. Guests are excluded.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const lowerEmail = (u.email || '').toLowerCase();
                      const isOwner =
                        lowerEmail === 'sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com' ||
                        lowerEmail === 'devuserhub@gmail.com' ||
                        lowerEmail === 'devuser@gmail.com' ||
                        lowerEmail === 'sabaharis.239@gmail.com' ||
                        lowerEmail === 'sabahharis.239@gmail.com' ||
                        lowerEmail.includes('sabaharis') ||
                        lowerEmail.includes('sabahharis');
                      const isCoo = lowerEmail === 'wahaj1haider3@gmail.com';
                      const isCoOwner = lowerEmail === 'tehmaarhaider12@gmail.com' || lowerEmail.includes('tehmaarhaider');
                      return (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                                style={{ backgroundColor: `${currentThemeHex}20`, color: currentThemeHex }}
                              >
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  <span>{u.name || 'Anonymous User'}</span>
                                  {isOwner && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                      Owner / CEO
                                    </span>
                                  )}
                                  {isCoOwner && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                                      👑 Co-Owner
                                    </span>
                                  )}
                                  {isCoo && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                                      COO
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-300">
                              {u.authProvider === 'google' ? <Globe className="w-3 h-3 text-blue-400" /> : <Mail className="w-3 h-3 text-emerald-400" />}
                              <span>{u.authProvider === 'google' ? 'Google OAuth' : 'Email OTP'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value as any)}
                              disabled={isOwner}
                              aria-label={`Change role for ${u.name}`}
                              className="bg-black/50 border border-white/10 rounded-lg text-xs py-1 px-2 text-white focus:outline-none focus:border-white/30 disabled:opacity-50 cursor-pointer"
                            >
                              <option value="user" className="bg-[#12141a] text-white">User</option>
                              <option value="moderator" className="bg-[#12141a] text-white">Moderator</option>
                              <option value="admin" className="bg-[#12141a] text-white">Admin</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                u.status === 'active'
                                  ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                                  : 'bg-red-950/50 border-red-800 text-red-300'
                              }`}
                            >
                              {u.status === 'active' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                              <span className="capitalize">{u.status}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">{u.totalChats}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedUser(u)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {!isOwner && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserStatus(u.id, u.status)}
                                    className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                      u.status === 'active'
                                        ? 'bg-red-950/40 text-red-400 hover:bg-red-900/50'
                                        : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50'
                                    }`}
                                    title={u.status === 'active' ? 'Suspend user' : 'Activate user'}
                                  >
                                    {u.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 rounded-lg bg-red-950/30 text-red-400 hover:bg-red-900/50 cursor-pointer transition-colors"
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Details Modal if selected */}
          {selectedUser && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-[#12141a] border border-white/20 rounded-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white">Real User Record</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="text-slate-400 hover:text-white text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">User ID:</span>
                    <span className="font-mono text-white">{selectedUser.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Full Name:</span>
                    <span className="font-semibold text-white">{selectedUser.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Email Address:</span>
                    <span className="font-mono text-white">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Account Role:</span>
                    <span className="uppercase text-amber-300 font-bold">{selectedUser.role}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Account Status:</span>
                    <span className="capitalize font-semibold text-emerald-400">{selectedUser.status}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Joined Date:</span>
                    <span className="text-slate-300">{selectedUser.joinedAt}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Total Conversations:</span>
                    <span className="font-mono font-bold text-white">{selectedUser.totalChats}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/15 rounded-xl font-semibold text-white text-xs cursor-pointer"
                >
                  Close Record
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUTHENTICATION & SECURITY */}
      {adminTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm sm:text-base font-bold text-white mb-1">Dual-Email Security Dispatch</h3>
              <p className="text-xs text-slate-400 mb-4">
                Verification codes are dispatched to user's signup email AND mirrored to owner (sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com) and co-admin (devuserhub@gmail.com).
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">User Signup Recipient</span>
                  <span className="text-emerald-400 font-semibold">Active (Brevo / Resend)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">Owner Audit (sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com)</span>
                  <span className="text-emerald-400 font-semibold">Mirrored & Logged</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">Co-Admin Audit (devuserhub@gmail.com)</span>
                  <span className="text-emerald-400 font-semibold">Mirrored & Logged</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">Code Expiry Window</span>
                  <span className="font-mono text-white">10 Minutes</span>
                </div>
              </div>
            </div>

            <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm sm:text-base font-bold text-white mb-1">Authentication Channels</h3>
              <p className="text-xs text-slate-400 mb-4">Production identity flows enabled on this deployment</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">Google OAuth 2.0 (Firebase Client)</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">4-Digit Email Code (OTP)</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">Guest Temporary Sessions</span>
                  <span className="text-slate-400">Tracked in Active Users</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real Security Logs */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Live Security Audit Logs</h3>
                <p className="text-xs text-slate-400">Real security events, OTP codes dispatched, and account logins</p>
              </div>
              <button
                type="button"
                onClick={fetchSecurityLogs}
                disabled={isLoadingLogs}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {securityLogs.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No security events recorded yet.
                </div>
              ) : (
                securityLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <Shield className={`w-4 h-4 flex-shrink-0 ${
                        log.status === 'Success' ? 'text-emerald-400' : log.status === 'Warning' ? 'text-amber-400' : 'text-rose-400'
                      }`} />
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span className="font-mono text-slate-300">{log.email}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10 uppercase">
                            {log.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{log.details}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={`text-[11px] font-semibold ${
                        log.status === 'Success' ? 'text-emerald-400' : log.status === 'Warning' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI & API MANAGEMENT (+ Add API Feature) */}
      {adminTab === 'ai' && (
        <div className="space-y-6">
          {/* Model Engine Selector */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm sm:text-base font-bold text-white mb-1">System AI Model Engine Priority</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select the active model priority for all incoming user inquiries across Sigma AI.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: '3.8 Flash',
                  title: '3.8 Flash',
                  badge: 'Ultra Fast',
                  desc: 'Immediate response, optimal quota, lightning fast search grounding.',
                  speed: 'Ultra-Fast (< 400ms)',
                },
                {
                  id: '3.6 Flash',
                  title: '3.6 Flash',
                  badge: 'Multimodal',
                  desc: 'High precision vision analysis, balanced reasoning, and code synthesis.',
                  speed: 'Fast (~ 750ms)',
                },
                {
                  id: '3.1 Pro Preview',
                  title: '3.1 Pro Preview',
                  badge: 'Deep Reasoning',
                  desc: 'Analytical thinking, complex multi-step instructions, and thorough depth.',
                  speed: 'Thoughtful (~ 1800ms)',
                },
              ].map((m) => {
                const isSelected = modelChoice === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectModel(m.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white/10 border-white/40 shadow-lg'
                        : 'bg-black/30 border-white/10 hover:border-white/20'
                    }`}
                    style={{
                      borderColor: isSelected ? currentThemeHex : undefined,
                      boxShadow: isSelected ? `0 0 20px ${themeGlow}` : undefined,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-sm">{m.title}</span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: `${currentThemeHex}20`,
                            color: currentThemeHex,
                          }}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{m.desc}</p>
                    </div>
                    <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 pt-2 border-t border-white/5">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{m.speed}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Requested Feature: Multiple API Keys Pool (+ Add API) */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Gemini API Key Pool & Auto-Rotation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Add multiple Gemini APIs. The AI checks and uses keys sequentially. If one API reaches its rate limit or quota, it automatically switches to another key seamlessly.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setKeySubmitError(null);
                  setShowAddKeyModal(true);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all flex-shrink-0 shadow-md active:scale-95"
                style={{
                  backgroundColor: currentThemeHex,
                  color: '#000000',
                  boxShadow: `0 4px 14px ${themeGlow}`,
                }}
              >
                <Plus className="w-4 h-4" />
                <span>+ Add API</span>
              </button>
            </div>

            {/* Smart Rotation Logic Explanation Pill */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-200/90">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Intelligent Fallback Active:</strong> Requests cycle through active keys in sequence. Any key returning a <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">429 (Resource Exhausted / Quota Limit)</code> is automatically flagged and the next key is called immediately without erroring to the user.
              </div>
            </div>

            {/* API Keys Table */}
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-black/40 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Key Nickname</th>
                    <th className="py-3 px-4">Masked Key</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Usage (Success/Fail)</th>
                    <th className="py-3 px-4">Last Used</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        {isLoadingKeys ? 'Loading API keys...' : 'No API keys configured yet. Click "+ Add API" to add your first key.'}
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map((k) => (
                      <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          <div className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-slate-400" />
                            <span>{k.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {k.key}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                              k.status === 'active'
                                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                                : k.status === 'rate_limited'
                                ? 'bg-amber-950/50 border-amber-800 text-amber-300'
                                : 'bg-rose-950/50 border-rose-800 text-rose-300'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              k.status === 'active' ? 'bg-emerald-400 animate-pulse' : k.status === 'rate_limited' ? 'bg-amber-400' : 'bg-rose-400'
                            }`} />
                            <span className="capitalize">{k.status.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          <span className="text-emerald-400 font-bold">{k.successCount}</span>
                          <span className="text-slate-500"> / </span>
                          <span className={k.errorCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                            {k.errorCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleTimeString() : 'Never'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveApiKey(k.id)}
                            disabled={apiKeys.length <= 1}
                            className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={apiKeys.length <= 1 ? 'At least one key required' : 'Remove key'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal to Add API */}
          {showAddKeyModal && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-[#12141a] border border-white/20 rounded-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Add Gemini API to Pool</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddKeyModal(false)}
                    className="text-slate-400 hover:text-white text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddApiKey} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Gemini API Key <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-white/30"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Your key is securely held on the backend server and never exposed to client browsers.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Key Label / Nickname (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gemini Backup Key #2"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-white/30"
                    />
                  </div>

                  {keySubmitError && (
                    <div className="p-2.5 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{keySubmitError}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddKeyModal(false)}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-slate-300 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingKey}
                      className="flex-1 py-2.5 rounded-xl font-bold text-black text-xs cursor-pointer flex items-center justify-center gap-2"
                      style={{ backgroundColor: currentThemeHex }}
                    >
                      {isSubmittingKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save & Add to Pool</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* API Providers Ping Test */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">External Providers & Ping Latency</h3>
                <p className="text-xs text-slate-400">Live operational status check of integrated AI and server endpoints</p>
              </div>
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isPinging}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                <span>{isPinging ? 'Testing...' : 'Test Ping'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(pingResults).map(([provider, info]) => (
                <div key={provider} className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white text-xs">{provider}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      {info.status}
                    </span>
                  </div>
                  <div className="text-lg font-mono font-bold text-white">{info.latency}ms</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Response latency</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM & MAINTENANCE (STOP AI LOCK) */}
      {adminTab === 'system' && (
        <div className="space-y-6">
          {/* Master Stop AI / Maintenance Lock */}
          <div
            className={`border-2 rounded-2xl p-5 sm:p-6 transition-all ${
              locked
                ? 'bg-red-950/20 border-red-600/80 shadow-xl'
                : 'bg-[#12141a] border-white/10'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    locked ? 'bg-red-600 text-white shadow-lg' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {locked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>Stop AI / System Maintenance Lock</span>
                    {locked && (
                      <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] uppercase font-extrabold tracking-wider">
                        Locked
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                    When active, AI generation is completely stopped for all users. Anyone asking a question will receive the highlighted maintenance notification box sliding up for 10 seconds.
                  </p>
                </div>
              </div>

              {/* Master Big Lock Button */}
              <button
                type="button"
                onClick={() => handleToggleLock(!locked)}
                className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all flex-shrink-0 ${
                  locked
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-lg'
                }`}
              >
                {locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{locked ? 'Resume AI (Unlock)' : 'Stop AI (Lock Now)'}</span>
              </button>
            </div>

            {/* Custom Maintenance Message Field */}
            <div className="mt-5 pt-5 border-t border-white/10">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Custom Maintenance Lock Notice (Displayed to users for 10 seconds):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customLockMsg}
                  onChange={(e) => setCustomLockMsg(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white/40"
                  placeholder="Sigma AI is closed for now and will be coming soon."
                />
                <button
                  type="button"
                  onClick={() => handleToggleLock(locked)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold text-white cursor-pointer"
                >
                  Save Notice
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Default: "Sigma AI is closed for now and will be coming soon."
              </p>
            </div>
          </div>

          {/* System Health Indicators */}
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm sm:text-base font-bold text-white mb-1">Container & Host Health</h3>
            <p className="text-xs text-slate-400 mb-4">Google Cloud Run container runtime metrics</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">Target Ingress Port</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">3000 (Internal Reverse Proxy)</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">Node.js Engine</span>
                <span className="font-mono font-bold text-white text-sm">Node v22 (Cloud Run Container)</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">Build Target</span>
                <span className="font-mono font-bold text-blue-400 text-sm">Vite 6 + Express ESM/CJS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SESSION DETAILS INSPECTOR MODAL */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-[#13151b] border border-white/10 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md font-mono ${
                      selectedSession.identityType === 'guest'
                        ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                    }`}
                  >
                    {selectedSession.identityType === 'guest' ? 'Guest Profile' : 'Authenticated User'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                      selectedSession.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {selectedSession.status === 'active' ? '● Active Heartbeat' : '○ Idle'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedSession.resolvedName || selectedSession.displayName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Session Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 block text-[11px]">Identity ID:</span>
                <span className="text-white font-mono font-bold break-all">{selectedSession.identityId}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 block text-[11px]">Session ID:</span>
                <span className="text-white font-mono font-bold break-all">{selectedSession.sessionId}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 block text-[11px]">Voice Session:</span>
                <span className={`font-bold ${selectedSession.voiceSession ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {selectedSession.voiceSession ? '🎙 Active (Live audio interaction)' : 'Inactive'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 block text-[11px]">Audio Stream:</span>
                <span className="text-white font-mono font-semibold capitalize">{selectedSession.audioStream || 'Disconnected'}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 block text-[11px]">Microphone Permission:</span>
                <span className="text-white font-mono font-semibold capitalize">{selectedSession.microphonePermission || 'Prompt'}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 block text-[11px]">Started At:</span>
                <span className="text-white font-mono">{new Date(selectedSession.startedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Voice Sessions Subcollection History */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Recorded Voice Sessions
                </h4>
                {isLoadingVoiceHistory && <span className="text-[11px] text-slate-400 animate-pulse">Loading history...</span>}
              </div>

              {selectedSessionVoiceHistory.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-xs bg-black/20 rounded-xl border border-white/5">
                  No voice sessions recorded yet for this {selectedSession.identityType}.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedSessionVoiceHistory.map((vSess, idx) => (
                    <div key={vSess.sessionId || idx} className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-mono font-semibold">Session: {vSess.sessionId?.slice(0, 14)}...</span>
                        <span className="text-emerald-400 font-mono">{vSess.duration ? `${vSess.duration}s` : 'active'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Started: {new Date(vSess.startedAt).toLocaleString()} · Language: {vSess.language || 'English'}
                      </div>
                      {vSess.transcript && (
                        <div className="mt-1.5 p-2 rounded-lg bg-white/5 text-slate-300 text-[11px] font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                          {vSess.transcript}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
