import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./firebase-config";

// ── Lazy initialization ───────────────────────────────────────────────────────
// Firebase must NOT initialize at module scope: importing this module during
// `next build` prerendering (or anywhere env vars are missing) would throw
// `auth/invalid-api-key` and crash the build. Initialization happens on first
// use instead, with a clear error pointing at the missing configuration.

let cachedApp: FirebaseApp | null = null;
let persistenceEnsured = false;

function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  if (!firebaseConfig.apiKey) {
    throw new Error(
      "Firebase client configuration is missing (NEXT_PUBLIC_FIREBASE_API_KEY is not set). " +
        "Copy .env.example to .env.local and fill in your Firebase web app keys."
    );
  }
  cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return cachedApp;
}

export function getClientAuth(): Auth {
  const auth = getAuth(getFirebaseApp());
  // Ensure login persists across browser sessions / page reloads (once, client-side only)
  if (typeof window !== "undefined" && !persistenceEnsured) {
    persistenceEnsured = true;
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  }
  return auth;
}

export function getClientDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getClientStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

const googleProvider = new GoogleAuthProvider();

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signInWithGoogle = () => signInWithPopup(getClientAuth(), googleProvider);
export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(getClientAuth(), email, password);
export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(getClientAuth(), email, password);
export const logOut = () => signOut(getClientAuth());
export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(getClientAuth(), callback);

// ── User document ─────────────────────────────────────────────────────────────
export const createUserDocument = async (user: User, additionalData?: Record<string, unknown>) => {
  if (!user) return;
  const db = getClientDb();
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    const { displayName, email, photoURL } = user;
    await setDoc(userRef, {
      displayName,
      email,
      photoURL,
      createdAt: new Date(),
      plan: "free",
      analysisCount: 0,
      ...additionalData,
    });
  }
  return userRef;
};

export const getUserDocument = async (uid: string) => {
  const db = getClientDb();
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const updateUserPlan = async (uid: string, plan: string) => {
  const db = getClientDb();
  const userRef = doc(db, "users", uid);
  return updateDoc(userRef, { plan, updatedAt: new Date() });
};

export const updateUserProfile = async (displayName: string) => {
  const auth = getClientAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");
  await updateProfile(user, { displayName });
  const db = getClientDb();
  const userRef = doc(db, "users", user.uid);
  return updateDoc(userRef, { displayName, updatedAt: new Date() });
};

// ── Analysis reports ──────────────────────────────────────────────────────────
export const saveReport = async (uid: string, report: Record<string, unknown>) => {
  const db = getClientDb();
  const reportsRef = collection(db, "reports");
  return addDoc(reportsRef, { userId: uid, createdAt: new Date(), ...report });
};

export const getUserReports = async (uid: string) => {
  const db = getClientDb();
  const reportsRef = collection(db, "reports");
  const q = query(reportsRef, where("userId", "==", uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => normalizeCreatedAt({ id: d.id, ...d.data() }));
};

export const getReport = async (reportId: string) => {
  const db = getClientDb();
  const docRef = doc(db, "reports", reportId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? normalizeCreatedAt({ id: snapshot.id, ...snapshot.data() }) : null;
};

function normalizeCreatedAt<T extends Record<string, unknown>>(value: T): T {
  const createdAt = value.createdAt as { toDate?: () => Date } | string | undefined;
  if (createdAt && typeof createdAt === "object" && typeof createdAt.toDate === "function") {
    return { ...value, createdAt: createdAt.toDate().toISOString() };
  }
  return value;
}

// ── Roadmaps ──────────────────────────────────────────────────────────────────
export const saveRoadmap = async (uid: string, roadmap: Record<string, unknown>) => {
  const db = getClientDb();
  const roadmapsRef = collection(db, "roadmaps");
  return addDoc(roadmapsRef, { userId: uid, createdAt: new Date(), ...roadmap });
};

// ── CV Builder ────────────────────────────────────────────────────────────────
export interface SavedCV {
  id?: string;
  userId: string;
  role: string;
  seniority: string;
  companyType: string;
  companyName?: string;
  atsScore: number;
  originalAtsScore: number;
  name: string;
  createdAt: Date | { toDate: () => Date };
  cv: Record<string, unknown>;
}

export const saveCV = async (uid: string, data: Omit<SavedCV, "id" | "userId" | "createdAt">) => {
  const db = getClientDb();
  const cvsRef = collection(db, "cvs");
  return addDoc(cvsRef, {
    userId: uid,
    createdAt: new Date(),
    ...data,
  });
};

export const getUserCVs = async (uid: string): Promise<SavedCV[]> => {
  const db = getClientDb();
  const cvsRef = collection(db, "cvs");
  const q = query(cvsRef, where("userId", "==", uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SavedCV));
};
