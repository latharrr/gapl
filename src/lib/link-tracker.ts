import { getAdminDb } from "./firebase-admin";

export interface TrackableLink {
  id: string;
  campaignId: string;
  emailId: string;
  userId: string;
  name: string;
  targetUrl: string;
  clickCount: number;
  uniqueClicks: number;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
  createdAt: string;
}

export async function createTrackableLink({
  id,
  targetUrl,
  name,
  campaignId = "custom_campaign",
  emailId = "custom_email",
  userId = "anonymous",
}: {
  id?: string;
  targetUrl: string;
  name: string;
  campaignId?: string;
  emailId?: string;
  userId?: string;
}): Promise<string> {
  const db = getAdminDb();
  
  // Use provided ID or generate a compact unique slug
  const shortId = id || Math.random().toString(36).substring(2, 8);
  const docRef = db.collection("trackable_links").doc(shortId);

  // Avoid overwriting if link document already exists for this exact campaigns structure
  const snap = await docRef.get();
  if (!snap.exists) {
    const linkDoc: TrackableLink = {
      id: shortId,
      campaignId,
      emailId,
      userId,
      name,
      targetUrl,
      clickCount: 0,
      uniqueClicks: 0,
      firstClickedAt: null,
      lastClickedAt: null,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(linkDoc);
  }

  // Tracking shortlinks always target the sub-domain links.gapl.in
  return `https://links.gapl.in/${shortId}`;
}

export async function getLastTouchAttribution(userId: string) {
  try {
    const db = getAdminDb();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const snap = await db.collection("trackable_links")
      .where("userId", "==", userId)
      .get();

    if (snap.empty) return null;

    const docs = snap.docs.map((d) => d.data());
    const validClicks = docs.filter((d) => d.lastClickedAt && d.lastClickedAt >= thirtyDaysAgo);

    if (validClicks.length === 0) return null;

    // Sort by lastClickedAt descending
    const sorted = validClicks.sort((a, b) => {
      const tA = new Date(a.lastClickedAt!).getTime();
      const tB = new Date(b.lastClickedAt!).getTime();
      return tB - tA;
    });

    const lastClick = sorted[0];
    return {
      campaignId: lastClick.campaignId,
      emailId: lastClick.emailId,
    };
  } catch (err) {
    console.error("Failed to query last touch attribution:", err);
    return null;
  }
}
