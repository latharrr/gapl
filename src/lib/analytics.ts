import { getClientAuth } from "./firebase";

export async function trackEvent(event: string, metadata?: Record<string, unknown>) {
  try {
    const user = getClientAuth().currentUser;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (user) {
      try {
        const token = await user.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      } catch {}
    }

    const sid = typeof window !== "undefined" ? localStorage.getItem("gapl_session_id") || "" : "";
    
    await fetch("/api/analytics", {
      method: "POST",
      headers,
      body: JSON.stringify({
        event,
        sessionId: sid || undefined,
        metadata,
      }),
    });
  } catch (err) {
    console.error("Failed to track event:", err);
  }
}
