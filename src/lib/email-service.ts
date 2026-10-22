import { getAdminDb } from "./firebase-admin";
import { sendEmail } from "./resend";
import { createTrackableLink } from "./link-tracker";
import { emailLayout, emailButton, escapeHtml, EMAIL } from "./email-layout";

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
    // Brand links (logo, footer) point at the bare homepage; don't spend a tracked link on them.
    if (originalUrl === appUrl || originalUrl === `${appUrl}/`) continue;

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
  preheader?: string;
}

// Low-level helper to log messages, rewrite links, dispatch, and update resendEmailId
async function dispatchEmail({
  userId,
  email,
  campaignId,
  campaignName,
  subject,
  bodyHtml,
  preheader,
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
    html: emailLayout(bodyHtml, { preheader }),
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
  } catch (err) {
    await messageRef.update({
      status: "failed",
      error: err instanceof Error ? err.message : "Sending failed",
    });
    throw err;
  }
}

// ── Welcome Email ─────────────────────────────────────────────────────────────
const h2 = (text: string) =>
  `<h1 style="margin:0 0 12px 0;font-family:${EMAIL.font};font-size:26px;line-height:1.15;font-weight:800;letter-spacing:-0.025em;color:${EMAIL.ink};">${text}</h1>`;
const para = (text: string) => `<p style="margin:0 0 14px 0;">${text}</p>`;
const label = (text: string, color: string = EMAIL.muted) =>
  `<p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${color};">${text}</p>`;
const cta = (href: string, text: string) => `<div style="margin:28px 0 8px 0;">${emailButton(href, text)}</div>`;

/** A row of figures on a ruled strip. */
function figures(items: { label: string; value: string; color?: string }[]): string {
  const cells = items
    .map(
      (it) => `<td style="padding:14px 16px;border-right:1px solid ${EMAIL.rule};vertical-align:top;">
        ${label(escapeHtml(it.label))}
        <span style="font-size:28px;font-weight:700;letter-spacing:-0.02em;color:${it.color ?? EMAIL.ink};">${escapeHtml(it.value)}</span>
      </td>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid ${EMAIL.rule};border-radius:8px;background-color:#ffffff;"><tr>${cells}</tr></table>`;
}

export async function sendWelcomeEmail(userId: string, email: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";
  const safeName = escapeHtml(String(name || "there").slice(0, 80));

  const bodyHtml =
    h2(`Welcome to Gapl, ${safeName}.`) +
    para("Gapl reads your resume the way a recruiter at your target tier would, and tells you three things:") +
    `<ul style="margin:0 0 14px 0;padding-left:20px;">
      <li style="margin-bottom:6px;"><strong>Why you're being filtered out:</strong> an honest recruiter verdict with the reasons.</li>
      <li style="margin-bottom:6px;"><strong>Which skills are missing:</strong> gaps ranked by impact for your role and tier.</li>
      <li><strong>What to build next:</strong> a week-by-week roadmap to close them.</li>
    </ul>` +
    para("Your first analysis is free.") +
    cta(`${appUrl}/analyze`, "Read my resume");

  return dispatchEmail({
    userId,
    email,
    campaignId: "welcome_email",
    campaignName: "Welcome Onboarding Sequence",
    subject: "Welcome to Gapl",
    bodyHtml,
    preheader: "Your first analysis is free. Here's what Gapl checks.",
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

  const bodyHtml =
    h2("Your read is ready.") +
    para("Gapl has finished reading your resume. Here's where it stands:") +
    figures([
      { label: "ATS", value: String(atsScore) },
      { label: "Readiness", value: String(readiness) },
    ]) +
    para("Your report has the recruiter's verdict, the gaps behind it, and a week-by-week roadmap to close them.") +
    cta(`${appUrl}/report/${encodeURIComponent(reportId)}`, "Open my report");

  return dispatchEmail({
    userId,
    email,
    campaignId: "report_ready",
    campaignName: "Analysis Finished Notification",
    subject: "Your Gapl report is ready",
    bodyHtml,
    preheader: `Readiness ${readiness}, ATS ${atsScore}. See the reasons and what to build.`,
  });
}

// ── Payment Success Email ─────────────────────────────────────────────────────
export async function sendPaymentSuccessEmail(
  userId: string,
  email: string,
  paymentId: string,
  plan: string,
  amount: number // whole rupees, e.g. 149
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";
  const rupees = `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  const planName = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "";

  const bodyHtml =
    h2("Payment received.") +
    para("Thanks for upgrading. Your plan is active now.") +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid ${EMAIL.rule};border-radius:8px;background-color:#ffffff;font-size:14px;">
      <tr><td style="padding:10px 16px;color:${EMAIL.muted};">Plan</td><td style="padding:10px 16px;font-weight:700;text-align:right;">${escapeHtml(planName)}</td></tr>
      <tr><td style="padding:10px 16px;color:${EMAIL.muted};background-color:${EMAIL.band};">Amount paid</td><td style="padding:10px 16px;font-weight:700;text-align:right;background-color:${EMAIL.band};">${escapeHtml(rupees)}</td></tr>
      <tr><td style="padding:10px 16px;color:${EMAIL.muted};">Payment ID</td><td style="padding:10px 16px;text-align:right;font-size:13px;">${escapeHtml(paymentId)}</td></tr>
      <tr><td style="padding:10px 16px;color:${EMAIL.muted};background-color:${EMAIL.band};">Status</td><td style="padding:10px 16px;font-weight:700;color:${EMAIL.success};text-align:right;background-color:${EMAIL.band};">Captured · credits added</td></tr>
    </table>` +
    para("Keep this email as your receipt.") +
    cta(`${appUrl}/dashboard`, "Go to my dashboard");

  return dispatchEmail({
    userId,
    email,
    campaignId: "payment_receipt",
    campaignName: "Receipt Billing Transaction",
    subject: `Receipt: Gapl ${planName} plan`,
    bodyHtml,
    preheader: `${rupees} received for the ${planName} plan.`,
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

  const bodyHtml =
    h2("Your roadmap hasn't started yet.") +
    para("One build closes the gap that's costing you the most:") +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid ${EMAIL.rule};border-radius:8px;background-color:#ffffff;">
      <tr><td style="padding:14px 16px;">${label("Top gap", EMAIL.danger)}<span style="font-size:16px;font-weight:700;">${escapeHtml(topGap)}</span></td></tr>
      <tr><td style="padding:14px 16px;background-color:${EMAIL.band};">${label("Build next", EMAIL.fix)}<span style="font-size:16px;font-weight:700;color:${EMAIL.fix};">${escapeHtml(recommendedProject)}</span></td></tr>
    </table>` +
    para("Tick off the first task today and your readiness starts moving.") +
    cta(`${appUrl}/report/${encodeURIComponent(reportId)}#roadmap`, "Start my roadmap");

  return dispatchEmail({
    userId,
    email,
    campaignId: "day_1_reminder",
    campaignName: "Inactivity Day 1 Reminder",
    subject: "You haven't started your roadmap yet",
    bodyHtml,
    preheader: `Build next: ${recommendedProject}`,
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

  const bodyHtml =
    h2(`You're ${escapeHtml(percentage)}% through your roadmap.`) +
    para("You're closing your gaps. Here's where your projected readiness stands:") +
    figures([
      { label: "Now", value: String(currentReadiness) },
      { label: "Target", value: String(targetReadiness), color: EMAIL.success },
    ]) +
    para("Finish the remaining tasks, then re-analyze your updated resume for a fresh read.") +
    cta(`${appUrl}/report/${encodeURIComponent(reportId)}#roadmap`, "Keep going");

  return dispatchEmail({
    userId,
    email,
    campaignId: `milestone_${percentage}`,
    campaignName: `Roadmap Milestone ${percentage}% Notification`,
    subject: `You're ${percentage}% done!`,
    bodyHtml,
    preheader: `Projected readiness ${currentReadiness} of ${targetReadiness}.`,
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

  const bodyHtml =
    h2("A week into your roadmap.") +
    para(`It's been a week since Gapl prepared your roadmap. You've completed <strong>${escapeHtml(completedTasksCount)}</strong> ${completedTasksCount === 1 ? "task" : "tasks"} so far.`) +
    para("Steady weekly progress is what turns a reject into a shortlist. Pick up the next task.") +
    cta(`${appUrl}/report/${encodeURIComponent(reportId)}#roadmap`, "Pick up the next task");

  return dispatchEmail({
    userId,
    email,
    campaignId: "day_7_reminder",
    campaignName: "Inactivity Day 7 Reminder",
    subject: "Your weekly roadmap check-in",
    bodyHtml,
    preheader: `${completedTasksCount} tasks done. Here's the next one.`,
  });
}

// ── Reanalysis Reminder ───────────────────────────────────────────────────────
export async function sendReanalysisReminderEmail(userId: string, email: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";

  const bodyHtml =
    h2("Time for a fresh read?") +
    para("If you've finished roadmap tasks or built new projects, your resume has changed.") +
    para("Upload the updated version for a fresh read and see which gaps you've closed.") +
    cta(`${appUrl}/analyze`, "Re-analyze my resume");

  return dispatchEmail({
    userId,
    email,
    campaignId: "reanalysis_reminder",
    campaignName: "Two-Week Reanalysis Trigger",
    subject: "Time to check your score improvement?",
    bodyHtml,
    preheader: "Upload your updated resume for a fresh read.",
  });
}
