"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Eye, ToggleLeft, ToggleRight, AlertTriangle, Car } from "lucide-react";

const CARS = [
  { id: "1", name: "Hyundai Creta", regNo: "DL01AB1234", type: "SUV", city: "Delhi", price: 149, status: true, insurance: { expiry: "2026-06-25", daysLeft: 15 }, puc: { expiry: "2026-08-10", daysLeft: 61 }, year: 2023 },
  { id: "2", name: "Maruti Swift", regNo: "DL02CD5678", type: "Hatchback", city: "Noida", price: 89, status: true, insurance: { expiry: "2026-12-10", daysLeft: 183 }, puc: { expiry: "2026-07-01", daysLeft: 21 }, year: 2022 },
  { id: "3", name: "Kia Seltos", regNo: "DL04EF9012", type: "SUV", city: "Gurgaon", price: 159, status: true, insurance: { expiry: "2027-01-05", daysLeft: 209 }, puc: { expiry: "2026-07-10", daysLeft: 30 }, year: 2023 },
  { id: "4", name: "Honda City", regNo: "DL01GH3456", type: "Sedan", city: "Delhi", price: 129, status: false, insurance: { expiry: "2026-11-20", daysLeft: 163 }, puc: { expiry: "2026-09-15", daysLeft: 97 }, year: 2022 },
  { id: "5", name: "Hyundai i20", regNo: "DL05IJ7890", type: "Hatchback", city: "Delhi", price: 99, status: true, insurance: { expiry: "2027-02-28", daysLeft: 263 }, puc: { expiry: "2026-11-01", daysLeft: 144 }, year: 2023 },
  { id: "6", name: "Maruti Ertiga", regNo: "DL03KL1234", type: "MUV", city: "Noida", price: 119, status: true, insurance: { expiry: "2026-08-14", daysLeft: 65 }, puc: { expiry: "2026-10-20", daysLeft: 132 }, year: 2022 },
];

export default function AdminCarsPage() {
  const [cars, setCars] = useState(CARS);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = cars.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.regNo.toLowerCase().includes(search.toLowerCase());
    const matchCity = cityFilter === "All" || c.city === cityFilter;
    const matchType = typeFilter === "All" || c.type === typeFilter;
    return matchSearch && matchCity && matchType;
  });

  const toggleCar = (id: string) => {
    setCars(prev => prev.map(c => c.id === id ? { ...c, status: !c.status } : c));
  };

  const getExpiryColor = (days: number) => {
    if (days <= 14) return { text: "#EF4444", bg: "#FEE2E2" };
    if (days <= 30) return { text: "#F59E0B", bg: "#FEF3C7" };
    return { text: "#10B981", bg: "#D1FAE5" };
  };

  const active = cars.filter(c => c.status).length;
  const criticalExpiry = cars.filter(c => c.insurance.daysLeft <= 14 || c.puc.daysLeft <= 14).length;

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
          { label: "Total Fleet", value: cars.length, color: "#E8540A", bg: "#FFF3ED", icon: Car },
          { label: "Active", value: active, color: "#10B981", bg: "#D1FAE5", icon: ToggleRight },
          { label: "Inactive", value: cars.length - active, color: "#9090A8", bg: "#F1F2F7", icon: ToggleLeft },
          { label: "Expiry Alert", value: criticalExpiry, color: "#EF4444", bg: "#FEE2E2", icon: AlertTriangle },
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
          {["All", "Delhi", "Noida", "Gurgaon", "Ghaziabad"].map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
          {["All", "SUV", "Hatchback", "Sedan", "MUV", "Luxury"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
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
                const ins = getExpiryColor(car.insurance.daysLeft);
                const puc = getExpiryColor(car.puc.daysLeft);
                return (
                  <tr key={car.id} className={`border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors ${i % 2 === 1 ? "bg-[#F8F9FC]/50" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
                          <Car size={14} className="text-[#E8540A]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#0F0F1A] text-sm">{car.name}</p>
                          <p className="text-[#9090A8] text-xs">{car.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[#4A4A6A]">{car.regNo}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold bg-[#F8F9FC] text-[#4A4A6A] px-2 py-1 rounded-lg">{car.type}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#4A4A6A]">{car.city}</td>
                    <td className="px-5 py-4 font-bold text-[#0F0F1A] text-sm">Rs. {car.price}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {car.insurance.daysLeft <= 30 && <AlertTriangle size={12} className="text-[#F59E0B]" />}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: ins.bg, color: ins.text }}>
                          {car.insurance.daysLeft}d
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: puc.bg, color: puc.text }}>
                        {car.puc.daysLeft}d
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleCar(car.id)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${car.status ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]"}`}>
                        {car.status ? <><ToggleRight size={14} /> Active</> : <><ToggleLeft size={14} /> Inactive</>}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center">
                          <Eye size={14} />
                        </button>
                        <Link href={`/admin/cars/${car.id}/edit`} className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#92400E] hover:bg-[#F59E0B] hover:text-white transition-colors flex items-center justify-center">
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
      </div>
    </div>
  );
}
