"use client";

import { useState } from "react";
import { CREDIT_PACKS, creditBalance, pricePerCredit, type CreditPack } from "@/lib/plans";
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
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [successPack, setSuccessPack] = useState<CreditPack | null>(null);
  const [error, setError] = useState("");
  const credits = creditBalance(userDoc ?? {});
  const purchased = Number(userDoc?.creditsPurchased || 0);

  const handleBuy = async (pack: CreditPack) => {
    setError("");
    setLoadingPack(pack.id);

    try {
      import("@/lib/analytics").then(({ trackEvent }) => trackEvent("payment_started"));

      // 1. Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) {
        setError("Could not load payment gateway. Check your internet connection.");
        setLoadingPack(null);
        return;
      }

      // 2. Create order on server
      const res = await authFetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: pack.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create payment order.");
        setLoadingPack(null);
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
        description: `${pack.name} pack · ${pack.credits} credits`,
        prefill: {
          name: user?.displayName || "",
          email: user?.email || "",
        },
        theme: { color: "#1D2B6B" },
        modal: {
          ondismiss: () => setLoadingPack(null),
        },
        handler: async (response: Record<string, string>) => {
          setLoadingPack(pack.id);
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
              setSuccessPack(pack);
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              setError(verifyData.error || "Payment verification failed.");
            }
          } catch {
            setError("Verification request failed. Please contact support.");
          } finally {
            setLoadingPack(null);
          }
        },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setError("Payment failed. Please try again.");
      setLoadingPack(null);
    }
  };

  return (
    <div className={APP_PAGE}>
      <PageHeader title="Billing" description="Buy credits once and use them whenever you need. Credits never expire." />

      {successPack && (
        <div role="status" className="flex items-start gap-3 p-4 bg-success-bg border border-success-border rounded-[6px]">
          <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-success">Payment successful</p>
            <p className="text-sm text-success">
              <strong>{successPack.credits} credits</strong> were added to your account. Refreshing…
            </p>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 p-3 bg-danger-bg border border-danger-border rounded-[5px]">
          <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <Sheet title="Your credits" aside={<span className="tag text-[0.625rem] text-success bg-success-bg">Never expire</span>}>
        <FigureStrip
          items={[
            { label: "Credits left", value: credits },
            { label: "Credits bought", value: purchased },
            { label: "One credit", value: "1 use", note: "analysis, CV build or tailor" },
          ]}
        />
      </Sheet>

      <Sheet title="Buy credits" aside="Razorpay · one-time payment">
        <ul className="divide-y divide-border-DEFAULT">
          {CREDIT_PACKS.map((pack) => {
            const isLoading = loadingPack === pack.id;
            const isSuccess = successPack?.id === pack.id;
            return (
              <li
                key={pack.id}
                className="grid gap-x-6 gap-y-4 px-4 sm:px-6 py-5 lg:grid-cols-[11rem_minmax(0,1fr)_7rem_10rem] lg:items-center"
              >
                <div>
                  <h3 className="text-lg font-bold tracking-[-0.015em]">{pack.name}</h3>
                  <p className="text-sm text-ink-muted">{pack.description}</p>
                  {pack.highlighted && <span className="tag mt-2 text-[0.625rem] text-ink bg-highlight">Best value for most</span>}
                </div>
                <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {[`${pack.credits} credits`, `₹${pricePerCredit(pack)} per credit`, "Never expire", "Every feature included"].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-secondary">
                      <Check size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="lg:text-right">
                  <span className="figure text-2xl font-bold">₹{pack.priceInr}</span>
                  <span className="block text-xs text-ink-muted">one-time</span>
                </p>
                <Button
                  size="md"
                  variant={pack.highlighted ? "primary" : "outline"}
                  className="w-full"
                  disabled={loadingPack !== null || isSuccess}
                  loading={isLoading}
                  onClick={() => handleBuy(pack)}
                >
                  {isSuccess ? "Added" : isLoading ? "Opening…" : `Buy ${pack.credits} credits`}
                </Button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </div>
  );
}
