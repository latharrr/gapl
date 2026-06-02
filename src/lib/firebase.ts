import { initializeApp, getApps, getApp } from "firebase/app";
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
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./firebase-config";

// Initialize Firebase (singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Ensure login persists across browser sessions / page reloads
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

const googleProvider = new GoogleAuthProvider();

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);
export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);
export const logOut = () => signOut(auth);
export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

// ── User document ─────────────────────────────────────────────────────────────
export const createUserDocument = async (user: User, additionalData?: Record<string, unknown>) => {
  if (!user) return;
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
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const updateUserPlan = async (uid: string, plan: string) => {
  const userRef = doc(db, "users", uid);
  return updateDoc(userRef, { plan, updatedAt: new Date() });
};

export const updateUserProfile = async (displayName: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");
  await updateProfile(user, { displayName });
  const userRef = doc(db, "users", user.uid);
  return updateDoc(userRef, { displayName, updatedAt: new Date() });
};

// ── Analysis reports ──────────────────────────────────────────────────────────
export const saveReport = async (uid: string, report: Record<string, unknown>) => {
  const reportsRef = collection(db, "reports");
  return addDoc(reportsRef, { userId: uid, createdAt: new Date(), ...report });
};

export const getUserReports = async (uid: string) => {
  const reportsRef = collection(db, "reports");
  const q = query(reportsRef, where("userId", "==", uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getReport = async (reportId: string) => {
  const docRef = doc(db, "reports", reportId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

// ── Roadmaps ──────────────────────────────────────────────────────────────────
export const saveRoadmap = async (uid: string, roadmap: Record<string, unknown>) => {
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
  const cvsRef = collection(db, "cvs");
  return addDoc(cvsRef, {
    userId: uid,
    createdAt: new Date(),
    ...data,
  });
};

export const getUserCVs = async (uid: string): Promise<SavedCV[]> => {
  const cvsRef = collection(db, "cvs");
  const q = query(cvsRef, where("userId", "==", uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SavedCV));
};
