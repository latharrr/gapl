import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

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

    const callsRef = collection(db, "ai_calls");
    const snap = await getDocs(callsRef);
    const calls = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ calls });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
