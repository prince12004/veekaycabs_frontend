"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Globe, ArrowLeft, Save, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminCarSeoPagesAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { canDelete } from "@/lib/adminPermissions";

interface SeoPage {
  _id: string;
  pageName: string;
  pageSlug: string;
  metaTitle: string;
  metaKeywords?: string;
  metaDescription: string;
  h1Tag?: string;
  createdAt: string;
}

interface PageForm { pageName: string; metaTitle: string; keyword: string; description: string; h1Tag: string; link: string }
const emptyForm: PageForm = { pageName: "", metaTitle: "", keyword: "", description: "", h1Tag: "", link: "" };
const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

export default function SeoPage() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [form, setForm] = useState<PageForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [canDeletePage, setCanDeletePage] = useState(false);

  useEffect(() => { setCanDeletePage(canDelete("seoPages")); }, []);

  const loadPages = () => {
    setLoading(true);
    adminCarSeoPagesAPI.getAll()
      .then(({ data }) => setPages(data?.data || []))
      .catch(() => toast.error("Failed to load SEO pages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPages(); }, []);

  const filtered = pages.filter(p => !search || p.pageName.toLowerCase().includes(search.toLowerCase()) || (p.metaKeywords || "").toLowerCase().includes(search.toLowerCase()));

  const update = (f: keyof PageForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      pageName: form.pageName,
      pageSlug: form.link.replace(/^\/+/, ""),
      metaTitle: form.metaTitle,
      metaKeywords: form.keyword,
      metaDescription: form.description,
      h1Tag: form.h1Tag,
    };
    try {
      if (editId !== null) {
        await adminCarSeoPagesAPI.update(editId, payload);
        toast.success("Page updated");
      } else {
        await adminCarSeoPagesAPI.create(payload);
        toast.success("SEO page created");
      }
      setForm(emptyForm); setEditId(null); setView("list");
      loadPages();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: SeoPage) => {
    setForm({ pageName: p.pageName, metaTitle: p.metaTitle, keyword: p.metaKeywords || "", description: p.metaDescription, h1Tag: p.h1Tag || "", link: p.pageSlug });
    setEditId(p._id); setView("edit");
  };

  const deletePage = async (id: string) => {
    if (!confirm("Delete this SEO page?")) return;
    try {
      await adminCarSeoPagesAPI.remove(id);
      setPages(prev => prev.filter(p => p._id !== id));
      toast.success("Page deleted");
    } catch {
      toast.error("Failed to delete page");
    }
  };

  if (view === "add" || view === "edit") {
    return (
      <div className="p-6 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => { setView("list"); setForm(emptyForm); setEditId(null); }} className="text-[#9090A8] hover:text-[#E8540A]"><ArrowLeft size={20} /></button>
          <h1 className="font-black font-syne text-2xl text-[#0F0F1A]">{view === "edit" ? "Edit SEO Page" : "Add SEO Page"}</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E4E5EF] p-6 space-y-4">
          {[
            { field: "pageName" as const, label: "Page Name", placeholder: "Self-drive car rental in Delhi" },
            { field: "link" as const, label: "Page Slug", placeholder: "self-drive-car-rental-delhi" },
            { field: "metaTitle" as const, label: "Meta Title (60 chars)", placeholder: "Self Drive Car Rental in Delhi | Veekay Cabs" },
            { field: "keyword" as const, label: "Meta Keyword", placeholder: "self drive car rental delhi" },
            { field: "h1Tag" as const, label: "H1 Tag", placeholder: "self drive car rental in delhi" },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">{label} <span className="text-[#EF4444]">*</span></label>
              <input value={form[field]} onChange={update(field)} placeholder={placeholder} required className={inputCls} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Meta Description (150 chars) <span className="text-[#EF4444]">*</span></label>
            <textarea value={form.description} onChange={update("description")} required rows={3} placeholder="Rent a self drive car in... with Veekay Cabs." className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none resize-none" />
            <p className="text-xs text-[#9090A8] mt-1">{form.description.length}/150 characters</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 btn-gradient px-8 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {view === "edit" ? "Update Page" : "Add SEO Page"}
            </button>
            <button type="button" onClick={() => { setView("list"); setForm(emptyForm); }} className="px-6 py-3.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">SEO Page Manager</h1>
          <p className="text-[#9090A8] text-sm">{pages.length} SEO pages</p>
        </div>
        <button onClick={() => setView("add")} className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm">
          <Plus size={16} /> Add SEO Page
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by page name or keyword..." className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#E8540A]" />
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                {["#", "Page Name", "Meta Title", "Keyword", "H1 Tag", "Link", "Created", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p._id} className={cn("border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors", i % 2 === 1 ? "bg-[#F8F9FC]/50" : "")}>
                  <td className="px-4 py-4 text-[#9090A8] text-sm">{i + 1}</td>
                  <td className="px-4 py-4 max-w-[200px]">
                    <p className="font-semibold text-sm text-[#0F0F1A] line-clamp-2">{p.pageName}</p>
                  </td>
                  <td className="px-4 py-4 max-w-[200px]">
                    <p className="text-xs text-[#4A4A6A] line-clamp-2">{p.metaTitle}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs text-[#4A4A6A] max-w-[150px] truncate">{p.metaKeywords}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs text-[#4A4A6A] max-w-[150px] truncate">{p.h1Tag}</p>
                  </td>
                  <td className="px-4 py-4">
                    <a href={`https://veekaycabs.com/car/${p.pageSlug}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-[#E8540A] font-mono hover:underline">
                      <Globe size={11} /> /seo/{p.pageSlug} <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="px-4 py-4 text-xs text-[#9090A8]">{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => startEdit(p)} className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#92400E] hover:bg-[#F59E0B] hover:text-white transition-colors flex items-center justify-center"><Edit size={13} /></button>
                      {canDeletePage && (
                        <button onClick={() => deletePage(p._id)} className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#991B1B] hover:bg-[#EF4444] hover:text-white transition-colors flex items-center justify-center"><Trash2 size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
