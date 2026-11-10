import React, { useState } from 'react';
import {
  Eye,
  Play,
  Download,
  RefreshCw,
  SlidersHorizontal,
  Pencil,
  Check,
  Loader2,
  AlertCircle,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PowerPointPresentation } from '../../types/presentation';
import { downloadPresentationAsPptx } from '../../lib/pptxDownloader';
import { applyLocalPresentationModification } from '../../lib/presentationGenerator';
import { SlideCanvasRenderer } from './SlideCanvasRenderer';
import { PresentationPreviewModal } from './PresentationPreviewModal';
import { PresentationPlayModal } from './PresentationPlayModal';
import { PowerPointSlideIcon } from './PowerPointIcon';

interface PresentationResultCardProps {
  presentation: PowerPointPresentation;
  onRequestModification?: (
    instruction: string,
    updatedPresentation: PowerPointPresentation
  ) => void;
}

/**
 * Generates dynamically relevant modification options for this specific presentation
 */
function getRelevantPptQuickEdits(pres: PowerPointPresentation): string[] {
  const context = `${pres.title} ${pres.topic || ''} ${pres.audience || ''}`.toLowerCase();
  const isLessonOrPaper = /\b(lesson|exam|paper|quiz|classroom\s+test|worksheet|test\s+prep)\b/i.test(context);
  const isDinosaur = /\b(dinosaur|dinosaurs|fossil|fossils|t-rex|tyrannosaurus|jurassic|cretaceous|triassic|paleontology|prehistoric)\b/i.test(context);
  const isAi = /\b(ai|artificial\s+intelligence|machine\s+learning|deep\s+learning|neural|llm|robotics)\b/i.test(context);
  const isPetOrAnimal = /\b(cat|cats|pet|pets|kitten|feline|dog|animal|animals|wildlife)\b/i.test(context);
  const isBiz = /\b(business|pitch|startup|tech|saas|marketing|finance|sales|revenue|strategy|product)\b/i.test(context);

  if (isDinosaur) {
    return [
      'Add Prehistoric Eras & Timeline Slide',
      'Add Carnivores vs Herbivores Comparison Slide',
      'Add Fossil Discoveries & Paleontology Slide',
      'Add Asteroid Extinction Event Slide',
      'Add Key Takeaways Summary Slide',
      'Add 2 More Slides',
      'Change the theme',
    ];
  }

  if (isAi) {
    return [
      'Add Architecture & Training Slide',
      'Add Real-World Use Cases Slide',
      'Add Future Capabilities & Ethics Slide',
      'Add Benchmark Comparison Slide',
      'Add 2 More Slides',
      'Change the theme',
    ];
  }

  if (isPetOrAnimal) {
    return [
      'Add Daily Routine & Play Habits Slide',
      'Add Breeds & Characteristics Slide',
      'Add Nutrition & Daily Care Slide',
      'Add Fun Facts & Trivia Slide',
      'Add Key Takeaways Summary Slide',
      'Add 2 More Slides',
      'Change the theme',
    ];
  }

  if (isLessonOrPaper) {
    return [
      'Add Key Takeaways Summary Slide',
      'Add Quiz & Discussion Slide',
      'Add Fun Facts & Review Slide',
      'Add 2 More Visual Slides',
      'Make it suitable for Grade 8',
      'Change the theme',
    ];
  }

  if (isBiz) {
    return [
      'Add Key Takeaways Summary Slide',
      'Add Pros & Cons Comparison Slide',
      'Add Future Roadmap & Timeline Slide',
      'Add 2 More Slides',
      'Change the theme',
      'Use simple Easy English',
    ];
  }

  return [
    'Add Key Takeaways Summary Slide',
    'Add Detailed Breakdown Slide',
    'Add Pros & Cons Comparison Slide',
    'Add 2 More Slides',
    'Change the theme',
    'Use simple Easy English',
  ];
}

export const PresentationResultCard: React.FC<PresentationResultCardProps> = ({
  presentation: initialPresentation,
  onRequestModification,
}) => {
  const [currentPresentation, setCurrentPresentation] =
    useState<PowerPointPresentation>(() => {
      try {
        const saved = localStorage.getItem(`sigma_ppt_saved_${initialPresentation.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...initialPresentation,
            paletteId: parsed.themeId || initialPresentation.paletteId,
            styleId: parsed.styleId || initialPresentation.styleId,
            animationId: parsed.animationId || initialPresentation.animationId,
            transitionId: parsed.transitionId || initialPresentation.transitionId,
            applyAnimationToAllSlides:
              parsed.applyAnimationToAllSlides !== undefined
                ? parsed.applyAnimationToAllSlides
                : initialPresentation.applyAnimationToAllSlides,
            applyTransitionToAllSlides:
              parsed.applyTransitionToAllSlides !== undefined
                ? parsed.applyTransitionToAllSlides
                : initialPresentation.applyTransitionToAllSlides,
            slides: initialPresentation.slides.map((s) => ({
              ...s,
              animationStyle: parsed.animationId || s.animationStyle,
              transition: parsed.transitionId || s.transition,
            })),
          };
        }
      } catch {
        // ignore
      }
      return initialPresentation;
    });

  const [thumbSlideIdx, setThumbSlideIdx] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPlayOpen, setIsPlayOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [customEditInput, setCustomEditInput] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [apiSuggestions, setApiSuggestions] = useState<string[]>([]);

  // Fetch dynamic, API-generated smart suggestions tailored to this slide deck
  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/presentation-edit-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: currentPresentation.topic,
        title: currentPresentation.title,
        slideTitles: currentPresentation.slides.map((s) => s.title),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (
          !cancelled &&
          Array.isArray(data?.suggestions) &&
          data.suggestions.length >= 3
        ) {
          setApiSuggestions(data.suggestions);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [
    currentPresentation.id,
    currentPresentation.title,
    currentPresentation.topic,
  ]);

  const dynamicPresets = React.useMemo(() => {
    if (apiSuggestions.length >= 3) return apiSuggestions;
    return getRelevantPptQuickEdits(currentPresentation);
  }, [apiSuggestions, currentPresentation]);

  const totalSlides = currentPresentation.slides.length;
  const activeThumbSlide =
    currentPresentation.slides[thumbSlideIdx] || currentPresentation.slides[0];

  const handleDownload = async (presToDownload = currentPresentation) => {
    setIsDownloading(true);
    setDownloadError(false);
    setDownloadSuccess(false);
    try {
      await downloadPresentationAsPptx(presToDownload);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PPTX generation error:', err);
      setDownloadError(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleApplyEdit = (instruction: string) => {
    if (!instruction.trim()) return;
    setIsRegenerating(true);
    setTimeout(() => {
      const updated = applyLocalPresentationModification(
        currentPresentation,
        instruction
      );
      setCurrentPresentation(updated);
      // If a new slide was added, navigate directly to it
      if (updated.slides.length > currentPresentation.slides.length) {
        setThumbSlideIdx(updated.slides.length - 1);
      } else {
        setThumbSlideIdx(0);
      }
      setIsRegenerating(false);
      setCustomEditInput('');
      setActionToast(`✓ Applied: "${instruction}"`);
      setTimeout(() => setActionToast(null), 3500);
      if (onRequestModification) {
        onRequestModification(instruction, updated);
      }
    }, 350);
  };

  const handleRegenerate = () => {
    handleApplyEdit('Change the colors and refresh visual theme');
  };

  return (
    <>
      <div className="my-2.5 md:my-3 w-full max-w-full md:max-w-2xl rounded-2xl border border-slate-700/80 bg-gradient-to-b from-[#121826] to-[#0d121d] p-3 md:p-5 shadow-2xl select-none overflow-hidden box-border">
        {/* MOBILE COMPACT HEADER (< 768px) */}
        <div className="flex md:hidden items-center justify-between gap-2 mb-2.5 w-full min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border shadow-sm"
              style={{
                backgroundColor: `${currentPresentation.palette.accentPrimary}20`,
                borderColor: `${currentPresentation.palette.accentPrimary}50`,
                color: currentPresentation.palette.accentSecondary,
              }}
            >
              <PowerPointSlideIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white truncate min-w-0">
              {currentPresentation.title}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-300 tabular-nums flex-shrink-0">
            {totalSlides} slides
          </span>
        </div>

        {/* DESKTOP HEADER (>= 768px) - Unchanged Desktop Experience */}
        <div className="hidden md:flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-md"
              style={{
                backgroundColor: `${currentPresentation.palette.accentPrimary}20`,
                borderColor: `${currentPresentation.palette.accentPrimary}50`,
                color: currentPresentation.palette.accentSecondary,
              }}
            >
              <PowerPointSlideIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white truncate">
                {currentPresentation.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-300">
                  {totalSlides} slides
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">
                  {currentPresentation.palette.name.split('(')[0].trim()}
                </span>
              </div>
            </div>
          </div>

          {/* Color Palette Swatch Dots (Desktop only) */}
          <div
            className="flex items-center gap-1 pt-1 flex-shrink-0"
            title="Coordinated Color Palette"
          >
            <span
              className="w-3 h-3 rounded-full border border-white/20"
              style={{ backgroundColor: currentPresentation.palette.bgPrimary }}
            />
            <span
              className="w-3 h-3 rounded-full border border-white/20"
              style={{ backgroundColor: currentPresentation.palette.accentPrimary }}
            />
            <span
              className="w-3 h-3 rounded-full border border-white/20"
              style={{ backgroundColor: currentPresentation.palette.accentSecondary }}
            />
            <span
              className="w-3 h-3 rounded-full border border-white/20"
              style={{ backgroundColor: currentPresentation.palette.accentHighlight }}
            />
          </div>
        </div>

        {/* Live Interactive 16:9 Slide Thumbnail Preview */}
        <div className="relative group w-full max-w-full rounded-xl overflow-hidden border border-slate-700/80 shadow-xl bg-slate-950">
          <div
            onClick={() => setIsPreviewOpen(true)}
            className="w-full cursor-pointer transition-transform duration-300 md:group-hover:scale-[1.01]"
          >
            {activeThumbSlide && (
              <SlideCanvasRenderer
                slide={activeThumbSlide}
                palette={currentPresentation.palette}
                styleId={currentPresentation.styleId}
                totalSlides={totalSlides}
                compact={false}
              />
            )}
          </div>

          {/* Desktop-Only Hover Overlay Prompt (Hidden on Mobile per Requirement 2 & 11) */}
          <div
            onClick={() => setIsPreviewOpen(true)}
            className="hidden md:flex absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center cursor-pointer"
          >
            <div className="px-4 py-2 rounded-xl bg-slate-900/95 border border-white/20 text-white text-xs font-bold flex items-center gap-2 shadow-2xl">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Click to Open Full Preview</span>
            </div>
          </div>

          {/* Quick Thumbnail Slide Stepper on Card */}
          {totalSlides > 1 && (
            <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-lg px-1.5 py-0.5 md:px-2 md:py-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setThumbSlideIdx((prev) => (prev > 0 ? prev - 1 : prev));
                }}
                disabled={thumbSlideIdx === 0}
                className="p-0.5 text-slate-300 hover:text-white disabled:opacity-35 cursor-pointer"
                title="Previous Thumbnail"
                aria-label="Previous slide thumbnail"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold tabular-nums text-slate-200 px-1">
                {thumbSlideIdx + 1} / {totalSlides}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setThumbSlideIdx((prev) =>
                    prev < totalSlides - 1 ? prev + 1 : prev
                  );
                }}
                disabled={thumbSlideIdx >= totalSlides - 1}
                className="p-0.5 text-slate-300 hover:text-white disabled:opacity-35 cursor-pointer"
                title="Next Thumbnail"
                aria-label="Next slide thumbnail"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Download Error Banner */}
        {downloadError && (
          <div className="mt-2.5 md:mt-3 p-2.5 md:p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-200">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="truncate">PowerPoint file could not be created.</span>
            </div>
            <button
              type="button"
              onClick={() => handleDownload()}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ============================================================
            MOBILE ACTION ROW (< 768px)
            [ Preview ] [ Play ] [ Download PPTX ] [ ↻ ] [ ✎ ]
            No "Regenerate" or "Edit Presentation" text on mobile!
           ============================================================ */}
        <div className="mt-3 flex md:hidden flex-wrap items-center gap-1.5 w-full max-w-full">
          {/* Preview Primary Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            aria-label="Preview presentation"
            className="flex-1 min-w-[78px] min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-950/50 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Eye className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Preview</span>
          </button>

          {/* Play Slideshow Button */}
          <button
            type="button"
            onClick={() => setIsPlayOpen(true)}
            aria-label="Play presentation slideshow"
            className="min-w-[68px] min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all cursor-pointer active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current flex-shrink-0" />
            <span className="truncate">Play</span>
          </button>

          {/* Download PPTX Primary Button */}
          <button
            type="button"
            onClick={() => handleDownload()}
            disabled={isDownloading}
            aria-label="Download PowerPoint"
            className="flex-1 min-w-[96px] min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-600/80 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.98]"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 flex-shrink-0" />
                <span className="truncate">Building...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Saved</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="truncate">PPTX</span>
              </>
            )}
          </button>

          {/* Regenerate Icon-Only Button (Mobile) */}
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            aria-label="Regenerate presentation"
            title="Regenerate presentation"
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex-shrink-0 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRegenerating ? 'animate-spin text-cyan-400' : ''}`}
            />
          </button>

          {/* Edit Presentation Icon-Only Button (Mobile) */}
          <button
            type="button"
            onClick={() => setIsEditDrawerOpen((prev) => !prev)}
            aria-label="Edit presentation"
            title="Edit presentation"
            className={`w-11 h-11 min-w-[44px] min-h-[44px] flex-shrink-0 rounded-xl border flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              isEditDrawerOpen
                ? 'bg-violet-500/25 text-violet-300 border-violet-500/50'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700/80'
            }`}
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================
            DESKTOP ACTION CONTROLS (>= 768px)
           ============================================================ */}
        <div className="hidden md:flex mt-4 flex-row items-center gap-2.5">
          {/* Preview Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            aria-label="Preview presentation"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-950/50 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>

          {/* Dedicated Play Mode Button */}
          <button
            type="button"
            onClick={() => setIsPlayOpen(true)}
            aria-label="Play presentation slideshow"
            className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transition-all cursor-pointer active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play</span>
          </button>

          {/* Download PPTX Button */}
          <button
            type="button"
            onClick={() => handleDownload()}
            disabled={isDownloading}
            aria-label="Download PowerPoint"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-600/80 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.99]"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Building PPTX...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Downloaded PPTX</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Download PPTX</span>
              </>
            )}
          </button>
        </div>

        {/* Secondary Controls: Edit Presentation & Regenerate (Desktop only) */}
        <div className="hidden md:flex mt-2.5 pt-2.5 border-t border-slate-800/80 items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsEditDrawerOpen((prev) => !prev)}
            aria-label="Edit presentation"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isEditDrawerOpen
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Edit presentation</span>
          </button>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            aria-label="Regenerate presentation"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-cyan-400' : ''}`}
            />
            <span>{isRegenerating ? 'Updating...' : 'Regenerate'}</span>
          </button>
        </div>

        {/* Action Toast Feedback Banner */}
        {actionToast && (
          <div className="mt-2.5 py-1.5 px-3 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{actionToast}</span>
          </div>
        )}

        {/* Expandable Quick-Edit & Custom Modification Drawer (Responsive for Mobile & Desktop) */}
        {isEditDrawerOpen && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5 animate-in fade-in duration-150 w-full max-w-full overflow-hidden">
            <div className="text-[11px] font-medium text-slate-400">
              Related modifications for this presentation:
            </div>
            <div className="flex flex-wrap gap-1.5 w-full">
              {dynamicPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyEdit(preset)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-violet-600/30 text-slate-300 hover:text-white border border-slate-700/80 hover:border-violet-500/50 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyEdit(customEditInput);
              }}
              className="flex items-center gap-2 pt-1 w-full min-w-0"
            >
              <input
                type="text"
                value={customEditInput}
                onChange={(e) => setCustomEditInput(e.target.value)}
                placeholder='e.g. "Add Key Takeaways Summary Slide"'
                className="flex-1 min-w-0 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                disabled={!customEditInput.trim() || isRegenerating}
                className="px-3 py-2 min-h-[36px] flex-shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Apply</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Presentation Preview Modal (Portrait Mobile Viewer + Full Desktop Viewer) */}
      <PresentationPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        presentation={currentPresentation}
        initialSlideIndex={thumbSlideIdx}
        onDownloadPptx={handleDownload}
        isDownloading={isDownloading}
        onUpdatePresentation={(updated) => setCurrentPresentation(updated)}
        onPresentationChange={(updated) => setCurrentPresentation(updated)}
      />

      {/* Dedicated Presentation Play Mode Modal */}
      <PresentationPlayModal
        isOpen={isPlayOpen}
        onClose={() => setIsPlayOpen(false)}
        presentation={currentPresentation}
        palette={currentPresentation.palette}
        styleId={currentPresentation.styleId}
        initialSlideIndex={thumbSlideIdx}
      />
    </>
  );
};
