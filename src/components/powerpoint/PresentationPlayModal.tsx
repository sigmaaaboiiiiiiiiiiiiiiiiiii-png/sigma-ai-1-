import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  PowerPointPresentation,
  PresentationPalette,
  PresentationStyleId,
  SlideAnimationStyle,
  SlideTransitionType,
} from '../../types/presentation';
import { SlideCanvasRenderer } from './SlideCanvasRenderer';
import {
  getSavedTtsVoice,
  resolveSpeechVoice,
  TTS_VOICE_OPTIONS,
} from '../../lib/ttsVoiceEngine';

interface PresentationPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: PowerPointPresentation;
  palette?: PresentationPalette;
  styleId?: PresentationStyleId;
  animationStyle?: SlideAnimationStyle;
  transitionType?: SlideTransitionType;
  initialSlideIndex?: number;
}

export const PresentationPlayModal: React.FC<PresentationPlayModalProps> = ({
  isOpen,
  onClose,
  presentation,
  palette,
  styleId,
  animationStyle,
  transitionType,
  initialSlideIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [animReplayKey, setAnimReplayKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeakingSlide, setIsSpeakingSlide] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const didSwipeRef = useRef<boolean>(false);

  const totalSlides = presentation.slides.length;
  const activePalette = palette || presentation.palette;
  const activeStyleId = styleId || presentation.styleId;

  useEffect(() => {
    if (!isOpen) return;
    setCurrentIndex(
      Math.max(0, Math.min(initialSlideIndex, presentation.slides.length - 1))
    );
    setAnimReplayKey((k) => k + 1);
  }, [isOpen, initialSlideIndex, presentation.slides.length]);

  // Lock background scroll while Play Mode is open
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeakingSlide(false);
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingSlide(false);
  }, [currentIndex]);

  const handleNarrateCurrentSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeakingSlide) {
      window.speechSynthesis.cancel();
      setIsSpeakingSlide(false);
      return;
    }

    const slide = presentation.slides[currentIndex] || presentation.slides[0];
    if (!slide) return;

    const parts: string[] = [slide.title];
    if (slide.subtitle) parts.push(slide.subtitle);
    if (slide.keyQuestion) parts.push(slide.keyQuestion);
    if (slide.bullets?.length) parts.push(...slide.bullets);
    if (slide.cards?.length) {
      slide.cards.forEach((c) => parts.push(`${c.title}: ${c.body}`));
    }
    if (slide.steps?.length) {
      slide.steps.forEach((s, i) => parts.push(`Step ${i + 1}, ${s.title}: ${s.detail}`));
    }
    if (slide.takeaway) parts.push(`Key takeaway: ${slide.takeaway}`);

    const cleanSlideText = parts.join('. ').replace(/\s+/g, ' ').trim();
    if (!cleanSlideText) return;

    const voicePref = getSavedTtsVoice();
    const resolved = resolveSpeechVoice(voicePref);
    if (!resolved.available) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanSlideText);
    utterance.rate = resolved.rate;
    utterance.pitch = resolved.pitch;
    if (resolved.voice) {
      utterance.voice = resolved.voice;
    }
    utterance.onend = () => setIsSpeakingSlide(false);
    utterance.onerror = () => setIsSpeakingSlide(false);
    setIsSpeakingSlide(true);
    window.speechSynthesis.speak(utterance);
  };

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, [totalSlides]);

  // Keyboard Controls (Requirement 23 & 24: NO Autoplay; Spacebar, Enter, ArrowRight -> Next; ArrowLeft -> Prev; Escape -> Exit)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (
        e.key === 'ArrowRight' ||
        e.key === ' ' ||
        e.key === 'Spacebar' ||
        e.key === 'Enter'
      ) {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goNext, goPrev]);

  const handleToggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
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

  // Mobile Touch / Swipe Gestures (Requirement 27)
  const handleTouchStart = (e: React.TouchEvent) => {
    didSwipeRef.current = false;
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const endY = e.changedTouches[0]?.clientY ?? (touchStartYRef.current || 0);
    const diffX = touchStartXRef.current - endX;
    const diffY = (touchStartYRef.current || 0) - endY;

    if (Math.abs(diffX) > 36 && Math.abs(diffX) > Math.abs(diffY)) {
      didSwipeRef.current = true;
      if (diffX > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Left-click on slide stage advances to next slide (Requirement 23)
  const handleStageClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    goNext();
  };

  if (!isOpen) return null;

  const currentSlide =
    presentation.slides[currentIndex] || presentation.slides[0];
  const progressPct = ((currentIndex + 1) / Math.max(1, totalSlides)) * 100;

  const effectiveAnim: SlideAnimationStyle =
    animationStyle ||
    (presentation.applyAnimationToAllSlides
      ? presentation.animationId
      : currentSlide?.animationStyle || presentation.animationId);

  const effectiveTrans: SlideTransitionType =
    transitionType ||
    (presentation.applyTransitionToAllSlides
      ? presentation.transitionId
      : currentSlide?.transition || presentation.transitionId);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] bg-[#04060b] flex flex-col justify-between w-full h-full max-w-full overflow-hidden select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Play Presentation: ${presentation.title}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Progress Bar */}
      <div className="w-full h-1 bg-slate-900 flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Top Subtle Slideshow Header Bar */}
      <div
        className="flex items-center justify-between gap-2 px-3 md:px-6 py-2.5 bg-[#070b14]/90 border-b border-slate-800/70 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
            <Sparkles className="w-3 h-3" />
            <span>Play Mode</span>
          </span>
          <h3 className="text-xs md:text-sm font-bold text-white truncate">
            {presentation.title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleNarrateCurrentSlide}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${
              isSpeakingSlide
                ? 'bg-blue-600/30 border-blue-500/60 text-blue-200'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/70'
            }`}
            title={`Narrate Slide (${TTS_VOICE_OPTIONS.find((v) => v.id === getSavedTtsVoice())?.label || 'Narrator'})`}
          >
            {isSpeakingSlide ? (
              <VolumeX className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="hidden sm:inline">
              {isSpeakingSlide ? 'Stop Narrator' : 'Narrate Slide'}
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAnimReplayKey((k) => k + 1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/70 flex items-center gap-1.5 cursor-pointer"
            title="Replay Slide Animations"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Replay Animation</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/70 cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Exit Play Mode (Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Center Interactive Presentation Stage — Click to Advance (Requirement 23 & 27) */}
      <div
        onClick={handleStageClick}
        className="flex-1 flex flex-col items-center justify-center p-2.5 sm:p-6 md:p-10 min-h-0 w-full cursor-pointer"
        title="Click or press Space / Enter / Right Arrow for next slide"
      >
        <div
          key={`${currentSlide.id}-${effectiveTrans}-${animReplayKey}`}
          className="w-full max-w-6xl aspect-video rounded-xl md:rounded-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9)] border border-slate-700/80"
        >
          <SlideCanvasRenderer
            key={`play-slide-${currentSlide.id}-${effectiveTrans}-${effectiveAnim}-${animReplayKey}`}
            slide={currentSlide}
            palette={activePalette}
            styleId={activeStyleId}
            animationStyle={effectiveAnim}
            transitionType={effectiveTrans}
            totalSlides={totalSlides}
            compact={false}
            animateEntry={true}
            animationKey={`${currentSlide.id}-${effectiveTrans}-${effectiveAnim}-${animReplayKey}`}
          />
        </div>

        {/* Mobile Portrait Helper Hint */}
        <div className="mt-3 md:hidden text-center">
          <p className="text-[11px] text-slate-400">
            Tap slide or swipe left for next slide • Swipe right for previous
          </p>
        </div>
      </div>

      {/* Bottom Presenter Control Bar */}
      <div
        className="flex items-center justify-between gap-3 px-4 md:px-8 py-3 bg-[#070b14]/95 border-t border-slate-800/80 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
            Space / Enter / →
          </span>
          <span>Next</span>
          <span className="mx-1">·</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
            ←
          </span>
          <span>Previous</span>
          <span className="mx-1">·</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
            Esc
          </span>
          <span>Exit</span>
        </div>

        <div className="flex items-center justify-center gap-3 mx-auto md:mx-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            disabled={currentIndex === 0}
            aria-label="Previous slide"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 disabled:opacity-35 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm font-bold tabular-nums text-white">
            Slide {currentIndex + 1} of {totalSlides}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            disabled={currentIndex >= totalSlides - 1}
            aria-label="Next slide"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md disabled:opacity-35 transition-all cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="hidden md:block text-xs text-slate-400">
          Click anywhere on the slide to advance
        </div>
      </div>
    </div>
  );
};
