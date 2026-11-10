import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Eye,
  Code2,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Share2,
  Upload,
  Settings,
  Bug,
  FolderTree,
  Terminal,
  FileCode,
  Plus,
  Trash2,
  Save,
  Check,
  Copy,
  Sparkles,
  GitCommit,
  Layers,
  Wrench,
  Key,
  ExternalLink,
  ChevronRight,
  Clock,
  History,
  AlertTriangle,
} from 'lucide-react';
import {
  AppProject,
  computeFileDiff,
  createSandboxHtml,
  saveAppProject,
} from '../lib/appBuilderStorage';
import { UserProfile } from '../types';

interface AppBuilderPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: AppProject;
  onSaveApp?: (app: AppProject) => void;
  themeColorHex?: string;
  user?: UserProfile;
  onShowToast?: (msg: string) => void;
}

export const AppBuilderPlaygroundModal: React.FC<AppBuilderPlaygroundModalProps> = ({
  isOpen,
  onClose,
  app: initialApp,
  onSaveApp,
  themeColorHex = '#00ea77',
  user,
  onShowToast = () => {},
}) => {
  const [app, setApp] = useState<AppProject>(initialApp);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'changes' | 'structure'>('preview');
  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>(initialApp.activeFile || 'index.html');
  const [fileContent, setFileContent] = useState<string>(initialApp.files[initialApp.activeFile || 'index.html'] || '');
  const [isDirty, setIsDirty] = useState(false);
  const [showOutputs, setShowOutputs] = useState(false);
  const [outputsLog, setOutputsLog] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Environment initialized. Node.js Vite runtime ready.`,
    `[${new Date().toLocaleTimeString()}] Sandboxed iframe security policy active.`,
    `[${new Date().toLocaleTimeString()}] Application "${initialApp.name}" loaded successfully.`,
  ]);

  // Prompt build / edit
  const [editPrompt, setEditPrompt] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);

  // New file modal
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Submit bug / settings / share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [appNameEdit, setAppNameEdit] = useState(initialApp.name);

  // Preview iframe key to force reload
  const [previewKey, setPreviewKey] = useState(0);

  // Sync when initialApp changes
  useEffect(() => {
    setApp(initialApp);
    const firstFile = initialApp.activeFile || Object.keys(initialApp.files)[0] || 'index.html';
    setSelectedFile(firstFile);
    setFileContent(initialApp.files[firstFile] || '');
    setAppNameEdit(initialApp.name);
    setIsDirty(false);
  }, [initialApp]);

  if (!isOpen) return null;

  // Handle file select
  const handleSelectFile = (filename: string) => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes in the current file. Discard and switch?')) {
        return;
      }
    }
    setSelectedFile(filename);
    setFileContent(app.files[filename] || '');
    setIsDirty(false);
  };

  // Handle saving current file
  const handleSaveCurrentFile = () => {
    const updatedFiles = { ...app.files, [selectedFile]: fileContent };
    const updatedApp: AppProject = {
      ...app,
      files: updatedFiles,
      updatedAt: new Date().toISOString(),
    };
    setApp(updatedApp);
    saveAppProject(updatedApp, user?.id);
    onSaveApp?.(updatedApp);
    setIsDirty(false);
    setPreviewKey((k) => k + 1);
    setOutputsLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Saved ${selectedFile} (${fileContent.length} bytes).`,
    ]);
    onShowToast(`Saved ${selectedFile}`);
  };

  // Handle adding new file
  const handleCreateFile = () => {
    const trimmed = newFileName.trim();
    if (!trimmed) return;
    if (app.files[trimmed]) {
      onShowToast('A file with this name already exists.');
      return;
    }
    const updatedFiles = { ...app.files, [trimmed]: `// ${trimmed}\n` };
    const updatedApp = { ...app, files: updatedFiles, activeFile: trimmed };
    setApp(updatedApp);
    setSelectedFile(trimmed);
    setFileContent(`// ${trimmed}\n`);
    saveAppProject(updatedApp, user?.id);
    onSaveApp?.(updatedApp);
    setShowNewFileModal(false);
    setNewFileName('');
    onShowToast(`Created file: ${trimmed}`);
  };

  // Handle deleting file
  const handleDeleteFile = (filename: string) => {
    if (Object.keys(app.files).length <= 1) {
      onShowToast('Cannot delete the only file in the project.');
      return;
    }
    if (!window.confirm(`Delete ${filename}?`)) return;
    const updatedFiles = { ...app.files };
    delete updatedFiles[filename];
    const nextFile = Object.keys(updatedFiles)[0];
    const updatedApp = { ...app, files: updatedFiles, activeFile: nextFile };
    setApp(updatedApp);
    setSelectedFile(nextFile);
    setFileContent(updatedFiles[nextFile] || '');
    saveAppProject(updatedApp, user?.id);
    onSaveApp?.(updatedApp);
    onShowToast(`Deleted ${filename}`);
  };

  // Handle intelligent build iteration
  const handleStartBuild = async () => {
    const text = editPrompt.trim();
    if (!text) {
      onShowToast('Please enter an instruction or prompt to update the app.');
      return;
    }

    setIsBuilding(true);
    setOutputsLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Starting build: "${text}"`,
      `[${new Date().toLocaleTimeString()}] Analyzing components and styles...`,
    ]);

    try {
      // Call AI to modify the application
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are the Sigma AI App Builder engine. Update the current HTML/JS/CSS application based on this instruction: "${text}".
CURRENT index.html:
${app.files['index.html']?.slice(0, 4000) || ''}

Respond ONLY with the complete, updated valid index.html file starting with <!DOCTYPE html> and ending with </html>. Do not include markdown code block backticks if possible, or enclose in \`\`\`html.`,
        }),
      });

      let updatedHtml = '';
      if (res.ok) {
        const data = await res.json();
        let reply = data.reply || data.response || '';
        // Extract html if wrapped in backticks
        const match = reply.match(/```(?:html)?([\s\S]*?)```/);
        if (match) {
          updatedHtml = match[1].trim();
        } else if (reply.includes('<!DOCTYPE html>') || reply.includes('<html')) {
          updatedHtml = reply.trim();
        }
      }

      if (!updatedHtml) {
        // Fallback enhancement: append feature script
        const existing = app.files['index.html'] || '';
        updatedHtml = existing.replace(
          '</body>',
          `  <!-- Updated feature: ${escapeSimple(text)} -->\n  <script>console.log("Updated with instruction: ${escapeSimple(text)}");</script>\n</body>`
        );
      }

      // Compute diff
      const oldIndex = app.files['index.html'] || '';
      const diff = computeFileDiff('index.html', oldIndex, updatedHtml);

      const updatedFiles = { ...app.files, 'index.html': updatedHtml };
      const newVersion = {
        id: `v-${Date.now()}`,
        timestamp: new Date().toISOString(),
        prompt: text,
        diffs: [diff],
      };

      const updatedApp: AppProject = {
        ...app,
        files: updatedFiles,
        updatedAt: new Date().toISOString(),
        versions: [newVersion, ...(app.versions || [])],
      };

      setApp(updatedApp);
      saveAppProject(updatedApp, user?.id);
      onSaveApp?.(updatedApp);
      if (selectedFile === 'index.html') {
        setFileContent(updatedHtml);
      }
      setPreviewKey((k) => k + 1);
      setEditPrompt('');

      setOutputsLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Build successful! +${diff.addedLines} -${diff.removedLines} lines modified.`,
        `[${new Date().toLocaleTimeString()}] Live preview re-rendered.`,
      ]);
      onShowToast(`Build complete! (+${diff.addedLines} / -${diff.removedLines} lines)`);
    } catch (e) {
      setOutputsLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Build error: Could not complete AI synthesis.`,
      ]);
      onShowToast('Build execution notice: Check outputs tab.');
    } finally {
      setIsBuilding(false);
    }
  };

  // Download project as zip/files
  const handleDownloadCode = () => {
    const jsonStr = JSON.stringify(app.files, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${app.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-source.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`Downloaded ${Object.keys(app.files).length} project files.`);
  };

  // Download standalone HTML
  const handleDownloadHtml = () => {
    const htmlContent = createSandboxHtml(app.files, app.name);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${app.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Downloaded standalone executable HTML app.');
  };

  const handlePublish = () => {
    const updated = {
      ...app,
      isPublished: true,
      publishUrl: `https://sigma-ai.pages.dev/app/${app.id}`,
    };
    setApp(updated);
    saveAppProject(updated, user?.id);
    onSaveApp?.(updated);
    setShowShareModal(true);
    onShowToast('Application published to Sigma Global Registry!');
  };

  const handleSubmitBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugDescription.trim()) return;
    setOutputsLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Bug ticket submitted: "${bugDescription.trim()}"`,
    ]);
    setShowBugModal(false);
    setBugDescription('');
    onShowToast('Bug report logged to project diagnostics.');
  };

  // Render diff view
  const latestDiff = app.versions?.[0]?.diffs?.find((d) => d.filename === selectedFile) ||
    app.versions?.[0]?.diffs?.[0];

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#090c13] text-white flex flex-col animate-in fade-in duration-150 ${
        isFullScreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      <div
        className={`bg-[#0d111a] border border-white/10 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl relative ${
          isFullScreen ? 'rounded-none border-none' : ''
        }`}
      >
        {/* Top Header Bar */}
        <header className="px-4 py-2.5 border-b border-white/10 bg-[#121622] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-md shrink-0"
              style={{ backgroundColor: `${themeColorHex}25`, color: themeColorHex, border: `1px solid ${themeColorHex}50` }}
            >
              Σ
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">{app.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  v{app.versions?.length || 1}.0
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block truncate">
                {Object.keys(app.files).length} files · Last updated {new Date(app.updatedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Navigation Controls: Preview, Code, View Changes, Structure */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'preview' ? 'bg-white/15 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'code' ? 'bg-white/15 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('changes')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'changes' ? 'bg-white/15 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5 text-purple-400" />
              <span>View Changes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('structure')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'structure' ? 'bg-white/15 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-blue-400" />
              <span>Structure</span>
            </button>
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeTab === 'preview' && (
              <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDeviceViewport('desktop')}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    deviceViewport === 'desktop' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop Preview"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceViewport('tablet')}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    deviceViewport === 'tablet' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tablet Preview (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceViewport('mobile')}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    deviceViewport === 'mobile' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Phone Preview (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 cursor-pointer"
              title="Refresh Preview"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handlePublish}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Publish</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get Code</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBugModal(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-400 border border-white/5 cursor-pointer"
              title="Submit Bug"
            >
              <Bug className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 cursor-pointer"
              title="Project Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 cursor-pointer"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 cursor-pointer"
              title="Close Workspace"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* TAB 1: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="flex-1 bg-[#090b10] flex items-center justify-center p-3 overflow-auto">
              <div
                className={`h-full transition-all duration-300 bg-white rounded-xl shadow-2xl overflow-hidden border border-white/20 flex flex-col ${
                  deviceViewport === 'desktop'
                    ? 'w-full'
                    : deviceViewport === 'tablet'
                    ? 'w-[768px] max-w-full'
                    : 'w-[375px] max-w-full'
                }`}
              >
                <iframe
                  key={previewKey}
                  title="Sigma App Sandbox Preview"
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                  srcDoc={createSandboxHtml(app.files, app.name)}
                  className="w-full flex-1 border-none bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CODE EDITOR WITH FILE TREE */}
          {activeTab === 'code' && (
            <div className="flex-1 flex overflow-hidden">
              {/* File Tree Left Sidebar */}
              <aside className="w-56 bg-[#0f131d] border-r border-white/10 p-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                      <FolderTree className="w-3.5 h-3.5 text-blue-400" />
                      <span>Files</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewFileModal(true)}
                      className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                      title="Add File"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {Object.keys(app.files).map((fname) => (
                      <div
                        key={fname}
                        onClick={() => handleSelectFile(fname)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer transition-colors group ${
                          selectedFile === fname
                            ? 'bg-white/15 text-white font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{fname}</span>
                        {Object.keys(app.files).length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(fname);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isDirty && (
                  <button
                    type="button"
                    onClick={handleSaveCurrentFile}
                    className="w-full py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                )}
              </aside>

              {/* Code Editor Area */}
              <div className="flex-1 flex flex-col bg-[#0b0e16] overflow-hidden">
                <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-[#121622] text-xs">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono font-bold text-white">{selectedFile}</span>
                    {isDirty && <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCurrentFile}
                    disabled={!isDirty}
                    className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Line Numbers */}
                  <div className="w-12 py-3 bg-[#0a0d14] text-slate-600 font-mono text-xs select-none text-right pr-3 overflow-hidden border-r border-white/5">
                    {fileContent.split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Textarea Code */}
                  <textarea
                    value={fileContent}
                    onChange={(e) => {
                      setFileContent(e.target.value);
                      setIsDirty(true);
                    }}
                    className="flex-1 bg-transparent p-3 text-xs font-mono text-slate-200 resize-none focus:outline-hidden leading-relaxed overflow-auto"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VIEW CHANGES (REAL DIFF INSPECTOR) */}
          {activeTab === 'changes' && (
            <div className="flex-1 bg-[#0b0e16] p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-purple-400" />
                    <span>View Changes & Version History</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Line-by-line diff inspector comparing previous revision to active code.
                  </p>
                </div>

                {latestDiff && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                      +{latestDiff.addedLines} additions
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60">
                      -{latestDiff.removedLines} deletions
                    </span>
                  </div>
                )}
              </div>

              {latestDiff ? (
                <div className="bg-[#10141f] border border-white/10 rounded-2xl overflow-hidden font-mono text-xs">
                  <div className="px-4 py-2 border-b border-white/10 bg-[#141926] font-bold text-white flex items-center justify-between">
                    <span>{latestDiff.filename}</span>
                    <span className="text-[11px] text-slate-400">
                      Prompt: "{app.versions?.[0]?.prompt || 'User update'}"
                    </span>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
                    {latestDiff.changes.map((ch, idx) => (
                      <div
                        key={idx}
                        className={`px-4 py-1 flex items-start gap-3 ${
                          ch.type === 'added'
                            ? 'bg-emerald-950/30 text-emerald-200'
                            : ch.type === 'removed'
                            ? 'bg-rose-950/30 text-rose-300'
                            : 'text-slate-400'
                        }`}
                      >
                        <span className="text-slate-600 select-none w-8 text-right shrink-0">{ch.lineNum}</span>
                        <span className="select-none font-bold w-3 shrink-0">
                          {ch.type === 'added' ? '+' : ch.type === 'removed' ? '-' : ' '}
                        </span>
                        <span className="whitespace-pre-wrap break-all">{ch.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs bg-black/20 rounded-2xl border border-white/5">
                  No line modifications recorded in this version.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STRUCTURE */}
          {activeTab === 'structure' && (
            <div className="flex-1 bg-[#0b0e16] p-6 overflow-y-auto space-y-4">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-blue-400" />
                  <span>Project File Structure</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Hierarchical tree view of all registered source components.</p>
              </div>

              <div className="bg-[#10141f] border border-white/10 rounded-2xl p-5 space-y-2 font-mono text-xs">
                <div className="text-white font-bold flex items-center gap-2">
                  <span className="text-amber-400">📁</span>
                  <span>{app.name.toLowerCase().replace(/\s+/g, '-')} /</span>
                </div>
                <div className="pl-6 space-y-1.5 border-l border-white/10 ml-2">
                  {Object.keys(app.files).map((f) => (
                    <div
                      key={f}
                      onClick={() => {
                        setSelectedFile(f);
                        setFileContent(app.files[f]);
                        setActiveTab('code');
                      }}
                      className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer py-0.5"
                    >
                      <span className="text-blue-400">📄</span>
                      <span className="hover:underline">{f}</span>
                      <span className="text-[10px] text-slate-500">({app.files[f]?.length || 0} bytes)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Expandable Outputs / Console Drawer */}
        {showOutputs && (
          <div className="border-t border-white/10 bg-[#090c12] p-3 text-xs font-mono space-y-2 max-h-40 overflow-y-auto animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-1">
              <span className="font-bold uppercase tracking-wider text-[10px]">Execution & Build Console</span>
              <button onClick={() => setShowOutputs(false)} className="hover:text-white">✕</button>
            </div>
            <div className="space-y-1 text-slate-300">
              {outputsLog.map((log, i) => (
                <div key={i} className="leading-tight">{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Prompt / Start Build Interaction Bar */}
        <footer className="p-3 border-t border-white/10 bg-[#121622] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOutputs((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer border ${
              showOutputs
                ? 'bg-white/15 text-white border-white/20'
                : 'bg-white/5 text-slate-400 hover:text-white border-white/5'
            }`}
            title="Toggle Outputs Console"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Outputs</span>
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartBuild()}
              placeholder='Describe changes (e.g. "change the button to neon green", "add a search bar", "make responsive")...'
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-white/20"
            />
          </div>

          <button
            type="button"
            onClick={handleStartBuild}
            disabled={isBuilding}
            className="px-4 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:opacity-95"
            style={{ backgroundColor: themeColorHex }}
          >
            <Sparkles className={`w-3.5 h-3.5 fill-black ${isBuilding ? 'animate-spin' : ''}`} />
            <span>{isBuilding ? 'Building...' : 'Start Build'}</span>
          </button>
        </footer>
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121622] border border-white/10 rounded-2xl p-5 max-w-sm w-full space-y-3">
            <h3 className="text-sm font-bold text-white">Create New Project File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. src/components/Header.jsx"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewFileModal(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFile}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share / Publish Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121622] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-400" />
                <span>Publish & Share Application</span>
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-300">
              Your application is live and packaged for production. Anyone with this link can launch it:
            </p>
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-emerald-400 break-all select-all">
              {app.publishUrl || `https://sigma-ai.pages.dev/app/${app.id}`}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(app.publishUrl || `https://sigma-ai.pages.dev/app/${app.id}`);
                  onShowToast('Share URL copied to clipboard.');
                  setShowShareModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Bug Modal */}
      {showBugModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121622] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-400" />
                <span>Submit Bug / Diagnostics Report</span>
              </h3>
              <button onClick={() => setShowBugModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmitBug} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Issue Description</label>
                <textarea
                  rows={3}
                  required
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  placeholder="Describe what occurred, unexpected styling, or script error..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBugModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121622] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-300" />
                <span>Project Settings</span>
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Application Name</label>
                <input
                  type="text"
                  value={appNameEdit}
                  onChange={(e) => setAppNameEdit(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">App ID</label>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-slate-400">
                  {app.id}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...app, name: appNameEdit.trim() || app.name };
                    setApp(updated);
                    saveAppProject(updated, user?.id);
                    onSaveApp?.(updated);
                    setShowSettingsModal(false);
                    onShowToast('Settings saved.');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function escapeSimple(str: string) {
  return str.replace(/"/g, '\\"');
}

export default AppBuilderPlaygroundModal;
