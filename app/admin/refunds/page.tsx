"use client";

import { useState } from "react";
import { Search, RefreshCw, CheckCircle, Clock, XCircle, Eye, IndianRupee, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const REFUNDS = [
  { id: "REF_001", bookingId: "DL_HondaCity_PriyaM_9912_2026", customer: "Priya Mehta", mobile: "65432 10987", amount: 3400, depositAmount: 10000, type: "Cancellation Refund", status: "pending", requestedOn: "Jun 9, 2026", reason: "Customer cancelled booking", mode: "Online - Razorpay", autoEligible: true },
  { id: "REF_002", bookingId: "DL_MarutiSwift_RahulS_3421_2026", customer: "Rahul Sharma", mobile: "98765 43210", amount: 10000, depositAmount: 10000, type: "Security Deposit", status: "initiated", requestedOn: "Jun 10, 2026", reason: "Car returned in good condition", mode: "Online - Razorpay", autoEligible: true },
  { id: "REF_003", bookingId: "OFF_002", customer: "Sunita Rani", mobile: "98765 43211", amount: 5000, depositAmount: 5000, type: "Security Deposit", status: "completed", requestedOn: "Jun 15, 2026", reason: "Car returned with minor scratch — deducted Rs. 500", mode: "Cash / Bank Transfer", autoEligible: false },
  { id: "REF_004", bookingId: "DL_KiaSeltos_AnkitV_8821_2026", customer: "Ankit Verma", mobile: "87654 32109", amount: 1200, depositAmount: 10000, type: "Excess Amount Refund", status: "pending", requestedOn: "Jun 12, 2026", reason: "Booking shortened by customer request", mode: "Online - Razorpay", autoEligible: true },
  { id: "REF_005", bookingId: "DL_HyundaiI20_SumitK_5512_2026", customer: "Sumit Kapoor", mobile: "76543 21098", amount: 500, depositAmount: 5000, type: "Partial Refund", status: "rejected", requestedOn: "Jun 8, 2026", reason: "Challan found — amount deducted", mode: "N/A", autoEligible: false },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pending: { label: "Pending", bg: "#FEF3C7", text: "#92400E", icon: Clock },
  initiated: { label: "Initiated", bg: "#DBEAFE", text: "#1E40AF", icon: RefreshCw },
  completed: { label: "Completed", bg: "#D1FAE5", text: "#065F46", icon: CheckCircle },
  rejected: { label: "Rejected", bg: "#FEE2E2", text: "#991B1B", icon: XCircle },
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState(REFUNDS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = refunds.filter(r => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.customer.toLowerCase().includes(s) || r.bookingId.toLowerCase().includes(s) || r.id.toLowerCase().includes(s);
    const matchStatus = statusFilter === "All" || r.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const initiateRefund = (id: string) => {
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: "initiated" } : r));
  };

  const completeRefund = (id: string) => {
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: "completed" } : r));
  };

  const totalPending = refunds.filter(r => r.status === "pending").reduce((sum, r) => sum + r.amount, 0);
  const totalInitiated = refunds.filter(r => r.status === "initiated").reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Refund Management</h1>
          <p className="text-[#9090A8] text-sm">{refunds.length} total refunds</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending Refunds", value: `Rs. ${totalPending.toLocaleString("en-IN")}`, count: refunds.filter(r => r.status === "pending").length, color: "#F59E0B", bg: "#FEF3C7" },
          { label: "Initiated", value: `Rs. ${totalInitiated.toLocaleString("en-IN")}`, count: refunds.filter(r => r.status === "initiated").length, color: "#3B82F6", bg: "#DBEAFE" },
          { label: "Completed", value: `Rs. ${refunds.filter(r => r.status === "completed").reduce((sum, r) => sum + r.amount, 0).toLocaleString("en-IN")}`, count: refunds.filter(r => r.status === "completed").length, color: "#10B981", bg: "#D1FAE5" },
          { label: "Auto-Eligible", value: `${refunds.filter(r => r.autoEligible && r.status === "pending").length} refunds`, count: refunds.filter(r => r.autoEligible && r.status === "pending").length, color: "#8B5CF6", bg: "#EDE9FE" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: card.bg }}>
              <IndianRupee size={18} style={{ color: card.color }} />
            </div>
            <p className="text-xl font-black text-[#0F0F1A]">{card.value}</p>
            <p className="text-[#9090A8] text-xs mt-0.5">{card.label} ({card.count})</p>
          </div>
        ))}
      </div>

      {/* Auto Refund Banner */}
      {refunds.filter(r => r.autoEligible && r.status === "pending").length > 0 && (
        <div className="bg-[#EDE9FE] border border-[#7C3AED]/20 rounded-2xl p-4 flex items-center gap-4">
          <AlertTriangle size={20} className="text-[#7C3AED] shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-[#4C1D95] text-sm">{refunds.filter(r => r.autoEligible && r.status === "pending").length} refund(s) are eligible for auto-initiation</p>
            <p className="text-xs text-[#6D28D9] mt-0.5">These customers paid online and meet refund criteria. You can initiate all at once.</p>
          </div>
          <button
            onClick={() => setRefunds(prev => prev.map(r => r.autoEligible && r.status === "pending" ? { ...r, status: "initiated" } : r))}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] text-white rounded-xl text-sm font-bold whitespace-nowrap"
          >
            <RefreshCw size={14} /> Auto-Initiate All
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer, booking ID..." className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
          {["All", "Pending", "Initiated", "Completed", "Rejected"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                {["Refund ID", "Customer", "Booking", "Amount", "Type", "Reason", "Mode", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const sc = STATUS_CONFIG[r.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={r.id} className={cn("border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors", i % 2 === 1 ? "bg-[#F8F9FC]/50" : "")}>
                    <td className="px-4 py-4 font-mono text-xs font-bold text-[#4A4A6A]">{r.id}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-sm text-[#0F0F1A]">{r.customer}</p>
                      <p className="text-xs text-[#9090A8]">{r.mobile}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-mono text-xs text-[#4A4A6A] max-w-[140px] truncate">{r.bookingId}</p>
                      <p className="text-[10px] text-[#9090A8]">{r.requestedOn}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-[#0F0F1A] text-sm">Rs. {r.amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-4">
                      <span className="text-xs bg-[#F8F9FC] text-[#4A4A6A] font-semibold px-2 py-1 rounded-lg">{r.type}</span>
                      {r.autoEligible && <span className="ml-1 text-[10px] bg-[#EDE9FE] text-[#7C3AED] font-bold px-1.5 py-0.5 rounded">Auto</span>}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#4A4A6A] max-w-[160px]">{r.reason}</td>
                    <td className="px-4 py-4 text-xs text-[#4A4A6A]">{r.mode}</td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-bold w-fit px-2.5 py-1 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>
                        <StatusIcon size={11} /> {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5">
                        {r.status === "pending" && (
                          <button onClick={() => initiateRefund(r.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#DBEAFE] text-[#1E40AF] text-xs font-bold hover:bg-[#1E40AF] hover:text-white transition-colors">
                            <RefreshCw size={11} /> Initiate
                          </button>
                        )}
                        {r.status === "initiated" && (
                          <button onClick={() => completeRefund(r.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#D1FAE5] text-[#065F46] text-xs font-bold hover:bg-[#10B981] hover:text-white transition-colors">
                            <CheckCircle size={11} /> Complete
                          </button>
                        )}
                        <button className="w-8 h-8 rounded-lg bg-[#F8F9FC] text-[#4A4A6A] hover:bg-[#E4E5EF] transition-colors flex items-center justify-center">
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E4E5EF]">
          <p className="text-[#9090A8] text-sm">Showing {filtered.length} of {refunds.length} refunds</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors"><ChevronLeft size={16} /></button>
            <button className="w-9 h-9 rounded-xl bg-[#E8540A] text-white font-bold text-sm">{page}</button>
            <button onClick={() => setPage(p => p + 1)} className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
