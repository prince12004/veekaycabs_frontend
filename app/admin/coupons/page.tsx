"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Tag, Percent, Calendar, Users, X, Save, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminCouponsApi } from "@/lib/api";
import toast from "react-hot-toast";

interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minBookingAmount: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  description?: string;
}

interface CouponForm {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  maxDiscount: string;
  minBookingAmount: string;
  usageLimit: string;
  validFrom: string;
  validUntil: string;
  description: string;
}

const emptyForm: CouponForm = {
  code: "", discountType: "percentage", discountValue: "",
  maxDiscount: "", minBookingAmount: "0", usageLimit: "100",
  validFrom: new Date().toISOString().split("T")[0],
  validUntil: "", description: "",
};

const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

const isExpired = (c: Coupon) => !c.isActive || new Date(c.validUntil) < new Date();

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCoupons = () => {
    setLoading(true);
    adminCouponsApi.getAll()
      .then(({ data }) => setCoupons(data.data || []))
      .catch(() => toast.error("Failed to load coupons"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCoupons(); }, []);

  const update = (f: keyof CouponForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [f]: e.target.value }));

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      minBookingAmount: String(c.minBookingAmount || 0),
      usageLimit: String(c.usageLimit || 100),
      validFrom: c.validFrom ? c.validFrom.split("T")[0] : "",
      validUntil: c.validUntil ? c.validUntil.split("T")[0] : "",
      description: c.description || "",
    });
    setEditId(c._id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      code: form.code.toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      minBookingAmount: Number(form.minBookingAmount) || 0,
      usageLimit: Number(form.usageLimit) || 100,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      description: form.description || undefined,
    };
    try {
      if (editId) {
        await adminCouponsApi.update(editId, payload);
        toast.success("Coupon updated!");
      } else {
        await adminCouponsApi.create(payload);
        toast.success("Coupon created!");
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      await adminCouponsApi.toggle(id);
      setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: !c.isActive } : c));
    } catch {
      toast.error("Failed to toggle coupon");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    setDeleting(id);
    try {
      await adminCouponsApi.remove(id);
      setCoupons(prev => prev.filter(c => c._id !== id));
      toast.success("Coupon deleted");
    } catch {
      toast.error("Failed to delete coupon");
    } finally {
      setDeleting(null);
    }
  };

  const active = coupons.filter(c => c.isActive && new Date(c.validUntil) >= new Date()).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Coupons</h1>
          <p className="text-[#9090A8] text-sm">{coupons.length} total · {active} active</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-[#E8540A]" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-24 text-[#9090A8]">
          <Tag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No coupons yet</p>
          <p className="text-xs mt-1">Click &quot;Add Coupon&quot; to create one</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(c => {
            const expired = isExpired(c);
            const daysLeft = Math.ceil((new Date(c.validUntil).getTime() - Date.now()) / 86400000);
            return (
              <div key={c._id} className={cn("bg-white rounded-2xl border p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow", expired ? "border-[#E4E5EF] opacity-70" : "border-[#E8540A]/20")}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
                    <Tag size={20} className="text-[#E8540A]" />
                  </div>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", !expired ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]")}>
                    {!expired ? "Active" : "Expired"}
                  </span>
                </div>

                <p className="font-black text-2xl text-[#0F0F1A] tracking-wider">{c.code}</p>
                <p className="text-[#E8540A] font-bold text-lg mt-0.5">
                  {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `Rs. ${c.discountValue} OFF`}
                  {c.maxDiscount ? <span className="text-sm text-[#9090A8] font-semibold"> (max Rs. {c.maxDiscount})</span> : null}
                </p>

                <div className="mt-3 space-y-1.5 text-xs text-[#4A4A6A]">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-[#9090A8]" />
                    Expires: {new Date(c.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    {!expired && daysLeft <= 7 && <span className="text-[#EF4444] font-bold">({daysLeft}d left)</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={11} className="text-[#9090A8]" />
                    Used {c.usedCount}/{c.usageLimit} times
                    {c.minBookingAmount > 0 && <span>· Min Rs. {c.minBookingAmount}</span>}
                  </div>
                  {c.description && <p className="text-[#9090A8] mt-1 truncate">{c.description}</p>}
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleToggle(c._id)} disabled={toggling === c._id}
                    className={cn("flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50", c.isActive ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]")}>
                    {toggling === c._id ? <Loader2 size={11} className="animate-spin" /> : c.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    {c.isActive ? "On" : "Off"}
                  </button>
                  <button onClick={() => openEdit(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#E4E5EF] text-xs font-bold text-[#4A4A6A] hover:border-[#E8540A] hover:text-[#E8540A] transition-colors">
                    <Edit size={12} /> Edit
                  </button>
                  <button onClick={() => handleDelete(c._id)} disabled={deleting === c._id}
                    className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#991B1B] hover:bg-[#EF4444] hover:text-white transition-colors flex items-center justify-center shrink-0 disabled:opacity-50">
                    {deleting === c._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E5EF]">
              <h3 className="font-black font-syne text-[#0F0F1A]">{editId ? "Edit Coupon" : "Add Coupon"}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Coupon Code <span className="text-[#EF4444]">*</span></label>
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                  <input value={form.code} onChange={update("code")} required placeholder="e.g. VEEKAY25"
                    className={cn(inputCls, "pl-9")} style={{ textTransform: "uppercase" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Discount Value <span className="text-[#EF4444]">*</span></label>
                  <div className="relative">
                    <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input type="number" value={form.discountValue} onChange={update("discountValue")} required placeholder="25" min="1" className={cn(inputCls, "pl-9")} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Type</label>
                  <select value={form.discountType} onChange={update("discountType")} className={inputCls}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat Amount (Rs.)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Max Discount (Rs.)</label>
                  <input type="number" value={form.maxDiscount} onChange={update("maxDiscount")} placeholder="500 (optional)" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Min Booking (Rs.)</label>
                  <input type="number" value={form.minBookingAmount} onChange={update("minBookingAmount")} placeholder="0" min="0" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={update("usageLimit")} placeholder="100" min="1" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Valid From <span className="text-[#EF4444]">*</span></label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input type="date" value={form.validFrom} onChange={update("validFrom")} required className={cn(inputCls, "pl-9")} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Valid Until <span className="text-[#EF4444]">*</span></label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input type="date" value={form.validUntil} onChange={update("validUntil")} required className={cn(inputCls, "pl-9")} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={form.description} onChange={update("description")} rows={2} placeholder="e.g. 25% off for 4+ day bookings"
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none bg-white" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 btn-gradient py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60">
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {submitting ? "Saving..." : editId ? "Update" : "Add Coupon"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
