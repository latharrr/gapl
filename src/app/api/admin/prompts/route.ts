import { NextRequest, NextResponse } from "next/server";
import { db, collection, getDocs, doc, getDoc, setDoc, addDoc } from "@/lib/server-firestore";
import { logAuditAction } from "@/lib/audit-logger";
import { requireAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    // Get active prompt templates
    const promptsRef = collection(db, "prompts");
    const snap = await getDocs(promptsRef);
    const prompts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Get version history
    const historyRef = collection(db, "prompt_versions");
    const historySnap = await getDocs(historyRef);
    const history = historySnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ prompts, history });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;
    const adminUser = adminOrError;
    // Only super_admin, admin can modify prompt configurations
    if (!["super_admin", "admin"].includes(adminUser.role)) {
      return NextResponse.json({ error: "Unauthorized role for prompt modification." }, { status: 403 });
    }

    const { action, promptId, content, version, targetVersion } = await req.json();

    if (action === "update") {
      const promptRef = doc(db, "prompts", promptId);
      const promptSnap = await getDoc(promptRef);
      if (!promptSnap.exists()) {
        return NextResponse.json({ error: "Prompt not found." }, { status: 404 });
      }
      const activePrompt = promptSnap.data();
      if (!activePrompt) {
        return NextResponse.json({ error: "Prompt content is empty." }, { status: 500 });
      }

      // 1. Archive current version to prompt_versions
      const historyRef = collection(db, "prompt_versions");
      await addDoc(historyRef, {
        promptId,
        name: activePrompt.name,
        content: activePrompt.content,
        version: activePrompt.version,
        savedAt: new Date().toISOString(),
        savedBy: adminUser.email,
      });

      // 2. Update to new version
      const nextVersion = (activePrompt.version || 1) + 1;
      await setDoc(promptRef, {
        ...activePrompt,
        content,
        version: nextVersion,
        lastUpdated: new Date().toISOString(),
      });

      await logAuditAction({
        adminId: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: "Prompt Changes",
        details: `Updated prompt '${activePrompt.name}' to version ${nextVersion}`,
      });

      return NextResponse.json({ success: true, nextVersion });
    }

    if (action === "rollback") {
      const promptRef = doc(db, "prompts", promptId);
      const promptSnap = await getDoc(promptRef);
      if (!promptSnap.exists()) {
        return NextResponse.json({ error: "Prompt not found." }, { status: 404 });
      }
      const activePrompt = promptSnap.data();
      if (!activePrompt) {
        return NextResponse.json({ error: "Prompt content is empty." }, { status: 500 });
      }

      // Find the version content to rollback to
      const versionsRef = collection(db, "prompt_versions");
      const snap = await getDocs(versionsRef);
      const targetDoc = snap.docs.find(d => {
        const data = d.data();
        return data?.promptId === promptId && data?.version === targetVersion;
      });

      if (!targetDoc) {
        return NextResponse.json({ error: "Target rollback version not found." }, { status: 404 });
      }
      const targetData = targetDoc.data();
      if (!targetData) {
        return NextResponse.json({ error: "Target rollback version is empty." }, { status: 500 });
      }

      // 1. Archive current active prompt before rolling back
      await addDoc(versionsRef, {
        promptId,
        name: activePrompt.name,
        content: activePrompt.content,
        version: activePrompt.version,
        savedAt: new Date().toISOString(),
        savedBy: adminUser.email,
      });

      // 2. Rollback to target content
      const nextVersion = (activePrompt.version || 1) + 1;
      await setDoc(promptRef, {
        ...activePrompt,
        content: targetData.content,
        version: nextVersion,
        lastUpdated: new Date().toISOString(),
      });

      await logAuditAction({
        adminId: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: "Prompt Changes",
        details: `Rolled back prompt '${activePrompt.name}' to content of version ${targetVersion}`,
      });

      return NextResponse.json({ success: true, nextVersion });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
