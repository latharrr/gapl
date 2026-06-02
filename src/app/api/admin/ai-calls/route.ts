import { NextRequest, NextResponse } from "next/server";
import { db, collection, getDocs, query, orderBy, limit } from "@/lib/server-firestore";
import { requireAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const callsRef = collection(db, "ai_calls");
    const q = query(callsRef, orderBy("timestamp", "desc"), limit(200));
    const snap = await getDocs(q);
    const calls = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ calls });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
