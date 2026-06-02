import { NextRequest, NextResponse } from "next/server";
import { db, collection, getDocs, doc, getDoc, deleteDoc, query, orderBy, limit } from "@/lib/server-firestore";
import { logAuditAction } from "@/lib/audit-logger";
import { requireAdmin, requireSuperAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const reportsRef = collection(db, "reports");
    const q = query(reportsRef, orderBy("createdAt", "desc"), limit(200));
    const snap = await getDocs(q);
    const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ reports });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminOrError = await requireSuperAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;
    const adminUser = adminOrError;

    const { action, reportId } = await req.json();
    if (action === "delete" && reportId) {
      const reportRef = doc(db, "reports", reportId);
      const reportSnap = await getDoc(reportRef);
      if (!reportSnap.exists()) {
        return NextResponse.json({ error: "Report not found." }, { status: 404 });
      }

      await deleteDoc(reportRef);

      await logAuditAction({
        adminId: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: "Report Deletion",
        details: `Deleted analysis report: ${reportId}`,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
