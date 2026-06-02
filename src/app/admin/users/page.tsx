"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Search,
  Filter,
  Shield,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  Loader2,
  ChevronDown,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user, userDoc } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Filters state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  // Selected User for edit dialog
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [actionError, setActionError] = useState("");

  const isSuperAdmin = userDoc?.role === "super_admin";

  const fetchUsers = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "x-admin-uid": user.uid },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleAction = async (action: string, targetUid: string, extraData?: any) => {
    if (!user) return;
    setUpdatingUser(true);
    setActionError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-uid": user.uid,
        },
        body: JSON.stringify({
          action,
          targetUid,
          data: extraData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to execute action");
      
      // Update state locally
      await fetchUsers();
      setSelectedUser(null);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setUpdatingUser(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === "all" || (u.role || "user") === roleFilter;
    const matchesPlan = planFilter === "all" || (u.plan || "free") === planFilter;

    return matchesSearch && matchesRole && matchesPlan;
  });

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
        <h1 className="text-xl font-bold text-white tracking-tight">Users Management</h1>
        <p className="text-xs text-[#a1a1aa] mt-0.5">Manage user permissions, bans, plans, and impersonation profiles</p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Filters toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-1 min-w-[240px] max-w-md items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5">
          <Search size={14} className="text-[#71717a]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-white placeholder-[#71717a] focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white">
            <span className="text-[#71717a]">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-medium text-white cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="support">Support</option>
              <option value="readonly">Read-only</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white">
            <span className="text-[#71717a]">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-medium text-white cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#1c1c1f] text-[#71717a] font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Plan</th>
                <th className="px-5 py-3.5">Analysis Count</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {filteredUsers.map((u) => {
                const uRole = u.role || "user";
                const uPlan = u.plan || "free";
                const isSuspended = u.suspended === true;

                return (
                  <tr key={u.uid} className="hover:bg-[#202024] transition-colors text-white">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-semibold text-white block">{u.displayName || "No Name"}</span>
                        <span className="text-[10px] text-[#71717a]">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        uRole === "super_admin" ? "bg-purple-950/40 border border-purple-900/60 text-purple-400" :
                        uRole === "admin" ? "bg-blue-950/40 border border-blue-900/60 text-blue-400" :
                        uRole === "support" ? "bg-amber-950/40 border border-amber-900/60 text-amber-400" :
                        "bg-[#27272a] text-[#a1a1aa]"
                      }`}>
                        {uRole.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        uPlan === "premium" ? "bg-emerald-950/40 border border-emerald-900/60 text-emerald-400" :
                        uPlan === "pro" ? "bg-indigo-950/40 border border-indigo-900/60 text-indigo-400" :
                        uPlan === "basic" ? "bg-cyan-950/40 border border-cyan-900/60 text-cyan-400" :
                        "bg-[#27272a] text-[#71717a]"
                      }`}>
                        {uPlan}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-[#a1a1aa]">
                      {u.analysisCount || 0}
                    </td>
                    <td className="px-5 py-4">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(u)}
                          className="px-2 py-1 h-auto text-[10px] bg-transparent text-white border-[#27272a] hover:bg-[#27272a]"
                        >
                          Manage User
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#71717a]">
                    No users matched the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal drawer */}
      {selectedUser && (
        <UserDetailDrawer
          selectedUser={selectedUser}
          isSuperAdmin={isSuperAdmin}
          updatingUser={updatingUser}
          actionError={actionError}
          handleAction={handleAction}
          onClose={() => setSelectedUser(null)}
          adminUid={user?.uid || ""}
        />
      )}
    </div>
  );
}

function UserDetailDrawer({
  selectedUser,
  isSuperAdmin,
  updatingUser,
  actionError,
  handleAction,
  onClose,
  adminUid,
}: {
  selectedUser: any;
  isSuperAdmin: boolean;
  updatingUser: boolean;
  actionError: string;
  handleAction: any;
  onClose: () => void;
  adminUid: string;
}) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoadingTimeline(true);
      try {
        const res = await fetch(`/api/admin/users/journey?userId=${selectedUser.uid}`, {
          headers: { "x-admin-uid": adminUid },
        });
        const data = await res.json();
        if (res.ok) {
          setTimeline(data.timeline || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTimeline(false);
      }
    };
    fetchTimeline();
  }, [selectedUser, adminUid]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-6 grid md:grid-cols-2 gap-6">
        
        {/* Left column: Admin modifications controls */}
        <div className="space-y-6">
          <div>
            <h2 className="text-md font-bold text-white tracking-tight">Manage User Profile</h2>
            <p className="text-xs text-[#a1a1aa] mt-0.5">{selectedUser.email}</p>
          </div>

          {actionError && (
            <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-3 rounded-lg text-xs">
              {actionError}
            </div>
          )}

          <div className="space-y-4">
            {/* Role setting */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa] block mb-1.5">
                Update Platform Role
              </label>
              <div className="flex gap-2">
                <select
                  defaultValue={selectedUser.role || "user"}
                  disabled={!isSuperAdmin}
                  id="update-role-select"
                  className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white flex-1 focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="readonly">Read-only</option>
                  <option value="support">Support</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!isSuperAdmin}
                  loading={updatingUser}
                  onClick={() => {
                    const sel = document.getElementById("update-role-select") as HTMLSelectElement;
                    handleAction("updateRole", selectedUser.uid, { role: sel.value });
                  }}
                >
                  Save
                </Button>
              </div>
              {!isSuperAdmin && (
                <span className="text-[10px] text-[#71717a] mt-1 block">
                  🔒 Super Admin permission required to modify user roles.
                </span>
              )}
            </div>

            {/* Sub setting */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa] block mb-1.5">
                Modify Plan Tier
              </label>
              <div className="flex gap-2">
                <select
                  defaultValue={selectedUser.plan || "free"}
                  disabled={!isSuperAdmin}
                  id="update-plan-select"
                  className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white flex-1 focus:outline-none"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!isSuperAdmin}
                  loading={updatingUser}
                  onClick={() => {
                    const sel = document.getElementById("update-plan-select") as HTMLSelectElement;
                    handleAction("updatePlan", selectedUser.uid, { plan: sel.value });
                  }}
                >
                  Save
                </Button>
              </div>
              {!isSuperAdmin && (
                <span className="text-[10px] text-[#71717a] mt-1 block">
                  🔒 Super Admin permission required to modify subscription plans.
                </span>
              )}
            </div>

            {/* Ban / Suspend actions */}
            <div className="pt-4 border-t border-[#27272a] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Account Suspension</span>
                <span className="text-[10px] text-[#71717a]">Temporarily block app access</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                loading={updatingUser}
                onClick={() => handleAction("suspend", selectedUser.uid, { suspended: !selectedUser.suspended })}
                className={selectedUser.suspended ? "border-[#10b981] text-[#10b981]" : "border-red-900/60 text-red-400"}
              >
                {selectedUser.suspended ? <Unlock size={12} className="mr-1" /> : <Lock size={12} className="mr-1" />}
                {selectedUser.suspended ? "Reinstatement" : "Suspend Access"}
              </Button>
            </div>

            {/* Delete user account */}
            <div className="pt-4 border-t border-[#27272a] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-red-400 block">Dangerous Actions</span>
                <span className="text-[10px] text-[#71717a]">Irreversibly wipe user credentials</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!isSuperAdmin}
                loading={updatingUser}
                onClick={() => {
                  if (confirm("Are you absolutely sure you want to permanently delete this user?")) {
                    handleAction("delete", selectedUser.uid);
                  }
                }}
                className="border-red-950/60 text-red-500 hover:bg-red-950/30"
              >
                <Trash2 size={12} className="mr-1" /> Delete Account
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#27272a] flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose} className="text-white border-[#27272a] hover:bg-[#27272a] hover:text-white">
              Cancel
            </Button>
          </div>
        </div>

        {/* Right column: Observability User Journey Timeline */}
        <div className="border-l border-[#27272a] pl-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Observability Journey Timeline</h3>
            <p className="text-[10px] text-[#71717a] mt-0.5">Chronological trace timeline of candidate steps</p>
          </div>

          {loadingTimeline ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#6366f1]" />
            </div>
          ) : (
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
              {timeline.map((item, idx) => {
                let badgeColor = "bg-[#27272a] text-[#a1a1aa]";
                if (item.type === "report") badgeColor = "bg-indigo-950/30 text-indigo-400 border border-indigo-900/40";
                if (item.type === "ai_call") badgeColor = "bg-purple-950/30 text-purple-400 border border-purple-900/40";
                if (item.type === "payment") badgeColor = "bg-emerald-950/30 text-emerald-400 border border-emerald-900/40";
                if (item.type === "audit") badgeColor = "bg-amber-950/30 text-amber-400 border border-amber-900/40";

                return (
                  <div key={idx} className="relative pl-6 pb-2 border-l border-[#27272a] last:border-none">
                    {/* Circle dot */}
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#27272a] border border-[#18181b]" />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{item.title}</span>
                        <Badge className={`${badgeColor} text-[8px] font-semibold py-0 px-1.5 h-4`}>
                          {item.type.toUpperCase()}
                        </Badge>
                        <span className="text-[9px] text-[#71717a] font-mono ml-auto">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#a1a1aa] leading-relaxed">{item.description}</p>
                      <span className="text-[9px] text-[#71717a] font-mono block">{item.meta}</span>
                    </div>
                  </div>
                );
              })}

              {timeline.length === 0 && (
                <div className="text-center py-20 text-[#71717a] text-xs">
                  No trace logs recorded for this user yet.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
