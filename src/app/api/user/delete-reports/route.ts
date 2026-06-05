import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/firebase-admin";
import { deleteUserReportsData } from "@/lib/user-deletion";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  const userOrError = await requireUser(req);
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  try {
    // Delete only reports and ai_calls
    const collectionsDeleted = await deleteUserReportsData(user.uid);

    return NextResponse.json({
      deleted: true,
      collections: collectionsDeleted,
    });
  } catch (err: any) {
    console.error("Failed to delete user reports for", user.uid, err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete reports." },
      { status: 500 }
    );
  }
}
