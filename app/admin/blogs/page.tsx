"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Plus, Search, Edit, Trash2, Eye, ImageIcon, ArrowLeft, Save, FileText, TrendingUp, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { adminBlogsApi } from "@/lib/api";
import { canDelete } from "@/lib/adminPermissions";

// Loaded only when the add/edit form actually mounts — keeps the list view
// (and the heavy Quill editor bundle) out of the initial page load.
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
  ssr: false,
  loading: () => <div className="h-[350px] border-[1.5px] border-[#E4E5EF] rounded-xl animate-pulse bg-[#F8F9FC]" />,
});

interface BlogRow {
  _id: string; title: string; slug: string; isPublished: boolean;
  views: number; createdAt: string; coverImage?: string;
}

interface BlogForm {
  title: string; slug: string; content: string;
  metaTitle: string; metaKeywords: string; metaDescription: string;
  image: File | null; status: "published" | "draft";
}

const emptyForm: BlogForm = {
  title: "", slug: "", content: "",
  metaTitle: "", metaKeywords: "", metaDescription: "",
  image: null, status: "draft",
};

const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none transition-colors";

const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [form, setForm] = useState<BlogForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingCoverImage, setExistingCoverImage] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [canDeleteBlog, setCanDeleteBlog] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setCanDeleteBlog(canDelete("content")); }, []);

  const fetchBlogs = useCallback(() => {
    setLoading(true);
    adminBlogsApi.getAll({ limit: 100 })
      .then(({ data }) => setBlogs(data.data || []))
      .catch(() => toast.error("Failed to load blogs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const filtered = blogs.filter(b =>
    !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.slug.includes(search)
  );

  const setField = <K extends keyof BlogForm>(f: K) => (val: BlogForm[K]) =>
    setForm(p => ({ ...p, [f]: val }));

  const handleTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    setForm(p => ({ ...p, title: t, slug: slugify(t), metaTitle: p.metaTitle || t }));
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm(p => ({ ...p, image: file }));
    if (file) setImagePreview(URL.createObjectURL(file));
    else setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("slug", form.slug);
      fd.append("content", form.content);
      fd.append("seoTitle", form.metaTitle);
      fd.append("seoKeywords", form.metaKeywords);
      fd.append("seoDescription", form.metaDescription);
      fd.append("isPublished", form.status === "published" ? "true" : "false");
      if (form.image) fd.append("coverImage", form.image);

      if (editId !== null) {
        await adminBlogsApi.update(editId, fd);
        toast.success("Blog updated!");
      } else {
        await adminBlogsApi.create(fd);
        toast.success(form.status === "published" ? "Blog published!" : "Draft saved!");
      }
      fetchBlogs();
      resetAndList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const resetAndList = () => {
    setForm(emptyForm); setEditId(null); setView("list");
    setImagePreview(""); setExistingCoverImage("");
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    try {
      await adminBlogsApi.remove(id);
      setBlogs(prev => prev.filter(b => b._id !== id));
      toast.success("Blog deleted");
    } catch {
      toast.error("Failed to delete blog");
    }
  };

  const startEdit = async (blog: BlogRow) => {
    setEditId(blog._id); setView("edit");
    try {
      const { data } = await adminBlogsApi.getOne(blog._id);
      const b = data.data;
      setForm({
        title: b.title, slug: b.slug, content: b.content || "",
        metaTitle: b.seoTitle || "", metaKeywords: b.seoKeywords || "", metaDescription: b.seoDescription || "",
        image: null, status: b.isPublished ? "published" : "draft",
      });
      setExistingCoverImage(b.coverImage || "");
    } catch {
      toast.error("Failed to load blog details");
      resetAndList();
    }
  };

  // ── Add / Edit View ──
  if (view === "add" || view === "edit") {
    return (
      <div className="p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={resetAndList}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E4E5EF] text-[#9090A8] hover:text-[#E8540A] hover:border-[#E8540A] transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-black font-syne text-2xl text-[#0F0F1A]">
              {view === "edit" ? "Edit Blog Post" : "Add New Blog Post"}
            </h1>
            <p className="text-[#9090A8] text-xs">Fill in the details below and publish when ready</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main Content Card */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4E5EF] bg-[#F8F9FC] flex items-center gap-2">
              <FileText size={16} className="text-[#E8540A]" />
              <h3 className="font-bold text-[#0F0F1A] text-sm">Blog Content</h3>
            </div>
            <div className="p-5 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#4A4A6A] uppercase tracking-wider mb-1.5">
                  Blog Title <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={handleTitle}
                  required
                  placeholder="Write an SEO-friendly blog title"
                  className={inputCls + " text-base font-medium"}
                />
                <p className="text-xs text-[#9090A8] mt-1">{form.title.length} chars — aim for 50-60 for best SEO</p>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Page URL (Slug)</label>
                <div className="flex items-center border-[1.5px] border-[#E4E5EF] focus-within:border-[#E8540A] rounded-xl overflow-hidden bg-white transition-colors">
                  <span className="px-3 py-2.5 text-xs text-[#9090A8] bg-[#F8F9FC] border-r border-[#E4E5EF] shrink-0">/blog/</span>
                  <input
                    value={form.slug}
                    onChange={e => setField("slug")(e.target.value)}
                    placeholder="auto-generated-from-title"
                    className="flex-1 px-3 py-2.5 text-sm outline-none text-[#0F0F1A] font-mono"
                  />
                </div>
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="block text-xs font-bold text-[#4A4A6A] uppercase tracking-wider mb-1.5">
                  Content <span className="text-[#EF4444]">*</span>
                </label>
                <RichTextEditor
                  value={form.content}
                  onChange={setField("content")}
                  placeholder="Write your full blog content here. Use headings, bullets, and images to make it engaging..."
                  minHeight={350}
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-xs font-bold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Featured Image</label>
                {imagePreview || existingCoverImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#E4E5EF]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview || existingCoverImage} alt="preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(""); setExistingCoverImage(""); setForm(p => ({ ...p, image: null })); if (fileRef.current) fileRef.current.value = ""; }}
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-1 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="relative flex items-center gap-3 border-2 border-dashed border-[#E4E5EF] rounded-xl p-5 cursor-pointer hover:border-[#E8540A]/60 hover:bg-[#FFF3ED] transition-all">
                    <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImage} />
                    <div className="w-12 h-12 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
                      <ImageIcon size={22} className="text-[#E8540A]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F0F1A]">Upload featured image</p>
                      <p className="text-xs text-[#9090A8]">JPG, PNG, WebP — max 5MB · Recommended 1200×628px</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* SEO Card */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4E5EF] bg-[#F8F9FC] flex items-center gap-2">
              <Globe size={16} className="text-[#7C3AED]" />
              <h3 className="font-bold text-[#0F0F1A] text-sm">SEO Meta</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Meta Title <span className="text-[10px] normal-case font-normal text-[#9090A8]">(60 chars max)</span></label>
                <input
                  value={form.metaTitle}
                  onChange={e => setField("metaTitle")(e.target.value)}
                  maxLength={60}
                  placeholder="SEO title | Veekay Cabs"
                  className={inputCls}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-[#9090A8]">Shown in Google search results</span>
                  <span className={cn("text-xs font-medium", form.metaTitle.length > 55 ? "text-[#EF4444]" : "text-[#9090A8]")}>{form.metaTitle.length}/60</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Meta Keywords</label>
                <input value={form.metaKeywords} onChange={e => setField("metaKeywords")(e.target.value)} placeholder="tempo traveller, self drive car, delhi ncr" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Meta Description <span className="text-[10px] normal-case font-normal text-[#9090A8]">(150 chars max)</span></label>
                <textarea
                  value={form.metaDescription}
                  onChange={e => setField("metaDescription")(e.target.value)}
                  maxLength={155}
                  rows={3}
                  placeholder="Write a compelling description that appears under the title in Google..."
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none resize-none transition-colors"
                />
                <div className="flex justify-end mt-1">
                  <span className={cn("text-xs font-medium", form.metaDescription.length > 145 ? "text-[#EF4444]" : "text-[#9090A8]")}>{form.metaDescription.length}/155</span>
                </div>
              </div>

              {/* Google preview */}
              {(form.metaTitle || form.slug) && (
                <div className="bg-[#F8F9FC] rounded-xl p-4 border border-[#E4E5EF]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9090A8] mb-2">Google Preview</p>
                  <div className="text-xs text-[#1A0DAB] font-medium mb-0.5 truncate">
                    {form.metaTitle || form.title || "Blog Title"}
                  </div>
                  <div className="text-[11px] text-[#006621] mb-1">
                    veekaycabs.com/blog/{form.slug || "your-slug"}
                  </div>
                  <div className="text-[11px] text-[#4D5156] line-clamp-2">
                    {form.metaDescription || "Meta description will appear here in search results..."}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Status toggle */}
            <select
              value={form.status}
              onChange={e => setField("status")(e.target.value as "published" | "draft")}
              className="border-[1.5px] border-[#E4E5EF] rounded-xl px-4 py-3 text-sm font-semibold text-[#4A4A6A] bg-white outline-none focus:border-[#E8540A]"
            >
              <option value="draft">Save as Draft</option>
              <option value="published">Publish</option>
            </select>
            <button type="submit" disabled={saving} className="flex items-center gap-2 btn-gradient px-8 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {form.status === "published" ? "Publish Blog" : "Save Draft"}
            </button>
            <button type="button" onClick={resetAndList} className="px-6 py-3 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm hover:bg-[#F8F9FC] transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  // ── List View ──
  const total = blogs.length;
  const published = blogs.filter(b => b.isPublished).length;
  const totalViews = blogs.reduce((s, b) => s + (b.views || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Blog Manager</h1>
          <p className="text-[#9090A8] text-sm">{total} total · {published} published · {totalViews.toLocaleString("en-IN")} total views</p>
        </div>
        <button onClick={() => setView("add")} className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-md">
          <Plus size={16} /> Add Blog
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Posts", value: total, icon: FileText, color: "#E8540A", bg: "#FFF3ED" },
          { label: "Published", value: published, icon: Globe, color: "#10B981", bg: "#D1FAE5" },
          { label: "Total Views", value: totalViews.toLocaleString("en-IN"), icon: TrendingUp, color: "#7C3AED", bg: "#F5F3FF" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-black text-[#0F0F1A]">{value}</p>
              <p className="text-[#9090A8] text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or slug..." className="w-full pl-10 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none transition-colors" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                {["#", "Title", "Slug", "Status", "Views", "Created", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F2F7]">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#9090A8] text-sm"><Loader2 size={18} className="animate-spin inline-block" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#9090A8] text-sm">No blogs found</td></tr>
              ) : filtered.map((blog, i) => (
                <tr key={blog._id} className={cn("hover:bg-[#FFF3ED] transition-colors", i % 2 === 1 ? "bg-[#F8F9FC]/40" : "")}>
                  <td className="px-5 py-4 text-[#9090A8] text-sm font-mono">{i + 1}</td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="font-semibold text-sm text-[#0F0F1A] line-clamp-2">{blog.title}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-lg max-w-[160px] block truncate">/{blog.slug}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", blog.isPublished ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEF3C7] text-[#92400E]")}>
                      {blog.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-sm text-[#0F0F1A]">{(blog.views || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 text-xs text-[#4A4A6A]">{fmtDate(blog.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      <a href={`/blogs/${blog.slug}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center" title="View live">
                        <Eye size={13} />
                      </a>
                      <button onClick={() => startEdit(blog)} className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#92400E] hover:bg-[#F59E0B] hover:text-white transition-colors flex items-center justify-center" title="Edit">
                        <Edit size={13} />
                      </button>
                      {canDeleteBlog && (
                        <button onClick={() => deleteBlog(blog._id)} className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#991B1B] hover:bg-[#EF4444] hover:text-white transition-colors flex items-center justify-center" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
