"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Wrench, Search, Loader2, ChevronRight, IndianRupee, Plus, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminCarsApi, adminMaintenanceApi } from "@/lib/api";
import toast from "react-hot-toast";

type CarItem = { _id: string; name: string; registrationNo: string; type: string };
type Totals = { carId: string; total: number; count: number; lastDate: string };

const CATEGORIES = ["Service", "Parts Replacement", "Tyre", "Alignment", "Battery", "AC", "Denting/Painting", "Other"] as const;
const PAGE_SIZE = 20;
const CAR_FIELDS = "name,registrationNo,type";

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function MaintenanceCarPickerPage() {
  const [cars, setCars] = useState<CarItem[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");

  const [totals, setTotals] = useState<Record<string, Totals>>({});
  const [overallTotal, setOverallTotal] = useState(0);
  const [overallCount, setOverallCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [allTime, setAllTime] = useState(false);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickForm, setQuickForm] = useState({
    carId: "", category: "Service", amount: "", odometer: "", remark: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [carQuery, setCarQuery] = useState("");
  const [carDropdownOpen, setCarDropdownOpen] = useState(false);
  const [carSuggestions, setCarSuggestions] = useState<CarItem[]>([]);
  const [carSearching, setCarSearching] = useState(false);

  // Reset to page 1 whenever the search term changes.
  useEffect(() => { setPage(1); }, [search]);

  // Table is server-paginated + server-searched so it stays correct no
  // matter how large the fleet grows (a fixed client-side limit would
  // silently hide cars beyond it).
  useEffect(() => {
    setCarsLoading(true);
    const timer = setTimeout(() => {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE, fields: CAR_FIELDS };
      if (search) params.search = search;
      adminCarsApi.getAll(params)
        .then((res) => {
          setCars(res.data?.data || []);
          setPages(res.data?.pages || 1);
        })
        .catch(() => toast.error("Failed to load cars"))
        .finally(() => setCarsLoading(false));
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [page, search]);

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

  const openQuickAdd = () => {
    setQuickForm({ carId: "", category: "Service", amount: "", odometer: "", remark: "", date: new Date().toISOString().slice(0, 10) });
    setCarQuery("");
    setCarSuggestions([]);
    setCarDropdownOpen(false);
    setQuickAddOpen(true);
  };

  const selectQuickCar = (car: CarItem) => {
    setQuickForm((f) => ({ ...f, carId: car._id }));
    setCarQuery(`${car.name} — ${car.registrationNo}`);
    setCarDropdownOpen(false);
  };

  // Car picker searches the server (debounced) instead of filtering a
  // pre-loaded list, so it finds a match regardless of fleet size.
  useEffect(() => {
    if (!carDropdownOpen) return;
    setCarSearching(true);
    const timer = setTimeout(() => {
      const params: Record<string, string | number> = { limit: 10, fields: CAR_FIELDS };
      if (carQuery) params.search = carQuery;
      adminCarsApi.getAll(params)
        .then((res) => setCarSuggestions(res.data?.data || []))
        .catch(() => {})
        .finally(() => setCarSearching(false));
    }, carQuery ? 250 : 0);
    return () => clearTimeout(timer);
  }, [carQuery, carDropdownOpen]);

  const handleQuickAdd = async () => {
    if (!quickForm.carId) {
      toast.error("Select a car.");
      return;
    }
    if (!quickForm.amount) {
      toast.error("Enter an amount.");
      return;
    }
    setQuickSaving(true);
    try {
      await adminMaintenanceApi.create({
        carId: quickForm.carId,
        category: quickForm.category,
        amount: Number(quickForm.amount),
        odometer: quickForm.odometer ? Number(quickForm.odometer) : undefined,
        remark: quickForm.remark || undefined,
        date: quickForm.date,
      });
      toast.success("Maintenance entry added!");
      setQuickAddOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add entry.");
    } finally {
      setQuickSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne flex items-center gap-2">
            <Wrench size={22} className="text-[#E8540A]" /> Maintenance
          </h1>
          <p className="text-[#9090A8] text-sm mt-0.5">Select a car to view or log its service & repair expenses</p>
        </div>
        <button
          onClick={openQuickAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#E8540A] text-white rounded-xl text-sm font-semibold hover:bg-[#c94508] transition-colors"
        >
          <Plus size={15} /> Add Expense
        </button>
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
        <div className={cn("text-right transition-opacity", loading && "opacity-50")}>
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
        {carsLoading ? (
          <div className="p-16 flex justify-center"><Loader2 size={28} className="animate-spin text-[#E8540A]" /></div>
        ) : cars.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#9090A8]">No cars found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E5EF] text-left">
                <th className="px-5 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">S.No</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Car</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Reg. No.</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Entries</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Total Spent</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider text-right">Action</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F2F7]">
              {cars.map((car, i) => {
                const t = totals[car._id];
                return (
                  <tr key={car._id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-5 py-3.5 text-[#9090A8]">{(page - 1) * PAGE_SIZE + i + 1}</td>
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

      {!carsLoading && cars.length > 0 && pages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[#9090A8] text-xs">Page {page} of {pages}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border-[1.5px] border-[#E4E5EF] flex items-center justify-center disabled:opacity-40 hover:border-[#E8540A] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="w-8 h-8 rounded-lg border-[1.5px] border-[#E4E5EF] flex items-center justify-center disabled:opacity-40 hover:border-[#E8540A] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {quickAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setQuickAddOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[#E4E5EF] flex items-center justify-between">
              <h2 className="font-bold text-[#0F0F1A] text-sm flex items-center gap-2">
                <Wrench size={15} className="text-[#E8540A]" /> Add Expense
              </h2>
              <button onClick={() => setQuickAddOpen(false)} className="text-[#9090A8] hover:text-[#EF4444]">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="relative">
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Car</label>
                <input
                  value={carQuery}
                  onChange={(e) => {
                    setCarQuery(e.target.value);
                    setQuickForm((f) => ({ ...f, carId: "" }));
                    setCarDropdownOpen(true);
                  }}
                  onFocus={() => setCarDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setCarDropdownOpen(false), 120)}
                  placeholder="Search by car name or registration no…"
                  className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8540A]"
                />
                {carDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-[#E4E5EF] rounded-xl shadow-lg">
                    {carSearching ? (
                      <div className="px-3 py-2.5 flex items-center gap-2 text-xs text-[#9090A8]">
                        <Loader2 size={12} className="animate-spin" /> Searching…
                      </div>
                    ) : carSuggestions.length === 0 ? (
                      <div className="px-3 py-2.5 text-xs text-[#9090A8]">No cars found.</div>
                    ) : (
                      carSuggestions.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); selectQuickCar(c); }}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#FFF3ED] transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-[#0F0F1A]">{c.name}</span>
                          <span className="text-[#9090A8] text-xs font-mono">{c.registrationNo}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Category</label>
                  <select value={quickForm.category} onChange={(e) => setQuickForm((f) => ({ ...f, category: e.target.value }))} className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8540A]">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Amount (Rs.)</label>
                  <input type="number" min="0" value={quickForm.amount} onChange={(e) => setQuickForm((f) => ({ ...f, amount: e.target.value }))} className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8540A]" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Date</label>
                  <input type="date" value={quickForm.date} onChange={(e) => setQuickForm((f) => ({ ...f, date: e.target.value }))} className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8540A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Odometer (km, optional)</label>
                  <input type="number" min="0" value={quickForm.odometer} onChange={(e) => setQuickForm((f) => ({ ...f, odometer: e.target.value }))} className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8540A]" placeholder="e.g. 45000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Remark</label>
                <textarea value={quickForm.remark} onChange={(e) => setQuickForm((f) => ({ ...f, remark: e.target.value }))} rows={3} className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8540A] resize-none" placeholder="e.g. Front brake pads replaced" />
              </div>
              <button
                onClick={handleQuickAdd}
                disabled={quickSaving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#E8540A] text-white rounded-xl text-sm font-bold hover:bg-[#c94508] transition-colors disabled:opacity-60"
              >
                {quickSaving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {quickSaving ? "Saving..." : "Add Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
