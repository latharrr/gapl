import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import { logAuditAction } from "@/lib/audit-logger";

export const runtime = "nodejs";

async function getAdminUser(req: NextRequest) {
  const adminUid = req.headers.get("x-admin-uid");
  if (!adminUid) return null;
  const userRef = doc(db, "users", adminUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as any;
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await getAdminUser(req);
    if (!adminUser || !["super_admin", "admin", "support", "readonly"].includes(adminUser.role)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const reportsRef = collection(db, "reports");
    const snap = await getDocs(reportsRef);
    const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ reports });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getAdminUser(req);
    if (!adminUser || adminUser.role !== "super_admin") {
      return NextResponse.json({ error: "Only super_admins can delete reports." }, { status: 403 });
    }

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
