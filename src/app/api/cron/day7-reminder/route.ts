import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendDay7ReminderEmail } from "@/lib/email-service";

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
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    // 1. Fetch reports created between 7 and 8 days ago
    const reportsSnap = await db.collection("reports").get();
    const reports = reportsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const candidateReports = reports.filter((r) => {
      const created = r.createdAtIso
        ? new Date(r.createdAtIso)
        : r.createdAt
        ? typeof r.createdAt.toDate === "function"
          ? r.createdAt.toDate()
          : new Date(r.createdAt)
        : null;
      return created && created >= eightDaysAgo && created <= sevenDaysAgo;
    });

    let sentCount = 0;

    for (const report of candidateReports) {
      const { userId, id: reportId } = report;
      if (!userId) continue;

      // 2. Fetch User Profile to get email
      const userSnap = await db.collection("users").doc(userId).get();
      if (!userSnap.exists) continue;
      const userData = userSnap.data() || {};
      const email = userData.email;
      if (!email) continue;

      // 3. Verify if Day 7 Reminder has already been sent
      const duplicateSnap = await db.collection("email_messages")
        .where("userId", "==", userId)
        .where("campaignId", "==", "day_7_reminder")
        .limit(1)
        .get();

      if (!duplicateSnap.empty) continue; // Already sent

      // 4. Fetch roadmap completion info
      const roadmapSnap = await db.collection("users").doc(userId)
        .collection("roadmaps").doc(reportId).get();

      let completedTasksCount = 0;
      if (roadmapSnap.exists) {
        const roadmapData = roadmapSnap.data() || {};
        const completed = roadmapData.completedTasks || [];
        completedTasksCount = completed.length;
      }

      // 5. Send Weekly Sync reminder
      await sendDay7ReminderEmail(userId, email, reportId, completedTasksCount);
      sentCount++;
    }

    return NextResponse.json({ success: true, processed: candidateReports.length, sent: sentCount });
  } catch (err: any) {
    console.error("Day 7 Reminder Cron failed:", err);
    return NextResponse.json({ error: err.message || "Cron failed" }, { status: 500 });
  }
}
