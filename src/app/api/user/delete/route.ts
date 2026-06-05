import { NextRequest, NextResponse } from "next/server";
import { requireUser, deleteAuthUser } from "@/lib/firebase-admin";
import { cascadeDeleteUserData } from "@/lib/user-deletion";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  const userOrError = await requireUser(req);
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  try {
    // 1. Delete Firestore data cascade (9 collections)
    const collectionsDeleted = await cascadeDeleteUserData(user.uid);

    // 2. Delete Auth account last
    await deleteAuthUser(user.uid);

    return NextResponse.json({
      deleted: true,
      collections: collectionsDeleted,
    });
  } catch (err: any) {
    console.error("Failed to delete user account for", user.uid, err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete account." },
      { status: 500 }
    );
  }
}
