const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "Wrong email or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-email": "Enter your email address.",
  "auth/email-already-in-use": "An account with this email already exists. Sign in instead.",
  "auth/weak-password": "Choose a stronger password (at least 6 characters).",
  "auth/too-many-requests": "Too many tries. Wait a minute and try again.",
  "auth/network-request-failed": "Connection problem. Check your internet and try again.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
  "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups and try again.",
  "auth/popup-closed-by-user": "The sign-in window was closed before finishing.",
  "auth/cancelled-popup-request": "The sign-in window was closed before finishing.",
  "auth/account-exists-with-different-credential": "This email is registered with a different sign-in method.",
  "permission-denied": "Couldn't finish setting up your account. Please try again.",
};

/** Turns a Firebase error into text a user can act on; never shows raw SDK messages. */
export function authErrorMessage(err: unknown, fallback: string): string {
  const code = (err as { code?: unknown })?.code;
  if (typeof code === "string" && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  const message = (err as { message?: unknown })?.message;
  // Messages from our own API routes are already written for users; SDK messages are not.
  if (typeof message === "string" && message && !/firebase|auth\/|permission/i.test(message)) return message;
  return fallback;
}

/** Only same-site paths are honoured as post-login destinations. */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
