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
import { usersAPI, bookingsAPI } from "@/lib/api";

const NAV_ITEMS = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "bookings", icon: BookOpen, label: "My Bookings" },
  { id: "documents", icon: FileText, label: "Documents" },
  { id: "verification", icon: Shield, label: "Verification" },
  { id: "active", icon: Car, label: "Active Booking" },
];

type BookingRow = {
  id: string;
  car: string;
  start: string;
  end: string;
  amount: number;
  status: string;
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-[#DBEAFE] text-[#1E40AF]",
  pending: "bg-[#FEF3C7] text-[#92400E]",
  active: "bg-[#DBEAFE] text-[#1E40AF]",
  completed: "bg-[#D1FAE5] text-[#065F46]",
  cancelled: "bg-[#FEE2E2] text-[#991B1B]",
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

// Maps a raw /api/bookings/my row into the shape this page's cards render.
const toBookingRow = (b: any): BookingRow => ({
  id: b.bookingId || b._id,
  car: b.carId?.name || "Car",
  start: fmtDate(b.startTime),
  end: fmtDate(b.endTime),
  amount: b.totalAmount || 0,
  status: b.status,
});

type DocStatus = "not_uploaded" | "pending" | "verified" | "rejected";
const KYC_LABELS: { key: "aadhaarStatus" | "panStatus" | "dlStatus"; label: string }[] = [
  { key: "aadhaarStatus", label: "Aadhaar" },
  { key: "panStatus", label: "PAN" },
  { key: "dlStatus", label: "Driving Licence" },
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
  const [saveError, setSaveError] = useState("");
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [kycDocs, setKycDocs] = useState<Record<string, DocStatus> | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const applyUser = (user: any) => {
    const next = {
      name: user.name || "",
      email: user.email || "",
      address: user.address || "",
    };
    setProfile(next);
    setTemp(next);
    const rawMobile = user.mobile || "";
    const isGoogle = rawMobile.startsWith("google_");
    setIsGoogleUser(isGoogle);
    setMobile(isGoogle ? "" : rawMobile);
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
        setKycDocs(res.data.data.documents || { aadhaarStatus: "not_uploaded", panStatus: "not_uploaded", dlStatus: "not_uploaded" });
      })
      .catch(() => {});

    bookingsAPI
      .getMy({ limit: "5" })
      .then((res) => setBookings((res.data.data || []).map(toBookingRow)))
      .catch(() => {})
      .finally(() => setBookingsLoading(false));
  }, [router]);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSave = async () => {
    if (temp.email && !EMAIL_RE.test(temp.email)) {
      setSaveError("Enter a valid email address");
      return;
    }
    if (temp.address.length > 100) {
      setSaveError("Address must be 100 characters or less");
      return;
    }
    setSaveError("");
    setSaving(true);
    try {
      const res = await usersAPI.updateProfile(temp);
      applyUser(res.data.data);
      localStorage.setItem("vk_user", JSON.stringify(res.data.data));
      setEditing(false);
    } catch (e: any) {
      setSaveError(e?.response?.data?.message || "Failed to save. Please try again.");
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
          {/* Mobile number banner for Google users */}
          {isGoogleUser && (
            <div className="mb-5 flex items-center justify-between gap-3 bg-[#FFF3ED] border border-[#E8540A]/30 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">📱</span>
                <div>
                  <p className="text-sm font-semibold text-[#0F0F1A]">Add your mobile number</p>
                  <p className="text-xs text-[#9090A8] mt-0.5">Required to receive booking confirmations on WhatsApp</p>
                </div>
              </div>
              <a
                href="/auth/add-mobile"
                className="shrink-0 px-4 py-2 bg-[#E8540A] text-white text-xs font-semibold rounded-xl hover:bg-[#c94508] transition-colors"
              >
                Add Now
              </a>
            </div>
          )}
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
                    <p className="text-white/50 text-xs mt-0.5">{mobile || "Phone not added"}</p>
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

                    {saveError && <p className="text-[#EF4444] text-xs font-medium mb-4">{saveError}</p>}

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
                            <>
                              <input
                                type={type}
                                maxLength={key === "address" ? 100 : undefined}
                                value={temp[key as keyof typeof temp]}
                                onChange={(e) => { setTemp({ ...temp, [key]: e.target.value }); if (saveError) setSaveError(""); }}
                                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A]"
                              />
                              {key === "address" && (
                                <p className="text-[10px] text-[#9090A8] mt-1 text-right">{temp.address.length}/100</p>
                              )}
                            </>
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
                        {memberSince ? `Member since ${memberSince}` : "Member"} &bull; {mobile || "Phone not added"} &bull; {totalBookings} booking{totalBookings !== 1 ? "s" : ""} made
                      </p>
                    </div>
                  </div>

                  {/* KYC Status — driven by the user's real document verification
                      status (fetched via getProfile), not a fixed placeholder. */}
                  {kycDocs && (() => {
                    const steps = KYC_LABELS.map(({ key, label }) => ({ label, status: kycDocs[key] || "not_uploaded" }));
                    const verifiedCount = steps.filter((s) => s.status === "verified").length;
                    const allVerified = verifiedCount === steps.length;
                    return (
                      <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="font-bold font-syne text-[#0F0F1A] text-lg flex items-center gap-2">
                            <Shield size={18} className="text-[#E8540A]" />
                            KYC Verification
                          </h3>
                          <span className={cn(
                            "text-xs font-bold px-3 py-1 rounded-full",
                            allVerified ? "bg-[#D1FAE5] text-[#065F46]" : verifiedCount > 0 ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#FEE2E2] text-[#991B1B]"
                          )}>
                            {verifiedCount}/{steps.length} Verified
                          </span>
                        </div>

                        {/* 3-step bar */}
                        <div className="flex items-center gap-0 mb-6">
                          {steps.map((step, idx) => {
                            const complete = step.status === "verified";
                            const rejected = step.status === "rejected";
                            return (
                              <div key={step.label} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1",
                                    complete
                                      ? "bg-[#10B981] text-white"
                                      : rejected
                                        ? "bg-[#FEE2E2] border-2 border-[#EF4444] text-[#EF4444]"
                                        : "bg-[#FFF3ED] border-2 border-[#E8540A] text-[#E8540A]"
                                  )}>
                                    {complete ? <CheckCircle size={14} /> : idx + 1}
                                  </div>
                                  <p className="text-xs font-semibold text-[#4A4A6A] text-center">{step.label}</p>
                                  <p className={cn(
                                    "text-[10px] font-bold mt-0.5",
                                    complete ? "text-[#10B981]" : rejected ? "text-[#EF4444]" : "text-[#E8540A]"
                                  )}>
                                    {complete ? "Verified" : rejected ? "Rejected" : step.status === "pending" ? "In Review" : "Pending"}
                                  </p>
                                </div>
                                {idx < steps.length - 1 && (
                                  <div className={cn(
                                    "flex-1 h-0.5 -mt-4 mx-1",
                                    steps[idx].status === "verified" ? "bg-[#10B981]" : "bg-[#E4E5EF]"
                                  )} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {allVerified ? (
                          <p className="inline-flex items-center gap-2 text-[#10B981] font-semibold text-sm">
                            <CheckCircle size={16} /> Your KYC is fully verified
                          </p>
                        ) : (
                          <Link
                            href="/account/documents"
                            className="inline-flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
                          >
                            <FileText size={14} />
                            Complete KYC
                          </Link>
                        )}
                      </div>
                    );
                  })()}

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
                      {bookingsLoading ? (
                        <p className="text-center text-sm text-[#9090A8] py-6">Loading...</p>
                      ) : bookings.length === 0 ? (
                        <p className="text-center text-sm text-[#9090A8] py-6">No bookings yet</p>
                      ) : (
                        bookings.slice(0, 3).map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between p-4 bg-[#F8F9FC] rounded-xl border border-[#E4E5EF]"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-[#0F0F1A]">{b.car}</span>
                                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[b.status] || STATUS_STYLES.pending)}>
                                  {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-xs text-[#9090A8]">{b.id} • {b.start} → {b.end}</p>
                            </div>
                            <p className="text-[#E8540A] font-bold text-sm">Rs. {b.amount.toLocaleString("en-IN")}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Bookings Tab */}
              {active === "bookings" && (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6">
                  <h2 className="font-black font-syne text-xl text-[#0F0F1A] mb-5">My Bookings</h2>
                  <div className="space-y-3">
                    {bookingsLoading ? (
                      <p className="text-center text-sm text-[#9090A8] py-6">Loading...</p>
                    ) : bookings.length === 0 ? (
                      <p className="text-center text-sm text-[#9090A8] py-6">No bookings yet</p>
                    ) : (
                      bookings.map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-4 bg-[#F8F9FC] rounded-xl border border-[#E4E5EF]">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-[#0F0F1A]">{b.car}</span>
                              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[b.status] || STATUS_STYLES.pending)}>
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
                      ))
                    )}
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
