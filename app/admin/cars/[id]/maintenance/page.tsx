"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Wrench, Plus, X, Loader2, IndianRupee, Trash2, CheckCircle2, XCircle, ArrowLeft, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminMaintenanceApi, adminCarsApi } from "@/lib/api";

const CATEGORIES = ["Service", "Parts Replacement", "Tyre", "Alignment", "Battery", "AC", "Denting/Painting", "Other"] as const;

const CATEGORY_COLOR: Record<string, string> = {
  Service: "#3B82F6",
  "Parts Replacement": "#8B5CF6",
  Tyre: "#F59E0B",
  Alignment: "#EC4899",
  Battery: "#10B981",
  AC: "#06B6D4",
  "Denting/Painting": "#EF4444",
  Other: "#9090A8",
};

type LogEntry = {
  _id: string;
  category: string;
  amount: number;
  odometer?: number;
  remark?: string;
  date: string;
};

type CarInfo = { _id: string; name: string; registrationNo: string; odometer?: number };

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function CarMaintenancePage() {
  const { id } = useParams();
  const carId = String(id);

  const [car, setCar] = useState<CarInfo | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [byCategory, setByCategory] = useState<{ category: string; total: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [categoryFilter, setCategoryFilter] = useState("");
  const [allTime, setAllTime] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    category: "Service", amount: "", odometer: "", remark: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    adminCarsApi.getOne(carId).then((res) => setCar(res.data?.data)).catch(() => showToast("Failed to load car.", "error"));
  }, [carId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "200", carId };
      if (!allTime && monthFilter) params.month = monthFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await adminMaintenanceApi.getAll(params);
      setLogs(res.data?.data || []);
      setTotalSpent(res.data?.totalSpent || 0);
      setByCategory(res.data?.byCategory || []);
    } catch {
      showToast("Failed to load maintenance logs.", "error");
    } finally {
      setLoading(false);
    }
  }, [carId, monthFilter, categoryFilter, allTime]);

  useEffect(() => { load(); }, [load]);

  const openModal = () => {
    setForm({ category: "Service", amount: "", odometer: "", remark: "", date: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  };

  const handleAdd = async () => {
    if (!form.amount) {
      showToast("Enter an amount.", "error");
      return;
    }
    setSaving(true);
    try {
      await adminMaintenanceApi.create({
        carId,
        category: form.category,
        amount: Number(form.amount),
        odometer: form.odometer ? Number(form.odometer) : undefined,
        remark: form.remark || undefined,
        date: form.date,
      });
      showToast("Maintenance entry added!");
      setModalOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to add entry.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm("Delete this maintenance entry?")) return;
    try {
      await adminMaintenanceApi.remove(logId);
      showToast("Entry deleted.");
      load();
    } catch {
      showToast("Failed to delete entry.", "error");
    }
  };

  return (
    <div className="p-6 space-y-5">
      {toast && (
        <div className={cn(
          "fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all",
          toast.type === "success" ? "bg-[#10B981]" : "bg-[#EF4444]"
        )}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/cars/maintenance" className="text-[#9090A8] hover:text-[#E8540A] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
            <Car size={18} className="text-[#E8540A]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0F0F1A] font-syne">{car?.name || "Loading..."}</h1>
            <p className="text-[#9090A8] text-xs font-mono">{car?.registrationNo}{car?.odometer ? ` · ${car.odometer.toLocaleString("en-IN")} km` : ""}</p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#E8540A] text-white rounded-xl text-sm font-semibold hover:bg-[#c94508] transition-colors"
        >
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex flex-wrap items-center gap-3">
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
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-[#E4E5EF] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E8540A]">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4">
          <div className="flex items-center gap-2 text-[#9090A8] text-xs font-semibold mb-1">
            <IndianRupee size={13} /> Total Spent {allTime ? "(all time)" : "(selected month)"}
          </div>
          <p className="text-2xl font-black text-[#0F0F1A]">Rs. {totalSpent.toLocaleString("en-IN")}</p>
          <p className="text-[#9090A8] text-xs mt-0.5">{logs.length} entries</p>
        </div>
        {byCategory.slice(0, 3).map((c) => (
          <div key={c.category} className="bg-white rounded-2xl border border-[#E4E5EF] p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[c.category] || "#9090A8" }} />
              <span className="text-[#9090A8] text-xs font-semibold">{c.category}</span>
            </div>
            <p className="text-xl font-black text-[#0F0F1A]">Rs. {c.total.toLocaleString("en-IN")}</p>
            <p className="text-[#9090A8] text-xs mt-0.5">{c.count} entries</p>
          </div>
        ))}
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 size={24} className="animate-spin text-[#E8540A]" /></div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#9090A8]">No maintenance entries found for this filter.</div>
        ) : (
          <div className="divide-y divide-[#F1F2F7]">
            {logs.map((log) => (
              <div key={log._id} className="px-5 py-4 flex items-start justify-between gap-3 hover:bg-[#FAFAFA] transition-colors">
                <div className="min-w-0 flex-1">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${CATEGORY_COLOR[log.category] || "#9090A8"}18`, color: CATEGORY_COLOR[log.category] || "#9090A8" }}
                  >
                    {log.category}
                  </span>
                  {log.remark && <p className="text-xs text-[#4A4A6A] mt-1.5">{log.remark}</p>}
                  <p className="text-[10px] text-[#9090A8] mt-1">
                    {new Date(log.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    {log.odometer ? ` · ${log.odometer.toLocaleString("en-IN")} km` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="font-black text-sm text-[#0F0F1A]">Rs. {log.amount.toLocaleString("en-IN")}</p>
                  <button onClick={() => handleDelete(log._id)} className="text-[#9090A8] hover:text-[#EF4444] transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-[#E4E5EF] flex items-center justify-between">
              <h2 className="font-bold text-[#0F0F1A] text-sm flex items-center gap-2">
                <Wrench size={15} className="text-[#E8540A]" /> Add Expense — {car?.name}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-[#9090A8] hover:text-[#EF4444]">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8540A]">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Amount (Rs.)</label>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8540A]" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8540A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Odometer (km, optional)</label>
                  <input type="number" min="0" value={form.odometer} onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))} className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8540A]" placeholder="e.g. 45000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Remark</label>
                <textarea value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} rows={3} className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8540A] resize-none" placeholder="e.g. Front brake pads replaced" />
              </div>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#E8540A] text-white rounded-xl text-sm font-bold hover:bg-[#c94508] transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {saving ? "Saving..." : "Add Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
