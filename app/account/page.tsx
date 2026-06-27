"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  FileText,
  CheckCircle,
  Car,
  BookOpen,
  ChevronRight,
  Edit2,
  Save,
  Shield,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { cn } from "@/lib/utils";
import { usersAPI } from "@/lib/api";

const NAV_ITEMS = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "bookings", icon: BookOpen, label: "My Bookings" },
  { id: "documents", icon: FileText, label: "Documents" },
  { id: "verification", icon: Shield, label: "Verification" },
  { id: "active", icon: Car, label: "Active Booking" },
];

const RECENT_BOOKINGS = [
  {
    id: "VK20260012",
    car: "Hyundai Creta",
    start: "Jun 12, 2026",
    end: "Jun 14, 2026",
    amount: 12450,
    status: "confirmed",
  },
  {
    id: "VK20260009",
    car: "Maruti Swift",
    start: "May 28, 2026",
    end: "May 30, 2026",
    amount: 4990,
    status: "completed",
  },
  {
    id: "VK20260006",
    car: "Honda City",
    start: "May 10, 2026",
    end: "May 11, 2026",
    amount: 3200,
    status: "completed",
  },
];

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-[#DBEAFE] text-[#1E40AF]",
  pending: "bg-[#FEF3C7] text-[#92400E]",
  active: "bg-[#DBEAFE] text-[#1E40AF]",
  completed: "bg-[#D1FAE5] text-[#065F46]",
  cancelled: "bg-[#FEE2E2] text-[#991B1B]",
};

const KYC_STEPS = [
  { label: "Aadhaar", status: "complete" },
  { label: "PAN", status: "complete" },
  { label: "Driving Licence", status: "pending" },
];

export default function AccountPage() {
  const router = useRouter();
  const [active, setActive] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    address: "",
  });
  const [temp, setTemp] = useState(profile);
  const [mobile, setMobile] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [totalBookings, setTotalBookings] = useState(0);
  const [saving, setSaving] = useState(false);

  const applyUser = (user: any) => {
    const next = {
      name: user.name || "",
      email: user.email || "",
      address: user.address || "",
    };
    setProfile(next);
    setTemp(next);
    setMobile(user.mobile || "");
    setTotalBookings(user.totalBookings || 0);
    if (user.createdAt) {
      setMemberSince(new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }));
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("vk_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const cached = localStorage.getItem("vk_user");
    if (cached) applyUser(JSON.parse(cached));

    usersAPI
      .getProfile()
      .then((res) => {
        const user = res.data.data.user;
        applyUser(user);
        localStorage.setItem("vk_user", JSON.stringify(user));
      })
      .catch(() => {});
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await usersAPI.updateProfile(temp);
      applyUser(res.data.data);
      localStorage.setItem("vk_user", JSON.stringify(res.data.data));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F8F9FC] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="bg-[#0F0F1A] rounded-2xl p-4 sticky top-24">
                {/* User Info */}
                <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-white/10">
                  <div className="w-12 h-12 rounded-full bg-[#E8540A] flex items-center justify-center text-white font-bold font-syne text-lg shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{profile.name || "—"}</p>
                    <p className="text-white/50 text-xs mt-0.5">{mobile}</p>
                  </div>
                </div>

                {/* Nav Items */}
                <nav className="space-y-1">
                  {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setActive(id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        active === id
                          ? "bg-[#E8540A] text-white"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon size={16} />
                      {label}
                      {active !== id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                    </button>
                  ))}
                </nav>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <Link
                    href="/account/history"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <BookOpen size={16} />
                    Booking History
                    <ChevronRight size={14} className="ml-auto opacity-50" />
                  </Link>
                </div>
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* Profile Section */}
              {(active === "profile" || active === "verification") && (
                <>
                  {/* Profile Card */}
                  <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-black font-syne text-xl text-[#0F0F1A]">My Profile</h2>
                      {!editing ? (
                        <button
                          onClick={() => { setEditing(true); setTemp(profile); }}
                          className="flex items-center gap-2 text-[#E8540A] text-sm font-semibold border border-[#E8540A]/30 px-3 py-1.5 rounded-lg hover:bg-[#FFF3ED] transition-all"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      ) : (
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-2 btn-gradient text-white text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-60"
                        >
                          <Save size={14} /> {saving ? "Saving..." : "Save"}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[
                        { label: "Full Name", key: "name", type: "text" },
                        { label: "Email Address", key: "email", type: "email" },
                        { label: "Address", key: "address", type: "text" },
                      ].map(({ label, key, type }) => (
                        <div key={key} className={key === "address" ? "md:col-span-2" : ""}>
                          <label className="text-[#4A4A6A] text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                            {label}
                          </label>
                          {editing ? (
                            <input
                              type={type}
                              value={temp[key as keyof typeof temp]}
                              onChange={(e) => setTemp({ ...temp, [key]: e.target.value })}
                              className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A]"
                            />
                          ) : (
                            <p className="text-[#0F0F1A] text-sm font-medium bg-[#F8F9FC] rounded-xl px-4 py-2.5 border border-[#E4E5EF]">
                              {profile[key as keyof typeof profile]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Danger Zone */}
                    <div className="mt-6 pt-5 border-t border-[#E4E5EF]">
                      <p className="text-[#9090A8] text-xs">
                        {memberSince ? `Member since ${memberSince}` : "Member"} &bull; {mobile} &bull; {totalBookings} booking{totalBookings !== 1 ? "s" : ""} made
                      </p>
                    </div>
                  </div>

                  {/* KYC Status */}
                  <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold font-syne text-[#0F0F1A] text-lg flex items-center gap-2">
                        <Shield size={18} className="text-[#E8540A]" />
                        KYC Verification
                      </h3>
                      <span className="bg-[#FEF3C7] text-[#92400E] text-xs font-bold px-3 py-1 rounded-full">
                        2/3 Verified
                      </span>
                    </div>

                    {/* 3-step bar */}
                    <div className="flex items-center gap-0 mb-6">
                      {KYC_STEPS.map((step, idx) => (
                        <div key={step.label} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1",
                              step.status === "complete"
                                ? "bg-[#10B981] text-white"
                                : "bg-[#FFF3ED] border-2 border-[#E8540A] text-[#E8540A]"
                            )}>
                              {step.status === "complete" ? <CheckCircle size={14} /> : idx + 1}
                            </div>
                            <p className="text-xs font-semibold text-[#4A4A6A] text-center">{step.label}</p>
                            <p className={cn(
                              "text-[10px] font-bold mt-0.5",
                              step.status === "complete" ? "text-[#10B981]" : "text-[#E8540A]"
                            )}>
                              {step.status === "complete" ? "Verified" : "Pending"}
                            </p>
                          </div>
                          {idx < KYC_STEPS.length - 1 && (
                            <div className={cn(
                              "flex-1 h-0.5 -mt-4 mx-1",
                              idx === 0 ? "bg-[#10B981]" : "bg-[#E4E5EF]"
                            )} />
                          )}
                        </div>
                      ))}
                    </div>

                    <Link
                      href="/account/documents"
                      className="inline-flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
                    >
                      <FileText size={14} />
                      Complete KYC
                    </Link>
                  </div>

                  {/* Recent Bookings */}
                  <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">Recent Bookings</h3>
                      <Link
                        href="/account/history"
                        className="text-[#E8540A] text-xs font-semibold hover:underline flex items-center gap-1"
                      >
                        View All <ChevronRight size={13} />
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {RECENT_BOOKINGS.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-4 bg-[#F8F9FC] rounded-xl border border-[#E4E5EF]"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-[#0F0F1A]">{b.car}</span>
                              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[b.status])}>
                                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-xs text-[#9090A8]">{b.id} • {b.start} → {b.end}</p>
                          </div>
                          <p className="text-[#E8540A] font-bold text-sm">Rs. {b.amount.toLocaleString("en-IN")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Bookings Tab */}
              {active === "bookings" && (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6">
                  <h2 className="font-black font-syne text-xl text-[#0F0F1A] mb-5">My Bookings</h2>
                  <div className="space-y-3">
                    {RECENT_BOOKINGS.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-4 bg-[#F8F9FC] rounded-xl border border-[#E4E5EF]">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-[#0F0F1A]">{b.car}</span>
                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[b.status])}>
                              {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-xs text-[#9090A8]">{b.id} • {b.start} → {b.end}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#E8540A] font-bold text-sm">Rs. {b.amount.toLocaleString("en-IN")}</p>
                          <Link href="/account/history" className="text-xs text-[#9090A8] hover:text-[#E8540A]">View details →</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Link href="/account/history" className="btn-gradient px-6 py-2.5 rounded-xl text-white font-semibold text-sm inline-flex items-center gap-2">
                      View Full History
                    </Link>
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {active === "documents" && (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6">
                  <h2 className="font-black font-syne text-xl text-[#0F0F1A] mb-5">My Documents</h2>
                  <p className="text-[#4A4A6A] text-sm mb-4">Upload and manage your KYC documents for verification.</p>
                  <Link href="/account/documents" className="btn-gradient px-6 py-3 rounded-xl text-white font-semibold text-sm inline-flex items-center gap-2">
                    <FileText size={14} />
                    Manage Documents
                  </Link>
                </div>
              )}

              {/* Active Booking */}
              {active === "active" && (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6">
                  <h2 className="font-black font-syne text-xl text-[#0F0F1A] mb-5">Active Booking</h2>
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="text-5xl mb-4">🚗</div>
                    <p className="font-semibold text-[#0F0F1A] text-lg mb-1">No Active Booking</p>
                    <p className="text-[#9090A8] text-sm mb-5">You don&apos;t have any ongoing trip right now.</p>
                    <Link href="/book" className="btn-gradient px-6 py-3 rounded-xl text-white font-semibold text-sm inline-flex items-center gap-2">
                      <Car size={14} />
                      Book a Car
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
