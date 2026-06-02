import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

function parseUserAgent(ua: string) {
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  const uaLower = ua.toLowerCase();

  // Browser check
  if (uaLower.includes("firefox")) browser = "Firefox";
  else if (uaLower.includes("chrome") && !uaLower.includes("chromium")) browser = "Chrome";
  else if (uaLower.includes("safari") && !uaLower.includes("chrome")) browser = "Safari";
  else if (uaLower.includes("edge")) browser = "Edge";
  else if (uaLower.includes("opera") || uaLower.includes("opr")) browser = "Opera";

  // OS check
  if (uaLower.includes("windows")) os = "Windows";
  else if (uaLower.includes("macintosh") || uaLower.includes("mac os")) os = "macOS";
  else if (uaLower.includes("iphone") || uaLower.includes("ipad")) {
    os = "iOS";
    device = uaLower.includes("ipad") ? "Tablet" : "Mobile";
  } else if (uaLower.includes("android")) {
    os = "Android";
    device = "Mobile";
  } else if (uaLower.includes("linux")) os = "Linux";

  return { browser, os, device };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.length > 80) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const db = getAdminDb();
    const docRef = db.collection("trackable_links").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const data = snap.data() ?? {};
    const targetUrl = data.targetUrl || "/";
    const campaignId = data.campaignId || "custom_campaign";
    const emailId = data.emailId || "custom_email";
    const userId = data.userId || "anonymous";

    // 1. Gather Metadata
    const ua = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "Direct";
    const country = req.headers.get("x-vercel-ip-country") || "Unknown";
    const { browser, os, device } = parseUserAgent(ua);

    // 2. Cookie Unique Click Detection
    const cookieKey = `gapl_clk_${id}`;
    const hasClickedCookie = req.cookies.has(cookieKey);
    const isUnique = !hasClickedCookie;

    const timestamp = new Date().toISOString();

    // 3. Perform Firestore Transactions Asynchronously (Avoid blocking redirect latency)
    // Update tracking stats
    docRef.update({
      clickCount: FieldValue.increment(1),
      uniqueClicks: isUnique ? FieldValue.increment(1) : FieldValue.increment(0),
      firstClickedAt: data.firstClickedAt || timestamp,
      lastClickedAt: timestamp,
    }).catch(console.error);

    // If linked to an email, update the corresponding message doc
    if (emailId && emailId !== "custom_email" && emailId !== "none") {
      const msgRef = db.collection("email_messages").doc(emailId);
      msgRef.get().then((msgSnap) => {
        if (msgSnap.exists) {
          msgRef.update({
            status: "clicked",
            clickedAt: timestamp,
            firstVisitAt: msgSnap.data()?.firstVisitAt || timestamp,
          }).catch(console.error);
        }
      }).catch(console.error);
    }

    // Add to email_events log
    const eventType = isUnique ? "email_clicked" : "link_revisited";
    const eventRef = db.collection("email_events").doc();
    eventRef.set({
      id: eventRef.id,
      emailId,
      userId,
      type: eventType,
      timestamp,
      metadata: {
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: ua,
        device,
        browser,
        os,
        country,
        referrer,
      },
    }).catch(console.error);

    // Also add to global analytics_events log for funnel metrics
    db.collection("analytics_events").add({
      event: eventType,
      linkId: id,
      campaignId,
      emailId,
      userId,
      timestamp,
    }).catch(console.error);

    // 4. Set Cookie and Redirect
    const redirectResponse = NextResponse.redirect(new URL(targetUrl, req.url));
    if (isUnique) {
      redirectResponse.cookies.set(cookieKey, "1", {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }

    return redirectResponse;
  } catch (err) {
    console.error("Redirect redirect tracker failed:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
