"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PRICING_PLANS } from "@/lib/mock-data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Check, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/auth-fetch";

// Load Razorpay script dynamically
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as unknown as Record<string, unknown>).Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BillingPage() {
  const { user, userDoc } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const currentPlan = String(userDoc?.plan || "free").toLowerCase();
  
  const PLAN_RANK: Record<string, number> = {
    free: 0,
    basic: 1,
    pro: 2,
    premium: 3,
  };
  
  const currentRank = PLAN_RANK[currentPlan] ?? PLAN_RANK.free;

  const availablePlans = PRICING_PLANS.filter((p) => {
    const planNameLower = p.name.toLowerCase();
    if (planNameLower === "free") return false;
    const planRank = PLAN_RANK[planNameLower] ?? 0;
    return planRank > currentRank;
  });

  const handleUpgrade = async (planName: string) => {
    setError("");
    setLoadingPlan(planName);

    try {
      import("@/lib/analytics").then(({ trackEvent }) => trackEvent("payment_started"));

      // 1. Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) {
        setError("Could not load payment gateway. Check your internet connection.");
        setLoadingPlan(null);
        return;
      }

      // 2. Create order on server
      const res = await authFetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create payment order.");
        setLoadingPlan(null);
        return;
      }

      // 3. Open Razorpay checkout
      const RazorpayConstructor = (window as unknown as Record<string, unknown>).Razorpay as new (options: unknown) => { open(): void };
      const rzp = new RazorpayConstructor({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Gapl",
        description: `${planName} Plan — Beta access`,
        prefill: {
          name: user?.displayName || "",
          email: user?.email || "",
        },
        theme: { color: "#4F46E5" },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
        handler: async (response: Record<string, string>) => {
          setLoadingPlan(planName);
          try {
            const verifyRes = await authFetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              import("@/lib/analytics").then(({ trackEvent }) => trackEvent("payment_success"));
              setSuccessPlan(planName);
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              setError(verifyData.error || "Payment verification failed.");
            }
          } catch {
            setError("Verification request failed. Please contact support.");
          } finally {
            setLoadingPlan(null);
          }
        },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setError("Payment failed. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-ink">
          Billing
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-sm text-ink-muted mt-0.5">
          Manage your plan and payments
        </motion.p>
      </div>

      {/* Success banner */}
      {successPlan && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl">
          <CheckCircle2 size={16} className="text-[#16a34a] flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#16a34a]">Payment successful!</p>
            <p className="text-xs text-[#15803d] mt-0.5">You&apos;re now on the <strong>{successPlan}</strong> plan.</p>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl">
          <p className="text-xs text-[#dc2626]">{error}</p>
        </div>
      )}

      {/* Current plan */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-muted mb-1">Current plan</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-ink capitalize">{successPlan ?? String(userDoc?.plan || "free")}</p>
                <Badge variant="default">Active</Badge>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Usage resets monthly. Your plan controls the available analysis credits.
              </p>
            </div>
            <div className="p-3 bg-surface-subtle rounded-xl border border-border-DEFAULT">
              <Zap size={20} className="text-ink-muted" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Plans */}
      {availablePlans.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-ink mb-4">Upgrade your plan</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePlans.map((plan, i) => {
              const isLoading = loadingPlan === plan.name;
              const isSuccess = successPlan === plan.name;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.08 }}
                  className={cn(
                    "rounded-2xl p-5 border flex flex-col",
                    plan.highlighted ? "bg-[#111111] border-[#111111]" : "bg-white border-border-DEFAULT"
                  )}
                >
                  {plan.highlighted && (
                    <span className="text-xs font-medium text-primary-400 mb-2">Most Popular</span>
                  )}
                  <h3 className={cn("text-sm font-semibold mb-0.5", plan.highlighted ? "text-white" : "text-ink")}>
                    {plan.name}
                  </h3>
                  <p className={cn("text-xs mb-3", plan.highlighted ? "text-zinc-400" : "text-ink-muted")}>
                    {plan.description}
                  </p>
                  <div className="flex items-end gap-1 mb-4">
                    <span className={cn("text-2xl font-bold", plan.highlighted ? "text-white" : "text-ink")}>
                      ₹{plan.price}
                    </span>
                    <span className={cn("text-xs mb-0.5", plan.highlighted ? "text-zinc-400" : "text-ink-muted")}> one-time</span>
                  </div>
                  <ul className="space-y-2 mb-5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check size={12} className={cn("mt-0.5 flex-shrink-0", plan.highlighted ? "text-zinc-400" : "text-success")} />
                        <span className={cn("text-xs", plan.highlighted ? "text-zinc-300" : "text-ink-secondary")}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    variant={plan.highlighted ? "secondary" : "outline"}
                    className="w-full gap-2"
                    disabled={isLoading || isSuccess}
                    onClick={() => handleUpgrade(plan.name)}
                  >
                    {isSuccess ? (
                      <><CheckCircle2 size={13} /> Active</>
                    ) : isLoading ? (
                      <><Loader2 size={13} className="animate-spin" /> Opening…</>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          <p className="text-xs text-ink-muted mt-4 text-center">
            One-time beta access payments processed by Razorpay
          </p>
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-border-DEFAULT rounded-2xl shadow-xs">
          <CheckCircle2 className="mx-auto text-[#16a34a] mb-3 animate-bounce" size={32} />
          <h3 className="text-sm font-semibold text-ink">You are on the highest tier plan</h3>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-sm mx-auto">
            Thank you for supporting Gapl! You have full access to all analyses, roadmaps, and optimization features.
          </p>
        </div>
      )}
    </div>
  );
}
