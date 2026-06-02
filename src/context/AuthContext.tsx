"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { type User } from "firebase/auth";
import { auth, onAuthChange, createUserDocument, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface AuthUser extends User {
  plan?: string;
  analysisCount?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  userDoc: Record<string, unknown> | null;
  loading: boolean;
  isDemo: boolean;
  setIsDemo: (demo: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userDoc: null,
  loading: true,
  isDemo: false,
  setIsDemo: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userDoc, setUserDoc] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let sid = localStorage.getItem("gapl_session_id");
      if (!sid) {
        sid = "sess_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
        localStorage.setItem("gapl_session_id", sid);
      }
    }

    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser as AuthUser);
        try {
          await createUserDocument(firebaseUser);
        } catch (e) {
          console.warn("Could not create user document in Firestore:", e);
        }

        // Set up real-time listener for the user document
        const userRef = doc(db, "users", firebaseUser.uid);
        unsubscribeDoc = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              setUserDoc({ id: snapshot.id, ...snapshot.data() });
            } else {
              setUserDoc(null);
            }
          },
          (err) => {
            console.error("Firestore onSnapshot error on user doc:", err);
          }
        );
      } else {
        setUser(null);
        setUserDoc(null);
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, isDemo, setIsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
