// Browser & Search Master Control
const BROWSER_SEARCH_KEY = 'sigma_browser_search_enabled_v1';

export function isBrowserSearchEnabled(): boolean {
  try {
    const val = localStorage.getItem(BROWSER_SEARCH_KEY);
    return val !== null ? val === 'true' : true;
  } catch {
    return true;
  }
}

export function setBrowserSearchEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(BROWSER_SEARCH_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('sigma-browser-search-changed', { detail: { enabled } }));
  } catch (e) {
    console.error('Failed to save browser search setting:', e);
  }
}
