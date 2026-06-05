"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { Bell, Shield, Trash2, User, AlertTriangle } from "lucide-react";
import { updateUserProfile, logOut } from "@/lib/firebase";
import { authFetch } from "@/lib/auth-fetch";

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await updateUserProfile(name.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e?.message || "Failed to update profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const [showDeleteReportsConfirm, setShowDeleteReportsConfirm] = useState(false);
  const [deletingReports, setDeletingReports] = useState(false);
  const [reportsSuccess, setReportsSuccess] = useState(false);

  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteReports = async () => {
    setDeletingReports(true);
    setError("");
    setReportsSuccess(false);
    try {
      const res = await authFetch("/api/user/delete-reports", {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete reports.");
      }
      setReportsSuccess(true);
      setShowDeleteReportsConfirm(false);
      setTimeout(() => setReportsSuccess(false), 4000);
    } catch (e: any) {
      setError(e?.message || "Failed to delete reports.");
    } finally {
      setDeletingReports(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeletingAccount(true);
    setError("");
    try {
      const res = await authFetch("/api/user/delete", {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account.");
      }
      await logOut();
      window.location.href = "/";
    } catch (e: any) {
      setError(e?.message || "Failed to delete account.");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-ink">
          Settings
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-sm text-ink-muted mt-0.5">
          Manage your account preferences
        </motion.p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card variant="default" padding="md">
          <div className="flex items-center gap-2 mb-5">
            <User size={14} className="text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink">Profile</h2>
          </div>
          <div className="space-y-4">
            <Input label="Display Name" value={name} onChange={(e) => setName(e.target.value)} id="settings-name" />
            <Input label="Email" value={user?.email || ""} disabled hint="Email cannot be changed" id="settings-email" />
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <Button size="sm" onClick={handleSave} variant={saved ? "outline" : "primary"} disabled={saving}>
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card variant="default" padding="md">
          <div className="flex items-center gap-2 mb-5">
            <Bell size={14} className="text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Weekly readiness digest", desc: "Get a weekly summary of your progress" },
              { label: "New role opportunities", desc: "Notifications when new role templates are added" },
              { label: "Roadmap reminders", desc: "Remind me to complete my weekly tasks" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="text-xs text-ink-muted">{item.desc}</p>
                </div>
                <button className="w-9 h-5 rounded-full bg-primary-600 relative transition-colors">
                  <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card variant="default" padding="md">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={14} className="text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink">Security</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface-subtle rounded-xl">
              <div>
                <p className="text-sm font-medium text-ink">Password</p>
                <p className="text-xs text-ink-muted">Last changed: never</p>
              </div>
              <Button size="sm" variant="outline">Change</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-subtle rounded-xl">
              <div>
                <p className="text-sm font-medium text-ink">Active sessions</p>
                <p className="text-xs text-ink-muted">1 session active</p>
              </div>
              <Button size="sm" variant="outline">View</Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Danger zone */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card variant="bordered" padding="md" className="border-danger/30">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 size={14} className="text-danger" />
            <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
          </div>
          <div className="space-y-4">
            {reportsSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-500 font-medium">
                All reports and associated analysis data have been deleted.
              </div>
            )}
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">Delete all reports</p>
                  <p className="text-xs text-ink-muted">Permanently remove all analysis data</p>
                </div>
                {!showDeleteReportsConfirm && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setShowDeleteReportsConfirm(true);
                      setShowDeleteAccountConfirm(false);
                      setError("");
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
              {showDeleteReportsConfirm && (
                <div className="p-4 bg-surface-subtle border border-border rounded-xl space-y-3">
                  <div className="flex gap-2 items-start text-xs text-ink-muted">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p>Are you sure you want to delete all reports? This action cannot be undone and will permanently purge all report documents and AI trace calls.</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setShowDeleteReportsConfirm(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="danger" onClick={handleDeleteReports} disabled={deletingReports}>
                      {deletingReports ? "Deleting..." : "Yes, delete all reports"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <hr className="border-border/50" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">Delete account</p>
                  <p className="text-xs text-ink-muted">Permanently remove your account and all data</p>
                </div>
                {!showDeleteAccountConfirm && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setShowDeleteAccountConfirm(true);
                      setShowDeleteReportsConfirm(false);
                      setDeleteConfirmText("");
                      setError("");
                    }}
                  >
                    Delete Account
                  </Button>
                )}
              </div>
              {showDeleteAccountConfirm && (
                <div className="p-4 bg-surface-subtle border border-danger/20 rounded-xl space-y-3">
                  <div className="flex gap-2 items-start text-xs text-ink-muted">
                    <AlertTriangle size={14} className="text-danger shrink-0 mt-0.5" />
                    <p>
                      <strong>WARNING:</strong> This is a permanent, non-reversible action. Deleting your account will completely purge all reports, roadmaps, optimization history, billing records, and your platform login account.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                      Type <span className="text-danger">DELETE</span> to confirm
                    </label>
                    <Input
                      placeholder="DELETE"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      id="delete-account-confirm"
                      className="border-danger/30 focus-visible:ring-danger/30 text-xs py-1 h-8"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setShowDeleteAccountConfirm(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== "DELETE" || deletingAccount}
                    >
                      {deletingAccount ? "Deleting..." : "Permanently Delete Account"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
