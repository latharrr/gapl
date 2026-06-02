import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

// ── Firebase Admin singleton ──────────────────────────────────────────────────
let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Option 1: Service account JSON via env var (recommended for production)
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount);
      adminApp = initializeApp({ credential: cert(parsed) });
      return adminApp;
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }

  // Option 2: Application Default Credentials (works on GCP, Firebase Hosting, etc.)
  adminApp = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  return adminApp;
}

// ── Token verification ────────────────────────────────────────────────────────
export interface VerifiedAdmin {
  uid: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

/**
 * Extracts and verifies the Firebase ID token from the Authorization header,
 * then looks up the user's role in Firestore.
 * Returns the admin user object or null if unauthorized.
 */
export async function verifyAdminToken(req: NextRequest): Promise<VerifiedAdmin | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const idToken = authHeader.slice(7); // Remove "Bearer "
    if (!idToken) return null;

    const app = getAdminApp();
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(idToken);

    // Look up the user's role from Firestore
    const userRef = doc(db, "users", decoded.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;

    const userData = snap.data();
    return {
      uid: decoded.uid,
      email: decoded.email || userData.email || "",
      role: userData.role || "user",
      ...userData,
    };
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
}

// ── Reusable middleware functions ──────────────────────────────────────────────
const ADMIN_ROLES = ["super_admin", "admin", "support", "readonly"];

/**
 * Verifies the caller has any admin role (super_admin, admin, support, readonly).
 * Returns the verified admin user, or a 403 NextResponse.
 */
export async function requireAdmin(req: NextRequest): Promise<VerifiedAdmin | NextResponse> {
  const admin = await verifyAdminToken(req);
  if (!admin || !ADMIN_ROLES.includes(admin.role)) {
    return NextResponse.json({ error: "Unauthorized. Valid admin token required." }, { status: 403 });
  }
  return admin;
}

/**
 * Verifies the caller has the super_admin role.
 * Returns the verified admin user, or a 403 NextResponse.
 */
export async function requireSuperAdmin(req: NextRequest): Promise<VerifiedAdmin | NextResponse> {
  const admin = await verifyAdminToken(req);
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized. super_admin role required." }, { status: 403 });
  }
  return admin;
}
