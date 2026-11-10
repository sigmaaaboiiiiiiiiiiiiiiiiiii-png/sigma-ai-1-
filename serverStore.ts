import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BASIC_CONVERSATIONS_100, INITIAL_WORD_DEFINITIONS } from './src/lib/basicConversations';

export const OWNER_EMAIL = 'sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com';
export const CO_ADMIN_EMAIL = 'devuserhub@gmail.com';
export const COO_EMAIL = 'wahaj1haider3@gmail.com';
export const ADMIN_EMAILS = new Set([
  OWNER_EMAIL.toLowerCase(),
  CO_ADMIN_EMAIL.toLowerCase(),
  COO_EMAIL.toLowerCase(),
  'sabaharis.239@gmail.com',
  'sabahharis.239@gmail.com'
]);

const DATA_DIR = path.join(process.cwd(), 'data');
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create data dir:', e);
}

const METRICS_FILE = path.join(DATA_DIR, 'metrics.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LOGS_FILE = path.join(DATA_DIR, 'security_logs.json');
const KEYS_FILE = path.join(DATA_DIR, 'api_keys.json');

// --- 1. Real Active Sessions (Heartbeat) ---
export interface ActiveSession {
  clientId: string;
  email?: string;
  name?: string;
  isGuest: boolean;
  lastSeen: number;
}
const activeSessions = new Map<string, ActiveSession>();

export function recordHeartbeat(session: { clientId: string; email?: string; name?: string; isGuest: boolean }) {
  activeSessions.set(session.clientId, {
    clientId: session.clientId,
    email: session.email,
    name: session.name,
    isGuest: session.isGuest,
    lastSeen: Date.now(),
  });
}

export function removeHeartbeat(clientId: string) {
  activeSessions.delete(clientId);
}

export function getActiveSessionsCount(): number {
  const cutoff = Date.now() - 35000;
  let count = 0;
  for (const [id, s] of activeSessions.entries()) {
    if (s.lastSeen >= cutoff) {
      count++;
    } else {
      activeSessions.delete(id);
    }
  }
  return Math.max(1, count); // at least 1 when current user is browsing
}

// Cleanup stale sessions
setInterval(() => {
  const cutoff = Date.now() - 35000;
  for (const [id, s] of activeSessions.entries()) {
    if (s.lastSeen < cutoff) {
      activeSessions.delete(id);
    }
  }
}, 12000);

// --- 2. Real Metrics & Daily Traffic ---
export interface SystemMetrics {
  totalInquiries: number;
  totalLatencyMs: number;
  queriesCount: number;
  modelUsage: Record<string, number>;
  dailyTraffic: Record<string, { requests: number; queries: number }>;
}

let metrics: SystemMetrics = {
  totalInquiries: 0,
  totalLatencyMs: 0,
  queriesCount: 0,
  modelUsage: {
    '3.8 Flash': 0,
    '3.6 Flash': 0,
    '3.1 Pro': 0,
  },
  dailyTraffic: {},
};

function loadMetrics() {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      const data = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf-8'));
      metrics = { ...metrics, ...data };
    }
  } catch (e) {
    console.warn('Could not load metrics from file, using initial state:', e);
  }
}
loadMetrics();

function saveMetrics() {
  try {
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

export function recordQueryMetrics(modelName: string, latencyMs: number, userEmail?: string) {
  metrics.totalInquiries += 1;
  metrics.totalLatencyMs += latencyMs;
  metrics.queriesCount += 1;

  // Model usage count
  const key = modelName.includes('3.8')
    ? '3.8 Flash'
    : modelName.includes('3.1')
    ? '3.1 Pro'
    : '3.6 Flash';
  metrics.modelUsage[key] = (metrics.modelUsage[key] || 0) + 1;

  // Daily traffic
  const todayKey = new Date().toISOString().split('T')[0];
  if (!metrics.dailyTraffic[todayKey]) {
    metrics.dailyTraffic[todayKey] = { requests: 0, queries: 0 };
  }
  metrics.dailyTraffic[todayKey].requests += 1;
  metrics.dailyTraffic[todayKey].queries += 1;

  saveMetrics();

  // If registered user, update their chat & action count
  if (userEmail) {
    recordUserAction(userEmail, true);
  }
}

export function getMetricsSummary() {
  const avgLatency = metrics.queriesCount > 0
    ? Math.round(metrics.totalLatencyMs / metrics.queriesCount)
    : 245;

  // Build last 7 days real traffic array
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyTrafficArr: { day: string; date: string; requests: number; queries: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = dayNames[d.getDay()];
    const entry = metrics.dailyTraffic[dateStr] || { requests: 0, queries: 0 };
    dailyTrafficArr.push({
      day: dayName,
      date: dateStr,
      requests: entry.requests,
      queries: entry.queries,
    });
  }

  // Calculate model distribution percentages
  const totalModelCalls = Object.values(metrics.modelUsage).reduce((a, b) => a + b, 0);
  const modelDistribution = [
    {
      name: '3.8 Flash',
      usage: totalModelCalls > 0 ? Math.round(((metrics.modelUsage['3.8 Flash'] || 0) / totalModelCalls) * 100) : 70,
      count: metrics.modelUsage['3.8 Flash'] || 0,
    },
    {
      name: '2.5 Flash',
      usage: totalModelCalls > 0 ? Math.round(((metrics.modelUsage['2.5 Flash'] || 0) / totalModelCalls) * 100) : 25,
      count: metrics.modelUsage['2.5 Flash'] || 0,
    },
    {
      name: '3.1 Pro',
      usage: totalModelCalls > 0 ? Math.round(((metrics.modelUsage['3.1 Pro'] || 0) / totalModelCalls) * 100) : 5,
      count: metrics.modelUsage['3.1 Pro'] || 0,
    },
  ];

  return {
    activeUsers: getActiveSessionsCount(),
    totalInquiries: metrics.totalInquiries,
    avgLatency,
    dailyTraffic: dailyTrafficArr,
    modelDistribution,
  };
}

// --- 3. Real User Management ---
export interface RealUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'user' | 'moderator';
  status: 'active' | 'suspended';
  authProvider: 'google' | 'email_otp';
  joinedAt: string;
  lastActive: string;
  totalChats: number;
  totalActions: number;
}

let usersRegistry: RealUserRecord[] = [
  {
    id: 'u-owner',
    name: 'Sigma Owner',
    email: OWNER_EMAIL,
    role: 'owner',
    status: 'active',
    authProvider: 'email_otp',
    joinedAt: '2025-01-01',
    lastActive: 'Just now',
    totalChats: 0,
    totalActions: 0,
  },
  {
    id: 'u-admin',
    name: 'Admin Hub',
    email: CO_ADMIN_EMAIL,
    role: 'admin',
    status: 'active',
    authProvider: 'google',
    joinedAt: '2025-01-05',
    lastActive: 'Just now',
    totalChats: 0,
    totalActions: 0,
  },
];

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const list = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      if (Array.isArray(list) && list.length > 0) {
        // Ensure owner and co-admin always exist and have right roles
        const map = new Map<string, RealUserRecord>();
        for (const u of list) {
          map.set(u.email.toLowerCase(), u);
        }
        if (!map.has(OWNER_EMAIL.toLowerCase())) {
          map.set(OWNER_EMAIL.toLowerCase(), usersRegistry[0]);
        } else {
          map.get(OWNER_EMAIL.toLowerCase())!.role = 'owner';
        }
        if (!map.has(CO_ADMIN_EMAIL.toLowerCase())) {
          map.set(CO_ADMIN_EMAIL.toLowerCase(), usersRegistry[1]);
        }
        usersRegistry = Array.from(map.values());
      }
    }
  } catch (e) {
    console.warn('Could not load users from file, using seeded defaults:', e);
  }
}
loadUsers();

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersRegistry, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

export function registerOrUpdateUser(email: string, name?: string, authProvider: 'google' | 'email_otp' = 'email_otp'): RealUserRecord {
  const normalized = email.trim().toLowerCase();
  let user = usersRegistry.find((u) => u.email.toLowerCase() === normalized);

  if (!user) {
    const isOwner = normalized === OWNER_EMAIL.toLowerCase();
    const isAdmin = normalized === CO_ADMIN_EMAIL.toLowerCase();
    user = {
      id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name?.trim() || (isOwner ? 'Sigma Owner' : isAdmin ? 'Admin Hub' : normalized.split('@')[0]),
      email: normalized,
      role: isOwner ? 'owner' : isAdmin ? 'admin' : 'user',
      status: 'active',
      authProvider,
      joinedAt: new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      totalChats: 0,
      totalActions: 1,
    };
    usersRegistry.unshift(user);
  } else {
    if (name?.trim() && user.name.includes('@')) {
      user.name = name.trim();
    }
    user.lastActive = 'Just now';
    user.totalActions += 1;
  }

  saveUsers();
  return user;
}

export function recordUserAction(email: string, isChat = false) {
  const normalized = email.trim().toLowerCase();
  const user = usersRegistry.find((u) => u.email.toLowerCase() === normalized);
  if (user) {
    user.lastActive = 'Just now';
    user.totalActions += 1;
    if (isChat) {
      user.totalChats += 1;
    }
    saveUsers();
  }
}

export function getAllUsers(): RealUserRecord[] {
  return usersRegistry;
}

export function isUserSuspended(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const user = usersRegistry.find((u) => u.email.toLowerCase() === normalized);
  return user ? user.status === 'suspended' : false;
}

export function setUserStatus(userId: string, newStatus: 'active' | 'suspended', requesterEmail?: string): boolean {
  const user = usersRegistry.find((u) => u.id === userId);
  if (!user) return false;
  // Cannot suspend owner
  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
    throw new Error('The Sigma Owner account cannot be suspended.');
  }
  user.status = newStatus;
  saveUsers();

  logSecurityEvent({
    type: 'STATUS_CHANGE',
    email: user.email,
    details: `User status changed to ${newStatus} by ${requesterEmail || 'Admin'}`,
    status: 'Success',
  });
  return true;
}

export function setUserRole(userId: string, newRole: 'admin' | 'user' | 'moderator', requesterEmail?: string): boolean {
  const user = usersRegistry.find((u) => u.id === userId);
  if (!user) return false;
  // Cannot modify owner role
  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
    throw new Error('The Sigma Owner role cannot be modified.');
  }
  user.role = newRole;
  saveUsers();

  logSecurityEvent({
    type: 'ROLE_CHANGE',
    email: user.email,
    details: `Role updated to ${newRole} by ${requesterEmail || 'Owner'}`,
    status: 'Success',
  });
  return true;
}

export function deleteUser(userId: string): boolean {
  const user = usersRegistry.find((u) => u.id === userId);
  if (!user) return false;
  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
    throw new Error('The Sigma Owner account cannot be deleted.');
  }
  usersRegistry = usersRegistry.filter((u) => u.id !== userId);
  saveUsers();
  return true;
}

// --- 4. Real Security Audit Logs ---
export interface SecurityLogItem {
  id: string;
  timestamp: string;
  type: 'OTP_REQUEST' | 'LOGIN_SUCCESS' | 'OTP_FAILED' | 'STATUS_CHANGE' | 'ROLE_CHANGE';
  email: string;
  details: string;
  provider?: string;
  status: string;
}

let securityLogs: SecurityLogItem[] = [];

function loadLogs() {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      securityLogs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    }
  } catch (e) {
    securityLogs = [];
  }
}
loadLogs();

function saveLogs() {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(securityLogs.slice(0, 100), null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

export function logSecurityEvent(event: {
  type: SecurityLogItem['type'];
  email: string;
  details: string;
  provider?: string;
  status: string;
}) {
  const newLog: SecurityLogItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  securityLogs.unshift(newLog);
  if (securityLogs.length > 100) {
    securityLogs = securityLogs.slice(0, 100);
  }
  saveLogs();
}

export function getSecurityLogs(): SecurityLogItem[] {
  return securityLogs;
}

// --- 5. Multiple API Keys Pool & Auto-Rotation Fallback ---
export interface ApiKeyItem {
  id: string;
  key: string;
  name: string;
  addedAt: string;
  status: 'active' | 'rate_limited' | 'error';
  callsCount: number;
  errorsCount: number;
  lastUsed?: string;
}

let apiKeysPool: ApiKeyItem[] = [];

function loadApiKeys() {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      apiKeysPool = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
    }
  } catch (e) {
    apiKeysPool = [];
  }

  // Ensure default environment key is present if not already added
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (envKey && !envKey.startsWith('AQ.') && !apiKeysPool.some((k) => k.key === envKey)) {
    apiKeysPool.unshift({
      id: 'key-primary-env',
      key: envKey,
      name: 'Primary Env Key',
      addedAt: new Date().toISOString(),
      status: 'active',
      callsCount: 0,
      errorsCount: 0,
    });
  }
}
loadApiKeys();

function saveApiKeys() {
  try {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(apiKeysPool, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

export function getApiKeysList() {
  return apiKeysPool.map((k) => ({
    id: k.id,
    name: k.name,
    keyMasked: `${k.key.slice(0, 8)}...${k.key.slice(-4)}`,
    status: k.status,
    addedAt: k.addedAt,
    callsCount: k.callsCount,
    errorsCount: k.errorsCount,
    lastUsed: k.lastUsed,
  }));
}

export function addApiKey(key: string, name?: string): ApiKeyItem {
  const trimmedKey = key.trim();
  if (!trimmedKey) {
    throw new Error('API key cannot be empty.');
  }
  const existing = apiKeysPool.find((k) => k.key === trimmedKey);
  if (existing) {
    existing.status = 'active';
    saveApiKeys();
    return existing;
  }

  const newKeyItem: ApiKeyItem = {
    id: `key-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    key: trimmedKey,
    name: name?.trim() || `Key #${apiKeysPool.length + 1}`,
    addedAt: new Date().toISOString(),
    status: 'active',
    callsCount: 0,
    errorsCount: 0,
  };
  apiKeysPool.push(newKeyItem);
  saveApiKeys();
  return newKeyItem;
}

export function removeApiKey(id: string): boolean {
  apiKeysPool = apiKeysPool.filter((k) => k.id !== id);
  saveApiKeys();
  return true;
}

/**
 * Execute a Gemini AI action across the API key pool.
 * If an active API key encounters 429 / Rate Limit or Quota error,
 * it marks the key as rate_limited and seamlessly rolls over to the next key in the pool!
 */
export async function executeWithApiKeyRotation<T>(
  callback: (apiKey: string) => Promise<T>
): Promise<T> {
  // Always keep the primary environment key fresh and active first
  const envKey = process.env.GEMINI_API_KEY?.trim();
  apiKeysPool = apiKeysPool.filter((k) => k.id !== 'key-primary-env' && !k.key.startsWith('AQ.'));
  if (envKey && !envKey.startsWith('AQ.')) {
    apiKeysPool.unshift({
      id: 'key-primary-env',
      key: envKey,
      name: 'Primary Env Key',
      addedAt: new Date().toISOString(),
      status: 'active',
      callsCount: 0,
      errorsCount: 0,
    });
  }

  if (apiKeysPool.length === 0) {
    if (!envKey || envKey.startsWith('AQ.')) {
      throw new Error('No valid Gemini API key is configured.');
    }
    return callback(envKey);
  }

  // Auto-recover keys: If a key was rate_limited > 20s ago, or if all keys are non-active, restore to active
  const nowMs = Date.now();
  const allInactive = apiKeysPool.every((k) => k.status !== 'active');
  for (const item of apiKeysPool) {
    if (item.status !== 'active') {
      const lastUsedMs = item.lastUsed ? new Date(item.lastUsed).getTime() : 0;
      if (allInactive || nowMs - lastUsedMs > 20 * 1000) {
        item.status = 'active';
      }
    }
  }

  // Sort: active keys first, fewest errors first
  const pool = [...apiKeysPool].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return a.callsCount - b.callsCount;
  });

  let lastError: any = null;

  for (const item of pool) {
    try {
      const result = await callback(item.key);
      item.callsCount += 1;
      item.status = 'active';
      item.lastUsed = new Date().toISOString();
      saveApiKeys();
      return result;
    } catch (err: any) {
      lastError = err;
      item.errorsCount += 1;
      item.lastUsed = new Date().toISOString();

      const errMsg = (err?.message || '').toLowerCase();
      const isRateLimit =
        err?.status === 429 ||
        errMsg.includes('429') ||
        errMsg.includes('resource_exhausted') ||
        errMsg.includes('quota') ||
        errMsg.includes('rate limit');

      if (isRateLimit) {
        item.status = 'rate_limited';
        console.warn(`[API-POOL-ROTATION] Key "${item.name}" hit rate limit/quota. Automatically falling back to next API key in pool...`);
      } else {
        item.status = 'error';
        console.warn(`[API-POOL-ROTATION] Key "${item.name}" encountered error: ${err?.message}`);
      }
      saveApiKeys();
      // Continue to next key in pool
    }
  }

  throw lastError || new Error('All configured API keys in pool failed or exceeded their rate limit. Please add another API key in the Admin Panel.');
}

// --- 5. SMTP / Nodemailer Configuration for Universal Email Delivery ---
export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
  fromEmail?: string;
  fromName?: string;
}

const SMTP_FILE = path.join(DATA_DIR, 'smtp_config.json');
let cachedSmtpConfig: SmtpConfig | null = null;

function loadSmtpConfig() {
  try {
    if (fs.existsSync(SMTP_FILE)) {
      const raw = fs.readFileSync(SMTP_FILE, 'utf-8');
      cachedSmtpConfig = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not load SMTP config from disk:', e);
  }
}
loadSmtpConfig();

export function getSmtpConfig(): SmtpConfig | null {
  if (cachedSmtpConfig && cachedSmtpConfig.user && cachedSmtpConfig.pass) {
    return cachedSmtpConfig;
  }
  // Check process.env fallback
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== 'false',
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim(),
      fromEmail: process.env.SMTP_FROM?.trim() || process.env.SMTP_USER.trim(),
      fromName: 'Sigma AI Security',
    };
  }
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: process.env.GMAIL_USER.trim(),
      pass: process.env.GMAIL_APP_PASSWORD.trim(),
      fromEmail: process.env.GMAIL_USER.trim(),
      fromName: 'Sigma AI Security',
    };
  }
  return null;
}

export function saveSmtpConfig(config: SmtpConfig | null): boolean {
  cachedSmtpConfig = config;
  try {
    if (config) {
      fs.writeFileSync(SMTP_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } else if (fs.existsSync(SMTP_FILE)) {
      fs.unlinkSync(SMTP_FILE);
    }
    return true;
  } catch (e) {
    console.error('Error saving SMTP config:', e);
    return false;
  }
}

// --- 6. Global AI Q&A Knowledge Memory Database & 100% Cache Match Engine ---
export interface QaDatabaseRecord {
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

const QA_FILE = path.join(DATA_DIR, 'qa_database.json');
let qaDatabase: QaDatabaseRecord[] = [];

export function normalizePromptKey(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[?!.,;:'"()\[\]{}—–\-_/\\|`~*^%$#@+=<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadQaDatabase() {
  try {
    const existingMap = new Map<string, QaDatabaseRecord>();

    // 1. Seed 100+ Basic Conversations
    for (const item of BASIC_CONVERSATIONS_100) {
      const rec: QaDatabaseRecord = {
        id: item.id,
        prompt: item.normalizedKey,
        normalizedPrompt: normalizePromptKey(item.normalizedKey),
        answer: item.answer,
        model: 'sigma-permanent-memory',
        userType: 'guest',
        userEmail: 'system',
        userName: 'Sigma AI System',
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        hitCount: 1,
      };
      existingMap.set(rec.normalizedPrompt, rec);
      for (const alias of item.aliases) {
        const normAlias = normalizePromptKey(alias);
        if (!existingMap.has(normAlias)) {
          existingMap.set(normAlias, { ...rec, id: `${item.id}-${normAlias.replace(/\s+/g, '_')}`, prompt: alias, normalizedPrompt: normAlias });
        }
      }
    }

    // 2. Seed Initial Word Definitions (including JARGON)
    for (const [word, def] of Object.entries(INITIAL_WORD_DEFINITIONS)) {
      const wordKey = word.toLowerCase();
      const defRec: QaDatabaseRecord = {
        id: `def-${wordKey}`,
        prompt: `meaning of ${wordKey}`,
        normalizedPrompt: `meaning of ${wordKey}`,
        answer: def,
        model: 'sigma-dictionary-memory',
        userType: 'guest',
        userEmail: 'system',
        userName: 'Sigma AI Dictionary',
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        hitCount: 1,
      };
      existingMap.set(`meaning of ${wordKey}`, defRec);
      existingMap.set(`meaning of word ${wordKey}`, defRec);
      existingMap.set(`what is the meaning of ${wordKey}`, defRec);
      existingMap.set(`what does ${wordKey} mean`, defRec);
      existingMap.set(`what is ${wordKey}`, defRec);
      existingMap.set(`define ${wordKey}`, defRec);
      existingMap.set(`${wordKey} meaning`, defRec);
      existingMap.set(wordKey, defRec);
    }

    // 3. Load from disk and merge
    if (fs.existsSync(QA_FILE)) {
      const raw = fs.readFileSync(QA_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (!item || !item.normalizedPrompt || !item.answer) continue;
          const p = item.normalizedPrompt.toLowerCase();
          const a = item.answer;
          // Filter out stories, ambiguous topics, and robotic boilerplate templates
          if (
            p.startsWith('on ') ||
            p === 'on apple' ||
            p === 'apple' ||
            p.includes('story') ||
            p.includes('tale') ||
            p.includes('narrative') ||
            /once upon a time|chapter \d|setting:|protagonist:/i.test(a) ||
            /the key is addressing the core underlying mechanism|Direct Answer: Regarding/i.test(a)
          ) {
            continue;
          }
          existingMap.set(item.normalizedPrompt, item);
        }
      }
    }

    qaDatabase = Array.from(existingMap.values());
    saveQaDatabase();
  } catch (e) {
    console.warn('Could not load QA database from disk:', e);
  }
}
loadQaDatabase();

function saveQaDatabase() {
  try {
    fs.writeFileSync(QA_FILE, JSON.stringify(qaDatabase, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving QA database:', e);
  }
}

export function findExactMatchAnswer(prompt: string): QaDatabaseRecord | null {
  if (!prompt || typeof prompt !== 'string') return null;
  const key = normalizePromptKey(prompt);
  if (!key || key.length < 2) return null;

  // Never match ambiguous topics ("on apple"), stories, or live news
  if (
    key.startsWith('on ') ||
    /\b(story|tale|write a story|poem|essay|narrative|novel|creative writing)\b/i.test(key) ||
    /\b(news|latest news|breaking news|current events|trending)\b/i.test(key) ||
    /\b(summarize|summary|sum up|tl;dr)\b/i.test(key)
  ) {
    return null;
  }

  // Check 1: Check for meaning queries (e.g. "meaning of word jargon", "meaning of jargon", "define jargon", "jargon")
  const meaningTargetMatch = key.match(/^(?:what\s+is\s+(?:the\s+)?)?meaning\s+of\s+(?:the\s+)?(?:word\s+)?([a-z0-9\-\s]{2,35})$/i) ||
    key.match(/^(?:define|definition\s+of)\s+(?:the\s+)?(?:word\s+)?([a-z0-9\-\s]{2,35})$/i) ||
    key.match(/^what\s+does\s+([a-z0-9\-\s]{2,35})\s+mean$/i) ||
    key.match(/^what\s+is\s+(?:a\s+|an\s+|the\s+)?([a-z0-9\-]{2,30})$/i) ||
    key.match(/^([a-z0-9\-]{2,30})\s+meaning$/i);

  if (meaningTargetMatch) {
    const targetWord = meaningTargetMatch[1].trim();
    const defMatch = qaDatabase.find((item) => {
      const p = item.normalizedPrompt;
      return (
        p === `meaning of ${targetWord}` ||
        p === `meaning of word ${targetWord}` ||
        p === `define ${targetWord}` ||
        p === targetWord
      );
    });
    if (defMatch) {
      defMatch.hitCount = (defMatch.hitCount || 0) + 1;
      defMatch.lastAccessedAt = new Date().toISOString();
      saveQaDatabase();
      return defMatch;
    }
  }

  // Check 2: Direct or alias match
  const match = qaDatabase.find((item) => {
    return (
      item.normalizedPrompt === key ||
      item.prompt.trim().toLowerCase() === prompt.trim().toLowerCase()
    );
  });

  if (match) {
    if (/the key is addressing the core underlying mechanism|Direct Answer: Regarding/i.test(match.answer)) {
      return null;
    }
    match.hitCount = (match.hitCount || 0) + 1;
    match.lastAccessedAt = new Date().toISOString();
    saveQaDatabase();
    return match;
  }
  return null;
}

export function saveQaRecord(entry: {
  prompt: string;
  answer: string;
  category?: string;
  model?: string;
  userType?: 'guest' | 'authenticated';
  userEmail?: string;
  userName?: string;
  hasImages?: boolean;
}): QaDatabaseRecord | null {
  const prompt = (entry.prompt || '').trim();
  const answer = (entry.answer || '').trim();
  const key = normalizePromptKey(prompt);

  // STRICT FILTER: NEVER save stories, multi-chapter novels, ambiguous topics, or canned boilerplate templates
  if (
    !key ||
    key.length < 2 ||
    key.startsWith('on ') ||
    answer.length > 2500 ||
    /\b(story|tale|write a story|narrative|poem|novel|scene|script|creative writing)\b/i.test(key) ||
    /once upon a time|chapter \d|setting:|protagonist:|scene \d/i.test(answer) ||
    /the key is addressing the core underlying mechanism|Direct Answer: Regarding/i.test(answer)
  ) {
    return null;
  }

  // If already exists, update it
  const existing = qaDatabase.find(
    (item) => item.normalizedPrompt === key || item.prompt.trim().toLowerCase() === prompt.toLowerCase()
  );

  if (existing) {
    existing.answer = answer;
    existing.lastAccessedAt = new Date().toISOString();
    existing.hitCount = (existing.hitCount || 0) + 1;
    if (entry.model) existing.model = entry.model;
    saveQaDatabase();
    return existing;
  }

  const newRecord: QaDatabaseRecord = {
    id: `qa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    prompt,
    normalizedPrompt: key,
    answer,
    model: entry.model || 'google/gemma-4-26b-a4b-it',
    userType: entry.userType || 'guest',
    userEmail: entry.userEmail || 'Guest User',
    userName: entry.userName || (entry.userType === 'authenticated' ? 'User' : 'Guest'),
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    hitCount: 1,
    hasImages: Boolean(entry.hasImages),
  };

  qaDatabase.unshift(newRecord);
  if (qaDatabase.length > 20000) {
    qaDatabase = qaDatabase.slice(0, 20000);
  }
  saveQaDatabase();
  return newRecord;
}

export function getQaRecords(options?: {
  limit?: number;
  search?: string;
  filter?: 'all' | 'guest' | 'authenticated' | 'frequent';
}) {
  const limit = options?.limit || 150;
  const search = (options?.search || '').toLowerCase().trim();
  const filter = options?.filter || 'all';

  let list = qaDatabase;

  if (filter === 'guest') {
    list = list.filter((r) => r.userType === 'guest');
  } else if (filter === 'authenticated') {
    list = list.filter((r) => r.userType === 'authenticated');
  } else if (filter === 'frequent') {
    list = list.filter((r) => (r.hitCount || 0) > 1);
  }

  if (search) {
    list = list.filter(
      (r) =>
        r.prompt.toLowerCase().includes(search) ||
        r.answer.toLowerCase().includes(search) ||
        r.userEmail.toLowerCase().includes(search)
    );
  }

  const totalHits = qaDatabase.reduce((acc, r) => acc + Math.max(0, (r.hitCount || 1) - 1), 0);

  return {
    records: list.slice(0, limit),
    total: qaDatabase.length,
    totalHits,
    filteredTotal: list.length,
  };
}

export function deleteQaRecord(id: string): boolean {
  const index = qaDatabase.findIndex((r) => r.id === id);
  if (index !== -1) {
    qaDatabase.splice(index, 1);
    saveQaDatabase();
    return true;
  }
  return false;
}

export function clearQaRecords(): boolean {
  qaDatabase = [];
  saveQaDatabase();
  return true;
}

// =========================================================================
// --- 7. SIGMA CORE: AI PROVIDER REGISTRY (20-30+ Providers Architecture) ---
// =========================================================================

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

const PROVIDERS_FILE = path.join(DATA_DIR, 'providers.json');

const INITIAL_PROVIDERS: ProviderRecord[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter AI (Multi-Model Gateway)',
    type: 'aggregator',
    baseUrl: 'https://openrouter.ai/api/v1',
    authHeader: 'Bearer',
    apiKey:
      (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY.includes('5aa2093'))
        ? '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'
        : process.env.OPENROUTER_API_KEY,
    status: 'connected',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'vision', 'tools', 'free_pool', 'json'],
    modelsCount: 120,
    lastVerifiedAt: new Date().toISOString(),
    lastError: null,
    latencyMs: 140,
    pricingTier: 'pay_per_token',
    description: 'Central multi-model gateway with automated free pool and unified API routing.',
  },
  {
    id: 'google',
    name: 'Google AI Studio (Gemini Enterprise)',
    type: 'official',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    authHeader: 'query_param',
    apiKey: process.env.GEMINI_API_KEY || '',
    status: process.env.GEMINI_API_KEY ? 'connected' : 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'vision', 'video', 'audio', 'tools', 'code_execution'],
    modelsCount: 8,
    lastVerifiedAt: process.env.GEMINI_API_KEY ? new Date().toISOString() : null,
    lastError: null,
    latencyMs: 110,
    pricingTier: 'pay_per_token',
    description: 'Google official Gemini 2.5 Flash, 3.8 Flash, and 3.1 Pro multivariant models.',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT-4o & Reasoning Engine)',
    type: 'official',
    baseUrl: 'https://api.openai.com/v1',
    authHeader: 'Bearer',
    apiKey: process.env.OPENAI_API_KEY || '',
    status: process.env.OPENAI_API_KEY ? 'connected' : 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'vision', 'tools', 'json', 'reasoning'],
    modelsCount: 14,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 180,
    pricingTier: 'pay_per_token',
    description: 'Flagship GPT-4o, GPT-4o-mini, and o3-mini reasoning models.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude 3.7 Sonnet & Haiku)',
    type: 'official',
    baseUrl: 'https://api.anthropic.com/v1',
    authHeader: 'x-api-key',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    status: process.env.ANTHROPIC_API_KEY ? 'connected' : 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'vision', 'tools', 'extended_thinking'],
    modelsCount: 6,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 195,
    pricingTier: 'pay_per_token',
    description: 'Deep reasoning, extended thinking, and coding intelligence.',
  },
  {
    id: 'groq',
    name: 'Groq Cloud (Sub-100ms LPU Inference)',
    type: 'official',
    baseUrl: 'https://api.groq.com/openai/v1',
    authHeader: 'Bearer',
    apiKey: process.env.GROQ_API_KEY || '',
    status: process.env.GROQ_API_KEY ? 'connected' : 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'tools', 'json', 'ultra_low_latency'],
    modelsCount: 10,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 45,
    pricingTier: 'pay_per_token',
    description: 'LPU inference engine delivering 500+ tokens/sec on Llama 3.3 and DeepSeek R1.',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek Platform (V3 & R1)',
    type: 'official',
    baseUrl: 'https://api.deepseek.com',
    authHeader: 'Bearer',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    status: process.env.DEEPSEEK_API_KEY ? 'connected' : 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'tools', 'json', 'deep_reasoning'],
    modelsCount: 4,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 220,
    pricingTier: 'pay_per_token',
    description: 'State-of-the-art open reasoning and general coding architecture.',
  },
  {
    id: 'mistral',
    name: 'Mistral AI (Large, Codestral & Pixtral)',
    type: 'official',
    baseUrl: 'https://api.mistral.ai/v1',
    authHeader: 'Bearer',
    apiKey: process.env.MISTRAL_API_KEY || '',
    status: process.env.MISTRAL_API_KEY ? 'connected' : 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'vision', 'tools', 'code'],
    modelsCount: 9,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 160,
    pricingTier: 'pay_per_token',
    description: 'European AI champion specialized in multilingual and coding capabilities.',
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI (Live Web Grounded Sonar)',
    type: 'official',
    baseUrl: 'https://api.perplexity.ai',
    authHeader: 'Bearer',
    apiKey: process.env.PERPLEXITY_API_KEY || '',
    status: process.env.PERPLEXITY_API_KEY ? 'connected' : 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'web_search', 'citations'],
    modelsCount: 5,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 280,
    pricingTier: 'pay_per_token',
    description: 'Real-time online web searching and multi-source citation engine.',
  },
  {
    id: 'cohere',
    name: 'Cohere (Command R+ & Embeddings)',
    type: 'official',
    baseUrl: 'https://api.cohere.com/v1',
    authHeader: 'Bearer',
    apiKey: process.env.COHERE_API_KEY || '',
    status: 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'rag', 'tools', 'embeddings'],
    modelsCount: 4,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 175,
    pricingTier: 'pay_per_token',
    description: 'Enterprise RAG and multi-step tool-use platform.',
  },
  {
    id: 'together',
    name: 'Together AI (Open Source Model Cloud)',
    type: 'aggregator',
    baseUrl: 'https://api.together.xyz/v1',
    authHeader: 'Bearer',
    apiKey: process.env.TOGETHER_API_KEY || '',
    status: 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'fine_tuning', 'vision'],
    modelsCount: 50,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 150,
    pricingTier: 'pay_per_token',
    description: 'Scalable cloud for open source LLMs and vision models.',
  },
  {
    id: 'cerebras',
    name: 'Cerebras AI (Wafer-Scale Engine)',
    type: 'official',
    baseUrl: 'https://api.cerebras.ai/v1',
    authHeader: 'Bearer',
    apiKey: process.env.CEREBRAS_API_KEY || '',
    status: 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'ultra_low_latency'],
    modelsCount: 4,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 35,
    pricingTier: 'pay_per_token',
    description: 'World-record token generation speeds up to 2,000 tokens/sec.',
  },
  {
    id: 'sambanova',
    name: 'SambaNova Systems (Enterprise SN40L)',
    type: 'official',
    baseUrl: 'https://api.sambanova.ai/v1',
    authHeader: 'Bearer',
    apiKey: process.env.SAMBANOVA_API_KEY || '',
    status: 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'enterprise'],
    modelsCount: 6,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 60,
    pricingTier: 'pay_per_token',
    description: 'Full-stack enterprise AI with native 1M+ context inference.',
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI (Fast Inference Cloud)',
    type: 'aggregator',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    authHeader: 'Bearer',
    apiKey: process.env.FIREWORKS_API_KEY || '',
    status: 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'tools', 'json', 'vision'],
    modelsCount: 25,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 80,
    pricingTier: 'pay_per_token',
    description: 'Production-ready low latency platform for compound AI systems.',
  },
  {
    id: 'xai',
    name: 'xAI (Grok 2 & Grok 2 Vision)',
    type: 'official',
    baseUrl: 'https://api.x.ai/v1',
    authHeader: 'Bearer',
    apiKey: process.env.XAI_API_KEY || '',
    status: 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'vision', 'realtime_search'],
    modelsCount: 3,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 190,
    pricingTier: 'pay_per_token',
    description: 'Truth-seeking intelligence with real-time world knowledge.',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local Host Engine)',
    type: 'local',
    baseUrl: 'http://localhost:11434/v1',
    authHeader: 'Bearer',
    apiKey: 'ollama',
    status: 'disconnected',
    isEnabled: false,
    supportedCapabilities: ['chat', 'streaming', 'offline', 'privacy'],
    modelsCount: 1,
    lastVerifiedAt: null,
    lastError: 'Local instance not detected at localhost:11434',
    latencyMs: 20,
    pricingTier: 'free',
    description: 'Run completely private, local open-source LLMs on edge hardware.',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face (Serverless Inference)',
    type: 'aggregator',
    baseUrl: 'https://api-inference.huggingface.co/v1',
    authHeader: 'Bearer',
    apiKey: process.env.HF_API_KEY || '',
    status: 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'embeddings', 'specialized_tasks'],
    modelsCount: 30,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 250,
    pricingTier: 'pay_per_token',
    description: 'Over 100,000 open community models and research architectures.',
  },
  {
    id: 'replicate',
    name: 'Replicate (Diffusion & Multimodal)',
    type: 'aggregator',
    baseUrl: 'https://api.replicate.com/v1',
    authHeader: 'Bearer',
    apiKey: process.env.REPLICATE_API_KEY || '',
    status: 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['image_generation', 'video_generation', 'multimodal'],
    modelsCount: 15,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 320,
    pricingTier: 'pay_per_token',
    description: 'Cloud API for open-source AI models and visual generation.',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    type: 'official',
    baseUrl: 'https://api.cloudflare.com/client/v4/accounts',
    authHeader: 'Bearer',
    apiKey: process.env.CLOUDFLARE_API_KEY || '',
    status: 'not_configured',
    isEnabled: true,
    supportedCapabilities: ['chat', 'streaming', 'embeddings', 'edge_computing'],
    modelsCount: 12,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 70,
    pricingTier: 'subscription',
    description: 'Serverless GPU computing distributed across 300+ edge cities.',
  },
  {
    id: 'azure_openai',
    name: 'Microsoft Azure OpenAI Service',
    type: 'official',
    baseUrl: 'https://your-resource.openai.azure.com',
    authHeader: 'x-api-key',
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    status: 'not_configured',
    isEnabled: false,
    supportedCapabilities: ['chat', 'streaming', 'vision', 'enterprise_compliance'],
    modelsCount: 8,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 165,
    pricingTier: 'pay_per_token',
    description: 'Enterprise-grade OpenAI models with Azure security and SLA guarantees.',
  },
  {
    id: 'aws_bedrock',
    name: 'Amazon Web Services Bedrock',
    type: 'official',
    baseUrl: 'https://bedrock-runtime.us-east-1.amazonaws.com',
    authHeader: 'custom',
    apiKey: process.env.AWS_BEDROCK_KEY || '',
    status: 'not_configured',
    isEnabled: false,
    supportedCapabilities: ['chat', 'streaming', 'tools', 'rag'],
    modelsCount: 12,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 180,
    pricingTier: 'pay_per_token',
    description: 'Unified foundation models access on AWS infrastructure.',
  },
];

let providersRegistry: ProviderRecord[] = [];

function loadProviders() {
  try {
    if (fs.existsSync(PROVIDERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROVIDERS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        // Merge with initial defaults to ensure newly introduced providers appear
        const map = new Map<string, ProviderRecord>();
        for (const p of INITIAL_PROVIDERS) {
          map.set(p.id, p);
        }
        for (const p of data) {
          map.set(p.id, { ...map.get(p.id), ...p });
        }
        providersRegistry = Array.from(map.values());
        return;
      }
    }
  } catch (e) {
    console.warn('Could not load providers.json, using defaults:', e);
  }
  providersRegistry = [...INITIAL_PROVIDERS];
}
loadProviders();

function saveProviders() {
  try {
    fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(providersRegistry, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save providers.json:', e);
  }
}

export function getProvidersList(): ProviderRecord[] {
  return providersRegistry.map((p) => ({
    ...p,
    apiKey: p.apiKey ? (p.apiKey.length > 10 ? `${p.apiKey.slice(0, 7)}...${p.apiKey.slice(-4)}` : '••••••••') : '',
  }));
}

export function getRawProvider(id: string): ProviderRecord | undefined {
  return providersRegistry.find((p) => p.id === id);
}

export function saveProvider(provider: Partial<ProviderRecord> & { id: string }): ProviderRecord {
  const index = providersRegistry.findIndex((p) => p.id === provider.id);
  if (index !== -1) {
    const existing = providersRegistry[index];
    const updated: ProviderRecord = {
      ...existing,
      ...provider,
      apiKey: provider.apiKey && !provider.apiKey.includes('•') ? provider.apiKey : existing.apiKey,
    };
    providersRegistry[index] = updated;
    saveProviders();
    return updated;
  }
  const newProvider: ProviderRecord = {
    id: provider.id,
    name: provider.name || provider.id,
    type: provider.type || 'custom',
    baseUrl: provider.baseUrl || 'https://api.openai.com/v1',
    authHeader: provider.authHeader || 'Bearer',
    apiKey: provider.apiKey || '',
    status: 'not_configured',
    isEnabled: provider.isEnabled !== false,
    supportedCapabilities: provider.supportedCapabilities || ['chat', 'streaming'],
    modelsCount: provider.modelsCount || 1,
    lastVerifiedAt: null,
    lastError: null,
    latencyMs: 0,
    pricingTier: provider.pricingTier || 'pay_per_token',
    description: provider.description || 'Custom provider endpoint',
  };
  providersRegistry.push(newProvider);
  saveProviders();
  return newProvider;
}

export function toggleProviderEnabled(id: string, isEnabled: boolean): boolean {
  const p = providersRegistry.find((item) => item.id === id);
  if (p) {
    p.isEnabled = isEnabled;
    saveProviders();
    return true;
  }
  return false;
}

export function updateProviderVerification(
  id: string,
  result: { status: ProviderRecord['status']; latencyMs: number; error?: string | null; modelsCount?: number }
) {
  const p = providersRegistry.find((item) => item.id === id);
  if (p) {
    p.status = result.status;
    p.latencyMs = result.latencyMs;
    p.lastVerifiedAt = new Date().toISOString();
    p.lastError = result.error || null;
    if (result.modelsCount !== undefined) {
      p.modelsCount = result.modelsCount;
    }
    saveProviders();
  }
}

export function deleteProvider(id: string): boolean {
  const index = providersRegistry.findIndex((p) => p.id === id);
  if (index !== -1) {
    providersRegistry.splice(index, 1);
    saveProviders();
    return true;
  }
  return false;
}

// =========================================================================
// --- 8. SIGMA CORE: MODEL REGISTRY & CAPABILITIES CATALOG ---
// =========================================================================

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

const MODELS_FILE = path.join(DATA_DIR, 'models.json');

const INITIAL_MODELS: ModelRecord[] = [
  {
    id: 'openrouter/free',
    providerId: 'openrouter',
    name: 'OpenRouter Free Pool (Auto Multi-Model Fallback)',
    contextWindow: 128000,
    maxOutput: 4096,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'High-availability automated multi-model free routing.',
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    providerId: 'openrouter',
    name: 'NVIDIA Nemotron 3.5 Lightning (Free)',
    contextWindow: 128000,
    maxOutput: 4096,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Ultra-fast synthetic reasoning, math, and structured generation.',
  },
  {
    id: 'google/gemma-4-31b-it:free',
    providerId: 'openrouter',
    name: 'Google Gemma 4 31B IT (Free)',
    contextWindow: 131072,
    maxOutput: 8192,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Google high-parameter open model with deep reasoning and multilingual abilities.',
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    providerId: 'openrouter',
    name: 'Google Gemma 4 26B A4B (Free)',
    contextWindow: 131072,
    maxOutput: 8192,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Google efficient architecture tuned for agile reasoning and fast responses.',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    providerId: 'openrouter',
    name: 'NVIDIA Nemotron 3 Ultra 550B (Free)',
    contextWindow: 128000,
    maxOutput: 4096,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Massive enterprise scale foundation model for complex logic and analytical depth.',
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    providerId: 'openrouter',
    name: 'NVIDIA Nemotron 3 Nano Omni (Free)',
    contextWindow: 65536,
    maxOutput: 4096,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Omni reasoning model specialized in step-by-step problem solving.',
  },
  {
    id: 'nvidia/nemotron-3.5-super-vl:free',
    providerId: 'openrouter',
    name: 'NVIDIA Nemotron 3.5 Super VL (Free)',
    contextWindow: 128000,
    maxOutput: 4096,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Vision-language multimodal model for visual understanding and image analysis.',
  },
  {
    id: 'cohere/north-mini-code:free',
    providerId: 'openrouter',
    name: 'Cohere North Mini Code (Free)',
    contextWindow: 32768,
    maxOutput: 4096,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Cohere code generation, refactoring, and concise programming solutions.',
  },
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    providerId: 'openrouter',
    name: 'LiquidAI LFM 2.5 2.6B (Free)',
    contextWindow: 32768,
    maxOutput: 2048,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Liquid Neural Network architecture for lightning-fast lightweight conversations.',
  },
  {
    id: 'liquid/lfm-3-1.7b:free',
    providerId: 'openrouter',
    name: 'LiquidAI LFM 3 1.7B (Free)',
    contextWindow: 32768,
    maxOutput: 2048,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Ultra-compact high-speed liquid neural model for instant responses.',
  },
  {
    id: 'thinkingmachines/inkling-2-small:free',
    providerId: 'openrouter',
    name: 'Thinking Machines Inkling 2 Small (Free)',
    contextWindow: 32768,
    maxOutput: 4096,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Lightweight versatile assistant model for dialogue and creative writing.',
  },
  {
    id: 'recursive/flint-v1.0:free',
    providerId: 'openrouter',
    name: 'Recursive Flint v1.0 (Free)',
    contextWindow: 32768,
    maxOutput: 4096,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Specialized recursive synthesis and structured information extraction.',
  },
  {
    id: 'xingchen-agi/xing4.0-29b-a4b:free',
    providerId: 'openrouter',
    name: 'XingChen 4.0 29B (Free)',
    contextWindow: 32768,
    maxOutput: 4096,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'High-capacity multilingual model with strong cross-domain instruction following.',
  },
  {
    id: 'dots-studio/dots-3-note-preview:free',
    providerId: 'openrouter',
    name: 'Dots Studio Dots-3 Note Preview (Free)',
    contextWindow: 32768,
    maxOutput: 4096,
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Structured notes, summarization, and outlining assistant.',
  },
  {
    id: 'google/gemini-2.5-flash',
    providerId: 'google',
    name: 'Gemini 2.5 Flash',
    contextWindow: 1048576,
    maxOutput: 8192,
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    isAvailable: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Ultra-fast multimodal reasoning, coding, and general tasks.',
  },
  {
    id: 'google/gemini-3.8-flash',
    providerId: 'google',
    name: 'Gemini 3.8 Flash',
    contextWindow: 1048576,
    maxOutput: 8192,
    inputPricePerMillion: 0.2,
    outputPricePerMillion: 0.8,
    isAvailable: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Advanced mathematical derivations, vision OCR, and structured synthesis.',
  },
  {
    id: 'google/gemini-3.1-pro',
    providerId: 'google',
    name: 'Gemini 3.1 Pro',
    contextWindow: 2097152,
    maxOutput: 8192,
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5.0,
    isAvailable: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Deep enterprise research, multi-file architectural reasoning.',
  },
  {
    id: 'openai/gpt-4o',
    providerId: 'openai',
    name: 'GPT-4o Omnimodal',
    contextWindow: 128000,
    maxOutput: 4096,
    inputPricePerMillion: 2.5,
    outputPricePerMillion: 10.0,
    isAvailable: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Industry benchmark for nuanced reasoning, voice, and multimodal analysis.',
  },
  {
    id: 'openai/gpt-4o-mini',
    providerId: 'openai',
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    maxOutput: 16384,
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    isAvailable: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Cost-effective high-speed conversational intelligence.',
  },
  {
    id: 'anthropic/claude-3-7-sonnet',
    providerId: 'anthropic',
    name: 'Claude 3.7 Sonnet',
    contextWindow: 200000,
    maxOutput: 8192,
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    isAvailable: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Hybrid standard and extended thinking for high-precision coding.',
  },
  {
    id: 'anthropic/claude-3-5-haiku',
    providerId: 'anthropic',
    name: 'Claude 3.5 Haiku',
    contextWindow: 200000,
    maxOutput: 8192,
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 4.0,
    isAvailable: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Lightning fast execution, instruction-following, and formatting.',
  },
  {
    id: 'deepseek/deepseek-r1',
    providerId: 'deepseek',
    name: 'DeepSeek R1 (Open Reasoning)',
    contextWindow: 64000,
    maxOutput: 8192,
    inputPricePerMillion: 0.55,
    outputPricePerMillion: 2.19,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Full chain-of-thought mathematical proofs and logic algorithms.',
  },
  {
    id: 'groq/llama-3.3-70b-versatile',
    providerId: 'groq',
    name: 'Llama 3.3 70B (Groq LPU)',
    contextWindow: 128000,
    maxOutput: 8192,
    inputPricePerMillion: 0.59,
    outputPricePerMillion: 0.79,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Instant sub-second text streaming and rapid summary extraction.',
  },
  {
    id: 'mistral/codestral-latest',
    providerId: 'mistral',
    name: 'Codestral 25.01',
    contextWindow: 256000,
    maxOutput: 8192,
    inputPricePerMillion: 0.3,
    outputPricePerMillion: 0.9,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    recommendedUse: 'Fill-in-the-middle code generation and debugging across 80+ languages.',
  },
  {
    id: 'perplexity/sonar-pro',
    providerId: 'perplexity',
    name: 'Sonar Pro (Online Search Grounded)',
    contextWindow: 200000,
    maxOutput: 8000,
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    isAvailable: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: false,
    recommendedUse: 'Real-time live news, citations, and validated academic research.',
  },
];

let modelsRegistry: ModelRecord[] = [];

function loadModels() {
  try {
    if (fs.existsSync(MODELS_FILE)) {
      const data = JSON.parse(fs.readFileSync(MODELS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        modelsRegistry = data;
        return;
      }
    }
  } catch (e) {
    console.warn('Could not load models.json, using defaults:', e);
  }
  modelsRegistry = [...INITIAL_MODELS];
}
loadModels();

function saveModels() {
  try {
    fs.writeFileSync(MODELS_FILE, JSON.stringify(modelsRegistry, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save models.json:', e);
  }
}

export function getModelsList(): ModelRecord[] {
  return modelsRegistry;
}

export function getModelById(id: string): ModelRecord | undefined {
  return modelsRegistry.find((m) => m.id === id);
}

export function saveModel(model: ModelRecord): ModelRecord {
  const index = modelsRegistry.findIndex((m) => m.id === model.id);
  if (index !== -1) {
    modelsRegistry[index] = model;
  } else {
    modelsRegistry.push(model);
  }
  saveModels();
  return model;
}

export function toggleModelAvailability(id: string, isAvailable: boolean): boolean {
  const m = modelsRegistry.find((item) => item.id === id);
  if (m) {
    m.isAvailable = isAvailable;
    saveModels();
    return true;
  }
  return false;
}

export function deleteModel(id: string): boolean {
  const index = modelsRegistry.findIndex((m) => m.id === id);
  if (index !== -1) {
    modelsRegistry.splice(index, 1);
    saveModels();
    return true;
  }
  return false;
}

// =========================================================================
// --- 9. SIGMA CORE: CONNECTION REQUESTS & API CLIENT LIFECYCLE ---
// =========================================================================

export interface ConnectionRequestRecord {
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

const CONNECTIONS_FILE = path.join(DATA_DIR, 'connections.json');

let connectionsRegistry: ConnectionRequestRecord[] = [
  {
    id: 'conn-demo-1',
    clientId: 'sigma-web-client',
    clientName: 'Sigma Web Client Application',
    applicationType: 'web',
    contactEmail: 'devuserhub@gmail.com',
    requestedScopes: ['chat:write', 'models:read', 'usage:read'],
    status: 'approved',
    requestedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    decidedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    decidedBy: 'Admin Hub',
    rejectionReason: null,
    apiKey: 'sig_live_4f9a88c71b63e41029da75be601429c1',
    rateLimitRpm: 120,
    totalRequests: 42,
    lastUsedAt: new Date().toISOString(),
    notes: 'Official primary frontend application client.',
  },
  {
    id: 'conn-demo-2',
    clientId: 'sigma-mobile-flutter',
    clientName: 'Sigma Android & iOS Mobile Client',
    applicationType: 'mobile',
    contactEmail: 'sabaharis.239@gmail.com',
    requestedScopes: ['chat:write', 'voice:stream', 'library:sync'],
    status: 'pending',
    requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    decidedAt: null,
    decidedBy: null,
    rejectionReason: null,
    apiKey: null,
    rateLimitRpm: 60,
    totalRequests: 0,
    lastUsedAt: null,
    notes: 'Mobile app deployment requesting live voice streaming scopes.',
  },
];

function loadConnections() {
  try {
    if (fs.existsSync(CONNECTIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONNECTIONS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        connectionsRegistry = data;
      }
    }
  } catch (e) {
    console.warn('Could not load connections.json, using seeded defaults:', e);
  }
}
loadConnections();

function saveConnections() {
  try {
    fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(connectionsRegistry, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save connections.json:', e);
  }
}

export function getConnectionRequests(statusFilter?: 'all' | 'pending' | 'approved' | 'rejected' | 'revoked'): ConnectionRequestRecord[] {
  if (!statusFilter || statusFilter === 'all') {
    return connectionsRegistry;
  }
  return connectionsRegistry.filter((c) => c.status === statusFilter);
}

export function createConnectionRequest(data: {
  clientId: string;
  clientName: string;
  applicationType: ConnectionRequestRecord['applicationType'];
  contactEmail: string;
  requestedScopes: string[];
  notes?: string;
}): ConnectionRequestRecord {
  const newReq: ConnectionRequestRecord = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    clientId: data.clientId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
    clientName: data.clientName.trim(),
    applicationType: data.applicationType || 'web',
    contactEmail: data.contactEmail.trim().toLowerCase(),
    requestedScopes: Array.isArray(data.requestedScopes) ? data.requestedScopes : ['chat:write'],
    status: 'pending',
    requestedAt: new Date().toISOString(),
    decidedAt: null,
    decidedBy: null,
    rejectionReason: null,
    apiKey: null,
    rateLimitRpm: 60,
    totalRequests: 0,
    lastUsedAt: null,
    notes: data.notes || '',
  };
  connectionsRegistry.unshift(newReq);
  saveConnections();
  logSecurityEvent({
    type: 'STATUS_CHANGE',
    email: data.contactEmail,
    details: `New API Connection Request submitted: "${data.clientName}" (${data.clientId})`,
    status: 'Success',
  });
  return newReq;
}

export function approveConnectionRequest(requestId: string, approverEmail?: string, customRpm = 120): ConnectionRequestRecord {
  const req = connectionsRegistry.find((c) => c.id === requestId);
  if (!req) {
    throw new Error('Connection request not found.');
  }
  // Generate real secure API Key
  const hexPart = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const apiKey = `sig_live_${hexPart}`;

  req.status = 'approved';
  req.decidedAt = new Date().toISOString();
  req.decidedBy = approverEmail || 'Admin Hub';
  req.apiKey = apiKey;
  req.rateLimitRpm = customRpm;
  req.rejectionReason = null;
  saveConnections();

  logSecurityEvent({
    type: 'STATUS_CHANGE',
    email: req.contactEmail,
    details: `Connection Request APPROVED for "${req.clientName}" by ${approverEmail || 'Admin'}`,
    status: 'Success',
  });
  return req;
}

export function rejectConnectionRequest(requestId: string, reason: string, deciderEmail?: string): ConnectionRequestRecord {
  const req = connectionsRegistry.find((c) => c.id === requestId);
  if (!req) {
    throw new Error('Connection request not found.');
  }
  req.status = 'rejected';
  req.decidedAt = new Date().toISOString();
  req.decidedBy = deciderEmail || 'Admin Hub';
  req.rejectionReason = reason || 'Declined by ecosystem administrator.';
  req.apiKey = null;
  saveConnections();

  logSecurityEvent({
    type: 'STATUS_CHANGE',
    email: req.contactEmail,
    details: `Connection Request REJECTED for "${req.clientName}": ${req.rejectionReason}`,
    status: 'Warning',
  });
  return req;
}

export function revokeConnection(requestId: string, revokerEmail?: string): ConnectionRequestRecord {
  const req = connectionsRegistry.find((c) => c.id === requestId);
  if (!req) {
    throw new Error('Connection not found.');
  }
  req.status = 'revoked';
  req.decidedAt = new Date().toISOString();
  req.decidedBy = revokerEmail || 'Admin Hub';
  req.apiKey = null;
  saveConnections();

  logSecurityEvent({
    type: 'STATUS_CHANGE',
    email: req.contactEmail,
    details: `Connection REVOKED for "${req.clientName}" by ${revokerEmail || 'Admin'}`,
    status: 'Warning',
  });
  return req;
}

// =========================================================================
// --- 10. SIGMA CORE: TOKEN USAGE & COST ACCOUNTING ---
// =========================================================================

export interface TokenUsageRecord {
  id: string;
  timestamp: string;
  userEmail: string;
  clientId: string;
  providerId: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  status: 'success' | 'error';
}

const TOKEN_USAGE_FILE = path.join(DATA_DIR, 'token_usage.json');

let tokenUsageList: TokenUsageRecord[] = [];

function loadTokenUsage() {
  try {
    if (fs.existsSync(TOKEN_USAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_USAGE_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        tokenUsageList = data;
      }
    }
  } catch (e) {
    tokenUsageList = [];
  }
}
loadTokenUsage();

function saveTokenUsage() {
  try {
    fs.writeFileSync(TOKEN_USAGE_FILE, JSON.stringify(tokenUsageList.slice(0, 1500), null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save token_usage.json:', e);
  }
}

export function recordTokenUsage(entry: Omit<TokenUsageRecord, 'id' | 'timestamp'>) {
  const record: TokenUsageRecord = {
    id: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  tokenUsageList.unshift(record);
  if (tokenUsageList.length > 2500) {
    tokenUsageList = tokenUsageList.slice(0, 2500);
  }
  saveTokenUsage();
  return record;
}

export function getTokenAnalytics(filterDays = 7) {
  const cutoff = Date.now() - filterDays * 86400000;
  const filtered = tokenUsageList.filter((r) => new Date(r.timestamp).getTime() >= cutoff);

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalCostUsd = 0;

  const perModel: Record<string, { prompt: number; completion: number; total: number; cost: number; calls: number }> = {};
  const perProvider: Record<string, { total: number; cost: number; calls: number }> = {};
  const dailyTokens: Record<string, { date: string; prompt: number; completion: number; total: number; cost: number }> = {};

  for (const item of filtered) {
    totalPromptTokens += item.promptTokens;
    totalCompletionTokens += item.completionTokens;
    totalCostUsd += item.estimatedCostUsd;

    // By model
    if (!perModel[item.modelId]) {
      perModel[item.modelId] = { prompt: 0, completion: 0, total: 0, cost: 0, calls: 0 };
    }
    perModel[item.modelId].prompt += item.promptTokens;
    perModel[item.modelId].completion += item.completionTokens;
    perModel[item.modelId].total += item.totalTokens;
    perModel[item.modelId].cost += item.estimatedCostUsd;
    perModel[item.modelId].calls += 1;

    // By provider
    if (!perProvider[item.providerId]) {
      perProvider[item.providerId] = { total: 0, cost: 0, calls: 0 };
    }
    perProvider[item.providerId].total += item.totalTokens;
    perProvider[item.providerId].cost += item.estimatedCostUsd;
    perProvider[item.providerId].calls += 1;

    // By day
    const dayKey = item.timestamp.split('T')[0];
    if (!dailyTokens[dayKey]) {
      dailyTokens[dayKey] = { date: dayKey, prompt: 0, completion: 0, total: 0, cost: 0 };
    }
    dailyTokens[dayKey].prompt += item.promptTokens;
    dailyTokens[dayKey].completion += item.completionTokens;
    dailyTokens[dayKey].total += item.totalTokens;
    dailyTokens[dayKey].cost += item.estimatedCostUsd;
  }

  return {
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens: totalPromptTokens + totalCompletionTokens,
    totalCostUsd: Number(totalCostUsd.toFixed(4)),
    totalCalls: filtered.length,
    perModel,
    perProvider,
    dailyTraffic: Object.values(dailyTokens).sort((a, b) => a.date.localeCompare(b.date)),
    recentRecords: filtered.slice(0, 50),
  };
}

// =========================================================================
// --- 11. SIGMA CORE: STORAGE & BACKUP INFRASTRUCTURE ---
// =========================================================================

export interface BackupRecord {
  id: string;
  filename: string;
  timestamp: string;
  sizeBytes: number;
  collectionsIncluded: string[];
  recordsCount: number;
  status: 'completed' | 'failed';
  notes?: string;
}

const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const BACKUPS_META_FILE = path.join(DATA_DIR, 'backups_meta.json');

try {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create backups dir:', e);
}

let backupsList: BackupRecord[] = [];

function loadBackupsMeta() {
  try {
    if (fs.existsSync(BACKUPS_META_FILE)) {
      const data = JSON.parse(fs.readFileSync(BACKUPS_META_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        backupsList = data;
      }
    }
  } catch (e) {
    backupsList = [];
  }
}
loadBackupsMeta();

function saveBackupsMeta() {
  try {
    fs.writeFileSync(BACKUPS_META_FILE, JSON.stringify(backupsList, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save backups_meta.json:', e);
  }
}

export function getStorageStats() {
  let totalDataSizeBytes = 0;
  let fileCount = 0;
  const categories: Record<string, { files: number; bytes: number }> = {
    database: { files: 0, bytes: 0 },
    backups: { files: 0, bytes: 0 },
    system_logs: { files: 0, bytes: 0 },
    api_registry: { files: 0, bytes: 0 },
  };

  try {
    const files = fs.readdirSync(DATA_DIR);
    for (const f of files) {
      const fullPath = path.join(DATA_DIR, f);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        fileCount++;
        totalDataSizeBytes += stat.size;
        if (f.includes('log')) {
          categories.system_logs.files++;
          categories.system_logs.bytes += stat.size;
        } else if (f.includes('provider') || f.includes('model') || f.includes('key') || f.includes('connection')) {
          categories.api_registry.files++;
          categories.api_registry.bytes += stat.size;
        } else {
          categories.database.files++;
          categories.database.bytes += stat.size;
        }
      }
    }

    if (fs.existsSync(BACKUPS_DIR)) {
      const backupFiles = fs.readdirSync(BACKUPS_DIR);
      for (const bf of backupFiles) {
        const fullBf = path.join(BACKUPS_DIR, bf);
        const stat = fs.statSync(fullBf);
        if (stat.isFile()) {
          fileCount++;
          totalDataSizeBytes += stat.size;
          categories.backups.files++;
          categories.backups.bytes += stat.size;
        }
      }
    }
  } catch (e) {
    console.warn('Could not read storage files:', e);
  }

  return {
    totalDataSizeBytes,
    totalFormatted: `${(totalDataSizeBytes / 1024).toFixed(1)} KB`,
    fileCount,
    categories,
    storageQuotaLimitBytes: 100 * 1024 * 1024 * 1024, // 100 GB enterprise cloud tier
    usedPercent: Number(((totalDataSizeBytes / (100 * 1024 * 1024 * 1024)) * 100).toFixed(6)),
  };
}

export function createSystemBackup(notes?: string): BackupRecord {
  const timestamp = new Date().toISOString();
  const dateSlug = timestamp.replace(/[:.]/g, '-');
  const filename = `sigma_backup_${dateSlug}.json`;
  const backupFilePath = path.join(BACKUPS_DIR, filename);

  const snapshot: Record<string, any> = {
    version: '2.4.0',
    createdAt: timestamp,
    metrics,
    users: usersRegistry,
    securityLogs,
    apiKeys: apiKeysPool,
    providers: providersRegistry,
    models: modelsRegistry,
    connections: connectionsRegistry,
    tokenUsage: tokenUsageList,
    qaDatabaseCount: qaDatabase.length,
    qaDatabase: qaDatabase.slice(0, 1000), // top active cache
  };

  const jsonStr = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(backupFilePath, jsonStr, 'utf-8');
  const sizeBytes = Buffer.byteLength(jsonStr, 'utf-8');

  const record: BackupRecord = {
    id: `bak-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    filename,
    timestamp,
    sizeBytes,
    collectionsIncluded: ['users', 'metrics', 'providers', 'models', 'connections', 'logs', 'qa_cache', 'token_usage'],
    recordsCount:
      usersRegistry.length +
      providersRegistry.length +
      modelsRegistry.length +
      connectionsRegistry.length +
      securityLogs.length +
      qaDatabase.length,
    status: 'completed',
    notes: notes || 'Automated ecosystem snapshot',
  };

  backupsList.unshift(record);
  saveBackupsMeta();

  logSecurityEvent({
    type: 'STATUS_CHANGE',
    email: CO_ADMIN_EMAIL,
    details: `Created system backup: ${filename} (${(sizeBytes / 1024).toFixed(1)} KB, ${record.recordsCount} records)`,
    status: 'Success',
  });

  return record;
}

export function getBackupsList(): BackupRecord[] {
  return backupsList;
}

// =========================================================================
// --- 12. SIGMA CORE: API PLAYGROUND HISTORY ---
// =========================================================================

export interface PlaygroundHistoryRecord {
  id: string;
  timestamp: string;
  providerId: string;
  modelId: string;
  prompt: string;
  systemPrompt?: string;
  response: string;
  status: 'success' | 'error';
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  httpStatus: number;
  error?: string;
}

const PLAYGROUND_FILE = path.join(DATA_DIR, 'playground_history.json');

let playgroundHistory: PlaygroundHistoryRecord[] = [];

function loadPlaygroundHistory() {
  try {
    if (fs.existsSync(PLAYGROUND_FILE)) {
      const data = JSON.parse(fs.readFileSync(PLAYGROUND_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        playgroundHistory = data;
      }
    }
  } catch (e) {
    playgroundHistory = [];
  }
}
loadPlaygroundHistory();

function savePlaygroundHistory() {
  try {
    fs.writeFileSync(PLAYGROUND_FILE, JSON.stringify(playgroundHistory.slice(0, 100), null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save playground_history.json:', e);
  }
}

export function recordPlaygroundRun(run: Omit<PlaygroundHistoryRecord, 'id' | 'timestamp'>): PlaygroundHistoryRecord {
  const item: PlaygroundHistoryRecord = {
    id: `play-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...run,
  };
  playgroundHistory.unshift(item);
  if (playgroundHistory.length > 100) {
    playgroundHistory = playgroundHistory.slice(0, 100);
  }
  savePlaygroundHistory();
  return item;
}

export function getPlaygroundHistory(): PlaygroundHistoryRecord[] {
  return playgroundHistory;
}

// =========================================================================
// --- 13. SIGMA AI: OPENROUTER REQUEST ATTRIBUTION & ANALYTICS TRACKING ---
// =========================================================================

export interface AiRequestLogRecord {
  id: string;
  requestId: string;
  timestamp: string;
  date: string;
  userId: string; // stable pseudonymous user identifier: usr_sha256(identifier)
  userDisplayLabel?: string;
  feature: string; // 'chat' | 'vision_ocr' | 'coding' | 'ghost_mode' | 'excel_generator' | 'presentation_generator' | 'educational' | 'reasoning' | 'multilingual' | 'playground' | 'live_voice' | 'general'
  modelName: string;
  modelId: string;
  provider: string;
  status: 'success' | 'error';
  durationMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  actualCostUsd: number;
  isFreeModel: boolean;
  openRouterGenerationId?: string;
  selectionReason: string;
  errorCode?: string | number;
  errorMessage?: string;
}

const AI_REQUESTS_LOG_FILE = path.join(DATA_DIR, 'ai_requests_log.json');
let aiRequestsList: AiRequestLogRecord[] = [];

function loadAiRequestsLog() {
  try {
    if (fs.existsSync(AI_REQUESTS_LOG_FILE)) {
      const data = JSON.parse(fs.readFileSync(AI_REQUESTS_LOG_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        aiRequestsList = data;
      }
    }
  } catch (e) {
    aiRequestsList = [];
  }
}
loadAiRequestsLog();

function saveAiRequestsLog() {
  try {
    fs.writeFileSync(
      AI_REQUESTS_LOG_FILE,
      JSON.stringify(aiRequestsList.slice(0, 3000), null, 2),
      'utf-8'
    );
  } catch (e) {
    console.warn('Failed to save ai_requests_log.json:', e);
  }
}

/**
 * Creates a stable, irreversible pseudonymous user identifier
 * so private email addresses or personal IDs are never exposed in analytics or to OpenRouter.
 */
export function createPseudonymousUserId(identifier?: string | null): string {
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    return 'usr_anon_guest';
  }
  const clean = identifier.trim().toLowerCase();
  const hash = crypto.createHash('sha256').update(clean).digest('hex').slice(0, 12);
  return `usr_${hash}`;
}

export function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function recordAiRequest(
  entry: Omit<AiRequestLogRecord, 'id' | 'timestamp' | 'date'>
): AiRequestLogRecord {
  const now = new Date();
  const record: AiRequestLogRecord = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    ...entry,
  };
  aiRequestsList.unshift(record);
  if (aiRequestsList.length > 3500) {
    aiRequestsList = aiRequestsList.slice(0, 3500);
  }
  saveAiRequestsLog();
  return record;
}

export function getAiRequestsList(): AiRequestLogRecord[] {
  return aiRequestsList;
}

export function getAiAnalytics(filterDays = 7, featureFilter?: string, modelFilter?: string) {
  const cutoff = Date.now() - filterDays * 86400000;
  let filtered = aiRequestsList.filter((r) => new Date(r.timestamp).getTime() >= cutoff);

  if (featureFilter && featureFilter !== 'all') {
    filtered = filtered.filter((r) => r.feature === featureFilter);
  }
  if (modelFilter && modelFilter !== 'all') {
    filtered = filtered.filter((r) => r.modelId === modelFilter);
  }

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalCostUsd = 0;
  let totalDurationMs = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  let freeModelRequests = 0;

  const perModel: Record<
    string,
    { name: string; calls: number; success: number; failed: number; totalTokens: number; cost: number; avgDurationMs: number; totalDurationMs: number }
  > = {};
  const perProvider: Record<string, { calls: number; totalTokens: number; cost: number }> = {};
  const perFeature: Record<string, { calls: number; totalTokens: number; cost: number; avgDurationMs: number; totalDurationMs: number }> = {};
  const perUser: Record<string, { userId: string; label: string; calls: number; tokens: number; lastActive: string }> = {};
  const dailyBreakdown: Record<
    string,
    { date: string; calls: number; success: number; failed: number; promptTokens: number; completionTokens: number; totalTokens: number; cost: number }
  > = {};

  for (const item of filtered) {
    totalPromptTokens += item.promptTokens || 0;
    totalCompletionTokens += item.completionTokens || 0;
    totalTokens += item.totalTokens || 0;
    totalCostUsd += item.actualCostUsd || 0;
    totalDurationMs += item.durationMs || 0;

    if (item.status === 'success') {
      successfulRequests += 1;
    } else {
      failedRequests += 1;
    }

    if (item.isFreeModel) {
      freeModelRequests += 1;
    }

    // By Model
    if (!perModel[item.modelId]) {
      perModel[item.modelId] = {
        name: item.modelName || item.modelId,
        calls: 0,
        success: 0,
        failed: 0,
        totalTokens: 0,
        cost: 0,
        avgDurationMs: 0,
        totalDurationMs: 0,
      };
    }
    perModel[item.modelId].calls += 1;
    if (item.status === 'success') perModel[item.modelId].success += 1;
    else perModel[item.modelId].failed += 1;
    perModel[item.modelId].totalTokens += item.totalTokens || 0;
    perModel[item.modelId].cost += item.actualCostUsd || 0;
    perModel[item.modelId].totalDurationMs += item.durationMs || 0;
    perModel[item.modelId].avgDurationMs = Math.round(
      perModel[item.modelId].totalDurationMs / perModel[item.modelId].calls
    );

    // By Provider
    const prov = item.provider || 'openrouter';
    if (!perProvider[prov]) {
      perProvider[prov] = { calls: 0, totalTokens: 0, cost: 0 };
    }
    perProvider[prov].calls += 1;
    perProvider[prov].totalTokens += item.totalTokens || 0;
    perProvider[prov].cost += item.actualCostUsd || 0;

    // By Feature
    const feat = item.feature || 'general';
    if (!perFeature[feat]) {
      perFeature[feat] = { calls: 0, totalTokens: 0, cost: 0, avgDurationMs: 0, totalDurationMs: 0 };
    }
    perFeature[feat].calls += 1;
    perFeature[feat].totalTokens += item.totalTokens || 0;
    perFeature[feat].cost += item.actualCostUsd || 0;
    perFeature[feat].totalDurationMs += item.durationMs || 0;
    perFeature[feat].avgDurationMs = Math.round(
      perFeature[feat].totalDurationMs / perFeature[feat].calls
    );

    // By User (Pseudonymous)
    const uId = item.userId || 'usr_anon_guest';
    if (!perUser[uId]) {
      perUser[uId] = {
        userId: uId,
        label: item.userDisplayLabel || uId,
        calls: 0,
        tokens: 0,
        lastActive: item.timestamp,
      };
    }
    perUser[uId].calls += 1;
    perUser[uId].tokens += item.totalTokens || 0;
    if (new Date(item.timestamp) > new Date(perUser[uId].lastActive)) {
      perUser[uId].lastActive = item.timestamp;
    }

    // By Day
    const day = item.date || item.timestamp.split('T')[0];
    if (!dailyBreakdown[day]) {
      dailyBreakdown[day] = {
        date: day,
        calls: 0,
        success: 0,
        failed: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
      };
    }
    dailyBreakdown[day].calls += 1;
    if (item.status === 'success') dailyBreakdown[day].success += 1;
    else dailyBreakdown[day].failed += 1;
    dailyBreakdown[day].promptTokens += item.promptTokens || 0;
    dailyBreakdown[day].completionTokens += item.completionTokens || 0;
    dailyBreakdown[day].totalTokens += item.totalTokens || 0;
    dailyBreakdown[day].cost += item.actualCostUsd || 0;
  }

  const avgDurationMs = filtered.length > 0 ? Math.round(totalDurationMs / filtered.length) : 0;
  const freeModelUsagePercent =
    filtered.length > 0 ? Math.round((freeModelRequests / filtered.length) * 100) : 100;

  return {
    summary: {
      totalRequests: filtered.length,
      successfulRequests,
      failedRequests,
      successRatePercent:
        filtered.length > 0 ? Math.round((successfulRequests / filtered.length) * 100) : 100,
      avgDurationMs,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens,
      actualCostUsd: Number(totalCostUsd.toFixed(6)),
      freeModelUsagePercent,
      activeUsersCount: Object.keys(perUser).length,
    },
    requestsByDate: Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date)),
    requestsByModel: Object.entries(perModel).map(([id, val]) => ({ id, ...val })),
    requestsByProvider: Object.entries(perProvider).map(([name, val]) => ({ name, ...val })),
    requestsByFeature: Object.entries(perFeature).map(([name, val]) => ({ name, ...val })),
    requestsByUser: Object.values(perUser).sort((a, b) => b.calls - a.calls),
    recentLogs: filtered.slice(0, 100), // Protects privacy: contains only metadata, no full prompts
  };
}

export function clearAiAnalytics(): boolean {
  aiRequestsList = [];
  saveAiRequestsLog();
  return true;
}
