"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, Search, Edit, Trash2, ExternalLink, Globe } from "lucide-react";

interface SeoPage {
  _id: string;
  pageName: string;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  h1Tag: string;
  pageSlug: string;
  createdAt: string;
}

export default function TempoSeoListPage() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data } = await adminApi.get("/api/admin/tempo-seo");
      setPages(data.data || []);
    } catch {
      toast.error("Failed to load SEO pages");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this SEO page?")) return;
    try {
      await adminApi.delete(`/api/admin/tempo-seo/${id}`);
      setPages(prev => prev.filter(p => p._id !== id));
      toast.success("Page deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = pages.filter(p =>
    !search || p.pageName.toLowerCase().includes(search.toLowerCase()) ||
    p.metaTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">SEO Pages</h1>
          <p className="text-[#9090A8] text-sm">Manage SEO metadata for Tempo Traveller pages</p>
        </div>
        <Link href="/admin/tempo-admin/seo/add" className="px-5 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#9D4EDD] text-white font-semibold text-sm rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_4px_14px_rgba(124,58,237,0.3)]">
          <Plus size={16} /> Add SEO Page
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pages..." className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E5EF]">
          <h2 className="font-bold text-[#0F0F1A] text-sm uppercase tracking-wider">PAGE LIST</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-[#9090A8]">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Globe size={40} className="mx-auto text-[#E4E5EF] mb-3" />
            <p className="text-[#9090A8]">{search ? "No pages match your search" : "No SEO pages yet"}</p>
            <Link href="/admin/tempo-admin/seo/add" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-semibold">
              <Plus size={14} /> Add First Page
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                  {["Sr. No.", "Page Name", "Meta Title", "Keyword", "Description", "H1 Tag", "Link", "Created At", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-[#9090A8] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((page, i) => (
                  <tr key={page._id} className="border-b border-[#F0F1F6] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3 text-sm text-[#9090A8]">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-[#0F0F1A] text-sm">{page.pageName}</td>
                    <td className="px-4 py-3 text-sm text-[#4A4A6A] max-w-[160px]">
                      <p className="truncate">{page.metaTitle}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4A4A6A] max-w-[120px]">
                      <p className="truncate">{page.metaKeywords}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4A4A6A] max-w-[200px]">
                      <p className="line-clamp-2">{page.metaDescription}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4A4A6A]">{page.h1Tag || "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/tempo-traveller/${page.pageSlug}`} target="_blank" className="px-3 py-1.5 bg-[#DBEAFE] text-[#3B82F6] text-xs font-semibold rounded-lg flex items-center gap-1 w-fit hover:bg-[#3B82F6] hover:text-white transition-all">
                        <ExternalLink size={11} />
                        Page Link
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9090A8] whitespace-nowrap">{fmt(page.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/admin/tempo-admin/seo/add?edit=${page._id}`} className="w-7 h-7 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-[#F59E0B] hover:bg-[#F59E0B] hover:text-white transition-all">
                          <Edit size={12} />
                        </Link>
                        <button onClick={() => handleDelete(page._id)} className="w-7 h-7 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-all">
                          <Trash2 size={12} />
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
