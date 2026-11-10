import React, { useRef, useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Briefcase,
  Award,
  Globe,
  Layers,
  Zap,
  Shield,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Compass,
  Cpu,
  Activity,
  BarChart3,
  Clock,
  Heart,
  Search,
  Play,
  RefreshCw,
  GitMerge,
  Flame,
  Scale,
  GraduationCap,
  MessageSquare,
  Megaphone,
  Code2,
  Quote,
  ArrowRight,
} from 'lucide-react';
import {
  PresentationPalette,
  PresentationStyleId,
  SlideAnimationStyle,
  SlideTransitionType,
  SlideData,
} from '../../types/presentation';
import {
  getStyleConfig,
  sanitizeTextToEasyEnglish,
} from '../../lib/presentationGenerator';

interface SlideCanvasRendererProps {
  slide: SlideData;
  palette: PresentationPalette;
  styleId?: PresentationStyleId;
  animationStyle?: SlideAnimationStyle;
  transitionType?: SlideTransitionType;
  totalSlides: number;
  compact?: boolean;
  animateEntry?: boolean;
  animationKey?: string | number;
  className?: string;
}

const BASE_SLIDE_WIDTH = 800;
const BASE_SLIDE_HEIGHT = 450; // Exact 16:9 widescreen aspect ratio (800 / 450 = 16 / 9)

export function getSlideIcon(iconName?: string, className = 'w-4 h-4') {
  const key = (iconName || '').toLowerCase();
  switch (key) {
    case 'book-open':
    case 'book':
    case 'education':
      return <BookOpen className={className} />;
    case 'graduation-cap':
    case 'school':
      return <GraduationCap className={className} />;
    case 'briefcase':
    case 'work':
    case 'employment':
      return <Briefcase className={className} />;
    case 'award':
    case 'leadership':
      return <Award className={className} />;
    case 'globe':
    case 'world':
      return <Globe className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'zap':
    case 'energy':
      return <Zap className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'users':
    case 'people':
      return <Users className={className} />;
    case 'trending-up':
    case 'growth':
      return <TrendingUp className={className} />;
    case 'check-circle':
    case 'check':
      return <CheckCircle2 className={className} />;
    case 'alert-circle':
    case 'problem':
      return <AlertCircle className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'cpu':
    case 'tech':
      return <Cpu className={className} />;
    case 'activity':
      return <Activity className={className} />;
    case 'bar-chart':
    case 'chart':
      return <BarChart3 className={className} />;
    case 'clock':
    case 'time':
      return <Clock className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'search':
      return <Search className={className} />;
    case 'play':
      return <Play className={className} />;
    case 'refresh-cw':
    case 'repeat':
      return <RefreshCw className={className} />;
    case 'git-merge':
      return <GitMerge className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'scale':
      return <Scale className={className} />;
    case 'message-square':
      return <MessageSquare className={className} />;
    case 'megaphone':
      return <Megaphone className={className} />;
    case 'code':
      return <Code2 className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

export const SlideCanvasRenderer: React.FC<SlideCanvasRendererProps> = ({
  slide,
  palette,
  styleId,
  animationStyle: propAnimationStyle,
  transitionType: propTransitionType,
  totalSlides,
  compact = false,
  animateEntry = false,
  animationKey,
  className = '',
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(compact ? 0.22 : 0.65);
  const [animStep, setAnimStep] = useState<number>(animateEntry ? 0 : 10);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const updateScale = () => {
      const w = el.clientWidth;
      if (w > 0) {
        setScale(w / BASE_SLIDE_WIDTH);
      }
    };

    updateScale();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateScale();
      });
      observer.observe(el);
      return () => observer.disconnect();
    } else {
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, []);

  useEffect(() => {
    if (!animateEntry) {
      setAnimStep(10);
      return;
    }
    setAnimStep(0);
    const t1 = setTimeout(() => setAnimStep(1), 50); // Title & Kicker
    const t2 = setTimeout(() => setAnimStep(2), 170); // Subtitle & Item 1
    const t3 = setTimeout(() => setAnimStep(3), 300); // Item 2
    const t4 = setTimeout(() => setAnimStep(4), 440); // Item 3 / 4 & Chart bars
    const t5 = setTimeout(() => setAnimStep(5), 580); // Footer takeaway highlight
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [animateEntry, slide.id, animationKey, propAnimationStyle, propTransitionType]);

  const effectiveSlideTrans: SlideTransitionType =
    propTransitionType || slide.transition || 'none';
  const effectiveSlideAnim: SlideAnimationStyle =
    propAnimationStyle || slide.animationStyle || 'fade';

  const styleConfig = getStyleConfig(styleId, palette);
  const cards = slide.cards || [];
  const accents = [
    palette.accentPrimary,
    palette.accentSecondary,
    palette.accentHighlight,
  ];

  // Combine theme & style typography
  const headingFont = styleId
    ? styleConfig.fontHeading
    : palette.fontHeading || styleConfig.fontHeading;
  const bodyFont = styleId
    ? styleConfig.fontBody
    : palette.fontBody || styleConfig.fontBody;

  // Determine effective header alignment combining slide variation + style preference
  const effectiveAlignment =
    styleConfig.titlePosition === 'center'
      ? 'center'
      : styleConfig.titlePosition === 'split'
      ? 'split'
      : slide.headerAlignment ||
        (slide.id % 3 === 0 ? 'center' : slide.id % 2 === 0 ? 'split' : 'left');

  // Determine spacing density from styleConfig
  const stagePaddingClass =
    styleConfig.spacingMode === 'generous'
      ? 'p-7'
      : styleConfig.spacingMode === 'compact' || styleConfig.spacingMode === 'dense'
      ? 'p-5'
      : 'p-6';

  const gridGapClass =
    styleConfig.spacingMode === 'generous'
      ? 'gap-4'
      : styleConfig.spacingMode === 'compact' || styleConfig.spacingMode === 'dense'
      ? 'gap-2.5'
      : 'gap-3.5';

  // Helper to style cards according to the selected Theme + Style
  const getCardStyle = (accent: string): React.CSSProperties => {
    const radius =
      palette.cardRadius === 'sharp'
        ? 4
        : palette.cardRadius === 'editorial'
        ? 6
        : palette.cardRadius === 'pill-accent' || palette.cardRadius === 'notebook'
        ? 16
        : styleConfig.cardRadiusPx;

    const effectiveRadius = styleId ? styleConfig.cardRadiusPx : radius;
    const accentPos = styleId
      ? styleConfig.cardAccentPosition
      : palette.borderStyle === 'left-accent'
      ? 'left'
      : palette.borderStyle === 'full-border'
      ? 'full'
      : palette.borderStyle === 'minimal'
      ? 'none'
      : 'top';

    const base: React.CSSProperties = {
      backgroundColor: palette.cardBg,
      borderColor: `${accent}50`,
      borderWidth: `${styleConfig.cardBorderWidthPx}px`,
      borderStyle: 'solid',
      borderRadius: `${effectiveRadius}px`,
      boxShadow:
        palette.borderStyle === 'editorial-offset' || styleConfig.id === 'editorial'
          ? `4px 4px 0px ${accent}30`
          : styleConfig.cardShadow,
      textAlign: styleConfig.textAlignment,
    };

    if (accentPos === 'top') {
      base.borderTopWidth = '4px';
      base.borderTopColor = accent;
    } else if (accentPos === 'left') {
      base.borderLeftWidth = '4px';
      base.borderLeftColor = accent;
    } else if (accentPos === 'bottom') {
      base.borderBottomWidth = '4px';
      base.borderBottomColor = accent;
    } else if (accentPos === 'full') {
      base.borderWidth = '2px';
      base.borderColor = accent;
    }

    return base;
  };

  // Helper for purposeful element reveal animation (supports all 15 Animation options)
  const getElementTransitionStyle = (
    requiredStep: number,
    indexOffset = 0
  ): React.CSSProperties => {
    if (!animateEntry) return {};
    const isVisible = animStep >= requiredStep;
    const animType: SlideAnimationStyle =
      propAnimationStyle || slide.animationStyle || 'fade';

    let hiddenTransform = 'translateY(16px)';
    let durationMs = 380;
    let easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

    switch (animType) {
      case 'appear':
        hiddenTransform = 'translate(0, 0) scale(1)';
        durationMs = 120;
        easing = 'ease-out';
        break;
      case 'zoom':
      case 'scale-focus':
      case 'scale-pop':
        hiddenTransform = 'scale(0.12)';
        durationMs = 520;
        easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
        break;
      case 'vibe':
        hiddenTransform = 'scale(0.55) rotate(-10deg) translateY(24px)';
        durationMs = 520;
        easing = 'cubic-bezier(0.34, 1.75, 0.64, 1)';
        break;
      case 'fly-in':
        hiddenTransform = 'translateY(110px) scale(0.85)';
        durationMs = 480;
        easing = 'cubic-bezier(0.16, 1, 0.3, 1)';
        break;
      case 'float-in':
        hiddenTransform = 'translateY(36px) scale(0.94)';
        durationMs = 480;
        easing = 'cubic-bezier(0.25, 1, 0.5, 1)';
        break;
      case 'wipe':
        hiddenTransform = 'translateX(-90px)';
        durationMs = 420;
        easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
        break;
      case 'split':
        hiddenTransform = 'scaleX(0.05)';
        durationMs = 440;
        easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
        break;
      case 'grow-turn':
        hiddenTransform = 'scale(0.18) rotate(-30deg)';
        durationMs = 540;
        easing = 'cubic-bezier(0.25, 1, 0.5, 1)';
        break;
      case 'rise-up':
      case 'stagger-Lift':
        hiddenTransform = 'translateY(75px) scale(0.9)';
        durationMs = 460;
        easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
        break;
      case 'slide-in':
      case 'slide-stagger':
      case 'slide-right':
        hiddenTransform = 'translateX(-100px)';
        durationMs = 440;
        easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
        break;
      case 'reveal':
        hiddenTransform = 'translateY(28px) scale(0.92)';
        durationMs = 440;
        easing = 'ease-out';
        break;
      case 'wheel':
        hiddenTransform = 'rotate(-90deg) scale(0.2)';
        durationMs = 560;
        easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
        break;
      case 'shape':
        hiddenTransform = 'scale(0.08) rotate(8deg)';
        durationMs = 460;
        easing = 'cubic-bezier(0.34, 1.5, 0.64, 1)';
        break;
      case 'swivel':
        hiddenTransform = 'perspective(600px) rotateY(90deg) scale(0.7)';
        durationMs = 500;
        easing = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
        break;
      case 'bounce':
        hiddenTransform = 'translateY(95px) scale(0.65)';
        durationMs = 620;
        easing = 'cubic-bezier(0.34, 1.6, 0.64, 1)';
        break;
      case 'fade':
      case 'fade-up':
      default:
        hiddenTransform = 'translateY(18px)';
        durationMs = 380;
        easing = 'ease-out';
        break;
    }

    const delayMs = indexOffset * 65;

    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translate(0, 0) scale(1) rotate(0deg)' : hiddenTransform,
      transition: `opacity ${durationMs}ms ${easing} ${delayMs}ms, transform ${durationMs}ms ${easing} ${delayMs}ms`,
    };
  };

  const getTransitionClass = (transType: SlideTransitionType): string => {
    switch (transType) {
      case 'push':
      case 'slide':
        return 'ppt-trans-push';
      case 'gallery':
        return 'ppt-trans-gallery';
      case 'morph':
        return 'ppt-trans-morph';
      case 'zoom':
        return 'ppt-trans-zoom';
      case 'wipe':
        return 'ppt-trans-wipe';
      case 'split':
        return 'ppt-trans-split';
      case 'shape':
        return 'ppt-trans-shape';
      case 'curtains':
        return 'ppt-trans-curtains';
      case 'cover':
        return 'ppt-trans-cover';
      case 'uncover':
        return 'ppt-trans-uncover';
      case 'drape':
        return 'ppt-trans-drape';
      case 'flash':
        return 'ppt-trans-flash';
      case 'dissolve':
        return 'ppt-trans-dissolve';
      case 'random-bars':
        return 'ppt-trans-random-bars';
      case 'fade':
      case 'random':
        return 'ppt-trans-fade';
      case 'cut':
      case 'none':
      default:
        return '';
    }
  };

  const renderIconBadge = (iconName: string | undefined, accent: string, size = 'w-6 h-6') => {
    const iconMode = palette.iconStyle || 'filled-badge';
    if (iconMode === 'outline-box') {
      return (
        <div
          className={`${size} rounded flex items-center justify-center flex-shrink-0 border`}
          style={{ borderColor: accent, color: accent, backgroundColor: 'transparent' }}
        >
          {getSlideIcon(iconName, 'w-3.5 h-3.5')}
        </div>
      );
    }
    if (iconMode === 'circle-tint') {
      return (
        <div
          className={`${size} rounded-full flex items-center justify-center flex-shrink-0`}
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          {getSlideIcon(iconName, 'w-3.5 h-3.5')}
        </div>
      );
    }
    return (
      <div
        className={`${size} rounded-lg flex items-center justify-center flex-shrink-0`}
        style={{ backgroundColor: `${accent}22`, color: accent }}
      >
        {getSlideIcon(iconName, 'w-3.5 h-3.5')}
      </div>
    );
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full aspect-video overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: palette.bgPrimary,
        color: palette.textPrimary,
      }}
    >
      {/* Proportionally Scaled 16:9 Widescreen Stage (800x450) */}
      <div
        className="absolute top-0 left-0 flex flex-col justify-between overflow-hidden"
        style={{
          width: `${BASE_SLIDE_WIDTH}px`,
          height: `${BASE_SLIDE_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundColor: '#070a14',
          color: palette.textPrimary,
        }}
      >
        {/* Full Slide Transition Animated Stage Container */}
        <div
          key={`ppt-stage-${animationKey || slide.id}-${effectiveSlideTrans}`}
          style={{
            backgroundColor: palette.bgPrimary,
            color: palette.textPrimary,
          }}
          className={`relative w-full h-full flex flex-col justify-between overflow-hidden ${
            animateEntry ? getTransitionClass(effectiveSlideTrans) : ''
          }`}
        >
          {/* Top Coordinated Gradient Bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5 z-10"
            style={{
              background: `linear-gradient(90deg, ${palette.accentPrimary}, ${palette.accentSecondary}, ${palette.accentHighlight})`,
            }}
          />

          {/* Theme & Style Background Patterns */}
          {(palette.bgPattern === 'grid' || styleConfig.id === 'technical') && (
            <div
              className="absolute inset-0 pointer-events-none opacity-15"
              style={{
                backgroundImage: `linear-gradient(to right, ${palette.accentSecondary}33 1px, transparent 1px), linear-gradient(to bottom, ${palette.accentSecondary}33 1px, transparent 1px)`,
                backgroundSize: '28px 28px',
              }}
            />
          )}
          {(palette.bgPattern === 'dots' || styleConfig.id === 'notebook') && (
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage: `radial-gradient(${palette.accentPrimary}55 1.2px, transparent 1.2px)`,
                backgroundSize: '22px 22px',
              }}
            />
          )}
          {palette.bgPattern === 'editorial-lines' && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${palette.cardBorder}66 1px, transparent 1px)`,
                backgroundSize: '100% 36px',
              }}
            />
          )}
          {palette.bgPattern === 'newspaper' && (
            <div
              className="absolute inset-0 pointer-events-none opacity-15"
              style={{
                backgroundImage: `linear-gradient(to right, ${palette.cardBorder}44 1px, transparent 1px)`,
                backgroundSize: '200px 100%',
              }}
            />
          )}
          {palette.bgPattern === 'diagonal' && (
            <div
              className="absolute inset-0 pointer-events-none opacity-15"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${palette.accentPrimary}18 0px, ${palette.accentPrimary}18 1px, transparent 1px, transparent 16px)`,
              }}
            />
          )}
          {palette.bgPattern === 'radial-glow' && (
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                background: `radial-gradient(circle at 85% 15%, ${palette.accentPrimary}44, transparent 45%), radial-gradient(circle at 15% 85%, ${palette.accentSecondary}33, transparent 50%)`,
              }}
            />
          )}

          {/* Decorative Geometric Accents */}
          {styleConfig.id !== 'minimal' && (
            <>
              <div
                className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none opacity-20 blur-2xl"
                style={{ backgroundColor: palette.accentPrimary }}
              />
              <div
                className="absolute -bottom-20 -left-16 w-60 h-60 rounded-full pointer-events-none opacity-15 blur-2xl"
                style={{ backgroundColor: palette.accentSecondary }}
              />
            </>
          )}

          {/* Main Slide Content Area */}
          <div
            className={`relative z-10 flex-1 flex flex-col justify-between ${stagePaddingClass} overflow-hidden`}
            style={{ fontFamily: bodyFont }}
          >
          {/* SLIDE HEADER (For non-title slides) — Supports Left, Center, and Split Composition */}
          {slide.layout !== 'title' && (
            <div
              className={`mb-3 ${
                effectiveAlignment === 'center'
                  ? 'text-center'
                  : effectiveAlignment === 'split'
                  ? 'flex items-end justify-between gap-4 border-b pb-2'
                  : ''
              }`}
              style={{
                borderColor:
                  effectiveAlignment === 'split' ? `${palette.cardBorder}80` : undefined,
                ...getElementTransitionStyle(1, 0),
              }}
            >
              <div className={effectiveAlignment === 'split' ? 'max-w-[65%]' : ''}>
                <div
                  className={`flex items-center gap-2 mb-1 ${
                    effectiveAlignment === 'center' ? 'justify-center' : ''
                  }`}
                >
                  <span
                    className={`inline-block font-bold tracking-widest uppercase text-[9.5px] px-2 py-0.5 ${
                      styleConfig.badgeShape === 'pill'
                        ? 'rounded-full'
                        : styleConfig.badgeShape === 'sharp'
                        ? 'rounded-none'
                        : 'rounded-md'
                    }`}
                    style={{
                      backgroundColor: palette.badgeBg,
                      color: palette.accentSecondary,
                      border: `1px solid ${palette.accentSecondary}35`,
                    }}
                  >
                    {sanitizeTextToEasyEnglish(slide.kicker || `SLIDE 0${slide.id}`, {
                      isHeading: true,
                    })}
                  </span>
                  {effectiveAlignment === 'left' && (
                    <div
                      className="h-px flex-1 opacity-25"
                      style={{ backgroundColor: palette.cardBorder }}
                    />
                  )}
                </div>
                <h2
                  className="font-extrabold leading-tight break-words text-[21px]"
                  style={{
                    color: palette.textPrimary,
                    fontFamily: headingFont,
                    fontWeight: styleConfig.headingWeight,
                    letterSpacing: styleConfig.headingTracking,
                  }}
                >
                  {sanitizeTextToEasyEnglish(slide.title, { isHeading: true })}
                </h2>
              </div>

              {slide.subtitle && (
                <p
                  className={`text-[11.5px] leading-snug break-words ${
                    effectiveAlignment === 'split'
                      ? 'max-w-[34%] text-right'
                      : 'mt-0.5'
                  }`}
                  style={{ color: palette.textSecondary }}
                >
                  {sanitizeTextToEasyEnglish(slide.subtitle, { isHeading: true })}
                </p>
              )}
            </div>
          )}

          {/* SLIDE BODY BY LAYOUT TYPE — ZERO "..." TRUNCATION */}
          <div className="flex-1 flex flex-col justify-center min-h-0">
            {slide.layout === 'title' ? (
              /* 1. FULL-SCREEN HERO TITLE LAYOUT */
              <div className="flex flex-col justify-between h-full">
                <div
                  className={`my-auto ${
                    styleConfig.titlePosition === 'center' ? 'text-center items-center flex flex-col' : ''
                  }`}
                  style={getElementTransitionStyle(1, 0)}
                >
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider mb-2.5 text-[10.5px] px-3 py-1"
                    style={{
                      backgroundColor: palette.badgeBg,
                      color: palette.accentSecondary,
                      border: `1px solid ${palette.accentPrimary}50`,
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {sanitizeTextToEasyEnglish(
                        slide.kicker || 'EDUCATIONAL PRESENTATION',
                        { isHeading: true }
                      )}
                    </span>
                  </div>

                  <h1
                    className="font-black leading-tight break-words text-[32px]"
                    style={{
                      color: palette.textPrimary,
                      fontFamily: headingFont,
                      letterSpacing: styleConfig.headingTracking,
                    }}
                  >
                    {sanitizeTextToEasyEnglish(slide.title, { isHeading: true })}
                  </h1>

                  {slide.subtitle && (
                    <p
                      className="mt-2 max-w-2xl font-medium leading-snug break-words text-[13px]"
                      style={{ color: palette.textSecondary }}
                    >
                      {sanitizeTextToEasyEnglish(slide.subtitle, { isHeading: true })}
                    </p>
                  )}
                </div>

                {/* Hero Bottom 3 Highlight Cards */}
                {cards.length > 0 && (
                  <div className={`grid grid-cols-3 ${gridGapClass} mt-3`}>
                    {cards.slice(0, 3).map((c, idx) => {
                      const accent = accents[idx % accents.length];
                      return (
                        <div
                          key={idx}
                          className="flex flex-col justify-between p-3"
                          style={{
                            ...getCardStyle(accent),
                            ...getElementTransitionStyle(2 + idx, idx),
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className="font-bold uppercase tracking-wider text-[9.5px]"
                                style={{ color: accent }}
                              >
                                {sanitizeTextToEasyEnglish(c.badge || `0${idx + 1}`, {
                                  isHeading: true,
                                })}
                              </span>
                              <span style={{ color: accent }}>
                                {getSlideIcon(c.icon, 'w-3.5 h-3.5')}
                              </span>
                            </div>
                            <h4
                              className="font-bold leading-snug break-words text-[13px]"
                              style={{
                                color: palette.textPrimary,
                                fontFamily: headingFont,
                              }}
                            >
                              {sanitizeTextToEasyEnglish(c.title, { isHeading: true })}
                            </h4>
                            <p
                              className="text-[11px] mt-1 leading-snug break-words"
                              style={{ color: palette.textSecondary }}
                            >
                              {sanitizeTextToEasyEnglish(c.content)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : slide.layout === 'comparison' ||
              slide.layout === 'problem-solution' ||
              (slide.layout === 'two-column' &&
                (slide.leftColumn || slide.rightColumn)) ? (
              /* 2. COMPARISON / PROBLEM-SOLUTION DUAL PANEL LAYOUT (renders 5+ items across both panels) */
              <div className={`grid grid-cols-2 h-full ${gridGapClass}`}>
                {(() => {
                  const halfIdx = Math.ceil(cards.length / 2);
                  const rawLeftItems = slide.leftColumn?.items || [];
                  const rawRightItems = slide.rightColumn?.items || [];
                  const hasEnoughItems =
                    rawLeftItems.length + rawRightItems.length >= Math.min(5, cards.length);

                  const leftCol =
                    slide.leftColumn && hasEnoughItems
                      ? slide.leftColumn
                      : {
                          title:
                            slide.leftColumn?.title ||
                            cards[0]?.title ||
                            (slide.layout === 'problem-solution'
                              ? 'Challenges & Key Issues'
                              : 'Key Perspective A'),
                          subtitle: slide.leftColumn?.subtitle || cards[0]?.badge,
                          badge:
                            slide.leftColumn?.badge ||
                            (slide.layout === 'problem-solution' ? 'CHALLENGE' : 'SIDE A'),
                          items:
                            cards.length >= 2
                              ? cards.slice(0, halfIdx).map((c) => `${c.title}: ${c.content}`)
                              : rawLeftItems,
                        };

                  const rightCol =
                    slide.rightColumn && hasEnoughItems
                      ? slide.rightColumn
                      : {
                          title:
                            slide.rightColumn?.title ||
                            cards[halfIdx]?.title ||
                            (slide.layout === 'problem-solution'
                              ? 'Solutions & Action Steps'
                              : 'Key Perspective B'),
                          subtitle: slide.rightColumn?.subtitle || cards[halfIdx]?.badge,
                          badge:
                            slide.rightColumn?.badge ||
                            (slide.layout === 'problem-solution' ? 'SOLUTION' : 'SIDE B'),
                          items:
                            cards.length >= 2
                              ? cards.slice(halfIdx).map((c) => `${c.title}: ${c.content}`)
                              : rawRightItems,
                        };

                  return [
                    { col: leftCol, accent: palette.accentSecondary },
                    { col: rightCol, accent: palette.accentHighlight },
                  ].map(({ col, accent }, cIdx) => (
                    <div
                      key={cIdx}
                      className="flex flex-col justify-between overflow-hidden p-3"
                      style={{
                        ...getCardStyle(accent),
                        ...getElementTransitionStyle(2 + cIdx, cIdx),
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className="font-bold uppercase tracking-wider text-[9px]"
                            style={{ color: accent }}
                          >
                            {sanitizeTextToEasyEnglish(
                              col.badge || (cIdx === 0 ? 'PERSPECTIVE A' : 'PERSPECTIVE B'),
                              { isHeading: true }
                            )}
                          </span>
                        </div>
                        <h3
                          className="font-bold leading-snug break-words text-[14px]"
                          style={{
                            color: palette.textPrimary,
                            fontFamily: headingFont,
                          }}
                        >
                          {sanitizeTextToEasyEnglish(col.title, { isHeading: true })}
                        </h3>
                        <ul className="mt-1.5 space-y-1 text-left">
                          {(col.items || []).slice(0, 4).map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-1.5 text-[10.5px] leading-snug"
                              style={{ color: palette.textSecondary }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                style={{ backgroundColor: accent }}
                              />
                              <span className="break-words">
                                {sanitizeTextToEasyEnglish(item)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : slide.layout === 'two-column' || slide.layout === 'definition' ? (
              /* 3. DEFINITION / TWO-COLUMN LAYOUT (Primary card on left + up to 4 supporting cards in 2x2 grid on right = 5 points) */
              cards.length >= 3 ? (
                <div className={`grid grid-cols-12 h-full ${gridGapClass}`}>
                  {/* Primary Spotlight Card (Left 4 cols) */}
                  {(() => {
                    const primary = cards[0];
                    const accent = accents[0];
                    return (
                      <div
                        className="col-span-4 flex flex-col justify-between overflow-hidden p-3"
                        style={{
                          ...getCardStyle(accent),
                          ...getElementTransitionStyle(2, 0),
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span
                              className="font-bold uppercase tracking-wider text-[9px]"
                              style={{ color: accent }}
                            >
                              {sanitizeTextToEasyEnglish(
                                primary.badge || '01 · CORE CONCEPT',
                                { isHeading: true }
                              )}
                            </span>
                            {renderIconBadge(primary.icon, accent, 'w-5 h-5')}
                          </div>
                          <h3
                            className="font-bold leading-snug break-words text-[13.5px]"
                            style={{
                              color: palette.textPrimary,
                              fontFamily: headingFont,
                            }}
                          >
                            {sanitizeTextToEasyEnglish(primary.title, { isHeading: true })}
                          </h3>
                          <p
                            className="text-[10.5px] mt-1 leading-snug break-words"
                            style={{ color: palette.textSecondary }}
                          >
                            {sanitizeTextToEasyEnglish(primary.content)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Supporting 4 Cards in 2x2 Grid (Right 8 cols) */}
                  <div className="col-span-8 grid grid-cols-2 grid-rows-2 gap-2.5 h-full">
                    {cards.slice(1, 5).map((c, idx) => {
                      const accent = accents[(idx + 1) % accents.length];
                      return (
                        <div
                          key={idx}
                          className="flex flex-col justify-center overflow-hidden p-2.5"
                          style={{
                            ...getCardStyle(accent),
                            ...getElementTransitionStyle(2 + Math.floor((idx + 1) / 2), idx + 1),
                          }}
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-0.5">
                            <h4
                              className="font-bold leading-snug break-words text-[12px]"
                              style={{
                                color: palette.textPrimary,
                                fontFamily: headingFont,
                              }}
                            >
                              {sanitizeTextToEasyEnglish(c.title, { isHeading: true })}
                            </h4>
                            <span
                              className="font-bold uppercase tracking-wider text-[8.5px] flex-shrink-0"
                              style={{ color: accent }}
                            >
                              {sanitizeTextToEasyEnglish(
                                c.badge || `0${idx + 2}`,
                                { isHeading: true }
                              )}
                            </span>
                          </div>
                          <p
                            className="text-[10px] leading-snug break-words"
                            style={{ color: palette.textSecondary }}
                          >
                            {sanitizeTextToEasyEnglish(c.content)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={`grid grid-cols-2 h-full ${gridGapClass}`}>
                  {cards.slice(0, 2).map((c, idx) => {
                    const accent = accents[idx % accents.length];
                    return (
                      <div
                        key={idx}
                        className="flex flex-col justify-between overflow-hidden p-3.5"
                        style={{
                          ...getCardStyle(accent),
                          ...getElementTransitionStyle(2 + idx, idx),
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className="font-bold uppercase tracking-wider text-[9.5px]"
                              style={{ color: accent }}
                            >
                              {sanitizeTextToEasyEnglish(
                                c.badge || `KEY CONCEPT 0${idx + 1}`,
                                { isHeading: true }
                              )}
                            </span>
                            {renderIconBadge(c.icon, accent, 'w-6 h-6')}
                          </div>
                          <h3
                            className="font-bold leading-snug break-words text-[15px]"
                            style={{
                              color: palette.textPrimary,
                              fontFamily: headingFont,
                            }}
                          >
                            {sanitizeTextToEasyEnglish(c.title, { isHeading: true })}
                          </h3>
                          <p
                            className="text-[11px] mt-1 leading-snug break-words"
                            style={{ color: palette.textSecondary }}
                          >
                            {sanitizeTextToEasyEnglish(c.content)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : slide.layout === 'four-card-grid' ? (
              /* 4. BENTO GRID LAYOUT (Supports 4, 5, or 6 cards cleanly) */
              <div
                className={`grid ${
                  cards.length >= 5 ? 'grid-cols-3 grid-rows-2' : 'grid-cols-2 grid-rows-2'
                } h-full gap-2.5`}
              >
                {cards.slice(0, 6).map((c, idx) => {
                  const accent = accents[idx % accents.length];
                  return (
                    <div
                      key={idx}
                      className="flex flex-col justify-center overflow-hidden p-2.5"
                      style={{
                        ...getCardStyle(accent),
                        ...getElementTransitionStyle(2 + Math.floor(idx / 2), idx),
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {renderIconBadge(c.icon, accent, 'w-4 h-4')}
                        <h4
                          className="font-bold leading-snug break-words text-[12px]"
                          style={{
                            color: palette.textPrimary,
                            fontFamily: headingFont,
                          }}
                        >
                          {sanitizeTextToEasyEnglish(c.title, { isHeading: true })}
                        </h4>
                      </div>
                      <p
                        className="text-[10px] leading-snug break-words"
                        style={{ color: palette.textSecondary }}
                      >
                        {sanitizeTextToEasyEnglish(c.content)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : slide.layout === 'process' || slide.layout === 'timeline' ? (
              /* 5. PROCESS / TIMELINE CONNECTED STEPS LAYOUT (Supports up to 6 steps) */
              <div
                className={`grid ${
                  cards.length >= 5
                    ? 'grid-cols-3 grid-rows-2'
                    : cards.length === 4
                    ? 'grid-cols-4'
                    : 'grid-cols-3'
                } h-full items-stretch gap-2.5`}
              >
                {cards.slice(0, 6).map((c, idx) => {
                  const accent = accents[idx % accents.length];
                  const isDense = cards.length >= 5;
                  return (
                    <div
                      key={idx}
                      className={`relative flex flex-col justify-between overflow-hidden ${
                        isDense ? 'p-2.5' : 'p-3'
                      }`}
                      style={{
                        ...getCardStyle(accent),
                        ...getElementTransitionStyle(2 + Math.min(3, idx), idx),
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className="font-black rounded px-1.5 py-0.5 text-[9px]"
                            style={{
                              backgroundColor: `${accent}25`,
                              color: accent,
                            }}
                          >
                            {sanitizeTextToEasyEnglish(
                              c.badge || `STEP 0${idx + 1}`,
                              { isHeading: true }
                            )}
                          </span>
                          {idx < cards.slice(0, 6).length - 1 && (
                            <ArrowRight
                              className="w-3 h-3 opacity-60 flex-shrink-0"
                              style={{ color: accent }}
                            />
                          )}
                        </div>
                        <h4
                          className={`font-bold leading-snug break-words ${
                            isDense ? 'text-[12px]' : 'text-[13px]'
                          }`}
                          style={{
                            color: palette.textPrimary,
                            fontFamily: headingFont,
                          }}
                        >
                          {sanitizeTextToEasyEnglish(c.title, { isHeading: true })}
                        </h4>
                        <p
                          className={`${
                            isDense ? 'text-[10px] mt-0.5' : 'text-[11px] mt-1.5'
                          } leading-snug break-words`}
                          style={{ color: palette.textSecondary }}
                        >
                          {sanitizeTextToEasyEnglish(c.content)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : slide.layout === 'statistics' &&
              slide.stats &&
              slide.stats.length > 0 ? (
              /* 6. STATISTICS & VISUAL DATA CHARTS LAYOUT — COMPLETE LABELS & SUPPORTING POINTS */
              <div className="flex flex-col justify-between h-full gap-2">
                <div className={`grid grid-cols-3 ${ cards.length > 3 ? 'flex-1' : 'h-full'} gap-2.5`}>
                  {slide.stats.slice(0, 3).map((st, idx) => {
                    const accent = accents[idx % accents.length];
                    const pct = st.percentage || 80;
                    const targetWidth =
                      animateEntry && animStep < 3
                        ? 0
                        : Math.min(100, Math.max(15, pct));
                    const barRadiusClass =
                      palette.chartStyle === 'sharp-meter'
                        ? 'rounded-none'
                        : 'rounded-full';
                    return (
                      <div
                        key={idx}
                        className="flex flex-col justify-between overflow-hidden p-3"
                        style={{
                          ...getCardStyle(accent),
                          ...getElementTransitionStyle(2 + idx, idx),
                        }}
                      >
                        <div>
                          <div
                            className="font-black tracking-tight tabular-nums text-[22px] leading-none"
                            style={{ color: accent, fontFamily: headingFont }}
                          >
                            {sanitizeTextToEasyEnglish(st.value, {
                              isStatValue: true,
                            })}
                          </div>
                          <h4
                            className="font-bold mt-1 leading-snug break-words text-[12px]"
                            style={{
                              color: palette.textPrimary,
                              fontFamily: headingFont,
                            }}
                          >
                            {sanitizeTextToEasyEnglish(st.label, { isHeading: true })}
                          </h4>
                          {st.description && (
                            <p
                              className="text-[10px] mt-1 leading-snug break-words"
                              style={{ color: palette.textSecondary }}
                            >
                              {sanitizeTextToEasyEnglish(st.description)}
                            </p>
                          )}
                        </div>

                        {/* Visual Progress Bar Chart */}
                        <div className="mt-1.5">
                          <div
                            className={`w-full h-1.5 overflow-hidden ${barRadiusClass}`}
                            style={{ backgroundColor: `${palette.cardBorder}80` }}
                          >
                            <div
                              className={`h-full transition-all duration-700 ease-out ${barRadiusClass}`}
                              style={{
                                width: `${targetWidth}%`,
                                backgroundColor: accent,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {cards.length > 3 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {cards.slice(3, 5).map((c, idx) => {
                      const accent = accents[(idx + 1) % accents.length];
                      return (
                        <div
                          key={idx}
                          className="flex flex-col justify-center overflow-hidden p-2.5"
                          style={{
                            ...getCardStyle(accent),
                            ...getElementTransitionStyle(4, idx + 3),
                          }}
                        >
                          <h4
                            className="font-bold leading-snug break-words text-[11.5px]"
                            style={{ color: palette.textPrimary, fontFamily: headingFont }}
                          >
                            {sanitizeTextToEasyEnglish(c.title, { isHeading: true })}
                          </h4>
                          <p
                            className="text-[10px] mt-0.5 leading-snug break-words"
                            style={{ color: palette.textSecondary }}
                          >
                            {sanitizeTextToEasyEnglish(c.content)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : slide.layout === 'quote' && slide.quote ? (
              /* 7. FEATURED QUOTE / INSIGHT CALLOUT LAYOUT */
              <div
                className="h-full flex flex-col justify-center items-center text-center p-7"
                style={{
                  ...getCardStyle(palette.accentPrimary),
                  ...getElementTransitionStyle(2, 0),
                }}
              >
                <Quote
                  className="w-7 h-7 mb-2 opacity-80"
                  style={{ color: palette.accentPrimary }}
                />
                <blockquote
                  className="font-bold italic max-w-2xl leading-snug break-words text-[18px]"
                  style={{
                    color: palette.textPrimary,
                    fontFamily: headingFont,
                  }}
                >
                  “{sanitizeTextToEasyEnglish(slide.quote.text)}”
                </blockquote>
                <div
                  className="mt-2 font-semibold text-xs"
                  style={{ color: palette.accentSecondary }}
                >
                  — {sanitizeTextToEasyEnglish(slide.quote.author, { isHeading: true })}
                  {slide.quote.role
                    ? ` · ${sanitizeTextToEasyEnglish(slide.quote.role, {
                        isHeading: true,
                      })}`
                    : ''}
                </div>
              </div>
            ) : (
              /* 8. DEFAULT MULTI-CARD LAYOUT (three-column, cause-effect, conclusion, case-study, text-diagram — supports 3 to 6 cards) */
              <div
                className={`grid ${
                  cards.length >= 4 ? 'grid-cols-3 grid-rows-2 gap-2.5' : `grid-cols-3 ${gridGapClass}`
                } h-full`}
              >
                {cards.slice(0, 6).map((c, idx) => {
                  const accent = accents[idx % accents.length];
                  const isDense = cards.length >= 4;
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col justify-between overflow-hidden ${
                        isDense ? 'p-2.5' : 'p-3.5'
                      }`}
                      style={{
                        ...getCardStyle(accent),
                        ...getElementTransitionStyle(2 + Math.min(3, idx), idx),
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <span
                            className="font-bold uppercase tracking-wider text-[9px]"
                            style={{ color: accent }}
                          >
                            {sanitizeTextToEasyEnglish(c.badge || `0${idx + 1}`, {
                              isHeading: true,
                            })}
                          </span>
                          {renderIconBadge(c.icon, accent, isDense ? 'w-5 h-5' : 'w-6 h-6')}
                        </div>

                        <h3
                          className={`font-extrabold leading-snug break-words ${
                            isDense ? 'text-[12px]' : 'text-[14px]'
                          }`}
                          style={{
                            color: palette.textPrimary,
                            fontFamily: headingFont,
                          }}
                        >
                          {sanitizeTextToEasyEnglish(c.title, { isHeading: true })}
                        </h3>

                        {c.statValue && (
                          <div className="mt-0.5 flex flex-wrap items-baseline gap-1">
                            <span
                              className={`${isDense ? 'text-[12.5px]' : 'text-[15px]'} font-black tabular-nums`}
                              style={{ color: accent }}
                            >
                              {sanitizeTextToEasyEnglish(c.statValue, {
                                isStatValue: true,
                              })}
                            </span>
                            {c.statLabel && (
                              <span
                                className="text-[9.5px] leading-tight break-words"
                                style={{ color: palette.textMuted }}
                              >
                                {sanitizeTextToEasyEnglish(c.statLabel, {
                                  isHeading: true,
                                })}
                              </span>
                            )}
                          </div>
                        )}

                        <p
                          className={`${
                            isDense ? 'text-[10px] mt-0.5' : 'text-[11px] mt-1.5'
                          } leading-snug break-words`}
                          style={{ color: palette.textSecondary }}
                        >
                          {sanitizeTextToEasyEnglish(c.content)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SLIDE FOOTER */}
          <div
            className="flex items-center justify-between gap-2 pt-1.5 border-t mt-2.5 text-[10.5px]"
            style={{
              borderColor: `${palette.cardBorder}60`,
              color: palette.textMuted,
              ...getElementTransitionStyle(5, 0),
            }}
          >
            <span className="font-medium break-words">
              {sanitizeTextToEasyEnglish(
                slide.takeaway || 'Sigma AI Presentation Studio',
                { isHeading: true }
              )}
            </span>
            <span className="font-bold tabular-nums flex-shrink-0">
              {slide.id} / {totalSlides}
            </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
