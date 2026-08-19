const AUTH_CODES = {
  'auth/email-already-in-use':
    'That email is already registered. Try signing in instead.',
  'auth/invalid-email': 'That email address is not valid. Check it and try again.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found':
    'No account was found with that email. Check the email or create a new account.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password. Please try again.',
  'auth/invalid-login-credential': 'Incorrect email or password. Please try again.',
  'auth/too-many-requests':
    'Too many failed attempts. Please wait a moment and try again.',
  'auth/network-request-failed':
    'Could not reach the sign-in server. Check your connection and try again.',
  'auth/popup-closed-by-user':
    'The sign-in window was closed. Try again when you are ready.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled. Try again.',
  'auth/operation-not-allowed': 'This sign-in method is not available right now.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
  'auth/weak-password': 'That password is too weak. Use at least 6 characters.',
  'auth/requires-recent-login':
    'For security, please sign in again before doing this.',
};

const HINTS = [
  ['permission-denied', 'You do not have permission to do that.'],
  ['insufficient permissions', 'You do not have permission to do that.'],
  ['client is offline', 'You appear to be offline. Check your connection and try again.'],
  ['unavailable', 'Could not reach the server. Check your connection and try again.'],
  ['network-request-failed', 'Could not connect to the network. Check your connection and try again.'],
];

export function friendlyError(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;

  const raw = (err?.message || err || '').toString();
  const lower = raw.toLowerCase();

  // Camera / face / geolocation errors already arrive as plain English —
  // check these FIRST so a camera "Permission denied" is not mistaken for a
  // Firestore permissions error.
  if (
    lower.includes('camera') ||
    lower.includes('face') ||
    lower.includes('geolocation') ||
    lower.includes('location') ||
    lower.includes('gps') ||
    lower.includes('precise') ||
    lower.includes('classroom pin') ||
    lower.includes('class pin') ||
    lower.includes('notallowederror') ||
    lower.includes('notfounderror') ||
    lower.includes('notreadableerror')
  ) {
    return raw;
  }

  // Firebase auth codes look like "Firebase: Error (auth/wrong-password)."
  const codeMatch = lower.match(/firebase.*?\(([a-z-]+\/[a-z-]+)\)/);
  if (codeMatch) {
    const code = codeMatch[1].toLowerCase();
    if (AUTH_CODES[code]) return AUTH_CODES[code];
    return fallback; // unknown auth code — never leak the raw message
  }

  for (const [needle, message] of HINTS) {
    if (lower.includes(needle)) return message;
  }

  // Anything still carrying the "Firebase:" prefix gets swallowed.
  if (lower.startsWith('firebase')) return fallback;

  return raw || fallback;
}
