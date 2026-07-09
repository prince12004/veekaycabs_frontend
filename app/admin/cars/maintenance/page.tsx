"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Wrench, Search, Loader2, ChevronRight, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminCarsApi, adminMaintenanceApi } from "@/lib/api";

type CarItem = { _id: string; name: string; registrationNo: string; type: string };
type Totals = { carId: string; total: number; count: number; lastDate: string };

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function MaintenanceCarPickerPage() {
  const [cars, setCars] = useState<CarItem[]>([]);
  const [totals, setTotals] = useState<Record<string, Totals>>({});
  const [overallTotal, setOverallTotal] = useState(0);
  const [overallCount, setOverallCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [allTime, setAllTime] = useState(false);

  useEffect(() => {
    adminCarsApi.getAll({ limit: 200 }).then((res) => setCars(res.data?.data || []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (!allTime && monthFilter) params.month = monthFilter;
      const res = await adminMaintenanceApi.getTotalsByCar(params);
      const map: Record<string, Totals> = {};
      (res.data?.data || []).forEach((t: Totals) => { map[t.carId] = t; });
      setTotals(map);
      setOverallTotal(res.data?.overallTotal || 0);
      setOverallCount(res.data?.overallCount || 0);
    } finally {
      setLoading(false);
    }
  }, [monthFilter, allTime]);

  useEffect(() => { load(); }, [load]);

  const filtered = cars.filter((c) => {
    const s = search.toLowerCase();
    return !s || c.name.toLowerCase().includes(s) || c.registrationNo.toLowerCase().includes(s);
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#0F0F1A] font-syne flex items-center gap-2">
          <Wrench size={22} className="text-[#E8540A]" /> Maintenance
        </h1>
        <p className="text-[#9090A8] text-sm mt-0.5">Select a car to view or log its service & repair expenses</p>
      </div>

      {/* Filters + Overall Total */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAllTime((v) => !v)}
            className={cn("text-xs font-bold px-3 py-2 rounded-xl transition-colors", allTime ? "bg-[#E8540A] text-white" : "bg-white border border-[#E4E5EF] text-[#4A4A6A]")}
          >
            All Time
          </button>
          <input
            type="month"
            value={monthFilter}
            disabled={allTime}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="border border-[#E4E5EF] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E8540A] disabled:opacity-40"
          />
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-[#9090A8] text-xs font-semibold">
            <IndianRupee size={12} /> Total Spent — All Cars {allTime ? "(all time)" : "(selected month)"}
          </p>
          <p className="text-2xl font-black text-[#0F0F1A]">Rs. {overallTotal.toLocaleString("en-IN")}</p>
          <p className="text-[#9090A8] text-xs">{overallCount} entries</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9090A8]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by car name or registration no."
          className="w-full pl-10 pr-4 py-2.5 border border-[#E4E5EF] rounded-xl text-sm focus:outline-none focus:border-[#E8540A]"
        />
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center"><Loader2 size={28} className="animate-spin text-[#E8540A]" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#9090A8]">No cars found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E5EF] text-left">
                <th className="px-5 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Car</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Reg. No.</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Entries</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Total Spent</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider text-right">Action</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F2F7]">
              {filtered.map((car) => {
                const t = totals[car._id];
                return (
                  <tr key={car._id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-[#0F0F1A]">{car.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#9090A8]">{car.registrationNo}</td>
                    <td className="px-5 py-3.5 text-[#4A4A6A]">{t?.count || 0}</td>
                    <td className="px-5 py-3.5 font-bold text-[#0F0F1A]">Rs. {(t?.total || 0).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/cars/${car._id}/maintenance`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#E8540A] hover:underline"
                      >
                        View <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
