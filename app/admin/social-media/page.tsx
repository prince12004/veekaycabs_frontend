"use client";

import { useState } from "react";
import { Save, CheckCircle, Facebook, Instagram, Linkedin, Youtube, Twitter } from "lucide-react";

const SOCIAL = [
  { key: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2", placeholder: "https://www.facebook.com/veekaycabs" },
  { key: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", placeholder: "veekay_cabs" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0A66C2", placeholder: "https://www.linkedin.com/company/veekaycabs/" },
  { key: "youtube", label: "YouTube", icon: Youtube, color: "#FF0000", placeholder: "https://www.youtube.com/@veekaycabs" },
  { key: "twitter", label: "X (Twitter)", icon: Twitter, color: "#000000", placeholder: "https://x.com/veekaycabs" },
];

const DEFAULT = {
  facebook: "https://www.facebook.com/veekaycabs/?locale=pt_BR",
  instagram: "veekay_cabs",
  linkedin: "https://www.linkedin.com/company/veekaycabs/",
  youtube: "",
  twitter: "https://x.com/veekaycabs",
};

export default function SocialMediaPage() {
  const [form, setForm] = useState(DEFAULT);
  const [saved, setSaved] = useState<string | null>(null);

  const saveOne = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Social Media Links</h1>
        <p className="text-[#9090A8] text-sm">Manage all social media links shown on the website</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E5EF] bg-[#F8F9FC]">
          <p className="text-xs font-bold text-[#9090A8] uppercase tracking-widest">Social Links</p>
        </div>
        <div className="divide-y divide-[#E4E5EF]">
          {SOCIAL.map(({ key, label, icon: Icon, color, placeholder }) => (
            <div key={key} className="px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + "15" }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none"
                />
              </div>
              <button
                onClick={() => saveOne(key)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap shrink-0"
                style={{ backgroundColor: saved === key ? "#D1FAE5" : color + "20", color: saved === key ? "#065F46" : color }}
              >
                {saved === key ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save</>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
