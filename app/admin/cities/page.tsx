"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, MapPin, ToggleLeft, ToggleRight, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const CITIES = [
  { id: 1, name: "Delhi", slug: "delhi", state: "Delhi", active: true, carsCount: 52 },
  { id: 2, name: "Noida", slug: "noida", state: "Uttar Pradesh", active: true, carsCount: 28 },
  { id: 3, name: "Gurgaon", slug: "gurgaon", state: "Haryana", active: true, carsCount: 15 },
  { id: 4, name: "Ghaziabad", slug: "ghaziabad", state: "Uttar Pradesh", active: true, carsCount: 6 },
  { id: 5, name: "Greater Noida", slug: "greater-noida", state: "Uttar Pradesh", active: false, carsCount: 0 },
];

interface CityForm { name: string; slug: string; state: string }
const emptyForm: CityForm = { name: "", slug: "", state: "" };
const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

export default function CitiesPage() {
  const [cities, setCities] = useState(CITIES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CityForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);

  const update = (f: keyof CityForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [f]: e.target.value }));
  const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId !== null) {
      setCities(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c));
    } else {
      setCities(prev => [...prev, { id: Date.now(), ...form, active: true, carsCount: 0 }]);
    }
    setForm(emptyForm); setEditId(null); setShowForm(false);
  };

  const startEdit = (city: (typeof CITIES)[0]) => {
    setForm({ name: city.name, slug: city.slug, state: city.state });
    setEditId(city.id); setShowForm(true);
  };

  const toggleCity = (id: number) => setCities(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  const deleteCity = (id: number) => setCities(prev => prev.filter(c => c.id !== id));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Manage Cities</h1>
          <p className="text-[#9090A8] text-sm">{cities.length} cities · {cities.filter(c => c.active).length} active</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm">
          <Plus size={16} /> Add City
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map(city => (
          <div key={city.id} className={cn("bg-white rounded-2xl border p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all", city.active ? "border-[#E4E5EF]" : "border-[#E4E5EF] opacity-60")}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
                <MapPin size={18} className="text-[#E8540A]" />
              </div>
              <button onClick={() => toggleCity(city.id)} className={cn("flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full transition-colors", city.active ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]")}>
                {city.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {city.active ? "Active" : "Inactive"}
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
              <button onClick={() => deleteCity(city.id)} className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#991B1B] hover:bg-[#EF4444] hover:text-white transition-colors flex items-center justify-center">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

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
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 btn-gradient py-3 rounded-xl text-white font-bold text-sm"><Save size={15} /> {editId !== null ? "Update" : "Add City"}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-5 py-3 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
