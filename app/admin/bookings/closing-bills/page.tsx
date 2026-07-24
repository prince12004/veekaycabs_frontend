"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Eye, ChevronLeft, ChevronRight, Loader2, FileText, RefreshCw } from "lucide-react";
import { bookingsApi } from "@/lib/api";
import DatePicker from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ClosingBillRow {
  _id: string;
  bookingId: string;
  userId?: { name: string; mobile: string };
  carId?: { name: string; registrationNo: string };
  cityId?: { name: string };
  closingBill: {
    totalCharges: number;
    advancePaid: number;
    settlementAmount: number;
    closedAt: string;
    refundPaid?: boolean;
  };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function SettlementBadge({ amount, refundPaid }: { amount: number; refundPaid?: boolean }) {
  if (amount === 0) {
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#D1FAE5] text-[#065F46]">Fully Settled</span>;
  }
  if (amount > 0) {
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF3ED] text-[#E8540A]">Due: ₹{amount.toLocaleString("en-IN")}</span>;
  }
  return (
    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", refundPaid ? "bg-[#F1F2F7] text-[#4A4A6A]" : "bg-[#DBEAFE] text-[#1E40AF]")}>
      {refundPaid ? "Refunded" : "Refund"}: ₹{Math.abs(amount).toLocaleString("en-IN")}
    </span>
  );
}

export default function ClosingBillsPage() {
  const [rows, setRows] = useState<ClosingBillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [totals, setTotals] = useState({ due: 0, refund: 0 });
  const [amountFilter, setAmountFilter] = useState<"all" | "due" | "refund">("all");

  // Filtering (search/date/settlement tile) all happens server-side now, so
  // "Due"/"Refund Pending" reflect every matching closing bill — not just
  // whatever 20 rows happen to be on the current page.
  const load = useCallback((p = 1) => {
    setLoading(true);
    const params: Record<string, string | number> = { page: p, limit: 20 };
    if (search) params.search = search;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    if (amountFilter !== "all") params.settlementType = amountFilter;
    bookingsApi.getClosingBills(params)
      .then(({ data }) => {
        setRows(data.data || []);
        setTotal(data.total || 0);
        setGrandTotal(data.grandTotal || 0);
        setTotalPages(data.pages || 1);
        setTotals({ due: data.totalDue || 0, refund: data.totalRefund || 0 });
      })
      .catch(() => toast.error("Failed to load closing bills"))
      .finally(() => setLoading(false));
  }, [search, dateFrom, dateTo, amountFilter]);

  useEffect(() => { setPage(1); load(1); }, [dateFrom, dateTo, amountFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayRows = rows;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Closing Bills</h1>
          <p className="text-[#9090A8] text-sm">{grandTotal} closed bookings · final settlement bills</p>
        </div>
        <button onClick={() => load(page)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E4E5EF] text-xs font-semibold text-[#4A4A6A] hover:bg-[#F8F9FC]">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Summary tiles — click to filter across ALL closing bills server-side (not just this page) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setAmountFilter("all")}
          className={cn(
            "text-left bg-white rounded-2xl border p-4 transition-all",
            amountFilter === "all" ? "border-[#0F0F1A] ring-2 ring-[#0F0F1A]/10" : "border-[#E4E5EF] hover:border-[#9090A8]"
          )}
        >
          <p className="text-2xl font-black text-[#0F0F1A] font-syne leading-none">{grandTotal}</p>
          <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider mt-1">Closed Bookings</p>
        </button>
        <button
          type="button"
          onClick={() => setAmountFilter(amountFilter === "due" ? "all" : "due")}
          className={cn(
            "text-left bg-white rounded-2xl border p-4 transition-all",
            amountFilter === "due" ? "border-[#E8540A] ring-2 ring-[#E8540A]/15" : "border-[#E4E5EF] hover:border-[#E8540A]/50"
          )}
        >
          <p className="text-2xl font-black text-[#E8540A] font-syne leading-none">₹{totals.due.toLocaleString("en-IN")}</p>
          <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider mt-1">Due — all bookings</p>
        </button>
        <button
          type="button"
          onClick={() => setAmountFilter(amountFilter === "refund" ? "all" : "refund")}
          className={cn(
            "text-left bg-white rounded-2xl border p-4 transition-all",
            amountFilter === "refund" ? "border-[#1E40AF] ring-2 ring-[#1E40AF]/15" : "border-[#E4E5EF] hover:border-[#1E40AF]/50"
          )}
        >
          <p className="text-2xl font-black text-[#1E40AF] font-syne leading-none">₹{totals.refund.toLocaleString("en-IN")}</p>
          <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider mt-1">Refund Pending — all bookings</p>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, car, booking ID..."
            className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
        <div className="w-40">
          <label className="block text-[10px] font-bold text-[#9090A8] uppercase tracking-wider mb-1.5">Closed From</label>
          <DatePicker value={dateFrom} onChange={(v) => setDateFrom(v || "")} placeholder="Any date" />
        </div>
        <div className="w-40">
          <label className="block text-[10px] font-bold text-[#9090A8] uppercase tracking-wider mb-1.5">Closed To</label>
          <DatePicker value={dateTo} onChange={(v) => setDateTo(v || "")} minDate={dateFrom || undefined} placeholder="Any date" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-[#9090A8]">
            <Loader2 size={20} className="animate-spin" /> Loading closing bills...
          </div>
        ) : displayRows.length === 0 ? (
          <div className="text-center py-16 text-[#9090A8]">
            <FileText size={32} className="mx-auto mb-3 text-[#E4E5EF]" />
            <p className="font-semibold">{amountFilter === "all" ? "No closing bills found" : "No matching closing bills"}</p>
            <p className="text-xs mt-1">
              {amountFilter === "all" ? "Bills appear here once a booking has been closed" : "Try a different tile, date range, or search"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                  {["Booking ID", "Customer", "Car", "Closed On", "Total Charges", "Advance Paid", "Settlement", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((r, i) => (
                  <tr key={r._id} className={cn("border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors", i % 2 === 1 ? "bg-[#F8F9FC]/50" : "")}>
                    <td className="px-4 py-3.5 font-mono text-xs text-[#4A4A6A] font-bold whitespace-nowrap">#{r.bookingId}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[#0F0F1A] text-sm">{r.userId?.name ?? "—"}</p>
                      <p className="text-[#9090A8] text-xs">{r.userId?.mobile ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#0F0F1A] text-sm">{r.carId?.name ?? "—"}</p>
                      <p className="text-[#9090A8] text-xs">{r.carId?.registrationNo ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#4A4A6A] whitespace-nowrap">{fmtDate(r.closingBill.closedAt)}</td>
                    <td className="px-4 py-3.5 font-bold text-[#0F0F1A] text-sm whitespace-nowrap">₹{(r.closingBill.totalCharges ?? 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3.5 text-[#4A4A6A] text-sm whitespace-nowrap">₹{(r.closingBill.advancePaid ?? 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <SettlementBadge amount={r.closingBill.settlementAmount ?? 0} refundPaid={r.closingBill.refundPaid} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/admin/bookings/${r._id}`} title="View Booking"
                        className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center">
                        <Eye size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination — always visible (20 per page) so the page size/count is never ambiguous */}
        {!loading && rows.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#E4E5EF]">
            <p className="text-[#9090A8] text-sm">
              Showing {displayRows.length} of {total} {amountFilter !== "all" ? `${amountFilter === "due" ? "due" : "refund-pending"} ` : ""}closing bill{total !== 1 ? "s" : ""} · Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => { const p = page - 1; setPage(p); load(p); }} disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <span className="w-9 h-9 rounded-xl bg-[#E8540A] text-white font-bold text-sm flex items-center justify-center">{page}</span>
              <button onClick={() => { const p = page + 1; setPage(p); load(p); }} disabled={page === totalPages}
                className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
