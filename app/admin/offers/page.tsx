"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Edit2, X, Save, Tag, Loader2, ToggleLeft, ToggleRight, ImageIcon, Percent } from "lucide-react";
import { offersApi } from "@/lib/api";

type Offer = {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  couponCode: string;
  discountPct: number;
  validUntil: string;
  linkUrl: string;
  displayPage: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM = { title: "", description: "", couponCode: "", discountPct: 0, validUntil: "", linkUrl: "", displayPage: "home", sortOrder: 0 };
const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

export default function OffersPage() {
  const [items, setItems] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    offersApi.getAll().then((r) => setItems(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setImageFile(null); setImagePreview(""); setShowModal(true);
  };
  const openEdit = (o: Offer) => {
    setEditing(o);
    setForm({ title: o.title, description: o.description || "", couponCode: o.couponCode || "", discountPct: o.discountPct || 0, validUntil: o.validUntil ? o.validUntil.split("T")[0] : "", linkUrl: o.linkUrl || "", displayPage: o.displayPage || "home", sortOrder: o.sortOrder || 0 });
    setImageFile(null); setImagePreview(o.imageUrl || ""); setShowModal(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setImageFile(f); setImagePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (imageFile) fd.append("image", imageFile);
      if (editing) { await offersApi.update(editing._id, fd); } else { await offersApi.create(fd); }
      setShowModal(false); load();
    } catch { alert("Failed to save"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    setDeleting(id);
    await offersApi.remove(id).catch(() => {});
    setDeleting(null); load();
  };

  const toggleActive = async (o: Offer) => {
    const fd = new FormData(); fd.append("isActive", String(!o.isActive));
    await offersApi.update(o._id, fd).catch(() => {});
    load();
  };

  const isExpired = (validUntil?: string) => validUntil && new Date(validUntil) < new Date();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Offers & Banners</h1>
          <p className="text-[#9090A8] text-sm">Promotional offers and offer banners shown on the website</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm">
          <Plus size={16} /> Add Offer
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#9090A8] py-12 justify-center"><Loader2 size={20} className="animate-spin" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4E5EF] py-16 text-center">
          <Tag size={40} className="text-[#E4E5EF] mx-auto mb-3" />
          <p className="text-[#9090A8] font-medium">No offers yet. Create your first promotional offer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((o) => (
            <div key={o._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${!o.isActive || isExpired(o.validUntil) ? "opacity-60" : "border-[#E4E5EF]"}`}>
              {o.imageUrl ? (
                <img src={o.imageUrl} alt={o.title} className="w-full aspect-video object-cover" />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-[#E8540A]/10 to-[#FF6B35]/10 flex items-center justify-center">
                  <Tag size={32} className="text-[#E8540A]/40" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-bold text-sm text-[#0F0F1A] leading-tight">{o.title}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${isExpired(o.validUntil) ? "bg-red-100 text-red-600" : o.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {isExpired(o.validUntil) ? "Expired" : o.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
                {o.description && <p className="text-xs text-[#9090A8] line-clamp-2 mb-2">{o.description}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {o.couponCode && (
                    <span className="flex items-center gap-1 text-xs font-bold bg-[#E8540A]/10 text-[#E8540A] px-2 py-0.5 rounded-lg">
                      <Tag size={10} /> {o.couponCode}
                    </span>
                  )}
                  {o.discountPct > 0 && (
                    <span className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-lg">
                      <Percent size={10} /> {o.discountPct}% off
                    </span>
                  )}
                  {o.validUntil && (
                    <span className="text-xs text-[#9090A8] px-2 py-0.5 bg-[#F8F9FC] rounded-lg">
                      Until {new Date(o.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-[#E4E5EF]">
                  <button onClick={() => openEdit(o)} className="flex items-center gap-1 text-xs font-semibold text-[#E8540A] hover:bg-[#E8540A]/10 px-3 py-1.5 rounded-lg">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => toggleActive(o)} className="flex items-center gap-1 text-xs font-semibold text-[#4A4A6A] hover:bg-[#F8F9FC] px-3 py-1.5 rounded-lg">
                    {o.isActive ? <ToggleRight size={14} className="text-green-600" /> : <ToggleLeft size={14} />}
                    {o.isActive ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => handleDelete(o._id)} disabled={deleting === o._id} className="ml-auto text-xs font-semibold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg">
                    {deleting === o._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E4E5EF]">
              <h2 className="text-lg font-black font-syne text-[#0F0F1A]">{editing ? "Edit Offer" : "Add Offer"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Banner Image</label>
                <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-[#E4E5EF] rounded-xl cursor-pointer hover:border-[#E8540A] transition-colors overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="py-6 flex flex-col items-center gap-2 text-[#9090A8]">
                      <ImageIcon size={24} /><span className="text-sm font-medium">Click to upload offer image (optional)</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Title *</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required className={inputCls} placeholder="e.g. Weekend Special Offer" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className={inputCls + " resize-none"} placeholder="Short offer details..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Coupon Code</label>
                  <input value={form.couponCode} onChange={(e) => setForm((p) => ({ ...p, couponCode: e.target.value.toUpperCase() }))} className={inputCls} placeholder="WEEKEND20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Discount %</label>
                  <input type="number" value={form.discountPct} onChange={(e) => setForm((p) => ({ ...p, discountPct: Number(e.target.value) }))} className={inputCls} min={0} max={100} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Valid Until</label>
                  <input type="date" value={form.validUntil} onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Display On</label>
                  <select value={form.displayPage} onChange={(e) => setForm((p) => ({ ...p, displayPage: e.target.value }))} className={inputCls}>
                    <option value="home">Home</option>
                    <option value="booking">Booking</option>
                    <option value="tempo">Tempo</option>
                    <option value="all">All Pages</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Link URL</label>
                <input value={form.linkUrl} onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))} className={inputCls} placeholder="/cars" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border-2 border-[#E4E5EF] font-bold text-sm text-[#4A4A6A]">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl btn-gradient text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Saving..." : "Save Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
