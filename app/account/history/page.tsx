"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText, RefreshCw, AlertTriangle, X, Printer, Phone, Loader2 } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { cn } from "@/lib/utils";
import { bookingsAPI } from "@/lib/api";
import toast from "react-hot-toast";

const TABS = ["Upcoming", "Active", "Completed", "Cancelled"] as const;
type TabType = (typeof TABS)[number];

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-[#DBEAFE] text-[#1E40AF]",
  confirmed: "bg-[#DBEAFE] text-[#1E40AF]",
  active:    "bg-[#D1FAE5] text-[#065F46]",
  completed: "bg-[#D1FAE5] text-[#065F46]",
  cancelled: "bg-[#FEE2E2] text-[#991B1B]",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Upcoming", confirmed: "Upcoming", active: "Active",
  completed: "Completed", cancelled: "Cancelled",
};

function toTabStatuses(tab: TabType): string[] {
  if (tab === "Upcoming")  return ["pending", "confirmed"];
  if (tab === "Active")    return ["active"];
  if (tab === "Completed") return ["completed"];
  return ["cancelled"];
}

const fmtDT = (d: string) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });

const calcDuration = (start: string, end: string) => {
  const hrs = Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60));
  if (hrs < 24) return `${hrs} hrs`;
  const days = Math.round(hrs / 24);
  return `${days} Day${days > 1 ? "s" : ""}`;
};

const toInputDT = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

interface Booking {
  _id: string;
  bookingId: string;
  carId?: { name?: string; images?: string[]; type?: string; registrationNo?: string };
  cityId?: { name?: string };
  startTime: string;
  endTime: string;
  totalAmount: number;
  amountPaid: number;
  bookingFare?: number;
  securityDeposit?: number;
  doorstepCharge?: number;
  status: string;
  pickupLocation?: string;
}

export default function BookingHistoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [cancelId, setCancelId]         = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const [extendBooking, setExtendBooking] = useState<Booking | null>(null);
  const [newEndTime, setNewEndTime]       = useState("");
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendPreview, setExtendPreview] = useState<{ cost: number; hours: number } | null>(null);

  const [billBooking, setBillBooking]   = useState<Booking | null>(null);
  const [issueBooking, setIssueBooking] = useState<Booking | null>(null);
  const [issueText, setIssueText]       = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await bookingsAPI.getMy();
      setBookings(data.data || []);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const filtered  = bookings.filter(b => toTabStatuses(activeTab).includes(b.status));
  const tabCount  = (tab: TabType) => bookings.filter(b => toTabStatuses(tab).includes(b.status)).length;

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelLoading(true);
    try {
      const { data } = await bookingsAPI.cancel(cancelId, cancelReason || "User cancelled");
      toast.success(data.message || "Booking cancelled");
      setCancelId(null);
      setCancelReason("");
      loadBookings();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to cancel");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleExtendPreview = async () => {
    if (!extendBooking || !newEndTime) return;
    setExtendLoading(true);
    setExtendPreview(null);
    try {
      const { data } = await bookingsAPI.extend(extendBooking._id, { newEndTime: new Date(newEndTime).toISOString() });
      setExtendPreview({ cost: data.data.extensionCost, hours: data.data.extraHours });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Extension not available — please call us");
    } finally {
      setExtendLoading(false);
    }
  };

  const handleIssueWhatsApp = () => {
    if (!issueBooking) return;
    const msg = `Hi, I want to report an issue with booking #${issueBooking.bookingId} (${issueBooking.carId?.name || ""}). Issue: ${issueText}`;
    window.open(`https://wa.me/919999926867?text=${encodeURIComponent(msg)}`, "_blank");
    setIssueBooking(null);
    setIssueText("");
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F8F9FC] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">

          <div className="mb-6">
            <h1 className="font-black font-syne text-3xl text-[#0F0F1A]">Booking History</h1>
            <p className="text-[#9090A8] text-sm mt-1">Track all your past and upcoming trips</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1 border border-[#E4E5EF] mb-6 shadow-sm">
            {TABS.map((tab) => {
              const count = tabCount(tab);
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    activeTab === tab ? "bg-[#E8540A] text-white shadow-sm" : "text-[#9090A8] hover:text-[#4A4A6A]"
                  )}
                >
                  {tab}
                  {count > 0 && (
                    <span className={cn("ml-1.5 text-xs px-1.5 py-0.5 rounded-full",
                      activeTab === tab ? "bg-white/30" : "bg-[#E4E5EF]"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-[#9090A8]">
              <Loader2 className="animate-spin" size={22} /> Loading your bookings...
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] p-12 text-center">
                  <div className="text-5xl mb-3">📋</div>
                  <p className="font-semibold text-[#0F0F1A] mb-1">No {activeTab} Bookings</p>
                  <p className="text-[#9090A8] text-sm">
                    {activeTab === "Upcoming" ? "Book a car to see your upcoming trips here." : `Your ${activeTab.toLowerCase()} bookings will appear here.`}
                  </p>
                  {activeTab === "Upcoming" && (
                    <Link href="/" className="inline-flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-semibold text-sm mt-4">
                      Book a Car
                    </Link>
                  )}
                </div>
              ) : (
                filtered.map((booking) => (
                  <div key={booking._id} className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all">
                    <div className="flex">
                      <div className="w-1 bg-[#E8540A] shrink-0" />
                      <div className="flex-1 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#1C1C2E] to-[#242438] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                              {booking.carId?.images?.[0]
                                ? <img src={booking.carId.images[0]} alt={booking.carId.name} className="w-full h-full object-cover" />
                                : <span className="text-3xl">🚘</span>
                              }
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-[#0F0F1A] font-syne">{booking.carId?.name || "—"}</h3>
                                <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full capitalize", STATUS_STYLES[booking.status] || "bg-[#F1F2F7] text-[#9090A8]")}>
                                  {STATUS_LABEL[booking.status] || booking.status}
                                </span>
                              </div>
                              <p className="text-[#9090A8] text-xs">
                                #{booking.bookingId} &bull; {booking.carId?.type || "Car"} &bull; {booking.cityId?.name || booking.pickupLocation || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[#0F0F1A] font-bold text-base">Rs. {booking.totalAmount.toLocaleString("en-IN")}</p>
                            <p className="text-[#10B981] text-xs font-semibold">Paid: Rs. {booking.amountPaid.toLocaleString("en-IN")}</p>
                            {(booking.totalAmount - booking.amountPaid) > 0 && (
                              <p className="text-[#E8540A] text-xs font-semibold">Due: Rs. {(booking.totalAmount - booking.amountPaid).toLocaleString("en-IN")}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 my-3 py-3 border-y border-[#E4E5EF]">
                          <div className="text-xs text-[#4A4A6A]">
                            <span className="font-semibold text-[#0F0F1A]">{fmtDT(booking.startTime)}</span>
                            <span className="mx-2 text-[#9090A8]">→</span>
                            <span className="font-semibold text-[#0F0F1A]">{fmtDT(booking.endTime)}</span>
                          </div>
                          <span className="bg-[#FFF3ED] text-[#E8540A] text-xs font-bold px-2.5 py-1 rounded-full ml-auto shrink-0">
                            {calcDuration(booking.startTime, booking.endTime)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setBillBooking(booking)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-[#4A4A6A] text-xs font-semibold hover:border-[#E8540A]/50 hover:text-[#E8540A] transition-all"
                          >
                            <FileText size={12} /> Bill
                          </button>
                          {(booking.status === "confirmed" || booking.status === "active") && (
                            <button
                              onClick={() => { setExtendBooking(booking); setNewEndTime(toInputDT(booking.endTime)); setExtendPreview(null); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-[#4A4A6A] text-xs font-semibold hover:border-[#6366F1]/50 hover:text-[#6366F1] transition-all"
                            >
                              <RefreshCw size={12} /> Extend
                            </button>
                          )}
                          {booking.status !== "cancelled" && (
                            <button
                              onClick={() => { setIssueBooking(booking); setIssueText(""); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-[#4A4A6A] text-xs font-semibold hover:border-red-300 hover:text-red-500 transition-all"
                            >
                              <AlertTriangle size={12} /> Report Issue
                            </button>
                          )}
                          {(booking.status === "pending" || booking.status === "confirmed") && (
                            <button
                              onClick={() => { setCancelId(booking._id); setCancelReason(""); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-xs font-semibold hover:bg-red-200 transition-all"
                            >
                              <X size={12} /> Cancel
                            </button>
                          )}
                          {booking.status === "completed" && (
                            <a
                              href={`https://wa.me/919999926867?text=${encodeURIComponent(`Hi, I need invoice for completed booking #${booking.bookingId}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-[#4A4A6A] text-xs font-semibold hover:border-green-400 hover:text-green-600 transition-all"
                            >
                              <Phone size={12} /> Contact Us
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bill Modal ── */}
      {billBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl my-4">
            <div className="bg-gradient-to-r from-[#E8540A] to-[#FF6B35] p-5 rounded-t-2xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black font-syne text-lg">Veekay Cabs</p>
                  <p className="text-white/70 text-xs">Self-Drive Car Rental</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/70">Booking ID</p>
                  <p className="font-bold text-sm">#{billBooking.bookingId}</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#F8F9FC] rounded-xl">
                <div className="w-12 h-12 bg-[#1C1C2E] rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                  {billBooking.carId?.images?.[0]
                    ? <img src={billBooking.carId.images[0]} className="w-full h-full object-cover" alt="" />
                    : <span className="text-xl">🚘</span>
                  }
                </div>
                <div>
                  <p className="font-bold text-[#0F0F1A]">{billBooking.carId?.name || "Car"}</p>
                  <p className="text-[#9090A8] text-xs">{billBooking.carId?.type || ""} {billBooking.carId?.registrationNo ? `· ${billBooking.carId.registrationNo}` : ""}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-[#E4E5EF] rounded-xl">
                  <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider mb-1">Pickup</p>
                  <p className="font-semibold text-[#0F0F1A] text-xs">{fmtDT(billBooking.startTime)}</p>
                </div>
                <div className="p-3 border border-[#E4E5EF] rounded-xl">
                  <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider mb-1">Return</p>
                  <p className="font-semibold text-[#0F0F1A] text-xs">{fmtDT(billBooking.endTime)}</p>
                </div>
              </div>

              <div className="border border-[#E4E5EF] rounded-xl overflow-hidden">
                {[
                  { label: "Booking Fare", value: billBooking.bookingFare ?? 0 },
                  ...(billBooking.securityDeposit ? [{ label: "Security Deposit (Refundable)", value: billBooking.securityDeposit }] : []),
                  ...(billBooking.doorstepCharge  ? [{ label: "Doorstep Delivery",              value: billBooking.doorstepCharge  }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-4 py-2.5 border-b border-[#E4E5EF] text-sm">
                    <span className="text-[#4A4A6A]">{label}</span>
                    <span className="font-semibold text-[#0F0F1A]">Rs. {(value || 0).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 bg-[#F8F9FC] font-bold text-sm">
                  <span className="text-[#0F0F1A]">Total Amount</span>
                  <span className="text-[#E8540A]">Rs. {billBooking.totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#D1FAE5] rounded-xl text-center">
                  <p className="text-[#065F46] text-[10px] font-semibold uppercase tracking-wider">Paid</p>
                  <p className="font-black text-[#065F46] text-base">Rs. {billBooking.amountPaid.toLocaleString("en-IN")}</p>
                </div>
                <div className={cn("p-3 rounded-xl text-center", (billBooking.totalAmount - billBooking.amountPaid) > 0 ? "bg-[#FFF3ED]" : "bg-[#F1F2F7]")}>
                  <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider">Balance Due</p>
                  <p className={cn("font-black text-base", (billBooking.totalAmount - billBooking.amountPaid) > 0 ? "text-[#E8540A]" : "text-[#10B981]")}>
                    Rs. {(billBooking.totalAmount - billBooking.amountPaid).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#9090A8]">Status</span>
                <span className={cn("font-bold px-3 py-1 rounded-full capitalize text-xs", STATUS_STYLES[billBooking.status] || "bg-[#F1F2F7] text-[#9090A8]")}>
                  {STATUS_LABEL[billBooking.status] || billBooking.status}
                </span>
              </div>

              <p className="text-[#9090A8] text-[10px] text-center">Thank you for choosing Veekay Cabs · veekaycabs.com</p>
            </div>

            <div className="flex gap-3 p-4 border-t border-[#E4E5EF]">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] text-sm font-semibold hover:border-[#E8540A] hover:text-[#E8540A] transition-colors"
              >
                <Printer size={14} /> Print
              </button>
              <button
                onClick={() => setBillBooking(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#E8540A] text-white font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extend Modal ── */}
      {extendBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">Extend Booking</h3>
              <button onClick={() => setExtendBooking(null)} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-[#FFF3ED] rounded-xl text-xs">
                <p className="text-[#9090A8]">Current return time</p>
                <p className="font-bold text-[#0F0F1A] mt-0.5">{fmtDT(extendBooking.endTime)}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">New Return Date & Time</label>
                <input
                  type="datetime-local"
                  value={newEndTime}
                  onChange={(e) => { setNewEndTime(e.target.value); setExtendPreview(null); }}
                  min={toInputDT(extendBooking.endTime)}
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>

              {extendPreview && (
                <div className="p-3 bg-[#D1FAE5] rounded-xl text-sm">
                  <p className="text-[#065F46] font-semibold">Estimated Extension Cost</p>
                  <p className="text-[#065F46] text-xs mt-0.5">+{extendPreview.hours} hrs · Rs. {extendPreview.cost.toLocaleString("en-IN")}</p>
                  <p className="text-[#9090A8] text-xs mt-1">To be collected on return. Subject to car availability.</p>
                </div>
              )}

              <p className="text-[#9090A8] text-xs">Extension is subject to car availability. Our team will call to confirm.</p>

              <div className="flex gap-3">
                <button onClick={() => setExtendBooking(null)} className="flex-1 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">
                  Back
                </button>
                <button
                  onClick={extendPreview
                    ? () => { toast.success("Extension request sent! We'll call you to confirm."); setExtendBooking(null); setExtendPreview(null); }
                    : handleExtendPreview}
                  disabled={extendLoading || !newEndTime}
                  className="flex-1 py-2.5 rounded-xl btn-gradient text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {extendLoading ? <><Loader2 size={14} className="animate-spin" /> Checking...</> : extendPreview ? "Request Extension" : "Check Cost"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ── */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold font-syne text-[#0F0F1A] text-lg mb-1">Cancel Booking?</h3>
            <p className="text-[#4A4A6A] text-sm mb-4">
              Refund policy: 100% if &gt;24h before pickup · 50% if 12–24h · No refund if &lt;12h.
            </p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={2}
              placeholder="Reason (optional)"
              className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2 text-sm outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)} className="flex-1 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelLoading && <Loader2 size={14} className="animate-spin" />} Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Issue Modal ── */}
      {issueBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">Report an Issue</h3>
              <button onClick={() => setIssueBooking(null)} className="text-[#9090A8]"><X size={18} /></button>
            </div>
            <p className="text-[#9090A8] text-xs mb-3">Booking #{issueBooking.bookingId} · {issueBooking.carId?.name}</p>
            <textarea
              value={issueText}
              onChange={e => setIssueText(e.target.value)}
              rows={4}
              placeholder="Describe your issue in detail..."
              className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2 text-sm outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setIssueBooking(null)} className="flex-1 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">
                Cancel
              </button>
              <button
                onClick={handleIssueWhatsApp}
                className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Phone size={14} /> Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
