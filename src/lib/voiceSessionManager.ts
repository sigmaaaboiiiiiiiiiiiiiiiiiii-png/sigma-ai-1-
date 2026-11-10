/**
 * Voice Session Manager & Explicit Opt-In Controls
 * 
 * Enforces strict zero background listening:
 * 1. Explicit user opt-in required to start voice session.
 * 2. Visual indicator while active (`🎙 Voice session active`).
 * 3. Separate Live Quality Monitoring opt-in flag.
 * 4. Structured Firebase storage in `users/{userId}/voiceSessions/{sessionId}` or `guests/{guestId}/voiceSessions/{sessionId}`.
 * 5. Data deletion controls.
 */
import { doc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, updateActiveSessionVoiceState } from './firebase';

export interface VoiceSessionRecord {
  sessionId: string;
  userId?: string;
  guestId?: string;
  userType: 'authenticated' | 'guest';
  displayName: string;
  startedAt: string;
  endedAt?: string;
  duration: number; // in seconds
  voiceEnabled: boolean;
  transcript?: string;
  language: string;
  status: 'active' | 'completed' | 'stopped';
  qualityMonitoringEnabled: boolean;
}

const STORAGE_KEY_VOICE_TRANSCRIPTION = 'sigma_voice_transcription_opt_in';
const STORAGE_KEY_QUALITY_MONITORING = 'sigma_voice_quality_monitoring_opt_in';

/**
 * Returns whether user consented to storing/transcribing voice conversations.
 * Defaults to true for AI conversational context, but user can disable at any time in Settings.
 */
export function isVoiceTranscriptionEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY_VOICE_TRANSCRIPTION);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

export function setVoiceTranscriptionEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_VOICE_TRANSCRIPTION, String(enabled));
  } catch (_) {}
}

/**
 * Returns whether user explicitly enabled "Live Quality Monitoring".
 * Defaults to false (strict opt-in).
 */
export function isLiveQualityMonitoringEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY_QUALITY_MONITORING);
    return val === 'true';
  } catch {
    return false;
  }
}

export function setLiveQualityMonitoringEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_QUALITY_MONITORING, String(enabled));
  } catch (_) {}
}

/**
 * Checks current browser microphone permission status.
 */
export async function checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return 'prompt';
  }
  try {
    // Some browsers support querying 'microphone' permission name
    const permissionStatus = await (navigator.permissions as any).query({ name: 'microphone' });
    return permissionStatus.state as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'prompt';
  }
}

/**
 * Starts a new tracked voice session in Firestore after user explicitly initiated it.
 */
export async function createVoiceSession(params: {
  userId?: string;
  guestId?: string;
  userType: 'authenticated' | 'guest';
  displayName: string;
  language?: string;
}): Promise<VoiceSessionRecord> {
  const sessionId = 'v_sess_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 12) : Date.now().toString(36));
  const startedAt = new Date().toISOString();
  const qualityMonitoring = isLiveQualityMonitoringEnabled();

  const session: VoiceSessionRecord = {
    sessionId,
    userId: params.userId,
    guestId: params.guestId,
    userType: params.userType,
    displayName: params.displayName || (params.userType === 'authenticated' ? 'User' : 'Guest'),
    startedAt,
    duration: 0,
    voiceEnabled: true,
    language: params.language || 'English',
    status: 'active',
    qualityMonitoringEnabled: qualityMonitoring,
  };

  try {
    const parentPath = params.userType === 'authenticated' && params.userId
      ? `users/${params.userId}/voiceSessions`
      : `guests/${params.guestId || 'default'}/voiceSessions`;

    const sessionDocRef = doc(db, parentPath, sessionId);
    await setDoc(sessionDocRef, {
      ...session,
      updatedAt: startedAt,
    });

    // Also update parent doc voiceSessionActive flag
    if (params.userType === 'authenticated' && params.userId) {
      await updateDoc(doc(db, 'users', params.userId), {
        voiceSessionActive: true,
        lastVoiceSessionAt: startedAt,
      }).catch(() => {});
    } else if (params.guestId) {
      await updateDoc(doc(db, 'guests', params.guestId), {
        voiceSessionActive: true,
        lastVoiceSessionAt: startedAt,
      }).catch(() => {});
    }

    // Synchronize to real-time active session presence
    const activeSessId = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('sigma_active_session_id') || localStorage.getItem('sigma_client_id'))
      : null;
    if (activeSessId) {
      await updateActiveSessionVoiceState(activeSessId, {
        voiceSession: true,
        audioStream: 'connected',
        microphonePermission: 'granted',
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Could not record voice session start to Firestore:', err);
  }

  return session;
}

/**
 * Ends a voice session and persists duration, transcript (if permitted), and status.
 */
export async function finishVoiceSession(params: {
  session: VoiceSessionRecord;
  transcript?: string;
}): Promise<void> {
  const endedAt = new Date().toISOString();
  const startTime = new Date(params.session.startedAt).getTime();
  const durationSec = Math.max(1, Math.round((new Date().getTime() - startTime) / 1000));
  const allowTranscript = isVoiceTranscriptionEnabled();

  const updatedRecord = {
    endedAt,
    duration: durationSec,
    status: 'completed' as const,
    voiceEnabled: false,
    ...(allowTranscript && params.transcript ? { transcript: params.transcript } : {}),
  };

  try {
    const parentPath = params.session.userType === 'authenticated' && params.session.userId
      ? `users/${params.session.userId}/voiceSessions`
      : `guests/${params.session.guestId || 'default'}/voiceSessions`;

    const sessionDocRef = doc(db, parentPath, params.session.sessionId);
    await updateDoc(sessionDocRef, updatedRecord);

    // Turn off parent doc voiceSessionActive
    if (params.session.userType === 'authenticated' && params.session.userId) {
      await updateDoc(doc(db, 'users', params.session.userId), {
        voiceSessionActive: false,
      }).catch(() => {});
    } else if (params.session.guestId) {
      await updateDoc(doc(db, 'guests', params.session.guestId), {
        voiceSessionActive: false,
      }).catch(() => {});
    }

    // Synchronize to real-time active session presence
    const activeSessId = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('sigma_active_session_id') || localStorage.getItem('sigma_client_id'))
      : null;
    if (activeSessId) {
      await updateActiveSessionVoiceState(activeSessId, {
        voiceSession: false,
        audioStream: 'disconnected',
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Could not finalize voice session in Firestore:', err);
  }
}

/**
 * Fetches all voice sessions for an authenticated user or guest.
 */
export async function fetchVoiceSessions(params: {
  userId?: string;
  guestId?: string;
  userType: 'authenticated' | 'guest';
}): Promise<VoiceSessionRecord[]> {
  try {
    const parentPath = params.userType === 'authenticated' && params.userId
      ? `users/${params.userId}/voiceSessions`
      : `guests/${params.guestId || 'default'}/voiceSessions`;

    const colRef = collection(db, parentPath);
    const snap = await getDocs(colRef);
    const sessions: VoiceSessionRecord[] = [];
    snap.forEach((docSnap) => {
      sessions.push(docSnap.data() as VoiceSessionRecord);
    });
    return sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  } catch (err) {
    console.warn('Could not fetch voice sessions:', err);
    return [];
  }
}

/**
 * Privacy Control: Deletes all stored voice session data for a user or guest.
 */
export async function deleteVoiceSessionsForUserOrGuest(params: {
  userId?: string;
  guestId?: string;
  userType: 'authenticated' | 'guest';
}): Promise<boolean> {
  try {
    const parentPath = params.userType === 'authenticated' && params.userId
      ? `users/${params.userId}/voiceSessions`
      : `guests/${params.guestId || 'default'}/voiceSessions`;

    const colRef = collection(db, parentPath);
    const snap = await getDocs(colRef);
    const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    return true;
  } catch (err) {
    console.error('Failed to delete voice session data:', err);
    return false;
  }
}
