import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

export interface AppProjectFile {
  name: string;
  path: string;
  content: string;
  language: 'html' | 'typescript' | 'javascript' | 'css' | 'json' | 'markdown';
}

export interface AppVersionDiff {
  filename: string;
  addedLines: number;
  removedLines: number;
  changes: Array<{
    type: 'added' | 'removed' | 'unchanged';
    text: string;
    lineNum: number;
  }>;
}

export interface AppProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  files: Record<string, string>;
  activeFile: string;
  versions: Array<{
    id: string;
    timestamp: string;
    prompt: string;
    diffs: AppVersionDiff[];
  }>;
  isPublished?: boolean;
  publishUrl?: string;
  tags?: string[];
  template?: string;
}

const LOCAL_APPS_STORAGE_KEY = 'sigma_user_my_apps_v1';

export function getLocalApps(userEmail?: string): AppProject[] {
  try {
    const raw = localStorage.getItem(LOCAL_APPS_STORAGE_KEY);
    if (!raw) return [];
    const list: AppProject[] = JSON.parse(raw);
    if (!userEmail || userEmail === 'guest@sigma.ai') return list;
    return list.filter((a) => a.userEmail === userEmail || !a.userEmail);
  } catch {
    return [];
  }
}

export function saveLocalApp(app: AppProject): void {
  try {
    const existing = getLocalApps();
    const idx = existing.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
      existing[idx] = { ...app, updatedAt: new Date().toISOString() };
    } else {
      existing.unshift({ ...app, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(LOCAL_APPS_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('Could not save local app:', e);
  }
}

export function deleteLocalApp(appId: string): void {
  try {
    const existing = getLocalApps();
    const filtered = existing.filter((a) => a.id !== appId);
    localStorage.setItem(LOCAL_APPS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Could not delete local app:', e);
  }
}

// Load all apps for current user (Firestore + local cache)
export async function loadUserApps(userEmail?: string, userId?: string): Promise<AppProject[]> {
  const localList = getLocalApps(userEmail);

  if (db && userId && userEmail && userEmail !== 'guest@sigma.ai') {
    try {
      const appsRef = collection(db, 'users', userId, 'my_apps');
      const snap = await getDocs(appsRef);
      const firestoreList: AppProject[] = [];
      snap.forEach((docSnap) => {
        firestoreList.push(docSnap.data() as AppProject);
      });
      if (firestoreList.length > 0) {
        // Merge with local storage
        const mergedMap = new Map<string, AppProject>();
        firestoreList.forEach((a) => mergedMap.set(a.id, a));
        localList.forEach((a) => {
          if (!mergedMap.has(a.id)) mergedMap.set(a.id, a);
        });
        const result = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        localStorage.setItem(LOCAL_APPS_STORAGE_KEY, JSON.stringify(result));
        return result;
      }
    } catch (e) {
      console.warn('Firestore user apps sync notice:', e);
    }
  }

  // Pre-seed a default creative app if user has none
  if (localList.length === 0) {
    const starterApp = createSampleStarterApp(userEmail || 'guest@sigma.ai');
    saveLocalApp(starterApp);
    return [starterApp];
  }

  return localList;
}

export async function saveAppProject(app: AppProject, userId?: string): Promise<void> {
  saveLocalApp(app);
  if (db && userId && app.userEmail && app.userEmail !== 'guest@sigma.ai') {
    try {
      const docRef = doc(db, 'users', userId, 'my_apps', app.id);
      await setDoc(docRef, app, { merge: true });
    } catch (e) {
      console.warn('Could not save app to Firestore:', e);
    }
  }
}

export async function deleteAppProject(appId: string, userId?: string): Promise<void> {
  deleteLocalApp(appId);
  if (db && userId) {
    try {
      const docRef = doc(db, 'users', userId, 'my_apps', appId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Could not delete app from Firestore:', e);
    }
  }
}

// Compute accurate line-by-line diff between two file contents
export function computeFileDiff(
  filename: string,
  oldContent: string,
  newContent: string
): AppVersionDiff {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const changes: AppVersionDiff['changes'] = [];
  let added = 0;
  let removed = 0;

  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];

    if (oldLine === newLine) {
      if (oldLine !== undefined) {
        changes.push({ type: 'unchanged', text: oldLine, lineNum: newIdx + 1 });
      }
      oldIdx++;
      newIdx++;
    } else {
      // Lookahead check
      if (oldLine !== undefined && !newLines.includes(oldLine)) {
        changes.push({ type: 'removed', text: oldLine, lineNum: oldIdx + 1 });
        removed++;
        oldIdx++;
      } else if (newLine !== undefined && !oldLines.includes(newLine)) {
        changes.push({ type: 'added', text: newLine, lineNum: newIdx + 1 });
        added++;
        newIdx++;
      } else {
        if (oldLine !== undefined) {
          changes.push({ type: 'removed', text: oldLine, lineNum: oldIdx + 1 });
          removed++;
          oldIdx++;
        }
        if (newLine !== undefined) {
          changes.push({ type: 'added', text: newLine, lineNum: newIdx + 1 });
          added++;
          newIdx++;
        }
      }
    }
  }

  return {
    filename,
    addedLines: added,
    removedLines: removed,
    changes,
  };
}

// Generate an interactive, self-contained HTML bundle for the sandboxed iframe
export function createSandboxHtml(files: Record<string, string>, appTitle: string = 'Sigma App'): string {
  const indexHtml = files['index.html'] || '';
  const appTsx = files['src/App.tsx'] || files['src/App.jsx'] || files['src/app.js'] || '';
  const css = files['src/styles.css'] || files['src/index.css'] || files['style.css'] || '';

  // If index.html already has full html document, inject tailwind and styles
  if (indexHtml.includes('<html') || indexHtml.includes('<!DOCTYPE html>')) {
    let result = indexHtml;
    if (!result.includes('cdn.tailwindcss.com')) {
      result = result.replace(
        '<head>',
        '<head>\n<script src="https://cdn.tailwindcss.com"></script>\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>'
      );
    }
    if (css) {
      result = result.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
    }
    // Inject safe console and error listener
    const consoleCaptureScript = `
      <script>
        window.addEventListener('error', function(e) {
          console.error('[Runtime Error]:', e.message, 'at line', e.lineno);
        });
      </script>
    `;
    result = result.replace('</body>', `${consoleCaptureScript}\n</body>`);
    return result;
  }

  // Otherwise, construct modern React/Tailwind wrapper
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(appTitle)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    ${css}
  </style>
</head>
<body class="bg-slate-900 text-white min-h-screen">
  <div id="root">
    ${indexHtml || '<div class="p-8 text-center text-slate-400">Loading Application...</div>'}
  </div>

  ${
    appTsx
      ? `<script type="text/babel">
    ${cleanReactCode(appTsx)}
    if (typeof App !== 'undefined') {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    }
  </script>`
      : ''
  }

  <script>
    window.addEventListener('error', function(e) {
      console.error('[Runtime Error]:', e.message, 'at line', e.lineno);
    });
  </script>
</body>
</html>`;
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cleanReactCode(code: string): string {
  // Strip import / export statements so Babel browser standalone can execute smoothly
  return code
    .replace(/^import\s+.*?;?\s*$/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+/gm, '');
}

// Generate complete, professional multi-file starter app based on user prompt
export function createStarterAppFromPrompt(prompt: string, userEmail: string = 'guest@sigma.ai'): AppProject {
  const isCalculator = /calculator|calc|math/i.test(prompt);
  const isDashboard = /dashboard|analytics|crm|admin|metrics/i.test(prompt);
  const isGame = /game|play|arcade|pong|snake|quiz/i.test(prompt);
  const isPortfolio = /portfolio|resume|personal|cv/i.test(prompt);
  const isEducation = /study|school|past paper|quiz|student|learning/i.test(prompt);

  const cleanName = prompt
    .slice(0, 32)
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim() || 'Sigma Custom App';

  const title = isCalculator
    ? 'Sigma Scientific Calculator Pro'
    : isDashboard
    ? 'Sigma SaaS Analytics Dashboard'
    : isGame
    ? 'Sigma Neon Space Dodger'
    : isPortfolio
    ? 'Modern Tech Portfolio & Showcase'
    : isEducation
    ? 'Sigma Cambridge & Study Portal'
    : `${cleanName} Application`;

  const description = `Production-grade application generated by Sigma AI from prompt: "${prompt}"`;

  const files: Record<string, string> = {};

  if (isCalculator) {
    files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sigma Scientific Calculator Pro</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0b0f17] text-white flex items-center justify-center min-h-screen p-4">
  <div class="bg-[#121824] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
    <div class="flex items-center justify-between pb-3 border-b border-white/10">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
        <span class="text-xs font-bold uppercase tracking-wider text-slate-300">Sigma Calc Pro</span>
      </div>
      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">RAD</span>
    </div>
    <div class="bg-black/60 border border-white/10 rounded-2xl p-4 text-right">
      <div id="calc-history" class="text-xs text-slate-500 font-mono h-5 overflow-hidden"></div>
      <div id="calc-display" class="text-3xl font-mono font-extrabold text-white tracking-tight truncate">0</div>
    </div>
    <div class="grid grid-cols-4 gap-2 text-sm font-semibold font-mono">
      <button onclick="clearCalc()" class="p-3 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/40">C</button>
      <button onclick="appendOp('(')" class="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">(</button>
      <button onclick="appendOp(')')" class="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">)</button>
      <button onclick="appendOp('/')" class="p-3 rounded-xl bg-purple-950/40 text-purple-300 border border-purple-800/40 hover:bg-purple-900/40">÷</button>
      
      <button onclick="appendNum('7')" class="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white">7</button>
      <button onclick="appendNum('8')" class="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white">8</button>
      <button onclick="appendNum('9')" class="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white">9</button>
      <button onclick="appendOp('*')" class="p-3 rounded-xl bg-purple-950/40 text-purple-300 border border-purple-800/40 hover:bg-purple-900/40">×</button>
      
      <button onclick="appendNum('4')" class="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white">4</button>
      <button onclick="appendNum('5')" class="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white">5</button>
      <button onclick="appendNum('6')" class="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white">6</button>
      <button onclick="appendOp('-')" class="p-3 rounded-xl bg-purple-950/40 text-purple-300 border border-purple-800/40 hover:bg-purple-900/40">−</button>
      
      <button onclick="appendNum('1')" class="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white">1</button>
      <button onclick="appendNum('2')" class="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white">2</button>
      <button onclick="appendNum('3')" class="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white">3</button>
      <button onclick="appendOp('+')" class="p-3 rounded-xl bg-purple-950/40 text-purple-300 border border-purple-800/40 hover:bg-purple-900/40">+</button>
      
      <button onclick="appendNum('0')" class="col-span-2 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white">0</button>
      <button onclick="appendDot()" class="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white">.</button>
      <button onclick="calcResult()" class="p-3.5 rounded-xl bg-emerald-500 text-black font-extrabold hover:bg-emerald-400">=</button>
    </div>
  </div>
  <script>
    let current = '0';
    let history = '';
    const display = document.getElementById('calc-display');
    const hist = document.getElementById('calc-history');

    function update() {
      display.innerText = current;
      hist.innerText = history;
    }
    function clearCalc() {
      current = '0';
      history = '';
      update();
    }
    function appendNum(n) {
      if (current === '0') current = n;
      else current += n;
      update();
    }
    function appendDot() {
      if (!current.includes('.')) current += '.';
      update();
    }
    function appendOp(op) {
      history = current + ' ' + op + ' ';
      current = '0';
      update();
    }
    function calcResult() {
      try {
        const fullExpr = history + current;
        const res = Function('"use strict";return (' + fullExpr + ')')();
        history = fullExpr + ' =';
        current = String(Number(res.toFixed(6)));
      } catch (e) {
        current = 'Error';
      }
      update();
    }
  </script>
</body>
</html>`;
    files['src/App.tsx'] = `// Sigma Scientific Calculator React Component
export default function App() {
  return (
    <div className="p-4 text-center">
      <h1 className="text-xl font-bold">Sigma Scientific Calculator</h1>
    </div>
  );
}`;
    files['package.json'] = JSON.stringify(
      { name: 'sigma-calc-pro', version: '1.0.0', private: true, dependencies: { react: '^18.0.0' } },
      null,
      2
    );
    files['README.md'] = `# Sigma Scientific Calculator Pro\n\nHigh-precision browser calculator with parentheses, decimals, and operation history.`;
  } else {
    // Modern SaaS dashboard / full web application
    files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
</head>
<body class="bg-[#0b0f17] text-slate-100 min-h-screen">
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 bg-[#10141f] border-r border-white/10 flex flex-col justify-between p-4 hidden md:flex">
      <div class="space-y-6">
        <div class="flex items-center gap-3 px-2">
          <div class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold font-mono">
            Σ
          </div>
          <span class="font-bold text-white text-base tracking-wide">${escapeHtml(cleanName.slice(0, 16))}</span>
        </div>
        <nav class="space-y-1 text-xs font-semibold">
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-white font-bold"><i class="fa fa-chart-pie text-emerald-400 w-4"></i> Overview</a>
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"><i class="fa fa-layer-group text-purple-400 w-4"></i> Workspaces</a>
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"><i class="fa fa-database text-blue-400 w-4"></i> Data Collections</a>
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"><i class="fa fa-gear text-amber-400 w-4"></i> Settings</a>
        </nav>
      </div>
      <div class="p-3 rounded-2xl bg-black/40 border border-white/5 text-xs text-slate-400">
        <div class="text-[11px] font-bold text-white mb-1">Sigma Engine v2.4</div>
        <div class="text-[10px] text-emerald-400">● 100% Operational</div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-y-auto">
      <!-- Top Bar -->
      <header class="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-[#0e121b]/80 backdrop-blur-md">
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-bold text-white">${escapeHtml(title)}</h2>
          <span class="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Live App</span>
        </div>
        <div class="flex items-center gap-3">
          <button onclick="alert('Action completed!')" class="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors">+ New Record</button>
        </div>
      </header>

      <!-- Dashboard Cards -->
      <div class="p-6 space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-5 rounded-2xl bg-[#121622] border border-white/10 space-y-1">
            <span class="text-xs text-slate-400">Total Users</span>
            <div class="text-2xl font-extrabold text-white font-mono">14,280</div>
            <span class="text-[10px] text-emerald-400">↑ 18.4% this month</span>
          </div>
          <div class="p-5 rounded-2xl bg-[#121622] border border-white/10 space-y-1">
            <span class="text-xs text-slate-400">Active Invocations</span>
            <div class="text-2xl font-extrabold text-purple-400 font-mono">182.9k</div>
            <span class="text-[10px] text-purple-300">Fast throughput</span>
          </div>
          <div class="p-5 rounded-2xl bg-[#121622] border border-white/10 space-y-1">
            <span class="text-xs text-slate-400">Avg Response Time</span>
            <div class="text-2xl font-extrabold text-blue-400 font-mono">142ms</div>
            <span class="text-[10px] text-blue-300">Optimized latency</span>
          </div>
          <div class="p-5 rounded-2xl bg-[#121622] border border-white/10 space-y-1">
            <span class="text-xs text-slate-400">System Health</span>
            <div class="text-2xl font-extrabold text-emerald-400 font-mono">99.98%</div>
            <span class="text-[10px] text-emerald-300">Verified zero downtime</span>
          </div>
        </div>

        <!-- Interactive Table Section -->
        <div class="bg-[#121622] border border-white/10 rounded-2xl p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white">Live Data Records</h3>
            <span class="text-xs text-slate-400">Real-time sync</span>
          </div>
          <div class="overflow-x-auto text-xs">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-white/10 text-slate-400">
                  <th class="py-2 px-3">RECORD ID</th>
                  <th class="py-2 px-3">NAME</th>
                  <th class="py-2 px-3">CATEGORY</th>
                  <th class="py-2 px-3">STATUS</th>
                  <th class="py-2 px-3">UPDATED</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 font-mono">
                <tr class="hover:bg-white/5">
                  <td class="py-3 px-3 text-slate-400">#REC-8841</td>
                  <td class="py-3 px-3 text-white font-sans font-semibold">User Authentication Flow</td>
                  <td class="py-3 px-3 text-purple-300">Security</td>
                  <td class="py-3 px-3 text-emerald-400">● Completed</td>
                  <td class="py-3 px-3 text-slate-400">Just now</td>
                </tr>
                <tr class="hover:bg-white/5">
                  <td class="py-3 px-3 text-slate-400">#REC-8840</td>
                  <td class="py-3 px-3 text-white font-sans font-semibold">Database Persistence Migration</td>
                  <td class="py-3 px-3 text-blue-300">Database</td>
                  <td class="py-3 px-3 text-emerald-400">● Completed</td>
                  <td class="py-3 px-3 text-slate-400">12 min ago</td>
                </tr>
                <tr class="hover:bg-white/5">
                  <td class="py-3 px-3 text-slate-400">#REC-8839</td>
                  <td class="py-3 px-3 text-white font-sans font-semibold">API Key Verification Gateway</td>
                  <td class="py-3 px-3 text-amber-300">Integration</td>
                  <td class="py-3 px-3 text-emerald-400">● Completed</td>
                  <td class="py-3 px-3 text-slate-400">35 min ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
    files['src/App.tsx'] = `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-white p-6">
      <h1 className="text-2xl font-bold text-emerald-400">${escapeHtml(title)}</h1>
      <p className="text-slate-400 mt-2">${escapeHtml(description)}</p>
    </div>
  );
}`;
    files['src/styles.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #0b0f17;
  color: #f1f5f9;
}`;
    files['package.json'] = JSON.stringify(
      {
        name: cleanName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        private: true,
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.400.0',
        },
      },
      null,
      2
    );
    files['README.md'] = `# ${title}\n\nGenerated with Sigma AI.\n\n## Prompt\n> ${prompt}\n\n## Getting Started\nOpen \`index.html\` in any browser or run \`npm install && npm run dev\`.`;
  }

  return {
    id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: title,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userEmail,
    files,
    activeFile: 'index.html',
    versions: [
      {
        id: `v1-${Date.now()}`,
        timestamp: new Date().toISOString(),
        prompt: prompt || 'Initial application creation',
        diffs: [
          {
            filename: 'index.html',
            addedLines: files['index.html'].split('\n').length,
            removedLines: 0,
            changes: files['index.html'].split('\n').map((l, i) => ({ type: 'added', text: l, lineNum: i + 1 })),
          },
        ],
      },
    ],
    tags: [isCalculator ? 'Calculator' : isDashboard ? 'Dashboard' : isGame ? 'Game' : 'Full-Stack'],
  };
}

function createSampleStarterApp(userEmail: string): AppProject {
  return createStarterAppFromPrompt('Sigma Smart Productivity Portal & Calculator', userEmail);
}
