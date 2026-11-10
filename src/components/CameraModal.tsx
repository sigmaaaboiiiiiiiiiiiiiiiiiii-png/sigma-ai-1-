import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  X,
  RotateCcw,
  Zap,
  ZapOff,
  SwitchCamera,
  ZoomIn,
  ZoomOut,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

export interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, file?: File) => void;
  themeColorHex?: string;
  initialMode?: 'select' | 'camera' | 'upload';
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  themeColorHex = '#00ea77',
  initialMode = 'select',
}) => {
  const [viewMode, setViewMode] = useState<'select' | 'camera'>('select');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera tracks cleanly
  const stopMediaTracks = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      setStream(null);
    }
  }, [stream]);

  // Check multiple video devices
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      })
      .catch(() => {});
  }, []);

  // Initialize or re-initialize camera stream
  const startCamera = useCallback(async () => {
    stopMediaTracks();
    setCameraError(null);
    setCapturedImage(null);
    setIsInitializing(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API (getUserMedia) is not supported in this browser or environment.');
      setIsInitializing(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }

      // Check capabilities (Torch & Zoom)
      const track = mediaStream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const caps: any = track.getCapabilities();
        if ('torch' in caps) {
          setTorchSupported(true);
        }
        if ('zoom' in caps) {
          setZoomRange({
            min: caps.zoom.min || 1,
            max: caps.zoom.max || 5,
            step: caps.zoom.step || 0.1,
          });
          setZoomLevel(caps.zoom.min || 1);
        }
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in browser permissions or use File Upload.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device was found on this system. You can upload an image file instead.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('The camera is currently being used by another application or tab.');
      } else {
        setCameraError(`Camera initialization failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode, stopMediaTracks]);

  // Handle switching viewMode or opening modal
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'camera') {
        setViewMode('camera');
        startCamera();
      } else {
        setViewMode('select');
      }
    } else {
      stopMediaTracks();
      setCapturedImage(null);
      setCameraError(null);
    }
    return () => {
      stopMediaTracks();
    };
  }, [isOpen, initialMode]);

  // When switching facingMode while in camera view
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    if (viewMode === 'camera' && isOpen && !capturedImage) {
      startCamera();
    }
  }, [facingMode]);

  // Torch control
  const handleToggleTorch = async () => {
    if (!stream || !torchSupported) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const next = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: next }],
      });
      setIsTorchOn(next);
    } catch (e) {
      console.warn('Torch control failed:', e);
    }
  };

  // Zoom control
  const handleZoomChange = async (newZoom: number) => {
    if (!stream || !zoomRange) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const clamped = Math.max(zoomRange.min, Math.min(zoomRange.max, newZoom));
      await (track as any).applyConstraints({
        advanced: [{ zoom: clamped }],
      });
      setZoomLevel(clamped);
    } catch (e) {
      console.warn('Zoom adjustment failed:', e);
    }
  };

  // Capture frame
  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    // Stop live track while reviewing
    stopMediaTracks();
  };

  // Use captured photo
  const handleConfirmCaptured = () => {
    if (!capturedImage) return;
    onCapture(capturedImage);
    handleCloseModal();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Handle native file selection
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onCapture(dataUrl, file);
        handleCloseModal();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCloseModal = () => {
    stopMediaTracks();
    setCapturedImage(null);
    setViewMode('select');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="sigma-camera-modal-backdrop"
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={handleCloseModal}
    >
      <div
        id="sigma-camera-modal-dialog"
        className="relative w-full max-w-xl bg-[#0c1017] border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '92vh' }}
      >
        {/* Hidden Canvas & File Input */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileSelected}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#10141f]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-black font-bold text-sm shadow-md"
              style={{ backgroundColor: themeColorHex }}
            >
              📷
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Homework & Image Solver
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono">
                  /camera
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Capture or upload notes, math equations, or question papers</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {viewMode === 'select' ? (
            /* SELECTION VIEW: Camera vs Upload File */
            <div className="space-y-4 py-2">
              <div className="text-center max-w-sm mx-auto mb-5">
                <p className="text-xs text-slate-300">
                  Select how you want to provide your question, notes, or past paper to Sigma AI:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. In-App Camera Button */}
                <button
                  id="camera-open-stream-btn"
                  type="button"
                  onClick={() => {
                    setViewMode('camera');
                    startCamera();
                  }}
                  className="group p-5 rounded-2xl bg-[#131926] hover:bg-[#1a2336] border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer text-left flex flex-col justify-between space-y-4 shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${themeColorHex}25`,
                        border: `1.5px solid ${themeColorHex}60`,
                        color: themeColorHex,
                      }}
                    >
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Live Preview
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Open Camera
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Snap a photo of your book, handwritten problem, or worksheet with flash & zoom.
                    </p>
                  </div>
                </button>

                {/* 2. Upload File Button */}
                <button
                  id="camera-upload-file-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group p-5 rounded-2xl bg-[#131926] hover:bg-[#1a2336] border border-slate-800 hover:border-sky-500/60 transition-all cursor-pointer text-left flex flex-col justify-between space-y-4 shadow-lg hover:shadow-sky-500/10 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sky-400 bg-sky-500/20 border border-sky-500/40 transition-transform group-hover:scale-105">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      Gallery & Docs
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                      Upload File
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Choose an image, past paper screenshot, or document from your device gallery.
                    </p>
                  </div>
                </button>
              </div>

              {/* Supported Formats Banner */}
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>
                  Supported: <strong>JPEG, PNG, WebP, PDF</strong>. Expert in mathematical notation & Urdu/English handwriting.
                </span>
              </div>
            </div>
          ) : (
            /* LIVE CAMERA VIEW */
            <div className="space-y-4">
              {cameraError ? (
                /* Error Screen */
                <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/30 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                  <h4 className="text-sm font-bold text-red-300">Camera Unavailable</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">{cameraError}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer shadow-md"
                    >
                      Upload File Instead
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('select')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </div>
              ) : capturedImage ? (
                /* Captured Frame Preview */
                <div className="space-y-3">
                  <div className="relative w-full aspect-[4/3] sm:aspect-video bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
                    <img src={capturedImage} alt="Captured frame" className="w-full h-full object-contain" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Photo Captured</span>
                    </div>
                  </div>

                  {/* Actions: Retake vs Use Photo */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retake</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmCaptured}
                      className="flex-1 py-3 px-4 rounded-xl text-black text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-lg cursor-pointer"
                      style={{
                        backgroundColor: themeColorHex,
                        boxShadow: `0 4px 16px ${themeColorHex}44`,
                      }}
                    >
                      <Check className="w-4 h-4" />
                      <span>Solve This Question</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Viewfinder Feed */
                <div className="space-y-3">
                  <div className="relative w-full aspect-[4/3] sm:aspect-video bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                    />

                    {isInitializing && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
                        <span className="text-xs text-slate-300">Starting camera preview...</span>
                      </div>
                    )}

                    {/* Viewfinder Document Guide Corners */}
                    <div className="pointer-events-none absolute inset-4 border border-white/25 rounded-xl flex items-center justify-center">
                      <div className="w-12 h-12 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0 rounded-tl" />
                      <div className="w-12 h-12 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0 rounded-tr" />
                      <div className="w-12 h-12 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0 rounded-bl" />
                      <div className="w-12 h-12 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0 rounded-br" />
                      <span className="text-[10px] text-white/70 font-mono tracking-wider bg-black/40 px-2 py-0.5 rounded-full">
                        ALIGN QUESTION INSIDE FRAME
                      </span>
                    </div>

                    {/* Top Controls Overlay: Torch & Camera Switch */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {torchSupported && (
                        <button
                          type="button"
                          onClick={handleToggleTorch}
                          className={`p-2 rounded-xl backdrop-blur-md border transition-colors cursor-pointer ${
                            isTorchOn
                              ? 'bg-amber-500/80 text-black border-amber-400'
                              : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                          }`}
                          title={isTorchOn ? 'Turn off flash' : 'Turn on flash'}
                        >
                          {isTorchOn ? <Zap className="w-4 h-4 fill-black" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                      )}

                      {hasMultipleCameras && (
                        <button
                          type="button"
                          onClick={handleToggleFacingMode}
                          className="p-2 rounded-xl bg-black/60 text-white border border-white/20 hover:bg-black/80 backdrop-blur-md transition-colors cursor-pointer"
                          title="Switch Front/Back Camera"
                        >
                          <SwitchCamera className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Zoom Level Indicator */}
                    {zoomRange && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-white text-[11px] font-mono">
                        <button
                          type="button"
                          onClick={() => handleZoomChange(zoomLevel - zoomRange.step)}
                          className="p-0.5 hover:text-emerald-400 cursor-pointer"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span>{zoomLevel.toFixed(1)}x</span>
                        <button
                          type="button"
                          onClick={() => handleZoomChange(zoomLevel + zoomRange.step)}
                          className="p-0.5 hover:text-emerald-400 cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Camera Toolbar with Large Circular Capture Button */}
                  <div className="flex items-center justify-between px-4 pt-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('select')}
                      className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>

                    {/* Shutter Button */}
                    <div className="flex items-center justify-center">
                      <button
                        id="camera-shutter-capture-btn"
                        type="button"
                        onClick={handleCaptureFrame}
                        className="w-16 h-16 rounded-full border-4 border-white bg-transparent p-1 transition-transform active:scale-90 hover:scale-105 cursor-pointer shadow-2xl flex items-center justify-center"
                        title="Capture Photo"
                        aria-label="Capture photo"
                      >
                        <div
                          className="w-full h-full rounded-full"
                          style={{ backgroundColor: themeColorHex }}
                        />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
