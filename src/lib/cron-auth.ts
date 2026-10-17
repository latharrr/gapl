import type { NextRequest } from "next/server";

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
 * In production the secret must be configured AND match; a missing secret
 * fails closed (otherwise the literal header "Bearer undefined" would pass).
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
