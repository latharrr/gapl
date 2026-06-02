import { getAdminDb } from "./firebase-admin";
import { sendEmail } from "./resend";
import { createTrackableLink } from "./link-tracker";

// Utility to parse and replace all links targeting Gapl with links.gapl.in redirects
async function rewriteLinks({
  html,
  campaignId,
  emailId,
  userId,
}: {
  html: string;
  campaignId: string;
  emailId: string;
  userId: string;
}): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";
  // Regex matches href="https://gapl.in/..." or href="http://localhost:3000/..."
  const regex = new RegExp(`href=["'](${appUrl}[^"']*)["']`, "g");
  const matches = [...html.matchAll(regex)];

  let rewrittenHtml = html;

  for (const match of matches) {
    const originalUrl = match[1];

    // Determine link name based on URL
    let linkName = "CTA Link";
    if (originalUrl.includes("/report/")) linkName = "View Report Button";
    else if (originalUrl.includes("/analyze")) linkName = "Start Analysis Button";
    else if (originalUrl.includes("/dashboard")) linkName = "User Dashboard Link";
    else if (originalUrl.includes("/billing") || originalUrl.includes("/pricing")) linkName = "Billing Pricing Link";

    // Generate unique short id
    const linkId = Math.random().toString(36).substring(2, 8);

    // Register trackable link
    const trackingUrl = await createTrackableLink({
      id: linkId,
      targetUrl: originalUrl.replace(appUrl, "") || "/", // save path only
      name: linkName,
      campaignId,
      emailId,
      userId,
    });

    rewrittenHtml = rewrittenHtml.replace(originalUrl, trackingUrl);
  }

  return rewrittenHtml;
}

interface DispatchOptions {
  userId: string;
  email: string;
  campaignId: string;
  campaignName: string;
  subject: string;
  bodyHtml: string;
}

// Low-level helper to log messages, rewrite links, dispatch, and update resendEmailId
async function dispatchEmail({
  userId,
  email,
  campaignId,
  campaignName,
  subject,
  bodyHtml,
}: DispatchOptions) {
  const db = getAdminDb();
  
  // 1. Ensure Campaign Document Exists
  const campaignRef = db.collection("email_campaigns").doc(campaignId);
  const campaignSnap = await campaignRef.get();
  if (!campaignSnap.exists) {
    await campaignRef.set({
      id: campaignId,
      name: campaignName,
      type: campaignId.includes("welcome") || campaignId.includes("payment") ? "transactional" : "retention",
      subject,
      createdAt: new Date().toISOString(),
    });
  }

  // 2. Create Message Track Document (status: 'draft')
  const messageRef = db.collection("email_messages").doc();
  const messageId = messageRef.id;

  const timestamp = new Date().toISOString();

  // 3. Rewrite HTML links using messageId context
  const trackingHtml = await rewriteLinks({
    html: bodyHtml,
    campaignId,
    emailId: messageId,
    userId,
  });

  const msgPayload = {
    id: messageId,
    campaignId,
    userId,
    email,
    resendEmailId: "pending",
    status: "sending",
    sentAt: timestamp,
    deliveredAt: null,
    openedAt: null,
    clickedAt: null,
    firstVisitAt: null,
    convertedAt: null,
  };

  await messageRef.set(msgPayload);

  // 4. Send Email via Resend
  try {
    const res = await sendEmail({
      to: email,
      subject,
      html: trackingHtml,
      tags: [
        { name: "campaign_id", value: campaignId },
        { name: "message_id", value: messageId },
      ],
    });

    // 5. Update status & resendEmailId
    await messageRef.update({
      resendEmailId: res.id || "mock-id",
      status: res.isMock ? "delivered" : "sent", // mock auto-delivers in development
      deliveredAt: res.isMock ? timestamp : null,
    });

    // Write to email_events log
    const eventRef = db.collection("email_events").doc();
    await eventRef.set({
      id: eventRef.id,
      emailId: messageId,
      userId,
      type: "email_sent",
      timestamp,
      metadata: { campaignId, to: email, subject },
    });

    // Log to global analytics events
    await db.collection("analytics_events").add({
      event: "email_sent",
      campaignId,
      emailId: messageId,
      userId,
      timestamp,
    });

    return messageId;
  } catch (err: any) {
    await messageRef.update({
      status: "failed",
      error: err.message || "Sending failed",
    });
    throw err;
  }
}

// ── Welcome Email ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(userId: string, email: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";
  
  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111111;">
      <h2>Welcome to Gapl, ${name}!</h2>
      <p>Thanks for joining our community.</p>
      <p>To accelerate your job search, upload your resume and target job description to discover:</p>
      <ul>
        <li><strong>Why recruiters reject you:</strong> Live recruiter alignment reviews.</li>
        <li><strong>Which skills you are missing:</strong> Core missing technical topics.</li>
        <li><strong>What project to build next:</strong> Custom evidence roadmaps.</li>
      </ul>
      <div style="margin: 32px 0;">
        <a href="${appUrl}/analyze" style="background-color: #111111; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Start Analysis →
        </a>
      </div>
      <p style="font-size: 12px; color: #71717a; margin-top: 48px;">
        Gapl | Application Readiness Intelligence Engine
      </p>
    </div>
  `;

  return dispatchEmail({
    userId,
    email,
    campaignId: "welcome_email",
    campaignName: "Welcome Onboarding Sequence",
    subject: "Welcome to Gapl",
    bodyHtml,
  });
}

// ── Report Ready Email ────────────────────────────────────────────────────────
export async function sendReportReadyEmail(
  userId: string,
  email: string,
  reportId: string,
  atsScore: number,
  readiness: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";

  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111111;">
      <h2>Your Gapl report is ready!</h2>
      <p>We have completed evaluating your application readiness profile.</p>
      
      <div style="display: flex; gap: 16px; margin: 24px 0;">
        <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; flex: 1;">
          <p style="font-size: 12px; color: #71717a; margin: 0 0 8px 0;">ATS SCORE</p>
          <span style="font-size: 24px; font-weight: bold; color: #dc2626;">${atsScore}%</span>
        </div>
        <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; flex: 1;">
          <p style="font-size: 12px; color: #71717a; margin: 0 0 8px 0;">READINESS</p>
          <span style="font-size: 24px; font-weight: bold; color: #16a34a;">${readiness}%</span>
        </div>
      </div>

      <p>We simulated recruiter reviews and mapped out a custom roadmap to fill your skill gaps.</p>
      <div style="margin: 32px 0;">
        <a href="${appUrl}/report/${reportId}" style="background-color: #111111; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
          View Report →
        </a>
      </div>
      <p style="font-size: 12px; color: #71717a; margin-top: 48px;">
        Gapl | Application Readiness Intelligence Engine
      </p>
    </div>
  `;

  return dispatchEmail({
    userId,
    email,
    campaignId: "report_ready",
    campaignName: "Analysis Finished Notification",
    subject: "Your Gapl report is ready",
    bodyHtml,
  });
}

// ── Payment Success Email ─────────────────────────────────────────────────────
export async function sendPaymentSuccessEmail(
  userId: string,
  email: string,
  paymentId: string,
  plan: string,
  amount: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";

  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111111;">
      <h2>Payment Receipt & Confirmation</h2>
      <p>Thanks for upgrading. Your transaction was processed successfully.</p>
      
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Plan:</strong> ${plan.toUpperCase()}</p>
        <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Amount Paid:</strong> $${(amount / 100).toFixed(2)}</p>
        <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Transaction ID:</strong> ${paymentId}</p>
        <p style="margin: 0; font-size: 14px;"><strong>Status:</strong> Captured (Credits Added)</p>
      </div>

      <p>Go to your dashboard to review your upgraded limits and begin deep-scanning reports.</p>
      <div style="margin: 32px 0;">
        <a href="${appUrl}/dashboard" style="background-color: #111111; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Go to Dashboard →
        </a>
      </div>
      <p style="font-size: 12px; color: #71717a; margin-top: 48px;">
        Gapl | Application Readiness Intelligence Engine
      </p>
    </div>
  `;

  return dispatchEmail({
    userId,
    email,
    campaignId: "payment_receipt",
    campaignName: "Receipt Billing Transaction",
    subject: "Receipt: Plan Purchased",
    bodyHtml,
  });
}

// ── Day 1 Reminder ────────────────────────────────────────────────────────────
export async function sendDay1ReminderEmail(
  userId: string,
  email: string,
  reportId: string,
  topGap: string,
  recommendedProject: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";

  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111111;">
      <h2>You haven't started your roadmap yet</h2>
      <p>Fill the gaps and stand out to recruiters.</p>
      
      <div style="border-left: 4px solid #4f46e5; padding-left: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4f46e5;"><strong>Top Skill Deficit:</strong></p>
        <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold;">${topGap}</p>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4f46e5;"><strong>Recommended Action Project:</strong></p>
        <p style="margin: 0; font-size: 16px; font-weight: bold;">${recommendedProject}</p>
      </div>

      <p>Every day without actions is another day without recruiter signals. Start tracking tasks today.</p>
      <div style="margin: 32px 0;">
        <a href="${appUrl}/report/${reportId}#roadmap" style="background-color: #111111; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Start Building →
        </a>
      </div>
      <p style="font-size: 12px; color: #71717a; margin-top: 48px;">
        Gapl | Application Readiness Intelligence Engine
      </p>
    </div>
  `;

  return dispatchEmail({
    userId,
    email,
    campaignId: "day_1_reminder",
    campaignName: "Inactivity Day 1 Reminder",
    subject: "You haven't started your roadmap yet",
    bodyHtml,
  });
}

// ── Roadmap Milestone Email ───────────────────────────────────────────────────
export async function sendRoadmapMilestoneEmail(
  userId: string,
  email: string,
  reportId: string,
  percentage: number,
  currentReadiness: number,
  targetReadiness: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";

  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111111;">
      <h2>You're ${percentage}% done with your roadmap!</h2>
      <p>Outstanding progress. You are successfully closing your skill gaps.</p>
      
      <div style="background-color: #eef2ff; border: 1px solid #e0e7ff; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #4338ca; uppercase font-weight: bold;">EST. READINESS SCORES</p>
        <span style="font-size: 32px; font-weight: bold; color: #4338ca;">${currentReadiness}% → ${targetReadiness}%</span>
      </div>

      <p>Keep the momentum going. Finish your remaining checklist items and stand out to recruiters.</p>
      <div style="margin: 32px 0;">
        <a href="${appUrl}/report/${reportId}#roadmap" style="background-color: #111111; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Keep going →
        </a>
      </div>
      <p style="font-size: 12px; color: #71717a; margin-top: 48px;">
        Gapl | Application Readiness Intelligence Engine
      </p>
    </div>
  `;

  return dispatchEmail({
    userId,
    email,
    campaignId: `milestone_${percentage}`,
    campaignName: `Roadmap Milestone ${percentage}% Notification`,
    subject: `You're ${percentage}% done!`,
    bodyHtml,
  });
}

// ── Day 7 Reminder ────────────────────────────────────────────────────────────
export async function sendDay7ReminderEmail(
  userId: string,
  email: string,
  reportId: string,
  completedTasksCount: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";

  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111111;">
      <h2>Weekly Roadmap Sync</h2>
      <p>It's been a week since we generated your readiness checklist. Let's sync up.</p>
      <p>You have completed <strong>${completedTasksCount}</strong> tasks so far.</p>
      <p>Consistent effort is what separates successful candidates. Stand out by updating your roadmap progress.</p>
      <div style="margin: 32px 0;">
        <a href="${appUrl}/report/${reportId}#roadmap" style="background-color: #111111; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Resume Roadmap →
        </a>
      </div>
      <p style="font-size: 12px; color: #71717a; margin-top: 48px;">
        Gapl | Application Readiness Intelligence Engine
      </p>
    </div>
  `;

  return dispatchEmail({
    userId,
    email,
    campaignId: "day_7_reminder",
    campaignName: "Inactivity Day 7 Reminder",
    subject: "Your Weekly Roadmap Sync",
    bodyHtml,
  });
}

// ── Reanalysis Reminder ───────────────────────────────────────────────────────
export async function sendReanalysisReminderEmail(userId: string, email: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";

  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111111;">
      <h2>Time to re-analyze your resume?</h2>
      <p>If you've completed your roadmap goals and built new projects, you've improved your readiness profile.</p>
      <p>Upload your updated resume now to recalculate your ATS score, verify gap closures, and see your score jump.</p>
      <div style="margin: 32px 0;">
        <a href="${appUrl}/analyze" style="background-color: #111111; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Analyze Again →
        </a>
      </div>
      <p style="font-size: 12px; color: #71717a; margin-top: 48px;">
        Gapl | Application Readiness Intelligence Engine
      </p>
    </div>
  `;

  return dispatchEmail({
    userId,
    email,
    campaignId: "reanalysis_reminder",
    campaignName: "Two-Week Reanalysis Trigger",
    subject: "Time to check your score improvement?",
    bodyHtml,
  });
}
