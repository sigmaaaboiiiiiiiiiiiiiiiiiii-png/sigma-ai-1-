export interface YouTubeVideoMetadata {
  id: string;
  url: string;
  title: string;
  authorName: string;
  authorUrl?: string;
  thumbnailUrl?: string;
  hasTranscript: boolean;
  userTranscript?: string;
  userNotes?: string;
  supportedActions: ('explain' | 'summarize' | 'notes' | 'flashcards' | 'quiz')[];
}

export function parseYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  return match ? match[1] : null;
}

export function isYouTubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url.trim());
}

export async function fetchVideoMetadata(videoUrl: string): Promise<{
  success: boolean;
  title?: string;
  authorName?: string;
  authorUrl?: string;
  thumbnailUrl?: string;
  videoId?: string;
  hasTranscript?: boolean;
  message?: string;
}> {
  try {
    const res = await fetch('/api/video/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl.trim() }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Backend video metadata fetch error, falling back to direct oEmbed:', e);
  }

  // Fallback: direct public YouTube oEmbed in browser
  try {
    const cleanUrl = videoUrl.trim();
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`;
    const oembedRes = await fetch(oembedUrl);
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data && data.title) {
        return {
          success: true,
          title: data.title,
          authorName: data.author_name || 'YouTube Creator',
          authorUrl: data.author_url,
          thumbnailUrl: data.thumbnail_url,
          videoId: parseYouTubeVideoId(cleanUrl) || undefined,
          hasTranscript: false,
          message:
            'Video title and metadata verified. Automatic captions were not accessible — paste transcripts or lecture notes to generate study guides.',
        };
      }
    }
  } catch (_) {}

  const vid = parseYouTubeVideoId(videoUrl);
  return {
    success: Boolean(vid),
    title: vid ? `YouTube Educational Video (${vid})` : 'YouTube Resource',
    authorName: 'YouTube',
    videoId: vid || undefined,
    hasTranscript: false,
    message: 'Could not automatically load video transcripts. You can paste notes or transcript directly.',
  };
}
