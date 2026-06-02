"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { Bell, Shield, Trash2, User } from "lucide-react";
import { updateUserProfile } from "@/lib/firebase";

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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Delete all reports</p>
                <p className="text-xs text-ink-muted">Permanently remove all analysis data</p>
              </div>
              <Button size="sm" variant="danger">Delete</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Delete account</p>
                <p className="text-xs text-ink-muted">Permanently remove your account and all data</p>
              </div>
              <Button size="sm" variant="danger">Delete Account</Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
