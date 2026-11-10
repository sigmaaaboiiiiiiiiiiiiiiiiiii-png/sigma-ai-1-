/**
 * Video Processing & Keyframe Extraction Utilities
 * 
 * Provides client-side frame-by-frame analysis, thumbnail generation, duration calculation,
 * and high-density second-by-second sampling for Gemini multimodal video understanding.
 */

export interface VideoFrame {
  timestamp: string; // e.g. "00:02"
  timeSec: number;
  dataUrl: string; // base64 JPEG image Data URL
}

export interface VideoProcessedPayload {
  name: string;
  sizeFormatted: string;
  sizeBytes: number;
  mimeType: string;
  duration: number;
  durationFormatted: string;
  width: number;
  height: number;
  thumbnailUrl: string;
  keyframes: VideoFrame[];
  videoDataUrl?: string; // base64 video Data URL if <= 25MB
}

export function formatVideoTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isVideoFile(file: { name?: string; type?: string }): boolean {
  if (!file) return false;
  if (file.type && file.type.startsWith('video/')) return true;
  const name = file.name || '';
  return /\.(mp4|webm|mov|mkv|avi|m4v|3gp|3gpp|flv|ogv|wmv|ts|mts|m2ts|vob|mpg|mpeg|asf|rm|rmvb|divx)$/i.test(name);
}

/**
 * Extracts comprehensive video metadata, thumbnail, keyframe timeline, and base64 payload.
 */
export async function processUploadedVideo(
  file: File,
  onProgress?: (status: string, percent: number) => void
): Promise<VideoProcessedPayload> {
  const sizeBytes = file.size;
  const sizeFormatted = formatFileSize(sizeBytes);
  const mimeType = file.type || (file.name.endsWith('.webm') ? 'video/webm' : file.name.endsWith('.mov') ? 'video/quicktime' : 'video/mp4');
  const name = file.name;

  onProgress?.('Loading video...', 10);

  // 1. Create object URL to inspect video in DOM
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  try {
    let metadataLoaded = false;
    // Wait for video metadata to load with a safe 3.5s timeout guard
    try {
      await new Promise<void>((resolve, reject) => {
        let isDone = false;
        const cleanup = () => {
          if (isDone) return;
          isDone = true;
          clearTimeout(timer);
          video.removeEventListener('loadedmetadata', onLoaded);
          video.removeEventListener('error', onError);
        };
        const onLoaded = () => {
          cleanup();
          metadataLoaded = true;
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error('Video format may not be decodable directly by browser.'));
        };
        const timer = setTimeout(() => {
          cleanup();
          if (video.readyState >= 1) {
            metadataLoaded = true;
            resolve();
          } else {
            reject(new Error('Video metadata load timeout.'));
          }
        }, 3500);

        video.addEventListener('loadedmetadata', onLoaded);
        video.addEventListener('error', onError);
        video.src = objectUrl;
        try {
          video.load();
        } catch (_) {}
      });
    } catch (metaErr) {
      console.warn('Metadata inspection notice:', metaErr);
    }

    const duration = metadataLoaded ? video.duration || 0 : 0;
    const durationFormatted = duration > 0 ? formatVideoTime(duration) : '';
    const width = metadataLoaded ? video.videoWidth || 640 : 640;
    const height = metadataLoaded ? video.videoHeight || 360 : 360;

    // Create canvas for frame drawing
    const canvas = document.createElement('canvas');
    const maxDim = 400;
    let targetW = width;
    let targetH = height;
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        targetW = maxDim;
        targetH = Math.round((height / width) * maxDim);
      } else {
        targetH = maxDim;
        targetW = Math.round((width / height) * maxDim);
      }
    }
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    // Helper to seek video to timestamp and capture frame
    const seekAndCapture = async (timeSec: number): Promise<string> => {
      if (!metadataLoaded || !ctx) return '';
      return new Promise<string>((resolve) => {
        const clamped = Math.max(0, Math.min(timeSec, Math.max(0.05, duration - 0.05)));
        let resolved = false;

        const finish = () => {
          if (resolved) return;
          resolved = true;
          video.removeEventListener('seeked', onSeeked);
          if (ctx) {
            try {
              ctx.drawImage(video, 0, 0, targetW, targetH);
              resolve(canvas.toDataURL('image/jpeg', 0.68));
            } catch {
              resolve('');
            }
          } else {
            resolve('');
          }
        };

        const onSeeked = () => {
          finish();
        };

        video.addEventListener('seeked', onSeeked);

        if (Math.abs(video.currentTime - clamped) < 0.02) {
          finish();
          return;
        }

        try {
          video.currentTime = clamped;
        } catch {
          finish();
          return;
        }

        // 280ms timeout prevents hanging on slower frame decoding
        setTimeout(() => {
          finish();
        }, 280);
      });
    };

    let thumbnailUrl = '';
    const keyframes: VideoFrame[] = [];

    if (metadataLoaded && duration > 0) {
      // 2. Capture primary thumbnail
      onProgress?.('Extracting thumbnail...', 20);
      const thumbTime = Math.min(0.5, duration > 1 ? 0.5 : duration / 2);
      thumbnailUrl = await seekAndCapture(thumbTime);

      // 3. Dense second-by-second timeline sampling (optimized for fast Gemini video vision)
      const sampleTimes: number[] = [];
      if (duration <= 8) {
        // 1 frame per second for short videos / reels
        for (let t = 0; t <= duration; t += 1) {
          sampleTimes.push(Math.round(t * 10) / 10);
        }
      } else if (duration <= 20) {
        // Every 2s
        for (let t = 0; t <= duration; t += 2) {
          sampleTimes.push(Math.round(t * 10) / 10);
        }
      } else {
        // 9 evenly distributed frames across duration
        const frameCount = 9;
        const step = duration / frameCount;
        for (let i = 0; i < frameCount; i++) {
          sampleTimes.push(Math.round(i * step * 10) / 10);
        }
      }

      // Always include start and end
      if (!sampleTimes.includes(0)) sampleTimes.unshift(0);
      const nearEnd = Math.max(0, duration - 0.2);
      if (!sampleTimes.some((t) => Math.abs(t - nearEnd) < 0.4) && duration > 0.5) {
        sampleTimes.push(Math.round(nearEnd * 10) / 10);
      }

      onProgress?.('Extracting second-by-second frames...', 35);
      for (let i = 0; i < sampleTimes.length; i++) {
        const t = sampleTimes[i];
        const frameData = await seekAndCapture(t);
        if (frameData) {
          keyframes.push({
            timestamp: formatVideoTime(t),
            timeSec: Math.round(t * 10) / 10,
            dataUrl: frameData,
          });
        }
        const pct = 35 + Math.round(((i + 1) / sampleTimes.length) * 50);
        onProgress?.(`Extracting second ${formatVideoTime(t)} (${i + 1}/${sampleTimes.length})...`, pct);
      }
    }

    // 4. Read full video as Base64 Data URL if <= 16MB
    let videoDataUrl: string | undefined = undefined;
    if (sizeBytes <= 16 * 1024 * 1024) {
      onProgress?.('Packing video stream data...', 88);
      videoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(typeof e.target?.result === 'string' ? e.target.result : '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    }

    onProgress?.('Ready', 100);

    return {
      name,
      sizeFormatted,
      sizeBytes,
      mimeType,
      duration,
      durationFormatted,
      width,
      height,
      thumbnailUrl: thumbnailUrl || (keyframes[0]?.dataUrl || ''),
      keyframes,
      videoDataUrl: videoDataUrl && videoDataUrl.length > 50 ? videoDataUrl : undefined,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
