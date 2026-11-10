import {
  PowerPointPresentation,
  PresentationPalette,
  PresentationStyleConfig,
  PresentationStyleId,
  PresentationAnimationOption,
  PresentationTransitionOption,
  SlideData,
  SlideCardItem,
  SlideLayoutType,
  SlideTransitionType,
  SlideAnimationStyle,
  SlideHeaderAlignment,
} from '../types/presentation';
import { correctTopicTypos } from './powerpointIntent';

export const ANIMATION_OPTION_LIST: PresentationAnimationOption[] = [
  {
    id: 'fade',
    name: 'Fade',
    tagline: 'Smooth opacity fade-in',
    description: 'Titles, cards, and visuals fade smoothly into view in sequence.',
  },
  {
    id: 'appear',
    name: 'Appear',
    tagline: 'Crisp step-by-step appearance',
    description: 'Each slide section appears cleanly one stage at a time without motion blur.',
  },
  {
    id: 'fly-in',
    name: 'Fly In',
    tagline: 'Dynamic directional entry',
    description: 'Slide elements fly in swiftly from the side into their layout positions.',
  },
  {
    id: 'float-in',
    name: 'Float In',
    tagline: 'Gentle upward float reveal',
    description: 'Cards and key points float gently upward with soft easing.',
  },
  {
    id: 'wipe',
    name: 'Wipe',
    tagline: 'Directional progressive wipe',
    description: 'Reveals each content card with a clean horizontal wipe motion.',
  },
  {
    id: 'split',
    name: 'Split',
    tagline: 'Center-outward expansion',
    description: 'Elements open outward from the center axis of each card.',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    tagline: 'Crisp center scale-in',
    description: 'Content blocks scale up smoothly from 85% to full size.',
  },
  {
    id: 'vibe',
    name: 'Vibe & Wiggle',
    tagline: 'High-energy lively pop',
    description: 'Cards pop in with an energetic spring scale and subtle vibe settle.',
  },
  {
    id: 'grow-turn',
    name: 'Grow and Turn',
    tagline: 'Subtle rotation & scale',
    description: 'Elements grow into place with a refined rotational settle.',
  },
  {
    id: 'rise-up',
    name: 'Rise Up',
    tagline: 'Energetic vertical lift',
    description: 'Cards rise up from the bottom edge with spring-like momentum.',
  },
  {
    id: 'slide-in',
    name: 'Slide In',
    tagline: 'Staggered horizontal glide',
    description: 'Points glide smoothly from left to right in staggered order.',
  },
  {
    id: 'reveal',
    name: 'Reveal',
    tagline: 'Curtain unmasking effect',
    description: 'Unveils headings and explained points with a smooth clip reveal.',
  },
  {
    id: 'wheel',
    name: 'Wheel',
    tagline: 'Circular arc sweep',
    description: 'Elements sweep into alignment with a subtle rotational arc.',
  },
  {
    id: 'shape',
    name: 'Shape',
    tagline: 'Geometric mask expansion',
    description: 'Expands each card from a rounded geometric mask to full frame.',
  },
  {
    id: 'swivel',
    name: 'Swivel',
    tagline: '3D perspective turn',
    description: 'Cards swivel smoothly along the vertical axis into focus.',
  },
  {
    id: 'random-bars',
    name: 'Random Bars',
    tagline: 'Alternating bar reveal',
    description: 'Staggered alternating horizontal reveal across slide sections.',
  },
];

export const TRANSITION_OPTION_LIST: PresentationTransitionOption[] = [
  {
    id: 'none',
    name: 'None',
    tagline: 'Instant slide switch',
    description: 'Switches between slides immediately with no transition motion.',
  },
  {
    id: 'fade',
    name: 'Fade',
    tagline: 'Smooth cross-fade',
    description: 'Gently dissolves from one slide into the next.',
  },
  {
    id: 'push',
    name: 'Push',
    tagline: 'Directional stage push',
    description: 'The incoming slide pushes the previous slide across the screen.',
  },
  {
    id: 'wipe',
    name: 'Wipe',
    tagline: 'Clean horizontal wipe',
    description: 'Wipes across the widescreen canvas from right to left.',
  },
  {
    id: 'split',
    name: 'Split',
    tagline: 'Center split opening',
    description: 'The new slide expands outward from the center of the stage.',
  },
  {
    id: 'reveal',
    name: 'Reveal',
    tagline: 'Smooth curtain reveal',
    description: 'Unveils the incoming slide with a subtle scale and fade.',
  },
  {
    id: 'cover',
    name: 'Cover',
    tagline: 'Slide-over deck cover',
    description: 'The next slide glides over the top of the current slide.',
  },
  {
    id: 'uncover',
    name: 'Uncover',
    tagline: 'Pull-away reveal',
    description: 'Lifts the current slide away to reveal the next slide underneath.',
  },
  {
    id: 'dissolve',
    name: 'Dissolve',
    tagline: 'Soft optical dissolve',
    description: 'Blends slides together with a subtle optical blur dissolve.',
  },
  {
    id: 'cut',
    name: 'Cut',
    tagline: 'Crisp editorial cut',
    description: 'Fast, high-contrast editorial cut between slides.',
  },
  {
    id: 'random',
    name: 'Random',
    tagline: 'Varied slide transitions',
    description: 'Automatically varies the transition style from slide to slide.',
  },
  {
    id: 'shape',
    name: 'Shape',
    tagline: 'Iris shape expansion',
    description: 'Reveals the next slide through an expanding geometric iris.',
  },
  {
    id: 'morph',
    name: 'Morph',
    tagline: 'Smooth spatial interpolation',
    description: 'Fluidly morphs depth, scale, and position between slides.',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    tagline: 'Optical depth zoom',
    description: 'Zooms smoothly forward into the incoming slide canvas.',
  },
  {
    id: 'gallery',
    name: 'Gallery',
    tagline: '3D stage gallery shift',
    description: 'Shifts between slides with a 3D presentation gallery perspective.',
  },
];

export const PRESENTATION_STYLES: Record<PresentationStyleId, PresentationStyleConfig> = {
  balanced: {
    id: 'balanced',
    name: 'Modern Balanced',
    tagline: 'Clean sans-serif, varied layouts & balanced spacing',
    description: 'Balanced whitespace, rounded cards, and varied slide-to-slide header placement.',
    fontHeading: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    headingWeight: 800,
    headingTracking: '-0.02em',
    titlePosition: 'varied',
    textAlignment: 'left',
    spacingMode: 'balanced',
    cardRadiusPx: 14,
    cardBorderWidthPx: 1,
    cardAccentPosition: 'top',
    cardShadow: '0 8px 24px rgba(0, 0, 0, 0.14)',
    badgeShape: 'rounded',
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial Magazine',
    tagline: 'Serif headings, left-aligned blocks & generous whitespace',
    description: 'Warm editorial typography, left accent bars, and magazine-inspired visual hierarchy.',
    fontHeading: "Georgia, 'Playfair Display', 'Times New Roman', serif",
    fontBody: "'Inter', system-ui, sans-serif",
    headingWeight: 700,
    headingTracking: '-0.01em',
    titlePosition: 'left',
    textAlignment: 'left',
    spacingMode: 'generous',
    cardRadiusPx: 6,
    cardBorderWidthPx: 1,
    cardAccentPosition: 'left',
    cardShadow: '4px 4px 0px rgba(0, 0, 0, 0.12)',
    badgeShape: 'underline',
  },
  'bold-geometric': {
    id: 'bold-geometric',
    name: 'Bold Geometric',
    tagline: 'Bold sans-serif, centered titles & strong geometric blocks',
    description: 'High-contrast geometric frames, centered statements, and structured compact blocks.',
    fontHeading: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    headingWeight: 900,
    headingTracking: '-0.03em',
    titlePosition: 'center',
    textAlignment: 'center',
    spacingMode: 'compact',
    cardRadiusPx: 4,
    cardBorderWidthPx: 2,
    cardAccentPosition: 'full',
    cardShadow: '6px 6px 0px rgba(0, 0, 0, 0.28)',
    badgeShape: 'sharp',
  },
  notebook: {
    id: 'notebook',
    name: 'Classroom Notebook',
    tagline: 'Educational feel, notebook composition & friendly cards',
    description: 'Designed for student learning with friendly pill badges, clear cards, and warm structure.',
    fontHeading: "'Plus Jakarta Sans', 'Trebuchet MS', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    headingWeight: 800,
    headingTracking: '-0.01em',
    titlePosition: 'left',
    textAlignment: 'left',
    spacingMode: 'balanced',
    cardRadiusPx: 18,
    cardBorderWidthPx: 2,
    cardAccentPosition: 'bottom',
    cardShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
    badgeShape: 'pill',
  },
  academic: {
    id: 'academic',
    name: 'Academic Lecture',
    tagline: 'Scholarly serif headings, clear top hierarchy & structured cards',
    description: 'Formal classroom and university presentation layout with clear side-by-side comparisons.',
    fontHeading: "Georgia, 'Cambria', 'Times New Roman', serif",
    fontBody: "'Inter', system-ui, sans-serif",
    headingWeight: 700,
    headingTracking: '0em',
    titlePosition: 'split',
    textAlignment: 'left',
    spacingMode: 'balanced',
    cardRadiusPx: 8,
    cardBorderWidthPx: 1,
    cardAccentPosition: 'top',
    cardShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
    badgeShape: 'rounded',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Statement',
    tagline: 'Large statement typography, airy whitespace & subtle frames',
    description: 'Removes visual clutter so key explanations and numbers stand out with maximum clarity.',
    fontHeading: "'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    headingWeight: 700,
    headingTracking: '-0.025em',
    titlePosition: 'left',
    textAlignment: 'left',
    spacingMode: 'generous',
    cardRadiusPx: 12,
    cardBorderWidthPx: 1,
    cardAccentPosition: 'none',
    cardShadow: 'none',
    badgeShape: 'pill',
  },
  technical: {
    id: 'technical',
    name: 'Technical Blueprint',
    tagline: 'Precision grid layout, crisp borders & structured data blocks',
    description: 'Engineered for STEM, computing, and analytical topics with sharp corners and structured steps.',
    fontHeading: "'Space Grotesk', 'JetBrains Mono', monospace, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    headingWeight: 800,
    headingTracking: '-0.02em',
    titlePosition: 'split',
    textAlignment: 'left',
    spacingMode: 'dense',
    cardRadiusPx: 3,
    cardBorderWidthPx: 1,
    cardAccentPosition: 'left',
    cardShadow: '0 4px 16px rgba(0, 0, 0, 0.22)',
    badgeShape: 'sharp',
  },
};

export const STYLE_LIST: PresentationStyleConfig[] = Object.values(PRESENTATION_STYLES);

export function getStyleConfig(
  styleId?: PresentationStyleId | string,
  palette?: PresentationPalette
): PresentationStyleConfig {
  if (styleId && styleId in PRESENTATION_STYLES) {
    return PRESENTATION_STYLES[styleId as PresentationStyleId];
  }
  const dir = palette?.styleDirection || '';
  if (dir === 'editorial' || dir === 'documentary' || dir === 'newspaper') {
    return PRESENTATION_STYLES['editorial'];
  }
  if (dir === 'blueprint' || dir === 'technical') {
    return PRESENTATION_STYLES['technical'];
  }
  if (dir === 'notebook') {
    return PRESENTATION_STYLES['notebook'];
  }
  if (dir === 'corporate' || dir === 'bold') {
    return PRESENTATION_STYLES['bold-geometric'];
  }
  if (dir === 'minimalist') {
    return PRESENTATION_STYLES['minimal'];
  }
  if (dir === 'academic' || dir === 'scientific') {
    return PRESENTATION_STYLES['academic'];
  }
  return PRESENTATION_STYLES['balanced'];
}

export const PRESENTATION_PALETTES: Record<string, PresentationPalette> = {
  'blueprint-technical': {
    id: 'blueprint-technical',
    shortName: 'Technical',
    category: 'Technical',
    name: 'Technical (Engineering Blueprint Cobalt & Cyan)',
    styleDirection: 'blueprint',
    isDark: true,
    bgPrimary: '#071326',
    bgSecondary: '#0C1F3D',
    cardBg: '#10284E',
    cardBorder: '#1E4985',
    textPrimary: '#F0F7FF',
    textSecondary: '#BAE6FD',
    textMuted: '#7DD3FC',
    accentPrimary: '#0EA5E9',
    accentSecondary: '#38BDF8',
    accentHighlight: '#F59E0B',
    badgeBg: 'rgba(14, 165, 233, 0.2)',
    badgeText: '#7DD3FC',
    fontHeading: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'sharp',
    bgPattern: 'grid',
    borderStyle: 'left-accent',
    chartStyle: 'sharp-meter',
    iconStyle: 'outline-box',
  },
  'editorial-magazine': {
    id: 'editorial-magazine',
    shortName: 'Editorial',
    category: 'Editorial',
    name: 'Editorial (Warm Ivory & Crimson)',
    styleDirection: 'editorial',
    isDark: false,
    bgPrimary: '#FAF8F5',
    bgSecondary: '#F3EFEA',
    cardBg: '#FFFFFF',
    cardBorder: '#E5DEC9',
    textPrimary: '#18181B',
    textSecondary: '#3F3F46',
    textMuted: '#71717A',
    accentPrimary: '#BE123C',
    accentSecondary: '#0F766E',
    accentHighlight: '#D97706',
    badgeBg: 'rgba(190, 18, 60, 0.1)',
    badgeText: '#9F1239',
    fontHeading: "Georgia, 'Times New Roman', serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'editorial',
    bgPattern: 'editorial-lines',
    borderStyle: 'editorial-offset',
    chartStyle: 'rounded-bar',
    iconStyle: 'filled-badge',
  },
  'scientific-clean': {
    id: 'scientific-clean',
    shortName: 'Scientific',
    category: 'Scientific',
    name: 'Scientific (Ice White & Laboratory Teal)',
    styleDirection: 'scientific',
    isDark: false,
    bgPrimary: '#F4F9F9',
    bgSecondary: '#E6F4F1',
    cardBg: '#FFFFFF',
    cardBorder: '#CBD5E1',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    accentPrimary: '#0D9488',
    accentSecondary: '#0284C7',
    accentHighlight: '#7C3AED',
    badgeBg: 'rgba(13, 148, 136, 0.12)',
    badgeText: '#0F766E',
    fontHeading: "'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'rounded',
    bgPattern: 'grid',
    borderStyle: 'top-accent',
    chartStyle: 'rounded-bar',
    iconStyle: 'circle-tint',
  },
  'documentary-archive': {
    id: 'documentary-archive',
    shortName: 'Documentary',
    category: 'Documentary',
    name: 'Documentary (Archive Charcoal & Amber Gold)',
    styleDirection: 'documentary',
    isDark: true,
    bgPrimary: '#141210',
    bgSecondary: '#1F1B18',
    cardBg: '#26211D',
    cardBorder: '#443B32',
    textPrimary: '#FAF5EF',
    textSecondary: '#E7DDD3',
    textMuted: '#A89B8C',
    accentPrimary: '#D97706',
    accentSecondary: '#EAB308',
    accentHighlight: '#EF4444',
    badgeBg: 'rgba(217, 119, 6, 0.2)',
    badgeText: '#FCD34D',
    fontHeading: "Georgia, 'Times New Roman', serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'editorial',
    bgPattern: 'diagonal',
    borderStyle: 'left-accent',
    chartStyle: 'sharp-meter',
    iconStyle: 'outline-box',
  },
  'pbl-notebook': {
    id: 'pbl-notebook',
    shortName: 'Notebook',
    category: 'Notebook',
    name: 'Notebook (Classroom Indigo, Teal & Amber)',
    styleDirection: 'notebook',
    isDark: true,
    bgPrimary: '#0F1026',
    bgSecondary: '#181A3B',
    cardBg: '#20234D',
    cardBorder: '#373C7A',
    textPrimary: '#F8FAFC',
    textSecondary: '#E0E7FF',
    textMuted: '#A5B4FC',
    accentPrimary: '#6366F1',
    accentSecondary: '#14B8A6',
    accentHighlight: '#F59E0B',
    badgeBg: 'rgba(99, 102, 241, 0.22)',
    badgeText: '#C7D2FE',
    fontHeading: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'notebook',
    bgPattern: 'dots',
    borderStyle: 'top-accent',
    chartStyle: 'pill-track',
    iconStyle: 'filled-badge',
  },
  'navy-purple-cyan': {
    id: 'navy-purple-cyan',
    shortName: 'Dark',
    category: 'Dark',
    name: 'Dark (Midnight Navy, Violet & Cyan)',
    styleDirection: 'dark-cinematic',
    isDark: true,
    bgPrimary: '#0B1120',
    bgSecondary: '#131C31',
    cardBg: '#17223B',
    cardBorder: '#2A3B63',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    accentPrimary: '#8B5CF6',
    accentSecondary: '#06B6D4',
    accentHighlight: '#EC4899',
    badgeBg: 'rgba(139, 92, 246, 0.2)',
    badgeText: '#C4B5FD',
    fontHeading: "'Space Grotesk', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'pill-accent',
    bgPattern: 'radial-glow',
    borderStyle: 'top-accent',
    chartStyle: 'pill-track',
    iconStyle: 'circle-tint',
  },
  'light-purple-pink': {
    id: 'light-purple-pink',
    shortName: 'Modern',
    category: 'Modern',
    name: 'Modern (Alabaster, Violet & Cyan)',
    styleDirection: 'minimalist',
    isDark: false,
    bgPrimary: '#F8FAFC',
    bgSecondary: '#EEF2FF',
    cardBg: '#FFFFFF',
    cardBorder: '#CBD5E1',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    accentPrimary: '#7C3AED',
    accentSecondary: '#0891B2',
    accentHighlight: '#DB2777',
    badgeBg: 'rgba(124, 58, 237, 0.12)',
    badgeText: '#6D28D9',
    fontHeading: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'rounded',
    bgPattern: 'dots',
    borderStyle: 'top-accent',
    chartStyle: 'rounded-bar',
    iconStyle: 'filled-badge',
  },
  'emerald-cyan-navy': {
    id: 'emerald-cyan-navy',
    shortName: 'Ecology',
    category: 'Scientific',
    name: 'Ecology (Forest Emerald & Sunlit Gold)',
    styleDirection: 'nature',
    isDark: true,
    bgPrimary: '#07171E',
    bgSecondary: '#0D2630',
    cardBg: '#11303D',
    cardBorder: '#1E4E63',
    textPrimary: '#F0FDF4',
    textSecondary: '#CCFBF1',
    textMuted: '#94A3B8',
    accentPrimary: '#10B981',
    accentSecondary: '#06B6D4',
    accentHighlight: '#FACC15',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeText: '#6EE7B7',
    fontHeading: "'Space Grotesk', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'rounded',
    bgPattern: 'radial-glow',
    borderStyle: 'left-accent',
    chartStyle: 'rounded-bar',
    iconStyle: 'circle-tint',
  },
  'royal-blue-gold': {
    id: 'royal-blue-gold',
    shortName: 'Bold',
    category: 'Bold',
    name: 'Bold (Royal Navy, Electric Blue & Gold)',
    styleDirection: 'corporate',
    isDark: true,
    bgPrimary: '#0A1128',
    bgSecondary: '#14213D',
    cardBg: '#192A51',
    cardBorder: '#2B4570',
    textPrimary: '#FFFFFF',
    textSecondary: '#E2E8F0',
    textMuted: '#94A3B8',
    accentPrimary: '#3B82F6',
    accentSecondary: '#06B6D4',
    accentHighlight: '#F59E0B',
    badgeBg: 'rgba(59, 130, 246, 0.2)',
    badgeText: '#93C5FD',
    fontHeading: "'Space Grotesk', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'sharp',
    bgPattern: 'editorial-lines',
    borderStyle: 'full-border',
    chartStyle: 'sharp-meter',
    iconStyle: 'outline-box',
  },
  'sunset-orange-purple': {
    id: 'sunset-orange-purple',
    shortName: 'Colorful',
    category: 'Colorful',
    name: 'Colorful (Sunset Plum, Coral & Magenta)',
    styleDirection: 'modern-infographic',
    isDark: true,
    bgPrimary: '#160F24',
    bgSecondary: '#221736',
    cardBg: '#2B1D44',
    cardBorder: '#4A3275',
    textPrimary: '#FFF7ED',
    textSecondary: '#E9D5FF',
    textMuted: '#A78BFA',
    accentPrimary: '#F97316',
    accentSecondary: '#EC4899',
    accentHighlight: '#A855F7',
    badgeBg: 'rgba(249, 115, 22, 0.2)',
    badgeText: '#FDBA74',
    fontHeading: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'pill-accent',
    bgPattern: 'diagonal',
    borderStyle: 'top-accent',
    chartStyle: 'pill-track',
    iconStyle: 'filled-badge',
  },
  'academic-classic': {
    id: 'academic-classic',
    shortName: 'Academic',
    category: 'Academic',
    name: 'Academic (Oxford Navy, Parchment & Crimson)',
    styleDirection: 'academic',
    isDark: false,
    bgPrimary: '#F7F5F0',
    bgSecondary: '#EDE8DC',
    cardBg: '#FFFFFF',
    cardBorder: '#D6CEBF',
    textPrimary: '#1E293B',
    textSecondary: '#334155',
    textMuted: '#64748B',
    accentPrimary: '#1E3A8A',
    accentSecondary: '#991B1B',
    accentHighlight: '#B45309',
    badgeBg: 'rgba(30, 58, 138, 0.12)',
    badgeText: '#1E3A8A',
    fontHeading: "Georgia, 'Cambria', serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'editorial',
    bgPattern: 'editorial-lines',
    borderStyle: 'top-accent',
    chartStyle: 'sharp-meter',
    iconStyle: 'outline-box',
  },
  'minimal-clean': {
    id: 'minimal-clean',
    shortName: 'Minimal',
    category: 'Minimal',
    name: 'Minimal (Pure White, Slate & Charcoal)',
    styleDirection: 'minimalist',
    isDark: false,
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F8FAFC',
    cardBg: '#F8FAFC',
    cardBorder: '#E2E8F0',
    textPrimary: '#09090B',
    textSecondary: '#3F3F46',
    textMuted: '#71717A',
    accentPrimary: '#18181B',
    accentSecondary: '#2563EB',
    accentHighlight: '#0D9488',
    badgeBg: 'rgba(37, 99, 235, 0.1)',
    badgeText: '#1D4ED8',
    fontHeading: "'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'rounded',
    bgPattern: 'none',
    borderStyle: 'minimal',
    chartStyle: 'rounded-bar',
    iconStyle: 'circle-tint',
  },
  'soft-pastel': {
    id: 'soft-pastel',
    shortName: 'Soft',
    category: 'Soft',
    name: 'Soft (Warm Blush, Sage & Lavender)',
    styleDirection: 'notebook',
    isDark: false,
    bgPrimary: '#FDFBF9',
    bgSecondary: '#F5EFEA',
    cardBg: '#FFFFFF',
    cardBorder: '#E9DFD5',
    textPrimary: '#292524',
    textSecondary: '#44403C',
    textMuted: '#78716C',
    accentPrimary: '#E11D48',
    accentSecondary: '#0D9488',
    accentHighlight: '#7C3AED',
    badgeBg: 'rgba(225, 29, 72, 0.1)',
    badgeText: '#BE123C',
    fontHeading: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'pill-accent',
    bgPattern: 'dots',
    borderStyle: 'top-accent',
    chartStyle: 'pill-track',
    iconStyle: 'circle-tint',
  },
  'newspaper-press': {
    id: 'newspaper-press',
    shortName: 'Newspaper',
    category: 'Newspaper',
    name: 'Newspaper (Newsprint Cream, Ink Black & Scarlet)',
    styleDirection: 'newspaper',
    isDark: false,
    bgPrimary: '#F4F1EA',
    bgSecondary: '#E9E4D8',
    cardBg: '#FAF8F3',
    cardBorder: '#27272A',
    textPrimary: '#111111',
    textSecondary: '#27272A',
    textMuted: '#52525B',
    accentPrimary: '#DC2626',
    accentSecondary: '#1D4ED8',
    accentHighlight: '#B45309',
    badgeBg: 'rgba(220, 38, 38, 0.12)',
    badgeText: '#991B1B',
    fontHeading: "Georgia, 'Times New Roman', serif",
    fontBody: "Georgia, 'Inter', serif",
    cardRadius: 'sharp',
    bgPattern: 'newspaper',
    borderStyle: 'editorial-offset',
    chartStyle: 'sharp-meter',
    iconStyle: 'outline-box',
  },
  'geometric-studio': {
    id: 'geometric-studio',
    shortName: 'Geometric',
    category: 'Geometric',
    name: 'Geometric (Obsidian, Electric Indigo & Emerald)',
    styleDirection: 'bold',
    isDark: true,
    bgPrimary: '#090D16',
    bgSecondary: '#111827',
    cardBg: '#1E293B',
    cardBorder: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#E2E8F0',
    textMuted: '#94A3B8',
    accentPrimary: '#6366F1',
    accentSecondary: '#10B981',
    accentHighlight: '#F43F5E',
    badgeBg: 'rgba(99, 102, 241, 0.2)',
    badgeText: '#A5B4FC',
    fontHeading: "'Space Grotesk', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'sharp',
    bgPattern: 'grid',
    borderStyle: 'full-border',
    chartStyle: 'sharp-meter',
    iconStyle: 'filled-badge',
  },
  'creative-canvas': {
    id: 'creative-canvas',
    shortName: 'Creative',
    category: 'Creative',
    name: 'Creative (Studio Cream, Magenta & Teal)',
    styleDirection: 'modern-infographic',
    isDark: false,
    bgPrimary: '#FFFDF9',
    bgSecondary: '#FEF3C7',
    cardBg: '#FFFFFF',
    cardBorder: '#FDE68A',
    textPrimary: '#1E1B4B',
    textSecondary: '#312E81',
    textMuted: '#6366F1',
    accentPrimary: '#DB2777',
    accentSecondary: '#0D9488',
    accentHighlight: '#EA580C',
    badgeBg: 'rgba(219, 39, 119, 0.12)',
    badgeText: '#9D174D',
    fontHeading: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    cardRadius: 'notebook',
    bgPattern: 'radial-glow',
    borderStyle: 'editorial-offset',
    chartStyle: 'pill-track',
    iconStyle: 'filled-badge',
  },
};

export const PALETTE_LIST = Object.values(PRESENTATION_PALETTES);

const RECENT_STYLES_STORAGE_KEY = 'sigma_recent_ppt_styles';

function getRecentStyleIds(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(RECENT_STYLES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordUsedStyleId(paletteId: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const recent = getRecentStyleIds().filter((id) => id !== paletteId);
    recent.unshift(paletteId);
    localStorage.setItem(RECENT_STYLES_STORAGE_KEY, JSON.stringify(recent.slice(0, 4)));
  } catch {
    // ignore storage errors
  }
}

/**
 * Selects a topic-appropriate visual style while guaranteeing we NEVER repeat
 * the immediately previous presentation style (Requirements 16, 17, 18, 21).
 */
export function selectPaletteForTopic(
  topic: string,
  hint?: string,
  avoidPaletteId?: string
): PresentationPalette {
  const combined = `${topic} ${hint || ''}`.toLowerCase();
  const recentIds = getRecentStyleIds();
  const lastUsedId = avoidPaletteId || recentIds[0];

  let candidates: string[] = [];

  if (/\b(light\s+theme|white\s+background|bright\s+theme)\b/i.test(combined)) {
    candidates = ['editorial-magazine', 'scientific-clean', 'light-purple-pink'];
  } else if (/\b(dark\s+theme|dark\s+mode|cinematic)\b/i.test(combined)) {
    candidates = ['navy-purple-cyan', 'blueprint-technical', 'documentary-archive', 'royal-blue-gold'];
  } else if (/\b(cad|engineering|architecture|mechanical|3d\s+model|drafting|blueprint|robotics|hardware|circuit)\b/i.test(combined)) {
    candidates = ['blueprint-technical', 'royal-blue-gold', 'scientific-clean'];
  } else if (/\b(pbl|project[\s-]*based|school\s+project|inquiry|classroom)\b/i.test(combined)) {
    candidates = ['pbl-notebook', 'editorial-magazine', 'navy-purple-cyan'];
  } else if (/\b(1857|war|history|revolution|empire|ancient|colonial|pakistan|independence|century|dynasty)\b/i.test(combined)) {
    candidates = ['documentary-archive', 'editorial-magazine', 'royal-blue-gold'];
  } else if (/\b(photosynthesis|biology|climate|environment|pollution|nature|earth|ecology|water|forest|green|energy)\b/i.test(combined)) {
    candidates = ['emerald-cyan-navy', 'scientific-clean', 'editorial-magazine'];
  } else if (/\b(science|physics|chemistry|atom|dna|medicine|health|research|data)\b/i.test(combined)) {
    candidates = ['scientific-clean', 'blueprint-technical', 'emerald-cyan-navy'];
  } else if (/\b(ai|artificial\s+intelligence|software|internet|cyber|coding|algorithm|future)\b/i.test(combined)) {
    candidates = ['navy-purple-cyan', 'blueprint-technical', 'sunset-orange-purple'];
  } else {
    candidates = PALETTE_LIST.map((p) => p.id);
  }

  // Filter out the most recently used style so consecutive decks always look visually distinct
  const nonRepeating = candidates.filter((id) => id !== lastUsedId && !recentIds.slice(0, 2).includes(id));
  const fallbackNonRepeating = candidates.filter((id) => id !== lastUsedId);
  const chosenId =
    nonRepeating[0] ||
    fallbackNonRepeating[0] ||
    PALETTE_LIST.find((p) => p.id !== lastUsedId)?.id ||
    candidates[0] ||
    'blueprint-technical';

  recordUsedStyleId(chosenId);
  return PRESENTATION_PALETTES[chosenId] || PRESENTATION_PALETTES['blueprint-technical'];
}

const LAYOUT_ROTATION: SlideLayoutType[] = [
  'title',
  'definition',
  'two-column',
  'three-column',
  'comparison',
  'process',
  'four-card-grid',
  'timeline',
  'statistics',
  'cause-effect',
  'problem-solution',
  'case-study',
  'text-diagram',
  'quote',
  'conclusion',
];

const TRANSITION_ROTATION: SlideTransitionType[] = [
  'fade',
  'push',
  'wipe',
  'reveal',
  'zoom',
  'morph',
];

const ANIMATION_ROTATION: SlideAnimationStyle[] = [
  'fade',
  'float-in',
  'rise-up',
  'zoom',
  'slide-in',
];

export function parseUserContentFormatPreference(userPrompt?: string): {
  minPointsPerSlide: number;
  preferShortSlides: boolean;
  preferParagraphs: boolean;
} {
  const lower = String(userPrompt || '').toLowerCase();
  if (!lower) {
    return { minPointsPerSlide: 5, preferShortSlides: false, preferParagraphs: false };
  }

  const preferShortSlides = /\b(short\s+slides|brief\s+slides|keep\s+it\s+short|minimal\s+text|less\s+text)\b/i.test(
    lower
  );
  const preferParagraphs = /\b(paragraphs?\s+instead\s+of\s+bullets?|use\s+paragraphs?)\b/i.test(
    lower
  );

  const explicitPointMatch = lower.match(
    /\b(\d|two|three|four|five|six)\s+(?:detailed\s+|meaningful\s+|explained\s+)?points?(?:\s+per\s+slide|\s+on\s+each\s+slide)?\b/i
  );
  if (explicitPointMatch) {
    const raw = explicitPointMatch[1].toLowerCase();
    const map: Record<string, number> = {
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
    };
    const parsed = map[raw] || parseInt(raw, 10);
    if (parsed >= 2 && parsed <= 6) {
      return {
        minPointsPerSlide: parsed,
        preferShortSlides,
        preferParagraphs,
      };
    }
  }

  if (preferShortSlides) {
    return { minPointsPerSlide: 3, preferShortSlides: true, preferParagraphs };
  }

  return { minPointsPerSlide: 5, preferShortSlides: false, preferParagraphs };
}

/**
 * Ensures every content slide has at least `minPoints` (default 5) well-explained points in Easy English,
 * and never leaves a slide with just a single short sentence or bare labels (Requirements 2, 3, 4, 5, 7, 8).
 */
function ensureSlideHasDetailedPoints(
  slide: SlideData,
  topic: string,
  slideIdx: number,
  minPoints = 5
): SlideData {
  const cleanTopic = topic || 'this subject';
  const slideTitle = slide.title || cleanTopic;
  const icons = ['layers', 'zap', 'compass', 'globe', 'check-circle', 'book-open', 'shield', 'award'];

  // 1. Expand any card whose content is just a short fragment or repeats the heading
  let existingCards: SlideCardItem[] = (slide.cards || []).map((c, cIdx) => {
    let content = (c.content || '').trim();
    const title = (c.title || `Key Point ${cIdx + 1}`).trim();
    if (!content || content.length < 28 || content.toLowerCase() === title.toLowerCase()) {
      content = `${title} is an important part of ${slideTitle} that helps explain how ${cleanTopic} works in real life.`;
    }
    return {
      ...c,
      title,
      content,
      icon: c.icon || icons[cIdx % icons.length],
      badge: c.badge || `POINT 0${cIdx + 1}`,
    };
  });

  // Convert bulletPoints into explained cards if cards are empty or sparse
  if (existingCards.length < minPoints && Array.isArray(slide.bulletPoints) && slide.bulletPoints.length > 0) {
    for (const bp of slide.bulletPoints) {
      if (existingCards.length >= minPoints) break;
      const cleanBp = String(bp || '').trim();
      if (!cleanBp) continue;
      const parts = cleanBp.split(/[:–—-]\s+/);
      const candidateTitle = parts.length > 1 ? parts[0].trim() : `Key Aspect ${existingCards.length + 1}`;
      const candidateContent =
        parts.length > 1
          ? parts.slice(1).join(': ').trim()
          : cleanBp.length >= 28
          ? cleanBp
          : `${cleanBp} plays a direct role in understanding ${slideTitle}.`;
      if (!existingCards.some((ec) => ec.title.toLowerCase() === candidateTitle.toLowerCase())) {
        existingCards.push({
          title: candidateTitle,
          content: candidateContent,
          icon: icons[existingCards.length % icons.length],
          badge: `POINT 0${existingCards.length + 1}`,
        });
      }
    }
  }

  // Title slide (Slide 1) looks best with 3 to 5 hero summary cards
  if (slideIdx === 0 || slide.layout === 'title') {
    const titleTarget = Math.max(3, Math.min(5, existingCards.length || 3));
    const fallbackHeroPoints: SlideCardItem[] = [
      {
        title: `What ${cleanTopic} Means`,
        content: `${cleanTopic} is an important subject with clear principles that we can observe and understand in everyday life.`,
        icon: 'book-open',
        badge: '01 · MEANING',
      },
      {
        title: 'Main Parts & Structure',
        content: `Understanding the main parts of ${cleanTopic} shows how each component works together as a complete system.`,
        icon: 'layers',
        badge: '02 · STRUCTURE',
      },
      {
        title: 'Real-World Importance',
        content: `${cleanTopic} connects classroom learning to real-world science, technology, and daily decision-making.`,
        icon: 'globe',
        badge: '03 · IMPORTANCE',
      },
    ];
    while (existingCards.length < titleTarget) {
      const fb = fallbackHeroPoints[existingCards.length % fallbackHeroPoints.length];
      existingCards.push({ ...fb, badge: `0${existingCards.length + 1} · KEY IDEA` });
    }
    return { ...slide, cards: existingCards };
  }

  // 2. For dual-column comparison / problem-solution slides, ensure at least 5–6 total explained items across both columns
  if (
    (slide.layout === 'comparison' || slide.layout === 'problem-solution') &&
    (slide.leftColumn || slide.rightColumn)
  ) {
    const leftItems = [...(slide.leftColumn?.items || [])].filter(Boolean);
    const rightItems = [...(slide.rightColumn?.items || [])].filter(Boolean);
    const minPerCol = Math.max(2, Math.ceil(minPoints / 2)); // 3 per column = 6 total points for default 5

    const leftFallbacks = [
      `Key Feature: Explains how ${slide.leftColumn?.title || cleanTopic} operates in everyday situations.`,
      `Main Role: Provides essential structure and clear organization within ${cleanTopic}.`,
      `Practical Example: Seen directly in real-world schools, homes, and community systems.`,
    ];
    const rightFallbacks = [
      `Key Feature: Shows how ${slide.rightColumn?.title || cleanTopic} addresses practical needs and outcomes.`,
      `Main Role: Balances efficiency, accuracy, and long-term reliability in practice.`,
      `Practical Example: Helps students and professionals solve everyday challenges effectively.`,
    ];

    while (leftItems.length < minPerCol) {
      leftItems.push(leftFallbacks[leftItems.length % leftFallbacks.length]);
    }
    while (rightItems.length < minPerCol) {
      rightItems.push(rightFallbacks[rightItems.length % rightFallbacks.length]);
    }

    return {
      ...slide,
      leftColumn: {
        title: slide.leftColumn?.title || `First Perspective on ${cleanTopic}`,
        subtitle: slide.leftColumn?.subtitle,
        badge: slide.leftColumn?.badge || 'SIDE A',
        items: leftItems,
      },
      rightColumn: {
        title: slide.rightColumn?.title || `Second Perspective on ${cleanTopic}`,
        subtitle: slide.rightColumn?.subtitle,
        badge: slide.rightColumn?.badge || 'SIDE B',
        items: rightItems,
      },
    };
  }

  // 3. For all other content slides, ensure at least `minPoints` (default 5) explained cards!
  // First, check if existing cards have sub-items we can promote into full explained cards
  if (existingCards.length < minPoints) {
    const promoted: SlideCardItem[] = [];
    for (const c of existingCards) {
      if (Array.isArray(c.items) && c.items.length > 0) {
        for (const it of c.items) {
          if (existingCards.length + promoted.length >= minPoints) break;
          const cleanIt = String(it || '').trim();
          if (!cleanIt) continue;
          const parts = cleanIt.split(/[:–—-]\s+/);
          promoted.push({
            title: parts.length > 1 ? parts[0].trim() : `${c.title} Detail`,
            content:
              parts.length > 1
                ? parts.slice(1).join(': ').trim()
                : cleanIt.length >= 25
                ? cleanIt
                : `${cleanIt} is an important detail of ${c.title}.`,
            icon: icons[(existingCards.length + promoted.length) % icons.length],
            badge: `POINT 0${existingCards.length + promoted.length + 1}`,
          });
        }
      }
    }
    existingCards = [...existingCards, ...promoted];
  }

  // Topic-aware supplementary points so every content slide reaches at least `minPoints` (5) explained points
  const topicSupplementPool: SlideCardItem[] = [
    {
      title: 'Core Function & Role',
      content: `In ${slideTitle}, each part has a specific job that keeps the overall process of ${cleanTopic} working smoothly.`,
      icon: 'layers',
      badge: 'FUNCTION',
    },
    {
      title: 'How the Parts Interact',
      content: `The elements of ${slideTitle} work together step by step rather than acting in isolation.`,
      icon: 'zap',
      badge: 'INTERACTION',
    },
    {
      title: 'Everyday Real-World Example',
      content: `We can observe ${slideTitle} in daily life, school experiments, and practical technology around us.`,
      icon: 'globe',
      badge: 'EXAMPLE',
    },
    {
      title: 'Why This Concept Matters',
      content: `Understanding ${slideTitle} makes it much easier to explain how ${cleanTopic} behaves and why it is useful.`,
      icon: 'compass',
      badge: 'IMPORTANCE',
    },
    {
      title: 'Key Detail to Remember',
      content: `Focusing on the main cause-and-effect relationships in ${slideTitle} helps students master ${cleanTopic}.`,
      icon: 'check-circle',
      badge: 'KEY DETAIL',
    },
  ];

  let poolIdx = 0;
  while (existingCards.length < minPoints && poolIdx < topicSupplementPool.length * 2) {
    const candidate = topicSupplementPool[poolIdx % topicSupplementPool.length];
    poolIdx++;
    if (!existingCards.some((c) => c.title.toLowerCase() === candidate.title.toLowerCase())) {
      existingCards.push({
        ...candidate,
        badge: `POINT 0${existingCards.length + 1}`,
      });
    }
  }

  return {
    ...slide,
    cards: existingCards,
  };
}

const ALIGNMENT_ROTATION: SlideHeaderAlignment[] = [
  'left',
  'split',
  'center',
  'left',
];

const BANNED_GENERIC_HEADINGS = [
  /^comprehensive\s+analysis$/i,
  /^core\s+foundation$/i,
  /^foundation(\s+of\s+.*)?$/i,
  /^clear\s+definition$/i,
  /^background\s+context$/i,
  /^why\s+.*\s+matters(\s+in\s+real\s+life)?$/i,
  /^meaning,\s*scope\s*&\s*why\s+it\s+matters/i,
  /^three\s+interconnected\s+pillars/i,
  /^how\s+the\s+process\s+unfolds\s+from\s+start\s+to\s+finish$/i,
  /^traditional\s+methods?\s+vs\.?\s+modern/i,
  /^conventional\s+vs\.?\s+evidence-based/i,
  /^conventional\s+approach$/i,
  /^traditional\s+method$/i,
  /^modern\s+approach$/i,
  /^practical\s+impact$/i,
  /^core\s+framework$/i,
  /^key\s+dynamics$/i,
  /^visual\s+breakdown$/i,
  /^strategic\s+framework$/i,
  /^mechanical\s+regression$/i,
  /^fundamental\s+overview$/i,
  /^practical\s+applications\s+across\s+education,\s*work\s*&\s*society$/i,
  /^overcoming\s+key\s+barriers\s+with\s+actionable\s+solutions$/i,
];

function sanitizeSlideHeading(
  rawHeading: string,
  topic: string,
  layout: SlideLayoutType,
  index: number,
  slide?: Partial<SlideData>
): string {
  const cleaned = correctTopicTypos(String(rawHeading || '').trim());
  const isBanned = BANNED_GENERIC_HEADINGS.some((rx) => rx.test(cleaned));
  const escapedTopic = topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isTopicTemplateRepeat = new RegExp(
    `^${escapedTopic}\\s+(\\d+|definition|background|importance|foundation|context|analysis|overview)$`,
    'i'
  ).test(cleaned);

  if (!cleaned || isBanned || isTopicTemplateRepeat) {
    // Derive a concrete heading from the slide's actual subject cards or columns
    if (slide?.leftColumn?.title && slide?.rightColumn?.title) {
      return `${slide.leftColumn.title} vs. ${slide.rightColumn.title}`;
    }
    if (slide?.cards && slide.cards.length >= 2 && slide.cards[0].title && slide.cards[1].title) {
      return `${slide.cards[0].title} & ${slide.cards[1].title}`;
    }
    if (slide?.cards && slide.cards.length === 1 && slide.cards[0].title) {
      return slide.cards[0].title;
    }
    switch (layout) {
      case 'definition':
        return `What Is ${topic} & How It Is Defined`;
      case 'comparison':
        return `Comparing ${topic} Across Key Dimensions`;
      case 'timeline':
        return `Chronological Development of ${topic}`;
      case 'process':
        return `How ${topic} Operates in Practice`;
      case 'statistics':
        return `Key Measurements & Empirical Data on ${topic}`;
      case 'cause-effect':
        return `Primary Factors & Effects in ${topic}`;
      case 'problem-solution':
        return `Technical Challenges & Solutions in ${topic}`;
      case 'case-study':
        return `Real-World Applications & Examples of ${topic}`;
      default:
        return `${topic}: Key Concepts & Structure (${index})`;
    }
  }
  return cleaned;
}

/**
 * Determines the appropriate language level from the topic/audience context (Requirement 2).
 */
export function determineLanguageLevel(topic: string, audience?: string): string {
  const combined = `${topic} ${audience || ''}`.toLowerCase();
  if (/\b(grade\s*[1-6]|class\s*[1-6]|kids|children|elementary|primary\s+school)\b/i.test(combined)) {
    return 'Grade 6 (Very Simple & Clear English)';
  }
  if (/\b(grade\s*7|class\s*7|middle\s+school|year\s*7)\b/i.test(combined)) {
    return 'Grade 7 (Simple & Direct English)';
  }
  if (/\b(grade\s*8|class\s*8|year\s*8)\b/i.test(combined)) {
    return 'Grade 8 (Simple & Informative English)';
  }
  if (/\b(grade\s*9|class\s*9|year\s*9|freshman)\b/i.test(combined)) {
    return 'Grade 9 (Clear Academic English)';
  }
  if (/\b(grade\s*1[0-2]|class\s*1[0-2]|high\s+school|secondary)\b/i.test(combined)) {
    return 'Grade 10 (Moderately Academic Clear English)';
  }
  if (/\b(university|college|phd|graduate|executive|professional|research)\b/i.test(combined)) {
    return 'University / Professional (Clear & Precise English)';
  }
  return 'General Clear English (Easy to Understand)';
}

const JARGON_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bpersistent\s+structural\s+disparities\b/gi, 'unfair differences'],
  [/\bmeasurable\s+opportunity\s+allocation\b/gi, 'equal opportunities'],
  [/\bglobal\s+measurable\s+opportunity\s+gaps\b/gi, 'global differences in opportunity'],
  [/\bmultidimensional\s+impact\b/gi, 'real-world impact'],
  [/\bfoundational\s+dynamics\b/gi, 'main ideas'],
  [/\bstrategic\s+intervention\s+framework\b/gi, 'practical action plan'],
  [/\bstructural\s+paradigm\b/gi, 'system'],
  [/\bparadigm(s)?\b/gi, 'approach$1'],
  [/\bautotrophs\s+convert\b/gi, 'plants convert'],
  [/\bsocio-economic\s+stratification\b/gi, 'social and economic inequality'],
  [/\binstitutional\s+gatekeeping\b/gi, 'unfair barriers in schools and workplaces'],
  [/\boccupational\s+segregation\b/gi, 'unequal access to higher-paying jobs'],
  [/\bwage\s+disparities\b/gi, 'unequal pay'],
  [/\bempirical\s+evidence\b/gi, 'verified facts and data'],
  [/\bchronological\s+progression\b/gi, 'step-by-step timeline'],
  [/\bequitable\s+distribution\s+of\s+multidimensional\s+opportunities\b/gi, 'equal rights and opportunities'],
];

const BANNED_META_CONTENT_PATTERNS: RegExp[] = [
  /core\s+meaning,\s*scope,\s*and(\s+the)?\s+real-world\s+concepts\s+that\s+define/i,
  /key\s+concepts\s+that\s+define/i,
  /real-world\s+concepts\s+that\s+define/i,
  /^this\s+slide\s+(explains|covers|discusses|shows|explores)/i,
  /^in\s+this\s+section\s+we\s+will\s+(discuss|explore|cover|learn)/i,
  /^the\s+following\s+slide\s+explores/i,
  /^understanding\s+the\s+concept\s+of/i,
  /^what\s+students\s+should\s+know/i,
  /^this\s+presentation\s+will\s+cover/i,
  /the\s+key\s+components,\s*mechanisms,\s*and\s*(step-by-step\s+)?processes\s+involved\s+in/i,
  /concrete\s+applications,\s*benefits,\s*limitations,\s*and\s+practical\s+takeaways/i,
  /explains\s+what\s+.*\s+is\s+and\s+the\s+specific\s+role\s+it\s+plays\s+within\s+its\s+subject\s+domain/i,
  /the\s+primary\s+elements,\s*participants,\s*or\s+building\s+blocks\s+that\s+make\s+up/i,
  /key\s+features\s+and\s+measurable\s+properties\s+that\s+distinguish\s+.*\s+in\s+practice/i,
];

export function isMetaContentText(text: string): boolean {
  if (!text) return false;
  return BANNED_META_CONTENT_PATTERNS.some((rx) => rx.test(text.trim()));
}

function replaceMetaContentIfDetected(text: string, topic: string): string {
  if (!text || !isMetaContentText(text)) return text;
  const cleanTopic = topic || 'this subject';
  return `${cleanTopic} plays a vital role in everyday life by connecting key ideas with practical real-world uses.`;
}

/**
 * Ensures every sentence is complete, easy to understand, and NEVER ends with "..." or fragments
 * (Requirements 1, 3, 4, 5, 6, 9, 10, 11, 14, 15).
 */
export function sanitizeTextToEasyEnglish(
  rawText: string,
  options?: { isHeading?: boolean; isStatValue?: boolean }
): string {
  if (!rawText) return '';
  let text = String(rawText).trim();

  // Remove any ellipsis shortcuts ("...", "…", "....") anywhere in the text
  text = text.replace(/(\.\.+|…+)/g, (match, _g1, offset, fullStr) => {
    const isAtEnd = offset + match.length >= fullStr.trim().length;
    return isAtEnd ? '.' : ' ';
  });

  // Replace overly complicated academic filler with simple, natural teacher English
  for (const [pattern, replacement] of JARGON_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  // Fix corrupted symbol "77¢" or "77C" when referring to earnings
  if (options?.isStatValue) {
    if (/^77\s*[¢cC]$/i.test(text)) {
      return '$0.77';
    }
    return text.replace(/\.+$/, '').trim();
  }

  text = text.replace(/\b77\s*[¢cC]\b/g, '77 cents');
  text = text.replace(/\s{2,}/g, ' ').trim();

  if (options?.isHeading) {
    // Headings should not end with trailing ellipsis or stray colons/commas
    text = text.replace(/[,:;.\-–—]+$/, '').trim();
    return text;
  }

  // If a sentence was cut off mid-phrase (e.g., ending with "in", "and", "or", "to", "for", "of", "the", "with")
  text = text.replace(/\s+\b(in|and|or|to|for|of|with|by|from|that|which|a|an|the)\.?$/i, '.');

  // Ensure body sentences end with complete terminal punctuation
  if (text.length > 18 && !/[.!?✓)]$/.test(text)) {
    text = `${text}.`;
  }

  return text;
}

/**
 * Validates and refines a generated presentation before delivery (Requirement 28 & Golden Rule):
 * - Enforces exact requested slide count
 * - Scrubs generic template headings ("Clear Definition", "Background Context", "Traditional vs Modern", etc.)
 * - Ensures all text uses Easy English with complete sentences and ZERO "..." placeholders
 * - Preserves topic-specific layouts (including comparison or technical slides on the final slide)
 * - Ensures consecutive slides never use identical layouts
 * - Assigns purposeful animations and varied transitions
 */
export function validateAndRefinePresentation(
  presentation: PowerPointPresentation,
  requestedSlideCount: number,
  userPrompt?: string
): PowerPointPresentation {
  const targetCount = Math.max(1, Math.min(25, requestedSlideCount || presentation.slides.length || 8));
  let slides = [...presentation.slides];

  if (slides.length > targetCount) {
    slides = slides.slice(0, targetCount);
  }

  const { minPointsPerSlide } = parseUserContentFormatPreference(userPrompt);
  const languageLevel =
    presentation.languageLevel || determineLanguageLevel(presentation.topic, presentation.audience);
  const styleConfig = getStyleConfig(presentation.styleId, presentation.palette);
  const defaultAnimId: SlideAnimationStyle = presentation.animationId || 'fade';
  const defaultTransId: SlideTransitionType = presentation.transitionId || 'fade';

  const seenTitles = new Set<string>();
  const middleLayouts: SlideLayoutType[] = [
    'definition',
    'three-column',
    'comparison',
    'process',
    'statistics',
    'cause-effect',
    'case-study',
    'four-card-grid',
    'problem-solution',
    'timeline',
    'two-column',
  ];

  const validatedSlides: SlideData[] = [];
  let prevLayout: SlideLayoutType | null = null;

  for (let idx = 0; idx < slides.length; idx++) {
    const rawSlide = slides[idx];
    const isFirst = idx === 0;
    let layout: SlideLayoutType = isFirst
      ? 'title'
      : rawSlide.layout && LAYOUT_ROTATION.includes(rawSlide.layout)
      ? rawSlide.layout
      : idx === slides.length - 1
      ? 'conclusion'
      : middleLayouts[idx % middleLayouts.length];

    // Prevent consecutive identical layouts on non-title slides (unless slide specifically has comparison columns or stats)
    const hasDedicatedColumns = Boolean(rawSlide.leftColumn && rawSlide.rightColumn);
    const hasDedicatedStats = Boolean(rawSlide.stats && rawSlide.stats.length > 0);
    if (!isFirst && prevLayout && prevLayout === layout && !hasDedicatedColumns && !hasDedicatedStats) {
      const candidate = middleLayouts[idx % middleLayouts.length];
      layout = candidate === prevLayout ? middleLayouts[(idx + 1) % middleLayouts.length] : candidate;
    }
    prevLayout = layout;

    let cleanTitle = isFirst
      ? sanitizeTextToEasyEnglish(correctTopicTypos(rawSlide.title || presentation.title), { isHeading: true })
      : sanitizeTextToEasyEnglish(
          sanitizeSlideHeading(rawSlide.title, presentation.topic, layout, idx + 1, rawSlide),
          { isHeading: true }
        );

    if (seenTitles.has(cleanTitle.toLowerCase()) && !isFirst) {
      cleanTitle = `${cleanTitle} (Part ${idx + 1})`;
    }
    seenTitles.add(cleanTitle.toLowerCase());

    // Ensure every content slide has at least `minPointsPerSlide` (default 5) explained points
    const s = ensureSlideHasDetailedPoints(
      { ...rawSlide, title: cleanTitle, layout },
      presentation.topic,
      idx,
      minPointsPerSlide
    );

    const animationStyle: SlideAnimationStyle =
      presentation.applyAnimationToAllSlides && presentation.animationId
        ? presentation.animationId
        : s.animationStyle || defaultAnimId || ANIMATION_ROTATION[idx % ANIMATION_ROTATION.length];

    const transitionStyle: SlideTransitionType =
      presentation.applyTransitionToAllSlides && presentation.transitionId
        ? presentation.transitionId
        : s.transition || defaultTransId || TRANSITION_ROTATION[idx % TRANSITION_ROTATION.length];

    const cleanCards = s.cards?.map((c) => ({
      ...c,
      title: sanitizeTextToEasyEnglish(c.title, { isHeading: true }),
      content: sanitizeTextToEasyEnglish(
        replaceMetaContentIfDetected(c.content, presentation.topic)
      ),
      statValue: c.statValue ? sanitizeTextToEasyEnglish(c.statValue, { isStatValue: true }) : undefined,
      statLabel: c.statLabel ? sanitizeTextToEasyEnglish(c.statLabel, { isHeading: true }) : undefined,
      items: c.items?.map((it) =>
        sanitizeTextToEasyEnglish(replaceMetaContentIfDetected(it, presentation.topic))
      ),
    }));

    const cleanLeftCol = s.leftColumn
      ? {
          ...s.leftColumn,
          title: sanitizeTextToEasyEnglish(s.leftColumn.title, { isHeading: true }),
          subtitle: s.leftColumn.subtitle
            ? sanitizeTextToEasyEnglish(s.leftColumn.subtitle, { isHeading: true })
            : undefined,
          items: (s.leftColumn.items || []).map((it) => sanitizeTextToEasyEnglish(it)),
        }
      : undefined;

    const cleanRightCol = s.rightColumn
      ? {
          ...s.rightColumn,
          title: sanitizeTextToEasyEnglish(s.rightColumn.title, { isHeading: true }),
          subtitle: s.rightColumn.subtitle
            ? sanitizeTextToEasyEnglish(s.rightColumn.subtitle, { isHeading: true })
            : undefined,
          items: (s.rightColumn.items || []).map((it) => sanitizeTextToEasyEnglish(it)),
        }
      : undefined;

    const cleanStats = s.stats?.map((st) => ({
      ...st,
      value: sanitizeTextToEasyEnglish(st.value, { isStatValue: true }),
      label: sanitizeTextToEasyEnglish(st.label, { isHeading: true }),
      description: st.description ? sanitizeTextToEasyEnglish(st.description) : undefined,
    }));

    validatedSlides.push({
      ...s,
      id: idx + 1,
      title: cleanTitle,
      subtitle: sanitizeTextToEasyEnglish(correctTopicTypos(s.subtitle || ''), { isHeading: true }),
      layout,
      cards: cleanCards,
      leftColumn: cleanLeftCol,
      rightColumn: cleanRightCol,
      stats: cleanStats,
      takeaway: s.takeaway ? sanitizeTextToEasyEnglish(s.takeaway, { isHeading: true }) : undefined,
      headerAlignment: s.headerAlignment || ALIGNMENT_ROTATION[idx % ALIGNMENT_ROTATION.length],
      transition: transitionStyle,
      animationStyle,
    });
  }

  return {
    ...presentation,
    title: sanitizeTextToEasyEnglish(correctTopicTypos(presentation.title), { isHeading: true }),
    subtitle: sanitizeTextToEasyEnglish(correctTopicTypos(presentation.subtitle), { isHeading: true }),
    languageLevel,
    styleId: presentation.styleId || styleConfig.id,
    animationId: presentation.animationId || defaultAnimId,
    transitionId: presentation.transitionId || defaultTransId,
    applyAnimationToAllSlides:
      presentation.applyAnimationToAllSlides !== undefined
        ? presentation.applyAnimationToAllSlides
        : true,
    applyTransitionToAllSlides:
      presentation.applyTransitionToAllSlides !== undefined
        ? presentation.applyTransitionToAllSlides
        : true,
    slides: validatedSlides,
  };
}

export function normalizePresentationData(
  raw: any,
  fallbackTopic: string,
  requestedSlideCount = 8,
  avoidPaletteId?: string,
  userPrompt?: string
): PowerPointPresentation {
  const cleanTopic = correctTopicTypos(fallbackTopic || raw?.topic || raw?.title || 'Presentation').trim();
  const title = correctTopicTypos(String(raw?.title || cleanTopic)).trim();
  const subtitle = String(
    raw?.subtitle || `Structured Visual Presentation • ${requestedSlideCount} Slides`
  ).trim();
  const palette =
    (raw?.paletteId &&
      raw.paletteId !== avoidPaletteId &&
      PRESENTATION_PALETTES[raw.paletteId]) ||
    selectPaletteForTopic(title, raw?.paletteHint, avoidPaletteId);

  const rawSlides: any[] = Array.isArray(raw?.slides) ? raw.slides : [];
  if (rawSlides.length === 0) {
    return generateFallbackPresentation(cleanTopic, requestedSlideCount, palette);
  }

  const slides: SlideData[] = rawSlides.map((s: any, idx: number) => {
    const isFirst = idx === 0;
    const isLast = idx === rawSlides.length - 1 && rawSlides.length > 2;
    let layout: SlideLayoutType = s.layout;

    if (!layout || !LAYOUT_ROTATION.includes(layout)) {
      if (isFirst) layout = 'title';
      else if (isLast) layout = 'conclusion';
      else layout = LAYOUT_ROTATION[(idx % (LAYOUT_ROTATION.length - 2)) + 1];
    }

    const cards = Array.isArray(s.cards)
      ? s.cards.map((c: any) => ({
          title: String(c.title || 'Key Dimension'),
          content: String(c.content || c.description || ''),
          icon: String(c.icon || 'sparkles'),
          badge: c.badge ? String(c.badge) : undefined,
          statValue: c.statValue ? String(c.statValue) : undefined,
          statLabel: c.statLabel ? String(c.statLabel) : undefined,
          items: Array.isArray(c.items) ? c.items.map(String) : undefined,
        }))
      : [];

    const bulletPoints = Array.isArray(s.bulletPoints)
      ? s.bulletPoints.map(String)
      : [];

    if (cards.length === 0 && bulletPoints.length > 0) {
      bulletPoints.forEach((bp: string, bIdx: number) => {
        const parts = bp.split(/[:–-]\s+/);
        cards.push({
          title: parts.length > 1 ? parts[0].trim() : `Key Point 0${bIdx + 1}`,
          content: parts.length > 1 ? parts.slice(1).join(': ').trim() : bp,
          icon: ['target', 'layers', 'zap', 'shield', 'globe', 'trending-up'][bIdx % 6],
          badge: `0${bIdx + 1}`,
        });
      });
    }

    const stats = Array.isArray(s.stats)
      ? s.stats.map((st: any, stIdx: number) => ({
          value: String(st.value || `${85 - stIdx * 12}%`),
          label: String(st.label || `Metric ${stIdx + 1}`),
          description: String(st.description || ''),
          percentage:
            typeof st.percentage === 'number'
              ? st.percentage
              : Math.max(25, Math.min(95, 85 - stIdx * 15)),
        }))
      : undefined;

    return {
      id: idx + 1,
      title: correctTopicTypos(String(s.title || (isFirst ? title : `Slide ${idx + 1}`))),
      subtitle: String(s.subtitle || ''),
      kicker: String(
        s.kicker ||
          (isFirst
            ? 'OVERVIEW & INTRODUCTION'
            : isLast
            ? 'KEY TAKEAWAYS'
            : `0${idx} · ${layout.toUpperCase()}`)
      ),
      layout,
      headerAlignment:
        s.headerAlignment || ALIGNMENT_ROTATION[idx % ALIGNMENT_ROTATION.length],
      transition: s.transition || TRANSITION_ROTATION[idx % TRANSITION_ROTATION.length],
      animationStyle: s.animationStyle,
      cards,
      bulletPoints,
      leftColumn: s.leftColumn
        ? {
            title: String(s.leftColumn.title || 'Perspective A'),
            subtitle: s.leftColumn.subtitle ? String(s.leftColumn.subtitle) : undefined,
            badge: s.leftColumn.badge ? String(s.leftColumn.badge) : undefined,
            items: Array.isArray(s.leftColumn.items)
              ? s.leftColumn.items.map(String)
              : [],
          }
        : undefined,
      rightColumn: s.rightColumn
        ? {
            title: String(s.rightColumn.title || 'Perspective B'),
            subtitle: s.rightColumn.subtitle ? String(s.rightColumn.subtitle) : undefined,
            badge: s.rightColumn.badge ? String(s.rightColumn.badge) : undefined,
            items: Array.isArray(s.rightColumn.items)
              ? s.rightColumn.items.map(String)
              : [],
          }
        : undefined,
      stats,
      quote: s.quote
        ? {
            text: String(s.quote.text || ''),
            author: String(s.quote.author || ''),
            role: s.quote.role ? String(s.quote.role) : undefined,
          }
        : undefined,
      diagramNodes: Array.isArray(s.diagramNodes)
        ? s.diagramNodes.map((n: any) => ({
            label: String(n.label || ''),
            detail: String(n.detail || ''),
          }))
        : undefined,
      takeaway: s.takeaway ? String(s.takeaway) : undefined,
      notes: s.notes ? String(s.notes) : `Speaker notes for ${s.title || `Slide ${idx + 1}`}.`,
    };
  });

  return validateAndRefinePresentation(
    {
      id: raw?.id || `ppt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      subtitle,
      topic: cleanTopic,
      audience: raw?.audience,
      isPbl: Boolean(raw?.isPbl),
      paletteId: palette.id,
      palette,
      styleId: raw?.styleId,
      animationId: raw?.animationId,
      transitionId: raw?.transitionId,
      applyAnimationToAllSlides: raw?.applyAnimationToAllSlides,
      applyTransitionToAllSlides: raw?.applyTransitionToAllSlides,
      savedSettings: raw?.savedSettings,
      lastSavedAt: raw?.lastSavedAt,
      slides,
      createdAt: raw?.createdAt || new Date().toISOString(),
    },
    requestedSlideCount,
    userPrompt
  );
}

function finalizeSlideDeck(
  baseSlides: SlideData[],
  requestedSlideCount: number,
  topicTitle: string,
  subtitle: string,
  palette: PresentationPalette,
  isPbl = false,
  audience?: string
): PowerPointPresentation {
  const count = Math.max(1, Math.min(25, requestedSlideCount));
  let selected: SlideData[] = [];

  if (count <= baseSlides.length) {
    // Select the top N concept slides in their pedagogical learning order
    selected = baseSlides.slice(0, count);
  } else {
    selected = [...baseSlides];
    const domainExpansionSlides: Omit<SlideData, 'id'>[] = [
      {
        kicker: 'TECHNICAL ARCHITECTURE & COMPONENTS',
        title: `Internal Structure & Component Interactions in ${topicTitle}`,
        subtitle: `How core sub-systems, interfaces, and mechanisms coordinate in ${topicTitle}`,
        layout: 'three-column',
        cards: [
          {
            title: 'Primary Structural Elements',
            content: `Core physical or conceptual units that form the backbone of ${topicTitle}.`,
            icon: 'layers',
            badge: '01 · STRUCTURE',
          },
          {
            title: 'Operational Rules & Protocols',
            content: `Governing standards, equations, or rules that regulate how components interact.`,
            icon: 'cpu',
            badge: '02 · OPERATION',
          },
          {
            title: 'System Output & Performance',
            content: `Measurable throughput, reliability, or observable results produced by the system.`,
            icon: 'trending-up',
            badge: '03 · OUTPUT',
          },
        ],
      },
      {
        kicker: 'REAL-WORLD CASE EXAMPLES',
        title: `Applied Case Studies & Examples of ${topicTitle}`,
        subtitle: `Concrete scenarios demonstrating how ${topicTitle} operates in practice`,
        layout: 'case-study',
        cards: [
          {
            title: 'Scenario 1: Institutional & Campus Deployment',
            content: `How schools, universities, and research centers implement ${topicTitle} to solve operational challenges.`,
            icon: 'graduation-cap',
            badge: 'EXAMPLE 01',
          },
          {
            title: 'Scenario 2: Municipal & Industrial Scale',
            content: `Large-scale deployment across city infrastructure, manufacturing, or regional systems.`,
            icon: 'globe',
            badge: 'EXAMPLE 02',
          },
          {
            title: 'Observed Benefits & Constraints',
            content: `Balancing high efficiency and scalability against setup cost, maintenance, and technical complexity.`,
            icon: 'scale',
            badge: 'EVALUATION',
          },
        ],
      },
      {
        kicker: 'ADVANTAGES & LIMITATIONS',
        title: `Strengths, Tradeoffs & Technical Limitations of ${topicTitle}`,
        subtitle: `Objective analysis of where ${topicTitle} excels and what constraints exist`,
        layout: 'problem-solution',
        leftColumn: {
          title: `Key Advantages of ${topicTitle}`,
          subtitle: 'Operational Strengths',
          badge: 'ADVANTAGES',
          items: [
            'High efficiency, structured organization, and reliable performance at scale',
            'Clear standards that enable interoperability and systematic troubleshooting',
            'Strong real-world utility across educational, civic, and technical environments',
          ],
        },
        rightColumn: {
          title: 'Practical Limitations & Constraints',
          subtitle: 'Engineering & Resource Tradeoffs',
          badge: 'LIMITATIONS',
          items: [
            'Requires specialized configuration, skilled maintenance, and initial investment',
            'Performance depends on underlying infrastructure quality and environmental factors',
            'Must be carefully matched to geographic scope or problem complexity',
          ],
        },
      },
    ];

    let idx = 0;
    while (selected.length < count) {
      const tmpl = domainExpansionSlides[idx % domainExpansionSlides.length];
      selected.push({
        ...tmpl,
        id: selected.length + 1,
      });
      idx++;
    }
  }

  const finalSlides = selected.map((s, i) => ({
    ...s,
    id: i + 1,
    headerAlignment: s.headerAlignment || ALIGNMENT_ROTATION[i % ALIGNMENT_ROTATION.length],
    transition: s.transition || TRANSITION_ROTATION[i % TRANSITION_ROTATION.length],
    animationStyle: s.animationStyle || ANIMATION_ROTATION[i % ANIMATION_ROTATION.length],
  }));

  return validateAndRefinePresentation(
    {
      id: `ppt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: topicTitle,
      subtitle: audience ? `${subtitle} • Tailored for ${audience}` : subtitle,
      topic: topicTitle,
      audience,
      isPbl,
      paletteId: palette.id,
      palette,
      slides: finalSlides,
      createdAt: new Date().toISOString(),
    },
    count
  );
}

/**
 * Generates a deeply researched, topic-specific, visually varied presentation
 * WITHOUT generic filler headings (Requirements 10, 11, 12, 13, 15, 16-22).
 */
export function generateFallbackPresentation(
  rawTopic: string,
  slideCount = 8,
  paletteOverride?: PresentationPalette,
  options?: { isPbl?: boolean; audience?: string }
): PowerPointPresentation {
  const cleanTopic = correctTopicTypos(rawTopic.trim() || 'Technology & Innovation');
  const lower = cleanTopic.toLowerCase();
  const isPbl = Boolean(options?.isPbl || /\b(pbl|project[\s-]*based)\b/i.test(lower));
  const audience = options?.audience;
  const palette = paletteOverride || selectPaletteForTopic(cleanTopic, isPbl ? 'pbl' : undefined);

  // =========================================================================
  // 1. COMPUTER-AIDED DESIGN (CAD) — Authentic Engineering & Design Content
  // =========================================================================
  if (/\bcad\b|computer[\s-]*aided\s+design/i.test(lower)) {
    const cadSlides: SlideData[] = [
      {
        id: 1,
        kicker: 'ENGINEERING & DIGITAL DESIGN',
        title: 'Computer-Aided Design (CAD)',
        subtitle: 'How Digital Modeling Transformed Engineering, Architecture & Manufacturing',
        layout: 'title',
        cards: [
          {
            title: 'Precision Drafting',
            content: 'Sub-millimeter geometric accuracy replacing manual paper blueprints and T-squares.',
            icon: 'compass',
            badge: '2D & 3D',
          },
          {
            title: 'Parametric Modeling',
            content: 'Dimension-driven 3D parts and assemblies that update automatically when parameters change.',
            icon: 'layers',
            badge: 'SIMULATION',
          },
          {
            title: 'CAM & Manufacturing',
            content: 'Direct integration with CNC machining, 3D printing, and industrial production lines.',
            icon: 'cpu',
            badge: 'PRODUCTION',
          },
        ],
        takeaway: 'From concept sketch to physical manufacturing with digital precision.',
      },
      {
        id: 2,
        kicker: 'CORE DEFINITION',
        title: 'What Is CAD?',
        subtitle: 'Using specialized computer software to create, modify, analyze, and optimize designs',
        layout: 'definition',
        cards: [
          {
            title: 'Digital Design Representation',
            content: 'CAD software constructs accurate 2D technical drawings and 3D solid or surface models containing exact dimensions, tolerances, and material properties.',
            icon: 'code',
            badge: 'DEFINITION',
            items: [
              'Replaces manual drafting boards with interactive vector geometry',
              'Stores metadata including materials, mass, and stress tolerances',
              'Enables instant revisions without redrawing from scratch',
            ],
          },
          {
            title: 'Why Engineers Rely on CAD',
            content: 'Engineers test how components fit together and behave under real-world forces before a single physical prototype is built.',
            icon: 'shield',
            badge: 'PURPOSE',
            items: [
              'Detects collisions and interference in multi-part assemblies',
              'Integrates with Finite Element Analysis (FEA) for stress testing',
              'Generates automated Bills of Materials (BOM) for production',
            ],
          },
        ],
        takeaway: 'CAD is the universal language of modern engineering, product design, and architecture.',
      },
      {
        id: 3,
        kicker: 'HISTORICAL EVOLUTION',
        title: 'How CAD Changed Design',
        subtitle: 'From manual drafting rooms to cloud-native 3D engineering',
        layout: 'timeline',
        cards: [
          {
            title: '1960s: Sketchpad & Early Vector Systems',
            content: 'Ivan Sutherland created Sketchpad (1963) at MIT, pioneering interactive computer graphics with a light pen.',
            icon: 'clock',
            badge: '1963',
          },
          {
            title: '1980s: Desktop 2D Drafting Revolution',
            content: 'The release of AutoCAD (1982) brought digital drafting from mainframe computers onto personal workstations.',
            icon: 'cpu',
            badge: '1982',
          },
          {
            title: '1990s–2000s: 3D Parametric Solid Modeling',
            content: 'Tools like Pro/ENGINEER, SolidWorks, and CATIA introduced feature-based parametric 3D assemblies.',
            icon: 'layers',
            badge: '3D ERA',
          },
          {
            title: 'Today: Cloud & Generative CAD',
            content: 'Real-time cloud collaboration (Onshape, Fusion) and AI-driven generative geometry optimization.',
            icon: 'sparkles',
            badge: 'MODERN',
          },
        ],
      },
      {
        id: 4,
        kicker: 'MODELING PARADIGMS',
        title: '2D Drafting vs. 3D CAD Modeling',
        subtitle: 'Comparing flat technical drawings with volumetric three-dimensional models',
        layout: 'comparison',
        leftColumn: {
          title: '2D CAD Drafting',
          subtitle: 'Flat Geometric Views (X & Y Axes)',
          badge: '2D DRAFTING',
          items: [
            'Produces floor plans, electrical schematics, and orthographic views',
            'Lightweight files ideal for layout planning and laser cutting',
            'Leading tools: AutoCAD, LibreCAD, DraftSight',
            'Requires manual updates across top, front, and side views',
          ],
        },
        rightColumn: {
          title: '3D Solid & Surface Modeling',
          subtitle: 'Volumetric Assemblies (X, Y & Z Axes)',
          badge: '3D MODELING',
          items: [
            'Creates realistic 3D parts with mass, volume, and center of gravity',
            'Automatically generates 2D orthographic drawings from the 3D model',
            'Leading tools: SolidWorks, Autodesk Inventor, CATIA, Fusion',
            'Supports motion kinematics, thermal analysis, and 3D printing (STL/STEP)',
          ],
        },
        takeaway: '2D excels at schematics and floor plans; 3D dominates mechanical assemblies and manufacturing.',
      },
      {
        id: 5,
        kicker: 'STEP-BY-STEP PROCESS',
        title: 'The CAD Design Workflow',
        subtitle: 'How an engineering concept progresses from initial sketch to final production',
        layout: 'process',
        cards: [
          {
            title: '2D Base Sketch & Constraints',
            content: 'Draw 2D profiles and apply geometric constraints (parallel, concentric, tangent) and exact dimensions.',
            icon: 'compass',
            badge: 'STEP 01',
          },
          {
            title: '3D Feature Extrusion',
            content: 'Extrude, revolve, loft, or sweep 2D profiles into 3D solid bodies and add fillets, holes, and threads.',
            icon: 'layers',
            badge: 'STEP 02',
          },
          {
            title: 'Assembly & Simulation',
            content: 'Mate multiple parts into a working assembly and run stress, thermal, or airflow simulations (CAE).',
            icon: 'activity',
            badge: 'STEP 03',
          },
          {
            title: 'Technical Drawings & CAM',
            content: 'Export GD&T manufacturing drawings or G-code toolpaths for CNC milling and 3D printing.',
            icon: 'check-circle',
            badge: 'STEP 04',
          },
        ],
      },
      {
        id: 6,
        kicker: 'INDUSTRY SECTORS',
        title: 'Where CAD Is Used',
        subtitle: 'Core industries powered by computer-aided design every day',
        layout: 'four-card-grid',
        cards: [
          {
            title: 'Mechanical & Automotive',
            content: 'Designing engines, EV battery enclosures, suspension geometry, and aerodynamic car bodies.',
            icon: 'zap',
            badge: 'AUTOMOTIVE',
          },
          {
            title: 'Architecture & Civil (AEC)',
            content: 'Building Information Modeling (BIM), structural steel framing, bridges, and HVAC layouts.',
            icon: 'globe',
            badge: 'ARCHITECTURE',
          },
          {
            title: 'Aerospace & Aviation',
            content: 'Turbine blades, lightweight composite fuselages, satellite structures, and landing gear.',
            icon: 'compass',
            badge: 'AEROSPACE',
          },
          {
            title: 'Consumer Electronics & Medical',
            content: 'Smartphone enclosures, PCB layouts, custom prosthetic limbs, and dental implants.',
            icon: 'heart',
            badge: 'PRODUCTS',
          },
        ],
      },
      {
        id: 7,
        kicker: 'MEASURABLE IMPACT',
        title: 'Advantages of CAD in Engineering',
        subtitle: 'Why digital modeling is indispensable in modern manufacturing',
        layout: 'statistics',
        stats: [
          {
            value: '60%',
            label: 'Faster Design Iteration Cycles',
            description: 'Parametric edits update entire assemblies and drawings automatically in seconds.',
            percentage: 60,
          },
          {
            value: '0.001mm',
            label: 'Machining & Modeling Precision',
            description: 'Sub-micron digital tolerances ensure parts fit accurately on the factory floor.',
            percentage: 95,
          },
          {
            value: '45%',
            label: 'Reduction in Physical Prototypes',
            description: 'Digital stress and motion simulation catches flaws before costly tooling begins.',
            percentage: 75,
          },
        ],
        takeaway: 'CAD drastically reduces development cost while elevating product quality and safety.',
      },
      {
        id: 8,
        kicker: 'MANUFACTURING INTEGRATION',
        title: 'CAD in Engineering & Manufacturing',
        subtitle: 'Connecting CAD with CAM (Computer-Aided Manufacturing) and CAE',
        layout: 'three-column',
        cards: [
          {
            title: 'Additive Manufacturing (3D Printing)',
            content: 'CAD models export directly as STL or 3MF meshes for rapid prototyping in polymers, resins, and titanium.',
            icon: 'layers',
            badge: '3D PRINTING',
          },
          {
            title: 'CNC Subtractive Machining',
            content: 'CAM software translates 3D CAD geometry into precise multi-axis G-code toolpaths for mills and lathes.',
            icon: 'cpu',
            badge: 'CNC & CAM',
          },
          {
            title: 'Digital Twin & Quality Inspection',
            content: 'Coordinate Measuring Machines (CMM) compare finished physical parts against the master CAD model.',
            icon: 'shield',
            badge: 'QUALITY CONTROL',
          },
        ],
      },
      {
        id: 9,
        kicker: 'NEXT-GEN TECHNOLOGIES',
        title: 'Modern CAD Technologies',
        subtitle: 'Generative design, cloud collaboration, and VR engineering review',
        layout: 'two-column',
        cards: [
          {
            title: 'AI Generative Design & Topology Optimization',
            content: 'Engineers specify loads, constraints, and materials—and the software algorithmically generates lightweight, organic structures stronger than traditional shapes.',
            icon: 'sparkles',
            badge: 'GENERATIVE AI',
            items: [
              'Reduces part weight by 30–50% in aerospace brackets',
              'Consolidates multi-piece assemblies into single 3D-printed parts',
              'Explores hundreds of manufacturing-ready permutations automatically',
            ],
          },
          {
            title: 'Cloud-Native BIM & Real-Time Co-Design',
            content: 'Browser-based and cloud-connected CAD platforms allow global engineering teams to edit the same master assembly simultaneously without file version conflicts.',
            icon: 'globe',
            badge: 'CLOUD & XR',
            items: [
              'Instant version branching and audit history in the cloud',
              'AR/VR headset walkthroughs of full-scale buildings and machinery',
              'Direct API links to ERP and supply-chain procurement systems',
            ],
          },
        ],
      },
      {
        id: 10,
        kicker: 'SUMMARY & REVIEW',
        title: 'Key Takeaways: Computer-Aided Design',
        subtitle: 'Essential points to remember about CAD systems and workflows',
        layout: 'conclusion',
        cards: [
          {
            title: 'Digital Precision & Speed',
            content: 'CAD replaces manual drafting with parametric 2D and 3D models that can be revised, simulated, and shared instantly.',
            icon: 'check-circle',
            badge: 'TAKEAWAY 01',
          },
          {
            title: 'End-to-End Engineering Bridge',
            content: 'Seamless integration between CAD, CAE simulation, and CAM/3D printing powers modern manufacturing.',
            icon: 'cpu',
            badge: 'TAKEAWAY 02',
          },
          {
            title: 'Future-Ready Innovation',
            content: 'Generative design, cloud collaboration, and digital twins are shaping the next era of sustainable engineering.',
            icon: 'sparkles',
            badge: 'TAKEAWAY 03',
          },
        ],
        takeaway: 'Thank You! • Questions & Discussion',
      },
    ];

    return finalizeSlideDeck(
      cadSlides,
      slideCount,
      'Computer-Aided Design (CAD)',
      'Digital Drafting, 3D Parametric Modeling & Modern Manufacturing',
      palette,
      isPbl,
      audience
    );
  }

  // =========================================================================
  // 2. GENDER EQUALITY / GENDER INEQUALITY & PROJECT-BASED LEARNING (PBL)
  //    Written in clear, natural Easy English with complete sentences and
  //    accurate, verified statistics (Requirements 1–15).
  // =========================================================================
  if (isPbl || /gender\s+(inequality|equality)|equal\s+rights|women'?s\s+rights/i.test(lower)) {
    const isGenderTopic = /gender\s+(inequality|equality)|equal\s+rights|women'?s\s+rights/i.test(lower);
    const cleanPblSubject =
      cleanTopic.replace(/\b(pbl|project[\s-]*based\s+learning)\b/gi, '').trim() ||
      (isGenderTopic ? 'Gender Equality and Equal Opportunities' : 'Community Inquiry Project');

    const pblSlides: SlideData[] = [
      {
        id: 1,
        kicker: isPbl ? 'PROJECT-BASED LEARNING (PBL)' : 'SOCIAL STUDIES & CITIZENSHIP',
        title: isGenderTopic
          ? isPbl
            ? `PBL Project: ${cleanPblSubject}`
            : cleanPblSubject
          : `PBL Project: ${cleanPblSubject}`,
        subtitle: isGenderTopic
          ? 'Equal Opportunities in Education, Work, Leadership, and Daily Life'
          : 'Our Driving Question, Research Findings, Real-World Examples, and Action Plan',
        layout: 'title',
        cards: [
          {
            title: 'What This Topic Is About',
            content: isGenderTopic
              ? 'Gender equality means that all people receive equal rights, responsibilities, and opportunities regardless of their gender.'
              : `We investigate how ${cleanPblSubject.toLowerCase()} affects our community and what practical solutions can help.`,
            icon: 'users',
            badge: 'CORE IDEA',
          },
          {
            title: 'Real-World Challenges',
            content: isGenderTopic
              ? 'In many places, unequal access to schooling, jobs, and leadership still limits what people can achieve.'
              : 'We examine verified facts, everyday challenges, and how these issues affect students and families.',
            icon: 'search',
            badge: 'CHALLENGES',
          },
          {
            title: 'Practical Solutions',
            content: isGenderTopic
              ? 'Fair school rules, equal pay for equal work, and positive encouragement help everyone succeed.'
              : 'Our project proposes clear, practical steps that students, schools, and families can take together.',
            icon: 'award',
            badge: 'SOLUTIONS',
          },
        ],
        takeaway: `${isPbl ? 'Project-Based Learning Presentation' : 'Educational Presentation'} • ${audience || 'Clear Student Edition'}`,
      },
      {
        id: 2,
        kicker: 'KEY DEFINITIONS',
        title: isGenderTopic
          ? 'What Gender Equality and Gender Inequality Mean'
          : 'Our Driving Question and Core Problem',
        subtitle: isGenderTopic
          ? 'Clear definitions of the two main concepts in this presentation'
          : 'Understanding the main question behind our classroom investigation',
        layout: 'definition',
        cards: [
          {
            title: isGenderTopic ? 'Gender Equality' : 'Our Driving Question',
            content: isGenderTopic
              ? 'Gender equality means giving people equal rights, opportunities, and fair treatment regardless of whether they are male or female.'
              : `How can we understand the main causes of ${cleanPblSubject.toLowerCase()} and create practical solutions that help our school and community?`,
            icon: 'scale',
            badge: isGenderTopic ? 'DEFINITION 01' : 'DRIVING QUESTION',
            items: [
              'Everyone gets the same chance to learn in school and university.',
              'People receive equal pay when they do the same job with the same skills.',
              'Both men and women can share leadership and decision-making.',
            ],
          },
          {
            title: isGenderTopic ? 'Gender Inequality' : 'Why This Topic Matters',
            content: isGenderTopic
              ? 'Gender inequality happens when people face unfair differences in rights, opportunities, treatment, or access to resources because of their gender.'
              : 'When unfair barriers hold people back, families, schools, and communities lose valuable talent and ideas.',
            icon: 'alert-circle',
            badge: isGenderTopic ? 'DEFINITION 02' : 'IMPORTANCE',
            items: [
              'Some students may be discouraged from studying science or technology.',
              'Workers may be paid less or passed over for promotion unfairly.',
              'Communities grow stronger when every person is treated fairly.',
            ],
          },
        ],
        takeaway: 'Gender equality gives everyone a fair chance to learn, work, and lead.',
      },
      {
        id: 3,
        kicker: 'EDUCATION & LEARNING',
        title: 'Unequal Opportunities in Education',
        subtitle: 'How unequal access to schooling and technology affects students',
        layout: 'three-column',
        cards: [
          {
            title: 'Access to Schooling',
            content: 'Poverty, long travel distances, and family chores prevent millions of children from finishing secondary school.',
            icon: 'graduation-cap',
            badge: '01 · SCHOOLING',
            statValue: '129 Million',
            statLabel: 'Girls out of school worldwide (UNESCO)',
          },
          {
            title: 'Science and Technology Classes',
            content: 'Outdated stereotypes in classrooms sometimes discourage girls from joining computer science and engineering courses.',
            icon: 'cpu',
            badge: '02 · STEM SUBJECTS',
            statValue: '28%',
            statLabel: 'Women among engineering researchers (UNESCO)',
          },
          {
            title: 'How Education Helps Families',
            content: 'Finishing secondary school helps young people earn a better living, support their families, and take part in community decisions.',
            icon: 'trending-up',
            badge: '03 · FUTURE BENEFIT',
            statValue: '+10% to 20%',
            statLabel: 'Average income rise per year of secondary school',
          },
        ],
        takeaway: 'Equal access to education is one of the strongest ways to reduce inequality.',
      },
      {
        id: 4,
        kicker: 'EMPLOYMENT & LEADERSHIP',
        title: 'Equal Opportunities in Work and Leadership',
        subtitle: 'Comparing workplace barriers with fair workplace practices',
        layout: 'comparison',
        leftColumn: {
          title: 'Common Workplace Barriers',
          subtitle: 'Challenges People Face at Work',
          badge: 'BARRIERS',
          items: [
            'Unequal pay for people doing the same job with equal qualifications.',
            'Fewer women chosen for senior management and government leadership roles.',
            'Unequal sharing of unpaid home and childcare responsibilities.',
            'Limited access to job training, mentorship, and business loans.',
          ],
        },
        rightColumn: {
          title: 'Fair Workplace Practices',
          subtitle: 'How Workplaces Create Equal Opportunity',
          badge: 'SOLUTIONS',
          items: [
            'Clear pay standards that give equal pay for equal work and skill.',
            'Fair hiring and promotion based on talent, effort, and qualifications.',
            'Flexible work hours and shared parental leave for mothers and fathers.',
            'Equal representation on school boards, company teams, and councils.',
          ],
        },
        takeaway: 'Fair workplaces judge people by their skills and effort, not by their gender.',
      },
      {
        id: 5,
        kicker: 'SOCIAL EXPECTATIONS',
        title: 'How Stereotypes and Social Expectations Affect People',
        subtitle: 'A stereotype is an unfair belief that all members of a group must act the same way',
        layout: 'process',
        cards: [
          {
            title: '1. Early Expectations',
            content: 'Fixed ideas about which toys, sports, or subjects are meant for boys or girls often start in early childhood.',
            icon: 'users',
            badge: 'STEP 01',
          },
          {
            title: '2. Effect on Confidence',
            content: 'When students hear that a subject is not for them, they may lose confidence even when they have strong ability.',
            icon: 'search',
            badge: 'STEP 02',
          },
          {
            title: '3. Career Choices',
            content: 'Stereotypes can push young people away from careers in engineering, nursing, teaching, or leadership.',
            icon: 'briefcase',
            badge: 'STEP 03',
          },
          {
            title: '4. Replacing Stereotypes',
            content: 'Teachers and parents can encourage every student to explore science, arts, sports, and leadership freely.',
            icon: 'check-circle',
            badge: 'STEP 04',
          },
        ],
        takeaway: 'Encouraging students based on their interests helps everyone reach their full potential.',
      },
      {
        id: 6,
        kicker: 'VERIFIED GLOBAL STATISTICS',
        title: 'Verified Global Facts on Gender Equality',
        subtitle: 'Real data from United Nations and international education reports',
        layout: 'statistics',
        stats: [
          {
            value: '26.9%',
            label: 'Seats Held by Women in National Parliaments',
            description: 'Women hold 26.9% of seats in national parliaments worldwide according to the Inter-Parliamentary Union (2024).',
            percentage: 27,
          },
          {
            value: '20%',
            label: 'Average Global Gender Wage Gap',
            description: 'On average worldwide, women earn about 20% less than men according to the International Labour Organization (ILO).',
            percentage: 80,
          },
          {
            value: '89%',
            label: 'Girls Completing Primary School Globally',
            description: 'Global primary school completion for girls has reached 89% through expanded schooling programs (UNESCO).',
            percentage: 89,
          },
        ],
        takeaway: 'Verified data shows steady progress in schooling, while gaps remain in leadership and pay.',
      },
      {
        id: 7,
        kicker: 'REAL-WORLD EXAMPLES',
        title: 'Real-World Examples of Positive Change',
        subtitle: 'How practical programs in schools and communities improve fairness',
        layout: 'case-study',
        cards: [
          {
            title: 'Open School Coding and Robotics Clubs',
            content: 'Schools that invited female engineers as mentors and opened coding clubs to all grades saw girls’ participation double.',
            icon: 'cpu',
            badge: 'SCHOOL EXAMPLE',
          },
          {
            title: 'Safe School Transport and Scholarships',
            content: 'Providing safe buses and school scholarships in rural areas helped many more girls finish high school.',
            icon: 'award',
            badge: 'COMMUNITY EXAMPLE',
          },
          {
            title: 'Shared Classroom Leadership Roles',
            content: 'Rotating team leader, speaker, and researcher roles in class projects builds confidence in every student.',
            icon: 'users',
            badge: 'CLASSROOM EXAMPLE',
          },
        ],
        takeaway: 'Practical support in schools makes a direct, measurable difference for students.',
      },
      {
        id: 8,
        kicker: 'SOLUTIONS & ACTION PLAN',
        title: 'Practical Solutions for Schools and Communities',
        subtitle: 'Clear actions that students, teachers, and families can take every day',
        layout: 'timeline',
        cards: [
          {
            title: '1. In the Classroom',
            content: 'Give every student an equal turn to speak, lead group projects, and use science and computer equipment.',
            icon: 'graduation-cap',
            badge: 'CLASSROOM',
          },
          {
            title: '2. Across the School',
            content: 'Encourage both boys and girls to join science fairs, debate clubs, sports teams, and student council.',
            icon: 'sparkles',
            badge: 'SCHOOL',
          },
          {
            title: '3. At Home and in the Community',
            content: 'Share household chores fairly and support every child’s education and career goals equally.',
            icon: 'heart',
            badge: 'COMMUNITY',
          },
        ],
        takeaway: 'Fairness grows when families, schools, and communities work together.',
      },
      {
        id: 9,
        kicker: 'EFFECTS ON SOCIETY',
        title: 'How Gender Equality Helps Individuals and Society',
        subtitle: 'Why fair opportunities make entire communities healthier and stronger',
        layout: 'two-column',
        cards: [
          {
            title: 'Benefits for Individuals and Families',
            content: 'When people have equal access to education and fair jobs, families experience better health, higher income, and greater stability.',
            icon: 'heart',
            badge: 'INDIVIDUALS & FAMILIES',
            items: [
              'Higher family income and better nutrition for children.',
              'Greater personal confidence and independence.',
              'More balanced sharing of family responsibilities.',
            ],
          },
          {
            title: 'Benefits for Schools and Society',
            content: 'Communities solve problems better when they include the talents, ideas, and leadership of all citizens.',
            icon: 'globe',
            badge: 'SOCIETY & ECONOMY',
            items: [
              'More doctors, scientists, teachers, and engineers.',
              'Stronger economic growth and innovation.',
              'Fairer laws and more peaceful communities.',
            ],
          },
        ],
        takeaway: 'Gender equality is not just for one group; it benefits everyone in society.',
      },
      {
        id: 10,
        kicker: 'SUMMARY & SOURCES',
        title: 'Conclusion and Key Takeaways',
        subtitle: 'Reviewing the main ideas from our presentation on gender equality',
        layout: 'conclusion',
        cards: [
          {
            title: 'Equal Rights and Opportunities',
            content: 'Gender equality means everyone has the same chance to learn, work, and make decisions without unfair treatment.',
            icon: 'check-circle',
            badge: 'KEY POINT 01',
          },
          {
            title: 'Education and Fair Work Are Essential',
            content: 'Ending stereotypes and supporting equal schooling and fair pay helps every person succeed.',
            icon: 'award',
            badge: 'KEY POINT 02',
          },
          {
            title: 'Verified Sources Used',
            content: 'Data sourced from UNESCO Global Education Monitoring Report, UN Women, Inter-Parliamentary Union (2024), and the ILO.',
            icon: 'book-open',
            badge: 'SOURCES',
          },
        ],
        takeaway: 'Thank You! • Questions and Class Discussion',
      },
    ];

    return finalizeSlideDeck(
      pblSlides,
      slideCount,
      isPbl ? `PBL: ${cleanPblSubject}` : cleanPblSubject,
      'Equal Opportunities in Education, Work, Leadership, and Daily Life',
      palette,
      true,
      audience
    );
  }

  // =========================================================================
  // 2A. DINOSAURS & PREHISTORIC PALEONTOLOGY
  // =========================================================================
  if (
    /\b(dinosaur|dinosaurs|fossil|fossils|t-rex|tyrannosaurus|jurassic|cretaceous|triassic|paleontology|prehistoric|velociraptor|sauropod)\b/i.test(
      lower
    )
  ) {
    const dinoSlides: SlideData[] = [
      {
        id: 1,
        kicker: 'PALEONTOLOGY & PREHISTORIC LIFE',
        title: 'The Age of Dinosaurs',
        subtitle: 'Mesozoic Evolution, Iconic Species, Fossil Discoveries & Mass Extinction',
        layout: 'title',
        cards: [
          {
            title: '165-Million-Year Reign',
            content: 'Dinosaurs dominated Earth across the Triassic, Jurassic, and Cretaceous periods.',
            icon: 'globe',
            badge: 'MESOZOIC',
          },
          {
            title: 'Incredible Diversity',
            content: 'Evolved from small bipedal carnivores to 40-meter sauropods and armored titans.',
            icon: 'compass',
            badge: 'SPECIES',
          },
          {
            title: 'Living Descendants',
            content: 'Modern birds are living avian dinosaurs that survived the K-Pg asteroid impact.',
            icon: 'sparkles',
            badge: 'AVIAN EVOLUTION',
          },
        ],
        takeaway: 'Dinosaurs shaped terrestrial ecosystems longer than any other land vertebrate group.',
      },
      {
        id: 2,
        kicker: 'ANATOMICAL CLASSIFICATION',
        title: 'What Truly Defines a Dinosaur?',
        subtitle: 'Unique skeletal adaptations that separate dinosaurs from all other prehistoric reptiles',
        layout: 'definition',
        cards: [
          {
            title: 'Upright Pillar Stance',
            content: 'Unlike sprawling lizards, dinosaurs held their legs straight beneath their bodies for stamina and rapid locomotion.',
            icon: 'layers',
            badge: '01 · BIOMECHANICS',
          },
          {
            title: 'Open Hip Socket (Perforate Acetabulum)',
            content: 'A distinctive hole in the hip bone enabled efficient vertical leg movement without dislocation.',
            icon: 'shield',
            badge: '02 · ANATOMY',
          },
          {
            title: 'Two Evolutionary Branches',
            content: 'Divided into Saurischia (lizard-hipped theropods and sauropods) and Ornithischia (bird-hipped herbivores).',
            icon: 'compass',
            badge: '03 · CLADISTICS',
          },
          {
            title: 'Warm-Blooded Metabolism',
            content: 'Bone growth rings prove dinosaurs grew rapidly with elevated body temperatures similar to modern birds.',
            icon: 'flame',
            badge: '04 · PHYSIOLOGY',
          },
          {
            title: 'Advanced Nesting Behavior',
            content: 'Fossils reveal dedicated nesting colonies with parents incubating eggs and brooding newborn hatchlings.',
            icon: 'heart',
            badge: '05 · BEHAVIOR',
          },
        ],
        takeaway: "Erect posture and high metabolic efficiency made dinosaurs Earth's dominant land vertebrates.",
      },
      {
        id: 3,
        kicker: 'CHRONOLOGICAL TIMELINE',
        title: 'The Three Mesozoic Dinosaur Eras',
        subtitle: 'How continental drift and climate shifts drove three distinct chapters of prehistoric life',
        layout: 'timeline',
        cards: [
          {
            title: 'Triassic Period (252–201 Ma)',
            content: 'Small, agile bipedal runners like Coelophysis and Eoraptor evolve on the supercontinent Pangaea.',
            icon: 'clock',
            badge: '252–201 Ma',
          },
          {
            title: 'Jurassic Period (201–145 Ma)',
            content: 'Warm, humid climates spur giant sauropods like Brachiosaurus and apex predators like Allosaurus.',
            icon: 'globe',
            badge: '201–145 Ma',
          },
          {
            title: 'Cretaceous Period (145–66 Ma)',
            content: 'Flowering plants emerge while T-Rex, Triceratops, and Velociraptor reach peak anatomical specialization.',
            icon: 'layers',
            badge: '145–66 Ma',
          },
          {
            title: 'K-Pg Boundary Event (66 Ma)',
            content: 'A massive 10 km asteroid strikes Chicxulub, triggering abrupt darkness and cooling.',
            icon: 'zap',
            badge: '66 Ma',
          },
          {
            title: 'Avian Lineage Survives (66 Ma–Today)',
            content: 'Small, beaked feathered maniraptorans endure to diversify into all modern bird species.',
            icon: 'sparkles',
            badge: 'PRESENT DAY',
          },
        ],
        takeaway: 'Over 165 million years, dinosaurs repeatedly reinvented themselves to conquer every land habitat.',
      },
      {
        id: 4,
        kicker: 'ECOLOGICAL ADAPTATIONS',
        title: 'Carnivores vs Herbivores',
        subtitle: 'Radically specialized skull designs, dentition, and feeding strategies for survival',
        layout: 'comparison',
        leftColumn: {
          title: 'Theropod Carnivores',
          subtitle: 'Apex Predators & Agile Hunters',
          badge: 'MEAT EATERS',
          items: [
            'Serrated steak-knife teeth designed to tear meat and crush bone',
            'Forward-facing stereoscopic eyes for precise binocular depth perception',
            'Hollow pneumatic bones providing maximum speed and low body weight',
            'Bipedal running posture with powerful muscular tail balance',
            'Sharp curved talons on hands and feet for grasping prey',
          ],
        },
        rightColumn: {
          title: 'Sauropod & Ceratopsian Herbivores',
          subtitle: 'Massive Plant Consumers & Armored Defenders',
          badge: 'PLANT EATERS',
          items: [
            'Dental batteries with hundreds of self-sharpening teeth to grind tough cycads',
            'Enormous multi-chambered digestive fermentation chambers for leaves',
            'Defensive armor including bony frills, horns, spikes, and tail clubs',
            'Pillar-like four-legged quadrupeds engineered to support up to 70 metric tons',
            'Herd grazing behaviors providing mutual defense against lone predators',
          ],
        },
        takeaway: 'Predator and prey co-evolved in an escalating evolutionary arms race of defense and offense.',
      },
      {
        id: 5,
        kicker: 'LATE CRETACEOUS TITANS',
        title: 'Iconic Dinosaur Species',
        subtitle: "Key morphological adaptations of North America and Asia's famous prehistoric animals",
        layout: 'four-card-grid',
        cards: [
          {
            title: 'Tyrannosaurus Rex',
            content: 'Over 12 meters long with a bone-crushing bite force of nearly 35,000 Newtons.',
            icon: 'zap',
            badge: 'APEX PREDATOR',
          },
          {
            title: 'Triceratops Horridus',
            content: 'Armed with a solid bone neck frill and three 1-meter brow horns to deter predators.',
            icon: 'shield',
            badge: 'ARMORED HERBIVORE',
          },
          {
            title: 'Velociraptor Mongoliensis',
            content: 'Feathered Asian hunter possessing a sharp sickle-shaped killing claw on each hind foot.',
            icon: 'sparkles',
            badge: 'FEATHERED HUNTER',
          },
          {
            title: 'Ankylosaurus Magniventris',
            content: 'Living tank covered in fused dermal osteoderms and a heavy bone club on its tail.',
            icon: 'award',
            badge: 'DEFENSIVE TANK',
          },
          {
            title: 'Spinosaurus Aegyptiacus',
            content: 'Semiaquatic giant with a tall dorsal sail, croc-like snout, and paddle tail.',
            icon: 'compass',
            badge: 'RIVER HUNTER',
          },
        ],
        takeaway: 'Late Cretaceous dinosaurs achieved some of the most specialized evolutionary body plans in Earth history.',
      },
      {
        id: 6,
        kicker: 'EXTREME DIMENSIONS',
        title: 'Fossil Records & Measurements',
        subtitle: 'Verified paleontological metrics demonstrating extraordinary biological scale',
        layout: 'statistics',
        stats: [
          {
            value: '40 m',
            label: 'Maximum Sauropod Length',
            description: 'Titanosaurs like Argentinosaurus stretched forty meters from snout to tail tip.',
            percentage: 95,
          },
          {
            value: '70 Tons',
            label: 'Heaviest Land Animal',
            description: 'Weight of giant titanosaurs, equaling more than ten adult African bull elephants.',
            percentage: 90,
          },
          {
            value: '66 Ma',
            label: 'Years Since K-Pg Boundary',
            description: 'Radiometric dating of iridium clay layer marking the Chicxulub asteroid impact.',
            percentage: 85,
          },
        ],
        takeaway: 'Dinosaurs pushed vertebrate biomechanics and respiratory physiology to their physical limits.',
      },
      {
        id: 7,
        kicker: 'THE CHICXULUB IMPACT',
        title: 'The Great Cretaceous Extinction',
        subtitle: 'How an extraterrestrial impact collapsed global ecosystems in months',
        layout: 'cause-effect',
        cards: [
          {
            title: '10 km Bolide Impact',
            content: 'Asteroid struck the shallow ocean near modern Chicxulub, Mexico with billions of megatons of energy.',
            icon: 'flame',
            badge: 'CAUSE',
          },
          {
            title: 'Global Thermal Pulse & Wildfires',
            content: 'Vaporized rock re-entered the atmosphere, igniting global forest fires within hours.',
            icon: 'zap',
            badge: 'STAGE 1',
          },
          {
            title: 'Soot & Sulfate Nuclear Winter',
            content: 'Sunlight was blocked for years, causing temperatures to plummet and halting photosynthesis.',
            icon: 'globe',
            badge: 'STAGE 2',
          },
          {
            title: 'Collapse of Food Chains',
            content: 'Large herbivores starved first, followed rapidly by apex carnivores requiring tons of daily food.',
            icon: 'layers',
            badge: 'STAGE 3',
          },
          {
            title: 'Surviving Organisms',
            content: 'Small burrowing mammals, crocodiles, turtles, and seed-eating feathered birds survived.',
            icon: 'sparkles',
            badge: 'OUTCOME',
          },
        ],
        takeaway: 'Ecosystem collapse wiped out 75% of all species, clearing the stage for mammals and modern birds.',
      },
      {
        id: 8,
        kicker: 'KEY TAKEAWAYS',
        title: 'Paleontology & The Avian Legacy',
        subtitle: 'Core scientific lessons learned from 200 years of fossil discovery',
        layout: 'three-column',
        cards: [
          {
            title: 'Birds are Real Dinosaurs',
            content: 'Taxonomically, all 10,000+ living bird species are crown-group theropod dinosaurs.',
            icon: 'award',
            badge: 'EVOLUTION',
          },
          {
            title: 'Fossils Reveal Life History',
            content: 'CT scans, synchrotron imaging, and bone chemistry let scientists study behavior and color patterns.',
            icon: 'book-open',
            badge: 'DISCOVERY',
          },
          {
            title: 'Ecosystem Fragility Lesson',
            content: 'The sudden loss of prehistoric giants proves that even dominant organisms depend on stable biosphere networks.',
            icon: 'globe',
            badge: 'PRESERVATION',
          },
        ],
        takeaway: 'Dinosaurs are not evolutionary failures; their avian descendants still outnumber mammal species today.',
      },
    ];

    return finalizeSlideDeck(
      dinoSlides,
      slideCount,
      cleanTopic,
      'Mesozoic Evolution, Iconic Species, Fossil Discoveries & Mass Extinction',
      palette,
      isPbl,
      audience
    );
  }

  // =========================================================================
  // 2B. CLIMATE CHANGE / ENVIRONMENTAL SCIENCE (Rule 15)
  // =========================================================================
  if (/climate\s+change|global\s+warming|greenhouse\s+effect|environmental\s+pollution/i.test(lower)) {
    const climateSlides: SlideData[] = [
      {
        id: 1,
        kicker: 'EARTH & ENVIRONMENTAL SCIENCE',
        title: 'Climate Change: Science, Impacts & Solutions',
        subtitle: 'Atmospheric Physics, Observable Evidence, Ecological Consequences & Mitigation',
        layout: 'title',
        cards: [
          {
            title: 'Atmospheric Greenhouse Mechanism',
            content: 'How heat-trapping gases regulate Earth’s temperature and how human emissions alter the energy balance.',
            icon: 'flame',
            badge: 'SCIENCE',
          },
          {
            title: 'Measured Global Evidence',
            content: 'Ice-core records, satellite temperature tracking, ocean warming, and sea-level rise.',
            icon: 'bar-chart',
            badge: 'EVIDENCE',
          },
          {
            title: 'Mitigation & Adaptation',
            content: 'Renewable energy transition, reforestation, resilient infrastructure, and community action.',
            icon: 'globe',
            badge: 'SOLUTIONS',
          },
        ],
        takeaway: `Environmental Science Presentation • ${audience || 'Earth Systems & Sustainability'}`,
      },
      {
        id: 2,
        kicker: 'ATMOSPHERIC PHYSICS',
        title: 'How the Greenhouse Effect Regulates Earth’s Climate',
        subtitle: 'Distinguishing the natural greenhouse balance from human-enhanced warming',
        layout: 'definition',
        cards: [
          {
            title: 'Natural vs. Enhanced Greenhouse Effect',
            content: 'Solar radiation warms Earth’s surface, which emits infrared heat back toward space. Greenhouse gases (CO₂, CH₄, N₂O, H₂O) absorb and re-radiate part of this heat.',
            icon: 'flame',
            badge: 'MECHANISM',
            items: [
              'Natural greenhouse effect keeps Earth habitable at ~15°C instead of -18°C',
              'Burning fossil fuels since 1750 has raised atmospheric CO₂ by over 50%',
              'Excess trapped infrared energy warms oceans, land, and the lower atmosphere',
            ],
          },
          {
            title: 'Primary Heat-Trapping Gases',
            content: 'Different greenhouse gases vary in atmospheric lifetime and heat-trapping potency (Global Warming Potential).',
            icon: 'layers',
            badge: 'COMPOSITION',
            items: [
              'Carbon Dioxide (CO₂): Long-lived gas from coal, oil, gas, and deforestation',
              'Methane (CH₄): 28x more potent over 100 years; from agriculture and energy leaks',
              'Nitrous Oxide (N₂O): Emitted from synthetic fertilizers and industrial processes',
            ],
          },
        ],
      },
      {
        id: 3,
        kicker: 'EMISSION SOURCES',
        title: 'Human Activities Driving Greenhouse Gas Emissions',
        subtitle: 'Major global sectors contributing to atmospheric carbon accumulation',
        layout: 'three-column',
        cards: [
          {
            title: 'Energy, Electricity & Transport',
            content: 'Combustion of coal, oil, and natural gas for power plants, road vehicles, aviation, and shipping.',
            icon: 'zap',
            badge: '01 · ENERGY',
            statValue: '~73%',
            statLabel: 'Share of global greenhouse emissions',
          },
          {
            title: 'Agriculture & Land-Use Change',
            content: 'Deforestation removes vital carbon sinks while livestock and soil management release methane and nitrous oxide.',
            icon: 'globe',
            badge: '02 · LAND & FOOD',
            statValue: '~18%',
            statLabel: 'Share from agriculture & forestry',
          },
          {
            title: 'Industrial Manufacturing',
            content: 'Chemical reactions and high-heat energy used in producing cement, steel, plastics, and electronics.',
            icon: 'cpu',
            badge: '03 · INDUSTRY',
            statValue: '~9%',
            statLabel: 'Direct industrial process emissions',
          },
        ],
      },
      {
        id: 4,
        kicker: 'EMPIRICAL EVIDENCE',
        title: 'Observable Scientific Evidence of a Warming Planet',
        subtitle: 'Verified measurements from satellites, weather stations, and ocean buoys',
        layout: 'statistics',
        stats: [
          {
            value: '422 ppm',
            label: 'Atmospheric CO₂ Concentration',
            description: 'Highest level in at least 800,000 years, up from 280 ppm before industrialization (NOAA / Mauna Loa).',
            percentage: 92,
          },
          {
            value: '+1.2°C',
            label: 'Global Mean Surface Warming',
            description: 'Average planetary temperature increase since the late 19th century, with the warmest years on record occurring recently.',
            percentage: 78,
          },
          {
            value: '90%',
            label: 'Excess Heat Absorbed by Oceans',
            description: 'Warming oceans drive thermal water expansion, coral bleaching, and stronger tropical storms.',
            percentage: 90,
          },
        ],
      },
      {
        id: 5,
        kicker: 'ECOLOGICAL & HUMAN IMPACTS',
        title: 'Consequences for Ecosystems, Weather & Communities',
        subtitle: 'How shifting climate patterns affect biodiversity, water, and food security',
        layout: 'four-card-grid',
        cards: [
          {
            title: 'Cryosphere & Sea-Level Rise',
            content: 'Melting glaciers and polar ice sheets combine with ocean thermal expansion to threaten coastal cities and islands.',
            icon: 'globe',
            badge: 'OCEANS & ICE',
          },
          {
            title: 'Extreme Weather Frequency',
            content: 'Intensified heatwaves, prolonged droughts in arid regions, and heavier monsoon rainfall events.',
            icon: 'flame',
            badge: 'WEATHER',
          },
          {
            title: 'Biodiversity & Habitat Shifts',
            content: 'Ocean acidification harms coral reefs and shellfish while terrestrial species shift poleward or to higher altitudes.',
            icon: 'heart',
            badge: 'ECOSYSTEMS',
          },
          {
            title: 'Agriculture & Water Stress',
            content: 'Shifting rainfall and glacial melt affect river basins, crop yields, and freshwater availability.',
            icon: 'alert-circle',
            badge: 'FOOD & WATER',
          },
        ],
      },
      {
        id: 6,
        kicker: 'STRATEGIC RESPONSE',
        title: 'Climate Mitigation vs. Climate Adaptation',
        subtitle: 'Two complementary pillars of global and local climate action',
        layout: 'comparison',
        leftColumn: {
          title: 'Climate Mitigation',
          subtitle: 'Reducing the Causes of Warming',
          badge: 'MITIGATION',
          items: [
            'Transitioning electricity grids to solar, wind, hydro, and geothermal power',
            'Electrifying public transit, railways, and passenger vehicles',
            'Improving building insulation and industrial energy efficiency',
            'Protecting and restoring forests, mangroves, and peatlands as carbon sinks',
          ],
        },
        rightColumn: {
          title: 'Climate Adaptation',
          subtitle: 'Building Resilience to Impacts',
          badge: 'ADAPTATION',
          items: [
            'Constructing coastal seawalls, restored wetlands, and flood-sponge cities',
            'Developing drought-tolerant crop varieties and precision drip irrigation',
            'Early-warning meteorological systems for heatwaves and cyclones',
            'Expanding urban tree canopies to reduce city heat-island effects',
          ],
        },
      },
      {
        id: 7,
        kicker: 'CLEAN ENERGY TRANSITION',
        title: 'Pathway to Net-Zero Emissions',
        subtitle: 'Sequential steps for decarbonizing energy, industry, and communities',
        layout: 'process',
        cards: [
          {
            title: 'Clean Power Generation',
            content: 'Replace coal and gas power generation with utility-scale solar, wind, and grid battery storage.',
            icon: 'zap',
            badge: 'STEP 01',
          },
          {
            title: 'Efficiency & Electrification',
            content: 'Adopt LED lighting, heat pumps, electric transit, and circular material recycling.',
            icon: 'cpu',
            badge: 'STEP 02',
          },
          {
            title: 'Nature-Based Carbon Sinks',
            content: 'Halt deforestation and restore degraded forests, soils, and coastal blue-carbon ecosystems.',
            icon: 'globe',
            badge: 'STEP 03',
          },
          {
            title: 'School & Community Stewardship',
            content: 'Reduce food and plastic waste, conserve water, and plant native trees in local neighborhoods.',
            icon: 'check-circle',
            badge: 'STEP 04',
          },
        ],
      },
      {
        id: 8,
        kicker: 'CONCLUSION & REFERENCES',
        title: 'Key Takeaways & Scientific References',
        subtitle: 'Combining scientific understanding with practical environmental stewardship',
        layout: 'conclusion',
        cards: [
          {
            title: 'Clear Scientific Consensus',
            content: 'Human greenhouse gas emissions are warming the planet, making rapid decarbonization essential.',
            icon: 'check-circle',
            badge: 'TAKEAWAY 01',
          },
          {
            title: 'Solutions Are Available Today',
            content: 'Renewable energy, conservation, and climate-resilient design are proven and cost-effective.',
            icon: 'zap',
            badge: 'TAKEAWAY 02',
          },
          {
            title: 'References & Data Sources',
            content: 'IPCC Sixth Assessment Report (AR6) • NASA Global Climate Change • NOAA Global Monitoring Laboratory.',
            icon: 'book-open',
            badge: 'REFERENCES',
          },
        ],
        takeaway: 'Thank You! • Questions & Environmental Discussion',
      },
    ];

    return finalizeSlideDeck(
      climateSlides,
      slideCount,
      'Climate Change: Science, Impacts & Solutions',
      'Greenhouse Physics, Empirical Evidence & Climate Action',
      palette,
      isPbl,
      audience
    );
  }

  // =========================================================================
  // 2C. THE INDUSTRIAL REVOLUTION (Rule 15)
  // =========================================================================
  if (/industrial\s+revolution/i.test(lower)) {
    const industrialSlides: SlideData[] = [
      {
        id: 1,
        kicker: 'WORLD HISTORY • 1760–1840',
        title: 'The Industrial Revolution',
        subtitle: 'Steam Power, Mechanized Factories, Urbanization & Lasting Social Change',
        layout: 'title',
        cards: [
          {
            title: 'Technological Breakthroughs',
            content: 'The steam engine, spinning jenny, power loom, and Coke-smelted iron revolutionized production.',
            icon: 'cpu',
            badge: 'INVENTIONS',
          },
          {
            title: 'Rise of the Factory System',
            content: 'Production shifted from rural domestic handcraft cottages to large mechanized textile and iron mills.',
            icon: 'briefcase',
            badge: 'INDUSTRY',
          },
          {
            title: 'Social & Urban Transformation',
            content: 'Rapid growth of industrial cities, railway networks, new social classes, and labor reform movements.',
            icon: 'users',
            badge: 'SOCIETY',
          },
        ],
        takeaway: `Historical Presentation • ${audience || 'Modern World History'}`,
      },
      {
        id: 2,
        kicker: 'HISTORICAL SHIFT',
        title: 'From Agrarian Handcraft to Mechanized Industry',
        subtitle: 'Why the Industrial Revolution began in Great Britain in the mid-18th century',
        layout: 'definition',
        cards: [
          {
            title: 'What Was the Industrial Revolution?',
            content: 'Beginning in Britain around 1760, the Industrial Revolution was the fundamental transition from manual, agrarian, and animal-powered production to machine-driven manufacturing powered by water and coal-fired steam.',
            icon: 'compass',
            badge: 'DEFINITION',
            items: [
              'Transformed textiles, ironmaking, mining, and transportation',
              'Multiplied economic output and reshaped daily working life',
              'Spread from Britain to Western Europe, North America, and Japan',
            ],
          },
          {
            title: 'Why It Started in Britain First',
            content: 'A unique combination of geographic resources, agricultural changes, capital, and trade networks converged in 18th-century Britain.',
            icon: 'globe',
            badge: 'KEY FACTORS',
            items: [
              'Abundant shallow deposits of coal and iron ore in the Midlands and North',
              'Agricultural Revolution & Enclosure Acts increased food supply and labor mobility',
              'Navigable rivers, canals, natural harbors, and banking capital for investment',
            ],
          },
        ],
      },
      {
        id: 3,
        kicker: 'KEY INVENTIONS',
        title: 'Breakthrough Inventions That Powered the Machine Age',
        subtitle: 'Chronological milestones in textiles, metallurgy, and steam power',
        layout: 'timeline',
        cards: [
          {
            title: '1764–1769: Spinning Jenny & Water Frame',
            content: 'James Hargreaves and Richard Arkwright mechanized cotton thread spinning, multiplying yarn output dramatically.',
            icon: 'clock',
            badge: '1764–1769',
          },
          {
            title: '1769–1776: James Watt’s Steam Engine',
            content: 'Watt’s separate condenser made the steam engine fuel-efficient enough to power factories anywhere near coal supplies.',
            icon: 'flame',
            badge: '1769',
          },
          {
            title: '1784: Henry Cort’s Puddling Process',
            content: 'Enabled high-volume production of strong wrought iron for bridges, machinery, and rails.',
            icon: 'layers',
            badge: '1784',
          },
          {
            title: '1825–1830: Steam Locomotives & Railways',
            content: 'George Stephenson’s "Rocket" and the Liverpool–Manchester Railway connected industrial towns to ports at unprecedented speed.',
            icon: 'zap',
            badge: '1825–1830',
          },
        ],
      },
      {
        id: 4,
        kicker: 'PRODUCTION SYSTEMS',
        title: 'The Cottage Domestic System vs. The Factory System',
        subtitle: 'Comparing pre-industrial rural craftwork with mechanized mill production',
        layout: 'comparison',
        leftColumn: {
          title: 'Domestic (Putting-Out) System',
          subtitle: 'Pre-Industrial Rural Handcraft',
          badge: 'BEFORE 1760',
          items: [
            'Families spun wool and wove cloth by hand in rural cottages',
            'Workers set their own pace alongside seasonal farm duties',
            'Simple hand tools (spinning wheels and handlooms) with low output',
            'Goods were expensive and produced in small local batches',
          ],
        },
        rightColumn: {
          title: 'Mechanized Factory System',
          subtitle: 'Centralized Mill Production',
          badge: 'FACTORY ERA',
          items: [
            'Hundreds of workers operated heavy steam- or water-powered machines under one roof',
            'Strict clock-regulated shifts (often 12–14 hours a day)',
            'Division of labor broke manufacturing into repetitive, specialized steps',
            'Mass production lowered prices of cotton cloth and iron goods worldwide',
          ],
        },
      },
      {
        id: 5,
        kicker: 'URBANIZATION & SOCIETY',
        title: 'Rapid Urbanization & Working-Class Living Conditions',
        subtitle: 'How factory migration reshaped cities like Manchester, Birmingham, and Leeds',
        layout: 'three-column',
        cards: [
          {
            title: 'Explosion of Industrial Cities',
            content: 'Millions migrated from rural villages to mill towns; Manchester’s population grew sixfold between 1770 and 1830.',
            icon: 'users',
            badge: '01 · URBAN GROWTH',
            statValue: '50%+',
            statLabel: 'Urban share of British population by 1850',
          },
          {
            title: 'Overcrowded Tenements & Sanitation',
            content: 'Unplanned worker housing lacked clean piped water and sewage systems, leading to outbreaks of cholera and typhus.',
            icon: 'alert-circle',
            badge: '02 · LIVING CONDITIONS',
            statValue: '12–14h',
            statLabel: 'Typical daily factory shift',
          },
          {
            title: 'Emergence of New Social Classes',
            content: 'Created an industrial middle class (factory owners, engineers, merchants) and an urban industrial working class.',
            icon: 'briefcase',
            badge: '03 · SOCIAL STRUCTURE',
            statValue: '3x',
            statLabel: 'Growth in British iron & coal output',
          },
        ],
      },
      {
        id: 6,
        kicker: 'LABOR & REFORM',
        title: 'Factory Working Conditions & Progressive Labor Reforms',
        subtitle: 'How parliamentary investigations and worker movements improved safety and child welfare',
        layout: 'problem-solution',
        leftColumn: {
          title: 'Early Industrial Abuses',
          subtitle: 'Hazards in Unregulated Mills & Mines',
          badge: 'CHALLENGES',
          items: [
            'Children as young as 8 worked around unguarded moving textile machinery',
            'Coal mines suffered from cave-ins, coal dust, and poor ventilation',
            'No minimum wage, injury compensation, or limits on working hours',
          ],
        },
        rightColumn: {
          title: '19th-Century Reform Milestones',
          subtitle: 'Legislation & Public Health Improvements',
          badge: 'REFORMS',
          items: [
            'Factory Act of 1833 banned employment of children under 9 and required daily schooling',
            'Mines Act of 1842 prohibited women and young boys from working underground',
            'Public Health Act (1848) and modern municipal water/sewer networks transformed city health',
          ],
        },
      },
      {
        id: 7,
        kicker: 'CONCLUSION & HISTORICAL LEGACY',
        title: 'Lasting Consequences of the Industrial Revolution',
        subtitle: 'How industrialization shaped the modern global economy and technology',
        layout: 'conclusion',
        cards: [
          {
            title: 'Technological & Economic Acceleration',
            content: 'Steam power, railways, and mechanized manufacturing laid the foundation for modern engineering and global trade.',
            icon: 'check-circle',
            badge: 'TAKEAWAY 01',
          },
          {
            title: 'Urban & Social Transformation',
            content: 'Shifted human society from predominantly rural farming communities to interconnected urban centers.',
            icon: 'users',
            badge: 'TAKEAWAY 02',
          },
          {
            title: 'Rise of Labor Rights & Public Education',
            content: 'Social challenges sparked vital reforms in labor law, public sanitation, and universal schooling.',
            icon: 'scale',
            badge: 'TAKEAWAY 03',
          },
        ],
        takeaway: 'Thank You! • Questions & Historical Discussion',
      },
    ];

    return finalizeSlideDeck(
      industrialSlides,
      slideCount,
      'The Industrial Revolution',
      'Steam Power, Mechanized Factories, Urbanization & Social Change',
      palette,
      isPbl,
      audience
    );
  }

  // =========================================================================
  // 3. PHOTOSYNTHESIS / BIOLOGY
  // =========================================================================
  if (/photosynthesis/i.test(lower)) {
    const photoSlides: SlideData[] = [
      {
        id: 1,
        kicker: 'PLANT BIOLOGY & BIOENERGETICS',
        title: 'Photosynthesis: How Plants Power Earth',
        subtitle: 'Converting Solar Energy into Chemical Energy & Atmospheric Oxygen',
        layout: 'title',
        cards: [
          {
            title: 'Solar Capture',
            content: 'Chlorophyll pigments absorb blue and red wavelengths of sunlight inside leaf chloroplasts.',
            icon: 'zap',
            badge: 'SUNLIGHT',
          },
          {
            title: 'Carbon Fixation',
            content: 'Plants take in carbon dioxide (CO₂) through stomata and water (H₂O) through roots.',
            icon: 'globe',
            badge: 'REACTANTS',
          },
          {
            title: 'Glucose & Oxygen',
            content: 'Produces energy-rich glucose (C₆H₁₂O₆) for plant growth and releases vital O₂ into the air.',
            icon: 'heart',
            badge: 'PRODUCTS',
          },
        ],
        takeaway: '6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ (Glucose) + 6O₂',
      },
      {
        id: 2,
        kicker: 'BIOCHEMICAL FOUNDATION',
        title: 'What Is Photosynthesis?',
        subtitle: 'The biological process by which autotrophs convert light energy into chemical fuel',
        layout: 'definition',
        cards: [
          {
            title: 'The Core Chemical Equation',
            content: 'Six molecules of carbon dioxide combine with six molecules of water using solar energy to synthesize one molecule of glucose and six molecules of oxygen.',
            icon: 'activity',
            badge: 'EQUATION',
            items: [
              'Reactants: Carbon Dioxide (6CO₂) + Water (6H₂O) + Sunlight',
              'Catalyst: Chlorophyll a & b inside Chloroplasts',
              'Products: Glucose (C₆H₁₂O₆) + Oxygen Gas (6O₂)',
            ],
          },
          {
            title: 'Where It Occurs Inside the Leaf',
            content: 'Mesophyll cells in plant leaves contain specialized organelles called chloroplasts, while microscopic pores called stomata regulate gas exchange.',
            icon: 'layers',
            badge: 'LEAF ANATOMY',
            items: [
              'Thylakoid membranes: Site of light-dependent reactions',
              'Stroma fluid: Site of the Calvin Cycle (carbon fixation)',
              'Xylem & Phloem: Transport water in and sugars out',
            ],
          },
        ],
      },
      {
        id: 3,
        kicker: 'TWO-STAGE MECHANISM',
        title: 'Light-Dependent Reactions vs. The Calvin Cycle',
        subtitle: 'How chloroplasts capture energy first and build sugar molecules second',
        layout: 'comparison',
        leftColumn: {
          title: 'Stage 1: Light-Dependent Reactions',
          subtitle: 'Occurs in the Thylakoid Membranes',
          badge: 'STAGE 01 · LIGHT',
          items: [
            'Requires direct sunlight absorbed by Photosystem II and I',
            'Splits water molecules (photolysis) into H⁺ ions, electrons, and O₂ gas',
            'Releases oxygen (O₂) into the atmosphere as a byproduct',
            'Generates energy carriers ATP and NADPH for Stage 2',
          ],
        },
        rightColumn: {
          title: 'Stage 2: The Calvin Cycle',
          subtitle: 'Occurs in the Chloroplast Stroma',
          badge: 'STAGE 02 · CALVIN CYCLE',
          items: [
            'Does not require direct light, but uses ATP and NADPH from Stage 1',
            'Enzyme RuBisCO captures carbon atoms from CO₂ gas',
            'Builds 3-carbon G3P sugars that combine to form glucose',
            'Recycles ADP and NADP⁺ back to the thylakoids',
          ],
        },
      },
      {
        id: 4,
        kicker: 'STEP-BY-STEP FLOW',
        title: 'Step-by-Step Journey of a Photon & Carbon Atom',
        subtitle: 'Tracing energy transfer from sunlight to stored plant carbohydrate',
        layout: 'process',
        cards: [
          {
            title: 'Photon Absorption',
            content: 'Sunlight strikes chlorophyll molecules in the thylakoid, exciting electrons to a higher energy state.',
            icon: 'zap',
            badge: 'STEP 01',
          },
          {
            title: 'Water Splitting & Electron Transport',
            content: 'Enzymes split H₂O; electrons travel down the transport chain, pumping protons to synthesize ATP.',
            icon: 'activity',
            badge: 'STEP 02',
          },
          {
            title: 'Carbon Fixation by RuBisCO',
            content: 'CO₂ enters through leaf stomata and binds to RuBP inside the stroma during the Calvin Cycle.',
            icon: 'refresh-cw',
            badge: 'STEP 03',
          },
          {
            title: 'Glucose Synthesis & Storage',
            content: 'G3P molecules assemble into glucose, sucrose, starch, and cellulose to build roots, stems, and fruits.',
            icon: 'check-circle',
            badge: 'STEP 04',
          },
        ],
      },
      {
        id: 5,
        kicker: 'ENVIRONMENTAL VARIABLES',
        title: 'Limiting Factors of Photosynthesis',
        subtitle: 'External conditions that control how fast plants can photosynthesize',
        layout: 'three-column',
        cards: [
          {
            title: 'Light Intensity & Wavelength',
            content: 'Higher light intensity increases the rate of photosynthesis until chlorophyll reaction centers reach saturation.',
            icon: 'zap',
            badge: 'LIGHT',
            statValue: '400–700nm',
            statLabel: 'Photosynthetically Active Radiation',
          },
          {
            title: 'Carbon Dioxide Concentration',
            content: 'CO₂ is the raw carbon source for the Calvin Cycle; low CO₂ directly limits sugar production.',
            icon: 'globe',
            badge: 'CO₂ LEVEL',
            statValue: '0.04%',
            statLabel: 'Atmospheric CO₂ concentration',
          },
          {
            title: 'Temperature & Water Availability',
            content: 'Photosynthetic enzymes work best between 20°C–35°C; drought forces stomata to close to conserve water.',
            icon: 'flame',
            badge: 'TEMPERATURE',
            statValue: '25°C–30°C',
            statLabel: 'Optimal enzyme range',
          },
        ],
      },
      {
        id: 6,
        kicker: 'PLANT ADAPTATIONS',
        title: 'C3, C4, and CAM Photosynthetic Pathways',
        subtitle: 'How plants adapt photosynthesis to temperate, hot tropical, and arid desert climates',
        layout: 'three-column',
        cards: [
          {
            title: 'C3 Plants (Rice, Wheat, Trees)',
            content: 'Standard Calvin Cycle used by 85% of plant species; highly efficient in cool, moist environments.',
            icon: 'book-open',
            badge: 'C3 PATHWAY',
          },
          {
            title: 'C4 Plants (Maize, Sugarcane)',
            content: 'Spatially separates carbon capture into bundle-sheath cells to minimize photorespiration in hot climates.',
            icon: 'zap',
            badge: 'C4 PATHWAY',
          },
          {
            title: 'CAM Plants (Cacti, Pineapple)',
            content: 'Opens stomata only at night to store CO₂ as malic acid, preventing water loss in extreme deserts.',
            icon: 'shield',
            badge: 'CAM PATHWAY',
          },
        ],
      },
      {
        id: 7,
        kicker: 'GLOBAL ECOLOGICAL IMPORTANCE',
        title: 'Why Photosynthesis Sustains All Life on Earth',
        subtitle: 'Quantifying planetary oxygen production and carbon sequestration',
        layout: 'statistics',
        stats: [
          {
            value: '100B+',
            label: 'Metric Tons of Carbon Fixed Yearly',
            description: 'Terrestrial plants and marine phytoplankton convert CO₂ into organic biomass every year.',
            percentage: 90,
          },
          {
            value: '98%',
            label: 'Atmospheric Oxygen Source',
            description: 'Nearly all breathable oxygen on Earth originates from photosynthetic organisms.',
            percentage: 98,
          },
          {
            value: '100%',
            label: 'Foundation of Food Webs',
            description: 'Directly or indirectly supplies the metabolic energy for virtually all herbivores and carnivores.',
            percentage: 100,
          },
        ],
      },
      {
        id: 8,
        kicker: 'SUMMARY & REVIEW',
        title: 'Key Takeaways: Photosynthesis',
        subtitle: 'Essential concepts from chloroplast chemistry to planetary ecology',
        layout: 'conclusion',
        cards: [
          {
            title: 'Two Linked Stages',
            content: 'Light-dependent reactions in thylakoids make ATP/NADPH and O₂; the Calvin Cycle in the stroma builds glucose.',
            icon: 'check-circle',
            badge: 'TAKEAWAY 01',
          },
          {
            title: 'Chlorophyll & Stomata',
            content: 'Chlorophyll captures solar photons while stomata regulate CO₂ intake and water transpiration.',
            icon: 'layers',
            badge: 'TAKEAWAY 02',
          },
          {
            title: 'Earth’s Life Support System',
            content: 'Photosynthesis drives the global carbon cycle, feeds the biosphere, and maintains our oxygen atmosphere.',
            icon: 'globe',
            badge: 'TAKEAWAY 03',
          },
        ],
        takeaway: 'Thank You! • Questions & Discussion',
      },
    ];

    return finalizeSlideDeck(
      photoSlides,
      slideCount,
      'Photosynthesis',
      'Cellular Mechanisms, Chloroplast Chemistry & Ecological Impact',
      palette,
      isPbl,
      audience
    );
  }

  // =========================================================================
  // 4. 1857 WAR OF INDEPENDENCE / HISTORICAL TOPICS
  // =========================================================================
  if (/1857/i.test(lower)) {
    const war1857Slides: SlideData[] = [
      {
        id: 1,
        kicker: 'SOUTH ASIAN HISTORY • 1857',
        title: 'The War of Independence (1857)',
        subtitle: 'Causes, Key Leaders, Major Centers & Lasting Constitutional Impact',
        layout: 'title',
        cards: [
          {
            title: 'Political & Economic Grievances',
            content: 'Doctrine of Lapse, annexation of states, heavy land taxation, and decline of local artisans.',
            icon: 'scale',
            badge: 'CAUSES',
          },
          {
            title: 'Major Uprising Centers',
            content: 'Meerut, Delhi, Kanpur, Lucknow, Jhansi, and Bareilly became focal points of resistance.',
            icon: 'globe',
            badge: 'CENTERS',
          },
          {
            title: 'Historical Turning Point',
            content: 'Ended East India Company rule and led to the Government of India Act 1858.',
            icon: 'award',
            badge: 'OUTCOME',
          },
        ],
        takeaway: 'A watershed moment in the history of the Subcontinent.',
      },
      {
        id: 2,
        kicker: 'ROOT CAUSES',
        title: 'Political, Economic & Social Causes',
        subtitle: 'Decades of policies under the British East India Company that fueled widespread discontent',
        layout: 'three-column',
        cards: [
          {
            title: 'Political Annexations',
            content: 'Lord Dalhousie’s Doctrine of Lapse annexed Satara, Jhansi, and Nagpur, while Awadh was annexed in 1856, alienating rulers and soldiers.',
            icon: 'shield',
            badge: 'POLITICAL',
          },
          {
            title: 'Economic Exploitation',
            content: 'High agrarian land revenue systems impoverished peasants, while tariff policies devastated traditional textile craftsmen.',
            icon: 'briefcase',
            badge: 'ECONOMIC',
          },
          {
            title: 'Social & Religious Concerns',
            content: 'Fears of forced cultural interference, missionary activities, and changes to traditional inheritance laws caused deep anxiety.',
            icon: 'users',
            badge: 'SOCIAL',
          },
        ],
      },
      {
        id: 3,
        kicker: 'THE IMMEDIATE SPARK',
        title: 'Military Grievances & The Enfield Rifle Spark',
        subtitle: 'How discontent among sepoys erupted in Meerut in May 1857',
        layout: 'two-column',
        cards: [
          {
            title: 'Sepoy Service Conditions',
            content: 'Indian soldiers (sepoys) formed the vast majority of the Company army but faced low pay, blocked promotions, and the General Service Enlistment Act (1856).',
            icon: 'alert-circle',
            badge: 'MILITARY GRIEVANCES',
            items: [
              'Vast pay disparity compared to European soldiers',
              'Mandatory overseas deployment crossing religious taboos',
              'Loss of extra allowances (Bhatta) after annexations',
            ],
          },
          {
            title: 'The Greased Cartridges Incident (1857)',
            content: 'The newly introduced Pattern 1853 Enfield rifle required soldiers to bite open paper cartridges rumored to be greased with cow and pig tallow.',
            icon: 'flame',
            badge: 'IMMEDIATE TRIGGER',
            items: [
              'Deeply offended both Hindu and Muslim soldiers',
              '85 cavalrymen in Meerut refused the cartridges on May 9, 1857',
              'On May 10, 1857, sepoys broke out in open revolt and marched to Delhi',
            ],
          },
        ],
      },
      {
        id: 4,
        kicker: 'CHRONOLOGY OF EVENTS',
        title: 'Timeline of the 1857 Uprising',
        subtitle: 'Key milestones from the outbreak in Barrackpore and Meerut to 1858',
        layout: 'timeline',
        cards: [
          {
            title: 'March–May 1857: Barrackpore & Meerut',
            content: 'Early resistance in Barrackpore (March 29) followed by the full uprising in Meerut on May 10, 1857.',
            icon: 'clock',
            badge: 'MAY 1857',
          },
          {
            title: 'May 11, 1857: Proclamation in Delhi',
            content: 'Sepoys entered Delhi and proclaimed Mughal Emperor Bahadur Shah Zafar as the symbolic leader of Hindustan.',
            icon: 'award',
            badge: 'DELHI',
          },
          {
            title: 'June–Sept 1857: Spread Across North & Central India',
            content: 'Fierce battles in Kanpur, Lucknow, Jhansi, Bareilly, and Bihar led by regional commanders.',
            icon: 'flame',
            badge: 'EXPANSION',
          },
          {
            title: '1858: Suppression & Constitutional Shift',
            content: 'Following the recapture of Delhi, Lucknow, and Gwalior, the British Parliament passed the Act of 1858.',
            icon: 'scale',
            badge: '1858',
          },
        ],
      },
      {
        id: 5,
        kicker: 'KEY FIGURES & CENTERS',
        title: 'Prominent Leaders and Regional Centers',
        subtitle: 'Key figures who led the resistance across major cities',
        layout: 'four-card-grid',
        cards: [
          {
            title: 'Delhi: Bahadur Shah Zafar & Bakht Khan',
            content: 'Emperor Bahadur Shah Zafar provided unifying legitimacy while General Bakht Khan commanded the military defense of Delhi.',
            icon: 'award',
            badge: 'DELHI',
          },
          {
            title: 'Lucknow (Awadh): Begum Hazrat Mahal',
            content: 'Organized resistance in Lucknow on behalf of her minor son Birjis Qadr with widespread support from taluqdars and peasants.',
            icon: 'shield',
            badge: 'LUCKNOW',
          },
          {
            title: 'Jhansi & Gwalior: Rani Lakshmibai & Tatya Tope',
            content: 'Led courageous military campaigns defending Jhansi and capturing Gwalior fort.',
            icon: 'zap',
            badge: 'JHANSI',
          },
          {
            title: 'Kanpur & Bihar: Nana Sahib & Kunwar Singh',
            content: 'Nana Sahib led forces in Kanpur while 80-year-old Kunwar Singh waged an agile campaign in Arrah, Bihar.',
            icon: 'compass',
            badge: 'KANPUR & BIHAR',
          },
        ],
      },
      {
        id: 6,
        kicker: 'STRATEGIC ANALYSIS',
        title: 'Why the Uprising Did Not Succeed Militarily',
        subtitle: 'Comparing the structural challenges of the rebels with British military advantages',
        layout: 'comparison',
        leftColumn: {
          title: 'Challenges Faced by the Uprising',
          subtitle: 'Internal & Logistical Limitations',
          badge: 'LIMITATIONS',
          items: [
            'Lack of a single unified central command and coordinated strategy',
            'Limited geographical reach (mostly northern and central regions)',
            'Shortage of modern artillery, ammunition, and financial reserves',
            'Several princely states remained neutral or aided the Company',
          ],
        },
        rightColumn: {
          title: 'British Strategic Advantages',
          subtitle: 'Communication & Resources',
          badge: 'ADVANTAGES',
          items: [
            'Control over the electric telegraph network and railway lines',
            'Superior modern rifles, artillery, and naval supply routes',
            'Reinforcements redirected after the conclusion of the Crimean War',
            'Unified military command under experienced generals',
          ],
        },
      },
      {
        id: 7,
        kicker: 'CONSEQUENCES & REFORMS',
        title: 'Far-Reaching Impact of 1857',
        subtitle: 'How the events of 1857 reshaped governance, military structure, and political awakening',
        layout: 'three-column',
        cards: [
          {
            title: 'End of East India Company Rule',
            content: 'The Government of India Act 1858 abolished Company rule and transferred sovereignty directly to the British Crown under a Viceroy.',
            icon: 'scale',
            badge: '1858 ACT',
          },
          {
            title: 'Queen Victoria’s Proclamation',
            content: 'Promised non-interference in religious beliefs, ended the Doctrine of Lapse, and recognized the rights of native princes.',
            icon: 'book-open',
            badge: 'POLICY SHIFT',
          },
          {
            title: 'Seed of Later Independence Movements',
            content: 'Became an enduring symbol of resistance that inspired 20th-century constitutional and freedom movements across South Asia.',
            icon: 'globe',
            badge: 'LEGACY',
          },
        ],
      },
      {
        id: 8,
        kicker: 'CONCLUSION & SUMMARY',
        title: 'Key Takeaways: The 1857 War of Independence',
        subtitle: 'Synthesizing the causes, course, and legacy of 1857',
        layout: 'conclusion',
        cards: [
          {
            title: 'Multi-Dimensional Causes',
            content: 'Triggered by the Enfield cartridge issue, but rooted in decades of political annexations and economic hardship.',
            icon: 'check-circle',
            badge: 'TAKEAWAY 01',
          },
          {
            title: 'Courageous Regional Leadership',
            content: 'Leaders in Delhi, Lucknow, Jhansi, Kanpur, and Bihar demonstrated remarkable resilience.',
            icon: 'award',
            badge: 'TAKEAWAY 02',
          },
          {
            title: 'Constitutional Transformation',
            content: 'Ended a century of East India Company rule and fundamentally altered the history of the Subcontinent.',
            icon: 'scale',
            badge: 'TAKEAWAY 03',
          },
        ],
        takeaway: 'Thank You! • Questions & Historical Discussion',
      },
    ];

    return finalizeSlideDeck(
      war1857Slides,
      slideCount,
      'The 1857 War of Independence',
      'Causes, Major Centers, Leadership & Constitutional Impact',
      palette,
      isPbl,
      audience
    );
  }

  // =========================================================================
  // 5. MAN (METROPOLITAN AREA NETWORK) & COMPUTER NETWORKING (Topic Understanding Engine)
  // =========================================================================
  if (
    /\b(man|metropolitan\s+area\s+network|lan\s+man\s+wan|computer\s+network(s|ing)?|network\s+topolog(y|ies))\b/i.test(
      lower
    )
  ) {
    const isSpecificallyMan = /\b(man|metropolitan\s+area\s+network)\b/i.test(lower);
    const netTitle = isSpecificallyMan
      ? 'Metropolitan Area Network (MAN)'
      : cleanTopic;
    const netSubtitle = isSpecificallyMan
      ? 'City-Wide Network Architecture, Fiber Interconnection, Components, Applications & LAN/WAN Comparison'
      : 'Network Architecture, Data Transmission, Topologies, Protocols & Real-World Deployment';

    const manSlides: SlideData[] = [
      {
        id: 1,
        kicker: 'COMPUTER NETWORKING',
        title: isSpecificallyMan ? 'Metropolitan Area Network (MAN)' : netTitle,
        subtitle: isSpecificallyMan
          ? 'A network that connects multiple local networks across a city or large campus.'
          : netSubtitle,
        layout: 'title',
        cards: [
          {
            title: 'What Is a MAN?',
            content:
              'A Metropolitan Area Network (MAN) connects multiple local networks across a city or large campus. It is larger than a LAN but usually smaller than a WAN.',
            icon: 'globe',
            badge: 'DEFINITION',
          },
          {
            title: 'City-Wide Coverage (5 to 50 km)',
            content:
              'A MAN typically spans 5 to 50 kilometers, linking separate office buildings, schools, and campuses across the same city.',
            icon: 'git-merge',
            badge: '5–50 KM SCOPE',
          },
          {
            title: 'High-Speed Fiber Connections',
            content:
              'It uses high-speed fiber-optic cables and wireless links so organizations across a city can share data and network services quickly.',
            icon: 'zap',
            badge: 'HIGH SPEED',
          },
        ],
        takeaway: 'A MAN connects multiple Local Area Networks (LANs) across a city into one high-speed network.',
      },
      {
        id: 2,
        kicker: 'HOW IT WORKS',
        title: 'How MAN Works Across a City',
        subtitle:
          'A MAN links separate local networks using high-speed connections such as fiber-optic links.',
        layout: 'process',
        cards: [
          {
            title: '1. Local Building Networks (LANs)',
            content:
              'Each office, school, or hospital building has its own Local Area Network (LAN) connecting computers and Wi-Fi devices inside that building.',
            icon: 'layers',
            badge: 'STEP 01',
          },
          {
            title: '2. Edge Routers & Access Links',
            content:
              'Routers at each building send data out through high-speed fiber-optic or wireless links to a nearby city network hub.',
            icon: 'cpu',
            badge: 'STEP 02',
          },
          {
            title: '3. City-Wide Fiber Ring',
            content:
              'High-speed switches move data along underground fiber-optic rings that connect different parts of the city in milliseconds.',
            icon: 'refresh-cw',
            badge: 'STEP 03',
          },
          {
            title: '4. Sharing Data & Internet Access',
            content:
              'Connected locations across the city share files, servers, and internet access as if they were in the same building.',
            icon: 'globe',
            badge: 'STEP 04',
          },
        ],
        takeaway:
          'This allows offices, schools, or other locations within the same metropolitan area to share data and services.',
      },
      {
        id: 3,
        kicker: 'NETWORK HARDWARE',
        title: 'Main Components of a MAN',
        subtitle:
          'A MAN includes routers, switches, transmission links, and connected LANs working together to move data.',
        layout: 'three-column',
        cards: [
          {
            title: 'Fiber-Optic & Wireless Links',
            content:
              'Underground fiber-optic cables and rooftop microwave links carry large amounts of data quickly between buildings across the city.',
            icon: 'zap',
            badge: 'TRANSMISSION LINKS',
            statValue: '10–100 Gbps',
            statLabel: 'Typical city fiber speed',
          },
          {
            title: 'Routers and Switches',
            content:
              'High-speed routers and switches direct network traffic to the right building and keep data moving smoothly without delays.',
            icon: 'cpu',
            badge: 'ROUTERS & SWITCHES',
            statValue: '< 5 ms',
            statLabel: 'Fast city-wide response time',
          },
          {
            title: 'Connected Local Networks (LANs)',
            content:
              'Multiple smaller LANs in schools, offices, and branches plug into the MAN so their computers can communicate across town.',
            icon: 'shield',
            badge: 'CONNECTED LANS',
            statValue: '5–50 km',
            statLabel: 'City coverage distance',
          },
        ],
        takeaway: 'Routers, switches, transmission links, and connected LANs work together to move data between locations.',
      },
      {
        id: 4,
        kicker: 'USES, BENEFITS & LIMITATIONS',
        title: 'Real-World Uses of a MAN',
        subtitle:
          'How universities, businesses, and cities use Metropolitan Area Networks in everyday life',
        layout: 'problem-solution',
        leftColumn: {
          title: 'Real-World Uses & Benefits',
          subtitle: 'Why Organizations Use a MAN',
          badge: 'USES & BENEFITS',
          items: [
            'Universities use a MAN to connect several campuses and libraries across a city.',
            'Businesses and banks use MANs to connect city offices and share central servers.',
            'Hospitals across a city share patient records and medical imaging quickly.',
            'City governments link traffic lights, public Wi-Fi, and emergency services.',
          ],
        },
        rightColumn: {
          title: 'Main Limitations of a MAN',
          subtitle: 'Challenges to Keep in Mind',
          badge: 'LIMITATIONS',
          items: [
            'Installing underground fiber-optic cables across city streets is expensive.',
            'Requires skilled network technicians to manage and repair the equipment.',
            'Road construction or storms can accidentally damage city cables.',
            'A MAN only covers one city, so a WAN is still needed to connect different countries.',
          ],
        },
        takeaway: 'Universities, businesses, hospitals, and city services rely on MANs for fast city-wide communication.',
      },
      {
        id: 5,
        kicker: 'NETWORK COMPARISON',
        title: 'MAN Compared With LAN and WAN',
        subtitle:
          'A LAN covers a building, a MAN connects networks across a city, and a WAN covers much larger geographic areas.',
        layout: 'comparison',
        leftColumn: {
          title: 'Metropolitan Area Network (MAN)',
          subtitle: 'City & Multi-Campus Scale (5 to 50 km)',
          badge: 'MAN (CITY SCALE)',
          items: [
            'Covers a whole city, town, or multi-campus university (5 to 50 km).',
            'Connects several separate building LANs together across a city.',
            'Usually managed by a telecom provider, city utility, or large organization.',
            'Uses high-speed fiber-optic rings to move data quickly across town.',
          ],
        },
        rightColumn: {
          title: 'LAN (Local) and WAN (Wide Area)',
          subtitle: 'Single Building vs. Country & Global Scale',
          badge: 'LAN & WAN',
          items: [
            'LAN (Local Area Network) covers a small area such as one home, school, or office building.',
            'LANs are privately owned, inexpensive to set up, and use Ethernet cables or Wi-Fi.',
            'WAN (Wide Area Network) covers much larger geographic areas such as countries or the whole world.',
            'The Internet is the largest example of a WAN, connecting networks globally.',
          ],
        },
        takeaway: 'LAN covers a building • MAN connects networks across a city • WAN covers countries and the world.',
      },
      {
        id: 6,
        kicker: 'TOPOLOGY & FAULT TOLERANCE',
        title: 'Dual-Ring Topology & Redundancy in Metropolitan Networks',
        subtitle: 'How MANs stay online even if an underground fiber cable is accidentally severed',
        layout: 'four-card-grid',
        cards: [
          {
            title: 'Dual Counter-Rotating Fiber Rings',
            content:
              'Primary and backup fiber rings carry traffic in opposite directions around the city for instant failover.',
            icon: 'refresh-cw',
            badge: 'RING TOPOLOGY',
          },
          {
            title: 'Automatic Sub-50ms Protection Switching',
            content:
              'If a fiber cut occurs, SONET/Resilient Packet Ring switches wrap traffic onto the backup ring in under 50 milliseconds.',
            icon: 'shield',
            badge: 'SELF-HEALING',
          },
          {
            title: 'Point-to-Multipoint Wireless Backup',
            content:
              'Rooftop microwave transceivers provide wireless redundancy when trenching fiber across rivers or highways is impractical.',
            icon: 'zap',
            badge: 'WIRELESS LINK',
          },
          {
            title: 'Centralized Network Operations Center (NOC)',
            content:
              'ISP engineers monitor optical signal power, bandwidth utilization, and security across all city nodes 24/7.',
            icon: 'activity',
            badge: 'MONITORING',
          },
        ],
      },
      {
        id: 7,
        kicker: 'REAL-WORLD CASE EXAMPLES',
        title: 'Real-World Examples of Metropolitan Area Networks',
        subtitle: 'Concrete examples of MAN infrastructure operating in modern cities',
        layout: 'case-study',
        cards: [
          {
            title: 'Cable TV & DOCSIS Broadband Networks',
            content:
              'Cable television systems originally built to distribute TV signals across a city evolved into hybrid fiber-coaxial (HFC) MANs delivering high-speed home internet.',
            icon: 'globe',
            badge: 'EXAMPLE 01',
          },
          {
            title: 'Multi-Campus University & School Networks',
            content:
              'Universities with medical, engineering, and downtown campuses use a dedicated fiber MAN so students and labs share one seamless network.',
            icon: 'graduation-cap',
            badge: 'EXAMPLE 02',
          },
          {
            title: 'Municipal Smart-City & Public Safety Grids',
            content:
              'City governments connect traffic lights, CCTV cameras, public Wi-Fi, and emergency dispatch centers over a secure municipal MAN.',
            icon: 'award',
            badge: 'EXAMPLE 03',
          },
        ],
      },
      {
        id: 8,
        kicker: 'SUMMARY & REVIEW',
        title: 'Summary: Key Concepts of Metropolitan Area Networks',
        subtitle: 'Essential networking takeaways on MAN scope, architecture, and applications',
        layout: 'conclusion',
        cards: [
          {
            title: 'City-Wide Scope (5–50 km)',
            content:
              'MAN sits between LAN and WAN, linking multiple local networks across a town or metropolitan area.',
            icon: 'check-circle',
            badge: 'CONCEPT 01',
          },
          {
            title: 'Fiber Backbone & Metro Ethernet',
            content:
              'Uses high-capacity optical fiber rings, edge routers, and Carrier Ethernet for fast, resilient data transfer.',
            icon: 'cpu',
            badge: 'CONCEPT 02',
          },
          {
            title: 'Powers Campuses, Healthcare & Cities',
            content:
              'Essential for multi-site universities, city hospitals, banking branches, and municipal infrastructure.',
            icon: 'globe',
            badge: 'CONCEPT 03',
          },
        ],
        takeaway: 'Thank You! • Questions & Computer Networking Discussion',
      },
    ];

    return finalizeSlideDeck(
      manSlides,
      slideCount,
      netTitle,
      netSubtitle,
      palette,
      isPbl,
      audience
    );
  }

  // =========================================================================
  // 6. FRENCH REVOLUTION & HISTORICAL REVOLUTIONS (Topic Understanding Engine)
  // =========================================================================
  if (/\b(french\s+revolution|world\s+war\s+(i|ii|1|2|one|two)|american\s+revolution)\b/i.test(lower)) {
    const isFrenchRev = /french\s+revolution/i.test(lower);
    const histSlides: SlideData[] = isFrenchRev
      ? [
          {
            id: 1,
            kicker: 'EUROPEAN & WORLD HISTORY • 1789–1799',
            title: 'The French Revolution (1789–1799)',
            subtitle: 'The Three Estates, Causes of Crisis, Key Turning Points & Lasting Democratic Legacy',
            layout: 'title',
            cards: [
              {
                title: 'Inequality of the Three Estates',
                content: 'How France’s rigid feudal hierarchy privileged the clergy and nobility while taxing the Third Estate.',
                icon: 'users',
                badge: 'SOCIAL STRUCTURE',
              },
              {
                title: '1789: From Estates-General to Bastille',
                content: 'Financial bankruptcy, bread shortages, the Tennis Court Oath, and the Storming of the Bastille.',
                icon: 'flame',
                badge: 'REVOLUTION',
              },
              {
                title: 'Constitutional & Global Impact',
                content: 'Abolition of feudalism, the Declaration of the Rights of Man, and the rise of modern civic citizenship.',
                icon: 'scale',
                badge: 'LEGACY',
              },
            ],
            takeaway: `Historical Presentation • ${audience || 'World History'}`,
          },
          {
            id: 2,
            kicker: 'PRE-REVOLUTIONARY SOCIETY',
            title: 'France’s Ancien Régime & The Three Estates',
            subtitle: 'How social and tax inequality fueled widespread resentment before 1789',
            layout: 'three-column',
            cards: [
              {
                title: 'First Estate: The Clergy',
                content: 'Owned ~10% of French land, collected tithes, and paid virtually no direct taxes to the royal treasury.',
                icon: 'book-open',
                badge: 'FIRST ESTATE',
                statValue: '~0.5%',
                statLabel: 'Share of French population',
              },
              {
                title: 'Second Estate: The Nobility',
                content: 'Held top military, court, and government offices, owned ~25% of land, and was exempt from the taille tax.',
                icon: 'award',
                badge: 'SECOND ESTATE',
                statValue: '~1.5%',
                statLabel: 'Share of French population',
              },
              {
                title: 'Third Estate: Commoners & Bourgeoisie',
                content: 'Peasants, urban artisans, and educated professionals (lawyers, doctors, merchants) bore almost the entire tax burden.',
                icon: 'users',
                badge: 'THIRD ESTATE',
                statValue: '98%',
                statLabel: 'Taxed population with minimal political voice',
              },
            ],
          },
          {
            id: 3,
            kicker: 'ROOT CAUSES OF CRISIS',
            title: 'What Caused the French Revolution?',
            subtitle: 'Convergence of Enlightenment philosophy, royal bankruptcy, and severe food shortages',
            layout: 'cause-effect',
            cards: [
              {
                title: 'Enlightenment Ideas of Liberty & Rights',
                content: 'Thinkers like Rousseau, Montesquieu, and Voltaire challenged absolute monarchy and divine right.',
                icon: 'sparkles',
                badge: 'INTELLECTUAL CAUSE',
              },
              {
                title: 'State Debt & War Expenditures',
                content: 'Costly wars (including funding the American Revolution) and extravagant court spending pushed King Louis XVI into bankruptcy.',
                icon: 'alert-circle',
                badge: 'FINANCIAL CRISIS',
              },
              {
                title: '1788 Harvest Failure & Bread Prices',
                content: 'Severe hailstorms ruined grain crops; bread prices soared to 80% of a worker’s daily wage, sparking urban riots.',
                icon: 'flame',
                badge: 'ECONOMIC TRIGGER',
              },
            ],
          },
          {
            id: 4,
            kicker: 'CHRONOLOGY OF EVENTS',
            title: 'Key Events & Turning Points (1789–1799)',
            subtitle: 'Major milestones from the National Assembly to the rise of Napoleon Bonaparte',
            layout: 'timeline',
            cards: [
              {
                title: 'June–July 1789: National Assembly & The Bastille',
                content: 'Third Estate delegates took the Tennis Court Oath (June 20), and Parisians stormed the Bastille fortress on July 14, 1789.',
                icon: 'flame',
                badge: 'SUMMER 1789',
              },
              {
                title: 'August 1789: Declaration of the Rights of Man',
                content: 'Abolished feudal privileges and proclaimed natural rights to liberty, property, security, and equality before the law.',
                icon: 'scale',
                badge: 'AUG 1789',
              },
              {
                title: '1792–1794: First Republic & Reign of Terror',
                content: 'Monarchy was abolished (1792); wartime fear and radical Jacobin rule under Robespierre led to the Reign of Terror.',
                icon: 'shield',
                badge: '1792–1794',
              },
              {
                title: '1795–1799: The Directory & Napoleon’s Coup',
                content: 'After Robespierre’s fall, the five-member Directory governed until Napoleon Bonaparte seized power in November 1799.',
                icon: 'clock',
                badge: '1795–1799',
              },
            ],
          },
          {
            id: 5,
            kicker: 'HISTORICAL CONSEQUENCES',
            title: 'How the French Revolution Transformed Europe',
            subtitle: 'Comparing France before 1789 with the legal and political order that followed',
            layout: 'comparison',
            leftColumn: {
              title: 'Before 1789: Absolute Monarchy',
              subtitle: 'Feudal Privileges & Unequal Law',
              badge: 'ANCIEN RÉGIME',
              items: [
                'Absolute rule by the King without constitutional limits',
                'Hereditary tax exemptions for nobility and clergy',
                'Internal customs barriers and fragmented local laws',
              ],
            },
            rightColumn: {
              title: 'Post-Revolutionary Legacy',
              subtitle: 'Constitutional & Civic Reforms',
              badge: 'MODERN ERA',
              items: [
                'End of feudalism and aristocratic legal privileges',
                'Equality of all citizens before uniform national laws (later codified in the Napoleonic Code)',
                'Spread of constitutionalism, nationalism, and human rights across Europe',
              ],
            },
            takeaway: 'The French Revolution replaced feudal absolutism with modern concepts of citizenship and legal equality.',
          },
        ]
      : [];

    if (histSlides.length > 0) {
      return finalizeSlideDeck(
        histSlides,
        slideCount,
        'The French Revolution (1789–1799)',
        'Social Structure, Causes, Turning Points & Historical Consequences',
        palette,
        isPbl,
        audience
      );
    }
  }

  // =========================================================================
  // 7. ALGEBRAIC EQUATIONS & MATHEMATICS (Topic Understanding Engine)
  // =========================================================================
  if (/\b(algebra(ic)?\s+equations?|linear\s+equations?|quadratic\s+equations?|solving\s+equations?)\b/i.test(lower)) {
    const mathSlides: SlideData[] = [
      {
        id: 1,
        kicker: 'MATHEMATICS & ALGEBRA',
        title: 'Algebraic Equations: Structure, Solving & Applications',
        subtitle: 'Variables, Constants, Inverse Operations, Worked Examples & Real-World Problem Solving',
        layout: 'title',
        cards: [
          {
            title: 'Anatomy of an Equation',
            content: 'Understanding variables, coefficients, constants, terms, and the equality balance (=).',
            icon: 'code',
            badge: 'STRUCTURE',
          },
          {
            title: 'Step-by-Step Balance Method',
            content: 'Using inverse operations on both sides of the equals sign to isolate the unknown variable.',
            icon: 'scale',
            badge: 'METHOD',
          },
          {
            title: 'Worked Examples & Modeling',
            content: 'Solving one-step and multi-step equations and translating word problems into algebra.',
            icon: 'check-circle',
            badge: 'APPLICATIONS',
          },
        ],
        takeaway: `Mathematics Presentation • ${audience || 'Algebra & Problem Solving'}`,
      },
      {
        id: 2,
        kicker: 'EQUATION ANATOMY',
        title: 'Parts of an Algebraic Equation (e.g., 3x + 5 = 20)',
        subtitle: 'Every algebraic equation states that two mathematical expressions have the exact same value',
        layout: 'three-column',
        cards: [
          {
            title: 'Variable & Coefficient (3x)',
            content: 'The variable (x) represents the unknown number we want to find; the coefficient (3) multiplies the variable.',
            icon: 'code',
            badge: '3x · VARIABLE TERM',
            statValue: '3 · x',
            statLabel: 'Coefficient × Unknown Variable',
          },
          {
            title: 'Constants (+5 and 20)',
            content: 'Fixed numerical values that do not change. In 3x + 5 = 20, the numbers 5 and 20 are constants.',
            icon: 'layers',
            badge: 'CONSTANTS',
            statValue: '5 & 20',
            statLabel: 'Fixed known numbers',
          },
          {
            title: 'The Equality Sign (=)',
            content: 'Acts like a balanced scale: whatever operation you perform on the left side MUST be performed on the right side.',
            icon: 'scale',
            badge: 'BALANCE RULE',
            statValue: 'Left = Right',
            statLabel: 'Golden Rule of Algebra',
          },
        ],
      },
      {
        id: 3,
        kicker: 'SOLVING PROCESS',
        title: 'Step-by-Step Process for Solving Linear Equations',
        subtitle: 'How to isolate the variable systematically using inverse operations',
        layout: 'process',
        cards: [
          {
            title: 'Step 1: Simplify Each Side',
            content: 'Distribute parentheses and combine like terms on each side of the equation separately.',
            icon: 'layers',
            badge: 'STEP 01',
          },
          {
            title: 'Step 2: Undo Addition or Subtraction',
            content: 'Add or subtract the constant term from both sides so the variable term stands alone.',
            icon: 'refresh-cw',
            badge: 'STEP 02',
          },
          {
            title: 'Step 3: Undo Multiplication or Division',
            content: 'Divide or multiply both sides by the coefficient to isolate the single variable (x).',
            icon: 'cpu',
            badge: 'STEP 03',
          },
          {
            title: 'Step 4: Substitute & Verify',
            content: 'Plug your solution back into the original equation to confirm both sides are equal.',
            icon: 'check-circle',
            badge: 'STEP 04',
          },
        ],
      },
      {
        id: 4,
        kicker: 'WORKED EXAMPLES',
        title: 'Worked Examples: Two-Step & Multi-Step Equations',
        subtitle: 'Following the balance method line by line and checking the answer',
        layout: 'comparison',
        leftColumn: {
          title: 'Example 1: Solve 3x + 5 = 20',
          subtitle: 'Two-Step Linear Equation',
          badge: 'EXAMPLE 01',
          items: [
            'Given Equation: 3x + 5 = 20',
            'Subtract 5 from both sides: 3x = 15',
            'Divide both sides by 3: x = 5',
            'Check: 3(5) + 5 = 15 + 5 = 20 ✓',
          ],
        },
        rightColumn: {
          title: 'Example 2: Solve 2(x - 3) = x + 4',
          subtitle: 'Variables on Both Sides',
          badge: 'EXAMPLE 02',
          items: [
            'Expand parentheses: 2x - 6 = x + 4',
            'Subtract x from both sides: x - 6 = 4',
            'Add 6 to both sides: x = 10',
            'Check: 2(10 - 3) = 14 and 10 + 4 = 14 ✓',
          ],
        },
      },
      {
        id: 5,
        kicker: 'REAL-WORLD MODELING',
        title: 'Where Algebraic Equations Are Used in Real Life',
        subtitle: 'Translating everyday questions in finance, physics, and coding into equations',
        layout: 'case-study',
        cards: [
          {
            title: 'Budgeting & Savings Goals',
            content: 'Finding how many weeks (w) it takes to buy a $180 bicycle if you have $40 saved and earn $20/week: 20w + 40 = 180 → w = 7 weeks.',
            icon: 'briefcase',
            badge: 'FINANCE',
          },
          {
            title: 'Physics, Speed & Travel Time',
            content: 'Using d = r · t to calculate unknown travel time or average speed for aircraft, trains, and satellites.',
            icon: 'zap',
            badge: 'SCIENCE',
          },
          {
            title: 'Computer Programming & Engineering',
            content: 'Software algorithms, game physics, and structural load formulas rely on solving systems of equations.',
            icon: 'cpu',
            badge: 'TECHNOLOGY',
          },
        ],
      },
    ];

    return finalizeSlideDeck(
      mathSlides,
      slideCount,
      'Algebraic Equations',
      'Variables, Equation Structure, Step-by-Step Solving & Real-World Applications',
      palette,
      isPbl,
      audience
    );
  }

  // =========================================================================
  // 7B. ATOMS, ATOMIC STRUCTURE, ELEMENTS & CHEMISTRY (10+ Slides, 5 Explained Points Each)
  // =========================================================================
  if (
    /\b(atom|atoms|atomic\s+structure|subatomic|protons?|neutrons?|electrons?|nucleus|periodic\s+table|chemical\s+elements?|molecules?)\b/i.test(
      lower
    )
  ) {
    const atomSlides: SlideData[] = [
      {
        id: 1,
        kicker: 'CHEMISTRY & MATTER',
        title: 'Understanding Atoms: The Building Blocks of Matter',
        subtitle:
          'Atoms are the tiny basic units that make up all solids, liquids, and gases in the universe.',
        layout: 'title',
        cards: [
          {
            title: 'Basic Unit of Matter',
            content:
              'Every physical object around us—including air, water, rocks, and living cells—is made of tiny particles called atoms.',
            icon: 'globe',
            badge: '01 · MATTER',
          },
          {
            title: 'Three Main Subatomic Particles',
            content:
              'An atom is built from three smaller particles: positively charged protons, neutral neutrons, and negatively charged electrons.',
            icon: 'layers',
            badge: '02 · PARTICLES',
          },
          {
            title: 'Elements & Chemical Bonds',
            content:
              'The number of protons defines each chemical element, while electrons allow atoms to join together to form molecules.',
            icon: 'zap',
            badge: '03 · BONDING',
          },
        ],
        takeaway: 'Atoms are the fundamental building blocks of all matter in chemistry and physics.',
      },
      {
        id: 2,
        kicker: 'ATOMIC STRUCTURE',
        title: 'Inside the Atom: Main Parts and Their Roles',
        subtitle: 'Every atom has a dense central nucleus surrounded by fast-moving electrons',
        layout: 'three-column',
        cards: [
          {
            title: 'Nucleus',
            content:
              'The nucleus is the small, dense center of an atom. It contains protons and neutrons and holds almost all of the atom’s mass.',
            icon: 'compass',
            badge: '01 · NUCLEUS',
          },
          {
            title: 'Protons',
            content:
              'Protons are positively charged (+1) particles inside the nucleus. The number of protons determines which element an atom is.',
            icon: 'zap',
            badge: '02 · PROTONS',
          },
          {
            title: 'Neutrons',
            content:
              'Neutrons have no electric charge (0). They sit inside the nucleus alongside protons and help hold the nucleus together stably.',
            icon: 'shield',
            badge: '03 · NEUTRONS',
          },
          {
            title: 'Electrons',
            content:
              'Electrons are negatively charged (-1) particles that move rapidly around the nucleus in regions called energy levels or shells.',
            icon: 'activity',
            badge: '04 · ELECTRONS',
          },
          {
            title: 'Overall Atomic Structure',
            content:
              'An atom has a tiny, heavy nucleus surrounded by a wide cloud of electrons, meaning most of an atom’s volume is empty space.',
            icon: 'layers',
            badge: '05 · VOLUME',
          },
        ],
        takeaway: 'Protons and neutrons form the heavy center (nucleus), while electrons occupy the surrounding shells.',
      },
      {
        id: 3,
        kicker: 'ELECTRONS & ENERGY SHELLS',
        title: 'The Role of Electrons in an Atom',
        subtitle: 'How negatively charged electrons move in shells and connect atoms together',
        layout: 'four-card-grid',
        cards: [
          {
            title: 'Negative Electric Charge',
            content:
              'Each electron carries a negative electric charge (-1) that balances the positive charge (+1) of a proton in a neutral atom.',
            icon: 'zap',
            badge: '01 · CHARGE',
          },
          {
            title: 'Location in Energy Levels',
            content:
              'Electrons are found outside the nucleus in specific layers called energy levels or electron shells.',
            icon: 'layers',
            badge: '02 · LOCATION',
          },
          {
            title: 'Chemical Bonding',
            content:
              'Electrons in the outer energy level (valence electrons) help atoms join together by sharing or transferring electrons.',
            icon: 'git-merge',
            badge: '03 · BONDING',
          },
          {
            title: 'Stepped Energy Levels',
            content:
              'Electrons closer to the nucleus have lower energy, while electrons in outer shells have higher energy and can jump levels.',
            icon: 'trending-up',
            badge: '04 · ENERGY',
          },
          {
            title: 'Extremely Small Mass',
            content:
              'An electron has about 1/1836 the mass of a proton, so electrons add almost nothing to an atom’s total weight.',
            icon: 'Activity',
            badge: '05 · SMALL MASS',
          },
        ],
        takeaway: 'Outer-shell electrons determine how an atom reacts with other atoms to form chemical bonds.',
      },
      {
        id: 4,
        kicker: 'ELEMENTS & ATOMIC IDENTITY',
        title: 'Elements, Atomic Number, and Mass Number',
        subtitle: 'How scientists identify elements and measure the particles inside each atom',
        layout: 'definition',
        cards: [
          {
            title: 'What an Element Is',
            content:
              'An element is a pure substance—such as hydrogen, carbon, oxygen, or gold—made entirely of one type of atom.',
            icon: 'book-open',
            badge: '01 · ELEMENT',
          },
          {
            title: 'Atomic Number (Z)',
            content:
              'The atomic number equals the exact number of protons in an atom’s nucleus. For example, every carbon atom has 6 protons.',
            icon: 'award',
            badge: '02 · ATOMIC NUMBER',
          },
          {
            title: 'Number of Protons & Neutral Atoms',
            content:
              'In an uncharged neutral atom, the number of negatively charged electrons equals the number of positively charged protons.',
            icon: 'scale',
            badge: '03 · BALANCE',
          },
          {
            title: 'Mass Number (Protons + Neutrons)',
            content:
              'The mass number is the total count of protons plus neutrons in the nucleus. A carbon-12 atom has 6 protons and 6 neutrons.',
            icon: 'layers',
            badge: '04 · MASS NUMBER',
          },
          {
            title: 'How Elements Differ from One Another',
            content:
              'Changing the number of protons changes the element completely—1 proton is hydrogen, 6 is carbon, and 79 is gold.',
            icon: 'globe',
            badge: '05 · DIFFERENCES',
          },
        ],
        takeaway: 'Atomic number = number of protons; Mass number = protons + neutrons.',
      },
      {
        id: 5,
        kicker: 'ISOTOPES & IONS',
        title: 'How Isotopes and Ions Differ from Neutral Atoms',
        subtitle: 'What happens when an atom gains or loses neutrons or electrons',
        layout: 'comparison',
        leftColumn: {
          title: 'Isotopes (Different Neutron Counts)',
          subtitle: 'Same Element, Different Mass',
          badge: 'ISOTOPES',
          items: [
            'Same Protons: Isotopes of an element always have the exact same number of protons.',
            'Different Neutrons: They have different numbers of neutrons inside the nucleus, giving them different mass numbers.',
            'Example in Nature: Carbon-12 (6 neutrons) and Carbon-14 (8 neutrons) are both isotopes of carbon.',
          ],
        },
        rightColumn: {
          title: 'Ions (Electrically Charged Atoms)',
          subtitle: 'Gaining or Losing Electrons',
          badge: 'IONS',
          items: [
            'Positive Ions (Cations): Formed when an atom loses one or more electrons, leaving more protons than electrons (e.g., Na+).',
            'Negative Ions (Anions): Formed when an atom gains one or more extra electrons, giving it a negative charge (e.g., Cl-).',
            'Everyday Role: Ions conduct electricity in salt water, batteries, and human nerve signals.',
          ],
        },
        takeaway: 'Changing neutrons creates isotopes of the same element; changing electrons creates charged ions.',
      },
      {
        id: 6,
        kicker: 'MOLECULES & BONDING',
        title: 'How Atoms Join Together to Form Molecules',
        subtitle: 'Atoms share or transfer outer electrons to build stable molecules and compounds',
        layout: 'process',
        cards: [
          {
            title: '1. Outer Shell Stability',
            content:
              'Atoms are most stable when their outermost electron shell is full (usually holding 2 or 8 electrons).',
            icon: 'shield',
            badge: '01 · STABILITY',
          },
          {
            title: '2. Covalent Bonds (Sharing Electrons)',
            content:
              'Nonmetal atoms can share pairs of electrons. For example, two hydrogen atoms share electrons with one oxygen atom to make water (H2O).',
            icon: 'git-merge',
            badge: '02 · SHARING',
          },
          {
            title: '3. Ionic Bonds (Transferring Electrons)',
            content:
              'One atom transfers an electron to another atom, creating positive and negative ions that attract each other, such as in table salt (NaCl).',
            icon: 'zap',
            badge: '03 · TRANSFER',
          },
          {
            title: '4. Molecules vs. Compounds',
            content:
              'A molecule is two or more atoms bonded together (like O2), while a compound contains atoms of at least two different elements (like CO2).',
            icon: 'layers',
            badge: '04 · MOLECULES',
          },
          {
            title: '5. New Chemical Properties',
            content:
              'When atoms bond into a compound, the new substance has completely different properties from the individual elements.',
            icon: 'sparkles',
            badge: '05 · PROPERTIES',
          },
        ],
        takeaway: 'Chemical bonds form when atoms share or transfer outer-shell electrons to achieve a full shell.',
      },
      {
        id: 7,
        kicker: 'THE PERIODIC TABLE',
        title: 'How the Periodic Table Organizes All 118 Elements',
        subtitle: 'A structured chart that groups elements by atomic number and shared chemical behavior',
        layout: 'three-column',
        cards: [
          {
            title: 'Ordered by Atomic Number',
            content:
              'Elements are arranged from left to right in order of increasing atomic number, from Hydrogen (1) to Oganesson (118).',
            icon: 'bar-chart',
            badge: '01 · ORDER',
          },
          {
            title: 'Periods (Horizontal Rows)',
            content:
              'Each horizontal row is called a period and shows how many electron shells the atoms in that row have.',
            icon: 'layers',
            badge: '02 · PERIODS',
          },
          {
            title: 'Groups (Vertical Columns)',
            content:
              'Elements in the same vertical column have the same number of outer electrons and react in similar ways.',
            icon: 'compass',
            badge: '03 · GROUPS',
          },
          {
            title: 'Metals, Nonmetals & Metalloids',
            content:
              'Metals sit on the left and center (good conductors), nonmetals sit on the right, and metalloids lie along the dividing line.',
            icon: 'cpu',
            badge: '04 · CATEGORIES',
          },
          {
            title: 'Noble Gases (Group 18)',
            content:
              'Elements in the far-right column—like helium and neon—already have full outer shells, so they rarely react with other elements.',
            icon: 'shield',
            badge: '05 · NOBLE GASES',
          },
        ],
        takeaway: 'The periodic table lets scientists predict an element’s properties from its row and column.',
      },
      {
        id: 8,
        kicker: 'HISTORY OF ATOMIC SCIENCE',
        title: 'How Scientists Discovered the Structure of the Atom',
        subtitle: 'Key experiments that revealed protons, electrons, neutrons, and energy shells',
        layout: 'timeline',
        cards: [
          {
            title: '1. John Dalton (1803) — Solid Sphere Model',
            content:
              'Proposed that all matter is made of tiny, indivisible atoms and that each element has its own unique type of atom.',
            icon: 'clock',
            badge: '1803 · DALTON',
          },
          {
            title: '2. J.J. Thomson (1897) — Discovery of Electrons',
            content:
              'Used cathode-ray tubes to discover negatively charged electrons, proving that atoms contain even smaller particles.',
            icon: 'zap',
            badge: '1897 · THOMSON',
          },
          {
            title: '3. Ernest Rutherford (1911) — The Nucleus',
            content:
              'His gold-foil experiment proved that an atom is mostly empty space with a tiny, dense, positively charged nucleus at the center.',
            icon: 'compass',
            badge: '1911 · RUTHERFORD',
          },
          {
            title: '4. Niels Bohr (1913) — Electron Shells',
            content:
              'Showed that electrons orbit the nucleus in specific energy levels rather than spinning randomly.',
            icon: 'layers',
            badge: '1913 · BOHR',
          },
          {
            title: '5. James Chadwick (1932) & Modern Cloud Model',
            content:
              'Chadwick discovered the neutral neutron in the nucleus, completing the modern quantum electron-cloud model of the atom.',
            icon: 'check-circle',
            badge: '1932 · CHADWICK',
          },
        ],
        takeaway: 'Careful laboratory experiments transformed our view of the atom from a solid ball to a nucleus with electron shells.',
      },
      {
        id: 9,
        kicker: 'ATOMS IN DAILY LIFE',
        title: 'Atoms in Our World: Why Atomic Structure Matters',
        subtitle: 'How atoms build everyday materials, living things, and modern technology',
        layout: 'case-study',
        cards: [
          {
            title: 'Atoms Make Up All Ordinary Matter',
            content:
              'Everything you can touch, breathe, or drink—from oxygen in the air to iron in bridges—is built from trillions of atoms.',
            icon: 'globe',
            badge: '01 · ORDINARY MATTER',
          },
          {
            title: 'Different Arrangements Form New Materials',
            content:
              'Pure carbon atoms arranged in flat sheets form soft graphite in pencils, while the same carbon atoms in a rigid 3D lattice form hard diamond.',
            icon: 'layers',
            badge: '02 · ARRANGEMENT',
          },
          {
            title: 'Atoms Combine for Life & Health',
            content:
              'Carbon, hydrogen, oxygen, and nitrogen atoms bond together to build water, DNA, proteins, and cells in every living organism.',
            icon: 'heart',
            badge: '03 · LIVING THINGS',
          },
          {
            title: 'Chemical Reactions Rearrange Atoms',
            content:
              'When wood burns, food digests, or batteries charge, atoms are never destroyed—they simply rearrange into new combinations.',
            icon: 'flame',
            badge: '04 · REACTIONS',
          },
          {
            title: 'Explaining Physical & Chemical Properties',
            content:
              'Atomic structure explains why copper conducts electricity, why helium floats, and how medicines work inside the body.',
            icon: 'cpu',
            badge: '05 · PROPERTIES',
          },
        ],
        takeaway: 'Understanding how atoms are built and arranged helps scientists explain chemistry, biology, and physics.',
      },
      {
        id: 10,
        kicker: 'SUMMARY & REVIEW',
        title: 'Summary: Five Essential Facts About Atoms',
        subtitle: 'Reviewing the particles, numbers, bonds, and real-world role of atoms',
        layout: 'conclusion',
        cards: [
          {
            title: '1. Nucleus Holds Mass (Protons & Neutrons)',
            content:
              'Positive protons and neutral neutrons pack tightly inside the central nucleus, giving the atom almost all of its mass.',
            icon: 'compass',
            badge: 'KEY FACT 01',
          },
          {
            title: '2. Electrons Orbit in Energy Levels',
            content:
              'Negatively charged electrons move rapidly in shells around the nucleus and occupy most of the atom’s volume.',
            icon: 'activity',
            badge: 'KEY FACT 02',
          },
          {
            title: '3. Protons Define the Element',
            content:
              'An element’s atomic number is its exact number of protons—changing the proton count changes the element.',
            icon: 'award',
            badge: 'KEY FACT 03',
          },
          {
            title: '4. Outer Electrons Form Chemical Bonds',
            content:
              'Atoms share or transfer outer electrons to form stable molecules and compounds like water (H2O) and salt (NaCl).',
            icon: 'git-merge',
            badge: 'KEY FACT 04',
          },
          {
            title: '5. Atoms Shape Everyday Matter',
            content:
              'How atoms are arranged and bonded explains the properties of every material in nature and technology.',
            icon: 'check-circle',
            badge: 'KEY FACT 05',
          },
        ],
        takeaway: 'Mastering protons, neutrons, and electrons unlocks the foundations of chemistry and physics.',
      },
    ];

    return finalizeSlideDeck(
      atomSlides,
      slideCount,
      cleanTopic,
      'Atomic Structure, Subatomic Particles, Elements, Bonding & Real-World Matter',
      palette,
      isPbl,
      audience
    );
  }

  // =========================================================================
  // 8. HUMAN GROWTH, CHILDHOOD & YOUTH DEVELOPMENT (e.g., "A Boy", "A Girl", "Childhood")
  // =========================================================================
  if (/\b(a\s+boy|boys|boyhood|a\s+girl|girls|girlhood|childhood|adolescence|human\s+growth|growing\s+up)\b/i.test(lower)) {
    const isBoyTopic = /\b(a\s+boy|boys|boyhood)\b/i.test(lower);
    const subjTitle = isBoyTopic ? 'Understanding Childhood & Growing Up: A Boy’s Development' : cleanTopic;
    const boySlides: SlideData[] = [
      {
        id: 1,
        kicker: 'HUMAN GROWTH & DEVELOPMENT',
        title: isBoyTopic ? 'Growing Up: Stages of a Boy’s Life and Development' : cleanTopic,
        subtitle:
          'A boy is a young male human who grows through childhood and adolescence on the way to adulthood.',
        layout: 'title',
        cards: [
          {
            title: 'Childhood to Adolescence',
            content:
              'From early childhood through the teenage years, boys experience steady physical growth, learning to walk, speak, read, and solve problems.',
            icon: 'users',
            badge: 'GROWTH STAGES',
          },
          {
            title: 'Learning & Curiosity',
            content:
              'Through school, play, sports, and creative hobbies, young boys build knowledge, coordination, and critical thinking skills.',
            icon: 'graduation-cap',
            badge: 'EDUCATION',
          },
          {
            title: 'Character, Family & Friendship',
            content:
              'Supportive families, teachers, and friends help boys learn kindness, responsibility, emotional confidence, and teamwork.',
            icon: 'heart',
            badge: 'SOCIAL GROWTH',
          },
        ],
        takeaway: 'Healthy growth combines physical health, active learning, and caring support from family and school.',
      },
      {
        id: 2,
        kicker: 'STAGES OF GROWTH',
        title: 'Major Stages of Physical and Mental Growth',
        subtitle: 'How a boy develops from early childhood through the teenage years',
        layout: 'timeline',
        cards: [
          {
            title: 'Early Childhood (Ages 1 to 5)',
            content:
              'Rapid brain development occurs as boys learn to walk, talk, recognize emotions, and explore the world through play.',
            icon: 'sparkles',
            badge: 'AGES 1–5',
          },
          {
            title: 'Middle Childhood (Ages 6 to 11)',
            content:
              'Boys start primary school, build reading and math skills, develop motor coordination in sports, and form close friendships.',
            icon: 'book-open',
            badge: 'AGES 6–11',
          },
          {
            title: 'Early Adolescence (Ages 12 to 14)',
            content:
              'A major growth spurt increases height, muscle strength, and voice depth while independent thinking becomes stronger.',
            icon: 'zap',
            badge: 'AGES 12–14',
          },
          {
            title: 'Late Adolescence (Ages 15 to 18)',
            content:
              'Teenage boys prepare for adulthood by setting career goals, taking on greater responsibility, and building lifelong values.',
            icon: 'award',
            badge: 'AGES 15–18',
          },
        ],
        takeaway: 'Each stage of childhood brings new physical abilities, deeper thinking, and greater independence.',
      },
      {
        id: 3,
        kicker: 'EDUCATION & DAILY LIFE',
        title: 'How Education, Play, and Hobbies Shape Development',
        subtitle: 'Classroom learning and active play work together to build strong minds and bodies',
        layout: 'three-column',
        cards: [
          {
            title: 'School & Academic Skills',
            content:
              'Reading, science, mathematics, and art teach boys how to ask questions, solve problems, and communicate clearly.',
            icon: 'graduation-cap',
            badge: 'SCHOOL LEARNING',
          },
          {
            title: 'Sports & Physical Activity',
            content:
              'Daily active play—such as running, football, cricket, or swimming—strengthens bones, muscles, and teamwork skills.',
            icon: 'activity',
            badge: 'PHYSICAL HEALTH',
            statValue: '60 min/day',
            statLabel: 'Recommended daily physical activity for youth (WHO)',
          },
          {
            title: 'Creativity & Problem Solving',
            content:
              'Building projects, coding, music, and reading stories encourage imagination, patience, and self-confidence.',
            icon: 'compass',
            badge: 'CREATIVITY',
          },
        ],
        takeaway: 'World Health Organization guidelines recommend at least 60 minutes of active physical play every day.',
      },
      {
        id: 4,
        kicker: 'EMOTIONAL & SOCIAL WELL-BEING',
        title: 'Emotional Growth, Friendships, and Positive Role Models',
        subtitle: 'Why open communication, respect, and encouragement matter while growing up',
        layout: 'problem-solution',
        leftColumn: {
          title: 'Common Challenges While Growing Up',
          subtitle: 'Pressures Young People Face',
          badge: 'CHALLENGES',
          items: [
            'Peer pressure and trying to fit in at school or online.',
            'Academic stress during exams and learning difficult new subjects.',
            'Stereotypes that discourage boys from talking openly about their feelings.',
            'Too much screen time reducing outdoor play and healthy sleep.',
          ],
        },
        rightColumn: {
          title: 'Healthy Support & Solutions',
          subtitle: 'How Families and Schools Help',
          badge: 'SUPPORTIVE HABITS',
          items: [
            'Encouraging boys to express emotions honestly and ask for help when needed.',
            'Positive role models—parents, teachers, and coaches—who teach respect and empathy.',
            'Balancing study time with outdoor sports, hobbies, and 8 to 10 hours of sleep.',
            'Building friendships based on kindness, fairness, and mutual support.',
          ],
        },
        takeaway: 'Boys thrive when they are encouraged to be curious, kind, active, and emotionally open.',
      },
      {
        id: 5,
        kicker: 'SUMMARY & KEY LESSONS',
        title: 'Summary: Supporting Healthy Growth and Learning',
        subtitle: 'Essential habits that help every young person grow into a capable, caring adult',
        layout: 'conclusion',
        cards: [
          {
            title: 'Healthy Body & Nutrition',
            content:
              'Balanced meals, clean water, sufficient sleep, and 60 minutes of daily exercise support steady physical growth.',
            icon: 'check-circle',
            badge: 'HEALTH',
          },
          {
            title: 'Lifelong Curiosity & Education',
            content:
              'Schoolwork, reading, and hands-on projects build the knowledge and skills needed for future careers.',
            icon: 'book-open',
            badge: 'LEARNING',
          },
          {
            title: 'Kindness, Respect & Character',
            content:
              'Treating others fairly, communicating openly, and working as a team build strong character for adulthood.',
            icon: 'heart',
            badge: 'CHARACTER',
          },
        ],
        takeaway: 'Healthy habits, supportive families, and good education help young people reach their full potential.',
      },
    ];

    return finalizeSlideDeck(
      boySlides,
      slideCount,
      subjTitle,
      'Stages of Growth, Learning, Physical Health & Emotional Development',
      palette,
      isPbl,
      audience
    );
  }

  // =========================================================================
  // 9. DISCIPLINE-AWARE SUBJECT TEACHER FALLBACK (NO META-CONTENT)
  // =========================================================================
  const isHistoryDomain =
    /\b(war|revolution|empire|dynasty|civilization|treaty|independence|ancient|medieval|century|colonial|president|monarchy|reformation|renaissance|cold\s+war)\b/i.test(
      lower
    );
  const isScienceDomain =
    /\b(cell|atom|molecule|gravity|force|energy|ecosystem|planet|solar\s+system|evolution|genetics|dna|rna|acid|reaction|circuit|magnetism|wave|organ|human\s+body|water\s+cycle|volcano|earthquake|mitosis|newton)\b/i.test(
      lower
    );
  const isTechnicalDomain =
    /\b(network|protocol|algorithm|database|sql|software|hardware|operating\s+system|cloud|cybersecurity|encryption|blockchain|robotics|iot|sensor|compiler|architecture|api|server|router|cpu|memory|artificial\s+intelligence|machine\s+learning)\b/i.test(
      lower
    );
  const isLiteratureDomain =
    /\b(novel|poem|poetry|shakespeare|drama|play|character|theme|symbolism|literature|story|author|macbeth|hamlet|romeo|odyssey)\b/i.test(
      lower
    );

  let dynamicSlides: SlideData[] = [];

  if (isHistoryDomain) {
    dynamicSlides = [
      {
        id: 1,
        kicker: 'HISTORICAL STUDY',
        title: cleanTopic,
        subtitle: `How ${cleanTopic} began, the major events that shaped it, and how it changed history.`,
        layout: 'title',
        cards: [
          {
            title: 'Root Causes & Conditions',
            content: `Long-term political tensions, unfair tax or legal systems, and economic hardship created the conditions for ${cleanTopic}.`,
            icon: 'compass',
            badge: 'CAUSES',
          },
          {
            title: 'Major Turning Points',
            content: `Key battles, public movements, and leadership decisions changed the balance of power during ${cleanTopic}.`,
            icon: 'clock',
            badge: 'KEY EVENTS',
          },
          {
            title: 'Lasting Historical Impact',
            content: `${cleanTopic} reshaped laws, national borders, and citizens’ rights for generations that followed.`,
            icon: 'scale',
            badge: 'IMPACT',
          },
        ],
        takeaway: `${cleanTopic} transformed political institutions and everyday society.`,
      },
      {
        id: 2,
        kicker: 'CAUSES OF CHANGE',
        title: `What Caused ${cleanTopic}?`,
        subtitle: `Political, economic, and social pressures that led up to ${cleanTopic}`,
        layout: 'cause-effect',
        cards: [
          {
            title: 'Political & Governance Disputes',
            content: `Disagreements over representation, government authority, and citizen rights created deep political divisions.`,
            icon: 'scale',
            badge: 'POLITICAL',
          },
          {
            title: 'Economic Pressures & Taxes',
            content: `Rising living costs, heavy taxation, and trade disruptions affected families and workers across the region.`,
            icon: 'briefcase',
            badge: 'ECONOMIC',
          },
          {
            title: 'The Spark That Started Action',
            content: `A decisive crisis brought long-standing grievances into open historical action.`,
            icon: 'flame',
            badge: 'TRIGGER EVENT',
          },
        ],
      },
      {
        id: 3,
        kicker: 'TIMELINE OF EVENTS',
        title: `Major Events and Turning Points of ${cleanTopic}`,
        subtitle: `How ${cleanTopic} unfolded from its beginning to its resolution`,
        layout: 'timeline',
        cards: [
          {
            title: '1. Early Mobilization',
            content: `Leaders and citizens organized alliances, published demands, and began the first phase of ${cleanTopic}.`,
            icon: 'clock',
            badge: 'PHASE 01',
          },
          {
            title: '2. Widespread Expansion',
            content: `The movement spread across major cities and regions, drawing in broader groups of society.`,
            icon: 'flame',
            badge: 'PHASE 02',
          },
          {
            title: '3. The Turning Point',
            content: `A critical shift in leadership and strategy determined the final direction of ${cleanTopic}.`,
            icon: 'zap',
            badge: 'PHASE 03',
          },
          {
            title: '4. Final Settlement & Reforms',
            content: `New treaties, laws, or constitutional reforms officially ended the conflict and established a new order.`,
            icon: 'check-circle',
            badge: 'PHASE 04',
          },
        ],
      },
      {
        id: 4,
        kicker: 'PEOPLE & SOCIETY',
        title: `How ${cleanTopic} Affected Everyday People`,
        subtitle: `The roles of leaders, workers, and families during ${cleanTopic}`,
        layout: 'three-column',
        cards: [
          {
            title: 'Key Leaders & Reformers',
            content: `Political and civic leaders wrote declarations, organized strategies, and negotiated new agreements.`,
            icon: 'award',
            badge: 'LEADERS',
          },
          {
            title: 'Everyday Citizens & Workers',
            content: `Ordinary families, farmers, and urban workers experienced daily changes in work, law, and community life.`,
            icon: 'users',
            badge: 'CITIZENS',
          },
          {
            title: 'New Ideas of Rights & Law',
            content: `Debates during ${cleanTopic} spread new ideas about legal fairness, civic duty, and national identity.`,
            icon: 'compass',
            badge: 'IDEAS',
          },
        ],
      },
      {
        id: 5,
        kicker: 'HISTORICAL LEGACY',
        title: `Lasting Consequences of ${cleanTopic}`,
        subtitle: `How ${cleanTopic} changed government, society, and modern history`,
        layout: 'conclusion',
        cards: [
          {
            title: 'Legal & Political Reform',
            content: `${cleanTopic} replaced older systems of rule with new laws, institutions, and governance structures.`,
            icon: 'globe',
            badge: 'GOVERNMENT',
          },
          {
            title: 'Social Transformation',
            content: `Changes in education, land ownership, and civic rights reshaped opportunities for ordinary people.`,
            icon: 'users',
            badge: 'SOCIETY',
          },
          {
            title: 'Lessons for Modern History',
            content: `Studying ${cleanTopic} helps us understand how societies respond to crisis and build fairer institutions.`,
            icon: 'book-open',
            badge: 'LEGACY',
          },
        ],
        takeaway: `${cleanTopic} remains a major turning point in understanding how modern societies evolved.`,
      },
    ];
  } else if (isScienceDomain) {
    dynamicSlides = [
      {
        id: 1,
        kicker: 'SCIENCE & NATURE',
        title: cleanTopic,
        subtitle: `What ${cleanTopic} is, how it works in nature, and why it is essential for life and science.`,
        layout: 'title',
        cards: [
          {
            title: `What Is ${cleanTopic}?`,
            content: `${cleanTopic} is a natural scientific process where energy and matter interact to produce measurable changes.`,
            icon: 'activity',
            badge: 'DEFINITION',
          },
          {
            title: 'Main Parts Involved',
            content: `Specific cells, molecules, or physical forces work together in a clear sequence during ${cleanTopic}.`,
            icon: 'layers',
            badge: 'PARTS',
          },
          {
            title: 'Why It Matters in Nature',
            content: `${cleanTopic} supports living ecosystems, physical stability, and practical technologies we use every day.`,
            icon: 'globe',
            badge: 'IMPORTANCE',
          },
        ],
        takeaway: `${cleanTopic} connects basic laws of science to the living world around us.`,
      },
      {
        id: 2,
        kicker: 'PARTS & REQUIREMENTS',
        title: `Main Parts and Conditions Needed for ${cleanTopic}`,
        subtitle: `The essential inputs and structures that allow ${cleanTopic} to happen`,
        layout: 'three-column',
        cards: [
          {
            title: 'Energy & Starting Inputs',
            content: `${cleanTopic} begins when energy—such as light, heat, or force—acts on the starting materials.`,
            icon: 'zap',
            badge: 'INPUTS',
          },
          {
            title: 'Active Structure',
            content: `Specialized structures guide the reaction or movement so energy is transferred efficiently.`,
            icon: 'layers',
            badge: 'STRUCTURE',
          },
          {
            title: 'Useful Products & Outputs',
            content: `Once the process finishes, it releases useful energy or new materials needed by the environment.`,
            icon: 'check-circle',
            badge: 'OUTPUTS',
          },
        ],
      },
      {
        id: 3,
        kicker: 'STEP-BY-STEP PROCESS',
        title: `How ${cleanTopic} Works Step by Step`,
        subtitle: `Following the scientific process from start to finish`,
        layout: 'process',
        cards: [
          {
            title: 'Step 1: Energy Absorption',
            content: `The system absorbs energy or receives a physical force that starts the process.`,
            icon: 'zap',
            badge: 'STEP 01',
          },
          {
            title: 'Step 2: Physical or Chemical Change',
            content: `Particles, molecules, or forces interact and rearrange into a new state.`,
            icon: 'activity',
            badge: 'STEP 02',
          },
          {
            title: 'Step 3: Balance & Regulation',
            content: `Natural conditions such as temperature and concentration control the speed of the process.`,
            icon: 'refresh-cw',
            badge: 'STEP 03',
          },
          {
            title: 'Step 4: Final Output',
            content: `The resulting energy or substance is released and used by living things or physical systems.`,
            icon: 'check-circle',
            badge: 'STEP 04',
          },
        ],
      },
      {
        id: 4,
        kicker: 'IN EVERYDAY LIFE',
        title: `Examples of ${cleanTopic} in Everyday Life`,
        subtitle: `Where we see ${cleanTopic} in nature, health, and modern technology`,
        layout: 'case-study',
        cards: [
          {
            title: 'In Nature & Ecosystems',
            content: `${cleanTopic} helps maintain natural cycles of energy, water, and nutrients across the planet.`,
            icon: 'globe',
            badge: 'NATURE',
          },
          {
            title: 'In Health & Daily Life',
            content: `Our bodies and local environments rely on ${cleanTopic} every day to stay healthy and balanced.`,
            icon: 'heart',
            badge: 'DAILY LIFE',
          },
          {
            title: 'In Science & Technology',
            content: `Scientists and engineers apply ${cleanTopic} to design cleaner energy, better medicine, and safer tools.`,
            icon: 'cpu',
            badge: 'TECHNOLOGY',
          },
        ],
      },
      {
        id: 5,
        kicker: 'SUMMARY',
        title: `Summary: Key Facts About ${cleanTopic}`,
        subtitle: `Reviewing how ${cleanTopic} works and why it is important`,
        layout: 'conclusion',
        cards: [
          {
            title: 'Clear Natural Process',
            content: `${cleanTopic} follows clear, repeatable scientific steps that can be observed and measured.`,
            icon: 'check-circle',
            badge: 'FACT 01',
          },
          {
            title: 'Driven by Energy & Structure',
            content: `Specific inputs and structures work together to convert energy or matter into useful results.`,
            icon: 'layers',
            badge: 'FACT 02',
          },
          {
            title: 'Essential for Life & Science',
            content: `Understanding ${cleanTopic} helps us protect nature and build better scientific solutions.`,
            icon: 'sparkles',
            badge: 'FACT 03',
          },
        ],
        takeaway: `${cleanTopic} is a fundamental scientific process that shapes both nature and human technology.`,
      },
    ];
  } else if (isLiteratureDomain) {
    dynamicSlides = [
      {
        id: 1,
        kicker: 'LITERATURE & STORYTELLING',
        title: cleanTopic,
        subtitle: `Exploring the story, main characters, central themes, and lasting message of ${cleanTopic}.`,
        layout: 'title',
        cards: [
          {
            title: 'Setting & Central Story',
            content: `${cleanTopic} introduces a compelling world where characters face meaningful life choices and challenges.`,
            icon: 'book-open',
            badge: 'STORY',
          },
          {
            title: 'Main Characters',
            content: `The central characters grow and change as they respond to conflict, friendship, and moral tests.`,
            icon: 'users',
            badge: 'CHARACTERS',
          },
          {
            title: 'Important Themes',
            content: `The work teaches timeless lessons about courage, honesty, justice, and human relationships.`,
            icon: 'sparkles',
            badge: 'THEMES',
          },
        ],
        takeaway: `${cleanTopic} uses vivid characters and storytelling to teach lasting lessons about human life.`,
      },
      {
        id: 2,
        kicker: 'PLOT PROGRESSION',
        title: `How the Story Unfolds in ${cleanTopic}`,
        subtitle: 'Following the main events from the opening scene to the final resolution',
        layout: 'timeline',
        cards: [
          {
            title: '1. Beginning & Setting',
            content: `We meet the main characters in their everyday environment before the main conflict begins.`,
            icon: 'book-open',
            badge: 'BEGINNING',
          },
          {
            title: '2. Rising Challenges',
            content: `New obstacles and difficult decisions test the characters’ values and relationships.`,
            icon: 'flame',
            badge: 'CONFLICT',
          },
          {
            title: '3. The Turning Point',
            content: `At the most intense moment of the story, the main character must make a decisive choice.`,
            icon: 'zap',
            badge: 'CLIMAX',
          },
          {
            title: '4. Resolution & Lesson',
            content: `The conflict is resolved, showing how the characters have grown and what they have learned.`,
            icon: 'check-circle',
            badge: 'ENDING',
          },
        ],
      },
      {
        id: 3,
        kicker: 'CHARACTERS & THEMES',
        title: `Main Themes and Character Growth in ${cleanTopic}`,
        subtitle: 'The deeper ideas and human values explored throughout the text',
        layout: 'three-column',
        cards: [
          {
            title: 'Character Growth',
            content: `Through mistakes and perseverance, the main characters gain wisdom and emotional maturity.`,
            icon: 'users',
            badge: 'GROWTH',
          },
          {
            title: 'Central Moral Theme',
            content: `The story highlights how empathy, integrity, and responsibility guide good decisions.`,
            icon: 'compass',
            badge: 'THEME',
          },
          {
            title: 'Language & Imagery',
            content: `Clear descriptions, dialogue, and symbols help readers picture the scenes and feel the emotions.`,
            icon: 'sparkles',
            badge: 'WRITING STYLE',
          },
        ],
      },
      {
        id: 4,
        kicker: 'SUMMARY & MEANING',
        title: `What Readers Learn from ${cleanTopic}`,
        subtitle: 'Why this work remains meaningful for students and readers today',
        layout: 'conclusion',
        cards: [
          {
            title: 'Understanding Human Choices',
            content: `Shows how our actions and words affect the people and community around us.`,
            icon: 'heart',
            badge: 'LESSON 01',
          },
          {
            title: 'Appreciating Good Storytelling',
            content: `Demonstrates how plot, character, and theme work together to create a memorable story.`,
            icon: 'book-open',
            badge: 'LESSON 02',
          },
          {
            title: 'Connecting to Real Life',
            content: `Encourages readers to think critically and apply positive values in their own lives.`,
            icon: 'check-circle',
            badge: 'LESSON 03',
          },
        ],
        takeaway: `${cleanTopic} inspires readers to reflect on character, choices, and empathy.`,
      },
    ];
  } else if (isTechnicalDomain) {
    dynamicSlides = [
      {
        id: 1,
        kicker: 'TECHNOLOGY & COMPUTING',
        title: cleanTopic,
        subtitle: `How ${cleanTopic} works, its main technical parts, and how people use it every day.`,
        layout: 'title',
        cards: [
          {
            title: `What Is ${cleanTopic}?`,
            content: `${cleanTopic} is a technology system designed to process information, automate tasks, or connect devices reliably.`,
            icon: 'cpu',
            badge: 'WHAT IT IS',
          },
          {
            title: 'Main Hardware & Software Parts',
            content: `It combines processors, software rules, and communication links that work together as a team.`,
            icon: 'layers',
            badge: 'MAIN PARTS',
          },
          {
            title: 'Everyday Uses',
            content: `Schools, businesses, hospitals, and homes use ${cleanTopic} to save time and share information safely.`,
            icon: 'zap',
            badge: 'REAL USES',
          },
        ],
        takeaway: `${cleanTopic} makes modern computing faster, safer, and more useful for everyday work.`,
      },
      {
        id: 2,
        kicker: 'HOW IT WORKS',
        title: `How ${cleanTopic} Works Step by Step`,
        subtitle: `Following how information moves through ${cleanTopic} from input to output`,
        layout: 'process',
        cards: [
          {
            title: '1. Receiving Input Data',
            content: `A user, sensor, or connected device sends a request or piece of data into ${cleanTopic}.`,
            icon: 'zap',
            badge: 'STEP 01',
          },
          {
            title: '2. Processing & Rules',
            content: `Software programs and hardware processors organize, check, and calculate the information.`,
            icon: 'cpu',
            badge: 'STEP 02',
          },
          {
            title: '3. Safety & Accuracy Checks',
            content: `Built-in security and error checks make sure the data is accurate and protected.`,
            icon: 'shield',
            badge: 'STEP 03',
          },
          {
            title: '4. Delivering the Result',
            content: `The finished result is displayed on screen, stored safely, or sent to the destination device.`,
            icon: 'check-circle',
            badge: 'STEP 04',
          },
        ],
      },
      {
        id: 3,
        kicker: 'MAIN BUILDING BLOCKS',
        title: `Main Components of ${cleanTopic}`,
        subtitle: `The hardware, software, and user interfaces that make ${cleanTopic} run`,
        layout: 'three-column',
        cards: [
          {
            title: 'Physical Hardware & Storage',
            content: `Servers, chips, cables, or sensors provide the physical power needed to store and move data.`,
            icon: 'layers',
            badge: 'HARDWARE',
          },
          {
            title: 'Software & Protocols',
            content: `Clear instructions and communication rules tell the hardware how to handle every task.`,
            icon: 'cpu',
            badge: 'SOFTWARE',
          },
          {
            title: 'User Interface & Access',
            content: `Screens, apps, and dashboards let people control ${cleanTopic} easily without needing complex code.`,
            icon: 'globe',
            badge: 'INTERFACE',
          },
        ],
      },
      {
        id: 4,
        kicker: 'USES, BENEFITS & LIMITATIONS',
        title: `Real-World Uses, Benefits, and Limitations of ${cleanTopic}`,
        subtitle: `Where ${cleanTopic} helps the most and what challenges engineers must manage`,
        layout: 'problem-solution',
        leftColumn: {
          title: 'Real-World Uses & Benefits',
          subtitle: 'How It Helps People',
          badge: 'BENEFITS',
          items: [
            `Speeds up daily work in schools, offices, healthcare, and communication.`,
            `Reduces human error by handling repetitive tasks automatically and accurately.`,
            `Allows people and computers to share information quickly across distances.`,
          ],
        },
        rightColumn: {
          title: 'Limitations & Challenges',
          subtitle: 'Things to Keep in Mind',
          badge: 'LIMITATIONS',
          items: [
            `Can be expensive to buy, set up, and upgrade over time.`,
            `Needs regular security updates and electricity or internet access to run properly.`,
            `Requires trained people to configure and fix technical problems when they happen.`,
          ],
        },
      },
      {
        id: 5,
        kicker: 'SUMMARY',
        title: `Summary: Key Facts About ${cleanTopic}`,
        subtitle: `Reviewing what ${cleanTopic} is, how it works, and why we use it`,
        layout: 'conclusion',
        cards: [
          {
            title: 'Solves Real Problems',
            content: `${cleanTopic} combines hardware and software to process information and solve practical tasks.`,
            icon: 'cpu',
            badge: 'FACT 01',
          },
          {
            title: 'Clear Step-by-Step Operation',
            content: `It takes input data, processes it safely, and delivers fast, reliable results.`,
            icon: 'zap',
            badge: 'FACT 02',
          },
          {
            title: 'Smart & Responsible Use',
            content: `Knowing both its benefits and limitations helps us use ${cleanTopic} effectively and safely.`,
            icon: 'scale',
            badge: 'FACT 03',
          },
        ],
        takeaway: `${cleanTopic} is an essential modern technology that connects people, data, and everyday tools.`,
      },
    ];
  } else {
    // Everyday Subject Teacher Knowledge Slides (Substantive Easy English Explanations — ZERO Meta-Content)
    dynamicSlides = [
      {
        id: 1,
        kicker: isPbl ? 'PROJECT-BASED LEARNING (PBL)' : 'EDUCATIONAL OVERVIEW',
        title: cleanTopic,
        subtitle: `${cleanTopic} is an important real-world subject that affects daily life, learning, and society.`,
        layout: 'title',
        cards: [
          {
            title: `Understanding ${cleanTopic}`,
            content: `${cleanTopic} plays a direct role in how people live, learn, work, and interact with the world around them.`,
            icon: 'book-open',
            badge: 'MEANING',
          },
          {
            title: 'How It Works in Daily Life',
            content: `Everyday habits, community systems, and practical knowledge shape how ${cleanTopic} works in real life.`,
            icon: 'layers',
            badge: 'IN PRACTICE',
          },
          {
            title: 'Why It Matters to Us',
            content: `Learning about ${cleanTopic} helps students make informed choices and solve real problems in school and life.`,
            icon: 'globe',
            badge: 'IMPORTANCE',
          },
        ],
        takeaway: `Understanding ${cleanTopic} helps us connect classroom learning to real life.`,
      },
      {
        id: 2,
        kicker: 'KEY IDEAS',
        title: `Main Ideas and Parts of ${cleanTopic}`,
        subtitle: `Looking closely at the real elements that make up ${cleanTopic}`,
        layout: 'three-column',
        cards: [
          {
            title: 'Everyday Role & Purpose',
            content: `${cleanTopic} serves a clear purpose by helping individuals and communities meet daily needs and goals.`,
            icon: 'compass',
            badge: 'PURPOSE',
          },
          {
            title: 'People & Environment Involved',
            content: `Families, schools, workers, and local communities all participate in how ${cleanTopic} functions every day.`,
            icon: 'users',
            badge: 'PARTICIPANTS',
          },
          {
            title: 'Positive Impact on Society',
            content: `When managed well, ${cleanTopic} improves health, learning, fairness, and quality of life for everyone.`,
            icon: 'check-circle',
            badge: 'IMPACT',
          },
        ],
      },
      {
        id: 3,
        kicker: 'STEP BY STEP',
        title: `How ${cleanTopic} Works in Everyday Life`,
        subtitle: `How preparation, action, and teamwork lead to positive results`,
        layout: 'process',
        cards: [
          {
            title: '1. Learning & Preparation',
            content: `People first gather the basic knowledge, tools, and resources needed for ${cleanTopic}.`,
            icon: 'zap',
            badge: 'STEP 01',
          },
          {
            title: '2. Daily Action & Practice',
            content: `Consistent daily habits and active participation put ${cleanTopic} into practice at home, school, or work.`,
            icon: 'activity',
            badge: 'STEP 02',
          },
          {
            title: '3. Cooperation & Fair Rules',
            content: `Shared rules, teamwork, and mutual respect keep the process safe, fair, and effective.`,
            icon: 'shield',
            badge: 'STEP 03',
          },
          {
            title: '4. Helpful Real-World Results',
            content: `These efforts produce lasting benefits for students, families, and the wider community.`,
            icon: 'check-circle',
            badge: 'STEP 04',
          },
        ],
      },
      {
        id: 4,
        kicker: 'BENEFITS & CHALLENGES',
        title: `Benefits and Challenges of ${cleanTopic}`,
        subtitle: `How ${cleanTopic} helps people and how we can overcome common obstacles`,
        layout: 'problem-solution',
        leftColumn: {
          title: `Key Benefits of ${cleanTopic}`,
          subtitle: 'How It Helps Individuals and Communities',
          badge: 'BENEFITS',
          items: [
            `Builds practical skills, confidence, and better understanding for students and families.`,
            `Supports healthier, fairer, and more organized communities.`,
            `Connects what we learn in school with real situations in daily life.`,
          ],
        },
        rightColumn: {
          title: 'Common Challenges & Solutions',
          subtitle: 'Ways to Improve Results',
          badge: 'SOLUTIONS',
          items: [
            `Lack of awareness can be solved through clear education and open discussion.`,
            `Limited resources improve when schools, families, and communities work together.`,
            `Consistent practice and supportive guidance help everyone succeed.`,
          ],
        },
      },
      {
        id: 5,
        kicker: 'SUMMARY',
        title: `Summary: What We Learned About ${cleanTopic}`,
        subtitle: `Key lessons to remember and apply in everyday life`,
        layout: 'conclusion',
        cards: [
          {
            title: 'Clear Real-World Meaning',
            content: `${cleanTopic} is an active part of daily life that connects knowledge, people, and practical action.`,
            icon: 'check-circle',
            badge: 'LESSON 01',
          },
          {
            title: 'Teamwork & Good Habits',
            content: `Success with ${cleanTopic} comes from steady learning, cooperation, and supportive communities.`,
            icon: 'layers',
            badge: 'LESSON 02',
          },
          {
            title: 'Making a Positive Difference',
            content: `Applying what we learn about ${cleanTopic} helps us build a better future at school and at home.`,
            icon: 'globe',
            badge: 'LESSON 03',
          },
        ],
        takeaway: `Learning about ${cleanTopic} empowers us to make smart, positive choices every day.`,
      },
    ];
  }

  return finalizeSlideDeck(
    dynamicSlides,
    slideCount,
    cleanTopic,
    `Topic-Driven Presentation • ${slideCount} Slides`,
    palette,
    isPbl,
    audience
  );
}

/**
 * Applies user modification & regeneration requests (Requirements 45, 46):
 * - "Regenerate" / "Different Design" / "More Visual" / "More Academic" / "Simpler" / "More Creative" / "Different Structure"
 * - Guarantees a genuinely different visual style, layout sequence, and content presentation!
 */
export function applyLocalPresentationModification(
  existing: PowerPointPresentation,
  instruction: string
): PowerPointPresentation {
  const lower = instruction.toLowerCase();
  let updatedPalette = existing.palette;
  let updatedTitle = existing.title;
  let updatedSubtitle = existing.subtitle;
  let updatedSlides = existing.slides.map((s) => ({ ...s }));

  // 1. Style / Regeneration / Theme changes — NEVER reuse the same palette!
  const isRegenerateOrStyleChange =
    /\b(regenerate|theme|different\s+design|different\s+style|different\s+structure|more\s+visual|more\s+academic|more\s+creative|change\s+the\s+colors?|change\s+(the\s+)?theme|switch\s+(visual\s+)?theme|more\s+colorful|light\s+theme|dark\s+theme|simpler|easy\s+english)\b/i.test(
      lower
    );

  if (/\b(light\s+theme|white|bright|lighter)\b/i.test(lower)) {
    const lightOptions = PALETTE_LIST.filter((p) => !p.isDark && p.id !== existing.paletteId);
    updatedPalette = lightOptions[0] || PRESENTATION_PALETTES['editorial-magazine'];
  } else if (/\b(dark\s+theme|darker|navy|night)\b/i.test(lower)) {
    const darkOptions = PALETTE_LIST.filter((p) => p.isDark && p.id !== existing.paletteId);
    updatedPalette = darkOptions[0] || PRESENTATION_PALETTES['blueprint-technical'];
  } else if (/\b(more\s+academic|scientific|research)\b/i.test(lower)) {
    updatedPalette =
      existing.paletteId === 'scientific-clean'
        ? PRESENTATION_PALETTES['editorial-magazine']
        : PRESENTATION_PALETTES['scientific-clean'];
  } else if (/\b(more\s+creative|more\s+colorful|more\s+visual|vibrant)\b/i.test(lower)) {
    updatedPalette =
      existing.paletteId === 'sunset-orange-purple'
        ? PRESENTATION_PALETTES['pbl-notebook']
        : PRESENTATION_PALETTES['sunset-orange-purple'];
  } else if (isRegenerateOrStyleChange) {
    updatedPalette = selectPaletteForTopic(existing.topic, instruction, existing.paletteId);
  }

  // Rotate layouts and header alignments on middle slides when regenerating or changing design/structure
  if (
    /\b(regenerate|different\s+design|different\s+structure|more\s+visual|more\s+creative|more\s+academic)\b/i.test(
      lower
    )
  ) {
    const middleLayouts: SlideLayoutType[] = [
      'three-column',
      'four-card-grid',
      'comparison',
      'process',
      'timeline',
      'definition',
      'case-study',
    ];

    updatedSlides = updatedSlides.map((s, idx) => {
      if (idx === 0 || idx === updatedSlides.length - 1) {
        return {
          ...s,
          headerAlignment: s.headerAlignment === 'center' ? 'left' : 'center',
          transition: TRANSITION_ROTATION[(idx + 2) % TRANSITION_ROTATION.length],
        };
      }
      const currentLayoutIdx = middleLayouts.indexOf(s.layout);
      const nextLayout =
        middleLayouts[(currentLayoutIdx + 2 + idx) % middleLayouts.length];

      // Only switch layout if compatible with existing cards/columns
      const canSwitch = (s.cards && s.cards.length >= 2) || s.leftColumn;
      return {
        ...s,
        layout: canSwitch ? nextLayout : s.layout,
        headerAlignment:
          ALIGNMENT_ROTATION[(idx + 1) % ALIGNMENT_ROTATION.length],
        transition: TRANSITION_ROTATION[(idx + 1) % TRANSITION_ROTATION.length],
      };
    });
    updatedSubtitle = `${updatedPalette.name.split('(')[0].trim()} Edition • ${updatedSlides.length} Slides`;
  }

  // 2. Title changes
  const titleMatch = instruction.match(/change\s+the\s+title\s+to\s+["']?([^"'.!]+)["']?/i);
  if (titleMatch && titleMatch[1]) {
    updatedTitle = titleMatch[1].trim();
    if (updatedSlides.length > 0) {
      updatedSlides[0] = {
        ...updatedSlides[0],
        title: updatedTitle,
      };
    }
  }

  // 3. Specific slide or whole-deck simplification ("Make slide 5 simpler" or "Simpler")
  const slideSimplerMatch = lower.match(/make\s+slide\s+(\d+)\s+(simpler|shorter|cleaner|easier)/i);
  if (slideSimplerMatch) {
    const targetSlideNum = parseInt(slideSimplerMatch[1], 10);
    updatedSlides = updatedSlides.map((s) => {
      if (s.id === targetSlideNum) {
        return {
          ...s,
          subtitle: 'Concise Key Takeaways',
          cards: (s.cards || []).slice(0, 2).map((c) => ({
            ...c,
            content: c.content.split('.')[0] + '.',
          })),
        };
      }
      return s;
    });
  } else if (/\bsimpler\b/i.test(lower)) {
    updatedSlides = updatedSlides.map((s) => ({
      ...s,
      cards: (s.cards || []).map((c) => ({
        ...c,
        content: c.content.split('.')[0] + '.',
      })),
    }));
    updatedSubtitle = `Simplified Visual Edition • ${updatedSlides.length} Slides`;
  }

  // 4. Add specific content slides (Summary / Quiz / Comparison / Timeline / Fun Facts)
  if (/\b(summary|takeaways?|recap)\s*slide\b/i.test(lower)) {
    const newSlideId = updatedSlides.length + 1;
    updatedSlides.push({
      id: newSlideId,
      title: 'Key Takeaways & Core Insights',
      subtitle: `Essential conclusions and summary for ${existing.title}`,
      layout: 'three-column',
      headerAlignment: 'left',
      transition: 'fade',
      notes: `Summarizing the key takeaways from ${existing.title}. Focus on practical retention and next steps.`,
      cards: [
        {
          title: 'Foundational Concept',
          content: `Mastering the primary principles behind ${existing.title} establishes the foundation for deeper exploration and mastery.`,
          badge: 'Core Insight',
        },
        {
          title: 'Real-World Application',
          content: `Practical methodologies and evidence demonstrate real-world impact across diverse domains and modern contexts.`,
          badge: 'Application',
        },
        {
          title: 'Strategic Next Step',
          content: `Continue assessing outcomes, iterate based on real feedback, and expand capabilities proactively.`,
          badge: 'Action Item',
        },
      ],
    });
    updatedSubtitle = `Summary Added • ${updatedSlides.length} Slides`;
  } else if (/\b(quiz|q&a|discussion|review)\s*slide\b/i.test(lower)) {
    const newSlideId = updatedSlides.length + 1;
    updatedSlides.push({
      id: newSlideId,
      title: 'Review Questions & Knowledge Check',
      subtitle: `Test understanding and foster interactive discussion on ${existing.title}`,
      layout: 'four-card-grid',
      headerAlignment: 'center',
      transition: 'zoom',
      notes: `Engage the audience with these discussion prompts and knowledge-check questions.`,
      cards: [
        {
          title: 'Question 1: Foundational Truth',
          content: `What is the primary factor driving the success of ${existing.title}? Reflect on the core mechanisms discussed.`,
          badge: 'Question 1',
        },
        {
          title: 'Question 2: Critical Analysis',
          content: `How would you address the primary challenges or constraints encountered when implementing this?`,
          badge: 'Question 2',
        },
        {
          title: 'Question 3: Innovation Path',
          content: `Which emerging trend will have the greatest impact on this domain over the next 3 to 5 years?`,
          badge: 'Question 3',
        },
        {
          title: 'Discussion Prompt',
          content: `Share one real-life experience or observation where these principles made a measurable difference.`,
          badge: 'Discussion',
        },
      ],
    });
    updatedSubtitle = `Quiz & Review Added • ${updatedSlides.length} Slides`;
  } else if (/\b(comparison|pros\s*(and|&)\s*cons|versus|vs)\s*slide\b/i.test(lower)) {
    const newSlideId = updatedSlides.length + 1;
    updatedSlides.push({
      id: newSlideId,
      title: 'Comparative Analysis: Strengths vs Considerations',
      subtitle: `Balanced evaluation of advantages and operational factors for ${existing.title}`,
      layout: 'comparison',
      headerAlignment: 'left',
      transition: 'slide',
      notes: `Contrast key strengths against critical constraints and practical considerations.`,
      leftColumn: {
        title: 'Primary Advantages & Strengths',
        badge: 'Advantages',
        items: [
          'High efficiency and proven performance consistency',
          'Scalable architecture adaptable to diverse environments',
          'Measurable impact and clear ROI metrics',
        ],
      },
      rightColumn: {
        title: 'Key Challenges & Considerations',
        badge: 'Considerations',
        items: [
          'Requires upfront discipline and initial orientation',
          'Continuous monitoring necessary for peak quality',
          'Resource constraints require thoughtful prioritization',
        ],
      },
    });
    updatedSubtitle = `Comparison Added • ${updatedSlides.length} Slides`;
  } else if (/\b(timeline|roadmap|milestones?)\s*slide\b/i.test(lower)) {
    const newSlideId = updatedSlides.length + 1;
    updatedSlides.push({
      id: newSlideId,
      title: 'Implementation Roadmap & Phased Timeline',
      subtitle: `Strategic chronological progression for executing ${existing.title}`,
      layout: 'timeline',
      headerAlignment: 'left',
      transition: 'fade',
      notes: `Walk through each phase of the implementation roadmap systematically.`,
      steps: [
        {
          title: 'Phase 1 • Kickoff',
          detail: 'Define objectives, align team stakeholders, and calibrate baseline requirements.',
        },
        {
          title: 'Phase 2 • Execution',
          detail: 'Deploy core systems, conduct targeted testing, and validate workflows.',
        },
        {
          title: 'Phase 3 • Optimization',
          detail: 'Roll out to primary audience, measure performance KPIs, and optimize.',
        },
      ],
    });
    updatedSubtitle = `Roadmap Added • ${updatedSlides.length} Slides`;
  } else if (/\b(facts|trivia|fun\s+facts)\s*slide\b/i.test(lower)) {
    const newSlideId = updatedSlides.length + 1;
    updatedSlides.push({
      id: newSlideId,
      title: 'Did You Know? Fascinating Facts & Data',
      subtitle: `Surprising insights and intriguing statistics about ${existing.title}`,
      layout: 'three-column',
      headerAlignment: 'center',
      transition: 'zoom',
      notes: `Share these engaging and memorable facts to maintain high audience interest.`,
      cards: [
        {
          title: 'Remarkable Metric',
          content: `Over 80% of organizations and individuals report accelerated progress when structured methodologies are applied.`,
          badge: 'Data Insight',
        },
        {
          title: 'Historical Origin',
          content: `Initial discoveries in this field paved the way for modern algorithmic and architectural breakthroughs.`,
          badge: 'History',
        },
        {
          title: 'Future Forecast',
          content: `Leading analysts predict exponential growth, creating transformative opportunities globally.`,
          badge: 'Future Outlook',
        },
      ],
    });
    updatedSubtitle = `Fascinating Facts Added • ${updatedSlides.length} Slides`;
  } else if (/\b(breeds?|characteristics?|species)\b/i.test(lower)) {
    const newSlideId = updatedSlides.length + 1;
    updatedSlides.push({
      id: newSlideId,
      title: 'Distinctive Breeds & Key Characteristics',
      subtitle: `Prominent traits, personalities, and features of ${existing.title}`,
      layout: 'three-column',
      headerAlignment: 'left',
      transition: 'slide',
      notes: `Highlighting prominent breeds, their distinct traits, and physical temperaments.`,
      cards: [
        {
          title: 'British Shorthair & Calm Companions',
          content: 'Dense plush coats, round features, and independent yet affectionate calm demeanors ideal for homes.',
          badge: 'Calm & Poised',
        },
        {
          title: 'Maine Coon & Gentle Giants',
          content: 'Large muscular build, tufted ears, high intelligence, and friendly social nature with human families.',
          badge: 'Gentle Giant',
        },
        {
          title: 'Siamese & Vocal Communicators',
          content: 'Striking blue almond eyes, sleek colorpoint coat, highly social, vocal, and deeply bonded personality.',
          badge: 'Energetic & Vocal',
        },
      ],
    });
    updatedSubtitle = `Breeds & Characteristics Added • ${updatedSlides.length} Slides`;
  } else if (/\b(nutrition|daily\s+care|care|diet|feeding)\b/i.test(lower)) {
    const newSlideId = updatedSlides.length + 1;
    updatedSlides.push({
      id: newSlideId,
      title: 'Nutrition, Daily Care & Preventive Health',
      subtitle: `Essential guidelines for daily well-being, dietary balance, and health maintenance`,
      layout: 'four-card-grid',
      headerAlignment: 'center',
      transition: 'zoom',
      notes: `Review balanced nutrition plans, enrichment schedules, and veterinary care essentials.`,
      cards: [
        {
          title: 'High-Protein Nutrition',
          content: 'High-quality animal proteins with balanced taurine, essential amino acids, and adequate moisture content.',
          badge: 'Diet & Fuel',
        },
        {
          title: 'Hydration & Water Fountains',
          content: 'Encouraging active fluid intake with circulating fountains to protect urinary and kidney function.',
          badge: 'Hydration',
        },
        {
          title: 'Daily Mental Enrichment',
          content: 'Interactive toys, scratching posts, and vertical climbing perches to satisfy natural hunting instincts.',
          badge: 'Enrichment',
        },
        {
          title: 'Routine Veterinary Care',
          content: 'Annual comprehensive checkups, vaccine boosters, parasite prevention, and dental examinations.',
          badge: 'Healthcare',
        },
      ],
    });
    updatedSubtitle = `Nutrition & Care Added • ${updatedSlides.length} Slides`;
  } else if (/\b(research|scientific|findings?)\b/i.test(lower)) {
    const newSlideId = updatedSlides.length + 1;
    updatedSlides.push({
      id: newSlideId,
      title: 'Empirical Findings & Scientific Evidence',
      subtitle: `Validated studies, experimental outcomes, and methodological findings on ${existing.title}`,
      layout: 'three-column',
      headerAlignment: 'left',
      transition: 'fade',
      notes: `Review published evidence, clinical or laboratory methodologies, and repeatable data.`,
      cards: [
        {
          title: 'Peer-Reviewed Consensus',
          content: 'Longitudinal studies demonstrate strong correlation between systematic protocols and consistent positive outcomes.',
          badge: 'Evidence',
        },
        {
          title: 'Controlled Variables',
          content: 'Rigorous control groups ensure observed effects are directly attributable to core active mechanisms.',
          badge: 'Methodology',
        },
        {
          title: 'Clinical & Field Implications',
          content: 'Translational findings provide actionable guidance for modern practical deployment and continuous monitoring.',
          badge: 'Application',
        },
      ],
    });
    updatedSubtitle = `Scientific Findings Added • ${updatedSlides.length} Slides`;
  }

  // 5. Add slides (e.g. "Add two slides", "Add 3 slides")
  const addSlideMatch = lower.match(/add\s+(one|two|three|four|five|\d+)\s+slides?/i);
  if (addSlideMatch) {
    const rawNum = addSlideMatch[1];
    const wordMap: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
    const toAdd = wordMap[rawNum] || parseInt(rawNum, 10) || 2;
    const expanded = generateFallbackPresentation(
      existing.topic,
      existing.slides.length + toAdd,
      updatedPalette,
      { isPbl: existing.isPbl, audience: existing.audience }
    );
    updatedSlides = expanded.slides;
    updatedSubtitle = `Expanded Presentation • ${updatedSlides.length} Slides`;
  }

  // 5. Grade / Audience adaptation (e.g. "Make it suitable for Grade 8")
  const gradeMatch = instruction.match(/suitable\s+for\s+(grade\s+\d+|kids|students|beginners|high\s+school)/i);
  if (gradeMatch) {
    const targetAudience = gradeMatch[1];
    updatedSubtitle = `Tailored for ${targetAudience.charAt(0).toUpperCase() + targetAudience.slice(1)} • ${updatedSlides.length} Slides`;
  }

  recordUsedStyleId(updatedPalette.id);

  return {
    ...existing,
    id: `ppt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: updatedTitle,
    subtitle: updatedSubtitle,
    paletteId: updatedPalette.id,
    palette: updatedPalette,
    slides: updatedSlides,
    createdAt: new Date().toISOString(),
  };
}

const PPT_BLOCK_REGEX = /```(?:sigma-powerpoint|powerpoint-json)\s*([\s\S]*?)```/i;

export function serializePresentationToMessage(
  presentation: PowerPointPresentation,
  introSummary?: string
): string {
  const summary =
    introSummary ||
    `I have designed a **${presentation.slides.length}-slide PowerPoint presentation** on **${presentation.title}** using the **${presentation.palette.name.split('(')[0].trim()}** visual style.`;
  return `${summary}\n\n\`\`\`sigma-powerpoint\n${JSON.stringify(presentation)}\n\`\`\``;
}

export function extractPresentationFromMessage(content: string): {
  presentation: PowerPointPresentation | null;
  cleanText: string;
} {
  if (!content || !content.includes('sigma-powerpoint')) {
    return { presentation: null, cleanText: content };
  }

  const match = content.match(PPT_BLOCK_REGEX);
  if (!match) {
    return { presentation: null, cleanText: content };
  }

  try {
    const parsed = JSON.parse(match[1]);
    const normalized = normalizePresentationData(
      parsed,
      parsed.topic || parsed.title || 'Presentation',
      Array.isArray(parsed.slides) ? parsed.slides.length : 8
    );
    const cleanText = content.replace(match[0], '').trim();
    return { presentation: normalized, cleanText };
  } catch (e) {
    console.warn('Failed to parse sigma-powerpoint block:', e);
    return { presentation: null, cleanText: content };
  }
}
