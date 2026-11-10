/**
 * Safe date and time utilities to prevent "RangeError: Invalid time value"
 */

export function toSafeDate(val: any): Date {
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return val;
    }
    return new Date();
  }

  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  return new Date();
}

export function toSafeIsoString(val: any): string {
  try {
    const d = toSafeDate(val);
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function formatSafeTime(val: any): string {
  try {
    const d = toSafeDate(val);
    return new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(d);
  } catch {
    try {
      const d = toSafeDate(val);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
}

/**
 * Formats message timestamps using relative/date formatting (Feature 17):
 * - Just now (< 60s)
 * - Today, 2:15 PM (same day)
 * - Yesterday, 2:15 PM (previous day)
 * - Sep 29, 2:15 PM (earlier this year)
 * - Sep 29, 2025 (different year)
 */
export function formatMessageTimestamp(val: any, nowMs: number = Date.now()): string {
  try {
    const d = toSafeDate(val);
    const diffSec = Math.floor((nowMs - d.getTime()) / 1000);

    if (diffSec >= -5 && diffSec < 60) {
      return 'Just now';
    }

    const now = new Date(nowMs);
    const isSameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    const timeStr = formatSafeTime(d);

    if (isSameDay) {
      return timeStr ? `Today · ${timeStr}` : 'Today';
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    if (isYesterday) {
      return timeStr ? `Yesterday · ${timeStr}` : 'Yesterday';
    }

    const monthDay = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(d);

    if (d.getFullYear() === now.getFullYear()) {
      return timeStr ? `${monthDay} · ${timeStr}` : monthDay;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return formatSafeTime(val) || 'Just now';
  }
}
