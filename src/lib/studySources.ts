// Study Sources & Central Education Workspace Management
export type StudySourceCategory =
  | 'board'
  | 'learning_platform'
  | 'video'
  | 'video_channel'
  | 'custom_website'
  | 'curriculum';

export interface StudySource {
  id: string;
  name: string;
  category: StudySourceCategory;
  url: string;
  description: string;
  enabled: boolean;
  isOfficial?: boolean;
  isOfficialBoard?: boolean;
  categoryLabel?: string;
  gradeLevels?: string[];
  isCustom?: boolean;
  isTemporary?: boolean;
  verifiedAt?: string;
  accessNotes?: string;
}

export interface StudyImageMaterial {
  id: string;
  name: string;
  description: string;
  dataUrl: string;
  createdAt: number;
  tags?: string[];
  fileSizeBytes?: number;
}

export const STARTER_STUDY_SOURCES: StudySource[] = [
  {
    id: 'cambridge-assessment',
    name: 'Cambridge Assessment International Education (CAIE)',
    category: 'board',
    categoryLabel: 'Official Board',
    url: 'https://www.cambridgeinternational.org',
    description: 'Official syllabuses, past paper guidelines, grade thresholds, and examiner reports for IGCSE, O Level, and AS & A Level.',
    enabled: true,
    isOfficial: true,
    isOfficialBoard: true,
    verifiedAt: 'Official Board Verified',
    accessNotes: 'Direct syllabus and past paper indexing',
    gradeLevels: ['O Level', 'A Level', 'IGCSE']
  },
  {
    id: 'aku-eb',
    name: 'Aga Khan University Examination Board (AKU-EB)',
    category: 'board',
    categoryLabel: 'Official Board',
    url: 'https://examinationboard.aku.edu',
    description: 'Conceptual assessment standards, student learning outcomes (SLOs), and model papers for SSC and HSSC.',
    enabled: true,
    isOfficial: true,
    isOfficialBoard: true,
    verifiedAt: 'Official Board Verified',
    accessNotes: 'Student Learning Outcome (SLO) curriculum',
    gradeLevels: ['SSC', 'HSSC']
  },
  {
    id: 'fbise',
    name: 'Federal Board of Intermediate and Secondary Education (FBISE)',
    category: 'board',
    categoryLabel: 'Official Board',
    url: 'https://www.fbise.edu.pk',
    description: 'National curriculum alignment, SLO-based examination patterns, model question banks, and official notifications.',
    enabled: true,
    isOfficial: true,
    isOfficialBoard: true,
    verifiedAt: 'Official Board Verified',
    accessNotes: 'Federal Board examinations and model papers',
    gradeLevels: ['SSC I-II', 'HSSC I-II']
  },
  {
    id: 'khan-academy',
    name: 'Khan Academy',
    category: 'learning_platform',
    categoryLabel: 'Learning Platform',
    url: 'https://www.khanacademy.org',
    description: 'Mastery-based STEM lessons, interactive practice exercises, calculus, physics, and chemistry foundational deep-dives.',
    enabled: true,
    verifiedAt: 'Verified Partner',
    accessNotes: 'Interactive STEM exercises and video courses',
    gradeLevels: ['Middle School', 'High School', 'College']
  },
  {
    id: 'bbc-bitesize',
    name: 'BBC Bitesize',
    category: 'learning_platform',
    categoryLabel: 'Revision Guide',
    url: 'https://www.bbc.co.uk/bitesize',
    description: 'Structured revision guides, interactive summaries, quizzes, and diagrams tailored to UK GCSE and international curricula.',
    enabled: true,
    verifiedAt: 'Verified Revision Resource',
    gradeLevels: ['GCSE', 'Secondary']
  },
  {
    id: 'khan-academy-youtube',
    name: 'Khan Academy (YouTube Channel)',
    category: 'video_channel',
    categoryLabel: 'Educational Video',
    url: 'https://www.youtube.com/@khanacademy',
    description: 'Concise conceptual video lectures explaining intuition, visual proofs, and real-world science applications.',
    enabled: true,
    verifiedAt: 'Verified Channel',
    accessNotes: 'High-yield conceptual walkthroughs',
    gradeLevels: ['All Levels']
  }
];

const STORAGE_KEY = 'sigma_study_sources_v1';
const PREFER_OFFICIAL_KEY = 'sigma_prefer_official_boards_v1';
const MASTER_SWITCH_KEY = 'sigma_study_sources_master_enabled_v1';
const IMAGES_STORAGE_KEY = 'sigma_study_images_materials_v1';

// Master ON/OFF Switch
export function isStudySourcesMasterEnabled(): boolean {
  try {
    const raw = localStorage.getItem(MASTER_SWITCH_KEY);
    return raw !== null ? raw === 'true' : true;
  } catch {
    return true;
  }
}

export function setStudySourcesMasterEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(MASTER_SWITCH_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('sigma-study-sources-master-changed', { detail: { enabled } }));
  } catch (e) {
    console.error('Failed to save study sources master switch:', e);
  }
}

export function canAiUseStudySources(): boolean {
  if (!isStudySourcesMasterEnabled()) return false;
  const sources = getStudySources();
  return sources.some(s => s.enabled);
}

// Stored Study Sources
export function getStudySources(): StudySource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return STARTER_STUDY_SOURCES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse saved study sources:', e);
  }
  return STARTER_STUDY_SOURCES;
}

export function saveStudySources(sources: StudySource[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
    window.dispatchEvent(new CustomEvent('sigma-study-sources-updated'));
  } catch (e) {
    console.error('Failed to save study sources:', e);
  }
}

export function isPreferOfficialBoard(): boolean {
  try {
    const val = localStorage.getItem(PREFER_OFFICIAL_KEY);
    return val !== null ? val === 'true' : true;
  } catch {
    return true;
  }
}

export function setPreferOfficialBoard(prefer: boolean): void {
  try {
    localStorage.setItem(PREFER_OFFICIAL_KEY, prefer ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to save prefer official boards:', e);
  }
}

export function addCustomStudySource(source: Omit<StudySource, 'id'>): StudySource {
  const current = getStudySources();
  const newSource: StudySource = {
    ...source,
    id: 'custom-' + Date.now(),
    isCustom: true
  };
  const updated = [newSource, ...current];
  saveStudySources(updated);
  return newSource;
}

export function removeCustomStudySource(id: string): StudySource[] {
  const current = getStudySources();
  const updated = current.filter(s => s.id !== id);
  saveStudySources(updated);
  return updated;
}

// User-added Image Materials with Custom Name & Description
export function getStudyImageMaterials(): StudyImageMaterial[] {
  try {
    const raw = localStorage.getItem(IMAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.warn('Failed to parse study image materials:', e);
  }
  return [];
}

export function saveStudyImageMaterial(name: string, description: string, dataUrl: string, tags?: string[]): StudyImageMaterial {
  const list = getStudyImageMaterials();
  const newItem: StudyImageMaterial = {
    id: 'study-img-' + Date.now(),
    name: name.trim() || 'Untitled Diagram',
    description: description.trim(),
    dataUrl,
    createdAt: Date.now(),
    tags: tags || [],
    fileSizeBytes: Math.round(dataUrl.length * 0.75)
  };
  const updated = [newItem, ...list];
  try {
    localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sigma-study-images-updated'));
  } catch (e) {
    console.error('Failed to save study image material:', e);
  }
  return newItem;
}

export function deleteStudyImageMaterial(id: string): StudyImageMaterial[] {
  const list = getStudyImageMaterials();
  const updated = list.filter(img => img.id !== id);
  try {
    localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sigma-study-images-updated'));
  } catch (e) {
    console.error('Failed to delete study image material:', e);
  }
  return updated;
}

// Aliases matching consumers
export const getStoredStudySources = getStudySources;
export const addCustomSource = addCustomStudySource;
export const removeCustomSource = removeCustomStudySource;
export const getPreferOfficialExamBoards = isPreferOfficialBoard;
export const setPreferOfficialExamBoards = setPreferOfficialBoard;

export function toggleSourceEnabled(id: string): StudySource[] {
  const list = getStudySources();
  const updated = list.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
  saveStudySources(updated);
  return updated;
}

export function toggleCategoryEnabled(category: string, enabled: boolean): StudySource[] {
  const list = getStudySources();
  const updated = list.map(s => (category === 'all' || s.category === category) ? { ...s, enabled } : s);
  saveStudySources(updated);
  return updated;
}
