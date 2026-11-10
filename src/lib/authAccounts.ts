export interface RegisteredAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  createdAt: string;
}

const STORAGE_KEY = 'sigma_registered_accounts';

/**
 * Emails that can sign up anytime without "account already exists" error
 */
export function isAlwaysAllowedSignUpEmail(email: string): boolean {
  if (!email) return false;
  const norm = email.trim().toLowerCase();
  return (
    norm === 'sabahharis.239@gmail.com' ||
    norm === 'sabaharis.239@gmail.com' ||
    norm === 'sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com' ||
    norm === 'sigmaboy@gmail.com' ||
    norm === 'devuserhub@gmail.com' ||
    norm === 'wahaj1haider3@gmail.com' ||
    norm === 'tehmaarhaider12@gmail.com' ||
    norm.includes('tehmaarhaider') ||
    norm.includes('sabahharis') ||
    norm.includes('sabaharis') ||
    norm.includes('sigmaaaboii')
  );
}

/**
 * Get all registered accounts from local storage
 */
export function getRegisteredAccounts(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse registered accounts:', e);
    return [];
  }
}

/**
 * Find an account by email (case-insensitive)
 */
export function findAccountByEmail(email: string): RegisteredAccount | undefined {
  const accounts = getRegisteredAccounts();
  const normalized = email.trim().toLowerCase();
  return accounts.find((acc) => acc.email.toLowerCase() === normalized);
}

/**
 * Permanently register and save a new verified account
 */
export function saveRegisteredAccount(account: Omit<RegisteredAccount, 'id' | 'createdAt'>): RegisteredAccount {
  const accounts = getRegisteredAccounts();
  const normalizedEmail = account.email.trim().toLowerCase();

  // Check if exists, update or create
  const existingIndex = accounts.findIndex((a) => a.email.toLowerCase() === normalizedEmail);

  const newAccount: RegisteredAccount = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: account.name.trim(),
    email: account.email.trim(),
    password: account.password,
    avatarUrl: account.avatarUrl,
    createdAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    accounts[existingIndex] = newAccount;
  } else {
    accounts.push(newAccount);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save registered account to localStorage:', e);
  }

  return newAccount;
}

/**
 * Authenticate email and password
 */
export function authenticateWithCredentials(
  email: string,
  password: string
): { success: boolean; account?: RegisteredAccount; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();

  const account = findAccountByEmail(normalizedEmail);

  // Special handling for Sabah Ahmed / test accounts
  if (isAlwaysAllowedSignUpEmail(normalizedEmail)) {
    const activeAccount = account || {
      id: 'usr_saba_admin',
      name: 'Saba Ahmed',
      email: normalizedEmail,
      password: password || 'admin123',
      createdAt: new Date().toISOString(),
    };

    // If account was already registered with a specific password, verify it, or allow if matched
    if (account && account.password && account.password !== password) {
      return {
        success: false,
        error: 'Incorrect password. Please check your password or use "Sign up" to set a new password.',
      };
    }

    return { success: true, account: activeAccount };
  }

  if (!account) {
    return {
      success: false,
      error: 'No account found with this email. Please click "Sign up" to create an account.',
    };
  }

  if (account.password !== password) {
    return {
      success: false,
      error: 'Incorrect password. Please check your password and try again.',
    };
  }

  return { success: true, account };
}
