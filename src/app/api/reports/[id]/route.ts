import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function normalizeCreatedAt(data: FirebaseFirestore.DocumentData) {
  const createdAt = data.createdAt;
  if (createdAt && typeof createdAt.toDate === "function") {
    return { ...data, createdAt: createdAt.toDate().toISOString() };
  }
  return data;
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
    return NextResponse.json({ error: "Invalid report id." }, { status: 400 });
  }

  const snapshot = await getAdminDb().collection("reports").doc(id).get();
  if (!snapshot.exists) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const report = snapshot.data() ?? {};
  const adminRoles = new Set(["super_admin", "admin", "support", "readonly"]);
  if (report.userId !== user.uid && !adminRoles.has(user.role)) {
    return NextResponse.json({ error: "You do not have access to this report." }, { status: 403 });
  }

  return NextResponse.json({ report: { id: snapshot.id, ...normalizeCreatedAt(report) } });
}
