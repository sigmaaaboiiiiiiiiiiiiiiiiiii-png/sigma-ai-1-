export interface ThemeColorOption {
  id: string;
  name: string;
  hex: string;
  glow: string;
  bgSubtle: string;
  textClass: string;
  borderClass: string;
  isDarkText?: boolean;
}

function isLightHex(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65;
}

export const THEME_COLOR_OPTIONS: ThemeColorOption[] = [
  { id: 'green', name: 'Green', hex: '#00ea77', glow: 'rgba(0, 234, 119, 0.4)', bgSubtle: 'rgba(0, 234, 119, 0.12)', textClass: 'text-[#00ea77]', borderClass: 'border-[#00ea77]', isDarkText: true },
  { id: 'blue', name: 'Blue', hex: '#00d2ff', glow: 'rgba(0, 210, 255, 0.4)', bgSubtle: 'rgba(0, 210, 255, 0.12)', textClass: 'text-[#00d2ff]', borderClass: 'border-[#00d2ff]', isDarkText: true },
  { id: 'pink', name: 'Pink', hex: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', bgSubtle: 'rgba(244, 63, 94, 0.12)', textClass: 'text-[#f43f5e]', borderClass: 'border-[#f43f5e]', isDarkText: false },
  { id: 'yellow', name: 'Yellow', hex: '#ffb703', glow: 'rgba(255, 183, 3, 0.4)', bgSubtle: 'rgba(255, 183, 3, 0.12)', textClass: 'text-[#ffb703]', borderClass: 'border-[#ffb703]', isDarkText: true },
  { id: 'purple', name: 'Purple', hex: '#d900c7', glow: 'rgba(217, 0, 199, 0.4)', bgSubtle: 'rgba(217, 0, 199, 0.12)', textClass: 'text-[#d900c7]', borderClass: 'border-[#d900c7]', isDarkText: false },
  { id: 'orange', name: 'Orange', hex: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', bgSubtle: 'rgba(249, 115, 22, 0.12)', textClass: 'text-[#f97316]', borderClass: 'border-[#f97316]', isDarkText: false },
  { id: 'red', name: 'Red', hex: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', bgSubtle: 'rgba(239, 68, 68, 0.12)', textClass: 'text-[#ef4444]', borderClass: 'border-[#ef4444]', isDarkText: false },
  { id: 'teal', name: 'Teal', hex: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)', bgSubtle: 'rgba(20, 184, 166, 0.12)', textClass: 'text-[#14b8a6]', borderClass: 'border-[#14b8a6]', isDarkText: false },
  { id: 'cyan', name: 'Cyan', hex: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', bgSubtle: 'rgba(6, 182, 212, 0.12)', textClass: 'text-[#06b6d4]', borderClass: 'border-[#06b6d4]', isDarkText: true },
  { id: 'emerald', name: 'Emerald', hex: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', bgSubtle: 'rgba(16, 185, 129, 0.12)', textClass: 'text-[#10b981]', borderClass: 'border-[#10b981]', isDarkText: false },
  { id: 'indigo', name: 'Indigo', hex: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)', bgSubtle: 'rgba(99, 102, 241, 0.12)', textClass: 'text-[#6366f1]', borderClass: 'border-[#6366f1]', isDarkText: false },
];

export function getThemeColor(themeColor: string, customHex?: string): ThemeColorOption {
  if (themeColor === 'custom' && customHex && /^#[0-9A-Fa-f]{6}$/.test(customHex)) {
    return {
      id: 'custom',
      name: 'Custom',
      hex: customHex,
      glow: `${customHex}66`,
      bgSubtle: `${customHex}1f`,
      textClass: '',
      borderClass: '',
      isDarkText: isLightHex(customHex),
    };
  }
  const found = THEME_COLOR_OPTIONS.find((t) => t.id.toLowerCase() === themeColor.toLowerCase());
  return (
    found ||
    THEME_COLOR_OPTIONS[0] // Green by default
  );
}
