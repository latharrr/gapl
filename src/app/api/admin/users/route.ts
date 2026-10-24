import { NextRequest, NextResponse } from "next/server";
import { db, collection, getDocs, doc, getDoc, updateDoc, query, orderBy, limit, startAfter } from "@/lib/server-firestore";
import { logAuditAction } from "@/lib/audit-logger";
import { requireAdmin, deleteAuthUser } from "@/lib/firebase-admin";
import { cascadeDeleteUserData } from "@/lib/user-deletion";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

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
  } catch (err) {
    const message = err instanceof Error && err.message ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;
    const adminUser = adminOrError;

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

    if (action === "setCredits") {
      if (!isSuperAdmin) {
        return NextResponse.json({ error: "Only super_admin can change credit balances." }, { status: 403 });
      }
      const credits = Number(data?.credits);
      if (!Number.isInteger(credits) || credits < 0 || credits > 1000) {
        return NextResponse.json({ error: "Credits must be a whole number from 0 to 1000." }, { status: 400 });
      }
      await updateDoc(targetRef, { credits });
      await logAuditAction({
        adminId: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: "Credits Changed",
        targetUserId: targetUid,
        targetUser: targetUser.email,
        details: `Set credit balance of ${targetUser.email} to ${credits}`,
      });
      return NextResponse.json({ success: true });
    }

    if (action === "updateRole") {
      if (!isSuperAdmin) {
        return NextResponse.json({ error: "Only super_admin can modify user roles." }, { status: 403 });
      }
      
      if (!["user", "readonly", "support", "admin", "super_admin"].includes(data?.role)) {
        return NextResponse.json({ error: "Unknown role." }, { status: 400 });
      }
      await logAuditAction({
        adminId: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: "Role Change",
        targetUserId: targetUid,
        targetUser: targetUser.email,
        details: `Changed role of ${targetUser.email} from ${targetUser.role || "user"} to ${data.role}`,
      });
      await updateDoc(targetRef, { role: data.role });
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

      // 1. Cascade Firestore deletes (9 collections)
      await cascadeDeleteUserData(targetUid);

      // 2. Delete Auth account last
      await deleteAuthUser(targetUid);

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
  } catch (err) {
    const message = err instanceof Error && err.message ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
