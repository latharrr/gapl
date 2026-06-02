import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter } from "firebase/firestore";
import { logAuditAction } from "@/lib/audit-logger";

export const runtime = "nodejs";

// Helper to verify admin role on server side
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

    const PAGE_SIZE = 100;
    const usersRef = collection(db, "users");
    let q = query(usersRef, orderBy("createdAt", "desc"), limit(PAGE_SIZE));

    // Cursor pagination: if a lastDocId is provided, start after that document
    const lastDocId = req.nextUrl.searchParams.get("after");
    if (lastDocId) {
      const lastDocSnap = await getDoc(doc(db, "users", lastDocId));
      if (lastDocSnap.exists()) {
        q = query(usersRef, orderBy("createdAt", "desc"), startAfter(lastDocSnap), limit(PAGE_SIZE));
      }
    }

    const snap = await getDocs(q);
    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].id : null;

    return NextResponse.json({ users, nextCursor: lastDoc, hasMore: snap.docs.length === PAGE_SIZE });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getAdminUser(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const { action, targetUid, data } = await req.json();
    if (!action || !targetUid) {
      return NextResponse.json({ error: "Missing action or target UID." }, { status: 400 });
    }

    const targetRef = doc(db, "users", targetUid);
    const targetSnap = await getDoc(targetRef);
    if (!targetSnap.exists()) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }
    const targetUser = targetSnap.data();

    // ── RBAC Checks ──────────────────────────────────────────────────────────
    // Only super_admin can modify users (roles, plans) and delete them
    const isSuperAdmin = adminUser.role === "super_admin";
    const isAdmin = adminUser.role === "admin";
    const isSupport = adminUser.role === "support";

    if (action === "updateRole" || action === "updatePlan") {
      if (!isSuperAdmin) {
        return NextResponse.json({ error: "Only super_admin can modify user roles or subscriptions." }, { status: 403 });
      }
      
      const updateData: any = {};
      if (action === "updateRole") {
        updateData.role = data.role;
        await logAuditAction({
          adminId: adminUser.uid,
          adminEmail: adminUser.email,
          adminRole: adminUser.role,
          action: "Role Change",
          targetUserId: targetUid,
          targetUser: targetUser.email,
          details: `Changed role of ${targetUser.email} from ${targetUser.role || "user"} to ${data.role}`,
        });
      } else {
        updateData.plan = data.plan;
        await logAuditAction({
          adminId: adminUser.uid,
          adminEmail: adminUser.email,
          adminRole: adminUser.role,
          action: "Subscription Modify",
          targetUserId: targetUid,
          targetUser: targetUser.email,
          details: `Modified subscription of ${targetUser.email} to ${data.plan}`,
        });
      }
      await updateDoc(targetRef, updateData);
      return NextResponse.json({ success: true });
    }

    if (action === "suspend" || action === "ban") {
      // super_admin, admin, and support can suspend or ban
      if (!isSuperAdmin && !isAdmin && !isSupport) {
        return NextResponse.json({ error: "Unauthorized role for user suspension." }, { status: 403 });
      }

      const suspended = data.suspended;
      await updateDoc(targetRef, { suspended });
      
      await logAuditAction({
        adminId: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: suspended ? "User Suspended" : "User Reinstated",
        targetUserId: targetUid,
        targetUser: targetUser.email,
        details: `${suspended ? "Suspended" : "Un-suspended"} access for user ${targetUser.email}`,
      });

      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      if (!isSuperAdmin) {
        return NextResponse.json({ error: "Only super_admin can delete users." }, { status: 403 });
      }

      await deleteDoc(targetRef);

      await logAuditAction({
        adminId: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: "User Deletion",
        targetUserId: targetUid,
        targetUser: targetUser.email,
        details: `Deleted user ${targetUser.email} from platform databases.`,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
