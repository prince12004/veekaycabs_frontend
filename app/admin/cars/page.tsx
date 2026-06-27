"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Eye, ToggleLeft, ToggleRight, AlertTriangle, Car, Loader2 } from "lucide-react";
import { adminCarsApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminCarsPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    adminCarsApi.getAll()
      .then(({ data }) => setCars(data.data || []))
      .catch(() => toast.error("Failed to load cars"))
      .finally(() => setLoading(false));
  }, []);

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

  const toggleCar = async (carId: string, current: boolean) => {
    setToggling(carId);
    try {
      await adminCarsApi.toggleStatus(carId);
      setCars(prev => prev.map(c => c._id === carId ? { ...c, isActive: !current } : c));
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(null);
    }
  };

  const filtered = cars.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.registrationNo?.toLowerCase().includes(search.toLowerCase());
    const matchCity = cityFilter === "All" || c.cityId?.name === cityFilter;
    const matchType = typeFilter === "All" || c.type === typeFilter;
    return matchSearch && matchCity && matchType;
  });

  const active = cars.filter(c => c.isActive).length;
  const criticalExpiry = cars.filter(c => {
    const insDays = getDaysLeft(c.documents?.insurance?.expiry);
    const pucDays = getDaysLeft(c.documents?.puc?.expiry);
    return (insDays !== null && insDays <= 14) || (pucDays !== null && pucDays <= 14);
  }).length;

  const cities = ["All", ...Array.from(new Set(cars.map(c => c.cityId?.name).filter(Boolean)))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Car Fleet</h1>
          <p className="text-[#9090A8] text-sm">{cars.length} total cars · {active} active</p>
        </div>
        <Link href="/admin/cars/add" className="btn-gradient px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2">
          <Plus size={16} /> Add Car
        </Link>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Fleet",    value: cars.length,              color: "#E8540A", bg: "#FFF3ED",  icon: Car },
          { label: "Active",         value: active,                   color: "#10B981", bg: "#D1FAE5",  icon: ToggleRight },
          { label: "Inactive",       value: cars.length - active,     color: "#9090A8", bg: "#F1F2F7",  icon: ToggleLeft },
          { label: "Expiry Alert",   value: criticalExpiry,           color: "#EF4444", bg: "#FEE2E2",  icon: AlertTriangle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0F0F1A] font-syne leading-none">{value}</p>
              <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          </div>
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
          {cities.map(c => <option key={c}>{c}</option>)}
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
        ) : filtered.length === 0 ? (
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
                {filtered.map((car, i) => {
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
                          onClick={() => toggleCar(car._id, car.isActive)}
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
    </div>
  );
}
