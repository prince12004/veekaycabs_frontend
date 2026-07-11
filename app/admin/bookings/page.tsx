"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Download, Eye, ChevronLeft, ChevronRight,
  Calendar, CheckCircle, Activity, Clock, XCircle, PhoneCall, Loader2,
} from "lucide-react";
import { bookingsApi } from "@/lib/api";

interface Booking {
  _id: string;
  bookingId: string;
  userId?: { name?: string; mobile?: string };
  carId?: { name?: string; type?: string };
  cityId?: { name?: string };
  startTime: string;
  endTime: string;
  totalAmount: number;
  amountPaid: number;
  paymentMode: string;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "#D1FAE5", text: "#065F46" },
  active:    { bg: "#DBEAFE", text: "#1E40AF" },
  completed: { bg: "#F1F2F7", text: "#4A4A6A" },
  pending:   { bg: "#FEF3C7", text: "#92400E" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const fmtMode = (m: string) =>
  m === "online" ? "Online" : m === "offline_cash" ? "Cash" : m === "offline_qr" ? "QR/UPI" : m;

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter !== "All" && statusFilter !== "Drop-offs")
        params.status = statusFilter.toLowerCase();
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const { data } = await bookingsApi.getAll(params);
      setBookings(data.data || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, fromDate, toDate, page]);

  useEffect(() => { fetch(); }, [fetch]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const isDropOff = (b: Booking) => b.status === "pending" && b.amountPaid === 0;

  const counts = {
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    active:    bookings.filter(b => b.status === "active").length,
    pending:   bookings.filter(b => b.status === "pending").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
    dropOffs:  bookings.filter(isDropOff).length,
  };

  const displayed = statusFilter === "Drop-offs"
    ? bookings.filter(isDropOff)
    : bookings;

  const handleExport = async () => {
    try {
      const res = await bookingsApi.exportCsv();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = "bookings.csv"; a.click();
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Bookings</h1>
          <p className="text-[#9090A8] text-sm">{total} total bookings</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 border-[1.5px] border-[#E8540A] text-[#E8540A] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#FFF3ED] transition-colors"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Confirmed", count: counts.confirmed, icon: CheckCircle, color: "#10B981", bg: "#D1FAE5" },
          { label: "Active",    count: counts.active,    icon: Activity,     color: "#3B82F6", bg: "#DBEAFE" },
          { label: "Pending",   count: counts.pending,   icon: Clock,        color: "#F59E0B", bg: "#FEF3C7" },
          { label: "Drop-offs", count: counts.dropOffs,  icon: PhoneCall,    color: "#EF4444", bg: "#FEE2E2" },
          { label: "Completed", count: counts.completed, icon: Calendar,     color: "#9090A8", bg: "#F1F2F7" },
          { label: "Cancelled", count: counts.cancelled, icon: XCircle,      color: "#EF4444", bg: "#FEE2E2" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <button
            key={label}
            onClick={() => { setStatusFilter(label); setPage(1); }}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-3 hover:shadow-md transition-all text-left ${statusFilter === label ? "border-[#E8540A] shadow-[0_0_0_1px_#E8540A]" : "border-[#E4E5EF]"}`}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-black text-[#0F0F1A] font-syne leading-none">{count}</p>
              <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by booking ID, customer..."
            className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white"
        >
          {["All", "Pending", "Confirmed", "Active", "Drop-offs", "Completed", "Cancelled"].map(s => <option key={s}>{s}</option>)}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={e => { setFromDate(e.target.value); setPage(1); }}
          className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none"
        />
        <input
          type="date"
          value={toDate}
          onChange={e => { setToDate(e.target.value); setPage(1); }}
          className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none"
        />
      </div>

      {statusFilter === "Drop-offs" && (
        <div className="flex items-center gap-2 bg-[#FEE2E2] text-[#991B1B] text-xs font-semibold px-4 py-3 rounded-xl">
          <PhoneCall size={14} /> These customers reached the payment page but never paid — call them to help finish the booking.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-[#9090A8]">
            <Loader2 size={20} className="animate-spin" /> Loading bookings...
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center text-[#9090A8]">
            <Calendar size={36} className="mx-auto mb-3 text-[#E4E5EF]" />
            <p className="font-semibold">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                  {["Booking ID", "Customer", "Car", "Period", "Amount", "Paid", "Due", "Mode", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((b, i) => {
                  const s = statusColors[b.status] || statusColors.pending;
                  return (
                    <tr key={b._id} className={`border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors ${i % 2 === 1 ? "bg-[#F8F9FC]/50" : ""}`}>
                      <td className="px-4 py-4 font-mono text-[11px] text-[#4A4A6A] max-w-[180px]">
                        <div className="truncate">{b.bookingId || b._id.slice(-8).toUpperCase()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#0F0F1A] text-sm">{b.userId?.name || "—"}</p>
                        <p className="text-[#9090A8] text-xs">{(b.userId?.mobile && !b.userId.mobile.startsWith("google_")) ? b.userId.mobile : "Google user"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-[#0F0F1A] text-sm">{b.carId?.name || "—"}</p>
                        <p className="text-[#9090A8] text-xs">{b.cityId?.name || ""}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[#4A4A6A] text-xs">{fmtDate(b.startTime)}</p>
                        <p className="text-[#9090A8] text-xs">→ {fmtDate(b.endTime)}</p>
                      </td>
                      <td className="px-4 py-4 font-bold text-[#0F0F1A] text-sm whitespace-nowrap">
                        Rs. {b.totalAmount?.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-xs font-semibold ${b.amountPaid >= b.totalAmount ? "text-[#10B981]" : "text-[#F59E0B]"}`}>
                          Rs. {b.amountPaid?.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {(b.totalAmount - b.amountPaid) > 0 ? (
                          <span className="text-xs font-bold text-[#EF4444]">
                            Rs. {(b.totalAmount - b.amountPaid).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-[#10B981]">Paid</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[#4A4A6A] text-xs">{fmtMode(b.paymentMode)}</td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.text }}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1.5">
                          <a
                            href={`/admin/bookings/${b._id}`}
                            className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center"
                          >
                            <Eye size={14} />
                          </a>
                          {isDropOff(b) ? (
                            <a
                              href={`tel:${b.userId?.mobile || ""}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-[11px] font-bold hover:bg-[#EF4444] hover:text-white transition-colors whitespace-nowrap"
                            >
                              <PhoneCall size={11} /> Call
                            </a>
                          ) : (b.status === "pending" || b.status === "confirmed") ? (
                            <a
                              href={`/admin/bookings/${b._id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#D1FAE5] text-[#065F46] text-[11px] font-bold hover:bg-[#10B981] hover:text-white transition-colors whitespace-nowrap"
                            >
                              Received
                            </a>
                          ) : null}
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E4E5EF]">
          <p className="text-[#9090A8] text-sm">
            Page {page} of {pages} · {total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button className="w-9 h-9 rounded-xl bg-[#E8540A] text-white font-bold text-sm">{page}</button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
