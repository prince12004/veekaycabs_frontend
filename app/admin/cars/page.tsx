"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Eye, ToggleLeft, ToggleRight, AlertTriangle, Car, Loader2, Wrench, ChevronLeft, ChevronRight } from "lucide-react";
import { adminCarsApi } from "@/lib/api";
import toast from "react-hot-toast";
import CarMaintenanceModal from "@/components/admin/CarMaintenanceModal";

const PAGE_SIZE = 20;

type StatusTab = "all" | "active" | "inactive" | "expiry";

export default function AdminCarsPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [toggling, setToggling] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [maintenanceCarId, setMaintenanceCarId] = useState<string | null>(null);

  // Overall fleet stats (unaffected by the current filter/tab) — fetched
  // once so the summary tiles always show the true totals.
  const [overallTotal, setOverallTotal] = useState(0);
  const [overallActive, setOverallActive] = useState(0);
  const [criticalExpiry, setCriticalExpiry] = useState(0);

  const loadOverallStats = useCallback(() => {
    adminCarsApi.getStats()
      .then(({ data }) => {
        setCities(data.cities || []);
        setOverallTotal(data.total || 0);
        setOverallActive(data.activeCount || 0);
        setCriticalExpiry(data.criticalExpiry || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadOverallStats(); }, [loadOverallStats]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [search, cityFilter, typeFilter, statusTab]);

  const loadCars = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (search) params.search = search;
    if (cityFilter !== "All") params.city = cityFilter;
    if (typeFilter !== "All") params.type = typeFilter;
    if (statusTab === "active") params.isActive = "true";
    if (statusTab === "inactive") params.isActive = "false";
    if (statusTab === "expiry") params.expiryAlert = "true";

    return adminCarsApi.getAll(params)
      .then(({ data }) => {
        setCars(data.data || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      })
      .catch(() => toast.error("Failed to load cars"))
      .finally(() => setLoading(false));
  }, [page, search, cityFilter, typeFilter, statusTab]);

  useEffect(() => {
    const timer = setTimeout(loadCars, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadCars]);

  const getDaysLeft = (expiry?: string | Date | null) => {
    if (!expiry) return null;
    const diff = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
    return diff;
  };

  const getExpiryColor = (days: number | null) => {
    if (days === null) return { text: "#9090A8", bg: "#F1F2F7" };
    if (days <= 14) return { text: "#EF4444", bg: "#FEE2E2" };
    if (days <= 30) return { text: "#F59E0B", bg: "#FEF3C7" };
    return { text: "#10B981", bg: "#D1FAE5" };
  };

  const toggleCar = async (carId: string) => {
    setToggling(carId);
    try {
      await adminCarsApi.toggleStatus(carId);
      loadCars();
      loadOverallStats();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Car Fleet</h1>
          <p className="text-[#9090A8] text-sm">{overallTotal} total cars · {overallActive} active</p>
        </div>
        <Link href="/admin/cars/add" className="btn-gradient px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2">
          <Plus size={16} /> Add Car
        </Link>
      </div>

      {/* Summary Strip — click a tile to filter the table below */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { key: "all",      label: "Total Fleet",    value: overallTotal,                    color: "#E8540A", bg: "#FFF3ED",  icon: Car },
          { key: "active",   label: "Active",         value: overallActive,                    color: "#10B981", bg: "#D1FAE5",  icon: ToggleRight },
          { key: "inactive", label: "Inactive",       value: overallTotal - overallActive,      color: "#9090A8", bg: "#F1F2F7",  icon: ToggleLeft },
          { key: "expiry",   label: "Expiry Alert",   value: criticalExpiry,                    color: "#EF4444", bg: "#FEE2E2",  icon: AlertTriangle },
        ] as const).map(({ key, label, value, color, bg, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setStatusTab(key)}
            className={`text-left bg-white rounded-2xl border p-4 flex items-center gap-3 transition-colors ${statusTab === key ? "border-[#0F0F1A] ring-1 ring-[#0F0F1A]" : "border-[#E4E5EF] hover:border-[#0F0F1A]/30"}`}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0F0F1A] font-syne leading-none">{value}</p>
              <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search car name or reg no..."
            className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none"
          />
        </div>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
          <option value="All">All</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
          {["All", "SUV", "Hatchback", "Sedan", "MUV", "Luxury"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#E8540A]" />
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20 text-[#9090A8]">
            <Car size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No cars found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                  {["Car", "Reg No", "Type", "City", "Price/hr", "Insurance", "PUC", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cars.map((car, i) => {
                  const insDays  = getDaysLeft(car.documents?.insurance?.expiry);
                  const pucDays  = getDaysLeft(car.documents?.puc?.expiry);
                  const insColor = getExpiryColor(insDays);
                  const pucColor = getExpiryColor(pucDays);
                  return (
                    <tr key={car._id} className={`border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors ${i % 2 === 1 ? "bg-[#F8F9FC]/50" : ""}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#FFF3ED] flex items-center justify-center overflow-hidden shrink-0">
                            {car.images?.[0]
                              ? <img src={car.images[0]} alt={car.name} className="w-full h-full object-cover" />
                              : <Car size={14} className="text-[#E8540A]" />
                            }
                          </div>
                          <div>
                            <p className="font-semibold text-[#0F0F1A] text-sm">{car.name}</p>
                            <p className="text-[#9090A8] text-xs">{car.modelYear}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-[#4A4A6A]">{car.registrationNo}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold bg-[#F8F9FC] text-[#4A4A6A] px-2 py-1 rounded-lg">{car.type}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#4A4A6A]">{car.cityId?.name || "—"}</td>
                      <td className="px-5 py-4 font-bold text-[#0F0F1A] text-sm">Rs. {car.regularPrice}</td>
                      <td className="px-5 py-4">
                        {insDays !== null ? (
                          <div className="flex items-center gap-1.5">
                            {insDays <= 30 && <AlertTriangle size={12} className="text-[#F59E0B]" />}
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: insColor.bg, color: insColor.text }}>
                              {insDays}d
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#9090A8]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {pucDays !== null ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: pucColor.bg, color: pucColor.text }}>
                            {pucDays}d
                          </span>
                        ) : (
                          <span className="text-xs text-[#9090A8]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleCar(car._id)}
                          disabled={toggling === car._id}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${car.isActive ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]"}`}
                        >
                          {toggling === car._id
                            ? <Loader2 size={12} className="animate-spin" />
                            : car.isActive
                              ? <><ToggleRight size={14} /> Active</>
                              : <><ToggleLeft size={14} /> Inactive</>
                          }
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <Link href={`/admin/cars/${car._id}/edit`} className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center">
                            <Eye size={14} />
                          </Link>
                          <Link href={`/admin/cars/${car._id}/edit`} className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#92400E] hover:bg-[#F59E0B] hover:text-white transition-colors flex items-center justify-center">
                            <Edit size={14} />
                          </Link>
                          <button onClick={() => setMaintenanceCarId(car._id)} className="w-8 h-8 rounded-lg bg-[#EDE9FE] text-[#6D28D9] hover:bg-[#6D28D9] hover:text-white transition-colors flex items-center justify-center" title="Maintenance">
                            <Wrench size={14} />
                          </button>
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

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[#9090A8] text-xs">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border-[1.5px] border-[#E4E5EF] flex items-center justify-center disabled:opacity-40 hover:border-[#E8540A] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-[#4A4A6A] px-2">
              Page {page} of {pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="w-8 h-8 rounded-lg border-[1.5px] border-[#E4E5EF] flex items-center justify-center disabled:opacity-40 hover:border-[#E8540A] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {maintenanceCarId && (
        <CarMaintenanceModal
          carId={maintenanceCarId}
          onClose={() => setMaintenanceCarId(null)}
          onChanged={loadCars}
        />
      )}
    </div>
  );
}
