/**
 * Shared HTML frame for every Gapl email, in the PNR Status world:
 * rail-navy header with the yellow Gapl nameplate, chart-paper body,
 * table-based layout and inline styles so it survives email clients.
 */

export const EMAIL = {
  navy: "#1d2b6b",
  board: "#f5c518",
  boardInk: "#14140f",
  ink: "#17181f",
  muted: "#595c69",
  paper: "#fcfcf7",
  ground: "#f0f0e8",
  rule: "#d2d1c4",
  danger: "#b0241c",
  success: "#1d7337",
  font: "Archivo, 'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'Martian Mono', 'SFMono-Regular', Menlo, Consolas, monospace",
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

/** Primary call to action: station-board yellow with an ink rim. */
export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:${EMAIL.board};color:${EMAIL.boardInk};border:2px solid ${EMAIL.boardInk};padding:12px 22px;border-radius:6px;font-family:${EMAIL.font};font-size:15px;font-weight:700;text-decoration:none;">${escapeHtml(label)}</a>`;
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
      <tr><td style="background-color:${EMAIL.navy};border-bottom:3px solid ${EMAIL.board};border-radius:6px 6px 0 0;padding:16px 24px;">
        <a href="${appUrl}" style="display:inline-block;background-color:${EMAIL.board};color:${EMAIL.boardInk};border:2px solid ${EMAIL.boardInk};border-radius:4px;padding:4px 12px;font-family:${EMAIL.font};font-size:17px;font-weight:800;text-decoration:none;letter-spacing:-0.02em;">Gapl</a>
      </td></tr>
      <tr><td style="background-color:${EMAIL.paper};border-radius:0 0 6px 6px;padding:28px 24px;font-family:${EMAIL.font};font-size:15px;line-height:1.6;color:${EMAIL.ink};">
        ${inner}
      </td></tr>
      <tr><td style="padding:16px 24px;font-family:${EMAIL.font};font-size:12px;line-height:1.5;color:${EMAIL.muted};">
        Gapl · Application readiness for placement season. Scores are AI estimates, and every one comes with its reasons.<br>
        <a href="${appUrl}" style="color:${EMAIL.muted};">${appUrl.replace(/^https?:\/\//, "")}</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
