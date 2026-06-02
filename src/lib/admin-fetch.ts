import { auth } from "./firebase";

/**
 * Authorized fetch wrapper for admin API calls.
 *
 * - Obtains a fresh Firebase ID token from the current user
 * - Injects `Authorization: Bearer <token>` header
 * - Handles unauthenticated / expired sessions
 *
 * All admin pages MUST use this instead of raw fetch().
 */
export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated. Please sign in.");
  }

  // getIdToken(true) forces a refresh if the token is expired
  const idToken = await user.getIdToken(/* forceRefresh */ false);

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${idToken}`);

  // Preserve Content-Type if already set (e.g. application/json)
  // but don't override if caller already set it
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
