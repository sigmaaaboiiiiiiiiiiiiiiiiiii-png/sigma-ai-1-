import React, { useState } from 'react';
import {
  Compass,
  Search,
  Sparkles,
  BookOpen,
  Code,
  GraduationCap,
  Atom,
  Calculator,
  Languages,
  X,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface ExploreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

interface ExploreItem {
  id: string;
  category: 'past_papers' | 'stem' | 'humanities' | 'code' | 'essays';
  title: string;
  description: string;
  prompt: string;
  badge: string;
}

const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: 'exp-1',
    category: 'past_papers',
    title: 'CAIE Past Paper Command Word Breakdown',
    description: 'Learn the exact marking difference between "Describe", "Explain", "Discuss", and "Evaluate".',
    prompt: 'Explain the difference in Cambridge mark scheme expectations between the command words "Describe", "Explain", and "Evaluate" with concrete biology and physics examples.',
    badge: 'Exam Technique',
  },
  {
    id: 'exp-2',
    category: 'stem',
    title: 'Photosynthesis Light vs Dark Reaction Derivation',
    description: 'Step-by-step visual lesson on ATP/NADPH synthesis and the Calvin Cycle.',
    prompt: 'Explain the light-dependent and light-independent stages of photosynthesis step-by-step for Cambridge IGCSE Biology (0610), including ATP and NADPH roles.',
    badge: 'Biology 0610',
  },
  {
    id: 'exp-3',
    category: 'stem',
    title: 'Differentiation & Stationary Points Step-by-Step',
    description: 'Calculus derivation of local maxima, minima, and points of inflection with worked examples.',
    prompt: 'Walk me through solving stationary points and determining their nature using the second derivative test in AS Level Mathematics (9709) with a full worked example.',
    badge: 'Maths 9709',
  },
  {
    id: 'exp-4',
    category: 'stem',
    title: 'Electromagnetic Induction & Lenz’s Law',
    description: 'Intuitive physics breakdown of Faraday’s Law and induced EMF direction.',
    prompt: 'Explain Faraday\'s law of electromagnetic induction and Lenz\'s law with real-world transformer and generator diagrams for O Level Physics (5054).',
    badge: 'Physics 5054',
  },
  {
    id: 'exp-5',
    category: 'past_papers',
    title: 'AKU-EB Conceptual SLO Assessment Practice',
    description: 'High-order thinking questions aligned with Aga Khan University Student Learning Outcomes.',
    prompt: 'Generate 3 high-order thinking conceptual questions for AKU-EB SSC Part II Physics on Current Electricity with detailed step-by-step mark allocations.',
    badge: 'AKU-EB SLO',
  },
  {
    id: 'exp-6',
    category: 'past_papers',
    title: 'FBISE Model Paper Question Bank',
    description: 'Federal Board Section B & C structured question breakdown.',
    prompt: 'Break down the federal board (FBISE) examination format for Class 10 Chemistry and test me on Chemical Equilibrium with model answer guidelines.',
    badge: 'FBISE Matric',
  },
  {
    id: 'exp-7',
    category: 'humanities',
    title: 'Pakistan Studies 2059 Paper 1 Timeline',
    description: 'Chronological events from 1857 to 1947 with high-yield 7-mark & 14-mark essay prompts.',
    prompt: 'Provide a chronological revision roadmap for CAIE Pakistan Studies (2059/01) Section 2 from the Khilafat Movement to the Pakistan Resolution 1940, highlighting key 14-mark question points.',
    badge: 'Pak Studies',
  },
  {
    id: 'exp-8',
    category: 'code',
    title: 'Python Binary Search & Sorting Algorithms',
    description: 'Visual code walkthrough of algorithm time complexity and recursive implementation.',
    prompt: 'Explain the Binary Search algorithm in Python step-by-step with Big-O time complexity analysis and an interactive code example.',
    badge: 'Computer Science',
  },
];

export const ExploreModal: React.FC<ExploreModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = EXPLORE_ITEMS.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0c1017] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#101622]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Explore Study Topics & Prompts
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-medium">
                  Curated Curricula
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Discover high-yield exam revision prompts, interactive science drills, and syllabus walkthroughs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800 bg-[#0e131d] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics, subjects, syllabus codes..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'past_papers', label: 'Past Papers' },
              { id: 'stem', label: 'STEM & Math' },
              { id: 'humanities', label: 'Humanities & Urdu' },
              { id: 'code', label: 'Computer Science' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectPrompt(item.prompt);
                onClose();
              }}
              className="group p-4 rounded-xl bg-[#121722] hover:bg-[#161d2b] border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-purple-500/10"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {item.badge}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-purple-400">
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3" />
                  Ask Sigma AI
                </span>
                <span className="text-slate-500 group-hover:text-slate-400">Click to start &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
