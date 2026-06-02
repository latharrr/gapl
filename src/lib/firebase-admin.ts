import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

let adminApp: App | undefined;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return adminApp;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    try {
      adminApp = initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
      return adminApp;
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
      throw new Error("Firebase Admin credentials are invalid.");
    }
  }

  adminApp = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  return adminApp;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export interface VerifiedUser {
  uid: string;
  email: string;
  role: string;
  plan: string;
  suspended: boolean;
  [key: string]: unknown;
}

export type VerifiedAdmin = VerifiedUser;

function unauthorized(message = "Authentication required.") {
  return NextResponse.json({ error: message, code: "UNAUTHORIZED" }, { status: 401 });
}

export async function verifyUserToken(req: NextRequest): Promise<VerifiedUser | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const idToken = authHeader.slice(7).trim();
    if (!idToken) return null;

    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    const snap = await getAdminDb().collection("users").doc(decoded.uid).get();
    const userData = snap.exists ? snap.data() ?? {} : {};

    return {
      ...userData,
      uid: decoded.uid,
      email: decoded.email || String(userData.email || ""),
      role: String(userData.role || "user"),
      plan: String(userData.plan || "free").toLowerCase(),
      suspended: userData.suspended === true,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export async function requireUser(req: NextRequest): Promise<VerifiedUser | NextResponse> {
  const user = await verifyUserToken(req);
  if (!user) return unauthorized();
  if (user.suspended) {
    return NextResponse.json(
      { error: "This account is suspended. Contact support if you think this is a mistake.", code: "ACCOUNT_SUSPENDED" },
      { status: 403 }
    );
  }
  return user;
}

const ADMIN_ROLES = new Set(["super_admin", "admin", "support", "readonly"]);

export async function requireAdmin(req: NextRequest): Promise<VerifiedAdmin | NextResponse> {
  const user = await verifyUserToken(req);
  if (!user || !ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Valid admin credentials required." }, { status: 403 });
  }
  if (user.suspended) {
    return NextResponse.json({ error: "This admin account is suspended." }, { status: 403 });
  }
  return user;
}

export async function requireSuperAdmin(req: NextRequest): Promise<VerifiedAdmin | NextResponse> {
  const user = await verifyUserToken(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "super_admin role required." }, { status: 403 });
  }
  if (user.suspended) {
    return NextResponse.json({ error: "This admin account is suspended." }, { status: 403 });
  }
  return user;
}
