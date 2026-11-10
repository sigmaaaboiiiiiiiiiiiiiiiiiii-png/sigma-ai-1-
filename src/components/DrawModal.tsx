import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Sparkles,
  Download,
  Trash2,
  Type,
  PenTool,
  Check,
} from 'lucide-react';

interface DrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string | null;
  onSaveImage?: (dataUrl: string) => void;
  onSendDiagramPrompt?: (prompt: string, imageDataUrl?: string) => void;
  themeColorHex?: string;
}

interface PaletteColor {
  name: string;
  hex: string;
}

const PALETTE_COLORS: PaletteColor[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Light Blue', hex: '#38bdf8' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Grey', hex: '#6b7280' },
];

export const DrawModal: React.FC<DrawModalProps> = ({
  isOpen,
  onClose,
  initialImage,
  onSaveImage,
  onSendDiagramPrompt,
  themeColorHex = '#00ea77',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<'sketch' | 'text'>('sketch');
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444'); // Default to Red
  const [isDrawing, setIsDrawing] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // Text insertion state
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState('');

  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);

  const pushStateToUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      undoStackRef.current.push(imgData);
      if (undoStackRef.current.length > 25) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
    } catch (_) {}
  }, []);

  // Initialize or re-initialize canvas when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setTextPos(null);
    setTextInputValue('');

    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    if (initialImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Clear with dark or neutral tone
        ctx.fillStyle = '#181a20';
        ctx.fillRect(0, 0, width, height);

        // Draw image fit inside aspect ratio
        const hRatio = width / img.width;
        const vRatio = height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShiftX = (width - img.width * ratio) / 2;
        const centerShiftY = (height - img.height * ratio) / 2;

        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          centerShiftX,
          centerShiftY,
          img.width * ratio,
          img.height * ratio
        );
        pushStateToUndo();
      };
      img.onerror = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        pushStateToUndo();
      };
      img.src = initialImage;
    } else {
      // Default clean white sketchpad
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      pushStateToUndo();
    }
  }, [isOpen, initialImage, pushStateToUndo]);

  // Undo action
  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || undoStackRef.current.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const current = undoStackRef.current.pop();
    if (current) {
      redoStackRef.current.push(current);
    }
    const previous = undoStackRef.current[undoStackRef.current.length - 1];
    if (previous) {
      ctx.putImageData(previous, 0, 0);
    }
    setCanUndo(undoStackRef.current.length > 1);
    setCanRedo(redoStackRef.current.length > 0);
  };

  // Redo action
  const handleRedo = () => {
    const canvas = canvasRef.current;
    if (!canvas || redoStackRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const next = redoStackRef.current.pop();
    if (next) {
      undoStackRef.current.push(next);
      ctx.putImageData(next, 0, 0);
    }
    setCanUndo(undoStackRef.current.length > 1);
    setCanRedo(redoStackRef.current.length > 0);
  };

  // Drawing event handlers
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);

    if (activeTool === 'text') {
      setTextPos(coords);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'sketch') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      pushStateToUndo();
    }
  };

  const handleApplyText = () => {
    if (!textPos || !textInputValue.trim()) {
      setTextPos(null);
      setTextInputValue('');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = selectedColor;
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(textInputValue.trim(), textPos.x, textPos.y);

    pushStateToUndo();
    setTextPos(null);
    setTextInputValue('');
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = initialImage ? '#181a20' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushStateToUndo();
  };

  const getCanvasDataUrl = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  };

  const handleSave = () => {
    const dataUrl = getCanvasDataUrl();
    if (dataUrl && onSaveImage) {
      onSaveImage(dataUrl);
      setShowSavedFeedback(true);
      setTimeout(() => {
        setShowSavedFeedback(false);
        onClose();
      }, 600);
    } else {
      onClose();
    }
  };

  const handleDownload = () => {
    const dataUrl = getCanvasDataUrl();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.download = `sigma-drawing-${Date.now()}.png`;
    a.href = dataUrl;
    a.click();
  };

  const handleAskSigma = () => {
    const dataUrl = getCanvasDataUrl();
    const prompt =
      promptInput.trim() ||
      'What is this drawing or image? Please examine it in detail and explain what it depicts.';
    if (onSendDiagramPrompt) {
      onSendDiagramPrompt(prompt, dataUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="gemini-image-editor-modal"
      className="fixed inset-0 z-50 bg-[#12141a]/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 select-none animate-in fade-in duration-200"
    >
      {/* Top Bar matching Gemini Image Editor Screenshot */}
      <header className="w-full max-w-4xl flex items-center justify-between pb-3">
        {/* Left: Back Arrow */}
        <button
          id="editor-back-btn"
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Back"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Center: Title / Clear */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold text-slate-300">
            {initialImage ? 'Image Annotator' : 'Sigma Draw & Sketch'}
          </span>
          <button
            type="button"
            onClick={clearCanvas}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs flex items-center gap-1 cursor-pointer"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs flex items-center gap-1 cursor-pointer"
            title="Download PNG"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Undo, Redo, Save Pill Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="editor-undo-btn"
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              canUndo
                ? 'text-slate-200 hover:text-white hover:bg-white/10'
                : 'text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="Undo"
            aria-label="Undo"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            id="editor-redo-btn"
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              canRedo
                ? 'text-slate-200 hover:text-white hover:bg-white/10'
                : 'text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="Redo"
            aria-label="Redo"
          >
            <Redo2 className="w-5 h-5" />
          </button>

          <button
            id="editor-save-btn"
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-full bg-white hover:bg-slate-200 active:scale-95 text-black font-semibold text-sm transition-all cursor-pointer shadow-md flex items-center gap-1.5"
          >
            {showSavedFeedback ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </header>

      {/* Center: Canvas Viewport */}
      <main className="flex-1 w-full max-w-3xl flex items-center justify-center p-2 min-h-0 relative">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#181a20] max-w-full max-h-[60vh] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={`touch-none max-w-full max-h-[58vh] object-contain ${
              activeTool === 'text' ? 'cursor-text' : 'cursor-crosshair'
            }`}
          />

          {/* Floating text prompt if user clicked canvas in text mode */}
          {textPos && (
            <div
              className="absolute z-30 p-2 rounded-xl bg-black/90 border border-white/20 shadow-2xl flex items-center gap-2"
              style={{
                left: `${Math.min(textPos.x * 0.7, 300)}px`,
                top: `${Math.min(textPos.y * 0.7, 260)}px`,
              }}
            >
              <input
                autoFocus
                type="text"
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyText();
                  if (e.key === 'Escape') setTextPos(null);
                }}
                placeholder="Type text annotation..."
                className="px-2 py-1 text-xs sm:text-sm bg-transparent border-b border-white/30 text-white outline-none"
                style={{ color: selectedColor }}
              />
              <button
                type="button"
                onClick={handleApplyText}
                className="px-2 py-1 rounded bg-white text-black font-semibold text-xs cursor-pointer"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Controls Area matching Gemini UI */}
      <footer className="w-full max-w-2xl flex flex-col items-center gap-4 py-2">
        {/* Color Palette Dots (7 selectable colors: Black, Red, Yellow, Green, Light Blue, Pink, Grey) */}
        <div className="flex items-center gap-3 sm:gap-4 p-2 bg-black/40 backdrop-blur-xs rounded-full border border-white/10 px-4">
          {PALETTE_COLORS.map((color) => {
            const isSelected = selectedColor === color.hex;
            const isBlack = color.hex === '#000000';
            return (
              <button
                key={color.hex}
                type="button"
                onClick={() => setSelectedColor(color.hex)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#12141a] scale-110 shadow-lg'
                    : 'hover:scale-105 opacity-90'
                } ${isBlack ? 'border border-slate-600' : ''}`}
                style={{ backgroundColor: color.hex }}
                title={`${color.name} (${color.hex})`}
                aria-label={color.name}
              />
            );
          })}
        </div>

        {/* Tools: Sketch & Text icons with labels */}
        <div className="flex items-center gap-8 sm:gap-12">
          {/* Tool 1: Sketch */}
          <button
            id="tool-sketch-btn"
            type="button"
            onClick={() => setActiveTool('sketch')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                activeTool === 'sketch'
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <PenTool className="w-5 h-5" />
            </div>
            <span
              className={`text-xs font-medium tracking-wide ${
                activeTool === 'sketch' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            >
              Sketch
            </span>
          </button>

          {/* Tool 2: Text */}
          <button
            id="tool-text-btn"
            type="button"
            onClick={() => setActiveTool('text')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                activeTool === 'text'
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <Type className="w-5 h-5" />
            </div>
            <span
              className={`text-xs font-medium tracking-wide ${
                activeTool === 'text' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            >
              Text
            </span>
          </button>
        </div>

        {/* Ask Sigma Prompt Bar */}
        <div className="w-full flex gap-2 items-center pt-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskSigma()}
            placeholder="Ask Sigma about this sketch or image (or leave blank to auto-analyze)..."
            className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:border-white/40"
          />
          <button
            type="button"
            onClick={handleAskSigma}
            className="px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 text-black cursor-pointer shadow-lg active:scale-95"
            style={{ backgroundColor: themeColorHex }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Sigma</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
