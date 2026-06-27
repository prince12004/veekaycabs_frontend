"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Users, IndianRupee, MapPin } from "lucide-react";

interface Tempo {
  _id: string;
  name: string;
  registrationNo: string;
  seats: number;
  fuel: string;
  location: string;
  basePrice: number;
  pricePerDay: number;
  pricePerKm: number;
  isActive: boolean;
  showOnTop: boolean;
  images: string[];
  slug: string;
  createdAt: string;
}

export default function TempoListPage() {
  const [tempos, setTempos] = useState<Tempo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTempos();
  }, []);

  const fetchTempos = async () => {
    try {
      const { data } = await adminApi.get("/api/admin/tempo");
      setTempos(data.data || []);
    } catch {
      toast.error("Failed to load tempos");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const { data } = await adminApi.patch(`/api/admin/tempo/${id}/toggle`);
      setTempos(prev => prev.map(t => t._id === id ? { ...t, isActive: data.data.isActive } : t));
      toast.success(data.message);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tempo traveller?")) return;
    try {
      await adminApi.delete(`/api/admin/tempo/${id}`);
      setTempos(prev => prev.filter(t => t._id !== id));
      toast.success("Tempo deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = tempos.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.registrationNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Manage Tempo Listing</h1>
          <p className="text-[#9090A8] text-sm">{tempos.length} total · {tempos.filter(t => t.isActive).length} active</p>
        </div>
        <Link href="/admin/tempo-admin" className="px-5 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#9D4EDD] text-white font-semibold text-sm rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_4px_14px_rgba(124,58,237,0.3)]">
          <Plus size={16} /> Add Tempo
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tempos", value: tempos.length, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "Active", value: tempos.filter(t => t.isActive).length, color: "#10B981", bg: "#D1FAE5" },
          { label: "Hidden", value: tempos.filter(t => !t.isActive).length, color: "#9090A8", bg: "#F1F2F7" },
          { label: "Featured", value: tempos.filter(t => t.showOnTop).length, color: "#F59E0B", bg: "#FEF3C7" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: bg }}>🚐</div>
            <div>
              <p className="text-2xl font-black text-[#0F0F1A] font-syne leading-none" style={{ color }}>{value}</p>
              <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or vehicle number..." className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E5EF] flex items-center justify-between">
          <h2 className="font-bold text-[#0F0F1A] text-sm uppercase tracking-wider">MANAGE TEMPO LISTING</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-[#9090A8]">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🚐</div>
            <p className="text-[#9090A8]">{search ? "No tempos match your search" : "No tempos added yet"}</p>
            <Link href="/admin/tempo-admin" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-semibold">
              <Plus size={14} /> Add First Tempo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                  {["Sr.", "Name", "Place", "Seats", "Price", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-[#9090A8] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tempo, i) => (
                  <tr key={tempo._id} className="border-b border-[#F0F1F6] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[#9090A8]">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {tempo.images?.[0] ? (
                          <img src={tempo.images[0]} alt={tempo.name} className="w-12 h-9 object-cover rounded-lg border border-[#E4E5EF]" />
                        ) : (
                          <div className="w-12 h-9 rounded-lg bg-[#F5F3FF] flex items-center justify-center text-lg">🚐</div>
                        )}
                        <div>
                          <p className="font-bold text-[#0F0F1A] text-sm">{tempo.name}</p>
                          <p className="text-[#9090A8] text-xs font-mono">{tempo.registrationNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-[#4A4A6A]">
                        <MapPin size={12} className="text-[#9090A8]" />
                        {tempo.location}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm font-semibold text-[#0F0F1A]">
                        <Users size={13} className="text-[#7C3AED]" />
                        {tempo.seats}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5 text-sm font-bold text-[#0F0F1A]">
                        <IndianRupee size={12} />
                        {tempo.basePrice.toLocaleString("en-IN")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/tempo-admin/edit?id=${tempo._id}`} className="w-8 h-8 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-[#F59E0B] hover:bg-[#F59E0B] hover:text-white transition-all">
                          <Edit size={13} />
                        </Link>
                        <button onClick={() => handleDelete(tempo._id)} className="w-8 h-8 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-all">
                          <Trash2 size={13} />
                        </button>
                        <button onClick={() => handleToggle(tempo._id)} className={`px-3 h-8 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${tempo.isActive ? "bg-[#FEE2E2] text-[#EF4444] hover:bg-[#EF4444] hover:text-white" : "bg-[#D1FAE5] text-[#10B981] hover:bg-[#10B981] hover:text-white"}`}>
                          {tempo.isActive ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Show</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 text-xs text-[#9090A8] border-t border-[#F0F1F6]">
              Showing 1 to {filtered.length} of {filtered.length} entries
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
