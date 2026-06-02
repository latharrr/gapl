import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendDay1ReminderEmail } from "@/lib/email-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Cron authorization check for production
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // 1. Fetch reports created between 24 and 48 hours ago
    const reportsSnap = await db.collection("reports").get();
    const reports = reportsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const candidateReports = reports.filter((r) => {
      const created = r.createdAtIso ? new Date(r.createdAtIso) : r.createdAt ? r.createdAt.toDate() : null;
      return created && created >= fortyEightHoursAgo && created <= twentyFourHoursAgo;
    });

    let sentCount = 0;

    for (const report of candidateReports) {
      const { userId, id: reportId } = report;
      if (!userId) continue;

      // 2. Fetch User Profile to get their email
      const userSnap = await db.collection("users").doc(userId).get();
      if (!userSnap.exists) continue;
      const userData = userSnap.data() || {};
      const email = userData.email;
      if (!email) continue;

      // 3. Verify if Day 1 Reminder has already been sent
      const duplicateSnap = await db.collection("email_messages")
        .where("userId", "==", userId)
        .where("campaignId", "==", "day_1_reminder")
        .limit(1)
        .get();

      if (!duplicateSnap.empty) continue; // Already sent

      // 4. Verify roadmap document status (must have no tasks completed or not exist yet)
      const roadmapSnap = await db.collection("users").doc(userId)
        .collection("roadmaps").doc(reportId).get();

      let hasActivity = false;
      if (roadmapSnap.exists) {
        const roadmapData = roadmapSnap.data() || {};
        const completed = roadmapData.completedTasks || [];
        if (completed.length > 0) {
          hasActivity = true;
        }
      }

      if (hasActivity) continue; // Skip if user has already started the roadmap

      // Extract gaps information for recommendation
      const careerGaps = report.careerGaps || [];
      const topGap = careerGaps[0]?.gapName || "Backend APIs";
      const recommendedProject = careerGaps[0]?.recommendedProject || "E-commerce Microservices API";

      // 5. Send reminder
      await sendDay1ReminderEmail(userId, email, reportId, topGap, recommendedProject);
      sentCount++;
    }

    return NextResponse.json({ success: true, processed: candidateReports.length, sent: sentCount });
  } catch (err: any) {
    console.error("Day 1 Reminder Cron failed:", err);
    return NextResponse.json({ error: err.message || "Cron failed" }, { status: 500 });
  }
}
