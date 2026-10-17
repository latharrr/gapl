"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet, PageHeader, APP_PAGE } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
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

  const soon = <span className="stamp text-[0.625rem] text-ink-muted border-dashed">Coming soon</span>;

  return (
    <div className={APP_PAGE}>
      <PageHeader title="Settings" description="Your profile, notifications and account." />

      <Sheet title="Profile">
        <div className="px-4 sm:px-6 py-5 grid gap-4 max-w-xl">
          <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} id="settings-name" />
          <Input label="Email" value={user?.email || ""} disabled hint="Email can't be changed" id="settings-email" />
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} variant={saved ? "outline" : "primary"} disabled={saving} loading={saving}>
              {saving ? "Saving" : saved ? "Saved" : "Save changes"}
            </Button>
            {saved && (
              <span role="status" className="inline-flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 size={15} /> Profile updated
              </span>
            )}
          </div>
        </div>
      </Sheet>

      <Sheet title="Notifications" aside="Email">
        <ul className="divide-y divide-border-DEFAULT">
          {[
            { label: "Weekly readiness digest", desc: "A weekly summary of your progress" },
            { label: "New role templates", desc: "When new roles are added to Gapl" },
            { label: "Roadmap reminders", desc: "A nudge to finish your weekly tasks" },
          ].map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4">
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-sm text-ink-muted">{item.desc}</p>
              </div>
              {soon}
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet title="Security">
        <ul className="divide-y divide-border-DEFAULT">
          <li className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4">
            <div>
              <p className="font-semibold">Password</p>
              <p className="text-sm text-ink-muted">Change the password for email sign-in</p>
            </div>
            {soon}
          </li>
          <li className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4">
            <div>
              <p className="font-semibold">Active sessions</p>
              <p className="text-sm text-ink-muted">See where you&apos;re signed in</p>
            </div>
            {soon}
          </li>
        </ul>
      </Sheet>

      <section className="rounded-[6px] border-[1.5px] border-danger overflow-hidden bg-surface-DEFAULT">
        <header className="px-4 sm:px-6 py-3 bg-danger-bg border-b border-danger-border">
          <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-danger">Danger zone</h2>
        </header>
        <div className="divide-y divide-border-DEFAULT">
          {(reportsSuccess || error) && (
            <div className="px-4 sm:px-6 py-3">
              {reportsSuccess && (
                <p role="status" className="text-sm font-medium text-success">
                  All reports and their analysis data have been deleted.
                </p>
              )}
              {error && (
                <p role="alert" className="text-sm font-medium text-danger">
                  {error}
                </p>
              )}
            </div>
          )}

          <div className="px-4 sm:px-6 py-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Delete all reports</p>
                <p className="text-sm text-ink-muted">Permanently remove every analysis and its data</p>
              </div>
              {!showDeleteReportsConfirm && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setShowDeleteReportsConfirm(true);
                    setShowDeleteAccountConfirm(false);
                    setError("");
                  }}
                >
                  Delete reports
                </Button>
              )}
            </div>
            {showDeleteReportsConfirm && (
              <div className="p-4 bg-danger-bg/60 border border-danger-border rounded-[5px] space-y-3">
                <p className="flex gap-2 items-start text-sm text-ink-secondary">
                  <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
                  This permanently deletes every report and its AI trace. It can&apos;t be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setShowDeleteReportsConfirm(false)}>
                    Keep my reports
                  </Button>
                  <Button size="sm" variant="danger" onClick={handleDeleteReports} disabled={deletingReports} loading={deletingReports}>
                    {deletingReports ? "Deleting" : "Delete all reports"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-6 py-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Delete account</p>
                <p className="text-sm text-ink-muted">Permanently remove your account and all its data</p>
              </div>
              {!showDeleteAccountConfirm && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setShowDeleteAccountConfirm(true);
                    setShowDeleteReportsConfirm(false);
                    setDeleteConfirmText("");
                    setError("");
                  }}
                >
                  Delete account
                </Button>
              )}
            </div>
            {showDeleteAccountConfirm && (
              <div className="p-4 bg-danger-bg/60 border border-danger-border rounded-[5px] space-y-3">
                <p className="flex gap-2 items-start text-sm text-ink-secondary">
                  <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
                  This permanently deletes your reports, roadmaps, CV history, billing records and your login. It
                  can&apos;t be undone.
                </p>
                <Input
                  label="Type DELETE to confirm"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  id="delete-account-confirm"
                  autoComplete="off"
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setShowDeleteAccountConfirm(false)}>
                    Keep my account
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE" || deletingAccount}
                    loading={deletingAccount}
                  >
                    {deletingAccount ? "Deleting" : "Delete my account"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
