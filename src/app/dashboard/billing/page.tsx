"use client";

import { useState } from "react";
import { PRICING_PLANS } from "@/lib/mock-data";
import { PLAN_LIMITS } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { Sheet, PageHeader, FigureStrip, APP_PAGE } from "@/components/ui/Sheet";
import { Check, CheckCircle2, AlertCircle } from "lucide-react";
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
        theme: { color: "#1D2B6B" },
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

  const shownPlan = successPlan ?? String(userDoc?.plan || "free");
  const limit = PLAN_LIMITS[shownPlan.toLowerCase()] ?? PLAN_LIMITS.free;

  return (
    <div className={APP_PAGE}>
      <PageHeader title="Billing" description="Your plan and what it includes. Paid plans are billed monthly." />

      {successPlan && (
        <div role="status" className="flex items-start gap-3 p-4 bg-success-bg border border-success-border rounded-[6px]">
          <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-success">Payment successful</p>
            <p className="text-sm text-success">You&apos;re now on the <strong>{successPlan}</strong> plan. Refreshing…</p>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 p-3 bg-danger-bg border border-danger-border rounded-[5px]">
          <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <Sheet title="Current plan" aside={<span className="stamp text-[0.625rem] text-success bg-success-bg">Active</span>}>
        <FigureStrip
          items={[
            { label: "Plan", value: <span className="capitalize">{shownPlan}</span> },
            { label: "Analyses a month", value: limit },
            { label: "Credits reset", value: "1st", note: "of every month" },
          ]}
        />
      </Sheet>

      {availablePlans.length > 0 ? (
        <Sheet title="Upgrade" aside="Monthly · Razorpay">
          <ul className="chart-rows">
            {availablePlans.map((plan) => {
              const isLoading = loadingPlan === plan.name;
              const isSuccess = successPlan === plan.name;
              return (
                <li
                  key={plan.name}
                  className="grid gap-x-6 gap-y-4 px-4 sm:px-6 py-5 lg:grid-cols-[11rem_minmax(0,1fr)_7rem_10rem] lg:items-center"
                >
                  <div>
                    <h3 className="text-lg font-[800] tracking-[-0.015em]">{plan.name}</h3>
                    <p className="text-sm text-ink-muted">{plan.description}</p>
                    {plan.highlighted && <span className="stamp mt-2 text-[0.625rem] text-ink bg-board">Recommended</span>}
                  </div>
                  <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink-secondary">
                        <Check size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="lg:text-right">
                    <span className="chart-data text-2xl font-bold">₹{plan.price}</span>
                    <span className="block text-xs text-ink-muted">per month</span>
                  </p>
                  <Button
                    size="md"
                    variant={plan.highlighted ? "primary" : "outline"}
                    className="w-full"
                    disabled={isLoading || isSuccess}
                    loading={isLoading}
                    onClick={() => handleUpgrade(plan.name)}
                  >
                    {isSuccess ? "Active" : isLoading ? "Opening…" : plan.cta}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      ) : (
        <Sheet>
          <div className="px-5 sm:px-8 py-10">
            <span className="stamp text-xs text-success bg-success-bg">Highest plan</span>
            <h2 className="mt-3 text-xl font-[800] tracking-[-0.015em]">You&apos;re on the highest plan</h2>
            <p className="mt-2 max-w-lg text-[0.9375rem] text-ink-secondary">
              Thank you for supporting Gapl. You have access to every analysis, roadmap and CV feature.
            </p>
          </div>
        </Sheet>
      )}
    </div>
  );
}
