"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, Facebook, Instagram, Linkedin, Youtube, Twitter, Loader2 } from "lucide-react";
import { settingsApi } from "@/lib/api";

const SOCIAL = [
  { key: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2", placeholder: "https://www.facebook.com/veekaycabs" },
  { key: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", placeholder: "veekay_cabs" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0A66C2", placeholder: "https://www.linkedin.com/company/veekaycabs/" },
  { key: "youtube", label: "YouTube", icon: Youtube, color: "#FF0000", placeholder: "https://www.youtube.com/@veekaycabs" },
  { key: "twitter", label: "X (Twitter)", icon: Twitter, color: "#000000", placeholder: "https://x.com/veekaycabs" },
];

type SocialForm = { facebook: string; instagram: string; linkedin: string; youtube: string; twitter: string };

const EMPTY: SocialForm = { facebook: "", instagram: "", linkedin: "", youtube: "", twitter: "" };

export default function SocialMediaPage() {
  const [form, setForm] = useState<SocialForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    settingsApi.get().then((res) => {
      const d = res.data.data;
      setForm({
        facebook: d.facebook || "",
        instagram: d.instagram || "",
        linkedin: d.linkedin || "",
        youtube: d.youtube || "",
        twitter: d.twitter || "",
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await settingsApi.update(form as unknown as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 flex items-center gap-2 text-[#9090A8]">
        <Loader2 size={18} className="animate-spin" /> Loading...
      </div>
    );

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Social Media Links</h1>
        <p className="text-[#9090A8] text-sm">Manage all social media links shown on the website</p>
      </div>
      <form onSubmit={handleSave}>
        <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-[#E4E5EF] bg-[#F8F9FC]">
            <p className="text-xs font-bold text-[#9090A8] uppercase tracking-widest">Social Links</p>
          </div>
          <div className="divide-y divide-[#E4E5EF]">
            {SOCIAL.map(({ key, label, icon: Icon, color, placeholder }) => (
              <div key={key} className="px-6 py-4 flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + "15" }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">{label}</label>
                  <input
                    value={form[key as keyof SocialForm]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 btn-gradient px-8 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save All Links"}
          </button>
          {saved && (
            <span className="text-[#10B981] font-semibold text-sm flex items-center gap-1.5">
              <CheckCircle size={15} /> Saved successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
