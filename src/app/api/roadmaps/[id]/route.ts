import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userOrError = await requireUser(req);
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  const { id } = await params;
  if (!id || id.length > 160) {
    return NextResponse.json({ error: "Invalid roadmap id." }, { status: 400 });
  }

  const roadmapDocRef = getAdminDb()
    .collection("users")
    .doc(user.uid)
    .collection("roadmaps")
    .doc(id);

  const snapshot = await roadmapDocRef.get();
  if (snapshot.exists) {
    return NextResponse.json({ roadmap: { id: snapshot.id, ...snapshot.data() } });
  }

  // Fallback: auto-initialization from the report document
  const reportSnap = await getAdminDb().collection("reports").doc(id).get();
  if (!reportSnap.exists) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const report = reportSnap.data() ?? {};
  if (report.userId !== user.uid) {
    return NextResponse.json({ error: "You do not have access to this report." }, { status: 403 });
  }

  // Initialize roadmap document
  const careerGaps = report.careerGaps || [];
  const targetReadiness = careerGaps.length > 0
    ? Math.max(...careerGaps.map((g: any) => g.expectedReadinessAfter || 85), report.readiness || 85)
    : Math.max(report.readiness || 85, 85);

  const initialRoadmap = {
    reportId: id,
    userId: user.uid,
    startedAt: report.createdAtIso || report.createdAt || new Date().toISOString(),
    completedTasks: [],
    completionPercentage: 0,
    targetReadiness,
    currentReadiness: report.readiness || 65,
  };

  await roadmapDocRef.set(initialRoadmap);

  return NextResponse.json({ roadmap: { id, ...initialRoadmap } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userOrError = await requireUser(req);
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  const { id } = await params;
  if (!id || id.length > 160) {
    return NextResponse.json({ error: "Invalid roadmap id." }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { completedTasks, completionPercentage, currentReadiness } = body;

    if (!Array.isArray(completedTasks)) {
      return NextResponse.json({ error: "completedTasks must be an array of strings." }, { status: 400 });
    }

    const roadmapDocRef = getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("roadmaps")
      .doc(id);

    const snap = await roadmapDocRef.get();
    const currentData = snap.exists ? snap.data() ?? {} : {};
    const oldPct = currentData.completionPercentage || 0;
    const sentMilestones = currentData.sentMilestones || [];

    const newPct = typeof completionPercentage === "number" ? completionPercentage : 0;
    const updateData: Record<string, any> = {
      completedTasks,
      completionPercentage: newPct,
      currentReadiness: typeof currentReadiness === "number" ? currentReadiness : 65,
      updatedAt: new Date().toISOString(),
    };

    // Check for milestone transitions
    const milestones = [25, 50, 75, 100];
    const hitMilestone = milestones.find((m) => newPct >= m && oldPct < m && !sentMilestones.includes(m));

    if (hitMilestone && user.email) {
      const { sendRoadmapMilestoneEmail } = await import("@/lib/email-service");
      const readinessVal = typeof currentReadiness === "number" ? currentReadiness : (currentData.currentReadiness || 65);
      const targetReadinessVal = currentData.targetReadiness || 85;

      sendRoadmapMilestoneEmail(
        user.uid,
        user.email,
        id,
        hitMilestone,
        readinessVal,
        targetReadinessVal
      ).catch((err) => console.error(`Failed to send milestone ${hitMilestone}% email:`, err));

      updateData.sentMilestones = [...sentMilestones, hitMilestone];
    }

    await roadmapDocRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating roadmap:", err);
    return NextResponse.json({ error: err.message || "Failed to update roadmap." }, { status: 500 });
  }
}
