import { db, collection, addDoc } from "./server-firestore";

export interface AuditLog {
  timestamp: string;
  adminId: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  targetUser?: string;
  targetUserId?: string;
  details: string;
}

export async function logAuditAction(data: Omit<AuditLog, "timestamp">) {
  try {
    const log: AuditLog = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    const logsRef = collection(db, "audit_logs");
    await addDoc(logsRef, log);
  } catch (err) {
    console.error("Failed to write audit log to Firestore:", err);
  }
}
