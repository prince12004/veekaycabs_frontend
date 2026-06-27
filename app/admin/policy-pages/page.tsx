"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, FileText, ChevronRight } from "lucide-react";
import { policyApi } from "@/lib/api";
import dynamic from "next/dynamic";

const QuillEditor = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const PAGES = [
  { key: "about",        label: "About Us",            icon: "🏢" },
  { key: "privacy",      label: "Privacy Policy",       icon: "🔒" },
  { key: "terms",        label: "Terms & Conditions",   icon: "📋" },
  { key: "refund",       label: "Refund Policy",        icon: "💰" },
  { key: "cancellation", label: "Cancellation Policy",  icon: "🚫" },
];

const TOOLBAR = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["link"],
    ["clean"],
  ],
};

const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

type PageData = { pageKey: string; title: string; content: string; metaTitle?: string; metaDesc?: string };

export default function PolicyPagesAdmin() {
  const [activeKey, setActiveKey] = useState("about");
  const [pageData, setPageData] = useState<Record<string, PageData>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = pageData[activeKey];

  const loadPage = async (key: string) => {
    if (pageData[key]) return;
    setLoading(true);
    try {
      const res = await policyApi.getPage(key);
      setPageData((p) => ({ ...p, [key]: res.data.data }));
    } catch {
      const found = PAGES.find((p) => p.key === key);
      setPageData((p) => ({ ...p, [key]: { pageKey: key, title: found?.label || key, content: "" } }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPage(activeKey); }, [activeKey]);

  const updateField = (field: keyof PageData, val: string) => {
    setPageData((prev) => ({ ...prev, [activeKey]: { ...prev[activeKey], [field]: val } }));
  };

  const handleSave = async () => {
    if (!current) return;
    setSaving(true);
    try {
      await policyApi.upsert(activeKey, {
        title: current.title,
        content: current.content,
        metaTitle: current.metaTitle,
        metaDesc: current.metaDesc,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 flex gap-6">
      {/* Sidebar */}
      <div className="w-56 shrink-0">
        <h1 className="text-xl font-black text-[#0F0F1A] font-syne mb-4">Policy Pages</h1>
        <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden shadow-sm">
          {PAGES.map((page) => (
            <button
              key={page.key}
              onClick={() => setActiveKey(page.key)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-left transition-colors border-b border-[#E4E5EF] last:border-0 ${
                activeKey === page.key
                  ? "bg-[#E8540A]/10 text-[#E8540A]"
                  : "text-[#4A4A6A] hover:bg-[#F8F9FC]"
              }`}
            >
              <span className="text-base">{page.icon}</span>
              <span className="flex-1">{page.label}</span>
              {activeKey === page.key && <ChevronRight size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="flex items-center gap-2 text-[#9090A8] py-12 justify-center">
            <Loader2 size={20} className="animate-spin" /> Loading page...
          </div>
        ) : current ? (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
              <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF] flex items-center gap-2">
                <FileText size={16} className="text-[#E8540A]" />
                {PAGES.find((p) => p.key === activeKey)?.label}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Page Title</label>
                  <input value={current.title || ""} onChange={(e) => updateField("title", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-2">Content</label>
                  <div className="border border-[#E4E5EF] rounded-xl overflow-hidden">
                    <QuillEditor
                      value={current.content || ""}
                      onChange={(val) => updateField("content", val)}
                      modules={TOOLBAR}
                      theme="snow"
                      style={{ minHeight: "320px" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
              <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-4 pb-3 border-b border-[#E4E5EF]">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">
                    Meta Title <span className="text-[#9090A8] normal-case font-normal">({(current.metaTitle || "").length}/60)</span>
                  </label>
                  <input value={current.metaTitle || ""} onChange={(e) => updateField("metaTitle", e.target.value)} className={inputCls} maxLength={60} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">
                    Meta Description <span className="text-[#9090A8] normal-case font-normal">({(current.metaDesc || "").length}/155)</span>
                  </label>
                  <textarea value={current.metaDesc || ""} onChange={(e) => updateField("metaDesc", e.target.value)} rows={2} className={inputCls + " resize-none"} maxLength={155} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 btn-gradient px-8 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving..." : "Save Page"}
              </button>
              {saved && <span className="text-[#10B981] font-semibold text-sm">✓ Saved successfully!</span>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
