"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, Globe, Phone, Mail, MapPin, Building, Loader2 } from "lucide-react";
import { settingsApi } from "@/lib/api";

const inputCls =
  "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

type Form = {
  companyName: string; tagline: string; gstNumber: string; upiId: string;
  phone1: string; phone2: string; phone3: string; whatsapp: string;
  email: string; website: string;
  addressDelhi: string; addressLucknow: string;
  includedKmPerDay: string; extraKmRate: string;
};

const EMPTY: Form = {
  companyName: "Veekay Cabs",
  tagline: "Delhi NCR's Most Trusted Self-Drive Car Rental",
  phone1: "+91 99999 26867", phone2: "+91 9311826201", phone3: "+91 8448586825",
  whatsapp: "+91 99999 26867",
  email: "sales@veekaycabs.com", website: "https://veekaycabs.com",
  addressDelhi: "A 13, 1st Floor, Ganesh Nagar, New Delhi 110092",
  addressLucknow: "Flat 1007, Skyline Plaza-3, Sushant Golf City, Lucknow",
  gstNumber: "", upiId: "",
  includedKmPerDay: "250", extraKmRate: "12",
};

const sections = [
  {
    title: "Company Information", icon: Building, fields: [
      { field: "companyName" as keyof Form, label: "Company Name" },
      { field: "tagline" as keyof Form, label: "Tagline" },
      { field: "gstNumber" as keyof Form, label: "GST Number" },
      { field: "upiId" as keyof Form, label: "UPI ID" },
    ],
  },
  {
    title: "Contact Details", icon: Phone, fields: [
      { field: "phone1" as keyof Form, label: "Primary Phone" },
      { field: "whatsapp" as keyof Form, label: "WhatsApp Number" },
      { field: "phone2" as keyof Form, label: "Phone 2" },
      { field: "phone3" as keyof Form, label: "Phone 3" },
      { field: "email" as keyof Form, label: "Email" },
      { field: "website" as keyof Form, label: "Website URL" },
    ],
  },
  {
    title: "Addresses", icon: MapPin, fields: [
      { field: "addressDelhi" as keyof Form, label: "Delhi Address" },
      { field: "addressLucknow" as keyof Form, label: "Lucknow Address" },
    ],
  },
  {
    title: "KM Policy", icon: Globe, fields: [
      { field: "includedKmPerDay" as keyof Form, label: "Included KM per Day" },
      { field: "extraKmRate" as keyof Form, label: "Extra KM Rate (₹/km)" },
    ],
  },
];

export default function BasicDetailsPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    settingsApi.get().then((res) => {
      const d = res.data.data;
      setForm({
        companyName: d.companyName || EMPTY.companyName,
        tagline: d.tagline || EMPTY.tagline,
        gstNumber: d.gstNumber || "",
        upiId: d.upiId || "",
        phone1: d.phone1 || EMPTY.phone1,
        phone2: d.phone2 || "",
        phone3: d.phone3 || "",
        whatsapp: d.whatsapp || d.phone1 || EMPTY.whatsapp,
        email: d.email || EMPTY.email,
        website: d.website || EMPTY.website,
        addressDelhi: d.addressDelhi || EMPTY.addressDelhi,
        addressLucknow: d.addressLucknow || "",
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const update = (f: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

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
        <Loader2 size={18} className="animate-spin" /> Loading settings...
      </div>
    );

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Basic Details</h1>
        <p className="text-[#9090A8] text-sm">Company information shown across the website</p>
      </div>
      <form onSubmit={handleSave} className="space-y-5">
        {sections.map(({ title, icon: Icon, fields }) => (
          <div key={title} className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
            <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF] flex items-center gap-2">
              <Icon size={16} className="text-[#E8540A]" /> {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(({ field, label }) => (
                <div key={field} className={field.startsWith("address") || field === "tagline" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  <input value={form[field]} onChange={update(field)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 btn-gradient px-8 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Details"}
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
