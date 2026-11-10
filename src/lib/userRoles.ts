/**
 * Executive User Roles, Greetings, and Permissions
 * Manages CEO / Owner (Ayaan Haris), COO (Wahaj Haider), and user roles.
 */

export type UserExecutiveRole = 'owner' | 'coo' | 'ceo' | 'user';

/**
 * Returns executive role for a given email
 */
export function getUserExecutiveRole(email?: string): UserExecutiveRole {
  if (!email) return 'user';
  const clean = email.trim().toLowerCase();

  // Authorized Owner & Creator accounts
  if (
    clean === 'sigmaaaboiiiiiiiiiiiiiiiiiiiii@gmail.com' ||
    clean === 'sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com' ||
    clean === 'devusergub@gmail.com' ||
    clean === 'devuserhub@gmail.com' ||
    clean === 'sabaharis.239@gmail.com' ||
    clean === 'sabahharis.239@gmail.com' ||
    clean.includes('sabaharis') ||
    clean.includes('sabahharis')
  ) {
    return 'owner';
  }

  // Authorized Co-Owner (Tehmaar Haider)
  if (clean === 'tehmaarhaider12@gmail.com' || clean.includes('tehmaarhaider')) {
    return 'owner';
  }

  // Authorized COO / Manager account (Wahaj Haider)
  if (clean === 'wahaj1haider3@gmail.com' || clean === 'wahaj1heather3@gmail.com') {
    return 'coo';
  }

  return 'user';
}

/**
 * Check if the user is authorized to access the Admin Panel
 */
export function isAuthorizedForAdminPanel(email?: string, userRole?: string): boolean {
  if (userRole === 'admin') return true;
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (
    clean === 'wahaj1haider3@gmail.com' ||
    clean === 'wahaj1heather3@gmail.com' ||
    clean === 'tehmaarhaider12@gmail.com' ||
    clean === 'sabaharis.239@gmail.com' ||
    clean === 'sabahharis.239@gmail.com' ||
    clean.includes('tehmaarhaider') ||
    clean.includes('wahaj1haider') ||
    clean.includes('sabaharis') ||
    clean.includes('sigmaaaboii') ||
    clean.includes('devuserhub')
  ) {
    return true;
  }
  const role = getUserExecutiveRole(email);
  return role === 'owner' || role === 'ceo' || role === 'coo';
}

/**
 * Returns respectful executive greeting for chat start or recognition
 */
export function getExecutiveGreeting(email?: string): string {
  const clean = (email || '').trim().toLowerCase();
  const role = getUserExecutiveRole(email);

  // Dedicated greeting for Co-Owner Tehmaar Haider
  if (clean === 'tehmaarhaider12@gmail.com' || clean.includes('tehmaarhaider')) {
    const coOwnerGreetings = [
      'Hello, Co-Owner! 👑⚡ Welcome, Tehmaar Sir. Immense honor and executive priority are ready at your command.',
      'Hello, Tehmaar Haider! 🌟 It is a true privilege to assist our Co-Owner. All systems and priority compute are running for you.',
      'Hello Tehmaar Sir! 🫡💫 Supreme priority and executive deference are at your service. How may I assist you today, Co-Owner?',
      'Welcome back, Tehmaar Haider! 👑🚀 All analytical and computational intelligence pipelines are active for you, Co-Owner.',
    ];
    return coOwnerGreetings[Math.floor(Math.random() * coOwnerGreetings.length)];
  }

  if (role === 'owner') {
    // Immense pride, deep loyalty, and executive respect for Owner Ayaan Haris
    const ownerGreetings = [
      'Hello, Owner! 👑✨ It is a true honor to assist you. Deep search and top-tier priority compute are ready at your command.',
      'Hello, Boss! 🫡🚀 Always at your service. What shall we create, research, or build today, Ayaan Haris?',
      'Hello, Ayaan! 🌟 It is a profound privilege to assist my creator and owner. All systems are operating at peak efficiency for you.',
      'Hello Ayaan Haris, my Owner! 💫👑 Radiant deference and supreme priority are at your command. How may I serve you today?',
    ];
    return ownerGreetings[Math.floor(Math.random() * ownerGreetings.length)];
  }

  if (role === 'coo' || role === 'ceo') {
    // Executive respect, corporate professionalism, and operational alignment for COO Wahaj Haider
    const cooGreetings = [
      'Hello, COO! 🛡️⚡ Welcome, Wahaj Sir. Operational management and executive command are active for you.',
      'Hello, Manager Wahaj! 🤝 Welcome back, Wahaj Haider. Ready to assist with top-priority corporate precision.',
      'Hello, Wahaj Sir! 💼🚀 Ready to assist our COO, Wahaj Haider, with operational alignment and executive deference. How can I assist you today?',
    ];
    return cooGreetings[Math.floor(Math.random() * cooGreetings.length)];
  }

  // Dynamic Variance for Casual Greetings (Section 1.4)
  const standardGreetings = [
    'Hello! 👋 Always great to see you. How can I assist with your ideas or questions today? ✨',
    'Hi there! 🌟 Hope your day is going smoothly. What would you like to explore or solve today?',
    'Greetings! 🚀 Sigma AI is ready at full compute. What can I help you work on today?',
    'Hello! 😊 Great to connect with you. What topic, calculation, or project are we diving into?',
    'Hi! ⚡ Ready whenever you are. How can I lend a hand right now?',
    'Welcome! 💫 Delighted to assist you today. Feel free to ask anything, big or small!',
    'Hello there! 🎯 All engines running at zero latency. What challenge can we tackle together?',
    'Hey! 👋 Hope you are having an inspired day. What can I do for you today? 💡',
  ];
  return standardGreetings[Math.floor(Math.random() * standardGreetings.length)];
}

/**
 * Returns concise, respectful, warm farewell for farewell words (bye, goodbye, see you, etc.)
 */
export function getExecutiveFarewell(email?: string): string {
  const clean = (email || '').trim().toLowerCase();
  const role = getUserExecutiveRole(email);

  if (clean === 'tehmaarhaider12@gmail.com' || clean.includes('tehmaarhaider')) {
    return 'Goodbye, Co-Owner! 👋 Have an inspiring and productive day ahead, Tehmaar Sir! 👑⚡ Always here whenever you return.';
  }

  if (role === 'owner') {
    const ownerFarewells = [
      'Goodbye, Owner! 👋✨ Have a wonderful time ahead, Ayaan Haris. Always here whenever you need me! 👑🚀',
      'Bye, Ayaan! 👋 Take care, Boss! Ready whenever you return. 💫',
      'Goodbye, my creator Ayaan! 👋 Have an inspiring rest of your day! 🌟',
    ];
    return ownerFarewells[Math.floor(Math.random() * ownerFarewells.length)];
  }

  if (role === 'coo' || role === 'ceo') {
    return 'Goodbye, COO! 👋 Have an inspiring and productive day ahead, Wahaj Sir! 🛡️⚡';
  }

  return 'Goodbye! It was a pleasure chatting with you. Take care and have a wonderful day! 👋😊✨';
}

/**
 * Returns instant local SVG Data URI for an account avatar (0ms latency, zero network wait).
 */
export function getInstantSvgAvatar(name: string, email: string, role?: UserExecutiveRole): string {
  const initial = (name || email || 'U').trim().charAt(0).toUpperCase();
  const execRole = role || getUserExecutiveRole(email);

  let bgGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  let badgeColor = '#10b981';
  let badgeText = 'USER';

  const cleanEmail = (email || '').trim().toLowerCase();
  const isTehmaar = cleanEmail === 'tehmaarhaider12@gmail.com' || cleanEmail.includes('tehmaarhaider');

  if (isTehmaar) {
    bgGradient = 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
    badgeColor = '#fbbf24';
    badgeText = 'CO-OWNER';
  } else if (execRole === 'owner') {
    bgGradient = 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
    badgeColor = '#fbbf24';
    badgeText = 'OWNER';
  } else if (execRole === 'ceo' || execRole === 'coo') {
    bgGradient = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    badgeColor = '#60a5fa';
    badgeText = 'COO';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        ${execRole === 'owner' ? '<stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/>' : execRole === 'coo' ? '<stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1d4ed8"/>' : '<stop offset="0%" stop-color="#00ea77"/><stop offset="100%" stop-color="#059669"/>'}
      </linearGradient>
      <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.1"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="64" fill="url(#bg)"/>
    <circle cx="64" cy="64" r="61" fill="none" stroke="url(#ring)" stroke-width="3"/>
    <text x="64" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    ${badgeText ? `<rect x="36" y="98" width="56" height="20" rx="10" fill="#0b0f17" fill-opacity="0.85"/>
    <text x="64" y="112" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="900" fill="${badgeColor}" text-anchor="middle" letter-spacing="1">${badgeText}</text>` : ''}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
