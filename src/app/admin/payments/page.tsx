"use client";

import { Loading } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Lock,
} from "lucide-react";

interface Payment {
  paymentId: string;
  userId?: string;
  plan?: string;
  amount?: number;
  status?: string;
  refunded?: boolean;
  createdAt: string;
}

interface PaymentsResponse {
  payments?: Payment[];
  error?: string;
}

async function loadPayments(): Promise<PaymentsResponse> {
  const res = await adminFetch("/api/admin/payments");
  const data: PaymentsResponse = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load payment logs");
  return data;
}

export default function AdminPaymentsPage() {
  const { user, userDoc } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [now] = useState(() => Date.now());

  const isSuperAdmin = userDoc?.role === "super_admin";

  const fetchPayments = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const data = await loadPayments();

      // Sort chronologically
      const sorted = (data.payments || []).sort(
        (a: Payment, b: Payment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPayments(sorted);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const data = await loadPayments();

        // Sort chronologically
        const sorted = (data.payments || []).sort(
          (a: Payment, b: Payment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        if (!cancelled) setPayments(sorted);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleRefund = async (paymentId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to refund this payment? The user's account plan will immediately revert to Free.")) return;

    setProcessingId(paymentId);
    try {
      const res = await adminFetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "refund", paymentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue refund");
      
      // Refresh logs
      await fetchPayments();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessingId("");
    }
  };

  // Metrics
  const grossRevenue = payments
    .filter((p) => p.status === "captured")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const refundedSum = payments
    .filter((p) => p.status === "refunded" || p.refunded === true)
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const failedCount = payments.filter((p) => p.status === "failed").length;
  const failureRate = payments.length > 0 ? (failedCount / payments.length) * 100 : 0;

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">Payments</h1>
        <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">Monitor client transactions, subscription orders, and execute billing refunds</p>
      </div>

      {error && (
        <div className="bg-danger-bg border border-danger-border text-danger p-4 rounded-[6px] text-xs">
          {error}
        </div>
      )}

      {/* Aggregate Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase tracking-wider block">Net Profit Collections</span>
          <p className="text-lg font-bold text-success mt-1.5">₹{grossRevenue - refundedSum}</p>
          <span className="text-[0.6875rem] text-ink-muted mt-0.5 block">Captured minus refunded sums</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase tracking-wider block">Refunded Volume</span>
          <p className="text-lg font-bold text-warning mt-1.5">₹{refundedSum}</p>
          <span className="text-[0.6875rem] text-ink-muted mt-0.5 block">Total transaction rollbacks</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase tracking-wider block">Failed Transactions</span>
          <p className="text-lg font-bold text-danger mt-1.5">{failedCount}</p>
          <span className="text-[0.6875rem] text-ink-muted mt-0.5 block">Dropped payment intents</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase tracking-wider block">Checkout Abandonment</span>
          <p className="text-lg font-bold text-ink mt-1.5">{failureRate.toFixed(1)}%</p>
          <span className="text-[0.6875rem] text-ink-muted mt-0.5 block">Proportion of failed payment links</span>
        </Card>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-DEFAULT bg-surface-subtle text-ink-muted font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Payment ID</th>
                <th className="px-5 py-3.5">User UID</th>
                <th className="px-5 py-3.5">Upgrade Plan</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-DEFAULT">
              {payments.map((p) => {
                const isCaptured = p.status === "captured";
                const isRefunded = p.status === "refunded" || p.refunded === true;
                const isFailed = p.status === "failed";

                return (
                  <tr key={p.paymentId} className="hover:bg-surface-subtle transition-colors text-ink">
                    <td className="px-5 py-4 font-mono text-[0.6875rem] text-ink-muted">
                      {p.paymentId}
                    </td>
                    <td className="px-5 py-4 text-ink-muted font-mono text-[0.6875rem]">
                      {p.userId || "anonymous"}
                    </td>
                    <td className="px-5 py-4 font-semibold uppercase text-primary-600 text-[0.6875rem]">
                      {p.plan}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-ink text-[0.6875rem]">
                      ₹{p.amount}
                    </td>
                    <td className="px-5 py-4">
                      {isCaptured && !isRefunded && (
                        <span className="text-success font-semibold flex items-center gap-1 text-[0.6875rem]">
                          <CheckCircle size={10} /> Captured
                        </span>
                      )}
                      {isRefunded && (
                        <span className="text-warning font-semibold flex items-center gap-1 text-[0.6875rem]">
                          <RotateCcw size={10} /> Refunded
                        </span>
                      )}
                      {isFailed && (
                        <span className="text-danger font-semibold flex items-center gap-1 text-[0.6875rem]">
                          <XCircle size={10} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-ink-muted text-[0.6875rem]">
                      {new Date(p.createdAt ?? now).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isCaptured && !isRefunded && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!isSuperAdmin || processingId === p.paymentId}
                          onClick={() => handleRefund(p.paymentId)}
                          className="px-2 py-0.5 h-auto text-[0.6875rem] border-danger-border text-danger hover:bg-danger-bg"
                        >
                          {!isSuperAdmin ? (
                            <span className="flex items-center gap-1"><Lock size={9} /> Refund</span>
                          ) : (
                            "Issue Refund"
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-ink-muted">
                    No payment transactions logged in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
