"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import {
  TrendingUp, Car, Users, FileCheck, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Activity, MapPin,
  CheckCircle, RefreshCw, Plus, Eye, MessageSquare,
  Navigation
} from "lucide-react";
import Link from "next/link";
import { adminDashboardAPI } from "@/lib/api";

// ─── Data ─────────────────────────────────────────────────────────────────────

type RecentBooking = { id: string; bookingId: string; customer: string; car: string; city: string; amount: number; status: string; createdAt: string; };
type ExpiryAlert = { carId: string; car: string; plate: string; doc: string; expiry: string; daysLeft: number; level: string; unit?: "days" | "km"; };
type DayRevenue = { day: string; date: string; revenue: number; bookings: number };

type DashboardStats = {
  todayRevenue: number;
  revenueTrendPct: number;
  activeBookings: number;
  newUsersToday: number;
  newUsersTrend: number;
  pendingKyc: number;
  totalCars: number;
  activeCars: number;
  inactiveCars: number;
  fleetUtilization: number;
  totalBookings: number;
  completedBookings: number;
  last7Days: DayRevenue[];
  last7DaysRevenue: number;
  last7DaysBookings: number;
  last7DaysTrendPct: number;
  citiesActive: number;
  kycApprovedToday: number;
  newContactsToday: number;
  pendingRefunds: number;
  recentBookings: RecentBooking[];
  expiryAlerts: ExpiryAlert[];
};

const emptyStats: DashboardStats = {
  todayRevenue: 0, revenueTrendPct: 0, activeBookings: 0, newUsersToday: 0, newUsersTrend: 0,
  pendingKyc: 0, totalCars: 0, activeCars: 0, inactiveCars: 0, fleetUtilization: 0,
  totalBookings: 0, completedBookings: 0, last7Days: [], last7DaysRevenue: 0, last7DaysBookings: 0,
  last7DaysTrendPct: 0, citiesActive: 0, kycApprovedToday: 0, newContactsToday: 0, pendingRefunds: 0,
  recentBookings: [], expiryAlerts: [],
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const quickActions = [
  { label: "Add Booking", icon: Plus, href: "/admin/bookings/offline", color: "#E8540A", bg: "#FFF3ED" },
  { label: "Add Car", icon: Car, href: "/admin/cars/add", color: "#3B82F6", bg: "#DBEAFE" },
  { label: "KYC Review", icon: FileCheck, href: "/admin/documents", color: "#8B5CF6", bg: "#EDE9FE" },
  { label: "GPS Track", icon: Navigation, href: "/admin/gps", color: "#10B981", bg: "#D1FAE5" },
  { label: "Refunds", icon: RefreshCw, href: "/admin/refunds", color: "#F59E0B", bg: "#FEF3C7" },
  { label: "Reports", icon: TrendingUp, href: "/admin/reports", color: "#EC4899", bg: "#FCE7F3" },
];

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  active: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  completed: { bg: "#F1F2F7", text: "#4A4A6A", dot: "#9090A8" },
  pending: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

const levelConfig: Record<string, { bar: string; text: string; badge: string; badgeText: string }> = {
  critical: { bar: "#EF4444", text: "#EF4444", badge: "#FEE2E2", badgeText: "#991B1B" },
  warning: { bar: "#F59E0B", text: "#F59E0B", badge: "#FEF3C7", badgeText: "#92400E" },
  ok: { bar: "#10B981", text: "#10B981", badge: "#D1FAE5", badgeText: "#065F46" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" } }),
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);

  useEffect(() => {
    adminDashboardAPI.getStats().then(({ data }) => {
      if (data.data) setStats({ ...emptyStats, ...data.data });
    }).catch(() => {});
  }, []);

  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long" });

  const statCards = [
    {
      label: "Today's Revenue", value: `₹${stats.todayRevenue.toLocaleString("en-IN")}`, sub: todayLabel,
      icon: TrendingUp, color: "#10B981", bg: "#D1FAE5", trend: stats.revenueTrendPct, href: "/admin/reports",
    },
    {
      label: "Active Bookings", value: String(stats.activeBookings), sub: "Currently in progress",
      icon: Activity, color: "#3B82F6", bg: "#DBEAFE", trend: null, href: "/admin/bookings",
    },
    {
      label: "New Users Today", value: String(stats.newUsersToday), sub: `${stats.pendingKyc} KYC pending`,
      icon: Users, color: "#F59E0B", bg: "#FEF3C7", trend: stats.newUsersTrend, href: "/admin/users",
    },
    {
      label: "Pending KYC", value: String(stats.pendingKyc), sub: "Needs review",
      icon: FileCheck, color: "#8B5CF6", bg: "#EDE9FE", trend: null, href: "/admin/documents",
    },
    {
      label: "Fleet Online", value: `${stats.fleetUtilization}%`, sub: `${stats.activeCars}/${stats.totalCars} cars active`,
      icon: Car, color: "#E8540A", bg: "#FFF3ED", trend: null, href: "/admin/gps",
    },
  ];

  const fleetData = [
    { name: "Active", value: stats.activeCars, color: "#10B981" },
    { name: "Inactive", value: stats.inactiveCars, color: "#9090A8" },
  ];

  const liveMetrics = [
    { icon: MapPin, label: "Cities Active", value: String(stats.citiesActive), color: "#E8540A" },
    { icon: CheckCircle, label: "KYC Approved Today", value: String(stats.kycApprovedToday), color: "#10B981" },
    { icon: MessageSquare, label: "New Contact Requests", value: String(stats.newContactsToday), color: "#3B82F6" },
    { icon: RefreshCw, label: "Pending Refunds", value: String(stats.pendingRefunds), color: "#F59E0B" },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Dashboard</h1>
          <p className="text-[#9090A8] text-sm mt-0.5">
            Welcome back, <span className="text-[#E8540A] font-semibold">Admin</span> — here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/bookings/offline"
            className="flex items-center gap-1.5 btn-gradient px-4 py-2.5 rounded-xl text-white font-semibold text-sm shadow-[0_4px_16px_rgba(232,84,10,0.3)]"
          >
            <Plus size={15} />
            New Booking
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          const up = (stat.trend ?? 0) >= 0;
          return (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
            >
              <Link
                href={stat.href}
                className="block bg-white rounded-2xl border border-[#E4E5EF] p-5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: stat.bg }}
                  >
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                  {stat.trend !== null && (
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${up ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {up ? "+" : ""}{stat.trend}{stat.label === "Today's Revenue" ? "%" : ""}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-[#0F0F1A] font-syne group-hover:text-[#E8540A] transition-colors">
                  {stat.value}
                </p>
                <p className="text-[#9090A8] text-xs mt-1 truncate">{stat.sub}</p>
                <p className="text-[#4A4A6A] text-[10px] font-semibold uppercase tracking-wider mt-2">{stat.label}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45 }}
        className="bg-white rounded-2xl border border-[#E4E5EF] p-5"
      >
        <p className="text-xs font-bold text-[#9090A8] uppercase tracking-widest mb-4">Quick Actions</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map(({ label, icon: Icon, href, color, bg }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#E4E5EF] hover:border-[#E8540A]/30 hover:shadow-md transition-all group text-center"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-[#4A4A6A] text-[11px] font-semibold group-hover:text-[#E8540A] transition-colors leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-[#E4E5EF] p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#0F0F1A] font-syne">Revenue — Last 7 Days</h3>
              <p className="text-[#9090A8] text-sm mt-0.5">Total: <span className="font-semibold text-[#0F0F1A]">₹{stats.last7DaysRevenue.toLocaleString("en-IN")}</span></p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${stats.last7DaysTrendPct >= 0 ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]"}`}>
              {stats.last7DaysTrendPct >= 0 ? "+" : ""}{stats.last7DaysTrendPct}% vs last week
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.last7Days} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8540A" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#E8540A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F7" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9090A8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9090A8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} width={36} />
              <Tooltip
                contentStyle={{ background: "#0F0F1A", border: "none", borderRadius: "12px", color: "#fff", fontSize: 12, padding: "10px 14px" }}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                cursor={{ stroke: "#E8540A", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#E8540A" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#E8540A", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Fleet Status Donut */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, duration: 0.45 }}
          className="bg-white rounded-2xl border border-[#E4E5EF] p-6"
        >
          <h3 className="font-bold text-[#0F0F1A] font-syne mb-1">Fleet Status</h3>
          <p className="text-[#9090A8] text-sm mb-5">{stats.totalCars} total cars</p>
          <div className="flex justify-center mb-4">
            <PieChart width={160} height={160}>
              <Pie
                data={fleetData}
                cx={80}
                cy={80}
                innerRadius={52}
                outerRadius={74}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {fleetData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2.5">
            {fleetData.map(item => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[#4A4A6A] text-sm flex-1">{item.name}</span>
                <span className="font-bold text-[#0F0F1A] text-sm">{item.value}</span>
                <span className="text-[#9090A8] text-xs">{stats.totalCars > 0 ? Math.round(item.value / stats.totalCars * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Bookings Chart ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45 }}
        className="bg-white rounded-2xl border border-[#E4E5EF] p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-[#0F0F1A] font-syne">Bookings — Last 7 Days</h3>
            <p className="text-[#9090A8] text-sm mt-0.5">Total: <span className="font-semibold text-[#0F0F1A]">{stats.last7DaysBookings} bookings</span></p>
          </div>
          <Link href="/admin/bookings" className="text-[#E8540A] text-sm font-semibold hover:underline">
            View All →
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.last7Days} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F7" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9090A8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9090A8" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#0F0F1A", border: "none", borderRadius: "12px", color: "#fff", fontSize: 12, padding: "10px 14px" }}
              cursor={{ fill: "#F8F9FC" }}
            />
            <Bar dataKey="bookings" fill="#E8540A" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Bottom Row ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Bookings — wider */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.45 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E5EF]">
            <h3 className="font-bold text-[#0F0F1A] font-syne">Recent Bookings</h3>
            <Link href="/admin/bookings" className="text-[#E8540A] text-xs font-semibold hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-[#F1F2F7]">
            {stats.recentBookings.map((b) => {
              const s = statusConfig[b.status];
              return (
                <div key={b.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#FAFAFA] transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF3ED] flex items-center justify-center shrink-0">
                    <Car size={14} className="text-[#E8540A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0F0F1A] text-sm truncate">{b.customer}</p>
                    <p className="text-[#9090A8] text-xs truncate">{b.car} · {b.city}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#0F0F1A] text-sm">₹{b.amount.toLocaleString("en-IN")}</p>
                    <p className="text-[#9090A8] text-[10px]">{timeAgo(b.createdAt)}</p>
                  </div>
                  <div className="shrink-0">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
                      style={{ backgroundColor: s.bg, color: s.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                      {b.status}
                    </span>
                  </div>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="w-7 h-7 rounded-lg bg-[#F8F9FC] border border-[#E4E5EF] flex items-center justify-center text-[#9090A8] hover:border-[#E8540A] hover:text-[#E8540A] transition-all shrink-0"
                  >
                    <Eye size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Expiry Alerts — narrower */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.45 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden"
        >
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#E4E5EF]">
            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] flex items-center justify-center shrink-0">
              <AlertTriangle size={14} className="text-[#F59E0B]" />
            </div>
            <h3 className="font-bold text-[#0F0F1A] font-syne text-sm">Expiry Alerts</h3>
          </div>
          <div className="divide-y divide-[#F1F2F7]">
            {stats.expiryAlerts.map((alert) => {
              const lc = levelConfig[alert.level];
              return (
                <div key={alert.car + alert.doc} className="px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0F0F1A] text-sm truncate">{alert.car}</p>
                      <p className="text-[#9090A8] text-[10px]">{alert.plate}</p>
                    </div>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                      style={{ backgroundColor: lc.badge, color: lc.badgeText }}
                    >
                      {alert.unit === "km" ? `${alert.daysLeft.toLocaleString("en-IN")} km` : `${alert.daysLeft}d`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#F1F2F7] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((alert.unit === "km" ? 1000 : 60) - alert.daysLeft) / (alert.unit === "km" ? 1000 : 60) * 100)}%`,
                          backgroundColor: lc.bar,
                        }}
                      />
                    </div>
                    <span className="text-[#9090A8] text-[10px] shrink-0">{alert.doc}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-[#E4E5EF]">
            <Link
              href="/admin/cars"
              className="text-[#E8540A] text-xs font-semibold hover:underline flex items-center gap-1"
            >
              Manage Documents <ArrowUpRight size={12} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── Live Metrics Strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.45 }}
        className="bg-gradient-to-r from-[#0F0F1A] to-[#1C1C2E] rounded-2xl p-5"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {liveMetrics.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-white font-black text-xl font-syne">{value}</p>
                <p className="text-white/40 text-[11px] leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
