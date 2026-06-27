"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, AlertTriangle, CheckCircle, Wrench } from "lucide-react";

const CAR_DATA: Record<string, {
  name: string; registrationNo: string; modelYear: string; type: string; fuel: string; transmission: string;
  seats: string; regularPrice: string; weekendPrice: string; securityDeposit: string; kmPackage: string;
  city: string; gpsDeviceId: string; insuranceExpiry: string; pucExpiry: string; fitnessExpiry: string;
  roadTaxExpiry: string; rcExpiry: string; status: boolean; extraKmCharge: string; homeDelivery: boolean; homeDeliveryCharge: string;
  nextServiceDue: string; serviceIntervalKm: string;
}> = {
  "1": { name: "Hyundai Creta", registrationNo: "DL01AB1234", modelYear: "2023", type: "SUV", fuel: "Petrol", transmission: "Automatic", seats: "5", regularPrice: "149", weekendPrice: "179", securityDeposit: "10000", kmPackage: "250", city: "Delhi", gpsDeviceId: "GPS-0021", insuranceExpiry: "2026-06-25", pucExpiry: "2026-08-10", fitnessExpiry: "2027-01-05", roadTaxExpiry: "2027-06-30", rcExpiry: "2038-04-15", status: true, extraKmCharge: "15", homeDelivery: true, homeDeliveryCharge: "500", nextServiceDue: "2026-07-01", serviceIntervalKm: "5000" },
};

const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";
const selectCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-[#EF4444]">*</span>}
      </label>
      {children}
    </div>
  );
}

function ExpiryField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const today = new Date().toISOString().split("T")[0];
  const diff = value ? Math.ceil((new Date(value).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = diff !== null && diff < 0;
  const isCritical = diff !== null && diff >= 0 && diff <= 10;
  const isWarning = diff !== null && diff > 10 && diff <= 30;

  return (
    <div>
      <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">{label} <span className="text-[#EF4444]">*</span></label>
      <input type="date" value={value} onChange={e => onChange(e.target.value)} className={inputCls} required />
      {diff !== null && (
        <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${isExpired ? "text-[#EF4444]" : isCritical ? "text-[#EF4444]" : isWarning ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
          {(isExpired || isCritical) && <AlertTriangle size={11} />}
          {isExpired ? `EXPIRED ${Math.abs(diff)} days ago` : `${diff} days remaining`}
        </p>
      )}
    </div>
  );
}

export default function EditCarPage() {
  const params = useParams();
  const id = String(params.id ?? "1");
  const defaultData = CAR_DATA[id] ?? CAR_DATA["1"];
  const [form, setForm] = useState(defaultData);
  const [saved, setSaved] = useState(false);
  const [images, setImages] = useState<File[]>([]);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const docFields: { field: keyof typeof form; label: string }[] = [
    { field: "insuranceExpiry", label: "Insurance Expiry" },
    { field: "pucExpiry", label: "PUC Expiry" },
    { field: "fitnessExpiry", label: "Fitness Certificate Expiry" },
    { field: "roadTaxExpiry", label: "Road Tax Expiry" },
    { field: "rcExpiry", label: "RC Expiry" },
  ];

  const expiringSoon = docFields.filter(({ field }) => {
    const v = form[field] as string;
    if (!v) return false;
    const diff = Math.ceil((new Date(v).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 10;
  });

  const serviceDueSoon = (() => {
    if (!form.nextServiceDue) return null;
    const diff = Math.ceil((new Date(form.nextServiceDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `Overdue: service/alignment was due ${Math.abs(diff)} day(s) ago.`;
    if (diff <= 7) return `Service/alignment due in ${diff} day(s) — schedule soon.`;
    return null;
  })();

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/cars" className="text-[#9090A8] hover:text-[#E8540A] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-black font-syne text-2xl text-[#0F0F1A]">Edit Car</h1>
          <p className="text-[#9090A8] text-sm">{form.name} — {form.registrationNo}</p>
        </div>
      </div>

      {expiringSoon.length > 0 && (
        <div className="mb-5 bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#F59E0B] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#92400E] text-sm">Documents expiring within 10 days!</p>
            <p className="text-xs text-[#92400E] mt-0.5">{expiringSoon.map(f => f.label).join(", ")} — Please update immediately.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 max-w-4xl">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FieldGroup label="Car Name" required>
              <input type="text" value={form.name} onChange={update("name")} className={inputCls} required />
            </FieldGroup>
            <FieldGroup label="Registration No." required>
              <input type="text" value={form.registrationNo} onChange={update("registrationNo")} className={inputCls} required />
            </FieldGroup>
            <FieldGroup label="Model Year" required>
              <input type="number" value={form.modelYear} onChange={update("modelYear")} min="2010" max="2026" className={inputCls} required />
            </FieldGroup>
            <FieldGroup label="Car Type" required>
              <select value={form.type} onChange={update("type")} className={selectCls}>
                {["Hatchback", "Sedan", "SUV", "MUV", "Luxury"].map(t => <option key={t}>{t}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="Fuel Type" required>
              <select value={form.fuel} onChange={update("fuel")} className={selectCls}>
                {["Petrol", "Diesel", "CNG", "Electric"].map(f => <option key={f}>{f}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="Transmission" required>
              <select value={form.transmission} onChange={update("transmission")} className={selectCls}>
                {["Manual", "Automatic"].map(t => <option key={t}>{t}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="Seats" required>
              <select value={form.seats} onChange={update("seats")} className={selectCls}>
                {["4", "5", "7", "9"].map(s => <option key={s}>{s}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="City" required>
              <select value={form.city} onChange={update("city")} className={selectCls}>
                {["Delhi", "Noida", "Gurgaon", "Ghaziabad", "Greater Noida"].map(c => <option key={c}>{c}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="GPS Device ID">
              <input type="text" value={form.gpsDeviceId} onChange={update("gpsDeviceId")} placeholder="GPS-001234" className={inputCls} />
            </FieldGroup>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">Pricing</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {[
              { field: "regularPrice" as const, label: "Regular Price/hr" },
              { field: "weekendPrice" as const, label: "Weekend Price/hr" },
              { field: "securityDeposit" as const, label: "Security Deposit" },
              { field: "kmPackage" as const, label: "KM Package/day" },
              { field: "extraKmCharge" as const, label: "Extra KM Charge" },
            ].map(({ field, label }) => (
              <FieldGroup key={field} label={label} required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8] text-xs font-medium">Rs.</span>
                  <input type="number" value={form[field] as string} onChange={update(field)} className={`${inputCls} pl-9`} required />
                </div>
              </FieldGroup>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.homeDelivery} onChange={e => setForm(p => ({ ...p, homeDelivery: e.target.checked }))} className="w-4 h-4 accent-[#E8540A]" />
              <span className="text-sm text-[#4A4A6A] font-semibold">Home Delivery Available</span>
            </label>
            {form.homeDelivery && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#4A4A6A]">Charge:</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9090A8] text-xs">Rs.</span>
                  <input type="number" value={form.homeDeliveryCharge} onChange={update("homeDeliveryCharge")} className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl pl-8 pr-3 py-2 text-sm outline-none w-28" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Car Images */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">Car Images</h3>
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#E4E5EF] rounded-2xl cursor-pointer hover:border-[#E8540A]/50 hover:bg-[#FFF3ED] transition-all">
            <input type="file" multiple accept="image/*" className="sr-only" onChange={e => setImages(e.target.files ? Array.from(e.target.files) : [])} />
            <Upload size={22} className="text-[#9090A8] mb-1.5" />
            <p className="text-sm font-semibold text-[#4A4A6A]">{images.length > 0 ? `${images.length} new image(s) selected` : "Upload new car images"}</p>
            <p className="text-xs text-[#9090A8]">Replaces existing images</p>
          </label>
        </div>

        {/* Documents & Expiry */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">Vehicle Documents & Expiry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {docFields.map(({ field, label }) => (
              <ExpiryField key={field} label={label} value={form[field] as string} onChange={v => setForm(p => ({ ...p, [field]: v }))} />
            ))}
          </div>
          {expiringSoon.length > 0 && (
            <div className="mt-4 p-3 bg-[#FEE2E2] rounded-xl">
              <p className="text-xs font-bold text-[#991B1B] flex items-center gap-1.5"><AlertTriangle size={13} /> Critical: {expiringSoon.map(f => f.label).join(", ")} expire within 10 days!</p>
            </div>
          )}
        </div>

        {/* Service & Maintenance Alert */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF] flex items-center gap-2">
            <Wrench size={16} className="text-[#E8540A]" />
            Service & Maintenance Alert
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FieldGroup label="Next Service / Alignment Due">
              <input type="date" value={form.nextServiceDue} onChange={update("nextServiceDue")} className={inputCls} />
            </FieldGroup>
            <FieldGroup label="Service Interval (km)">
              <div className="relative">
                <input type="number" value={form.serviceIntervalKm} onChange={update("serviceIntervalKm")} placeholder="5000" className={`${inputCls} pr-10`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9090A8] text-xs font-medium">km</span>
              </div>
            </FieldGroup>
          </div>
          {serviceDueSoon && (
            <div className="mt-4 p-3 bg-[#FEF3C7] rounded-xl">
              <p className="text-xs font-bold text-[#92400E] flex items-center gap-1.5"><AlertTriangle size={13} /> {serviceDueSoon}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button type="submit" className="flex items-center gap-2 btn-gradient px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-[0_8px_24px_rgba(232,84,10,0.35)]">
            <Save size={16} /> Save Changes
          </button>
          <Link href="/admin/cars" className="px-6 py-3.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm hover:border-[#E8540A]/50 transition-colors">Cancel</Link>
          {saved && (
            <span className="text-[#10B981] text-sm font-semibold flex items-center gap-1.5"><CheckCircle size={15} /> Changes saved!</span>
          )}
        </div>
      </form>
    </div>
  );
}
