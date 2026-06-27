"use client";

import { useState } from "react";
import { Search, Download, Eye, ChevronLeft, ChevronRight, Calendar, CheckCircle, Activity, Clock, XCircle, PhoneCall } from "lucide-react";

const BOOKINGS = [
  { id: "DL_HyundaiCreta_PrincK_7823_2026", customer: "Prince Kumar", mobile: "99999 26867", car: "Hyundai Creta", city: "Delhi", start: "Jun 10, 2026 10:00", end: "Jun 12, 2026 10:00", amount: 4504, paid: 1000, mode: "Online", status: "confirmed" },
  { id: "DL_MarutiSwift_RahulS_3421_2026", customer: "Rahul Sharma", mobile: "98765 43210", car: "Maruti Swift", city: "Noida", start: "Jun 9, 2026 08:00", end: "Jun 10, 2026 08:00", amount: 2890, paid: 2890, mode: "Online", status: "active" },
  { id: "DL_KiaSeltos_AnkitV_8821_2026", customer: "Ankit Verma", mobile: "87654 32109", car: "Kia Seltos", city: "Gurgaon", start: "Jun 7, 2026 12:00", end: "Jun 9, 2026 12:00", amount: 5200, paid: 5200, mode: "Offline Cash", status: "completed" },
  { id: "DL_HyundaiI20_SumitK_5512_2026", customer: "Sumit Kapoor", mobile: "76543 21098", car: "Hyundai i20", city: "Delhi", start: "Jun 15, 2026 09:00", end: "Jun 16, 2026 09:00", amount: 1780, paid: 500, mode: "Online", status: "pending" },
  { id: "DL_HondaCity_PriyaM_9912_2026", customer: "Priya Mehta", mobile: "65432 10987", car: "Honda City", city: "Delhi", start: "Jun 8, 2026 14:00", end: "Jun 9, 2026 14:00", amount: 3400, paid: 3400, mode: "Online", status: "cancelled" },
  { id: "DL_MarutiErtiga_VijayT_4523_2026", customer: "Vijay Tandon", mobile: "54321 09876", car: "Maruti Ertiga", city: "Noida", start: "Jun 5, 2026 10:00", end: "Jun 8, 2026 10:00", amount: 6800, paid: 6800, mode: "UPI", status: "completed" },
  { id: "DL_HyundaiVenue_MohitR_2290_2026", customer: "Mohit Rana", mobile: "91234 56780", car: "Hyundai Venue", city: "Delhi", start: "Jun 17, 2026 11:00", end: "Jun 18, 2026 11:00", amount: 2380, paid: 0, mode: "Online", status: "pending" },
  { id: "DL_MarutiBaleno_SnehaG_6671_2026", customer: "Sneha Gill", mobile: "90876 54321", car: "Maruti Baleno", city: "Gurgaon", start: "Jun 16, 2026 18:00", end: "Jun 17, 2026 18:00", amount: 1980, paid: 0, mode: "Online", status: "pending" },
];

const isDropOff = (b: (typeof BOOKINGS)[0]) => b.status === "pending" && b.paid === 0;

const statusColors: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "#D1FAE5", text: "#065F46" },
  active: { bg: "#DBEAFE", text: "#1E40AF" },
  completed: { bg: "#F1F2F7", text: "#4A4A6A" },
  pending: { bg: "#FEF3C7", text: "#92400E" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

export default function AdminBookingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = BOOKINGS.filter(b => {
    const matchSearch = !search || b.id.toLowerCase().includes(search.toLowerCase()) || b.customer.toLowerCase().includes(search.toLowerCase()) || b.car.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || (statusFilter === "Drop-offs" ? isDropOff(b) : b.status === statusFilter.toLowerCase());
    return matchSearch && matchStatus;
  });

  const counts = {
    total: BOOKINGS.length,
    confirmed: BOOKINGS.filter(b => b.status === "confirmed").length,
    active: BOOKINGS.filter(b => b.status === "active").length,
    pending: BOOKINGS.filter(b => b.status === "pending").length,
    completed: BOOKINGS.filter(b => b.status === "completed").length,
    cancelled: BOOKINGS.filter(b => b.status === "cancelled").length,
    dropOffs: BOOKINGS.filter(isDropOff).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Bookings</h1>
          <p className="text-[#9090A8] text-sm">{counts.total} total bookings</p>
        </div>
        <button className="flex items-center gap-2 border-[1.5px] border-[#E8540A] text-[#E8540A] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#FFF3ED] transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Confirmed", count: counts.confirmed, icon: CheckCircle, color: "#10B981", bg: "#D1FAE5" },
          { label: "Active", count: counts.active, icon: Activity, color: "#3B82F6", bg: "#DBEAFE" },
          { label: "Pending", count: counts.pending, icon: Clock, color: "#F59E0B", bg: "#FEF3C7" },
          { label: "Drop-offs", count: counts.dropOffs, icon: PhoneCall, color: "#EF4444", bg: "#FEE2E2" },
          { label: "Completed", count: counts.completed, icon: Calendar, color: "#9090A8", bg: "#F1F2F7" },
          { label: "Cancelled", count: counts.cancelled, icon: XCircle, color: "#EF4444", bg: "#FEE2E2" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(label)}
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
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by booking ID, customer, car..." className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
          {["All", "Pending", "Confirmed", "Active", "Drop-offs", "Completed", "Cancelled"].map(s => <option key={s}>{s}</option>)}
        </select>
        <input type="date" className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none" />
        <input type="date" className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none" />
      </div>

      {statusFilter === "Drop-offs" && (
        <div className="flex items-center gap-2 bg-[#FEE2E2] text-[#991B1B] text-xs font-semibold px-4 py-3 rounded-xl">
          <PhoneCall size={14} /> These customers reached the payment page but never paid — call them to help finish the booking.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                {["Booking ID", "Customer", "Car", "Period", "Amount", "Paid", "Mode", "Status", "Action"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const s = statusColors[b.status];
                return (
                  <tr key={b.id} className={`border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors ${i % 2 === 1 ? "bg-[#F8F9FC]/50" : ""}`}>
                    <td className="px-4 py-4 font-mono text-[11px] text-[#4A4A6A] max-w-[180px] truncate">{b.id}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#0F0F1A] text-sm">{b.customer}</p>
                      <p className="text-[#9090A8] text-xs">{b.mobile}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-[#0F0F1A] text-sm">{b.car}</p>
                      <p className="text-[#9090A8] text-xs">{b.city}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[#4A4A6A] text-xs">{b.start}</p>
                      <p className="text-[#9090A8] text-xs">→ {b.end}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-[#0F0F1A] text-sm">Rs. {b.amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold ${b.paid >= b.amount ? "text-[#10B981]" : "text-[#F59E0B]"}`}>Rs. {b.paid.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="px-4 py-4 text-[#4A4A6A] text-xs">{b.mode}</td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.text }}>{b.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5">
                        <a href={`/admin/bookings/${b.id}`} className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center">
                          <Eye size={14} />
                        </a>
                        {isDropOff(b) ? (
                          <a href={`tel:+91${b.mobile.replace(/\s/g, "")}`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-[11px] font-bold hover:bg-[#EF4444] hover:text-white transition-colors whitespace-nowrap">
                            <PhoneCall size={11} /> Call
                          </a>
                        ) : b.status === "pending" || b.status === "confirmed" ? (
                          <a href={`/admin/bookings/${b.id}`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#D1FAE5] text-[#065F46] text-[11px] font-bold hover:bg-[#10B981] hover:text-white transition-colors whitespace-nowrap">
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E4E5EF]">
          <p className="text-[#9090A8] text-sm">Showing {filtered.length} of {BOOKINGS.length} bookings</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="w-9 h-9 rounded-xl bg-[#E8540A] text-white font-bold text-sm">{page}</button>
            <button onClick={() => setPage(p => p + 1)} className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
