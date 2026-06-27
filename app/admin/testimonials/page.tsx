"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Edit2, X, Save, Star, Loader2, MessageSquare, ToggleLeft, ToggleRight } from "lucide-react";
import { testimonialsApi } from "@/lib/api";

type Testimonial = {
  _id: string;
  name: string;
  city: string;
  rating: number;
  review: string;
  carBooked: string;
  avatarUrl: string;
  isActive: boolean;
  showOnHome: boolean;
  source: string;
  sortOrder: number;
};

const EMPTY_FORM = { name: "", city: "", rating: 5, review: "", carBooked: "", source: "google", showOnHome: true, sortOrder: 0 };
const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    testimonialsApi.getAll().then((r) => setItems(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setAvatarFile(null); setAvatarPreview(""); setShowModal(true);
  };
  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({ name: t.name, city: t.city || "", rating: t.rating, review: t.review, carBooked: t.carBooked || "", source: t.source, showOnHome: t.showOnHome, sortOrder: t.sortOrder });
    setAvatarFile(null); setAvatarPreview(t.avatarUrl || ""); setShowModal(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (avatarFile) fd.append("avatar", avatarFile);
      if (editing) {
        await testimonialsApi.update(editing._id, fd);
      } else {
        await testimonialsApi.create(fd);
      }
      setShowModal(false); load();
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    setDeleting(id);
    await testimonialsApi.remove(id).catch(() => {});
    setDeleting(null); load();
  };

  const toggleActive = async (t: Testimonial) => {
    const fd = new FormData(); fd.append("isActive", String(!t.isActive));
    await testimonialsApi.update(t._id, fd).catch(() => {});
    load();
  };

  const stars = (n: number) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} size={12} fill={i < n ? "#F59E0B" : "none"} className={i < n ? "text-amber-400" : "text-[#E4E5EF]"} />
  ));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Testimonials</h1>
          <p className="text-[#9090A8] text-sm">Customer reviews shown on the homepage</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm">
          <Plus size={16} /> Add Review
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#9090A8] py-12 justify-center"><Loader2 size={20} className="animate-spin" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4E5EF] py-16 text-center">
          <MessageSquare size={40} className="text-[#E4E5EF] mx-auto mb-3" />
          <p className="text-[#9090A8] font-medium">No testimonials yet. Add your first review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((t) => (
            <div key={t._id} className={`bg-white rounded-2xl border shadow-sm p-5 ${t.isActive ? "border-[#E4E5EF]" : "border-[#E4E5EF] opacity-60"}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                  {t.avatarUrl ? <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" /> : t.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#0F0F1A] truncate">{t.name}</p>
                  <p className="text-xs text-[#9090A8]">{t.city} {t.carBooked && `· ${t.carBooked}`}</p>
                  <div className="flex mt-1">{stars(t.rating)}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {t.isActive ? "Active" : "Hidden"}
                </span>
              </div>
              <p className="text-sm text-[#4A4A6A] line-clamp-3 mb-4">{t.review}</p>
              <div className="flex items-center gap-2 pt-3 border-t border-[#E4E5EF]">
                <button onClick={() => openEdit(t)} className="flex items-center gap-1 text-xs font-semibold text-[#E8540A] hover:bg-[#E8540A]/10 px-3 py-1.5 rounded-lg">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => toggleActive(t)} className="flex items-center gap-1 text-xs font-semibold text-[#4A4A6A] hover:bg-[#F8F9FC] px-3 py-1.5 rounded-lg">
                  {t.isActive ? <ToggleRight size={14} className="text-green-600" /> : <ToggleLeft size={14} />}
                  {t.isActive ? "Hide" : "Show"}
                </button>
                <button onClick={() => handleDelete(t._id)} disabled={deleting === t._id} className="ml-auto text-xs font-semibold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg">
                  {deleting === t._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E4E5EF]">
              <h2 className="text-lg font-black font-syne text-[#0F0F1A]">{editing ? "Edit Review" : "Add Review"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-16 h-16 rounded-full bg-[#F8F9FC] border-2 border-dashed border-[#E4E5EF] flex items-center justify-center cursor-pointer hover:border-[#E8540A] transition-colors overflow-hidden shrink-0"
                >
                  {avatarPreview ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-xs text-[#9090A8] text-center px-1">Photo</span>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Name *</label>
                    <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className={inputCls} placeholder="Rahul Sharma" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">City</label>
                    <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className={inputCls} placeholder="Delhi" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Car Booked</label>
                  <input value={form.carBooked} onChange={(e) => setForm((p) => ({ ...p, carBooked: e.target.value }))} className={inputCls} placeholder="Hyundai Creta" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Source</label>
                  <select value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} className={inputCls}>
                    <option value="google">Google</option>
                    <option value="facebook">Facebook</option>
                    <option value="direct">Direct</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setForm((p) => ({ ...p, rating: n }))} className="transition-transform hover:scale-110">
                      <Star size={24} fill={n <= form.rating ? "#F59E0B" : "none"} className={n <= form.rating ? "text-amber-400" : "text-[#E4E5EF]"} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Review *</label>
                <textarea value={form.review} onChange={(e) => setForm((p) => ({ ...p, review: e.target.value }))} required rows={4} className={inputCls + " resize-none"} placeholder="Write the customer's review here..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))} className={inputCls} min={0} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showOnHome} onChange={(e) => setForm((p) => ({ ...p, showOnHome: e.target.checked }))} className="w-4 h-4 accent-[#E8540A]" />
                    <span className="text-sm font-semibold text-[#4A4A6A]">Show on Homepage</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border-2 border-[#E4E5EF] font-bold text-sm text-[#4A4A6A]">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl btn-gradient text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Saving..." : "Save Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
