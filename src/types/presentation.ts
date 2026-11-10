export type SlideLayoutType =
  | 'title'
  | 'definition'
  | 'two-column'
  | 'three-column'
  | 'four-card-grid'
  | 'comparison'
  | 'timeline'
  | 'process'
  | 'problem-solution'
  | 'cause-effect'
  | 'statistics'
  | 'case-study'
  | 'text-diagram'
  | 'quote'
  | 'conclusion';

export type SlideTransitionType =
  | 'none'
  | 'fade'
  | 'push'
  | 'wipe'
  | 'split'
  | 'reveal'
  | 'cover'
  | 'uncover'
  | 'dissolve'
  | 'cut'
  | 'random'
  | 'random-bars'
  | 'flash'
  | 'curtains'
  | 'drape'
  | 'shape'
  | 'morph'
  | 'zoom'
  | 'gallery'
  | 'slide';

export type SlideAnimationStyle =
  | 'fade'
  | 'appear'
  | 'fly-in'
  | 'float-in'
  | 'wipe'
  | 'split'
  | 'zoom'
  | 'vibe'
  | 'grow-turn'
  | 'rise-up'
  | 'slide-in'
  | 'slide-right'
  | 'scale-pop'
  | 'stagger-Lift'
  | 'bounce'
  | 'reveal'
  | 'wheel'
  | 'shape'
  | 'swivel'
  | 'random-bars'
  | 'sequential-reveal'
  | 'fade-up'
  | 'slide-stagger'
  | 'scale-focus'
  | 'chart-grow';

export interface PresentationAnimationOption {
  id: SlideAnimationStyle;
  name: string;
  tagline: string;
  description: string;
}

export interface PresentationTransitionOption {
  id: SlideTransitionType;
  name: string;
  tagline: string;
  description: string;
}

export type SlideHeaderAlignment = 'left' | 'center' | 'split';

export type PresentationStyleId =
  | 'balanced'
  | 'editorial'
  | 'bold-geometric'
  | 'notebook'
  | 'academic'
  | 'minimal'
  | 'technical';

export interface PresentationStyleConfig {
  id: PresentationStyleId;
  name: string;
  tagline: string;
  description: string;
  fontHeading: string;
  fontBody: string;
  headingWeight: number;
  headingTracking: string;
  titlePosition: 'varied' | 'left' | 'center' | 'split';
  textAlignment: 'left' | 'center';
  spacingMode: 'generous' | 'balanced' | 'compact' | 'dense';
  cardRadiusPx: number;
  cardBorderWidthPx: number;
  cardAccentPosition: 'top' | 'left' | 'full' | 'bottom' | 'none';
  cardShadow: string;
  badgeShape: 'pill' | 'rounded' | 'sharp' | 'underline';
}

export interface PresentationPalette {
  id: string;
  name: string;
  shortName?: string;
  category?: string;
  styleDirection: string;
  isDark: boolean;
  bgPrimary: string;
  bgSecondary: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentSecondary: string;
  accentHighlight: string;
  badgeBg: string;
  badgeText: string;
  fontHeading?: string;
  fontBody?: string;
  cardRadius?: 'sharp' | 'rounded' | 'editorial' | 'pill-accent' | 'notebook';
  bgPattern?:
    | 'grid'
    | 'dots'
    | 'editorial-lines'
    | 'radial-glow'
    | 'diagonal'
    | 'newspaper'
    | 'none';
  cardShadow?: string;
  borderStyle?: 'top-accent' | 'left-accent' | 'full-border' | 'editorial-offset' | 'minimal';
  chartStyle?: 'rounded-bar' | 'sharp-meter' | 'pill-track';
  iconStyle?: 'filled-badge' | 'outline-box' | 'circle-tint';
}

export interface SlideCardItem {
  title: string;
  content: string;
  body?: string;
  icon?: string;
  badge?: string;
  statValue?: string;
  statLabel?: string;
  items?: string[];
}

export interface SlideStatItem {
  value: string;
  label: string;
  description?: string;
  source?: string;
  percentage?: number;
}

export interface SlideColumnData {
  title: string;
  subtitle?: string;
  badge?: string;
  items: string[];
}

export interface SlideData {
  id: number;
  title: string;
  subtitle?: string;
  kicker?: string;
  keyQuestion?: string;
  layout: SlideLayoutType;
  headerAlignment?: SlideHeaderAlignment;
  transition?: SlideTransitionType;
  animationStyle?: SlideAnimationStyle;
  cards?: SlideCardItem[];
  bulletPoints?: string[];
  bullets?: string[];
  steps?: { title?: string; content?: string; text?: string; detail?: string }[];
  leftColumn?: SlideColumnData;
  rightColumn?: SlideColumnData;
  stats?: SlideStatItem[];
  quote?: {
    text: string;
    author: string;
    role?: string;
  };
  diagramNodes?: {
    label: string;
    detail: string;
  }[];
  takeaway?: string;
  notes?: string;
}

export interface PresentationSettings {
  themeId: string;
  styleId: PresentationStyleId;
  animationId: SlideAnimationStyle;
  transitionId: SlideTransitionType;
  applyAnimationToAllSlides: boolean;
  applyTransitionToAllSlides: boolean;
  updatedAt?: string;
}

export interface PowerPointPresentation {
  id: string;
  title: string;
  subtitle: string;
  topic: string;
  audience?: string;
  languageLevel?: string;
  isPbl?: boolean;
  paletteId: string;
  palette: PresentationPalette;
  styleId?: PresentationStyleId;
  animationId?: SlideAnimationStyle;
  transitionId?: SlideTransitionType;
  applyAnimationToAllSlides?: boolean;
  applyTransitionToAllSlides?: boolean;
  savedSettings?: PresentationSettings;
  lastSavedAt?: string;
  slides: SlideData[];
  createdAt: string;
}
