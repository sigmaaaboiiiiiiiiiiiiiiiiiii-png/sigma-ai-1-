/**
 * Guest Manager & Privacy-Preserving Device Recognition
 * 
 * Manages guest identities, local device recognition, browser cookie retention:
 * - Guest custom name is retained in browser cookies & localStorage for 1 month (30 days), then removed.
 * - Guest recent chats are retained in browser storage & cookies for 1 day (24 hours), then removed.
 * - Signed-in Google accounts retain name and chat history permanently.
 */
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface GuestProfile {
  guestId: string;
  name: string;
  displayName: string;
  deviceId: string;
  createdAt: string;
  lastActiveAt: string;
  isGuest: true;
  savedAt?: number;
  expiresAt?: number; // 1 month (30 days) from savedAt
  voiceSessionActive?: boolean;
  lastVoiceSessionAt?: string;
}

const STORAGE_KEY_PERSISTENT_GUEST_ID = 'sigma_persistent_guest_id';
const STORAGE_KEY_DEVICE_ID = 'sigma_guest_device_id';
const STORAGE_KEY_GUEST_PROFILE = 'sigma_guest_profile';
const STORAGE_KEY_GUEST_NAME = 'sigma_guest_name';
const STORAGE_KEY_GUEST_NAME_EXPIRES = 'sigma_guest_name_expires_at';
const STORAGE_KEY_GUEST_CONVS = 'sigma_guest_convs_v2';

// Expiration intervals
export const GUEST_NAME_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 1 month (30 days)
export const GUEST_CHATS_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1 day (24 hours)

/**
 * Cookie management helpers for browser storage
 */
export function setCookie(name: string, value: string, days: number): void {
  try {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (_) {}
}

export function getCookie(name: string): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + encodeURIComponent(name) + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  } catch (_) {
    return null;
  }
}

export function deleteCookie(name: string): void {
  try {
    if (typeof document === 'undefined') return;
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  } catch (_) {}
}

/**
 * Returns or creates a privacy-preserving device identifier stored purely in localStorage.
 */
export function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!deviceId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = 'dev_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      } else {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      }
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch {
    return 'dev_temp_' + Math.random().toString(36).substring(2, 10);
  }
}

/**
 * Returns the persistent guest ID stored in localStorage, if one was previously generated.
 */
export function getPersistentGuestId(): string | null {
  try {
    const directId = localStorage.getItem(STORAGE_KEY_PERSISTENT_GUEST_ID);
    if (directId && directId.trim()) return directId.trim();

    const raw = localStorage.getItem(STORAGE_KEY_GUEST_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.guestId) {
        localStorage.setItem(STORAGE_KEY_PERSISTENT_GUEST_ID, parsed.guestId);
        return parsed.guestId;
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Generates and saves a unique guestId for this device.
 */
export function createPersistentGuestId(): string {
  const existing = getPersistentGuestId();
  if (existing) return existing;

  const randPart = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
    : Math.random().toString(36).substring(2, 10);
  const newGuestId = `guest_${Date.now().toString(36)}_${randPart}`;
  try {
    localStorage.setItem(STORAGE_KEY_PERSISTENT_GUEST_ID, newGuestId);
  } catch (_) {}
  return newGuestId;
}

/**
 * Retrieves the stored guest profile from localStorage & cookies.
 * Automatically checks 1-month expiry: if older than 30 days, removes the custom name.
 */
export function getStoredGuestProfile(): GuestProfile | null {
  try {
    // Check 1-month expiration
    const expiryStr = localStorage.getItem(STORAGE_KEY_GUEST_NAME_EXPIRES);
    const expiresAt = expiryStr ? Number(expiryStr) : 0;
    const now = Date.now();

    if (expiresAt && now > expiresAt) {
      // 1 month passed -> automatically clear expired guest name
      localStorage.removeItem(STORAGE_KEY_GUEST_PROFILE);
      localStorage.removeItem(STORAGE_KEY_GUEST_NAME);
      localStorage.removeItem(STORAGE_KEY_GUEST_NAME_EXPIRES);
      deleteCookie('sigma_guest_name');
      return null;
    }

    const raw = localStorage.getItem(STORAGE_KEY_GUEST_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.expiresAt && now > parsed.expiresAt) {
        localStorage.removeItem(STORAGE_KEY_GUEST_PROFILE);
        localStorage.removeItem(STORAGE_KEY_GUEST_NAME);
        localStorage.removeItem(STORAGE_KEY_GUEST_NAME_EXPIRES);
        deleteCookie('sigma_guest_name');
        return null;
      }
      const name = parsed.name || parsed.displayName;
      if (parsed && parsed.guestId && name && name.trim()) {
        const normalized: GuestProfile = {
          guestId: parsed.guestId,
          name: name.trim(),
          displayName: name.trim(),
          deviceId: parsed.deviceId || getOrCreateDeviceId(),
          createdAt: parsed.createdAt || new Date().toISOString(),
          lastActiveAt: parsed.lastActiveAt || new Date().toISOString(),
          isGuest: true,
          savedAt: parsed.savedAt,
          expiresAt: parsed.expiresAt || (parsed.savedAt ? parsed.savedAt + GUEST_NAME_EXPIRY_MS : undefined),
          voiceSessionActive: Boolean(parsed.voiceSessionActive),
        };
        return normalized;
      }
    }

    // Check cookie fallback
    const cookieName = getCookie('sigma_guest_name');
    const savedName = cookieName || localStorage.getItem(STORAGE_KEY_GUEST_NAME);
    const guestId = getPersistentGuestId();
    if (savedName && savedName.trim() && savedName.trim() !== 'Guest User' && guestId) {
      const deviceId = getOrCreateDeviceId();
      const profile: GuestProfile = {
        guestId,
        name: savedName.trim(),
        displayName: savedName.trim(),
        deviceId,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        isGuest: true,
        savedAt: now,
        expiresAt: now + GUEST_NAME_EXPIRY_MS,
      };
      localStorage.setItem(STORAGE_KEY_GUEST_PROFILE, JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEY_GUEST_NAME_EXPIRES, String(profile.expiresAt));
      return profile;
    }
  } catch (err) {
    console.warn('Failed to parse stored guest profile:', err);
  }
  return null;
}

/**
 * Startup Restoration Flow: restores guest profile from local cache or Firestore.
 */
export async function restoreGuestProfile(): Promise<GuestProfile | null> {
  const localProfile = getStoredGuestProfile();
  const guestId = localProfile?.guestId || getPersistentGuestId();

  if (!guestId) {
    return null;
  }

  try {
    const docRef = doc(db, 'guests', guestId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const resolvedName = (data.name || data.displayName || localProfile?.name || localProfile?.displayName || 'Guest User').trim();
      const restoredProfile: GuestProfile = {
        guestId,
        name: resolvedName,
        displayName: resolvedName,
        deviceId: data.deviceId || localProfile?.deviceId || getOrCreateDeviceId(),
        createdAt: data.createdAt || localProfile?.createdAt || new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        isGuest: true,
        savedAt: localProfile?.savedAt || Date.now(),
        expiresAt: localProfile?.expiresAt || (Date.now() + GUEST_NAME_EXPIRY_MS),
        voiceSessionActive: Boolean(data.voiceSessionActive),
        lastVoiceSessionAt: data.lastVoiceSessionAt,
      };

      if (resolvedName && resolvedName !== 'Guest User') {
        localStorage.setItem(STORAGE_KEY_PERSISTENT_GUEST_ID, guestId);
        localStorage.setItem(STORAGE_KEY_GUEST_PROFILE, JSON.stringify(restoredProfile));
        localStorage.setItem(STORAGE_KEY_GUEST_NAME, resolvedName);
        localStorage.setItem(STORAGE_KEY_GUEST_NAME_EXPIRES, String(restoredProfile.expiresAt));
        localStorage.setItem('sigma_user_name_custom', resolvedName);
        setCookie('sigma_guest_name', resolvedName, 30);
      }

      await updateDoc(docRef, {
        lastActiveAt: restoredProfile.lastActiveAt,
      }).catch(() => {});

      return restoredProfile;
    }
  } catch (err) {
    console.warn('Network issue restoring guest profile:', err);
  }

  return localProfile;
}

/**
 * Saves guest profile in browser for 1 month (30 days).
 */
export async function saveGuestProfile(displayName: string): Promise<GuestProfile> {
  const cleanName = displayName.trim() || 'Guest User';
  const deviceId = getOrCreateDeviceId();
  const existing = getStoredGuestProfile();
  const guestId = existing?.guestId || getPersistentGuestId() || createPersistentGuestId();
  const now = Date.now();
  const expiresAt = now + GUEST_NAME_EXPIRY_MS; // 30 days retention

  const profile: GuestProfile = {
    guestId,
    name: cleanName,
    displayName: cleanName,
    deviceId,
    createdAt: existing?.createdAt || new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    isGuest: true,
    savedAt: now,
    expiresAt,
    voiceSessionActive: false,
  };

  // 1. Save locally to device (localStorage & cookie with 30-day expiry)
  try {
    localStorage.setItem(STORAGE_KEY_PERSISTENT_GUEST_ID, guestId);
    localStorage.setItem(STORAGE_KEY_GUEST_PROFILE, JSON.stringify(profile));
    localStorage.setItem(STORAGE_KEY_GUEST_NAME, cleanName);
    localStorage.setItem(STORAGE_KEY_GUEST_NAME_EXPIRES, String(expiresAt));
    localStorage.setItem('sigma_user_name_custom', cleanName);
    setCookie('sigma_guest_name', cleanName, 30);
  } catch (err) {
    console.warn('Could not save guest profile to localStorage:', err);
  }

  // 2. Persist to Firestore `guests/{guestId}`
  try {
    const guestDocRef = doc(db, 'guests', guestId);
    await setDoc(
      guestDocRef,
      {
        guestId,
        name: cleanName,
        displayName: cleanName,
        deviceId,
        createdAt: profile.createdAt,
        lastActiveAt: profile.lastActiveAt,
        isGuest: true,
        expiresAt: new Date(expiresAt).toISOString(),
        voiceSessionActive: false,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync guest profile to Firestore:', err);
  }

  return profile;
}

/**
 * Updates the guest display name in browser and Firestore.
 */
export async function updateGuestDisplayName(newName: string): Promise<GuestProfile> {
  return await saveGuestProfile(newName);
}

/**
 * Guest Recent Chats Management (1 Day / 24 Hours Retention):
 * Loads recent chats for guests from browser storage, automatically pruning any older than 24 hours.
 */
export function loadGuestConversations(): any[] {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(STORAGE_KEY_GUEST_CONVS);
    if (!raw) {
      // Fallback check legacy session storage
      const legacy = sessionStorage.getItem('sigma_guest_convs');
      if (legacy) {
        try {
          const parsedLegacy = JSON.parse(legacy);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            saveGuestConversations(parsedLegacy);
            return parsedLegacy;
          }
        } catch (_) {}
      }
      return [];
    }

    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    // Filter conversations: keep only those updated within the last 24 hours (1 day)
    const valid = list.filter((conv: any) => {
      const timestamp = new Date(conv.updatedAt || conv.createdAt || 0).getTime();
      return now - timestamp <= GUEST_CHATS_EXPIRY_MS;
    });

    // If some conversations expired, save back the pruned list
    if (valid.length !== list.length) {
      localStorage.setItem(STORAGE_KEY_GUEST_CONVS, JSON.stringify(valid));
      if (valid.length === 0) {
        deleteCookie('sigma_guest_chats_active');
      }
    }

    return valid;
  } catch (err) {
    console.warn('Failed to load guest conversations:', err);
    return [];
  }
}

/**
 * Saves guest conversations in browser storage with 1-day (24-hour) expiration.
 */
export function saveGuestConversations(conversations: any[]): void {
  try {
    const now = Date.now();
    // Only store conversations within 24 hours
    const valid = conversations.filter((conv: any) => {
      const timestamp = new Date(conv.updatedAt || conv.createdAt || now).getTime();
      return now - timestamp <= GUEST_CHATS_EXPIRY_MS;
    });

    localStorage.setItem(STORAGE_KEY_GUEST_CONVS, JSON.stringify(valid));
    setCookie('sigma_guest_chats_active', 'true', 1); // 1-day cookie
  } catch (err) {
    console.warn('Failed to save guest conversations:', err);
  }
}
