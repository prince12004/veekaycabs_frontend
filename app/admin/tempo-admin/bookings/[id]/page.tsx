"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, MapPin, Users, Calendar, IndianRupee, Phone, Car } from "lucide-react";

interface TempoBooking {
  _id: string;
  bookingId: string;
  userId: { name: string; mobile: string };
  tempoId: { name: string; registrationNo: string; seats: number; basePrice: number };
  tripType: string;
  pickupCity: string;
  destination: string;
  pickupLocation: string;
  startTime: string;
  endTime: string;
  totalDays: number;
  passengers: number;
  baseFare: number;
  gst: number;
  totalAmount: number;
  tokenAmount: number;
  balanceDue: number;
  status: string;
  paymentMode: string;
  carReceived: boolean;
  notes: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#F59E0B" },
  confirmed: { bg: "#D1FAE5", text: "#10B981" },
  active: { bg: "#DBEAFE", text: "#3B82F6" },
  completed: { bg: "#F0FDF4", text: "#16A34A" },
  cancelled: { bg: "#FEE2E2", text: "#EF4444" },
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<TempoBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    adminApi.get(`/api/admin/tempo-bookings/${id}`)
      .then(({ data }) => { setBooking(data.data); setStatus(data.data.status); })
      .catch(() => toast.error("Booking not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      await adminApi.put(`/api/admin/tempo-bookings/${id}`, { status });
      setBooking(prev => prev ? { ...prev, status } : null);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkReceived = async () => {
    setUpdating(true);
    try {
      await adminApi.patch(`/api/admin/tempo-bookings/${id}/car-received`);
      setBooking(prev => prev ? { ...prev, carReceived: true, status: "active" } : null);
      toast.success("Marked as received");
    } catch {
      toast.error("Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const fmt = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <div className="p-12 text-center text-[#9090A8]">Loading...</div>;
  if (!booking) return <div className="p-12 text-center text-[#9090A8]">Booking not found</div>;

  const sc = STATUS_COLORS[booking.status] || { bg: "#F0F1F6", text: "#9090A8" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/tempo-admin/bookings" className="w-9 h-9 rounded-xl bg-white border border-[#E4E5EF] flex items-center justify-center text-[#4A4A6A] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Booking Detail</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: sc.bg, color: sc.text }}>
              {booking.status.toUpperCase()}
            </span>
          </div>
          <p className="text-[#9090A8] text-sm mt-0.5">ID: {booking.bookingId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h2 className="font-bold text-[#0F0F1A] text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Phone size={14} className="text-[#7C3AED]" /> Customer Info
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5">Name</p>
                <p className="font-semibold text-[#0F0F1A]">{booking.userId?.name || "—"}</p>
              </div>
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5">Mobile</p>
                <p className="font-semibold text-[#0F0F1A]">{booking.userId?.mobile || "—"}</p>
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h2 className="font-bold text-[#0F0F1A] text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Car size={14} className="text-[#7C3AED]" /> Vehicle
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5">Tempo</p>
                <p className="font-semibold text-[#0F0F1A]">{booking.tempoId?.name}</p>
              </div>
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5">Reg. Number</p>
                <p className="font-mono font-semibold text-[#0F0F1A]">{booking.tempoId?.registrationNo}</p>
              </div>
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5">Seats</p>
                <p className="font-semibold text-[#0F0F1A] flex items-center gap-1"><Users size={12} /> {booking.tempoId?.seats}</p>
              </div>
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5">Passengers</p>
                <p className="font-semibold text-[#0F0F1A]">{booking.passengers}</p>
              </div>
            </div>
          </div>

          {/* Trip */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h2 className="font-bold text-[#0F0F1A] text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={14} className="text-[#7C3AED]" /> Trip Details
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5">Trip Type</p>
                <p className="font-semibold text-[#0F0F1A] capitalize">{booking.tripType?.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5">Pickup City</p>
                <p className="font-semibold text-[#0F0F1A]">{booking.pickupCity}</p>
              </div>
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5">Destination</p>
                <p className="font-semibold text-[#0F0F1A]">{booking.destination || "—"}</p>
              </div>
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5">Pickup Location</p>
                <p className="font-semibold text-[#0F0F1A]">{booking.pickupLocation || "—"}</p>
              </div>
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5 flex items-center gap-1"><Calendar size={11} /> Start</p>
                <p className="font-semibold text-[#0F0F1A]">{booking.startTime ? fmt(booking.startTime) : "—"}</p>
              </div>
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5 flex items-center gap-1"><Calendar size={11} /> End</p>
                <p className="font-semibold text-[#0F0F1A]">{booking.endTime ? fmt(booking.endTime) : "—"}</p>
              </div>
              <div>
                <p className="text-[#9090A8] text-xs mb-0.5">Total Days</p>
                <p className="font-semibold text-[#0F0F1A]">{booking.totalDays || "—"}</p>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4 pt-4 border-t border-[#F0F1F6]">
                <p className="text-[#9090A8] text-xs mb-0.5">Notes</p>
                <p className="text-sm text-[#4A4A6A]">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Fare */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h2 className="font-bold text-[#0F0F1A] text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <IndianRupee size={14} className="text-[#7C3AED]" /> Fare Breakdown
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#4A4A6A]">
                <span>Base Fare</span>
                <span className="font-semibold">₹{(booking.baseFare || 0).toLocaleString("en-IN")}</span>
              </div>
              {booking.gst > 0 && (
                <div className="flex justify-between text-[#4A4A6A]">
                  <span>GST</span>
                  <span className="font-semibold">₹{booking.gst.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="border-t border-[#E4E5EF] pt-2 flex justify-between font-black text-[#0F0F1A]">
                <span>Total</span>
                <span className="text-[#7C3AED]">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              {booking.tokenAmount > 0 && (
                <>
                  <div className="flex justify-between text-[#10B981] font-semibold">
                    <span>Token Paid</span>
                    <span>₹{booking.tokenAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[#F59E0B] font-semibold">
                    <span>Balance Due</span>
                    <span>₹{(booking.balanceDue || 0).toLocaleString("en-IN")}</span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-[#E4E5EF] text-xs text-[#9090A8]">
              Payment: <span className="font-semibold text-[#4A4A6A] capitalize">{booking.paymentMode}</span>
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h2 className="font-bold text-[#0F0F1A] text-sm uppercase tracking-wider mb-4">Update Status</h2>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none bg-white mb-3"
            >
              {["pending", "confirmed", "active", "completed", "cancelled"].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={updating || status === booking.status}
              className="w-full py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#9D4EDD] text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {updating ? "Saving..." : "Save Status"}
            </button>
          </div>

          {/* Car Received */}
          {!booking.carReceived && (
            <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
              <h2 className="font-bold text-[#0F0F1A] text-sm uppercase tracking-wider mb-3">Car Received</h2>
              <button
                onClick={handleMarkReceived}
                disabled={updating}
                className="w-full py-2.5 bg-[#10B981] text-white font-semibold rounded-xl text-sm hover:bg-[#059669] transition-colors disabled:opacity-50"
              >
                Mark as Received
              </button>
            </div>
          )}
          {booking.carReceived && (
            <div className="bg-[#D1FAE5] rounded-2xl p-4 text-center">
              <p className="text-[#10B981] font-bold text-sm">✓ Car Received</p>
            </div>
          )}

          {/* Meta */}
          <div className="bg-[#F8F9FC] rounded-2xl border border-[#E4E5EF] p-4 text-xs text-[#9090A8] space-y-1">
            <p>Booking ID: <span className="font-mono font-semibold text-[#4A4A6A]">{booking.bookingId}</span></p>
            <p>Created: <span className="font-semibold text-[#4A4A6A]">{fmt(booking.createdAt)}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
