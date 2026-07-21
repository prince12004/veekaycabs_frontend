"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, X, Loader2, AlertCircle,
  Shield, Crown, UserCog, Truck, Settings,
} from "lucide-react";
import { adminAdminsAPI } from "@/lib/api";

type SectionDef = {
  key: string;
  label: string;
  group: string;
  ops: readonly ("view" | "add" | "edit" | "delete")[];
  // A handful of booking actions (upload verification images, extend) are
  // narrower than full "Edit" and delegable independently of it — these
  // don't fit the fixed 4-column View/Add/Edit/Delete grid, so they render
  // as an extra sub-row just for the sections that declare them.
  extraOps?: readonly { key: string; label: string }[];
};

// Every sidebar item gets a row here. `ops` lists which of View/Add/Edit/Delete
// are meaningfully enforceable for that page (the UI shows "—" for the rest).
const SECTIONS: SectionDef[] = [
  { key: "dashboard",           label: "Dashboard",              group: "Overview",     ops: ["view"] as const },

  { key: "carListing",          label: "Car Listing",            group: "Fleet",         ops: ["view","edit","delete"] as const },
  { key: "addCar",              label: "Add Car",                group: "Fleet",         ops: ["view"] as const },
  { key: "carDocuments",        label: "Car Documents",          group: "Fleet",         ops: ["view","edit"] as const },
  { key: "carMaintenance",      label: "Car Maintenance",        group: "Fleet",         ops: ["view","add","edit","delete"] as const },
  { key: "vehicleVerification", label: "Vehicle Verification",   group: "Fleet",         ops: ["view","edit"] as const },

  {
    key: "allBookings", label: "All Bookings", group: "Bookings", ops: ["view","edit","delete"] as const,
    // Full "Edit" already covers these — extraOps let a super admin hand out
    // just image uploads or just extend, without full booking edit access.
    extraOps: [
      { key: "uploadMedia", label: "Upload Pickup/Return Images" },
      { key: "extend", label: "Extend Booking" },
    ],
  },
  {
    key: "offlineBooking", label: "Offline Booking", group: "Bookings", ops: ["view","add","edit","delete"] as const,
    extraOps: [
      { key: "uploadMedia", label: "Upload Pickup/Return Images" },
      { key: "extend", label: "Extend Booking" },
    ],
  },
  { key: "arrivals",            label: "Arrivals & Departures",  group: "Bookings",      ops: ["view"] as const },
  { key: "closingBills",        label: "Closing Bills",          group: "Bookings",      ops: ["view"] as const },

  { key: "userList",            label: "User List",              group: "Users & KYC",  ops: ["view","edit","delete"] as const },
  { key: "kycReview",           label: "KYC Review",             group: "Users & KYC",  ops: ["view","edit"] as const },

  { key: "refunds",             label: "Refunds",                group: "Finance",       ops: ["view","edit"] as const },
  { key: "paymentLinks",        label: "Payment Links",          group: "Finance",       ops: ["view","add"] as const },

  { key: "gpsTracking",         label: "GPS Tracking",           group: "Operations",    ops: ["view"] as const },
  { key: "publicDisplay",       label: "Public Display",         group: "Operations",    ops: ["view"] as const },
  { key: "reports",             label: "Reports",                group: "Operations",    ops: ["view"] as const },

  { key: "blogs",               label: "Blogs",                  group: "Content",       ops: ["view","add","edit","delete"] as const },
  { key: "slider",              label: "Slider / Banners",       group: "Content",       ops: ["view","add","edit","delete"] as const },
  { key: "offers",              label: "Offers & Banners",       group: "Content",       ops: ["view","add","edit","delete"] as const },
  { key: "testimonials",        label: "Testimonials",           group: "Content",       ops: ["view","add","edit","delete"] as const },
  { key: "policyPages",         label: "Policy Pages",           group: "Content",       ops: ["view","edit"] as const },
  { key: "coupons",             label: "Coupons",                group: "Content",       ops: ["view","add","edit","delete"] as const },
  { key: "cities",              label: "Manage Cities",          group: "Content",       ops: ["view","add","edit","delete"] as const },
  { key: "contactRequests",     label: "Contact Requests",       group: "Content",       ops: ["view","edit"] as const },
  { key: "seoPages",            label: "SEO Pages",              group: "Content",       ops: ["view","add","edit","delete"] as const },

  { key: "basicDetails",        label: "Basic Details",          group: "Settings",      ops: ["view","edit"] as const },
  { key: "socialMedia",         label: "Social Media",           group: "Settings",      ops: ["view","edit"] as const },
  { key: "whatsappTest",        label: "WhatsApp Test",          group: "Settings",      ops: ["view"] as const },

  { key: "tempoAdmin",          label: "Tempo Admin (all pages)", group: "Tempo",        ops: ["view","add","edit","delete"] as const },
];

const GROUP_ORDER = ["Overview", "Fleet", "Bookings", "Users & KYC", "Finance", "Operations", "Content", "Settings", "Tempo"];

const ROLES = [
  {
    id: "super_admin",
    label: "Super Admin",
    description: "Full access to everything",
    icon: Crown,
    color: "#E8540A",
    bg: "#FFF3ED",
    // Full access — roleDefaultPerms grants every op (including delete)
    // since roleId === "super_admin" is special-cased there.
    permissions: Object.fromEntries(SECTIONS.map((s) => [s.key, true])) as Record<string, boolean>,
  },
  {
    id: "admin",
    label: "Admin",
    description: "Full operational access, no settings/admin control",
    icon: Shield,
    color: "#7C3AED",
    bg: "#F5F3FF",
    permissions: {
      dashboard: true,
      carListing: true, addCar: true, carDocuments: true, carMaintenance: true, vehicleVerification: true,
      allBookings: true, offlineBooking: true, arrivals: true, closingBills: true,
      userList: true, kycReview: true,
      refunds: true, paymentLinks: true,
      gpsTracking: true, publicDisplay: true, reports: true,
      blogs: true, slider: true, offers: true, testimonials: true, policyPages: true,
      coupons: true, cities: true, contactRequests: true, seoPages: true,
      basicDetails: false, socialMedia: false, whatsappTest: false, tempoAdmin: false,
    } as Record<string, boolean>,
  },
  {
    id: "tempo_admin",
    label: "Tempo Admin",
    description: "Tempo Traveller section only",
    icon: Truck,
    color: "#0EA5E9",
    bg: "#E0F2FE",
    permissions: { tempoAdmin: true } as Record<string, boolean>,
  },
  {
    id: "sub_admin",
    label: "Sub Admin",
    description: "Limited access — customize below",
    icon: UserCog,
    color: "#10B981",
    bg: "#D1FAE5",
    permissions: { dashboard: true, allBookings: true } as Record<string, boolean>,
  },
  {
    id: "custom",
    label: "Custom",
    description: "Manually configure permissions",
    icon: Settings,
    color: "#6B7280",
    bg: "#F3F4F6",
    permissions: {} as Record<string, boolean>,
  },
];

type Permissions = Record<string, boolean>;

type Admin = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  permissions?: Permissions;
  createdAt: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: Permissions;
};

// All toggleable op keys for a section — the 4 standard CRUD ops plus any
// section-specific extraOps (e.g. allBookings' "uploadMedia"/"extend").
const sectionOpKeys = (sec: SectionDef): string[] => [
  ...sec.ops,
  ...(sec.extraOps?.map(e => e.key) ?? []),
];

// Flat permission keys: section key (access toggle) + section_op (CRUD granularity)
const buildDefaultPerms = (on = false): Permissions => {
  const p: Permissions = {};
  SECTIONS.forEach((sec) => {
    p[sec.key] = on;
    sectionOpKeys(sec).forEach(op => { p[`${sec.key}_${op}`] = on; });
  });
  return p;
};

const defaultPermissions: Permissions = buildDefaultPerms(false);

const roleDefaultPerms = (roleId: string): Permissions => {
  const base = buildDefaultPerms(false);
  const rc = ROLES.find(r => r.id === roleId);
  if (!rc) return base;
  // Apply section-level access from ROLES config, then auto-grant CRUD ops for
  // accessible sections — except "delete", which stays off by default for
  // every role except Super Admin. A super admin has to explicitly tick the
  // Del checkbox to hand delete access to anyone else.
  Object.entries(rc.permissions).forEach(([key, allowed]) => {
    base[key] = !!allowed;
    if (allowed) {
      const sec = SECTIONS.find(s => s.key === key);
      if (!sec) return;
      sectionOpKeys(sec).forEach(op => {
        if (op === "delete" && roleId !== "super_admin") return;
        base[`${key}_${op}`] = true;
      });
    }
  });
  return base;
};

const emptyForm: FormState = {
  name: "", email: "", password: "", role: "admin",
  permissions: roleDefaultPerms("admin"),
};

const roleConfig = (roleId: string) => ROLES.find((r) => r.id === roleId) ?? ROLES[1];

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"all" | "super_admin" | "admin" | "tempo_admin" | "sub_admin">("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminAdminsAPI.getAll();
      setAdmins(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (admin: Admin) => {
    setEditing(admin);
    setForm({
      name: admin.name,
      email: admin.email,
      password: "",
      role: admin.role || "admin",
      permissions: { ...defaultPermissions, ...(admin.permissions || roleDefaultPerms(admin.role || "admin")) },
    });
    setFormError("");
    setModalOpen(true);
  };

  const setRole = (roleId: string) => {
    setForm((f) => ({ ...f, role: roleId, permissions: roleDefaultPerms(roleId) }));
  };

  // Toggle a section's access (also toggle all its CRUD ops + extraOps)
  const toggleSection = (key: string, checked: boolean) => {
    const sec = SECTIONS.find(s => s.key === key);
    setForm(f => {
      const p = { ...f.permissions, [key]: checked };
      if (sec) sectionOpKeys(sec).forEach(op => { p[`${key}_${op}`] = checked; });
      return { ...f, permissions: p, role: "custom" };
    });
  };

  // Toggle a single op (standard CRUD or an extraOp) within a section
  const toggleOp = (key: string, op: string, checked: boolean) => {
    setForm(f => {
      const p = { ...f.permissions, [`${key}_${op}`]: checked };
      // If any op is enabled, section access should be true
      const sec = SECTIONS.find(s => s.key === key);
      const anyOp = sec && sectionOpKeys(sec).some(o => p[`${key}_${o}`]);
      p[key] = !!anyOp;
      return { ...f, permissions: p, role: "custom" };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        role: form.role,
        permissions: form.permissions,
      };
      if (form.password) payload.password = form.password;
      if (editing) {
        await adminAdminsAPI.update(editing._id, payload);
      } else {
        if (!form.password || form.password.length < 8) {
          setFormError("Password must be at least 8 characters");
          setSaving(false);
          return;
        }
        await adminAdminsAPI.create({ ...payload, password: form.password });
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin: Admin) => {
    if (!confirm(`Delete admin "${admin.name}"? This cannot be undone.`)) return;
    try {
      await adminAdminsAPI.remove(admin._id);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const filtered = tab === "all" ? admins : admins.filter((a) => (a.role || "admin") === tab);

  const TAB_COUNTS = {
    all: admins.length,
    super_admin: admins.filter((a) => a.role === "super_admin").length,
    admin: admins.filter((a) => !a.role || a.role === "admin").length,
    tempo_admin: admins.filter((a) => a.role === "tempo_admin").length,
    sub_admin: admins.filter((a) => a.role === "sub_admin").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Manage Admins</h1>
          <p className="text-[#9090A8] text-sm">{admins.length} admin account{admins.length !== 1 ? "s" : ""} — role-based access control</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-gradient-to-r from-[#E8540A] to-[#FF6B35] text-white font-semibold text-sm rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md"
        >
          <Plus size={16} /> Add Admin
        </button>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "super_admin", "admin", "tempo_admin", "sub_admin"] as const).map((t) => {
          const rc = t === "all" ? null : roleConfig(t);
          const Icon = rc?.icon ?? Shield;
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                active
                  ? "bg-[#0F0F1A] text-white border-[#0F0F1A]"
                  : "bg-white text-[#4A4A6A] border-[#E4E5EF] hover:border-[#E8540A] hover:text-[#E8540A]"
              }`}
            >
              {t !== "all" && <Icon size={11} />}
              {t === "all" ? "All" : rc?.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-white/20" : "bg-[#F0F1F6]"}`}>
                {TAB_COUNTS[t]}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Role cards summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROLES.slice(0, 4).map((r) => {
          const count = admins.filter((a) => (a.role || "admin") === r.id).length;
          const Icon = r.icon;
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: r.bg }}>
                <Icon size={18} style={{ color: r.color }} />
              </div>
              <div>
                <p className="text-xl font-black text-[#0F0F1A]">{count}</p>
                <p className="text-[#9090A8] text-xs">{r.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Admin Table — deliberately dark/distinct from the Users table ── */}
      <div className="rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-[#1C1C2E]">
        {/* Dark header — clearly not a users table */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #0F0F1A 0%, #1C1040 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E8540A]/20 border border-[#E8540A]/30 flex items-center justify-center">
              <Shield size={15} className="text-[#E8540A]" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm tracking-wider">ADMIN ACCOUNTS</h2>
              <p className="text-white/30 text-[10px]">Separate from user accounts — role-based access only</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-white/10 text-white/60 text-[11px] font-semibold rounded-full">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto bg-white">
          <table className="w-full">
            <thead>
              <tr style={{ background: "linear-gradient(90deg, #1C1C2E 0%, #12103A 100%)" }}>
                {["#", "Admin", "Email", "Role", "Permissions", "Created", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/40 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#9090A8] text-sm">
                    <Loader2 size={18} className="animate-spin inline mr-2" /> Loading admin accounts...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Shield size={32} className="mx-auto mb-2 text-[#E4E5EF]" />
                    <p className="text-[#9090A8] text-sm">No admin accounts found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((admin, i) => {
                  const rc = roleConfig(admin.role || "admin");
                  const Icon = rc.icon;
                  const perms = { ...defaultPermissions, ...(admin.permissions || roleDefaultPerms(admin.role || "admin")) };
                  const activePerms = SECTIONS.filter((s) => perms[s.key]).map((s) => s.label);
                  return (
                    <tr
                      key={admin._id}
                      className="border-b border-[#F0F1F6] transition-colors"
                      style={{ backgroundColor: i % 2 === 0 ? "#FAFBFF" : "#FFFFFF" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F0EEFF")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? "#FAFBFF" : "#FFFFFF")}
                    >
                      <td className="px-4 py-4 text-sm font-mono text-[#9090A8]">{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{ background: rc.bg, borderColor: rc.color + "33" }}
                          >
                            <Icon size={15} style={{ color: rc.color }} />
                          </div>
                          <div>
                            <p className="font-bold text-[#0F0F1A] text-sm">{admin.name}</p>
                            <p className="text-[#9090A8] text-[10px] font-mono">{admin._id?.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#4A4A6A] font-mono">{admin.email}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: rc.color }} />
                          <span className="text-xs font-bold" style={{ color: rc.color }}>{rc.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {activePerms.slice(0, 3).map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
                              style={{ background: "#E8540A15", color: "#E8540A" }}
                            >
                              {p}
                            </span>
                          ))}
                          {activePerms.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-[#F0F1F6] text-[#9090A8] rounded-md text-[10px] font-semibold">
                              +{activePerms.length - 3} more
                            </span>
                          )}
                          {activePerms.length === 0 && (
                            <span className="text-[#EF4444] text-[10px] font-semibold">No access</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-[#9090A8] whitespace-nowrap font-mono">
                        {new Date(admin.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(admin)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                            style={{ background: "#EDE9FF", color: "#7C3AED" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#7C3AED"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EDE9FF"; (e.currentTarget as HTMLButtonElement).style.color = "#7C3AED"; }}
                            title="Edit"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(admin)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                            style={{ background: "#FEE2E2", color: "#EF4444" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EF4444"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FEE2E2"; (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
                            title="Delete"
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div
            className="px-6 py-2.5 text-[10px] font-semibold text-white/30 flex items-center gap-2"
            style={{ background: "linear-gradient(90deg, #0F0F1A 0%, #12103A 100%)" }}
          >
            <Shield size={11} className="text-[#E8540A]" />
            Admin accounts are completely separate from customer user accounts
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E5EF] shrink-0">
              <div>
                <h2 className="font-bold font-syne text-[#0F0F1A] text-lg">
                  {editing ? "Edit Admin" : "Create Admin"}
                </h2>
                <p className="text-[#9090A8] text-xs mt-0.5">Configure role and page-level permissions</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-xl bg-[#F0F1F6] flex items-center justify-center text-[#9090A8] hover:text-[#0F0F1A]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#9090A8] text-[10px] font-bold uppercase tracking-wider">Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none"
                    placeholder="Admin name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#9090A8] text-[10px] font-bold uppercase tracking-wider">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#9090A8] text-[10px] font-bold uppercase tracking-wider">
                  {editing ? "New Password (leave blank to keep)" : "Password *"}
                </label>
                <input
                  type="password"
                  required={!editing}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none"
                  placeholder="Min. 8 characters"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-[#9090A8] text-[10px] font-bold uppercase tracking-wider">Role *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const selected = form.role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                          selected
                            ? "border-[#E8540A] bg-[#FFF3ED]"
                            : "border-[#E4E5EF] hover:border-[#E8540A]/40 bg-white"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: r.bg }}>
                          <Icon size={13} style={{ color: r.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold leading-tight ${selected ? "text-[#E8540A]" : "text-[#0F0F1A]"}`}>{r.label}</p>
                          <p className="text-[10px] text-[#9090A8] leading-tight truncate">{r.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Permissions — CRUD per sidebar item, grouped like the sidebar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-1">
                  <label className="text-[#9090A8] text-[10px] font-bold uppercase tracking-wider">Sidebar Item Permissions</label>
                  <div className="flex gap-2 text-[9px] font-bold text-[#9090A8] uppercase tracking-wider pr-1">
                    <span className="w-9 text-center">View</span>
                    <span className="w-9 text-center">Add</span>
                    <span className="w-9 text-center">Edit</span>
                    <span className="w-9 text-center">Del</span>
                  </div>
                </div>
                <div className="border border-[#E4E5EF] rounded-xl overflow-hidden divide-y divide-[#E4E5EF]">
                  {GROUP_ORDER.map((group) => (
                    <div key={group}>
                      <div className="px-3 py-1.5 bg-[#F8F9FC] text-[9px] font-bold uppercase tracking-widest text-[#9090A8]">
                        {group}
                      </div>
                      {SECTIONS.filter((s) => s.group === group).map(({ key, label, ops, extraOps }) => {
                        const sectionOn = !!form.permissions[key];
                        return (
                          <div key={key}>
                            <div className={`flex items-center justify-between px-3 py-2 transition-colors border-t border-[#F0F1F6] ${sectionOn ? "bg-[#FFF3ED]" : "bg-white hover:bg-[#F8F9FC]"}`}>
                              {/* Section toggle */}
                              <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={sectionOn}
                                  onChange={e => toggleSection(key, e.target.checked)}
                                  className="w-3.5 h-3.5 accent-[#E8540A]"
                                />
                                <span className={`text-xs font-semibold ${sectionOn ? "text-[#E8540A]" : "text-[#4A4A6A]"}`}>{label}</span>
                              </label>
                              {/* CRUD ops */}
                              <div className="flex gap-2">
                                {(["view","add","edit","delete"] as const).map(op => {
                                  const hasOp = (ops as readonly string[]).includes(op);
                                  const opKey = `${key}_${op}`;
                                  return (
                                    <div key={op} className="w-9 flex justify-center">
                                      {hasOp ? (
                                        <input
                                          type="checkbox"
                                          checked={!!form.permissions[opKey]}
                                          disabled={!sectionOn}
                                          onChange={e => toggleOp(key, op, e.target.checked)}
                                          className="w-3.5 h-3.5 accent-[#E8540A] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      ) : (
                                        <span className="text-[#E4E5EF] text-xs">—</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            {/* Fine-grained extras — independent of full Edit (e.g. give only
                                "upload verification images" or only "extend" without full booking edit) */}
                            {extraOps && extraOps.length > 0 && (
                              <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 pl-8 py-1.5 bg-[#FAFBFF] border-t border-[#F0F1F6]">
                                {extraOps.map(({ key: opKey, label: opLabel }) => (
                                  <label key={opKey} className={`flex items-center gap-1.5 ${sectionOn ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}>
                                    <input
                                      type="checkbox"
                                      checked={!!form.permissions[`${key}_${opKey}`]}
                                      disabled={!sectionOn}
                                      onChange={e => toggleOp(key, opKey, e.target.checked)}
                                      className="w-3 h-3 accent-[#E8540A] disabled:cursor-not-allowed"
                                    />
                                    <span className="text-[10px] font-medium text-[#4A4A6A]">{opLabel}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#9090A8] px-1">
                  Enable a page first, then toggle which operations that admin can perform on it. "—" means that
                  operation doesn't apply to this page (e.g. Refunds/Payment Links are view-only until wired to
                  live data; Basic Details and Social Media share one save action).
                </p>
              </div>

              {formError && (
                <p className="flex items-center gap-1.5 text-red-600 text-xs font-semibold bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                  <AlertCircle size={13} /> {formError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm hover:border-[#9090A8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#E8540A] to-[#FF6B35] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? "Save Changes" : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
