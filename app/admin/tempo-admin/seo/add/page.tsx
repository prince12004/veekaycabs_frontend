"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";

const PAGE_OPTIONS = [
  "Tempo Traveller in Delhi",
  "Tempo Traveller in Noida",
  "Tempo Traveller in Gurgaon",
  "Tempo Traveller in Ghaziabad",
  "Tempo Traveller in Greater Noida",
  "9 Seater Tempo Traveller",
  "12 Seater Tempo Traveller",
  "17 Seater Tempo Traveller",
  "20 Seater Tempo Traveller",
  "26 Seater Tempo Traveller",
  "Luxury Tempo Traveller",
  "Custom",
];

export default function AddTempoSeoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    selectPage: "",
    pageName: "",
    metaTitle: "",
    metaKeywords: "",
    metaDescription: "",
    h1Tag: "",
    author: "",
    robots: "index, follow",
    sortContent: "",
    content: "",
  });

  useEffect(() => {
    if (editId) loadPage(editId);
  }, [editId]);

  const loadPage = async (id: string) => {
    try {
      const { data } = await adminApi.get(`/api/admin/tempo-seo/${id}`);
      const p = data.data;
      setForm({
        selectPage: "Custom",
        pageName: p.pageName,
        metaTitle: p.metaTitle,
        metaKeywords: p.metaKeywords || "",
        metaDescription: p.metaDescription,
        h1Tag: p.h1Tag || "",
        author: p.author || "",
        robots: p.robots || "index, follow",
        sortContent: p.sortContent || "",
        content: p.content || "",
      });
    } catch {
      toast.error("Failed to load page");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "selectPage" && value !== "Custom") {
      setForm(prev => ({ ...prev, selectPage: value, pageName: value }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pageName || !form.metaTitle || !form.metaDescription) {
      toast.error("Page name, meta title, and description are required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        pageName: form.pageName,
        metaTitle: form.metaTitle,
        metaKeywords: form.metaKeywords,
        metaDescription: form.metaDescription,
        h1Tag: form.h1Tag,
        author: form.author,
        robots: form.robots,
        sortContent: form.sortContent,
        content: form.content,
      };
      if (editId) {
        await adminApi.put(`/api/admin/tempo-seo/${editId}`, payload);
        toast.success("SEO page updated!");
      } else {
        await adminApi.post("/api/admin/tempo-seo", payload);
        toast.success("SEO page created!");
      }
      router.push("/admin/tempo-admin/seo");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">{editId ? "Edit SEO Page" : "Add Page"}</h1>
        <p className="text-[#9090A8] text-sm mt-1">Manage SEO metadata for tempo traveller location pages</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E4E5EF]">
            <h2 className="font-bold text-[#0F0F1A] text-sm uppercase tracking-wider">MANAGE PAGE</h2>
          </div>

          {/* Select Page */}
          <div>
            <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Select Page</label>
            <select name="selectPage" value={form.selectPage} onChange={handleChange} className="w-full px-4 py-3 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none bg-white">
              <option value="">Select Page</option>
              {PAGE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Page Title (Name) <span className="text-red-500">*</span></label>
            <input name="pageName" value={form.pageName} onChange={handleChange} placeholder="Page Name" className="w-full px-4 py-3 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Meta Title <span className="text-red-500">*</span></label>
            <input name="metaTitle" value={form.metaTitle} onChange={handleChange} placeholder="Meta Title" className="w-full px-4 py-3 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Meta Keywords</label>
            <textarea name="metaKeywords" value={form.metaKeywords} onChange={handleChange} rows={2} placeholder="Enter Keywords" className="w-full px-4 py-3 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none resize-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Meta Description <span className="text-red-500">*</span></label>
            <textarea name="metaDescription" value={form.metaDescription} onChange={handleChange} rows={3} placeholder="Enter meta description" className="w-full px-4 py-3 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none resize-none" required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Page H1 Tag</label>
            <textarea name="h1Tag" value={form.h1Tag} onChange={handleChange} rows={2} placeholder="Enter h1 tag" className="w-full px-4 py-3 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Author</label>
              <input name="author" value={form.author} onChange={handleChange} placeholder="Enter author" className="w-full px-4 py-3 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Robots</label>
              <input name="robots" value={form.robots} onChange={handleChange} placeholder="index, follow" className="w-full px-4 py-3 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Sort Content</label>
            <textarea name="sortContent" value={form.sortContent} onChange={handleChange} rows={2} placeholder="Enter short content" className="w-full px-4 py-3 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none resize-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Content</label>
            <textarea name="content" value={form.content} onChange={handleChange} rows={8} placeholder="Page content (HTML supported)..." className="w-full px-4 py-3 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none resize-none font-mono" />
            <p className="text-xs text-[#9090A8] mt-1">HTML content supported</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-[#7C3AED] to-[#9D4EDD] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_4px_14px_rgba(124,58,237,0.4)]"
            >
              {loading ? "Saving..." : editId ? "Update Page" : "Add Page"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
