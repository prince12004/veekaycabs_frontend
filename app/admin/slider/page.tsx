"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, Edit2, X, Save, ImageIcon, ToggleLeft, ToggleRight, Loader2, GripVertical,
} from "lucide-react";
import { sliderApi } from "@/lib/api";

type Slide = {
  _id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  linkText: string;
  displayPage: string;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY_FORM = {
  title: "", subtitle: "", linkUrl: "", linkText: "Book Now",
  displayPage: "home", sortOrder: 0,
};

const inputCls =
  "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

export default function SliderPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    sliderApi.getAll().then((r) => setSlides(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (s: Slide) => {
    setEditing(s);
    setForm({ title: s.title, subtitle: s.subtitle || "", linkUrl: s.linkUrl || "", linkText: s.linkText || "Book Now", displayPage: s.displayPage || "home", sortOrder: s.sortOrder || 0 });
    setImageFile(null);
    setImagePreview(s.imageUrl || "");
    setShowModal(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile && !editing) return alert("Please select an image");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (imageFile) fd.append("image", imageFile);
      if (editing) {
        await sliderApi.update(editing._id, fd);
      } else {
        await sliderApi.create(fd);
      }
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slider?")) return;
    setDeleting(id);
    await sliderApi.remove(id).catch(() => {});
    setDeleting(null);
    load();
  };

  const toggleActive = async (s: Slide) => {
    const fd = new FormData();
    fd.append("isActive", String(!s.isActive));
    await sliderApi.update(s._id, fd).catch(() => {});
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Homepage Slider</h1>
          <p className="text-[#9090A8] text-sm">Manage hero banner images shown on the homepage</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm">
          <Plus size={16} /> Add Slide
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#9090A8] py-12 justify-center">
          <Loader2 size={20} className="animate-spin" /> Loading...
        </div>
      ) : slides.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4E5EF] py-16 text-center">
          <ImageIcon size={40} className="text-[#E4E5EF] mx-auto mb-3" />
          <p className="text-[#9090A8] font-medium">No slides yet. Add your first banner.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {slides.map((s) => (
            <div key={s._id} className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden shadow-sm">
              <div className="relative aspect-video bg-[#F8F9FC]">
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#E4E5EF]">
                    <ImageIcon size={40} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded-lg px-2 py-0.5 text-xs font-bold text-[#9090A8]">
                  #{s.sortOrder} · {s.displayPage}
                </div>
              </div>
              <div className="p-4">
                <p className="font-bold text-[#0F0F1A] text-sm truncate">{s.title}</p>
                {s.subtitle && <p className="text-xs text-[#9090A8] mt-0.5 truncate">{s.subtitle}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => openEdit(s)} className="flex items-center gap-1 text-xs font-semibold text-[#E8540A] hover:bg-[#E8540A]/10 px-3 py-1.5 rounded-lg transition-colors">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => toggleActive(s)} className="flex items-center gap-1 text-xs font-semibold text-[#4A4A6A] hover:bg-[#F8F9FC] px-3 py-1.5 rounded-lg transition-colors">
                    {s.isActive ? <ToggleRight size={14} className="text-green-600" /> : <ToggleLeft size={14} />}
                    {s.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    disabled={deleting === s._id}
                    className="ml-auto flex items-center gap-1 text-xs font-semibold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {deleting === s._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
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
              <h2 className="text-lg font-black font-syne text-[#0F0F1A]">
                {editing ? "Edit Slide" : "Add Slide"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#9090A8] hover:text-[#0F0F1A]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">
                  Banner Image *
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-[#E4E5EF] rounded-xl cursor-pointer hover:border-[#E8540A] transition-colors overflow-hidden"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="py-8 flex flex-col items-center gap-2 text-[#9090A8]">
                      <ImageIcon size={28} />
                      <span className="text-sm font-medium">Click to upload image</span>
                      <span className="text-xs">Recommended: 1280×480px, JPG/PNG/WebP</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Title *</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required className={inputCls} placeholder="e.g. Self Drive at Best Prices" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Subtitle</label>
                <input value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} className={inputCls} placeholder="e.g. Starting from ₹14/km" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Link URL</label>
                  <input value={form.linkUrl} onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))} className={inputCls} placeholder="/cars" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Button Text</label>
                  <input value={form.linkText} onChange={(e) => setForm((p) => ({ ...p, linkText: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Display On</label>
                  <select value={form.displayPage} onChange={(e) => setForm((p) => ({ ...p, displayPage: e.target.value }))} className={inputCls}>
                    <option value="home">Home Page</option>
                    <option value="tempo">Tempo Page</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))} className={inputCls} min={0} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border-2 border-[#E4E5EF] font-bold text-sm text-[#4A4A6A]">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl btn-gradient text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Saving..." : "Save Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
