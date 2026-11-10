import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  Palette,
  LayoutTemplate,
  Check,
  Sparkles,
  Layers,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  PowerPointPresentation,
  PresentationPalette,
  PresentationStyleId,
  SlideAnimationStyle,
  SlideTransitionType,
  SlideData,
} from '../../types/presentation';
import {
  PALETTE_LIST,
  STYLE_LIST,
  ANIMATION_OPTION_LIST,
  TRANSITION_OPTION_LIST,
  getStyleConfig,
} from '../../lib/presentationGenerator';
import { SlideCanvasRenderer } from './SlideCanvasRenderer';
import { PresentationPlayModal } from './PresentationPlayModal';
import { PowerPointSlideIcon } from './PowerPointIcon';

interface PresentationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: PowerPointPresentation;
  initialSlideIndex?: number;
  onDownloadPptx: (presentation: PowerPointPresentation) => Promise<void>;
  isDownloading?: boolean;
  onUpdatePresentation?: (updated: PowerPointPresentation) => void;
  onPresentationChange?: (updated: PowerPointPresentation) => void;
}

const previewReadyCache = new Set<string>();

type ActiveControlDrawer = 'animation' | 'transition' | 'theme' | 'style' | null;

export const PresentationPreviewModal: React.FC<
  PresentationPreviewModalProps
> = ({
  isOpen,
  onClose,
  presentation,
  initialSlideIndex = 0,
  onDownloadPptx,
  isDownloading = false,
  onUpdatePresentation,
  onPresentationChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [isPreparing, setIsPreparing] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<ActiveControlDrawer>(null);

  // Working draft state for Animation -> Transition -> Theme -> Style
  const [activePalette, setActivePalette] = useState<PresentationPalette>(
    presentation.palette
  );
  const [activeStyleId, setActiveStyleId] = useState<PresentationStyleId>(
    presentation.styleId || getStyleConfig(undefined, presentation.palette).id
  );
  const [activeAnimationId, setActiveAnimationId] = useState<SlideAnimationStyle>(
    presentation.animationId || 'fade'
  );
  const [activeTransitionId, setActiveTransitionId] = useState<SlideTransitionType>(
    presentation.transitionId || 'fade'
  );
  const [applyAnimToAll, setApplyAnimToAll] = useState<boolean>(
    presentation.applyAnimationToAllSlides !== undefined
      ? presentation.applyAnimationToAllSlides
      : true
  );
  const [applyTransToAll, setApplyTransToAll] = useState<boolean>(
    presentation.applyTransitionToAllSlides !== undefined
      ? presentation.applyTransitionToAllSlides
      : true
  );
  const [workingSlides, setWorkingSlides] = useState<SlideData[]>(
    presentation.slides
  );

  // Live animation preview trigger key when user picks an Animation or Transition
  const [previewAnimKey, setPreviewAnimKey] = useState<number>(0);
  const [shouldAnimateStage, setShouldAnimateStage] = useState<boolean>(true);

  // Saved state tracking & unsaved changes prompt on Download
  const [savedPresentation, setSavedPresentation] =
    useState<PowerPointPresentation>(presentation);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [justSavedFeedback, setJustSavedFeedback] = useState<boolean>(false);
  const [showUnsavedDownloadPrompt, setShowUnsavedDownloadPrompt] =
    useState<boolean>(false);

  const modalContainerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const desktopThumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileThumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const totalSlides = workingSlides.length;

  // Sync when presentation prop changes
  useEffect(() => {
    let savedSettings: any = null;
    try {
      const stored = localStorage.getItem(`sigma_ppt_saved_${presentation.id}`);
      if (stored) savedSettings = JSON.parse(stored);
    } catch {}

    const effectivePalette = presentation.palette;
    const effectiveStyleId =
      presentation.styleId ||
      savedSettings?.styleId ||
      getStyleConfig(undefined, presentation.palette).id;
    const effectiveAnimId: SlideAnimationStyle =
      presentation.animationId || savedSettings?.animationId || 'fade';
    const effectiveTransId: SlideTransitionType =
      presentation.transitionId || savedSettings?.transitionId || 'fade';
    const animAll =
      presentation.applyAnimationToAllSlides !== undefined
        ? presentation.applyAnimationToAllSlides
        : savedSettings?.applyAnimationToAllSlides !== undefined
        ? savedSettings.applyAnimationToAllSlides
        : true;
    const transAll =
      presentation.applyTransitionToAllSlides !== undefined
        ? presentation.applyTransitionToAllSlides
        : savedSettings?.applyTransitionToAllSlides !== undefined
        ? savedSettings.applyTransitionToAllSlides
        : true;

    setActivePalette(effectivePalette);
    setActiveStyleId(effectiveStyleId);
    setActiveAnimationId(effectiveAnimId);
    setActiveTransitionId(effectiveTransId);
    setApplyAnimToAll(animAll);
    setApplyTransToAll(transAll);
    setWorkingSlides(
      presentation.slides.map((s) => ({
        ...s,
        animationStyle: s.animationStyle || effectiveAnimId,
        transition: s.transition || effectiveTransId,
      }))
    );
    setSavedPresentation({
      ...presentation,
      styleId: effectiveStyleId,
      animationId: effectiveAnimId,
      transitionId: effectiveTransId,
      applyAnimationToAllSlides: animAll,
      applyTransitionToAllSlides: transAll,
    });
    setHasUnsavedChanges(false);
  }, [presentation]);

  const buildCurrentPresentationObject = useCallback(
    (
      overrides?: Partial<{
        palette: PresentationPalette;
        styleId: PresentationStyleId;
        animationId: SlideAnimationStyle;
        transitionId: SlideTransitionType;
        applyAnimAll: boolean;
        applyTransAll: boolean;
        slides: SlideData[];
      }>
    ): PowerPointPresentation => {
      const pal = overrides?.palette || activePalette;
      const stId = overrides?.styleId || activeStyleId;
      const animId = overrides?.animationId || activeAnimationId;
      const transId = overrides?.transitionId || activeTransitionId;
      const animAll =
        overrides?.applyAnimAll !== undefined
          ? overrides.applyAnimAll
          : applyAnimToAll;
      const transAll =
        overrides?.applyTransAll !== undefined
          ? overrides.applyTransAll
          : applyTransToAll;
      const slidesList = overrides?.slides || workingSlides;

      return {
        ...presentation,
        palette: pal,
        paletteId: pal.id,
        styleId: stId,
        animationId: animId,
        transitionId: transId,
        applyAnimationToAllSlides: animAll,
        applyTransitionToAllSlides: transAll,
        slides: slidesList,
        savedSettings: {
          themeId: pal.id,
          styleId: stId,
          animationId: animId,
          transitionId: transId,
          applyAnimationToAllSlides: animAll,
          applyTransitionToAllSlides: transAll,
          updatedAt: new Date().toISOString(),
        },
      };
    },
    [
      presentation,
      activePalette,
      activeStyleId,
      activeAnimationId,
      activeTransitionId,
      applyAnimToAll,
      applyTransToAll,
      workingSlides,
    ]
  );

  // 1. Animation selection handler
  const handleSelectAnimation = (animId: SlideAnimationStyle) => {
    setActiveAnimationId(animId);
    const updatedSlides = workingSlides.map((s, idx) => {
      if (applyAnimToAll || idx === currentIndex) {
        return { ...s, animationStyle: animId };
      }
      return s;
    });
    setWorkingSlides(updatedSlides);
    setHasUnsavedChanges(true);
    setShouldAnimateStage(true);
    setPreviewAnimKey((k) => k + 1);
  };

  const handleToggleApplyAnimToAll = (applyAll: boolean) => {
    setApplyAnimToAll(applyAll);
    if (applyAll) {
      const updatedSlides = workingSlides.map((s) => ({
        ...s,
        animationStyle: activeAnimationId,
      }));
      setWorkingSlides(updatedSlides);
    }
    setHasUnsavedChanges(true);
  };

  // 2. Transition selection handler
  const handleSelectTransition = (transId: SlideTransitionType) => {
    setActiveTransitionId(transId);
    const updatedSlides = workingSlides.map((s, idx) => {
      if (applyTransToAll || idx === currentIndex) {
        return { ...s, transition: transId };
      }
      return s;
    });
    setWorkingSlides(updatedSlides);
    setHasUnsavedChanges(true);
    setShouldAnimateStage(true);
    setPreviewAnimKey((k) => k + 1);
  };

  const handleToggleApplyTransToAll = (applyAll: boolean) => {
    setApplyTransToAll(applyAll);
    if (applyAll) {
      const updatedSlides = workingSlides.map((s) => ({
        ...s,
        transition: activeTransitionId,
      }));
      setWorkingSlides(updatedSlides);
    }
    setHasUnsavedChanges(true);
  };

  // 3. Theme selection handler
  const handleSelectTheme = (pal: PresentationPalette) => {
    setActivePalette(pal);
    setActiveDrawer(null);
    setHasUnsavedChanges(true);
  };

  // 4. Style selection handler
  const handleSelectStyle = (styleId: PresentationStyleId) => {
    setActiveStyleId(styleId);
    setActiveDrawer(null);
    setHasUnsavedChanges(true);
  };

  // 5. Save button handler (saves Theme, Style, Animation, Transition, and slide changes)
  const handleSavePresentation = useCallback(() => {
    const updated = {
      ...buildCurrentPresentationObject(),
      lastSavedAt: new Date().toISOString(),
    };
    setSavedPresentation(updated);
    setHasUnsavedChanges(false);
    setJustSavedFeedback(true);
    setTimeout(() => setJustSavedFeedback(false), 2200);

    try {
      localStorage.setItem(
        `sigma_ppt_saved_${updated.id}`,
        JSON.stringify(updated.savedSettings)
      );
    } catch {
      // ignore storage quota errors
    }

    if (onUpdatePresentation) {
      onUpdatePresentation(updated);
    }
    if (onPresentationChange) {
      onPresentationChange(updated);
    }
    return updated;
  }, [buildCurrentPresentationObject, onUpdatePresentation, onPresentationChange]);

  // 6. Download PPTX with Unsaved Changes Check (Requirement 13)
  const handleDownloadRequest = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDownloadPrompt(true);
      return;
    }
    onDownloadPptx(savedPresentation);
  };

  const handleSaveAndDownload = async () => {
    setShowUnsavedDownloadPrompt(false);
    const newlySaved = handleSavePresentation();
    await onDownloadPptx(newlySaved);
  };

  const handleDownloadWithoutSaving = async () => {
    setShowUnsavedDownloadPrompt(false);
    await onDownloadPptx(savedPresentation);
  };

  // Prevent underlying page scroll while preview modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsPlayModalOpen(false);
      setActiveDrawer(null);
      setShowUnsavedDownloadPrompt(false);
      return;
    }
    setCurrentIndex(
      Math.max(0, Math.min(initialSlideIndex, workingSlides.length - 1))
    );
    setZoomLevel(1);
    setPreviewError(false);

    const isCached = previewReadyCache.has(presentation.id);
    setIsPreparing(true);
    const delay = isCached ? 180 : 360;
    const timer = setTimeout(() => {
      previewReadyCache.add(presentation.id);
      setIsPreparing(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [isOpen, presentation.id, initialSlideIndex, workingSlides.length]);

  const goPrev = useCallback(() => {
    setShouldAnimateStage(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goNext = useCallback(() => {
    setShouldAnimateStage(true);
    setCurrentIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, [totalSlides]);

  const openPlayMode = useCallback(() => {
    setActiveDrawer(null);
    setIsPlayModalOpen(true);
  }, []);

  // Keyboard navigation in Preview (when Play Modal is not open)
  useEffect(() => {
    if (!isOpen || isPlayModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showUnsavedDownloadPrompt) {
          setShowUnsavedDownloadPrompt(false);
        } else if (activeDrawer) {
          setActiveDrawer(null);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    isPlayModalOpen,
    activeDrawer,
    showUnsavedDownloadPrompt,
    onClose,
    goPrev,
    goNext,
  ]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (!isOpen || isPreparing) return;
    desktopThumbRefs.current[currentIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
    mobileThumbRefs.current[currentIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [currentIndex, isOpen, isPreparing]);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && modalContainerRef.current) {
        await modalContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Touch / Swipe Navigation (Swipe Left = Next, Swipe Right = Previous)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const endY = e.changedTouches[0]?.clientY ?? (touchStartYRef.current || 0);
    const diffX = touchStartXRef.current - endX;
    const diffY = (touchStartYRef.current || 0) - endY;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  if (!isOpen) return null;

  const currentSlide = workingSlides[currentIndex] || workingSlides[0];
  const effectiveSlideAnim: SlideAnimationStyle = applyAnimToAll
    ? activeAnimationId
    : currentSlide?.animationStyle || activeAnimationId;
  const effectiveSlideTrans: SlideTransitionType = applyTransToAll
    ? activeTransitionId
    : currentSlide?.transition || activeTransitionId;

  const currentLivePresentation = buildCurrentPresentationObject();

  return (
    <div
      ref={modalContainerRef}
      className="fixed inset-0 z-50 bg-[#070a12]/95 backdrop-blur-md flex flex-col w-full h-full max-w-full overflow-hidden select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Presentation Preview: ${presentation.title}`}
    >
      {/* =====================================================================
          1. PORTRAIT MOBILE VIEWER (< 768px)
          Vertical portrait-friendly layout with proportional 16:9 slide stage
         ===================================================================== */}
      <div className="flex md:hidden flex-col w-full h-full max-w-full overflow-hidden">
        {/* Compact Portrait Mobile Top Bar */}
        <div className="flex flex-col bg-[#0d121d] border-b border-slate-800/90 flex-shrink-0 w-full">
          <div className="flex items-center justify-between gap-1.5 px-2.5 py-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white truncate">
                  {presentation.title}
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
                  Slide {currentIndex + 1} of {totalSlides}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Save Button */}
              <button
                type="button"
                onClick={handleSavePresentation}
                title="Save presentation settings"
                className={`px-2.5 h-8 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer active:scale-95 ${
                  justSavedFeedback
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : hasUnsavedChanges
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/50'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80'
                }`}
              >
                {justSavedFeedback ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{justSavedFeedback ? 'Saved' : 'Save'}</span>
              </button>

              {/* Download PPTX */}
              <button
                type="button"
                onClick={handleDownloadRequest}
                disabled={isDownloading}
                aria-label="Download PowerPoint"
                title="Download PPTX"
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center cursor-pointer disabled:opacity-60 active:scale-95"
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Control Sequence: Animation -> Transition -> Theme -> Style */}
          <div className="flex items-center gap-1.5 px-2.5 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) =>
                  prev === 'animation' ? null : 'animation'
                )
              }
              className={`px-2.5 h-8 rounded-lg border text-[11px] font-semibold flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                activeDrawer === 'animation'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800/80 text-emerald-300 border-slate-700/80'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Animation</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) =>
                  prev === 'transition' ? null : 'transition'
                )
              }
              className={`px-2.5 h-8 rounded-lg border text-[11px] font-semibold flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                activeDrawer === 'transition'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800/80 text-amber-300 border-slate-700/80'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Transition</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) => (prev === 'theme' ? null : 'theme'))
              }
              className={`px-2.5 h-8 rounded-lg border text-[11px] font-semibold flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                activeDrawer === 'theme'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-800/80 text-cyan-400 border-slate-700/80'
              }`}
            >
              <Palette className="w-3 h-3" />
              <span>Theme</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) => (prev === 'style' ? null : 'style'))
              }
              className={`px-2.5 h-8 rounded-lg border text-[11px] font-semibold flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                activeDrawer === 'style'
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/50'
                  : 'bg-slate-800/80 text-violet-300 border-slate-700/80'
              }`}
            >
              <LayoutTemplate className="w-3 h-3" />
              <span>Style</span>
            </button>
          </div>
        </div>

        {/* Portrait Mobile Body */}
        {isPreparing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-3 shadow-lg">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h4 className="text-sm font-bold text-white">
              Preparing presentation preview...
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Scaling {totalSlides} slides for portrait view
            </p>
          </div>
        ) : previewError || !currentSlide ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
            <h4 className="text-sm font-bold text-white">
              Preview could not be generated.
            </h4>
            <button
              type="button"
              onClick={() => {
                setPreviewError(false);
                setIsPreparing(true);
                setTimeout(() => setIsPreparing(false), 350);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Preview</span>
            </button>
          </div>
        ) : (
          <div
            className="flex-1 flex flex-col justify-between min-h-0 w-full overflow-y-auto px-3 py-4 touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Spacer / Slide Title Pill */}
            <div className="text-center px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block truncate">
                {currentSlide.kicker || `SLIDE ${currentIndex + 1}`}
              </span>
              <h4 className="text-sm font-bold text-white truncate mt-0.5">
                {currentSlide.title}
              </h4>
            </div>

            {/* Center Proportional 16:9 Slide Container inside Portrait Viewport */}
            <div className="my-auto py-3 w-full flex flex-col items-center justify-center">
              <div className="w-full aspect-video rounded-xl overflow-hidden shadow-[0_16px_45px_rgba(0,0,0,0.8)] border border-slate-700/80 bg-slate-950">
                <SlideCanvasRenderer
                  key={`slide-canvas-mobile-${currentSlide.id}-${effectiveSlideTrans}-${effectiveSlideAnim}-${previewAnimKey}`}
                  slide={currentSlide}
                  palette={activePalette}
                  styleId={activeStyleId}
                  animationStyle={effectiveSlideAnim}
                  transitionType={effectiveSlideTrans}
                  totalSlides={totalSlides}
                  compact={false}
                  animateEntry={shouldAnimateStage}
                  animationKey={`${currentSlide.id}-${effectiveSlideTrans}-${effectiveSlideAnim}-${previewAnimKey}`}
                />
              </div>

              {/* Slide Number Counter: 3 / 10 */}
              <div className="mt-4 flex flex-col items-center gap-1">
                <div className="px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-bold tabular-nums text-slate-200">
                  {currentIndex + 1} / {totalSlides}
                </div>
                <span className="text-[10px] text-slate-500">
                  Swipe left or right to switch slides
                </span>
              </div>
            </div>

            {/* Portrait Transport Controls: ‹   ▶ Play   › */}
            <div className="flex items-center justify-center gap-4 py-2 w-full">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                aria-label="Previous slide"
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center disabled:opacity-35 transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={openPlayMode}
                aria-label="Play presentation slideshow"
                className="min-h-[48px] px-6 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play</span>
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={currentIndex >= totalSlides - 1}
                aria-label="Next slide"
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center disabled:opacity-35 transition-all cursor-pointer active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Compact Mobile Horizontal Slide Strip */}
        {!isPreparing && !previewError && (
          <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 bg-[#0b0f19] border-t border-slate-800/80 flex-shrink-0 w-full">
            {workingSlides.map((s, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    mobileThumbRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => {
                    setShouldAnimateStage(true);
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`flex-shrink-0 w-24 rounded-lg p-1 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-violet-500/20 border-violet-500'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="text-[9px] font-bold text-left px-0.5 mb-0.5 truncate text-slate-300">
                    {idx + 1}. {s.title}
                  </div>
                  <div className="rounded overflow-hidden pointer-events-none">
                    <SlideCanvasRenderer
                      slide={s}
                      palette={activePalette}
                      styleId={activeStyleId}
                      totalSlides={totalSlides}
                      compact={true}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          2. DESKTOP / TABLET VIEWER (>= 768px)
          Full desktop presentation viewer (unchanged desktop experience)
         ===================================================================== */}
      <div className="hidden md:flex flex-col w-full h-full overflow-hidden">
        {/* Top Viewer Control Bar */}
        <div className="flex items-center justify-between gap-2 px-6 py-3 bg-[#0d121d]/95 border-b border-slate-800/90 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 flex-shrink-0">
              <PowerPointSlideIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate">
                {presentation.title}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {totalSlides} slides · 16:9 Widescreen
              </p>
            </div>
          </div>

          {/* Viewer Tools: Play, Animation -> Transition -> Theme -> Style, Save, Zoom, Fullscreen, Download, Close */}
          <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
            {/* Play Slideshow Button (Opens Dedicated Play Mode) */}
            <button
              type="button"
              onClick={openPlayMode}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-md transition-all cursor-pointer"
              title="Open Dedicated Presentation Play Mode"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </button>

            {/* 1. Animation Selector Button */}
            <button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) =>
                  prev === 'animation' ? null : 'animation'
                )
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                activeDrawer === 'animation'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/70'
              }`}
              title="Open Animation Selector (15 Options)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Animation</span>
            </button>

            {/* 2. Transition Selector Button */}
            <button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) =>
                  prev === 'transition' ? null : 'transition'
                )
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                activeDrawer === 'transition'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/70'
              }`}
              title="Open Slide Transition Selector (15 Options)"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Transition</span>
            </button>

            {/* 3. Theme Selector Button */}
            <button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) => (prev === 'theme' ? null : 'theme'))
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                activeDrawer === 'theme'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/70'
              }`}
              title="Open Theme Selector"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Theme</span>
            </button>

            {/* 4. Style Selector Button */}
            <button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) => (prev === 'style' ? null : 'style'))
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                activeDrawer === 'style'
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/70'
              }`}
              title="Open Style & Composition Selector"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-violet-400" />
              <span>Style</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSavePresentation}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                justSavedFeedback
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : hasUnsavedChanges
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/70'
              }`}
              title="Save current Theme, Style, Animation, and Transition settings"
            >
              {justSavedFeedback ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Save className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{justSavedFeedback ? 'Saved' : 'Save'}</span>
              {hasUnsavedChanges && !justSavedFeedback && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() =>
                  setZoomLevel((z) => Math.max(0.75, +(z - 0.15).toFixed(2)))
                }
                disabled={zoomLevel <= 0.75}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2 text-[11px] font-mono tabular-nums text-slate-300 hover:text-white cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoomLevel((z) => Math.min(1.45, +(z + 0.15).toFixed(2)))
                }
                disabled={zoomLevel >= 1.45}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/70 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Download PPTX */}
            <button
              type="button"
              onClick={handleDownloadRequest}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-60"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download PPTX</span>
            </button>

            {/* X Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
              title="Close Preview (Esc)"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Desktop Viewer Body */}
        {isPreparing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4 shadow-lg">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h4 className="text-lg font-bold text-white">
              Preparing presentation preview...
            </h4>
            <p className="text-sm text-slate-400 mt-1">
              Rendering {totalSlides} widescreen slides with coordinated layouts
            </p>
          </div>
        ) : previewError || !currentSlide ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
            <h4 className="text-base font-bold text-white">
              Preview could not be generated.
            </h4>
            <button
              type="button"
              onClick={() => {
                setPreviewError(false);
                setIsPreparing(true);
                setTimeout(() => setIsPreparing(false), 350);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Preview</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
            {/* Desktop Left Vertical Thumbnail Rail */}
            <div className="flex flex-col w-64 xl:w-72 bg-[#0b0f19]/90 border-r border-slate-800/80 overflow-y-auto p-3 space-y-2.5 flex-shrink-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 pb-1">
                Slides ({totalSlides})
              </div>
              {workingSlides.map((s, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <button
                    key={s.id}
                    ref={(el) => {
                      desktopThumbRefs.current[idx] = el;
                    }}
                    type="button"
                    onClick={() => {
                      setShouldAnimateStage(true);
                      setCurrentIndex(idx);
                    }}
                    className={`w-full text-left rounded-xl p-2 transition-all cursor-pointer border group ${
                      isSelected
                        ? 'bg-violet-500/15 border-violet-500 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span
                        className={`font-bold tabular-nums ${
                          isSelected ? 'text-violet-300' : 'text-slate-400'
                        }`}
                      >
                        Slide {idx + 1}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
                        {s.title}
                      </span>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-slate-800 pointer-events-none">
                      <SlideCanvasRenderer
                        slide={s}
                        palette={activePalette}
                        styleId={activeStyleId}
                        totalSlides={totalSlides}
                        compact={true}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right / Center Main 16:9 Slide Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 overflow-auto min-h-0">
              {/* Live Transition & Animation Feedback Header */}
              <div className="mb-2.5 flex items-center justify-between gap-3 w-full max-w-5xl px-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium text-slate-400">
                    Slide {currentIndex + 1} of {totalSlides}
                  </span>
                  <span className="text-slate-700">•</span>
                  <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25">
                    <Layers className="w-3 h-3 text-amber-400" />
                    Transition: <span className="capitalize font-bold text-white">{effectiveSlideTrans}</span>
                  </span>
                  <span className="text-slate-700">•</span>
                  <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Animation: <span className="capitalize font-bold text-white">{effectiveSlideAnim}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShouldAnimateStage(true);
                      setPreviewAnimKey((k) => k + 1);
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                    title="Replay slide transition and content animations"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Replay Effect</span>
                  </button>
                </div>
              </div>

              <div
                className="w-full max-w-5xl transition-transform duration-200 ease-out flex items-center justify-center"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
              >
                <div className="w-full rounded-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.75)] border border-slate-700/70">
                  <SlideCanvasRenderer
                    key={`slide-canvas-desktop-${currentSlide.id}-${effectiveSlideTrans}-${effectiveSlideAnim}-${previewAnimKey}`}
                    slide={currentSlide}
                    palette={activePalette}
                    styleId={activeStyleId}
                    animationStyle={effectiveSlideAnim}
                    transitionType={effectiveSlideTrans}
                    totalSlides={totalSlides}
                    compact={false}
                    animateEntry={shouldAnimateStage}
                    animationKey={`${currentSlide.id}-${effectiveSlideTrans}-${effectiveSlideAnim}-${previewAnimKey}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Slide Navigation Controls: ‹  3 / 10  › */}
        <div className="flex items-center justify-center gap-4 px-4 py-3 bg-[#0d121d]/95 border-t border-slate-800/90 flex-shrink-0">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0 || isPreparing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            title="Previous Slide (←)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold tabular-nums text-white">
            {currentIndex + 1} / {totalSlides}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex >= totalSlides - 1 || isPreparing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            title="Next Slide (→)"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          3. ANIMATION SELECTOR OVERLAY PANEL (15 Options + All/Current Slide)
         ===================================================================== */}
      {activeDrawer === 'animation' && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 md:bg-transparent pointer-events-auto flex items-start justify-center md:justify-end p-3 md:p-6 pt-14 md:pt-16"
          onClick={() => setActiveDrawer(null)}
        >
          <div
            className="w-full max-w-md max-h-[82vh] overflow-y-auto rounded-2xl bg-[#0e1422] border border-slate-700/90 shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>
                    Slide Content Animation ({ANIMATION_OPTION_LIST.length}{' '}
                    Options)
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any option to preview it live on the slide
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShouldAnimateStage(true);
                    setPreviewAnimKey((k) => k + 1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-300 font-bold flex items-center gap-1 border border-slate-700 cursor-pointer active:scale-95"
                  title="Replay animation on slide"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                  <span>Replay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Apply Scope Toggle: All Slides vs Current Slide */}
            <div className="flex items-center justify-between gap-2 p-2 mb-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-300 pl-1">
                Apply animation to:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleApplyAnimToAll(true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    applyAnimToAll
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Slides
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleApplyAnimToAll(false)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    !applyAnimToAll
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Slide {currentIndex + 1} Only
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ANIMATION_OPTION_LIST.map((anim) => {
                const isSelected = effectiveSlideAnim === anim.id;
                return (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() => handleSelectAnimation(anim.id)}
                    className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400 shadow-md ring-1 ring-emerald-400/50'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {anim.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {anim.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. TRANSITION SELECTOR OVERLAY PANEL (15 Options + All/Current Slide)
         ===================================================================== */}
      {activeDrawer === 'transition' && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 md:bg-transparent pointer-events-auto flex items-start justify-center md:justify-end p-3 md:p-6 pt-14 md:pt-16"
          onClick={() => setActiveDrawer(null)}
        >
          <div
            className="w-full max-w-md max-h-[82vh] overflow-y-auto rounded-2xl bg-[#0e1422] border border-slate-700/90 shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>
                    Slide Transition ({TRANSITION_OPTION_LIST.length} Options)
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any transition to preview how the slide moves
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShouldAnimateStage(true);
                    setPreviewAnimKey((k) => k + 1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 font-bold flex items-center gap-1 border border-slate-700 cursor-pointer active:scale-95"
                  title="Replay transition on slide"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Replay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Apply Scope Toggle: All Slides vs Current Slide */}
            <div className="flex items-center justify-between gap-2 p-2 mb-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-300 pl-1">
                Apply transition to:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleApplyTransToAll(true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    applyTransToAll
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Slides
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleApplyTransToAll(false)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    !applyTransToAll
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Slide {currentIndex + 1} Only
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TRANSITION_OPTION_LIST.map((tr) => {
                const isSelected = effectiveSlideTrans === tr.id;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => handleSelectTransition(tr.id)}
                    className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {tr.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {tr.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. THEME SELECTOR OVERLAY PANEL (Requirements 16 & 17)
         ===================================================================== */}
      {activeDrawer === 'theme' && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-xs flex items-start justify-center md:justify-end p-3 md:p-6 pt-14 md:pt-16"
          onClick={() => setActiveDrawer(null)}
        >
          <div
            className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl bg-[#0e1422] border border-slate-700/90 shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Theme Selector ({PALETTE_LIST.length} Themes)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Changes colors, fonts, card design, borders, patterns & charts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PALETTE_LIST.map((pal) => {
                const isSelected = pal.id === activePalette.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => handleSelectTheme(pal)}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {pal.shortName || pal.name.split('(')[0].trim()}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {pal.cardRadius || 'rounded'} · {pal.bgPattern || 'clean'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span
                        className="w-4 h-4 rounded-full border border-white/25"
                        style={{ backgroundColor: pal.bgPrimary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/25"
                        style={{ backgroundColor: pal.accentPrimary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/25"
                        style={{ backgroundColor: pal.accentSecondary }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. STYLE SELECTOR OVERLAY PANEL (Requirements 18 & 19)
         ===================================================================== */}
      {activeDrawer === 'style' && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-xs flex items-start justify-center md:justify-end p-3 md:p-6 pt-14 md:pt-16"
          onClick={() => setActiveDrawer(null)}
        >
          <div
            className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl bg-[#0e1422] border border-slate-700/90 shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-violet-400" />
                  <span>Style & Composition Selector</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Controls typography, text alignment, title placement & spacing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {STYLE_LIST.map((st) => {
                const isSelected = st.id === activeStyleId;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectStyle(st.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-500/20 border-violet-400 shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {st.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-violet-300 font-medium mt-0.5">
                      {st.tagline}
                    </p>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      {st.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. UNSAVED CHANGES DOWNLOAD CHECK DIALOG (Requirement 13)
         ===================================================================== */}
      {showUnsavedDownloadPrompt && (
        <div
          className="fixed inset-0 z-[58] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowUnsavedDownloadPrompt(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#0e1422] border border-slate-700/90 shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Save className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Unsaved Presentation Changes
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    You have unsaved Theme, Style, Animation, or Transition
                    changes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUnsavedDownloadPrompt(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Would you like to save your latest changes before downloading the
              PowerPoint (.pptx) file, or download the last saved version?
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDownloadWithoutSaving}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                Download Last Saved
              </button>
              <button
                type="button"
                onClick={handleSaveAndDownload}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Download PPTX</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          8. DEDICATED PLAY MODE SLIDESHOW (Requirements 22–27)
         ===================================================================== */}
      <PresentationPlayModal
        isOpen={isPlayModalOpen}
        onClose={() => setIsPlayModalOpen(false)}
        presentation={currentLivePresentation}
        palette={activePalette}
        styleId={activeStyleId}
        animationStyle={effectiveSlideAnim}
        transitionType={effectiveSlideTrans}
        initialSlideIndex={currentIndex}
      />
    </div>
  );
};
