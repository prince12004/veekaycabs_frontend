"use client";

import { useState } from "react";
import { Save, CheckCircle, Globe, Phone, Mail, MapPin, Building } from "lucide-react";

const DEFAULT = {
  companyName: "Veekay Cabs",
  tagline: "Delhi NCR's Most Trusted Self-Drive Car Rental",
  phone1: "+91 99999 26867",
  phone2: "+91 9311826201",
  phone3: "+91 8448586825",
  email: "sales@veekaycabs.com",
  website: "https://veekaycabs.com",
  addressDelhi: "A 13, 1st Floor, Ganesh Nagar, New Delhi 110092",
  addressLucknow: "Flat 1007, Skyline Plaza-3, Sushant Golf City, Lucknow",
  gst: "07AABCV1234D1Z5",
  upi: "veekaycabs@upi",
};

const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

export default function BasicDetailsPage() {
  const [form, setForm] = useState(DEFAULT);
  const [saved, setSaved] = useState(false);

  const update = (f: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    {
      title: "Company Information", icon: Building, fields: [
        { field: "companyName" as const, label: "Company Name" },
        { field: "tagline" as const, label: "Tagline" },
        { field: "gst" as const, label: "GST Number" },
        { field: "upi" as const, label: "UPI ID" },
      ]
    },
    {
      title: "Contact Details", icon: Phone, fields: [
        { field: "phone1" as const, label: "Primary Phone" },
        { field: "phone2" as const, label: "WhatsApp Number" },
        { field: "phone3" as const, label: "Alternate Phone" },
        { field: "email" as const, label: "Email" },
        { field: "website" as const, label: "Website URL" },
      ]
    },
    {
      title: "Addresses", icon: MapPin, fields: [
        { field: "addressDelhi" as const, label: "Delhi Address" },
        { field: "addressLucknow" as const, label: "Lucknow Address" },
      ]
    },
  ];

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
                <div key={field} className={field.startsWith("address") ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">{label}</label>
                  <input value={form[field]} onChange={update(field)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-4">
          <button type="submit" className="flex items-center gap-2 btn-gradient px-8 py-3.5 rounded-xl text-white font-bold text-sm">
            <Save size={16} /> Save Details
          </button>
          {saved && <span className="text-[#10B981] font-semibold text-sm flex items-center gap-1.5"><CheckCircle size={15} /> Saved!</span>}
        </div>
      </form>
    </div>
  );
}
