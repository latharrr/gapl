import { getAdminDb } from "./firebase-admin";

export async function cascadeDeleteUserData(uid: string) {
  const db = getAdminDb();
  const collectionsWithUserId = [
    "reports",
    "ai_calls",
    "payments",
    "payment_orders",
    "analytics_events",
    "email_messages",
    "cvs"
  ];

  const counts: Record<string, number> = {};

  for (const coll of collectionsWithUserId) {
    const q = db.collection(coll).where("userId", "==", uid);
    const snap = await q.get();
    counts[coll] = snap.size;
    
    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 500) {
      chunks.push(snap.docs.slice(i, i + 500));
    }
    
    for (const chunk of chunks) {
      const batch = db.batch();
      for (const doc of chunk) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }
  }

  const roadmapsRef = db.collection("users").doc(uid).collection("roadmaps");
  const roadmapsSnap = await roadmapsRef.get();
  counts["roadmaps"] = roadmapsSnap.size;
  
  const roadmapChunks = [];
  for (let i = 0; i < roadmapsSnap.docs.length; i += 500) {
    roadmapChunks.push(roadmapsSnap.docs.slice(i, i + 500));
  }
  for (const chunk of roadmapChunks) {
    const batch = db.batch();
    for (const doc of chunk) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }

  const userDocRef = db.collection("users").doc(uid);
  const userDocSnap = await userDocRef.get();
  if (userDocSnap.exists) {
    await userDocRef.delete();
    counts["users"] = 1;
  } else {
    counts["users"] = 0;
  }

  return counts;
}

export async function deleteUserReportsData(uid: string) {
  const db = getAdminDb();
  const collections = ["reports", "ai_calls"];
  const counts: Record<string, number> = {};

  for (const coll of collections) {
    const q = db.collection(coll).where("userId", "==", uid);
    const snap = await q.get();
    counts[coll] = snap.size;

    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 500) {
      chunks.push(snap.docs.slice(i, i + 500));
    }
    for (const chunk of chunks) {
      const batch = db.batch();
      for (const doc of chunk) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }
  }
  return counts;
}
