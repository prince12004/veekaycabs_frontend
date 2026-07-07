"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, MapPin, ToggleLeft, ToggleRight, X, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { adminCitiesApi } from "@/lib/api";

interface City {
  _id: string; name: string; slug: string; state: string;
  isActive: boolean; carsCount: number;
}

interface CityForm { name: string; slug: string; state: string }
const emptyForm: CityForm = { name: "", slug: "", state: "" };
const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CityForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCities = useCallback(() => {
    setLoading(true);
    adminCitiesApi.getAll()
      .then(({ data }) => setCities(data.data || []))
      .catch(() => toast.error("Failed to load cities"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  const update = (f: keyof CityForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [f]: e.target.value }));
  const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId !== null) {
        await adminCitiesApi.update(editId, { ...form });
        toast.success("City updated!");
      } else {
        await adminCitiesApi.create(form);
        toast.success("City added!");
      }
      fetchCities();
      setForm(emptyForm); setEditId(null); setShowForm(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save city");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (city: City) => {
    setForm({ name: city.name, slug: city.slug, state: city.state });
    setEditId(city._id); setShowForm(true);
  };

  const toggleCity = async (city: City) => {
    const next = !city.isActive;
    setCities(prev => prev.map(c => c._id === city._id ? { ...c, isActive: next } : c));
    try {
      await adminCitiesApi.update(city._id, { isActive: next });
    } catch {
      setCities(prev => prev.map(c => c._id === city._id ? { ...c, isActive: city.isActive } : c));
      toast.error("Failed to update city status");
    }
  };

  const deleteCity = async (id: string) => {
    if (!confirm("Deactivate this city?")) return;
    try {
      await adminCitiesApi.remove(id);
      fetchCities();
      toast.success("City deactivated");
    } catch {
      toast.error("Failed to deactivate city");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Manage Cities</h1>
          <p className="text-[#9090A8] text-sm">{cities.length} cities · {cities.filter(c => c.isActive).length} active</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm">
          <Plus size={16} /> Add City
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#E8540A]" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map(city => (
            <div key={city._id} className={cn("bg-white rounded-2xl border p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all", city.isActive ? "border-[#E4E5EF]" : "border-[#E4E5EF] opacity-60")}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
                  <MapPin size={18} className="text-[#E8540A]" />
                </div>
                <button onClick={() => toggleCity(city)} className={cn("flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full transition-colors", city.isActive ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]")}>
                  {city.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {city.isActive ? "Active" : "Inactive"}
                </button>
              </div>
              <h3 className="font-black text-xl text-[#0F0F1A]">{city.name}</h3>
              <p className="text-[#9090A8] text-sm">{city.state}</p>
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="bg-[#F8F9FC] text-[#4A4A6A] font-mono px-2 py-1 rounded-lg">/{city.slug}</span>
                <span className="text-[#4A4A6A] font-semibold">{city.carsCount} cars</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => startEdit(city)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#E4E5EF] text-xs font-bold text-[#4A4A6A] hover:border-[#E8540A] hover:text-[#E8540A] transition-colors">
                  <Edit size={12} /> Edit
                </button>
                <button onClick={() => deleteCity(city._id)} className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#991B1B] hover:bg-[#EF4444] hover:text-white transition-colors flex items-center justify-center">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E5EF]">
              <h3 className="font-black font-syne text-[#0F0F1A]">{editId !== null ? "Edit City" : "Add City"}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">City Name <span className="text-[#EF4444]">*</span></label>
                <input value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) })); }} required placeholder="e.g. Delhi" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Slug</label>
                <input value={form.slug} onChange={update("slug")} placeholder="auto-generated" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">State <span className="text-[#EF4444]">*</span></label>
                <input value={form.state} onChange={update("state")} required placeholder="e.g. Delhi" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 btn-gradient py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {editId !== null ? "Update" : "Add City"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-5 py-3 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
