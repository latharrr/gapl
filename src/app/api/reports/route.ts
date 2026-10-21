import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const MAX_REPORTS = 100;

function createdAtIso(value: unknown): string | null {
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

// Lists the signed-in user's reports, newest first. Served from the server so the
// dashboard doesn't depend on deployed Firestore rules or a composite index.
export async function GET(req: NextRequest) {
  const userOrError = await requireUser(req);
  if (userOrError instanceof NextResponse) return userOrError;

  try {
    const snapshot = await getAdminDb().collection("reports").where("userId", "==", userOrError.uid).get();
    const reports = snapshot.docs
      .map((d) => {
        const data = d.data();
        return { ...data, id: d.id, createdAt: createdAtIso(data.createdAt) };
      })
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
      .slice(0, MAX_REPORTS);
    return NextResponse.json({ reports });
  } catch (err) {
    console.error("Could not list reports:", err);
    return NextResponse.json({ error: "Couldn't load your reports. Please try again." }, { status: 500 });
  }
}
