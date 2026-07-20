"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowDownCircle, ArrowUpCircle, Loader2, RefreshCw, Phone,
  Eye, Car, MapPin,
} from "lucide-react";
import { bookingsApi, adminCarsApi } from "@/lib/api";
import DatePicker from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ScheduleBooking {
  _id: string;
  bookingId: string;
  userId?: { name: string; mobile: string };
  carId?: { _id: string; name: string; registrationNo: string; type: string };
  cityId?: { name: string };
  startTime: string;
  endTime: string;
  status: string;
  pickupLocation: string;
  isOffline: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed:  { bg: "#D1FAE5", text: "#065F46" },
  active:     { bg: "#DBEAFE", text: "#1E40AF" },
  completed:  { bg: "#F1F2F7", text: "#4A4A6A" },
  pending:    { bg: "#FEF3C7", text: "#92400E" },
  cancelled:  { bg: "#FEE2E2", text: "#991B1B" },
};

const toISODate = (d: Date) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const todayStr = () => toISODate(new Date());
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return toISODate(d); };

const fmtDateLabel = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  const today = todayStr();
  const tomorrow = tomorrowStr();
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", weekday: "short" });
};

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

function ScheduleTable({ rows, kind, loading }: { rows: ScheduleBooking[]; kind: "departure" | "arrival"; loading: boolean }) {
  const timeField = kind === "departure" ? "startTime" : "endTime";
  return (
    <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E4E5EF] flex items-center gap-2.5">
        {kind === "departure"
          ? <ArrowUpCircle size={18} className="text-[#E8540A]" />
          : <ArrowDownCircle size={18} className="text-[#10B981]" />}
        <div>
          <h3 className="font-bold font-syne text-[#0F0F1A] text-sm">
            {kind === "departure" ? "Departures — Cars Going Out" : "Arrivals — Cars Coming Back"}
          </h3>
          <p className="text-[#9090A8] text-xs">{rows.length} booking{rows.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-[#9090A8] text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-[#9090A8] text-sm">
          No {kind === "departure" ? "departures" : "arrivals"} for this day
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                {["Time", "Customer", "Car", "City", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((b, i) => {
                const s = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
                return (
                  <tr key={b._id} className={cn("border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors", i % 2 === 1 ? "bg-[#F8F9FC]/50" : "")}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#0F0F1A] whitespace-nowrap">{fmtTime(b[timeField])}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#0F0F1A] text-sm">{b.userId?.name ?? "—"}</p>
                      <p className="text-[#9090A8] text-xs">{b.userId?.mobile ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#0F0F1A] text-sm">{b.carId?.name ?? "—"}</p>
                      <p className="text-[#9090A8] text-xs">{b.carId?.registrationNo ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-[#4A4A6A] text-xs">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {b.cityId?.name ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.text }}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Link href={`/admin/bookings/${b._id}`} title="View" className="w-7 h-7 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center">
                          <Eye size={12} />
                        </Link>
                        {b.userId?.mobile && !b.userId.mobile.startsWith("google_") && (
                          <a href={`tel:${b.userId.mobile}`} title="Call" className="w-7 h-7 rounded-lg bg-[#D1FAE5] text-[#065F46] hover:bg-[#10B981] hover:text-white transition-colors flex items-center justify-center">
                            <Phone size={12} />
                          </a>
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
    </div>
  );
}

export default function ArrivalsDeparturesPage() {
  const [date, setDate] = useState(todayStr());
  const [cityFilter, setCityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [departures, setDepartures] = useState<ScheduleBooking[]>([]);
  const [arrivals, setArrivals] = useState<ScheduleBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick-glance counts for Today / Tomorrow, independent of the selected date/filters
  const [todayCounts, setTodayCounts] = useState<{ departures: number; arrivals: number } | null>(null);
  const [tomorrowCounts, setTomorrowCounts] = useState<{ departures: number; arrivals: number } | null>(null);

  useEffect(() => {
    adminCarsApi.getStats().then(({ data }) => setCities(data.cities || [])).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      bookingsApi.getSchedule({ date: todayStr() }),
      bookingsApi.getSchedule({ date: tomorrowStr() }),
    ]).then(([t, tm]) => {
      setTodayCounts({ departures: t.data.data.departures.length, arrivals: t.data.data.arrivals.length });
      setTomorrowCounts({ departures: tm.data.data.departures.length, arrivals: tm.data.data.arrivals.length });
    }).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { date };
    if (cityFilter !== "All") params.city = cityFilter;
    if (statusFilter !== "All") params.status = statusFilter;
    bookingsApi.getSchedule(params)
      .then(({ data }) => {
        setDepartures(data.data.departures || []);
        setArrivals(data.data.arrivals || []);
      })
      .catch(() => toast.error("Failed to load schedule"))
      .finally(() => setLoading(false));
  }, [date, cityFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Arrivals & Departures</h1>
          <p className="text-[#9090A8] text-sm">Day-wise car movement — who&apos;s going out, who&apos;s coming back</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E4E5EF] text-xs font-semibold text-[#4A4A6A] hover:bg-[#F8F9FC]">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Today / Tomorrow quick-glance tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {([
          { label: "Today", value: todayStr(), counts: todayCounts },
          { label: "Tomorrow", value: tomorrowStr(), counts: tomorrowCounts },
        ] as const).map(({ label, value, counts }) => (
          <button key={label} onClick={() => setDate(value)}
            className={cn("text-left bg-white rounded-2xl border p-4 transition-colors",
              date === value ? "border-[#E8540A] ring-1 ring-[#E8540A]" : "border-[#E4E5EF] hover:border-[#E8540A]/40")}>
            <p className="text-sm font-bold text-[#0F0F1A] font-syne mb-2">{label}</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <ArrowUpCircle size={14} className="text-[#E8540A]" />
                <span className="text-lg font-black text-[#0F0F1A]">{counts?.departures ?? "—"}</span>
                <span className="text-[#9090A8] text-xs">departing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowDownCircle size={14} className="text-[#10B981]" />
                <span className="text-lg font-black text-[#0F0F1A]">{counts?.arrivals ?? "—"}</span>
                <span className="text-[#9090A8] text-xs">arriving</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <label className="block text-[10px] font-bold text-[#9090A8] uppercase tracking-wider mb-1.5">Date</label>
          <DatePicker value={date} onChange={(v) => v && setDate(v)} placeholder="Select date" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#9090A8] uppercase tracking-wider mb-1.5">City</label>
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
            <option value="All">All Cities</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#9090A8] uppercase tracking-wider mb-1.5">Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
            {["All", "confirmed", "active", "completed", "pending", "cancelled"].map(s =>
              <option key={s} value={s}>{s === "All" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            )}
          </select>
        </div>
        <p className="text-sm font-semibold text-[#0F0F1A] ml-auto flex items-center gap-1.5">
          <Car size={14} className="text-[#E8540A]" /> {fmtDateLabel(date)}
        </p>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ScheduleTable rows={departures} kind="departure" loading={loading} />
        <ScheduleTable rows={arrivals} kind="arrival" loading={loading} />
      </div>
    </div>
  );
}
