"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, Calendar, BarChart2, XCircle, Loader2, Wallet, IndianRupee, Check, Eye, Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import toast from "react-hot-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { adminReportsApi, bookingsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface RevenuePoint { _id: string; totalRevenue: number; collectedRevenue: number; bookingCount: number; avgBookingValue: number }
interface CityRow { cityName: string; totalRevenue: number; bookingCount: number }

interface CarRevenueRow {
  month: string;
  carId: string;
  carName: string;
  registrationNo: string;
  totalRevenue: number;
  collectedRevenue: number;
  bookingCount: number;
}
interface SettlementRow {
  bookingId: string;
  bookingCode: string;
  customer: string;
  mobile: string;
  car: string;
  regNo: string;
  status: string;
  closed: boolean;
  amount: number;
  bookedBy: string;
}
interface StatusCounts { pending: number; confirmed: number; active: number; completed: number; cancelled: number }
interface SettlementsData {
  statusCounts: StatusCounts;
  closedCount: number;
  pendingCollection: SettlementRow[];
  pendingRefunds: SettlementRow[];
  totalPendingCollection: number;
  totalPendingRefunds: number;
}
interface RevenueData {
  summary: { totalRevenue: number; collectedRevenue: number; bookingCount: number; avgBookingValue: number };
  revenueData: RevenuePoint[];
  cityBreakdown: CityRow[];
}

const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "short" });
};

const defaultFrom = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 5);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

const PAGE_SIZE = 10;

// Client-side CSV export — exports exactly what's currently filtered/visible
// on screen (same rows the admin is looking at), no extra server round-trip.
const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map(row => row.map(escape).join(",")).join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const settlementRowsToCsv = (rows: SettlementRow[]) =>
  rows.map(r => [r.bookingCode, r.customer, r.mobile, r.car, r.regNo, r.closed ? "Closed" : r.status, r.amount, r.bookedBy]);
const SETTLEMENT_CSV_HEADERS = ["Booking ID", "Customer", "Mobile", "Car", "Reg. No.", "Status", "Amount (Rs.)", "Booked By"];

function AdminReportsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Tab lives in the URL (?tab=settlements) so a reload — or sharing the link —
  // lands back on the same tab instead of always resetting to Overview.
  const tab = (searchParams.get("tab") === "settlements" ? "settlements" : searchParams.get("tab") === "carRevenue" ? "carRevenue" : "overview") as "overview" | "settlements" | "carRevenue";
  const setTab = (t: "overview" | "settlements" | "carRevenue") => {
    const params = new URLSearchParams(searchParams.toString());
    if (t === "overview") params.delete("tab"); else params.set("tab", t);
    router.replace(`/admin/reports${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const [dateFrom, setDateFrom] = useState(defaultFrom());
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [carRevenue, setCarRevenue] = useState<CarRevenueRow[] | null>(null);
  const [cancellationRate, setCancellationRate] = useState(0);

  const [settlements, setSettlements] = useState<SettlementsData | null>(null);
  const [settlementsLoading, setSettlementsLoading] = useState(true);
  const [markingRefundId, setMarkingRefundId] = useState<string | null>(null);
  const [settlementStatusFilter, setSettlementStatusFilter] = useState<"all" | "pending" | "confirmed" | "active" | "completed" | "cancelled" | "closed">("all");
  const [settlementSearch, setSettlementSearch] = useState("");
  const [collectionPage, setCollectionPage] = useState(1);
  const [refundsPage, setRefundsPage] = useState(1);
  const collectionSectionRef = useRef<HTMLDivElement>(null);
  const refundsSectionRef = useRef<HTMLDivElement>(null);
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => { setCollectionPage(1); }, [settlementStatusFilter, settlementSearch]);
  useEffect(() => { setRefundsPage(1); }, [settlementStatusFilter, settlementSearch]);

  const fetchReports = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminReportsApi.getRevenue({ from: dateFrom, to: dateTo, groupBy: "month" }),
      adminReportsApi.getBookingStats({ from: dateFrom, to: dateTo }),
      adminReportsApi.getCarRevenue({ from: dateFrom, to: dateTo }),
    ])
      .then(([revRes, bookingRes, carRevRes]) => {
        setRevenue(revRes.data.data);
        setCancellationRate(bookingRes.data.data.cancellationRate || 0);
        setCarRevenue(carRevRes.data.data || []);
      })
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  const fetchSettlements = useCallback(() => {
    setSettlementsLoading(true);
    adminReportsApi.getSettlements({ from: dateFrom, to: dateTo })
      .then(({ data }) => setSettlements(data.data))
      .catch(() => toast.error("Failed to load settlements"))
      .finally(() => setSettlementsLoading(false));
  }, [dateFrom, dateTo]);

  const fetchAll = useCallback(() => {
    fetchReports();
    fetchSettlements();
  }, [fetchReports, fetchSettlements]);

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markRefundPaid = async (row: SettlementRow) => {
    if (!confirm(`Mark the ₹${row.amount.toLocaleString("en-IN")} refund for ${row.customer} (#${row.bookingCode}) as paid?`)) return;
    setMarkingRefundId(row.bookingId);
    try {
      await bookingsApi.markRefundPaid(row.bookingId);
      toast.success("Refund marked as paid");
      fetchSettlements();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update refund status");
    } finally {
      setMarkingRefundId(null);
    }
  };

  const chartData = (revenue?.revenueData || []).map((p) => ({
    month: monthLabel(p._id),
    revenue: p.totalRevenue,
    bookings: p.bookingCount,
  }));

  const totalRevenue = revenue?.summary.totalRevenue || 0;
  const cityRows = (revenue?.cityBreakdown || []).map((c) => ({
    city: c.cityName || "Unknown",
    bookings: c.bookingCount,
    revenue: c.totalRevenue,
    percentage: totalRevenue > 0 ? Math.round((c.totalRevenue / totalRevenue) * 100) : 0,
  }));

  const matchesSettlementFilters = (r: SettlementRow) => {
    if (settlementStatusFilter !== "all") {
      const matchesStatus = settlementStatusFilter === "closed" ? r.closed : (!r.closed && r.status === settlementStatusFilter);
      if (!matchesStatus) return false;
    }
    if (settlementSearch.trim()) {
      const q = settlementSearch.trim().toLowerCase();
      const haystack = `${r.bookingCode} ${r.customer} ${r.mobile} ${r.car} ${r.regNo}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  };
  const filteredCollection = (settlements?.pendingCollection || []).filter(matchesSettlementFilters);
  const filteredRefunds = (settlements?.pendingRefunds || []).filter(matchesSettlementFilters);
  const collectionPages = Math.max(1, Math.ceil(filteredCollection.length / PAGE_SIZE));
  const refundsPages = Math.max(1, Math.ceil(filteredRefunds.length / PAGE_SIZE));
  const pagedCollection = filteredCollection.slice((collectionPage - 1) * PAGE_SIZE, collectionPage * PAGE_SIZE);
  const pagedRefunds = filteredRefunds.slice((refundsPage - 1) * PAGE_SIZE, refundsPage * PAGE_SIZE);

  const summaryCards = [
    { label: "Total Revenue", value: `Rs. ${totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "#E8540A", bg: "#FFF3ED" },
    { label: "Total Bookings", value: String(revenue?.summary.bookingCount || 0), icon: Calendar, color: "#3B82F6", bg: "#DBEAFE" },
    { label: "Avg Booking Value", value: `Rs. ${Math.round(revenue?.summary.avgBookingValue || 0).toLocaleString("en-IN")}`, icon: BarChart2, color: "#8B5CF6", bg: "#EDE9FE" },
    { label: "Cancellation Rate", value: `${cancellationRate}%`, icon: XCircle, color: "#10B981", bg: "#D1FAE5" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black font-syne text-2xl text-[#0F0F1A]">Reports & Analytics</h1>
          <p className="text-[#9090A8] text-sm mt-0.5">Track revenue, bookings, and performance metrics</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="w-40">
            <label className="block text-[10px] font-bold text-[#9090A8] uppercase tracking-wider mb-1.5">From</label>
            <DatePicker value={dateFrom} onChange={(v) => setDateFrom(v || "")} placeholder="Start date" />
          </div>
          <div className="w-40">
            <label className="block text-[10px] font-bold text-[#9090A8] uppercase tracking-wider mb-1.5">To</label>
            <DatePicker value={dateTo} onChange={(v) => setDateTo(v || "")} minDate={dateFrom || undefined} placeholder="End date" />
          </div>
          <button onClick={fetchAll} disabled={loading || settlementsLoading} className="btn-gradient px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2">
            {(loading || settlementsLoading) && <Loader2 size={14} className="animate-spin" />} Apply
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-[#E4E5EF] p-1.5 rounded-2xl w-fit">
        {([
          { key: "overview", label: "Overview" },
          { key: "carRevenue", label: "Car Revenue" },
          { key: "settlements", label: "Settlements" },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? "bg-[#E8540A] text-white" : "text-[#4A4A6A] hover:bg-[#F8F9FC]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white rounded-2xl border border-[#E4E5EF] p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                      <Icon size={18} style={{ color: card.color }} />
                    </div>
                  </div>
                  <p className="font-black font-syne text-2xl text-[#0F0F1A] leading-none mb-1">{card.value}</p>
                  <p className="text-[#9090A8] text-xs font-semibold uppercase tracking-wider">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
            <h3 className="font-bold font-syne text-[#0F0F1A] text-lg mb-5">Monthly Revenue</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8540A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#E8540A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E5EF" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9090A8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9090A8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #E4E5EF", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                    formatter={(v: number) => [`Rs. ${v.toLocaleString("en-IN")}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#E8540A" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: "#E8540A", r: 4 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bookings Chart */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
            <h3 className="font-bold font-syne text-[#0F0F1A] text-lg mb-5">Monthly Bookings</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E5EF" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9090A8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9090A8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #E4E5EF", fontSize: 12 }}
                    formatter={(v: number) => [v, "Bookings"]}
                  />
                  <Bar dataKey="bookings" fill="#E8540A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* City Breakdown */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
            <h3 className="font-bold font-syne text-[#0F0F1A] text-lg mb-5">City-wise Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E4E5EF]">
                    {["City", "Total Bookings", "Revenue", "Share", "Progress"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[#9090A8] text-xs font-bold uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cityRows.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-[#9090A8] text-sm">No bookings in this date range</td></tr>
                  ) : cityRows.map((row) => (
                    <tr key={row.city} className="border-b border-[#E4E5EF] last:border-0 hover:bg-[#F8F9FC] transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-[#0F0F1A] text-sm">{row.city}</td>
                      <td className="px-4 py-3.5 text-[#4A4A6A] text-sm">{row.bookings}</td>
                      <td className="px-4 py-3.5 font-bold text-[#0F0F1A] text-sm">Rs. {row.revenue.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3.5">
                        <span className="bg-[#FFF3ED] text-[#E8540A] text-xs font-bold px-2 py-1 rounded-full">
                          {row.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 w-48">
                        <div className="w-full h-2 bg-[#E4E5EF] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#E8540A] rounded-full transition-all"
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "carRevenue" && (
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h2 className="font-bold text-[#0F0F1A] text-lg">Monthly Car Revenue</h2>
              <p className="text-[#9090A8] text-sm">Revenue and booking counts for each car by month.</p>
            </div>
            <button onClick={() => carRevenue && downloadCsv("car-revenue.csv", ["Month", "Car", "Reg. No.", "Revenue", "Collected", "Bookings"], carRevenue.map(r => [r.month, r.carName, r.registrationNo, r.totalRevenue, r.collectedRevenue, r.bookingCount]))}
              className="btn-gradient px-4 py-2.5 rounded-xl text-white font-semibold text-sm">
              <Download size={14} /> Export CSV
            </button>
          </div>
          {loading ? (
            <div className="py-16 text-center text-[#9090A8] flex items-center justify-center gap-3">
              <Loader2 size={18} className="animate-spin" /> Loading car revenue...
            </div>
          ) : !carRevenue || carRevenue.length === 0 ? (
            <div className="py-16 text-center text-[#9090A8]">
              <p className="font-semibold">No car revenue data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                    {['Month', 'Car', 'Reg. No.', 'Revenue', 'Collected', 'Bookings'].map((label) => (
                      <th key={label} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#9090A8]">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {carRevenue.map((row) => (
                    <tr key={`${row.carId}-${row.month}`} className="border-b border-[#E4E5EF] hover:bg-[#F8F9FC] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#0F0F1A]">{monthLabel(row.month)}</td>
                      <td className="px-4 py-3 text-sm text-[#0F0F1A]">{row.carName}</td>
                      <td className="px-4 py-3 text-sm text-[#4A4A6A]">{row.registrationNo}</td>
                      <td className="px-4 py-3 text-sm font-semibold">₹{row.totalRevenue.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm">₹{row.collectedRevenue.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm">{row.bookingCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "settlements" && (
        <div className="space-y-5">
          <p className="text-[#9090A8] text-xs -mt-2">
            Covers every booking in this date range — running/active bookings included (via their live balance due), plus closed bookings using the final settlement bill amount. Refunds only apply once a booking is closed (that&apos;s when the security deposit is reconciled).
          </p>

          {/* Status counts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {([
              { key: "pending", label: "Pending", color: "#F59E0B", bg: "#FEF3C7", count: settlements?.statusCounts.pending ?? 0 },
              { key: "confirmed", label: "Confirmed", color: "#10B981", bg: "#D1FAE5", count: settlements?.statusCounts.confirmed ?? 0 },
              { key: "active", label: "Active", color: "#3B82F6", bg: "#DBEAFE", count: settlements?.statusCounts.active ?? 0 },
              { key: "completed", label: "Completed", color: "#9090A8", bg: "#F1F2F7", count: settlements?.statusCounts.completed ?? 0 },
              { key: "cancelled", label: "Cancelled", color: "#EF4444", bg: "#FEE2E2", count: settlements?.statusCounts.cancelled ?? 0 },
              { key: "closed", label: "Closed (Bill Generated)", color: "#7C3AED", bg: "#EDE9FE", count: settlements?.closedCount ?? 0 },
            ] as const).map(({ key, label, color, bg, count }) => {
              const active = settlementStatusFilter === key;
              return (
                <button key={key} onClick={() => setSettlementStatusFilter(active ? "all" : key)}
                  className={cn("text-left bg-white rounded-2xl border p-4 transition-colors", active ? "border-[#0F0F1A] ring-1 ring-[#0F0F1A]" : "border-[#E4E5EF] hover:border-[#0F0F1A]/30")}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bg, boxShadow: `inset 0 0 0 1.5px ${color}` }} />
                    <p className="text-xl font-black font-syne leading-none" style={{ color }}>{count}</p>
                  </div>
                  <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider">{label}</p>
                </button>
              );
            })}
          </div>

          {/* Search — filters both tables below by booking ID, customer, or car */}
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
            <input value={settlementSearch} onChange={(e) => setSettlementSearch(e.target.value)} placeholder="Search customer, car, booking ID..."
              className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none bg-white" />
          </div>

          {/* Money tiles — click to jump straight to that table below */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => scrollToSection(collectionSectionRef)}
              className="text-left bg-white rounded-2xl border border-[#E4E5EF] p-5 shadow-sm hover:border-[#E8540A]/50 hover:shadow-md transition-all"
              title="Jump to Pending Collection table"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF3ED" }}>
                  <IndianRupee size={18} style={{ color: "#E8540A" }} />
                </div>
              </div>
              <p className="font-black font-syne text-2xl text-[#0F0F1A] leading-none mb-1">Rs. {(settlements?.totalPendingCollection || 0).toLocaleString("en-IN")}</p>
              <p className="text-[#9090A8] text-xs font-semibold uppercase tracking-wider">Pending Collection — {settlements?.pendingCollection.length || 0} booking{settlements?.pendingCollection.length !== 1 ? "s" : ""}</p>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection(refundsSectionRef)}
              className="text-left bg-white rounded-2xl border border-[#E4E5EF] p-5 shadow-sm hover:border-[#1E40AF]/50 hover:shadow-md transition-all"
              title="Jump to Pending Refunds table"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#DBEAFE" }}>
                  <Wallet size={18} style={{ color: "#1E40AF" }} />
                </div>
              </div>
              <p className="font-black font-syne text-2xl text-[#0F0F1A] leading-none mb-1">Rs. {(settlements?.totalPendingRefunds || 0).toLocaleString("en-IN")}</p>
              <p className="text-[#9090A8] text-xs font-semibold uppercase tracking-wider">Pending Refunds — {settlements?.pendingRefunds.length || 0} booking{settlements?.pendingRefunds.length !== 1 ? "s" : ""}</p>
            </button>
          </div>

          {settlementsLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-[#9090A8] bg-white rounded-2xl border border-[#E4E5EF]">
              <Loader2 size={20} className="animate-spin" /> Loading settlements...
            </div>
          ) : (
            <>
              {/* Pending Collection — money due FROM customers, running + closed */}
              <div ref={collectionSectionRef} className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden scroll-mt-4">
                <div className="px-5 py-4 border-b border-[#E4E5EF] flex items-center justify-between gap-3">
                  <h3 className="font-bold font-syne text-[#0F0F1A] text-sm">Pending Collection — money we need to collect</h3>
                  <div className="flex items-center gap-2">
                    {(settlementStatusFilter !== "all" || settlementSearch.trim()) && (
                      <span className="text-[10px] font-semibold text-[#9090A8] whitespace-nowrap">{filteredCollection.length} of {settlements?.pendingCollection.length || 0} shown</span>
                    )}
                    {filteredCollection.length > 0 && (
                      <button
                        onClick={() => downloadCsv(`pending-collection-${Date.now()}.csv`, SETTLEMENT_CSV_HEADERS, settlementRowsToCsv(filteredCollection))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-[11px] font-semibold text-[#4A4A6A] hover:border-[#E8540A] hover:text-[#E8540A] transition-colors whitespace-nowrap"
                        title="Download as CSV"
                      >
                        <Download size={12} /> Export CSV
                      </button>
                    )}
                  </div>
                </div>
                {filteredCollection.length === 0 ? (
                  <p className="text-center py-10 text-[#9090A8] text-sm">
                    {(settlements?.pendingCollection.length || 0) === 0 ? "Nothing pending — every booking is fully paid." : "No matches for this filter/search."}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                          {["#", "Booking", "Customer", "Car", "Status", "Amount Due", ""].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8] whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedCollection.map((r, i) => (
                          <tr key={r.bookingId} className="border-b border-[#E4E5EF] last:border-0 hover:bg-[#FFF3ED] transition-colors">
                            <td className="px-4 py-3 text-xs text-[#9090A8] whitespace-nowrap">{(collectionPage - 1) * PAGE_SIZE + i + 1}</td>
                            <td className="px-4 py-3 font-mono text-xs font-bold text-[#4A4A6A] whitespace-nowrap">#{r.bookingCode}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#0F0F1A] text-sm">{r.customer}</p>
                              <p className="text-[#9090A8] text-xs">{r.mobile}</p>
                            </td>
                            <td className="px-4 py-3 text-[#4A4A6A] text-sm whitespace-nowrap">{r.car} <span className="text-[#9090A8] text-xs">({r.regNo})</span></td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", r.closed ? "bg-[#EDE9FE] text-[#7C3AED]" : "bg-[#D1FAE5] text-[#065F46]")}>
                                {r.closed ? "Closed" : r.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-[#E8540A] text-sm whitespace-nowrap">Rs. {r.amount.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3">
                              <Link href={`/admin/bookings/${r.bookingId}`} title="View Booking"
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
                {collectionPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[#E4E5EF]">
                    <p className="text-[#9090A8] text-xs">Page {collectionPage} of {collectionPages}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setCollectionPage(p => Math.max(1, p - 1))} disabled={collectionPage === 1}
                        className="w-8 h-8 rounded-lg border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40">
                        <ChevronLeft size={14} />
                      </button>
                      <button onClick={() => setCollectionPage(p => Math.min(collectionPages, p + 1))} disabled={collectionPage === collectionPages}
                        className="w-8 h-8 rounded-lg border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Refunds — money due TO customers (post-closing only) */}
              <div ref={refundsSectionRef} className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden scroll-mt-4">
                <div className="px-5 py-4 border-b border-[#E4E5EF] flex items-center justify-between gap-3">
                  <h3 className="font-bold font-syne text-[#0F0F1A] text-sm">Pending Refunds — money we owe customers</h3>
                  <div className="flex items-center gap-2">
                    {(settlementStatusFilter !== "all" || settlementSearch.trim()) && (
                      <span className="text-[10px] font-semibold text-[#9090A8] whitespace-nowrap">{filteredRefunds.length} of {settlements?.pendingRefunds.length || 0} shown</span>
                    )}
                    {filteredRefunds.length > 0 && (
                      <button
                        onClick={() => downloadCsv(`pending-refunds-${Date.now()}.csv`, SETTLEMENT_CSV_HEADERS, settlementRowsToCsv(filteredRefunds))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-[11px] font-semibold text-[#4A4A6A] hover:border-[#E8540A] hover:text-[#E8540A] transition-colors whitespace-nowrap"
                        title="Download as CSV"
                      >
                        <Download size={12} /> Export CSV
                      </button>
                    )}
                  </div>
                </div>
                {filteredRefunds.length === 0 ? (
                  <p className="text-center py-10 text-[#9090A8] text-sm">
                    {(settlements?.pendingRefunds.length || 0) === 0 ? "No refunds pending." : "No matches for this filter/search."}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                          {["#", "Booking", "Customer", "Car", "Refund Due", "Actions"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8] whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRefunds.map((r, i) => (
                          <tr key={r.bookingId} className="border-b border-[#E4E5EF] last:border-0 hover:bg-[#FFF3ED] transition-colors">
                            <td className="px-4 py-3 text-xs text-[#9090A8] whitespace-nowrap">{(refundsPage - 1) * PAGE_SIZE + i + 1}</td>
                            <td className="px-4 py-3 font-mono text-xs font-bold text-[#4A4A6A] whitespace-nowrap">#{r.bookingCode}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#0F0F1A] text-sm">{r.customer}</p>
                              <p className="text-[#9090A8] text-xs">{r.mobile}</p>
                            </td>
                            <td className="px-4 py-3 text-[#4A4A6A] text-sm whitespace-nowrap">{r.car} <span className="text-[#9090A8] text-xs">({r.regNo})</span></td>
                            <td className="px-4 py-3 font-bold text-[#1E40AF] text-sm whitespace-nowrap">Rs. {r.amount.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                <Link href={`/admin/bookings/${r.bookingId}`} title="View Booking"
                                  className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center">
                                  <Eye size={13} />
                                </Link>
                                <button onClick={() => markRefundPaid(r)} disabled={markingRefundId === r.bookingId} title="Mark Refund Paid"
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#D1FAE5] text-[#065F46] text-[11px] font-bold hover:bg-[#10B981] hover:text-white transition-colors whitespace-nowrap disabled:opacity-50">
                                  {markingRefundId === r.bookingId ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Paid
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {refundsPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[#E4E5EF]">
                    <p className="text-[#9090A8] text-xs">Page {refundsPage} of {refundsPages}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setRefundsPage(p => Math.max(1, p - 1))} disabled={refundsPage === 1}
                        className="w-8 h-8 rounded-lg border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40">
                        <ChevronLeft size={14} />
                      </button>
                      <button onClick={() => setRefundsPage(p => Math.min(refundsPages, p + 1))} disabled={refundsPage === refundsPages}
                        className="w-8 h-8 rounded-lg border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[#9090A8] text-sm">Loading reports...</div>}>
      <AdminReportsPageInner />
    </Suspense>
  );
}
