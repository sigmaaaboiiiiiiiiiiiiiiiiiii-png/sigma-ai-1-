import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  AlertCircle,
  X,
  Play,
  Pause,
  Filter,
  Repeat,
  Tag,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface ScheduledTask {
  id: string;
  title: string;
  subject: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  timezone: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'completed' | 'paused';
  notes?: string;
  createdAt: number;
}

const STORAGE_KEY = 'sigma_schedule_tasks_v1';

export function getScheduledTasks(): ScheduledTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultTasks: ScheduledTask[] = [
        {
          id: 'task-1',
          title: 'CAIE Biology 0610 Paper 4 Revision',
          subject: 'Biology',
          scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          scheduledTime: '16:00',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          priority: 'high',
          recurring: 'weekly',
          status: 'pending',
          notes: 'Focus on Human Nutrition, Respiration & Genetics past papers.',
          createdAt: Date.now() - 3600000,
        },
        {
          id: 'task-2',
          title: 'Mathematics Pure 1 Differentiation Drills',
          subject: 'Mathematics',
          scheduledDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          scheduledTime: '18:30',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          priority: 'medium',
          recurring: 'none',
          status: 'pending',
          notes: 'Solve 2023 May/June Paper 12 questions 4-8.',
          createdAt: Date.now() - 7200000,
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTasks));
      return defaultTasks;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error('Failed to load scheduled tasks:', e);
  }
  return [];
}

export function saveScheduledTasks(tasks: ScheduledTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent('sigma-schedule-updated'));
  } catch (e) {
    console.error('Failed to save scheduled tasks:', e);
  }
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskSigmaAi?: (prompt: string) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onAskSigmaAi,
}) => {
  const [tasks, setTasks] = useState<ScheduledTask[]>(() => getScheduledTasks());
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('Biology');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('15:00');
  const [formTimezone, setFormTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [formPriority, setFormPriority] = useState<ScheduledTask['priority']>('medium');
  const [formRecurring, setFormRecurring] = useState<ScheduledTask['recurring']>('none');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    const handleUpdate = () => setTasks(getScheduledTasks());
    window.addEventListener('sigma-schedule-updated', handleUpdate);
    return () => window.removeEventListener('sigma-schedule-updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormTitle('');
    setFormSubject('General Study');
    setFormDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setFormTime('17:00');
    setFormPriority('medium');
    setFormRecurring('none');
    setFormNotes('');
    setIsEditing(true);
  };

  const handleOpenEdit = (t: ScheduledTask) => {
    setEditingId(t.id);
    setFormTitle(t.title);
    setFormSubject(t.subject);
    setFormDate(t.scheduledDate);
    setFormTime(t.scheduledTime);
    setFormTimezone(t.timezone);
    setFormPriority(t.priority);
    setFormRecurring(t.recurring);
    setFormNotes(t.notes || '');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingId) {
      const updated = tasks.map((t) =>
        t.id === editingId
          ? {
              ...t,
              title: formTitle.trim(),
              subject: formSubject.trim(),
              scheduledDate: formDate,
              scheduledTime: formTime,
              timezone: formTimezone,
              priority: formPriority,
              recurring: formRecurring,
              notes: formNotes.trim(),
            }
          : t
      );
      setTasks(updated);
      saveScheduledTasks(updated);
    } else {
      const newTask: ScheduledTask = {
        id: 'task-' + Date.now(),
        title: formTitle.trim(),
        subject: formSubject.trim(),
        scheduledDate: formDate,
        scheduledTime: formTime,
        timezone: formTimezone,
        priority: formPriority,
        recurring: formRecurring,
        status: 'pending',
        notes: formNotes.trim(),
        createdAt: Date.now(),
      };
      const updated = [newTask, ...tasks];
      setTasks(updated);
      saveScheduledTasks(updated);
    }
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveScheduledTasks(updated);
  };

  const handleToggleComplete = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status: (t.status === 'completed' ? 'pending' : 'completed') as ScheduledTask['status'],
          }
        : t
    );
    setTasks(updated);
    saveScheduledTasks(updated);
  };

  const handleTogglePause = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status: (t.status === 'paused' ? 'pending' : 'paused') as ScheduledTask['status'],
          }
        : t
    );
    setTasks(updated);
    saveScheduledTasks(updated);
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'upcoming' && t.status === 'completed') return false;
    if (activeTab === 'completed' && t.status !== 'completed') return false;
    if (selectedSubject !== 'all' && t.subject !== selectedSubject) return false;
    return true;
  });

  const subjects = Array.from(new Set(tasks.map((t) => t.subject)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0c1017] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#101622]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Study Schedule & Timetable
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-medium">
                  {tasks.filter((t) => t.status === 'pending').length} Upcoming
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Organize revision sessions, past paper drills, and recurring study reminders.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Session</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Controls: Tabs & Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Upcoming Tasks ({tasks.filter((t) => t.status !== 'completed').length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'completed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Completed ({tasks.filter((t) => t.status === 'completed').length})
              </button>
            </div>

            {subjects.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Subject:</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-blue-500"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-900/30 rounded-2xl border border-slate-800/80">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">
                {activeTab === 'upcoming' ? 'No upcoming tasks scheduled' : 'No completed tasks yet'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {activeTab === 'upcoming'
                  ? 'Plan your revision sessions, past paper practices, and test targets.'
                  : 'Complete tasks to track your study consistency and syllabus coverage.'}
              </p>
              {activeTab === 'upcoming' && (
                <button
                  onClick={handleOpenAdd}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  + Add First Task
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border transition-all ${
                    t.status === 'completed'
                      ? 'bg-slate-900/30 border-slate-800/60 opacity-60'
                      : t.status === 'paused'
                      ? 'bg-amber-950/20 border-amber-800/40'
                      : 'bg-[#121722] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleComplete(t.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors"
                        title={t.status === 'completed' ? 'Mark Pending' : 'Mark Completed'}
                      >
                        {t.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold ${
                              t.status === 'completed' ? 'line-through text-slate-400' : 'text-white'
                            }`}
                          >
                            {t.title}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-semibold">
                            {t.subject}
                          </span>
                          {t.priority === 'urgent' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 font-bold">
                              Urgent
                            </span>
                          )}
                          {t.priority === 'high' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold">
                              High Priority
                            </span>
                          )}
                          {t.recurring !== 'none' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center gap-1 font-medium">
                              <Repeat className="w-2.5 h-2.5" />
                              {t.recurring}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {t.scheduledDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {t.scheduledTime} ({t.timezone})
                          </span>
                        </div>

                        {t.notes && <p className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">{t.notes}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {onAskSigmaAi && (
                        <button
                          onClick={() => {
                            onAskSigmaAi(
                              `Help me prepare for my scheduled study session: "${t.title}" for ${t.subject}. Provide a 30-minute structured revision breakdown and 5 practice questions.`
                            );
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="Generate AI Revision Plan"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Prep</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleTogglePause(t.id)}
                        className="p-1.5 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title={t.status === 'paused' ? 'Resume Task' : 'Pause Task'}
                      >
                        {t.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-blue-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Form for Add/Edit */}
        {isEditing && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0e141f] border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">
                  {editingId ? 'Edit Scheduled Session' : 'Schedule New Study Session'}
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Title / Topic
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Physics 0625 Paper 2 Revision"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder="e.g. Physics"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Time</label>
                    <input
                      type="time"
                      required
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Recurring Frequency
                  </label>
                  <select
                    value={formRecurring}
                    onChange={(e) => setFormRecurring(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Repeats Daily</option>
                    <option value="weekly">Repeats Weekly</option>
                    <option value="monthly">Repeats Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Notes / Syllabus Goals (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Specific questions, topics, or formulas to focus on..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer"
                  >
                    {editingId ? 'Save Changes' : 'Schedule Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
