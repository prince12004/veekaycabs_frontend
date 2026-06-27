"use client";

import { useState } from "react";
import { TrendingUp, Calendar, BarChart2, XCircle, ArrowUpRight } from "lucide-react";
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

const MONTHLY_REVENUE = [
  { month: "Jan", revenue: 42000, bookings: 14 },
  { month: "Feb", revenue: 58000, bookings: 19 },
  { month: "Mar", revenue: 76000, bookings: 25 },
  { month: "Apr", revenue: 91000, bookings: 30 },
  { month: "May", revenue: 110000, bookings: 37 },
  { month: "Jun", revenue: 134000, bookings: 44 },
];

const CITY_BREAKDOWN = [
  { city: "Delhi", bookings: 89, revenue: 267000, percentage: 52 },
  { city: "Noida", bookings: 45, revenue: 135000, percentage: 26 },
  { city: "Gurgaon", bookings: 28, revenue: 84000, percentage: 16 },
  { city: "Ghaziabad", bookings: 8, revenue: 24000, percentage: 5 },
  { city: "Greater Noida", bookings: 3, revenue: 9000, percentage: 2 },
];

const SUMMARY_CARDS = [
  { label: "Total Revenue", value: "Rs. 5,11,000", change: "+18%", positive: true, icon: TrendingUp, color: "#E8540A", bg: "#FFF3ED" },
  { label: "Total Bookings", value: "173", change: "+22%", positive: true, icon: Calendar, color: "#3B82F6", bg: "#DBEAFE" },
  { label: "Avg Booking Value", value: "Rs. 2,953", change: "+5%", positive: true, icon: BarChart2, color: "#8B5CF6", bg: "#EDE9FE" },
  { label: "Cancellation Rate", value: "4.6%", change: "-1.2%", positive: true, icon: XCircle, color: "#10B981", bg: "#D1FAE5" },
];

export default function AdminReportsPage() {
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-06-30");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black font-syne text-2xl text-[#0F0F1A]">Reports & Analytics</h1>
          <p className="text-[#9090A8] text-sm mt-0.5">Track revenue, bookings, and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-[#E4E5EF] rounded-xl px-3 py-2 text-sm">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm text-[#0F0F1A] outline-none"
            />
            <span className="text-[#9090A8]">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm text-[#0F0F1A] outline-none"
            />
          </div>
          <button className="btn-gradient px-4 py-2 rounded-xl text-white text-sm font-semibold">
            Apply
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-[#E4E5EF] p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                  <Icon size={18} style={{ color: card.color }} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5 ${card.positive ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]"}`}>
                  <ArrowUpRight size={11} />
                  {card.change}
                </span>
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
            <AreaChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
            <BarChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
              {CITY_BREAKDOWN.map((row) => (
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
    </div>
  );
}
