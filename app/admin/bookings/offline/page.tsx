"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, Download, Eye, QrCode, FileText, Phone,
  ChevronLeft, ChevronRight, X, IndianRupee, Calendar,
  Car, User, MapPin, Clock, Printer, Loader2, RefreshCw,
  Pencil, Check, Trash2, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { bookingsApi, adminCarsApi } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { canDelete } from "@/lib/adminPermissions";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookingRow {
  _id: string;
  bookingId: string;
  userId?: { name: string; mobile: string };
  carId?: { _id: string; name: string; registrationNo: string };
  cityId?: { name: string };
  startTime: string;
  endTime: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  securityDeposit: number;
  paymentMode: string;
  status: string;
  isOffline: boolean;
  challanDetails?: string;
  bookedBy?: string;
  createdAt: string;
  doorstepDelivery?: boolean;
  deliveryAddress?: string;
  doorstepCharge?: number;
}

interface CarOption {
  _id: string; name: string; registrationNo: string;
  regularPrice: number; weekendPrice: number; securityDeposit: number;
  doorstepDeliveryCharge?: number;
}

interface OfflineForm {
  name: string; mobile: string; email: string;
  bookedBy: string;
  carId: string;
  pickupLocation: string;
  startTime: string; endTime: string;
  bookingFare: string;
  securityDeposit: string;
  doorstepDelivery: boolean;
  deliveryAddress: string;
  doorstepCharge: string;
  amountPaid: string;
  paymentMode: string;
  notes: string;
}

const emptyForm: OfflineForm = {
  name: "", mobile: "", email: "",
  bookedBy: "",
  carId: "", pickupLocation: "",
  startTime: "", endTime: "",
  bookingFare: "",
  securityDeposit: "",
  doorstepDelivery: false,
  deliveryAddress: "",
  doorstepCharge: "",
  amountPaid: "0",
  paymentMode: "offline_cash",
  notes: "",
};

// Suggests rent/security from the selected car + trip duration, mirroring the
// server's own default calculation — the admin can still overwrite either
// field before submitting (e.g. a negotiated rate, or security actually
// collected differing from the car's listed deposit).
const suggestPricing = (car: CarOption | undefined, startTime: string, endTime: string) => {
  if (!car || !startTime || !endTime) return null;
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
  const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  const isWeekend = [0, 6].includes(start.getDay());
  const rate = isWeekend ? car.weekendPrice : car.regularPrice;
  return { bookingFare: String(hours * rate), securityDeposit: String(car.securityDeposit ?? 0) };
};

const DEFAULT_DOORSTEP_CHARGE = 500;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "#DBEAFE", text: "#1E40AF" },
  confirmed: { bg: "#EDE9FE", text: "#4C1D95" },
  completed: { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  pending: { bg: "#FEF3C7", text: "#92400E" },
};

const fmtDT = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const toLocalDT = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

// ─── Bill Modal ───────────────────────────────────────────────────────────────
function BillModal({ booking, onClose }: { booking: BookingRow; onClose: () => void }) {
  const nights = Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60 * 24));
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#E8540A] to-[#FF6B35] p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Veekay Cabs — Booking Bill</p>
              <p className="font-black text-lg font-syne mt-0.5">#{booking.bookingId}</p>
            </div>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors"><X size={16} /></button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2 bg-[#F8F9FC] rounded-xl p-3">
              <p className="text-[#9090A8] text-xs mb-0.5">Customer</p>
              <p className="font-bold text-[#0F0F1A]">{booking.userId?.name ?? "—"}</p>
              <p className="text-[#4A4A6A] text-xs">{booking.userId?.mobile ?? "—"}</p>
            </div>
            <div className="bg-[#F8F9FC] rounded-xl p-3">
              <p className="text-[#9090A8] text-xs mb-0.5">Car</p>
              <p className="font-semibold text-[#0F0F1A] text-sm">{booking.carId?.name ?? "—"}</p>
              <p className="text-[#4A4A6A] text-xs">{booking.carId?.registrationNo ?? "—"}</p>
            </div>
            <div className="bg-[#F8F9FC] rounded-xl p-3">
              <p className="text-[#9090A8] text-xs mb-0.5">Duration</p>
              <p className="font-semibold text-[#0F0F1A] text-sm">{nights} day{nights !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-[#F8F9FC] rounded-xl p-3">
              <p className="text-[#9090A8] text-xs mb-0.5">Pickup</p>
              <p className="font-semibold text-[#0F0F1A] text-sm">{fmtDT(booking.startTime)}</p>
            </div>
            <div className="bg-[#F8F9FC] rounded-xl p-3">
              <p className="text-[#9090A8] text-xs mb-0.5">Return</p>
              <p className="font-semibold text-[#0F0F1A] text-sm">{fmtDT(booking.endTime)}</p>
            </div>
          </div>
          <div className="border-t border-dashed border-[#E4E5EF] pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#4A4A6A]">Total Amount</span><span className="font-bold">₹{booking.totalAmount?.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-[#4A4A6A]">Amount Received</span><span className="font-bold text-[#10B981]">₹{booking.amountPaid?.toLocaleString("en-IN")}</span></div>
            {(booking.balanceDue ?? 0) > 0 && <div className="flex justify-between"><span className="text-[#4A4A6A]">Balance Due</span><span className="font-bold text-[#EF4444]">₹{booking.balanceDue?.toLocaleString("en-IN")}</span></div>}
            <div className="flex justify-between"><span className="text-[#4A4A6A]">Security Deposit</span><span className="font-bold">₹{booking.securityDeposit?.toLocaleString("en-IN")}</span></div>
          </div>
          <div className="bg-[#FFF3ED] rounded-xl p-3 text-xs text-[#4A4A6A]">
            <p className="font-semibold text-[#E8540A] mb-1">Terms & Conditions</p>
            <p>• Speed limit: 120 km/h • Security deposit refundable after inspection • Fuel at same level • Any damage chargeable extra</p>
          </div>
          <div className="flex gap-3 pt-1">
            <a href={`https://wa.me/${(booking.userId?.mobile ?? "").replace(/\D/g, "")}?text=Booking%20%23${booking.bookingId}%20confirmed.%20Car%3A%20${encodeURIComponent(booking.carId?.name ?? "")}%20(${booking.carId?.registrationNo ?? ""})%20Pickup%3A%20${encodeURIComponent(fmtDT(booking.startTime))}%20Total%3A%20Rs.${booking.totalAmount}%20-%20Veekay%20Cabs`}
              target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm">
              <Phone size={14} /> WhatsApp
            </a>
            <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0F0F1A] text-white font-bold text-sm">
              <Printer size={14} /> Print Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  booking, onClose, onSaved,
}: { booking: BookingRow; onClose: () => void; onSaved: (updated: BookingRow) => void }) {
  const [form, setForm] = useState({
    startTime: toLocalDT(booking.startTime),
    endTime: toLocalDT(booking.endTime),
    totalAmount: String(booking.totalAmount ?? ""),
    amountPaid: String(booking.amountPaid ?? ""),
    paymentMode: booking.paymentMode ?? "offline_cash",
    notes: booking.challanDetails ?? "",
    doorstepDelivery: booking.doorstepDelivery ?? false,
    deliveryAddress: booking.deliveryAddress ?? "",
    doorstepCharge: String(booking.doorstepCharge ?? ""),
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (form.doorstepDelivery && !form.deliveryAddress.trim()) {
      toast.error("Delivery address is required for pickup & drop");
      return;
    }
    setSaving(true);
    try {
      const { data } = await bookingsApi.update(booking._id, {
        startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
        amountPaid: form.amountPaid ? Number(form.amountPaid) : undefined,
        paymentMode: form.paymentMode,
        notes: form.notes,
        doorstepDelivery: form.doorstepDelivery,
        deliveryAddress: form.doorstepDelivery ? form.deliveryAddress : undefined,
        doorstepCharge: form.doorstepDelivery && form.doorstepCharge !== "" ? Number(form.doorstepCharge) : undefined,
      });
      toast.success("Booking updated");
      onSaved(data.data);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update booking");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl my-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">Edit Booking</h3>
            <p className="text-[#9090A8] text-xs mt-0.5">#{booking.bookingId} · {booking.userId?.name}</p>
          </div>
          <button onClick={onClose} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Pickup Date & Time</label>
              <input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Return Date & Time</label>
              <input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className={inputCls} />
            </div>
          </div>

          {/* Pickup & Drop (Doorstep Delivery) */}
          <div className="border-[1.5px] border-[#E4E5EF] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Truck size={16} className="text-[#E8540A]" />
                <p className="text-sm font-semibold text-[#0F0F1A]">Pickup & Drop (Doorstep)</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, doorstepDelivery: !f.doorstepDelivery }))}
                className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0", form.doorstepDelivery ? "bg-[#E8540A]" : "bg-[#E4E5EF]")}
              >
                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", form.doorstepDelivery ? "left-5" : "left-0.5")} />
              </button>
            </div>
            {form.doorstepDelivery && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Delivery Address <span className="text-red-500">*</span></label>
                  <input value={form.deliveryAddress} onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))}
                    placeholder="Full delivery address" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Pickup & Drop Charge (₹)</label>
                  <input type="number" value={form.doorstepCharge} onChange={e => setForm(f => ({ ...f, doorstepCharge: e.target.value }))}
                    placeholder="0" min="0" className={inputCls} />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Total Amount (₹)</label>
              <input type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Amount Paid (₹)</label>
              <input type="number" value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))}
                className={inputCls} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Payment Mode</label>
            <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
              className={inputCls}>
              <option value="offline_cash">Cash</option>
              <option value="offline_qr">UPI / QR</option>
              <option value="online">Online / Razorpay</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Remarks / Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              className={inputCls + " resize-none"} placeholder="Internal notes..." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-[#E4E5EF] font-bold text-sm text-[#4A4A6A] hover:bg-[#F8F9FC]">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl btn-gradient text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OfflineBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<OfflineForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [billFor, setBillFor] = useState<BookingRow | null>(null);
  const [editFor, setEditFor] = useState<BookingRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [canDeleteBooking, setCanDeleteBooking] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setCanDeleteBooking(canDelete("offlineBooking")); }, []);
  // Tracks the last auto-suggested rent/security so we only overwrite the
  // fields while the admin hasn't typed a custom value of their own.
  const autoRent = useRef<string | null>(null);
  const autoSecurity = useRef<string | null>(null);
  const autoDoorstep = useRef<string | null>(null);

  // ── Fetch bookings ─────────────────────────────────────────────────────────
  const fetchBookings = useCallback((p = 1, s = "", status = "all") => {
    setLoading(true);
    const params: Record<string, string | number> = { page: p, limit: 20, isOffline: "true" };
    if (s) params.search = s;
    if (status !== "all") params.status = status;
    bookingsApi.getAll(params)
      .then(({ data }) => {
        setBookings(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.pages || 1);
      })
      .catch(() => toast.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBookings(1, search, statusFilter); setPage(1); }, [statusFilter]);

  // ── Load cars for dropdown — refetched every time the modal opens, so a
  // car deactivated/activated elsewhere shows up without a page reload ──────
  useEffect(() => {
    if (!showAddForm) return;
    adminCarsApi.getAll({ limit: "all", isActive: "true" })
      .then(({ data }) => setCars(data.data || []))
      .catch(() => { });
  }, [showAddForm]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchBookings(1, val, statusFilter); }, 400);
  };

  const deleteBooking = async (b: BookingRow) => {
    if (!confirm(`Delete booking #${b.bookingId}? It'll disappear from all lists but the record is kept, not erased.`)) return;
    setDeletingId(b._id);
    try {
      await bookingsApi.remove(b._id);
      toast.success("Booking deleted");
      fetchBookings(page, search, statusFilter);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete booking");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Suggest rent/security whenever car or dates change ─────────────────────
  useEffect(() => {
    const car = cars.find(c => c._id === form.carId);
    const suggestion = suggestPricing(car, form.startTime, form.endTime);
    if (!suggestion) return;
    setForm(prev => ({
      ...prev,
      bookingFare: (prev.bookingFare === "" || prev.bookingFare === autoRent.current) ? suggestion.bookingFare : prev.bookingFare,
      securityDeposit: (prev.securityDeposit === "" || prev.securityDeposit === autoSecurity.current) ? suggestion.securityDeposit : prev.securityDeposit,
    }));
    autoRent.current = suggestion.bookingFare;
    autoSecurity.current = suggestion.securityDeposit;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.carId, form.startTime, form.endTime, cars]);

  // ── Suggest pickup & drop charge whenever it's toggled on or the car changes ─
  useEffect(() => {
    if (!form.doorstepDelivery) return;
    const car = cars.find(c => c._id === form.carId);
    const suggested = String(car?.doorstepDeliveryCharge ?? DEFAULT_DOORSTEP_CHARGE);
    setForm(prev => ({
      ...prev,
      doorstepCharge: (prev.doorstepCharge === "" || prev.doorstepCharge === autoDoorstep.current) ? suggested : prev.doorstepCharge,
    }));
    autoDoorstep.current = suggested;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.doorstepDelivery, form.carId, cars]);

  // ── Create offline booking ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.carId || !form.startTime || !form.endTime || !form.mobile) {
      toast.error("Car, mobile, pickup & return date are required");
      return;
    }
    if (form.doorstepDelivery && !form.deliveryAddress.trim()) {
      toast.error("Delivery address is required for pickup & drop");
      return;
    }
    setSubmitting(true);
    try {
      await bookingsApi.createOffline({
        mobile: form.mobile,
        name: form.name || `Walk-in ${form.mobile.slice(-4)}`,
        bookedBy: form.bookedBy || undefined,
        carId: form.carId,
        pickupLocation: form.pickupLocation || "Admin Office",
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        bookingFare: form.bookingFare !== "" ? Number(form.bookingFare) : undefined,
        securityDeposit: form.securityDeposit !== "" ? Number(form.securityDeposit) : undefined,
        doorstepDelivery: form.doorstepDelivery,
        deliveryAddress: form.doorstepDelivery ? form.deliveryAddress : undefined,
        doorstepCharge: form.doorstepDelivery && form.doorstepCharge !== "" ? Number(form.doorstepCharge) : undefined,
        amountPaid: Number(form.amountPaid) || 0,
        paymentMode: form.paymentMode,
        notes: form.notes,
      });
      toast.success("Offline booking created");
      setForm(emptyForm);
      setShowAddForm(false);
      fetchBookings(1, search, statusFilter);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (f: keyof OfflineForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }));

  const activeCount = bookings.filter(b => b.status === "active" || b.status === "confirmed").length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Offline Bookings</h1>
          <p className="text-[#9090A8] text-sm">{total} offline bookings · {activeCount} active · live from database</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fetchBookings(page, search, statusFilter)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E4E5EF] text-xs font-semibold text-[#4A4A6A] hover:bg-[#F8F9FC]">
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm">
            <Plus size={16} /> Add Offline Booking
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search customer, car, booking ID..."
            className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
          {["all", "confirmed", "active", "completed", "cancelled"].map(s =>
            <option key={s} value={s}>{s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          )}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-[#9090A8]">
            <Loader2 size={20} className="animate-spin" /> Loading from database...
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-[#9090A8]">
            <p className="font-semibold">No offline bookings found</p>
            <p className="text-xs mt-1">Create your first offline booking using the button above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                  {["ID", "Customer", "Car", "Period", "Amount", "Received", "Deposit", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => {
                  const s = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
                  const balance = b.balanceDue ?? (b.totalAmount - b.amountPaid);
                  return (
                    <tr key={b._id} className={cn("border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors", i % 2 === 1 ? "bg-[#F8F9FC]/50" : "")}>
                      <td className="px-4 py-3.5 font-mono text-xs text-[#4A4A6A] font-bold whitespace-nowrap">
                        #{b.bookingId || b._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-[#0F0F1A] text-sm">{b.userId?.name ?? "—"}</p>
                        <p className="text-[#9090A8] text-xs">{b.userId?.mobile ?? "—"}</p>
                        {b.bookedBy ? <p className="text-[#4A4A6A] text-[10px] mt-1">Booked by: {b.bookedBy}</p> : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[#0F0F1A] text-sm">{b.carId?.name ?? "—"}</p>
                        <p className="text-[#9090A8] text-xs">{b.carId?.registrationNo ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-xs text-[#4A4A6A]">{fmtDate(b.startTime)} → {fmtDate(b.endTime)}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#0F0F1A] text-sm whitespace-nowrap">₹{b.totalAmount?.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={cn("text-xs font-bold", balance > 0 ? "text-[#F59E0B]" : "text-[#10B981]")}>
                          ₹{b.amountPaid?.toLocaleString("en-IN")}
                        </span>
                        {balance > 0 && <p className="text-[10px] text-[#EF4444]">Due: ₹{balance?.toLocaleString("en-IN")}</p>}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-bold text-[#F59E0B]">₹{b.securityDeposit?.toLocaleString("en-IN")}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.text }}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5">
                          <button onClick={() => setBillFor(b)} title="Generate Bill"
                            className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#92400E] hover:bg-[#F59E0B] hover:text-white transition-colors flex items-center justify-center">
                            <FileText size={13} />
                          </button>
                          <button onClick={() => setEditFor(b)} title="Edit Booking"
                            className="w-8 h-8 rounded-lg bg-[#EDE9FE] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors flex items-center justify-center">
                            <Pencil size={13} />
                          </button>
                          <Link href={`/admin/bookings/${b._id}`} title="View Details"
                            className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center">
                            <Eye size={13} />
                          </Link>
                          {canDeleteBooking && (
                            <button onClick={() => deleteBooking(b)} disabled={deletingId === b._id} title="Delete"
                              className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#991B1B] hover:bg-[#EF4444] hover:text-white transition-colors flex items-center justify-center disabled:opacity-50">
                              {deletingId === b._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#E4E5EF]">
            <p className="text-[#9090A8] text-sm">Showing {bookings.length} of {total} bookings</p>
            <div className="flex gap-2">
              <button onClick={() => { const p = page - 1; setPage(p); fetchBookings(p, search, statusFilter); }} disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <span className="w-9 h-9 rounded-xl bg-[#E8540A] text-white font-bold text-sm flex items-center justify-center">{page}</span>
              <button onClick={() => { const p = page + 1; setPage(p); fetchBookings(p, search, statusFilter); }} disabled={page === totalPages}
                className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Offline Booking Modal ──────────────────────────────────────────── */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E5EF]">
              <h3 className="font-black font-syne text-[#0F0F1A] text-lg">Add Offline Booking</h3>
              <button onClick={() => { setShowAddForm(false); setForm(emptyForm); }} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Customer Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input value={form.name} onChange={update("name")} placeholder="Full name" className={inputCls + " pl-9"} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Mobile <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input value={form.mobile} onChange={update("mobile")} required placeholder="10-digit mobile" className={inputCls + " pl-9"} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Booked By</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input value={form.bookedBy} onChange={update("bookedBy")} placeholder="Booking source / agent name" className={inputCls + " pl-9"} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Pickup Location</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input value={form.pickupLocation} onChange={update("pickupLocation")} placeholder="Pickup location / address" className={inputCls + " pl-9"} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Select Car <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Car size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <select value={form.carId} onChange={update("carId")} required className={inputCls + " pl-9"}>
                      <option value="">-- Select Car --</option>
                      {cars.map(c => (
                        <option key={c._id} value={c._id}>{c.name} — {c.registrationNo}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Pickup Date & Time <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input type="datetime-local" value={form.startTime} onChange={update("startTime")} required className={inputCls + " pl-9"} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Return Date & Time <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input type="datetime-local" value={form.endTime} onChange={update("endTime")} required className={inputCls + " pl-9"} />
                  </div>
                </div>
              </div>

              {/* Pickup & Drop (Doorstep Delivery) */}
              <div className="border-[1.5px] border-[#E4E5EF] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Truck size={16} className="text-[#E8540A]" />
                    <div>
                      <p className="text-sm font-semibold text-[#0F0F1A]">Pickup & Drop (Doorstep)</p>
                      <p className="text-[#9090A8] text-xs">Deliver the car to the customer instead of office pickup</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, doorstepDelivery: !f.doorstepDelivery }))}
                    className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0", form.doorstepDelivery ? "bg-[#E8540A]" : "bg-[#E4E5EF]")}
                  >
                    <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", form.doorstepDelivery ? "left-5" : "left-0.5")} />
                  </button>
                </div>
                {form.doorstepDelivery && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Delivery Address <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                        <input value={form.deliveryAddress} onChange={update("deliveryAddress")} placeholder="Full delivery address" className={inputCls + " pl-9"} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Pickup & Drop Charge (₹)</label>
                      <div className="relative">
                        <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                        <input type="number" value={form.doorstepCharge} onChange={update("doorstepCharge")} placeholder="0" min="0" className={inputCls + " pl-9"} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rent & Security — auto-filled from the selected car + duration, editable */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Rent (₹)</label>
                    <div className="relative">
                      <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                      <input type="number" value={form.bookingFare} onChange={update("bookingFare")} placeholder="0" min="0" className={inputCls + " pl-9"} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Security Deposit (₹)</label>
                    <div className="relative">
                      <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                      <input type="number" value={form.securityDeposit} onChange={update("securityDeposit")} placeholder="0" min="0" className={inputCls + " pl-9"} />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-[#9090A8] mt-1.5">Auto-filled from the selected car & duration — edit if the actual rent or security collected is different.</p>
              </div>

              {/* Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Amount Received (₹)</label>
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input type="number" value={form.amountPaid} onChange={update("amountPaid")} placeholder="0" min="0" className={inputCls + " pl-9"} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Payment Mode</label>
                  <select value={form.paymentMode} onChange={update("paymentMode")} className={inputCls}>
                    <option value="offline_cash">Cash</option>
                    <option value="offline_qr">UPI / QR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Notes / Remarks</label>
                  <input value={form.notes} onChange={update("notes")} placeholder="Internal notes..." className={inputCls} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddForm(false); setForm(emptyForm); }}
                  className="flex-1 py-3 rounded-xl border-2 border-[#E4E5EF] font-bold text-sm text-[#4A4A6A]">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 rounded-xl btn-gradient text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><Check size={14} /> Create Booking</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {billFor && <BillModal booking={billFor} onClose={() => setBillFor(null)} />}

      {/* Edit Modal */}
      {editFor && (
        <EditModal
          booking={editFor}
          onClose={() => setEditFor(null)}
          onSaved={(updated) => {
            setBookings(prev => prev.map(b => b._id === updated._id ? updated : b));
            setEditFor(null);
          }}
        />
      )}
    </div>
  );
}
