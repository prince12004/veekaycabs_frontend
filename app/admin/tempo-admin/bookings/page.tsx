"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Search, Eye, Edit, Trash2, IndianRupee, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { canDelete } from "@/lib/adminPermissions";

interface TempoBooking {
  _id: string;
  bookingId: string;
  userId: { name: string; mobile: string };
  tempoId: { name: string; registrationNo: string; seats: number };
  tripType: string;
  pickupCity: string;
  destination: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  paymentMode: string;
  carReceived: boolean;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#F59E0B" },
  confirmed: { bg: "#D1FAE5", text: "#10B981" },
  active: { bg: "#DBEAFE", text: "#3B82F6" },
  completed: { bg: "#F0FDF4", text: "#16A34A" },
  cancelled: { bg: "#FEE2E2", text: "#EF4444" },
};

export default function TempoBookingsPage() {
  const [bookings, setBookings] = useState<TempoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [canDeleteBooking, setCanDeleteBooking] = useState(false);

  useEffect(() => {
    fetchBookings();
    setCanDeleteBooking(canDelete("tempoAdmin"));
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const { data } = await adminApi.get("/api/admin/tempo-bookings", { params });
      setBookings(data.data || []);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    try {
      await adminApi.delete(`/api/admin/tempo-bookings/${id}`);
      setBookings(prev => prev.filter(b => b._id !== id));
      toast.success("Booking deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleMarkReceived = async (id: string) => {
    try {
      const { data } = await adminApi.patch(`/api/admin/tempo-bookings/${id}/car-received`);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, carReceived: true, status: 'active' } : b));
      toast.success("Marked as received");
    } catch {
      toast.error("Failed to update");
    }
  };

  const filtered = bookings.filter(b =>
    !search ||
    b.bookingId?.toLowerCase().includes(search.toLowerCase()) ||
    b.userId?.mobile?.includes(search) ||
    b.tempoId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (d: string) => {
    const date = new Date(d);
    return `${date.toLocaleDateString("en-IN")} @${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Manage Booking</h1>
          <p className="text-[#9090A8] text-sm">{bookings.length} total bookings</p>
        </div>
        <Link href="/admin/tempo-admin/bookings/add" className="px-5 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#9D4EDD] text-white font-semibold text-sm rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity">
          + Add Booking
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-52">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search booking ID, mobile, or tempo..." className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#7C3AED] outline-none bg-white">
          <option value="all">All Status</option>
          {["pending", "confirmed", "active", "completed", "cancelled"].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E5EF]">
          <h2 className="font-bold text-[#0F0F1A] text-sm uppercase tracking-wider">MANAGE BOOKING LISTING</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-[#9090A8]">Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-[#9090A8]">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                  {["Sr.", "Id", "User", "Car", "Start", "End", "Price", "Payment", "Booking Type", "Car Received", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-[#9090A8] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const sc = STATUS_COLORS[b.status] || { bg: "#F0F1F6", text: "#9090A8" };
                  return (
                    <tr key={b._id} className="border-b border-[#F0F1F6] hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#9090A8]">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold text-[#0F0F1A] text-xs">{b.tempoId?.name || "—"}{b.tempoId?.registrationNo}</p>
                          <p className="text-[#9090A8] text-xs">{b.bookingId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#0F0F1A]">{b.userId?.mobile || "—"}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold text-[#0F0F1A] text-xs">{b.tempoId?.name}</p>
                          <p className="text-[#9090A8] text-xs">{b.tempoId?.registrationNo}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#4A4A6A] whitespace-nowrap">{b.startTime ? fmt(b.startTime) : "—"}</td>
                      <td className="px-4 py-3 text-xs text-[#4A4A6A] whitespace-nowrap">{b.endTime ? fmt(b.endTime) : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 text-sm font-bold text-[#0F0F1A]">
                          <IndianRupee size={11} />{b.totalAmount?.toLocaleString("en-IN") || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-[11px] font-bold" style={{ backgroundColor: sc.bg, color: sc.text }}>
                          {b.status === "confirmed" ? "Success" : b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#4A4A6A]">{b.paymentMode === "online" ? "Online" : "Offline"}</td>
                      <td className="px-4 py-3">
                        {b.carReceived ? (
                          <span className="text-[#10B981] text-xs font-bold">Received</span>
                        ) : (
                          <button onClick={() => handleMarkReceived(b._id)} className="text-xs px-2 py-1 bg-[#DBEAFE] text-[#3B82F6] rounded-lg font-semibold hover:bg-[#3B82F6] hover:text-white transition-all">
                            Mark
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/tempo-admin/bookings/${b._id}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#DBEAFE] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white transition-all text-xs font-semibold whitespace-nowrap"
                          >
                            <Eye size={11} /> View
                          </Link>
                          {canDeleteBooking && (
                            <button onClick={() => handleDelete(b._id)} className="w-7 h-7 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-all">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-6 py-3 text-xs text-[#9090A8] border-t border-[#F0F1F6]">
              Showing 1 to {filtered.length} of {filtered.length} entries
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
