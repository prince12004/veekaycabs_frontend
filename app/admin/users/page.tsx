"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Shield, ShieldOff, Eye, Users, CheckCircle, Clock,
  XCircle, X, Loader2, RefreshCw, Phone, Mail, Calendar,
  FileText, Car, ChevronLeft, ChevronRight, Pencil, Save, Download, Trash2,
} from "lucide-react";
import { adminUsersApi } from "@/lib/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { canDelete } from "@/lib/adminPermissions";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserRow {
  _id: string;
  name: string;
  mobile: string;
  email: string;
  kycStatus: string;
  totalBookings: number;
  isBlocked: boolean;
  createdAt: string;
  profilePhoto?: string;
}

interface UserDetail {
  user: UserRow;
  documents?: {
    aadhaar?: { status: string };
    pan?: { status: string };
    dl?: { status: string };
  };
  recentBookings?: Array<{
    _id: string;
    bookingId: string;
    status: string;
    totalAmount: number;
    startTime: string;
    carId?: { name: string; registrationNo: string };
  }>;
}

// ─── KYC badge config ─────────────────────────────────────────────────────────
const KYC_CFG: Record<string, { bg: string; text: string; label: string }> = {
  verified:      { bg: "#D1FAE5", text: "#065F46",  label: "Verified"       },
  pending:       { bg: "#FEF3C7", text: "#92400E",  label: "Pending"        },
  not_submitted: { bg: "#F1F2F7", text: "#4A4A6A",  label: "Not Submitted"  },
  rejected:      { bg: "#FEE2E2", text: "#991B1B",  label: "Rejected"       },
};
const kycCfg = (s: string) => KYC_CFG[s] ?? KYC_CFG.not_submitted;

const BOOKING_STATUS_CLS: Record<string, string> = {
  confirmed:  "bg-[#D1FAE5] text-[#065F46]",
  completed:  "bg-[#DBEAFE] text-[#1E40AF]",
  cancelled:  "bg-[#FEE2E2] text-[#991B1B]",
  pending:    "bg-[#FEF3C7] text-[#92400E]",
  active:     "bg-[#EDE9FE] text-[#4C1D95]",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", mobile: "", address: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setCanDeleteUser(canDelete("users")); }, []);

  // ── Fetch users ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback((p = 1, s = "", kyc = "all") => {
    setLoading(true);
    const params: Record<string, string> = { page: String(p), limit: "20" };
    if (s) params.search = s;
    if (kyc !== "all") params.kycStatus = kyc;
    adminUsersApi.getAll(params)
      .then(({ data }) => {
        setUsers(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.pages || 1);
      })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(1, search, kycFilter); setPage(1); }, [kycFilter]);

  // debounce search
  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchUsers(1, val, kycFilter); }, 400);
  };

  // ── Stats from current page (server gives total) ──────────────────────────
  const kycVerified  = users.filter(u => u.kycStatus === "verified").length;
  const kycPending   = users.filter(u => u.kycStatus === "pending").length;
  const kycRejected  = users.filter(u => u.kycStatus === "rejected").length;

  // ── Block / Unblock ─────────────────────────────────────────────────────────
  const toggleBlock = async (id: string) => {
    setBlockingId(id);
    try {
      const { data } = await adminUsersApi.toggleBlock(id);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isBlocked: data.data.isBlocked } : u));
      if (detailUser?.user._id === id)
        setDetailUser(prev => prev ? { ...prev, user: { ...prev.user, isBlocked: data.data.isBlocked } } : null);
      toast.success(data.message);
    } catch {
      toast.error("Failed to update user status");
    } finally {
      setBlockingId(null);
    }
  };

  // ── Delete user (soft) ──────────────────────────────────────────────────────
  const deleteUser = async (user: UserRow) => {
    if (!confirm(`Delete "${user.name}"? Their account and booking history are kept, but they'll no longer be able to log in or appear in this list.`)) return;
    setDeletingId(user._id);
    try {
      await adminUsersApi.remove(user._id);
      setUsers(prev => prev.filter(u => u._id !== user._id));
      setTotal(t => t - 1);
      toast.success("User deleted");
      if (detailUser?.user._id === user._id) setDetailUser(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Edit user ───────────────────────────────────────────────────────────────
  const openEdit = (user: UserRow) => {
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email || "", mobile: user.mobile?.startsWith("google_") ? "" : user.mobile || "", address: "" });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (editForm.name)    payload.name    = editForm.name;
      if (editForm.email)   payload.email   = editForm.email;
      if (editForm.mobile)  payload.mobile  = editForm.mobile;
      if (editForm.address) payload.address = editForm.address;
      const { data } = await adminUsersApi.update(editUser._id, payload);
      setUsers(prev => prev.map(u => u._id === editUser._id ? { ...u, ...data.data } : u));
      toast.success("User updated successfully");
      setEditUser(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update user");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await adminUsersApi.exportCsv();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = "users.csv"; a.click();
    } catch {
      toast.error("Failed to export users");
    }
  };

  // ── Open detail modal ───────────────────────────────────────────────────────
  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailUser({ user: users.find(u => u._id === id)!, documents: undefined, recentBookings: undefined });
    try {
      const { data } = await adminUsersApi.getOne(id);
      setDetailUser(data.data);
    } catch {
      toast.error("Failed to load user details");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Users</h1>
          <p className="text-[#9090A8] text-sm">{total} registered users · live from database</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 border-[1.5px] border-[#E8540A] text-[#E8540A] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#FFF3ED] transition-colors">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => fetchUsers(page, search, kycFilter)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-xs font-semibold text-[#4A4A6A] hover:bg-[#F8F9FC]">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users",  value: total,      color: "#E8540A", bg: "#FFF3ED", Icon: Users        },
          { label: "KYC Verified", value: kycVerified, color: "#10B981", bg: "#D1FAE5", Icon: CheckCircle  },
          { label: "KYC Pending",  value: kycPending,  color: "#F59E0B", bg: "#FEF3C7", Icon: Clock        },
          { label: "KYC Rejected", value: kycRejected, color: "#EF4444", bg: "#FEE2E2", Icon: XCircle      },
        ].map(({ label, value, color, bg, Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0F0F1A] font-syne leading-none">{value}</p>
              <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search by name, mobile or email..."
            className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
        <select value={kycFilter} onChange={e => setKycFilter(e.target.value)}
          className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
          <option value="all">All KYC</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="not_submitted">Not Submitted</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-[#9090A8]">
            <Loader2 size={20} className="animate-spin" /> Loading users from database...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-[#9090A8]">
            <p className="font-semibold">No users found</p>
            <p className="text-xs mt-1">Try changing the filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                  {["User", "Mobile", "KYC Status", "Bookings", "Joined", "Account", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => {
                  const kyc = kycCfg(user.kycStatus);
                  return (
                    <tr key={user._id} className={cn("border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors", i % 2 === 1 ? "bg-[#F8F9FC]/50" : "")}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {user.profilePhoto ? (
                            <img src={user.profilePhoto} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-[#0F0F1A] text-sm">{user.name}</p>
                            <p className="text-[#9090A8] text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#4A4A6A]">{user.mobile}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: kyc.bg, color: kyc.text }}>
                          {kyc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#0F0F1A] text-sm">{user.totalBookings ?? 0}</td>
                      <td className="px-5 py-4 text-[#4A4A6A] text-sm">{fmtDate(user.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", user.isBlocked ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#D1FAE5] text-[#065F46]")}>
                          {user.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openDetail(user._id)}
                            className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => openEdit(user)}
                            className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#92400E] hover:bg-[#F59E0B] hover:text-white transition-colors flex items-center justify-center">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => toggleBlock(user._id)} disabled={blockingId === user._id}
                            className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                              user.isBlocked ? "bg-[#D1FAE5] text-[#065F46] hover:bg-[#10B981] hover:text-white" : "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#EF4444] hover:text-white")}>
                            {blockingId === user._id ? <Loader2 size={14} className="animate-spin" /> : user.isBlocked ? <Shield size={14} /> : <ShieldOff size={14} />}
                          </button>
                          {canDeleteUser && (
                            <button onClick={() => deleteUser(user)} disabled={deletingId === user._id} title="Delete"
                              className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#991B1B] hover:bg-[#EF4444] hover:text-white transition-colors flex items-center justify-center disabled:opacity-50">
                              {deletingId === user._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#E4E5EF]">
            <p className="text-xs text-[#9090A8]">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => { const p = page - 1; setPage(p); fetchUsers(p, search, kycFilter); }} disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-[#E4E5EF] flex items-center justify-center text-[#4A4A6A] hover:bg-[#F8F9FC] disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => { const p = page + 1; setPage(p); fetchUsers(p, search, kycFilter); }} disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-[#E4E5EF] flex items-center justify-center text-[#4A4A6A] hover:bg-[#F8F9FC] disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold font-syne text-[#0F0F1A]">Edit User</h3>
                <p className="text-xs text-[#9090A8] mt-0.5">{editUser.name}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {[
                { label: "Full Name", key: "name", placeholder: "e.g. Rahul Kumar", type: "text" },
                { label: "Email", key: "email", placeholder: "e.g. rahul@gmail.com", type: "email" },
                { label: "Mobile", key: "mobile", placeholder: "10-digit number", type: "tel", maxLength: 10 },
                { label: "Address", key: "address", placeholder: "City, State", type: "text" },
              ].map(({ label, key, placeholder, type, maxLength }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1">{label}</label>
                  <input
                    type={type}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    value={editForm[key as keyof typeof editForm]}
                    onChange={e => setEditForm(p => ({ ...p, [key]: type === "tel" ? e.target.value.replace(/\D/g, "") : e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#E4E5EF] rounded-xl text-sm focus:outline-none focus:border-[#E8540A] bg-[#F8F9FC]"
                  />
                  {key === "mobile" && editUser.mobile?.startsWith("google_") && (
                    <p className="text-[10px] text-[#F59E0B] mt-1">⚠ Google login — no mobile set yet</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E4E5EF] text-sm font-semibold text-[#4A4A6A] hover:bg-[#F8F9FC]">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={editSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#E8540A] text-white text-sm font-semibold hover:bg-[#c94508] disabled:opacity-50">
                {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      {detailUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-bold shrink-0">
                  {detailUser.user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold font-syne text-[#0F0F1A] text-lg leading-tight">{detailUser.user.name}</h3>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", detailUser.user.isBlocked ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#D1FAE5] text-[#065F46]")}>
                    {detailUser.user.isBlocked ? "Blocked" : "Active"}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetailUser(null)} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>

            {detailLoading && (
              <div className="flex items-center justify-center gap-2 py-8 text-[#9090A8]">
                <Loader2 size={18} className="animate-spin" /> Loading details...
              </div>
            )}

            {!detailLoading && (
              <>
                {/* Contact info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#F8F9FC] rounded-xl p-3 flex items-center gap-2">
                    <Phone size={14} className="text-[#E8540A] shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#9090A8] font-semibold">Mobile</p>
                      <p className="text-sm font-semibold text-[#0F0F1A]">{detailUser.user.mobile}</p>
                    </div>
                  </div>
                  <div className="bg-[#F8F9FC] rounded-xl p-3 flex items-center gap-2">
                    <Mail size={14} className="text-[#E8540A] shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#9090A8] font-semibold">Email</p>
                      <p className="text-sm font-semibold text-[#0F0F1A] truncate">{detailUser.user.email}</p>
                    </div>
                  </div>
                  <div className="bg-[#F8F9FC] rounded-xl p-3 flex items-center gap-2">
                    <Calendar size={14} className="text-[#E8540A] shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#9090A8] font-semibold">Joined</p>
                      <p className="text-sm font-semibold text-[#0F0F1A]">{fmtDate(detailUser.user.createdAt)}</p>
                    </div>
                  </div>
                  <div className="bg-[#F8F9FC] rounded-xl p-3 flex items-center gap-2">
                    <Car size={14} className="text-[#E8540A] shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#9090A8] font-semibold">Total Bookings</p>
                      <p className="text-sm font-semibold text-[#0F0F1A]">{detailUser.user.totalBookings ?? 0}</p>
                    </div>
                  </div>
                </div>

                {/* KYC documents */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-[#4A4A6A] mb-2 flex items-center gap-1.5"><FileText size={12} /> KYC Documents</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["aadhaar", "pan", "dl"] as const).map((doc) => {
                      const st = (detailUser.documents as any)?.[doc]?.status ?? "not_submitted";
                      const cfg = KYC_CFG[st] ?? KYC_CFG.not_submitted;
                      return (
                        <div key={doc} className="bg-[#F8F9FC] rounded-xl p-2.5 text-center">
                          <p className="text-xs font-bold text-[#4A4A6A] capitalize">{doc === "dl" ? "DL" : doc.toUpperCase()}</p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-[#4A4A6A] mb-2 flex items-center gap-1.5"><Car size={12} /> Recent Bookings</p>
                  {(!detailUser.recentBookings || detailUser.recentBookings.length === 0) ? (
                    <p className="text-xs text-[#9090A8] text-center py-3 bg-[#F8F9FC] rounded-xl">No bookings yet</p>
                  ) : (
                    <div className="space-y-2">
                      {detailUser.recentBookings.slice(0, 5).map((b) => (
                        <div key={b._id} className="flex items-center justify-between bg-[#F8F9FC] rounded-xl px-3 py-2">
                          <div>
                            <p className="text-xs font-bold text-[#0F0F1A]">#{b.bookingId}</p>
                            <p className="text-[10px] text-[#9090A8]">{b.carId?.name ?? "—"} · {fmtDate(b.startTime)}</p>
                          </div>
                          <div className="text-right">
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", BOOKING_STATUS_CLS[b.status] ?? "bg-[#F1F2F7] text-[#4A4A6A]")}>
                              {b.status}
                            </span>
                            <p className="text-xs font-bold text-[#0F0F1A] mt-0.5">₹{b.totalAmount?.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={() => toggleBlock(detailUser.user._id)} disabled={blockingId === detailUser.user._id}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all",
                      detailUser.user.isBlocked ? "bg-[#D1FAE5] text-[#065F46] hover:bg-[#A7F3D0]" : "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA]")}>
                    {blockingId === detailUser.user._id ? <Loader2 size={14} className="animate-spin" /> : detailUser.user.isBlocked ? <><Shield size={14} /> Unblock</> : <><ShieldOff size={14} /> Block</>}
                  </button>
                  <a href={`https://wa.me/${(detailUser.user.mobile ?? "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-sm">
                    <Phone size={14} /> WhatsApp
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
