import { NextRequest, NextResponse, after } from "next/server";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

interface RoadmapCareerGap {
  expectedReadinessAfter?: number;
}

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
    ? Math.max(...careerGaps.map((g: RoadmapCareerGap) => g.expectedReadinessAfter || 85), report.readiness || 85)
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
    const { completedTasks: rawTasks } = body;

    if (!Array.isArray(rawTasks) || rawTasks.length > 500) {
      return NextResponse.json({ error: "completedTasks must be an array of strings." }, { status: 400 });
    }

    // Progress is derived on the server from the report's real task list,
    // never taken from the client.
    const reportSnap = await getAdminDb().collection("reports").doc(id).get();
    const report = reportSnap.exists ? reportSnap.data() ?? {} : null;
    if (!report || report.userId !== user.uid) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }
    const roadmapWeeks: { week: number; tasks?: string[] }[] = Array.isArray(report.roadmap) ? report.roadmap : [];
    const validIds = new Set(roadmapWeeks.flatMap((w) => (w.tasks ?? []).map((t) => `${w.week}-${t}`)));
    const completedTasks = Array.from(new Set(rawTasks.filter((t): t is string => typeof t === "string" && validIds.has(t))));

    const roadmapDocRef = getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("roadmaps")
      .doc(id);

    const snap = await roadmapDocRef.get();
    const currentData = snap.exists ? snap.data() ?? {} : {};
    const oldPct = currentData.completionPercentage || 0;
    const sentMilestones = currentData.sentMilestones || [];

    const newPct = validIds.size > 0 ? Math.round((completedTasks.length / validIds.size) * 100) : 0;
    const startReadiness = typeof report.readiness === "number" ? report.readiness : 65;
    const targetReadinessVal = currentData.targetReadiness || 88;
    const currentReadiness = Math.min(
      targetReadinessVal,
      Math.round(startReadiness + (newPct / 100) * (targetReadinessVal - startReadiness))
    );

    const updateData: {
      completedTasks: string[];
      completionPercentage: number;
      currentReadiness: number;
      updatedAt: string;
      sentMilestones?: number[];
    } = {
      completedTasks,
      completionPercentage: newPct,
      currentReadiness,
      updatedAt: new Date().toISOString(),
    };

    // Check for milestone transitions
    const milestones = [25, 50, 75, 100];
    const hitMilestone = milestones.find((m) => newPct >= m && oldPct < m && !sentMilestones.includes(m));

    if (hitMilestone && user.email) {
      const email = user.email;
      after(async () => {
        try {
          const { sendRoadmapMilestoneEmail } = await import("@/lib/email-service");
          await sendRoadmapMilestoneEmail(user.uid, email, id, hitMilestone, currentReadiness, targetReadinessVal);
        } catch (err) {
          console.error(`Failed to send milestone ${hitMilestone}% email:`, err);
        }
      });
      updateData.sentMilestones = [...sentMilestones, hitMilestone];
    }

    await roadmapDocRef.set(updateData, { merge: true });

    return NextResponse.json({ success: true, completionPercentage: newPct, currentReadiness });
  } catch (err: unknown) {
    console.error("Error updating roadmap:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update roadmap." }, { status: 500 });
  }
}
