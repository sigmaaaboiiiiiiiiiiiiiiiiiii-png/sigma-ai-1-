import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles, UserCircle } from 'lucide-react';
import { UserProfile } from '../types';
import {
  findAccountByEmail,
  authenticateWithCredentials,
  saveRegisteredAccount,
  isAlwaysAllowedSignUpEmail,
} from '../lib/authAccounts';
import { getEmailAvatarUrl } from '../lib/avatarHelper';
import { recordUserToFirestoreRegistry, recordSecurityAuditLog } from '../lib/firebase';
import { validateAccountName } from '../lib/nameModeration';
import { getStoredGuestProfile, saveGuestProfile } from '../lib/guestManager';

interface WelcomeSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onSuccessLogin: (profile: UserProfile) => void;
  onContinueAsGuest?: (guestName: string) => Promise<void> | void;
  themeColorHex?: string;
  isGoogleLoading?: boolean;
}

export const WelcomeSignInModal: React.FC<WelcomeSignInModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  onSuccessLogin,
  onContinueAsGuest,
  themeColorHex = '#00ea77',
  isGoogleLoading = false,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isGuestStep, setIsGuestStep] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestNameError, setGuestNameError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestNameError(null);
    const cleanGuestName = guestName.trim();

    if (!cleanGuestName) {
      setGuestNameError('Please provide your name before continuing.');
      return;
    }

    const safety = validateAccountName(cleanGuestName, {
      email: 'guest@sigma.ai',
      isLoggedIn: false,
      authProvider: 'guest',
    }, { recordStrikeOnFail: false });

    if (!safety.valid) {
      setGuestNameError(safety.message || 'Please choose a different name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveGuestProfile(cleanGuestName);
      if (onContinueAsGuest) {
        await onContinueAsGuest(cleanGuestName);
      }
      onClose();
    } catch (err: any) {
      setGuestNameError(err?.message || 'Could not save guest name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateGuest = () => {
    const stored = getStoredGuestProfile();
    if (stored && stored.displayName && stored.displayName.trim() && stored.displayName !== 'Guest User') {
      // Returning guest recognized on this device
      if (onContinueAsGuest) {
        onContinueAsGuest(stored.displayName);
      }
      onClose();
    } else {
      // First-time guest on this device: Ask "What's your name?"
      setIsGuestStep(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setNameError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 4) {
      setAuthError('Password must be at least 4 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (!cleanName) {
          setNameError('Please enter your full name to sign up.');
          setIsSubmitting(false);
          return;
        }

        const nameSafety = validateAccountName(cleanName, cleanEmail, { recordStrikeOnFail: true });
        if (!nameSafety.valid) {
          setNameError(
            nameSafety.message ||
              'This name cannot be used. Please choose another display name.'
          );
          setIsSubmitting(false);
          return;
        }

        const existing = findAccountByEmail(cleanEmail);
        if (existing && !isAlwaysAllowedSignUpEmail(cleanEmail)) {
          setAuthError('An account with this email already exists. Please sign in instead.');
          setIsSubmitting(false);
          return;
        }

        // Save permanent account
        const registered = saveRegisteredAccount({
          name: cleanName,
          email: cleanEmail,
          password: password,
          avatarUrl: getEmailAvatarUrl(cleanEmail, cleanName),
        });

        const isAdmin =
          cleanEmail === 'sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com' ||
          cleanEmail === 'devuserhub@gmail.com' ||
          cleanEmail === 'sabaharis.239@gmail.com' ||
          cleanEmail === 'sabahharis.239@gmail.com' ||
          cleanEmail === 'tehmaarhaider12@gmail.com' ||
          cleanEmail === 'wahaj1haider3@gmail.com' ||
          cleanEmail.includes('tehmaarhaider') ||
          cleanEmail.includes('sabaharis') ||
          cleanEmail.includes('sabahharis');

        const profile: UserProfile = {
          id: registered.id,
          isLoggedIn: true,
          name: registered.name,
          email: registered.email,
          avatarUrl: registered.avatarUrl,
          role: isAdmin ? 'admin' : 'user',
        };

        // Record to Firestore user registry and security audit logs
        recordUserToFirestoreRegistry({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          authProvider: 'Email/Password Registration',
        });
        recordSecurityAuditLog({
          event: 'REGISTER_SUCCESS',
          userEmail: profile.email,
          status: 'SUCCESS',
          details: `New user account created via Email: ${profile.email}`,
        });

        onSuccessLogin(profile);
        onClose();
      } else {
        // Sign In
        const authRes = authenticateWithCredentials(cleanEmail, password);
        if (!authRes.success || !authRes.account) {
          recordSecurityAuditLog({
            event: 'LOGIN_FAILED',
            userEmail: cleanEmail,
            status: 'FAILED',
            details: 'Incorrect password or account not found',
          });
          setAuthError(authRes.error || 'Incorrect email or password. Please try again.');
          setIsSubmitting(false);
          return;
        }

        const existing = authRes.account;
        const isAdmin =
          cleanEmail === 'sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com' ||
          cleanEmail === 'devuserhub@gmail.com' ||
          cleanEmail === 'sabaharis.239@gmail.com' ||
          cleanEmail === 'sabahharis.239@gmail.com' ||
          cleanEmail === 'tehmaarhaider12@gmail.com' ||
          cleanEmail === 'wahaj1haider3@gmail.com' ||
          cleanEmail.includes('tehmaarhaider') ||
          cleanEmail.includes('sabaharis') ||
          cleanEmail.includes('sabahharis');

        const profile: UserProfile = {
          id: existing.id,
          isLoggedIn: true,
          name: existing.name,
          email: existing.email,
          avatarUrl: existing.avatarUrl || getEmailAvatarUrl(existing.email, existing.name),
          role: isAdmin ? 'admin' : 'user',
        };

        // Record to Firestore user registry and security audit logs
        recordUserToFirestoreRegistry({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          lastLoginAt: new Date().toISOString(),
          authProvider: 'Email/Password Sign-In',
        });
        recordSecurityAuditLog({
          event: 'LOGIN_SUCCESS',
          userEmail: profile.email,
          status: 'SUCCESS',
          details: `User signed in via Email: ${profile.email}`,
        });

        onSuccessLogin(profile);
        onClose();
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="welcome-signin-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="welcome-signin-dialog"
        className="relative bg-[#13151b] rounded-3xl border border-white/10 p-6 sm:p-8 max-w-[440px] w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {isGuestStep ? (
          /* Guest Name Step (Requirement 2: What's your name?) */
          <div className="space-y-4">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 shadow-md mb-1 text-slate-300">
                <UserCircle className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                What's your name?
              </h2>
              <p className="text-xs text-slate-400">
                Provide your name to continue as a guest (saved on this browser for 1 month; chats kept for 24 hours).
              </p>
            </div>

            {guestNameError && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{guestNameError}</span>
              </div>
            )}

            <form onSubmit={handleGuestSubmit} className="space-y-3">
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  id="welcome-guest-name-input"
                  type="text"
                  required
                  autoFocus
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (guestNameError) setGuestNameError(null);
                  }}
                  placeholder="Your display name"
                  className="w-full bg-[#1b1e27] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <button
                id="welcome-guest-continue-btn"
                type="submit"
                disabled={isSubmitting || !guestName.trim()}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide transition-all cursor-pointer shadow-lg text-black active:scale-[0.99] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                style={{
                  backgroundColor: themeColorHex,
                  boxShadow: `0 4px 20px ${themeColorHex}40`,
                }}
              >
                <span>{isSubmitting ? 'Saving...' : 'Continue as Guest'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsGuestStep(false);
                  setGuestNameError(null);
                }}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer transition-colors"
              >
                Back to Sign in / Create Account
              </button>
            </div>
          </div>
        ) : (
          /* Normal Sign In / Sign Up Flow */
          <>
            {/* Top Decorative Header */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black border border-white/10 shadow-md mb-2 overflow-hidden">
                <img
                  src="/sigma_logo.jpg"
                  alt="Sigma AI"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Welcome back, sign in
              </h2>
              <p className="text-xs text-slate-400">
                {isSignUp
                  ? 'Create your permanent account to remember chats and memories'
                  : 'Sign in with your account or continue with Google to retain your brain context'}
              </p>
            </div>

            {/* Google Sign-in Button */}
            <button
              id="welcome-google-signin-btn"
              type="button"
              disabled={isGoogleLoading}
              onClick={async () => {
                setAuthError(null);
                try {
                  await onGoogleSignIn();
                  onClose();
                } catch (e: any) {
                  console.error('Welcome modal sign-in error:', e);
                  if (e?.code === 'auth/popup-blocked') {
                    setAuthError('Google sign-in popup was blocked by your browser. Please allow popups or open this app in a new tab.');
                  } else if (e?.code === 'auth/popup-closed-by-user') {
                    setAuthError('Google sign-in popup was closed before completing. Please try again.');
                  } else if (e?.code === 'auth/unauthorized-domain') {
                    setAuthError('This domain is not in Firebase Auth authorized domains list.');
                  } else {
                    setAuthError(e?.message || 'Google Sign-in failed. Please try again or sign in with email/password.');
                  }
                }
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#1e212b] hover:bg-[#272b38] border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span className="font-semibold text-slate-200">
                {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </span>
            </button>

            {/* OR Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="w-full border-t border-white/10" />
              <span className="absolute px-3 bg-[#13151b] text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
                OR
              </span>
            </div>

            {/* Error Alert */}
            {authError && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <div className="space-y-1.5">
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      id="welcome-input-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setAuthError(null);
                        if (nameError) setNameError(null);
                      }}
                      placeholder="Full name"
                      className={`w-full bg-[#1b1e27] border ${
                        nameError ? 'border-red-500' : 'border-white/10'
                      } rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors`}
                    />
                  </div>
                  {nameError && (
                    <div
                      id="welcome-name-validation-error"
                      className="px-3 py-2 rounded-xl bg-red-950/45 border border-red-500/50 text-red-400 text-xs font-semibold flex items-start gap-2 text-left animate-in fade-in"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{nameError}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  id="welcome-input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setAuthError(null);
                  }}
                  placeholder="Email address"
                  className="w-full bg-[#1b1e27] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  id="welcome-input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setAuthError(null);
                  }}
                  placeholder="Password"
                  className="w-full bg-[#1b1e27] border border-white/10 rounded-2xl pl-11 pr-11 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit Button */}
              <button
                id="welcome-auth-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide transition-all cursor-pointer shadow-lg text-black active:scale-[0.99] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                style={{
                  backgroundColor: themeColorHex,
                  boxShadow: `0 4px 20px ${themeColorHex}40`,
                }}
              >
                <span>{isSubmitting ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Mode Toggle & Guest Option */}
            <div className="pt-2 flex flex-col items-center gap-2 text-xs">
              <div className="text-slate-400">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setAuthError(null);
                  }}
                  className="text-white font-semibold underline hover:text-slate-200 cursor-pointer ml-1"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </div>

              <button
                id="welcome-continue-guest-btn"
                type="button"
                onClick={handleInitiateGuest}
                className="text-xs text-slate-400 hover:text-white font-medium underline pt-1 cursor-pointer transition-colors"
              >
                Continue as Guest
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WelcomeSignInModal;
