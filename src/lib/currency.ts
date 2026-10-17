/**
 * AI provider costs are billed in USD; Gapl's revenue is in INR.
 * Any figure that combines the two (profit, margin) converts AI cost to INR
 * at this rate. Set USD_TO_INR_RATE to keep it current.
 */
export function usdToInrRate(): number {
  const parsed = Number(process.env.USD_TO_INR_RATE);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 84;
}
