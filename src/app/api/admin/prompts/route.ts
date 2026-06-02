import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, addDoc, query, where, orderBy } from "firebase/firestore";
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
    const adminUser = await getAdminUser(req);
    // Only super_admin, admin can modify prompt configurations
    if (!adminUser || !["super_admin", "admin"].includes(adminUser.role)) {
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

      // Find the version content to rollback to
      const versionsRef = collection(db, "prompt_versions");
      const snap = await getDocs(versionsRef);
      const targetDoc = snap.docs.find(d => {
        const data = d.data();
        return data.promptId === promptId && data.version === targetVersion;
      });

      if (!targetDoc) {
        return NextResponse.json({ error: "Target rollback version not found." }, { status: 404 });
      }
      const targetData = targetDoc.data();

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
