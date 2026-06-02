import { NextRequest, NextResponse } from "next/server";
import { db, doc, getDoc, setDoc } from "@/lib/server-firestore";
import { requireAdmin, requireSuperAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function providerForModel(model: string) {
  if (model.startsWith("claude")) return "Anthropic";
  if (model.startsWith("gemini")) return "Gemini";
  if (model.startsWith("gpt-")) return "OpenAI";
  return "Groq";
}

/**
 * GET /api/admin/settings — Read platform settings (any admin role)
 */
export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const routeRef = doc(db, "settings", "routing");
    const snap = await getDoc(routeRef);

    if (!snap.exists()) {
      return NextResponse.json({ settings: null });
    }

    return NextResponse.json({ settings: snap.data() });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings — Write platform settings (super_admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const adminOrError = await requireSuperAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const body = await req.json();
    const {
      shortlistCutoff,
      maintenance,
      registrations,
      modelRouting,
    } = body;

    const routeRef = doc(db, "settings", "routing");
    const payload: Record<string, unknown> = {};

    if (shortlistCutoff !== undefined) payload.shortlistCutoff = shortlistCutoff;
    if (maintenance !== undefined) payload.maintenance = maintenance;
    if (registrations !== undefined) payload.registrations = registrations;

    // Model routing per-task
    if (modelRouting) {
      const tasks = [
        "resume-parsing",
        "jd-analysis",
        "resume-optimization",
        "ats-evaluation",
        "recruiter-simulation",
        "career-gap",
      ];
      for (const task of tasks) {
        if (modelRouting[task]) {
          const model = modelRouting[task].model;
          payload[task] = {
            model,
            provider: providerForModel(model),
          };
        }
      }
    }

    await setDoc(routeRef, payload, { merge: true });

    return NextResponse.json({ success: true, message: "Settings saved successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
