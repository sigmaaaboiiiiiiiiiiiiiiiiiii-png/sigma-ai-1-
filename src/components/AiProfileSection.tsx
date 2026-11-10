import React, { useState, useEffect } from 'react';
import {
  Brain,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  Sparkles,
  MessageSquare,
  Sliders,
  Target,
  ListTodo,
  Tag,
  AlertCircle,
  BookOpen,
  Cloud,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AiProfileData {
  explicitPreferences: string[];
  communicationStyle: string[];
  answerFormat: string[];
  goals: string[];
  ongoingTasks: string[];
  importantNames: string[];
  corrections: string[];
  studySources: string[];
  lastUpdated?: string;
}

const DEFAULT_AI_PROFILE: AiProfileData = {
  explicitPreferences: [
    'Direct and factual answers with zero filler or generic preambles',
    'No repeated apologies: say "Okay, I will explain like that" instead of "Sorry my bad"',
  ],
  communicationStyle: [
    'Adapts to English, Urdu, and Roman Urdu / Hinglish seamlessly',
    'Provides step-by-step breakdowns for complex topics and exams',
  ],
  answerFormat: [
    'Clean markdown structure with formatted headers and code blocks',
    'Adaptive visual roadmaps and cards only when materially helpful',
  ],
  goals: [
    'Mastering CAIE A-Level & IGCSE past papers with real solved steps',
    'High exam accuracy and clean concept explanations',
  ],
  ongoingTasks: [
    'PastPapers.Co qualification and paper solving',
    'Study sources and revision reference collection',
  ],
  importantNames: [],
  corrections: [
    'When user asks a clarification, explain directly without repetitive apologies',
    'Keep UI clean and responsive with single New Chat and Live Assistant controls',
  ],
  studySources: [
    'PastPapers.Co (CAIE, AQA, CCEA, OCR)',
    'Official Exam Board specifications and syllabus documents',
  ],
};

function getStorageKey(user: UserProfile): string {
  const identifier = (user.email || user.id || 'guest').trim().toLowerCase();
  return `sigma_ai_profile_${identifier}`;
}

interface AiProfileSectionProps {
  user: UserProfile;
  themeColorHex?: string;
}

export const AiProfileSection: React.FC<AiProfileSectionProps> = ({
  user,
  themeColorHex = '#3b82f6',
}) => {
  const [profileData, setProfileData] = useState<AiProfileData>(DEFAULT_AI_PROFILE);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingSection, setEditingSection] = useState<keyof AiProfileData | null>(null);
  const [newItemText, setNewItemText] = useState('');

  // Load from LocalStorage + Firestore
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setIsLoading(true);
      const storageKey = getStorageKey(user);

      // 1. Try LocalStorage
      let loaded = DEFAULT_AI_PROFILE;
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            loaded = { ...DEFAULT_AI_PROFILE, ...parsed };
          }
        }
      } catch (e) {
        console.warn('Failed to parse local AI profile', e);
      }

      // 2. Try Firestore if logged in
      const effectiveId = user.id || (user.email ? user.email.toLowerCase().trim() : null);
      if (user.isLoggedIn && effectiveId) {
        try {
          const ref = doc(db, 'users', effectiveId, 'ai_profile', 'profile');
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            loaded = {
              explicitPreferences: data.explicitPreferences || loaded.explicitPreferences,
              communicationStyle: data.communicationStyle || loaded.communicationStyle,
              answerFormat: data.answerFormat || loaded.answerFormat,
              goals: data.goals || loaded.goals,
              ongoingTasks: data.ongoingTasks || loaded.ongoingTasks,
              importantNames: data.importantNames || loaded.importantNames,
              corrections: data.corrections || loaded.corrections,
              studySources: data.studySources || loaded.studySources,
              lastUpdated: data.lastUpdated || new Date().toISOString(),
            };
            localStorage.setItem(storageKey, JSON.stringify(loaded));
          }
        } catch (err) {
          console.warn('Firestore AI profile read:', err);
        }
      }

      if (isMounted) {
        setProfileData(loaded);
        setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user.id, user.email, user.isLoggedIn]);

  // Save to LocalStorage + Firestore
  const handleSave = async (updated: AiProfileData) => {
    setIsSaving(true);
    setProfileData(updated);

    const storageKey = getStorageKey(user);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (_) {}

    const effectiveId = user.id || (user.email ? user.email.toLowerCase().trim() : null);
    if (user.isLoggedIn && effectiveId) {
      try {
        const ref = doc(db, 'users', effectiveId, 'ai_profile', 'profile');
        await setDoc(
          ref,
          {
            ...updated,
            userId: effectiveId,
            userEmail: user.email || '',
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );

        // Also keep brain knowledge in sync
        const brainRef = doc(db, 'users', effectiveId, 'brain', 'knowledge');
        await setDoc(
          brainRef,
          {
            facts: [
              ...updated.explicitPreferences,
              ...updated.importantNames,
              ...updated.corrections,
              ...updated.goals,
            ].slice(0, 40),
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore AI profile save error:', err);
      }
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddItem = (sectionKey: keyof AiProfileData) => {
    const text = newItemText.trim();
    if (!text) return;
    const list = (profileData[sectionKey] as string[]) || [];
    const updated: AiProfileData = {
      ...profileData,
      [sectionKey]: [...list, text],
      lastUpdated: new Date().toISOString(),
    };
    handleSave(updated);
    setNewItemText('');
  };

  const handleDeleteItem = (sectionKey: keyof AiProfileData, index: number) => {
    const list = (profileData[sectionKey] as string[]) || [];
    const updated: AiProfileData = {
      ...profileData,
      [sectionKey]: list.filter((_, idx) => idx !== index),
      lastUpdated: new Date().toISOString(),
    };
    handleSave(updated);
  };

  const sections: {
    key: keyof AiProfileData;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'explicitPreferences',
      title: 'Explicit Preferences',
      description: 'Your strict rules, tone expectations, and custom conversational guidelines',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-500/10',
    },
    {
      key: 'communicationStyle',
      title: 'Communication & Learning Style',
      description: 'Preferred explanations, step-by-step depth, and multilingual handling',
      icon: <MessageSquare className="w-4 h-4 text-blue-400" />,
      color: 'border-blue-500/30 bg-blue-500/10',
    },
    {
      key: 'answerFormat',
      title: 'Answer Length & Formatting',
      description: 'Structure, markdown conventions, visual responses, and code blocks',
      icon: <Sliders className="w-4 h-4 text-emerald-400" />,
      color: 'border-emerald-500/30 bg-emerald-500/10',
    },
    {
      key: 'goals',
      title: 'Goals & Curricula',
      description: 'Your target qualifications, subjects, and study objectives',
      icon: <Target className="w-4 h-4 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-500/10',
    },
    {
      key: 'ongoingTasks',
      title: 'Ongoing Tasks & Projects',
      description: 'Active revision plans, solved paper series, and documents',
      icon: <ListTodo className="w-4 h-4 text-indigo-400" />,
      color: 'border-indigo-500/30 bg-indigo-500/10',
    },
    {
      key: 'importantNames',
      title: 'Important Names & Terms',
      description: 'Co-owners, collaborators, key subject definitions, and mnemonics',
      icon: <Tag className="w-4 h-4 text-rose-400" />,
      color: 'border-rose-500/30 bg-rose-500/10',
    },
    {
      key: 'corrections',
      title: 'Saved Corrections & Nuances',
      description: 'Learned adjustments and phrasing corrections made by you',
      icon: <AlertCircle className="w-4 h-4 text-sky-400" />,
      color: 'border-sky-500/30 bg-sky-500/10',
    },
    {
      key: 'studySources',
      title: 'Study Sources & Knowledge Base',
      description: 'Saved websites, past paper repositories, and YouTube study playlists',
      icon: <BookOpen className="w-4 h-4 text-teal-400" />,
      color: 'border-teal-500/30 bg-teal-500/10',
    },
  ];

  return (
    <div
      id="sigma-ai-profile-section"
      className="p-4 sm:p-6 bg-[#13151b] border border-white/5 rounded-2xl sm:rounded-3xl shadow-xl space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${themeColorHex}20`, border: `1.5px solid ${themeColorHex}60` }}
          >
            <Brain className="w-5 h-5" style={{ color: themeColorHex }} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Your AI Profile</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-normal">
                What Sigma Knows
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Personalized knowledge, persistent preferences & co-owner sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Synced</span>
            </span>
          )}
          {isSaving && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-400 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          <span
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700/60"
            title="Persisted in Firestore cloud database"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Cloud Synced</span>
          </span>
        </div>
      </div>

      {/* Persistence Guarantee Callout */}
      <div className="p-3 rounded-xl bg-[#181c26] border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Persistent Account Knowledge:</strong> Everything in this AI Profile survives browser refresh, relogins, and clearing recent chats. It directly shapes Sigma's answers for you and your co-owners.
        </p>
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Loading your AI profile...</span>
        </div>
      ) : (
        /* 8 Structured Content Boxes */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {sections.map((sec) => {
            const items = (profileData[sec.key] as string[]) || [];
            const isEditing = editingSection === sec.key;

            return (
              <div
                key={sec.key}
                className="p-3.5 rounded-xl bg-[#171a23] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg border ${sec.color} flex-shrink-0`}>
                        {sec.icon}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{sec.title}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingSection(isEditing ? null : sec.key);
                        setNewItemText('');
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title={isEditing ? 'Close Edit Mode' : 'Edit Section'}
                    >
                      {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 mb-2 leading-tight">
                    {sec.description}
                  </p>

                  {/* Items List */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {items.length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic py-1">
                        No custom entries yet. Click the edit icon to add.
                      </div>
                    ) : (
                      items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#10131b] border border-slate-800/80 text-slate-200 text-xs group"
                        >
                          <span className="flex-1 break-words leading-relaxed select-text">
                            {item}
                          </span>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(sec.key, idx)}
                              className="text-red-400 hover:text-red-300 p-0.5 rounded cursor-pointer opacity-80 hover:opacity-100 flex-shrink-0"
                              title="Delete this detail"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Inline Add Box */}
                {isEditing && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder={`Add new ${sec.title.toLowerCase()}...`}
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddItem(sec.key);
                        }
                      }}
                      className="flex-1 bg-[#0c0f17] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddItem(sec.key)}
                      disabled={!newItemText.trim()}
                      className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white cursor-pointer transition-colors"
                      title="Add"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
