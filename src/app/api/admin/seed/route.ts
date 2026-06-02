import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, addDoc } from "firebase/firestore";

export const runtime = "nodejs";

const MOCK_USERS = [
  { uid: "admin_tester", displayName: "SaaS Founder", email: "founder@gapl.co", role: "super_admin", plan: "pro", createdAt: "2026-05-01T10:00:00Z", analysisCount: 15 },
  { uid: "support_tester", displayName: "Support agent", email: "support@gapl.co", role: "support", plan: "basic", createdAt: "2026-05-10T12:00:00Z", analysisCount: 3 },
  { uid: "read_tester", displayName: "Auditor User", email: "auditor@gapl.co", role: "readonly", plan: "free", createdAt: "2026-05-15T09:00:00Z", analysisCount: 1 },
  { uid: "user_a", displayName: "Amit Sharma", email: "amit@gmail.com", role: "user", plan: "pro", createdAt: "2026-05-20T14:30:00Z", analysisCount: 8, suspended: false },
  { uid: "user_b", displayName: "Sneha Patel", email: "sneha.p@yahoo.com", role: "user", plan: "basic", createdAt: "2026-05-22T08:15:00Z", analysisCount: 4, suspended: false },
  { uid: "user_c", displayName: "Vikram Malhotra", email: "vikram@outlook.com", role: "user", plan: "premium", createdAt: "2026-05-24T18:45:00Z", analysisCount: 12, suspended: false },
  { uid: "user_d", displayName: "Rohan Das", email: "rohan.das@gmail.com", role: "user", plan: "free", createdAt: "2026-05-25T11:20:00Z", analysisCount: 2, suspended: true },
];

const MOCK_REPORTS = [
  { id: "report-1", userId: "user_a", createdAt: "2026-05-21T10:00:00Z", role: "Fullstack Developer", companyTier: "Product Startup", atsScore: 82, readiness: 78, recruiterVerdict: { verdict: "Shortlist", confidence: 85, reason: "Excellent backend depth with Redis and Node.js. Quantified impact is clear." } },
  { id: "report-2", userId: "user_a", createdAt: "2026-05-23T14:00:00Z", role: "Frontend Engineer", companyTier: "Top Product", atsScore: 91, readiness: 88, recruiterVerdict: { verdict: "Shortlist", confidence: 92, reason: "FAANG compliant layout, clear project metrics. Strong React architecture signals." } },
  { id: "report-3", userId: "user_b", createdAt: "2026-05-22T09:00:00Z", role: "Data Analyst", companyTier: "Mass Recruiter", atsScore: 68, readiness: 55, recruiterVerdict: { verdict: "Maybe", confidence: 70, reason: "Good Python usage, but lacks SQL query optimization project. Project complexity is weak." } },
  { id: "report-4", userId: "user_c", createdAt: "2026-05-24T19:00:00Z", role: "SDE 2", companyTier: "Top Product", atsScore: 88, readiness: 84, recruiterVerdict: { verdict: "Shortlist", confidence: 90, reason: "High project complexity. Shows strong scaling experience with Kubernetes." } },
  { id: "report-5", userId: "user_d", createdAt: "2026-05-25T12:00:00Z", role: "Intern", companyTier: "Product Startup", atsScore: 52, readiness: 42, recruiterVerdict: { verdict: "Reject", confidence: 95, reason: "No deployed projects or live links. Bullet points are descriptive rather than action-oriented." } },
];

const MOCK_AI_CALLS = [
  { userId: "user_a", provider: "Groq", model: "openai/gpt-oss-120b", tokensInput: 2800, tokensOutput: 1800, cost: 0.00307, latency: 4500, status: "success", prompt: "Parse resume", response: "{}" },
  { userId: "user_b", provider: "Groq", model: "openai/gpt-oss-120b", tokensInput: 3100, tokensOutput: 1650, cost: 0.00313, latency: 4800, status: "success", prompt: "Analyze JD", response: "{}" },
  { userId: "user_c", provider: "Groq", model: "openai/gpt-oss-120b", tokensInput: 2900, tokensOutput: 1950, cost: 0.00325, latency: 4200, status: "success", prompt: "Simulate Recruiter", response: "{}" },
  { userId: "user_d", provider: "Groq", model: "openai/gpt-oss-120b", tokensInput: 3400, tokensOutput: 0, cost: 0.00200, latency: 1200, status: "error", prompt: "Evaluate ATS", response: "", error: "Rate Limit Exceeded" },
];

const MOCK_PAYMENTS = [
  { paymentId: "pay_Q8h71891as", orderId: "order_Q8h71891as", userId: "user_a", plan: "pro", amount: 149, status: "captured", refunded: false, createdAt: "2026-05-20T14:30:00Z" },
  { paymentId: "pay_X9a21901as", orderId: "order_X9a21901as", userId: "user_b", plan: "basic", amount: 49, status: "captured", refunded: false, createdAt: "2026-05-22T08:15:00Z" },
  { paymentId: "pay_Z1b21901as", orderId: "order_Z1b21901as", userId: "user_c", plan: "premium", amount: 299, status: "captured", refunded: false, createdAt: "2026-05-24T18:45:00Z" },
  { paymentId: "pay_failed_1", orderId: "order_failed_1", userId: "user_d", plan: "basic", amount: 49, status: "failed", refunded: false, createdAt: "2026-05-25T11:20:00Z" },
];

const MOCK_AUDIT = [
  { adminId: "admin_tester", adminEmail: "founder@gapl.co", adminRole: "super_admin", action: "Admin Login", details: "Admin successfully logged into control panel" },
  { adminId: "admin_tester", adminEmail: "founder@gapl.co", adminRole: "super_admin", action: "Role Change", details: "Promoted support@gapl.co to support role" },
];

const DEFAULT_PROMPTS = [
  { id: "resume-parser", name: "Resume Parser", content: "Parse this resume and extract...", version: 1, lastUpdated: "2026-05-01T10:00:00Z" },
  { id: "jd-analyzer", name: "JD Analyzer", content: "Compare resume with the JD...", version: 1, lastUpdated: "2026-05-01T10:00:00Z" },
  { id: "resume-optimizer", name: "Resume Optimizer", content: "Optimize resume and return...", version: 1, lastUpdated: "2026-05-01T10:00:00Z" },
  { id: "ats-evaluator", name: "ATS Evaluator", content: "Evaluate resume ATS compliance...", version: 1, lastUpdated: "2026-05-01T10:00:00Z" },
  { id: "recruiter-simulation", name: "Recruiter Simulation", content: "Simulate recruiter review...", version: 1, lastUpdated: "2026-05-01T10:00:00Z" },
  { id: "career-gap", name: "Career Gap Engine", content: "Identify career gaps...", version: 1, lastUpdated: "2026-05-01T10:00:00Z" },
];

export async function POST(req: NextRequest) {
  try {
    // 1. Seed Users
    for (const u of MOCK_USERS) {
      await setDoc(doc(db, "users", u.uid), {
        displayName: u.displayName,
        email: u.email,
        role: u.role,
        plan: u.plan,
        createdAt: u.createdAt,
        analysisCount: u.analysisCount,
        suspended: u.suspended || false,
      });
    }

    // 2. Seed Reports
    for (const r of MOCK_REPORTS) {
      await setDoc(doc(db, "reports", r.id), {
        userId: r.userId,
        createdAt: r.createdAt,
        role: r.role,
        companyTier: r.companyTier,
        atsScore: r.atsScore,
        readiness: r.readiness,
        recruiterVerdict: r.recruiterVerdict,
        missingSkills: ["Docker", "Redis", "Kafka"],
        strongSkills: ["JavaScript", "TypeScript", "React"],
        careerGaps: [
          { skill: "Docker", currentLevel: "Beginner", priority: "Critical", recommendedProject: "Containerize microservices stack", difficulty: "Medium", estimatedWeeks: 2, expectedReadinessAfter: 85 }
        ],
        roadmap: [
          { week: 1, title: "Docker basics", description: "Learn fundamentals", tasks: ["Write Dockerfile", "Docker-compose"], milestone: "Containers up" }
        ],
      });
    }

    // 3. Seed AI Calls
    const aiCallsRef = collection(db, "ai_calls");
    for (const call of MOCK_AI_CALLS) {
      await addDoc(aiCallsRef, {
        ...call,
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Seed Payments
    for (const p of MOCK_PAYMENTS) {
      await setDoc(doc(db, "payments", p.paymentId), {
        ...p,
      });
    }

    // 5. Seed Audit
    const auditRef = collection(db, "audit_logs");
    for (const a of MOCK_AUDIT) {
      await addDoc(auditRef, {
        ...a,
        timestamp: new Date().toISOString(),
      });
    }

    // 6. Seed Prompts
    for (const pr of DEFAULT_PROMPTS) {
      await setDoc(doc(db, "prompts", pr.id), {
        name: pr.name,
        content: pr.content,
        version: pr.version,
        lastUpdated: pr.lastUpdated,
      });
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully!" });
  } catch (err: any) {
    console.error("Seeding failed:", err);
    return NextResponse.json({ error: err?.message || "Seeding failed." }, { status: 500 });
  }
}
