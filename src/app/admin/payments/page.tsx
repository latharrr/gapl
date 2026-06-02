"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Coins,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const { user, userDoc } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");

  const isSuperAdmin = userDoc?.role === "super_admin";

  const fetchPayments = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/payments", {
        headers: { "x-admin-uid": user.uid },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load payment logs");
      
      // Sort chronologically
      const sorted = (data.payments || []).sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPayments(sorted);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const handleRefund = async (paymentId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to refund this payment? The user's account plan will immediately revert to Free.")) return;

    setProcessingId(paymentId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-uid": user.uid,
        },
        body: JSON.stringify({ action: "refund", paymentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue refund");
      
      // Refresh logs
      await fetchPayments();
    } catch (e: any) {
      alert(e.message);
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
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Payments & Subscriptions</h1>
        <p className="text-xs text-[#a1a1aa] mt-0.5">Monitor client transactions, subscription orders, and execute billing refunds</p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Aggregate Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase tracking-wider block">Net Profit Collections</span>
          <p className="text-lg font-bold text-[#10b981] mt-1.5">${grossRevenue - refundedSum}</p>
          <span className="text-[9px] text-[#71717a] mt-0.5 block">Captured minus refunded sums</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase tracking-wider block">Refunded Volume</span>
          <p className="text-lg font-bold text-amber-400 mt-1.5">${refundedSum}</p>
          <span className="text-[9px] text-[#71717a] mt-0.5 block">Total transaction rollbacks</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase tracking-wider block">Failed Transactions</span>
          <p className="text-lg font-bold text-red-400 mt-1.5">{failedCount}</p>
          <span className="text-[9px] text-[#71717a] mt-0.5 block">Dropped payment intents</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase tracking-wider block">Checkout Abandonment</span>
          <p className="text-lg font-bold text-white mt-1.5">{failureRate.toFixed(1)}%</p>
          <span className="text-[9px] text-[#71717a] mt-0.5 block">Proportion of failed payment links</span>
        </Card>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#1c1c1f] text-[#71717a] font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Payment ID</th>
                <th className="px-5 py-3.5">User UID</th>
                <th className="px-5 py-3.5">Upgrade Plan</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {payments.map((p) => {
                const isCaptured = p.status === "captured";
                const isRefunded = p.status === "refunded" || p.refunded === true;
                const isFailed = p.status === "failed";

                return (
                  <tr key={p.paymentId} className="hover:bg-[#202024] transition-colors text-white">
                    <td className="px-5 py-4 font-mono text-[10px] text-[#a1a1aa]">
                      {p.paymentId}
                    </td>
                    <td className="px-5 py-4 text-[#71717a] font-mono text-[10px]">
                      {p.userId || "anonymous"}
                    </td>
                    <td className="px-5 py-4 font-semibold uppercase text-[#a5b4fc] text-[10px]">
                      {p.plan}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-white text-[10px]">
                      ${p.amount}
                    </td>
                    <td className="px-5 py-4">
                      {isCaptured && !isRefunded && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                          <CheckCircle size={10} /> Captured
                        </span>
                      )}
                      {isRefunded && (
                        <span className="text-amber-400 font-semibold flex items-center gap-1 text-[10px]">
                          <RotateCcw size={10} /> Refunded
                        </span>
                      )}
                      {isFailed && (
                        <span className="text-red-400 font-semibold flex items-center gap-1 text-[10px]">
                          <XCircle size={10} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[#71717a] text-[10px]">
                      {new Date(p.createdAt || Date.now()).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isCaptured && !isRefunded && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!isSuperAdmin || processingId === p.paymentId}
                          onClick={() => handleRefund(p.paymentId)}
                          className="px-2 py-0.5 h-auto text-[9px] border-red-950/60 text-red-400 hover:bg-red-950/20"
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
                  <td colSpan={7} className="text-center py-10 text-[#71717a]">
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
