import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";
import { createTrackableLink } from "@/lib/link-tracker";

export const runtime = "nodejs";

// GET: Retrieve all links with click statistics and campaigns aggregation
export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const db = getAdminDb();

    const linksSnap = await db.collection("trackable_links").get();
    const links = linksSnap.docs.map((d) => d.data());

    // Sort links by click counts
    const sortedLinks = [...links].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));

    const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);
    const totalUniqueClicks = links.reduce((sum, l) => sum + (l.uniqueClicks || 0), 0);

    const topLinks = sortedLinks.slice(0, 10);
    const worstLinks = [...links]
      .sort((a, b) => (a.clickCount || 0) - (b.clickCount || 0))
      .slice(0, 10);

    // Group click counts by campaigns
    const campaignMap: Record<string, { name: string; clicks: number; unique: number; linksCount: number }> = {};
    links.forEach((l) => {
      const cId = l.campaignId || "custom_campaign";
      if (!campaignMap[cId]) {
        campaignMap[cId] = {
          name: cId.replace(/_/g, " "),
          clicks: 0,
          unique: 0,
          linksCount: 0,
        };
      }
      campaignMap[cId].clicks += l.clickCount || 0;
      campaignMap[cId].unique += l.uniqueClicks || 0;
      campaignMap[cId].linksCount += 1;
    });

    const campaigns = Object.entries(campaignMap).map(([id, data]) => ({
      id,
      ...data,
    }));

    return NextResponse.json({
      links: sortedLinks,
      metrics: {
        totalClicks,
        totalUniqueClicks,
      },
      topLinks,
      worstLinks,
      campaigns,
    });
  } catch (err: any) {
    console.error("Failed to load admin links metrics:", err);
    return NextResponse.json({ error: err.message || "Failed to load links." }, { status: 500 });
  }
}

// POST: Generate a new custom trackable link manually
export async function POST(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const body = await req.json();
    const { targetUrl, name, campaignId, customSlug } = body;

    if (!targetUrl || !name) {
      return NextResponse.json({ error: "Target URL and Link Name are required." }, { status: 400 });
    }

    // Clean custom slug if provided
    let cleanedSlug = customSlug ? String(customSlug).trim().toLowerCase().replace(/[^a-z0-9-_]/g, "") : undefined;
    if (cleanedSlug && (cleanedSlug.length < 3 || cleanedSlug.length > 30)) {
      return NextResponse.json({ error: "Custom slug must be between 3 and 30 characters." }, { status: 400 });
    }

    const shortlink = await createTrackableLink({
      id: cleanedSlug || undefined,
      targetUrl,
      name,
      campaignId: campaignId || "custom_campaign",
      emailId: "none",
      userId: "admin_manual",
    });

    return NextResponse.json({ success: true, shortlink, id: cleanedSlug || shortlink.split("/").pop() });
  } catch (err: any) {
    console.error("Failed to create manual trackable link:", err);
    return NextResponse.json({ error: err.message || "Failed to generate link." }, { status: 500 });
  }
}
