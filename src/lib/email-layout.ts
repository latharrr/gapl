/**
 * Shared HTML frame for every Gapl email, in the Recruiter's Read world:
 * a charcoal desk header with the highlighted Gapl wordmark, a white paper body,
 * table-based layout and inline styles so it survives email clients.
 */

export const EMAIL = {
  desk: "#141519",
  highlight: "#ffe14d",
  highlightSoft: "#fff6c8",
  ink: "#16171b",
  muted: "#5e616a",
  paper: "#ffffff",
  ground: "#f2f2ee",
  rule: "#e1e1db",
  band: "#f7f7f4",
  danger: "#c8302a",
  fix: "#1f44a8",
  success: "#17784a",
  font: "'Mona Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

/** Primary call to action: a highlighter-yellow button with ink text. */
export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:${EMAIL.highlight};color:${EMAIL.ink};padding:13px 22px;border-radius:8px;font-family:${EMAIL.font};font-size:15px;font-weight:700;text-decoration:none;">${escapeHtml(label)}</a>`;
}

/** Wraps an inner HTML fragment in the branded frame. */
export function emailLayout(inner: string, opts: { preheader?: string } = {}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</div>`
    : "";
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background-color:${EMAIL.ground};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL.ground};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
      <tr><td style="background-color:${EMAIL.desk};border-radius:10px 10px 0 0;padding:18px 28px;">
        <a href="${appUrl}" style="display:inline-block;background-color:${EMAIL.highlight};color:${EMAIL.ink};border-radius:3px;padding:3px 8px;font-family:${EMAIL.font};font-size:19px;font-weight:800;text-decoration:none;letter-spacing:-0.03em;">Gapl</a>
      </td></tr>
      <tr><td style="background-color:${EMAIL.paper};border-radius:0 0 10px 10px;padding:32px 28px;font-family:${EMAIL.font};font-size:15px;line-height:1.6;color:${EMAIL.ink};">
        ${inner}
      </td></tr>
      <tr><td style="padding:16px 28px;font-family:${EMAIL.font};font-size:12px;line-height:1.5;color:${EMAIL.muted};">
        Gapl · Your resume, read the way a recruiter reads it. Scores are AI estimates, and every one comes with its reasons.<br>
        <a href="${appUrl}" style="color:${EMAIL.muted};">${appUrl.replace(/^https?:\/\//, "")}</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
