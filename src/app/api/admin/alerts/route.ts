import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";
import { computeAlerts } from "@/lib/alerts-calculator";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const db = getAdminDb();
    const alerts = await computeAlerts(db);

    const totalSent = (await db.collection("email_messages").get()).size;
    const reportsCount = (await db.collection("reports").get()).size;
    const paymentsCount = (await db.collection("payments").get()).size;

    return NextResponse.json({
      alerts,
      timestamp: new Date().toISOString(),
      counts: {
        totalSent,
        reportsCount,
        paymentsCount,
      },
    });
  } catch (err: any) {
    console.error("Failed to fetch alerts:", err);
    return NextResponse.json({ error: err.message || "Failed to load alerts." }, { status: 500 });
  }
}
