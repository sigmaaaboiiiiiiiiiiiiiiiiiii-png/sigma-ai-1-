import React, { useEffect, useRef, useState } from 'react';
import { X, Square, ArrowUp } from 'lucide-react';

interface AudioWaveBarProps {
  isListening: boolean;
  onStopListening: () => void;
  onCancelListening?: () => void;
  onSendListening?: () => void;
  stream?: MediaStream | null;
  themeColorHex?: string;
}

export const AudioWaveBar: React.FC<AudioWaveBarProps> = ({
  isListening,
  onStopListening,
  onCancelListening,
  onSendListening,
  stream,
  themeColorHex = '#ec4899',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [barCount, setBarCount] = useState<number>(64);
  const [bars, setBars] = useState<number[]>(() => Array(64).fill(2));
  const bufferRef = useRef<number[]>(Array(64).fill(2));
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const lastSampleTimeRef = useRef<number>(0);

  // Reset and synchronize bars whenever isListening starts or container initializes
  useEffect(() => {
    if (!isListening) return;
    const width = containerRef.current?.clientWidth || 320;
    const count = Math.max(24, Math.floor(width / 5.5));
    setBarCount(count);
    const initialBaseline = Array(count).fill(2);
    bufferRef.current = initialBaseline;
    setBars(initialBaseline);
  }, [isListening]);

  // Dynamically compute bar count to fill the entire container
  useEffect(() => {
    if (!containerRef.current) return;
    const updateCount = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (width > 0) {
        const count = Math.max(24, Math.floor(width / 5.5));
        setBarCount((prev) => {
          if (prev === count) return prev;
          if (bufferRef.current.length < count) {
            const diff = count - bufferRef.current.length;
            bufferRef.current = [...Array(diff).fill(2), ...bufferRef.current];
          } else if (bufferRef.current.length > count) {
            bufferRef.current = bufferRef.current.slice(-count);
          }
          setBars([...bufferRef.current]);
          return count;
        });
      }
    };

    updateCount();
    const observer = new ResizeObserver(updateCount);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isListening) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (_) {}
        sourceRef.current = null;
      }
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (_) {}
        analyserRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      return;
    }

    let isCancelled = false;

    // Web Audio setup when microphone stream is active
    if (stream && stream.active && stream.getAudioTracks().length > 0) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.35; // Lower smoothing for agile response to fast words
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const renderRealAudio = (currentTime: number) => {
          if (isCancelled) return;

          // Stable 30fps sampling
          if (currentTime - lastSampleTimeRef.current >= 32) {
            lastSampleTimeRef.current = currentTime;
            analyser.getByteFrequencyData(dataArray);

            // Target human speech frequency bands (bins 2 to 24: ~100Hz to 2200Hz)
            let sum = 0;
            let peak = 0;
            const vocalStart = 2;
            const vocalEnd = Math.min(dataArray.length, 24);
            for (let i = vocalStart; i < vocalEnd; i++) {
              const val = dataArray[i];
              sum += val;
              if (val > peak) peak = val;
            }
            const avg = sum / (vocalEnd - vocalStart);
            const voiceEnergy = Math.max(avg, peak * 0.72);

            // Responsive volume mapping: 2px tiny quiet dots during silence/pauses, 4px-26px on active speech
            let newHeight = 2;
            if (voiceEnergy > 8) {
              const normalized = Math.min(1, Math.max(0, (voiceEnergy - 8) / 65));
              newHeight = Math.max(3, Math.min(26, Math.round(2 + Math.pow(normalized, 0.8) * 24)));
            }

            bufferRef.current.shift();
            bufferRef.current.push(newHeight);
            setBars([...bufferRef.current]);
          }

          animationFrameRef.current = requestAnimationFrame(renderRealAudio);
        };

        animationFrameRef.current = requestAnimationFrame(renderRealAudio);

        return () => {
          isCancelled = true;
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
          if (sourceRef.current) {
            try {
              sourceRef.current.disconnect();
            } catch (_) {}
            sourceRef.current = null;
          }
          if (analyserRef.current) {
            try {
              analyserRef.current.disconnect();
            } catch (_) {}
            analyserRef.current = null;
          }
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
          }
        };
      } catch (e) {
        console.warn('Web Audio Analyser fallback:', e);
      }
    }

    // Quiet baseline when microphone stream is waiting or absent (no artificial sine waves)
    const renderQuietBaseline = (currentTime: number) => {
      if (isCancelled) return;
      if (currentTime - lastSampleTimeRef.current >= 60) {
        lastSampleTimeRef.current = currentTime;
        bufferRef.current.shift();
        bufferRef.current.push(2);
        setBars([...bufferRef.current]);
      }
      animationFrameRef.current = requestAnimationFrame(renderQuietBaseline);
    };

    animationFrameRef.current = requestAnimationFrame(renderQuietBaseline);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isListening, stream]);

  if (!isListening) return null;

  return (
    <div
      id="voice-recording-toolbar"
      className="w-full flex items-center justify-between gap-2 sm:gap-3 rounded-full bg-[#121316] border border-white/10 sm:border-slate-800 px-2 sm:px-3 py-1.5 h-[50px] sm:h-[52px] shadow-2xl transition-all duration-150 select-none overflow-hidden"
    >
      {/* 1. Cancel Button (X) on Far Left */}
      <button
        type="button"
        id="voice-bar-cancel-btn"
        onClick={onCancelListening || onStopListening}
        className="w-9 h-9 sm:w-10 sm:h-10 aspect-square rounded-full bg-[#1e2026] hover:bg-[#282b34] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 flex-shrink-0"
        title="Cancel voice recording (Esc)"
        aria-label="Cancel voice recording"
      >
        <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
      </button>

      {/* 2. Continuously Moving Real-time Waveform Across Center: Samples enter on RIGHT, move LEFT, ending at the cross on LEFT */}
      <div
        ref={containerRef}
        id="voice-bar-waveform-container"
        className="flex-1 h-8 flex items-center justify-between overflow-hidden pl-0.5 pr-1 sm:pr-2 min-w-0"
      >
        {bars.map((h, idx) => (
          <span
            key={`bar-${idx}`}
            className="w-[2.5px] sm:w-[3px] rounded-full bg-slate-300/90 transition-[height] duration-75 ease-out flex-shrink-0"
            style={{
              height: `${h}px`,
              opacity: Math.max(0.4, Math.min(1, 0.45 + (h / 28) * 0.55)),
            }}
          />
        ))}
      </div>

      {/* 3. Action Buttons on Right: Stop (■) + Pink Send (↑) */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Stop Button (Dark circle with small square icon) */}
        <button
          type="button"
          id="voice-bar-stop-btn"
          onClick={onStopListening}
          className="w-9 h-9 sm:w-10 sm:h-10 aspect-square rounded-full bg-[#1e2026] hover:bg-[#282b34] border border-white/10 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 flex-shrink-0"
          title="Stop recording and keep transcript"
          aria-label="Stop recording"
        >
          <Square className="w-3.5 h-3.5 fill-white text-white" />
        </button>

        {/* Send Button (Bright pink circle with upward white arrow) */}
        <button
          type="button"
          id="voice-bar-send-btn"
          onClick={onSendListening || onStopListening}
          className="w-9 h-9 sm:w-10 sm:h-10 aspect-square rounded-full bg-[#ec4899] hover:bg-[#db2777] active:bg-[#be185d] text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-[0_0_14px_rgba(236,72,153,0.45)] flex-shrink-0"
          title="Send voice message"
          aria-label="Send voice message"
        >
          <ArrowUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-white" />
        </button>
      </div>
    </div>
  );
};
