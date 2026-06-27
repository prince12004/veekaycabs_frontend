"use client";

import { useState } from "react";
import { Plus, Trash2, Edit, Tag, Percent, Calendar, Users, Lock, Globe, X, Check, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const COUPONS = [
  { id: 1, name: "VEEKAY25", discount: 25, type: "percent", minDays: 4, expiry: "2026-01-16", secretType: "public", usedCount: 12, image: "", status: "active" },
  { id: 2, name: "VEEKAY15", discount: 15, type: "percent", minDays: 1, expiry: "2025-10-15", secretType: "public", usedCount: 34, image: "", status: "expired" },
  { id: 3, name: "PRINCE", discount: 15, type: "percent", minDays: 1, expiry: "2025-11-11", secretType: "secret", usedCount: 1, image: "", status: "expired" },
  { id: 4, name: "VEEKAY20", discount: 20, type: "percent", minDays: 15, expiry: "2025-09-30", secretType: "public", usedCount: 8, image: "", status: "expired" },
  { id: 5, name: "NEWUSER50", discount: 50, type: "flat", minDays: 1, expiry: "2026-12-31", secretType: "secret", usedCount: 0, image: "", status: "active" },
];

interface CouponForm { name: string; discount: string; type: string; minDays: string; expiry: string; secretType: string; terms: string }
const emptyForm: CouponForm = { name: "", discount: "", type: "percent", minDays: "1", expiry: "", secretType: "public", terms: "" };

const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState(COUPONS);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);

  const update = (f: keyof CouponForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0];
    const isActive = form.expiry >= today;
    if (editId !== null) {
      setCoupons(prev => prev.map(c => c.id === editId ? { ...c, ...form, discount: Number(form.discount), minDays: Number(form.minDays), status: isActive ? "active" : "expired" } : c));
    } else {
      setCoupons(prev => [...prev, { id: Date.now(), ...form, discount: Number(form.discount), minDays: Number(form.minDays), usedCount: 0, image: "", status: isActive ? "active" : "expired" }]);
    }
    setForm(emptyForm); setEditId(null); setShowAdd(false);
  };

  const startEdit = (c: (typeof COUPONS)[0]) => {
    setForm({ name: c.name, discount: String(c.discount), type: c.type, minDays: String(c.minDays), expiry: c.expiry, secretType: c.secretType, terms: "" });
    setEditId(c.id); setShowAdd(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Coupons</h1>
          <p className="text-[#9090A8] text-sm">{coupons.length} total · {coupons.filter(c => c.status === "active").length} active</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditId(null); setForm(emptyForm); }} className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(c => (
          <div key={c.id} className={cn("bg-white rounded-2xl border p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow", c.status === "expired" ? "border-[#E4E5EF] opacity-70" : "border-[#E8540A]/20")}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
                <Tag size={22} className="text-[#E8540A]" />
              </div>
              <div className="flex gap-1.5">
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", c.status === "active" ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]")}>
                  {c.status === "active" ? "Active" : "Expired"}
                </span>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1", c.secretType === "secret" ? "bg-[#EDE9FE] text-[#7C3AED]" : "bg-[#F1F2F7] text-[#4A4A6A]")}>
                  {c.secretType === "secret" ? <Lock size={9} /> : <Globe size={9} />} {c.secretType}
                </span>
              </div>
            </div>
            <p className="font-black text-2xl text-[#0F0F1A] font-space-grotesk tracking-wider">{c.name}</p>
            <p className="text-[#E8540A] font-bold text-lg mt-0.5">
              {c.type === "percent" ? `${c.discount}% OFF` : `Rs. ${c.discount} OFF`}
            </p>
            <div className="mt-3 space-y-1.5 text-xs text-[#4A4A6A]">
              <div className="flex items-center gap-1.5"><Calendar size={11} className="text-[#9090A8]" /> Expires: {new Date(c.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
              <div className="flex items-center gap-1.5"><Users size={11} className="text-[#9090A8]" /> Min {c.minDays} day{c.minDays !== 1 ? "s" : ""} booking · Used {c.usedCount} times</div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => startEdit(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#E4E5EF] text-xs font-bold text-[#4A4A6A] hover:border-[#E8540A] hover:text-[#E8540A] transition-colors">
                <Edit size={12} /> Edit
              </button>
              <button onClick={() => setCoupons(prev => prev.filter(x => x.id !== c.id))} className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#991B1B] hover:bg-[#EF4444] hover:text-white transition-colors flex items-center justify-center shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E5EF]">
              <h3 className="font-black font-syne text-[#0F0F1A]">{editId !== null ? "Edit Coupon" : "Add Coupon"}</h3>
              <button onClick={() => { setShowAdd(false); setEditId(null); }} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Coupon Name <span className="text-[#EF4444]">*</span></label>
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                  <input value={form.name} onChange={update("name")} required placeholder="e.g. FLAT10, VEEKAY25" className={cn(inputCls, "pl-9 uppercase")} style={{ textTransform: "uppercase" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Discount <span className="text-[#EF4444]">*</span></label>
                  <div className="relative">
                    <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input type="number" value={form.discount} onChange={update("discount")} required placeholder="10" className={cn(inputCls, "pl-9")} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Type</label>
                  <select value={form.type} onChange={update("type")} className={inputCls}>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (Rs.)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Min Days <span className="text-[#EF4444]">*</span></label>
                  <input type="number" value={form.minDays} onChange={update("minDays")} required min="1" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Expiry Date <span className="text-[#EF4444]">*</span></label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input type="date" value={form.expiry} onChange={update("expiry")} required className={cn(inputCls, "pl-9")} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Visibility</label>
                <div className="flex gap-3">
                  {[{ value: "public", label: "Public", icon: Globe }, { value: "secret", label: "Secret", icon: Lock }].map(({ value, label, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => setForm(p => ({ ...p, secretType: value }))}
                      className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-colors", form.secretType === value ? "bg-[#E8540A] text-white border-[#E8540A]" : "border-[#E4E5EF] text-[#4A4A6A]")}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Terms & Conditions</label>
                <textarea value={form.terms} onChange={update("terms")} rows={3} placeholder="Enter coupon terms..." className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none bg-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 btn-gradient py-3 rounded-xl text-white font-bold text-sm">
                  <Save size={15} /> {editId !== null ? "Update" : "Add Coupon"}
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setEditId(null); }} className="px-6 py-3 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
