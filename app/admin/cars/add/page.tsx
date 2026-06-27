"use client";

import { useState } from "react";
import { Upload, Save, ArrowLeft, Wrench, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CarForm {
  name: string;
  registrationNo: string;
  modelYear: string;
  type: string;
  fuel: string;
  transmission: string;
  seats: string;
  regularPrice: string;
  weekendPrice: string;
  securityDeposit: string;
  kmPackage: string;
  city: string;
  gpsDeviceId: string;
  insuranceExpiry: string;
  pucExpiry: string;
  fitnessExpiry: string;
  roadTaxExpiry: string;
  rcExpiry: string;
  nextServiceDue: string;
  serviceIntervalKm: string;
}

const initialForm: CarForm = {
  name: "",
  registrationNo: "",
  modelYear: "",
  type: "Hatchback",
  fuel: "Petrol",
  transmission: "Manual",
  seats: "5",
  regularPrice: "",
  weekendPrice: "",
  securityDeposit: "10000",
  kmPackage: "200",
  city: "Delhi",
  gpsDeviceId: "",
  insuranceExpiry: "",
  pucExpiry: "",
  fitnessExpiry: "",
  roadTaxExpiry: "",
  rcExpiry: "",
  nextServiceDue: "",
  serviceIntervalKm: "5000",
};

function getServiceStatus(dateStr: string): { label: string; color: string; bg: string } | null {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: `Overdue by ${Math.abs(daysLeft)} day(s)`, color: "#991B1B", bg: "#FEE2E2" };
  if (daysLeft <= 7) return { label: `Due in ${daysLeft} day(s)`, color: "#92400E", bg: "#FEF3C7" };
  return { label: `Due in ${daysLeft} days`, color: "#065F46", bg: "#D1FAE5" };
}

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[#4A4A6A] text-xs font-semibold uppercase tracking-wider mb-1.5 block">
        {label} {required && <span className="text-[#EF4444]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white";
const selectClass = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white appearance-none";

export default function AddCarPage() {
  const [form, setForm] = useState<CarForm>(initialForm);
  const [saved, setSaved] = useState(false);
  const [images, setImages] = useState<File[]>([]);

  const update = (field: keyof CarForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/cars" className="text-[#9090A8] hover:text-[#E8540A] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-black font-syne text-2xl text-[#0F0F1A]">Add New Car</h1>
          <p className="text-[#9090A8] text-sm mt-0.5">Fill in all details to add a car to the fleet</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Basic Details */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FieldGroup label="Car Name" required>
              <input type="text" value={form.name} onChange={update("name")} placeholder="e.g., Hyundai Creta" className={inputClass} required />
            </FieldGroup>
            <FieldGroup label="Registration No." required>
              <input type="text" value={form.registrationNo} onChange={update("registrationNo")} placeholder="e.g., DL-01-AB-1234" className={inputClass} required />
            </FieldGroup>
            <FieldGroup label="Model Year" required>
              <input type="number" value={form.modelYear} onChange={update("modelYear")} placeholder="2023" min="2015" max="2026" className={inputClass} required />
            </FieldGroup>
            <FieldGroup label="Car Type" required>
              <select value={form.type} onChange={update("type")} className={selectClass}>
                {["Hatchback", "Sedan", "SUV", "MUV", "Luxury"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="Fuel Type" required>
              <select value={form.fuel} onChange={update("fuel")} className={selectClass}>
                {["Petrol", "Diesel", "CNG", "Electric"].map((f) => <option key={f}>{f}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="Transmission" required>
              <select value={form.transmission} onChange={update("transmission")} className={selectClass}>
                {["Manual", "Automatic"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="Seats" required>
              <select value={form.seats} onChange={update("seats")} className={selectClass}>
                {["4", "5", "7", "9"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="City" required>
              <select value={form.city} onChange={update("city")} className={selectClass}>
                {["Delhi", "Noida", "Gurgaon", "Ghaziabad", "Greater Noida"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="GPS Device ID">
              <input type="text" value={form.gpsDeviceId} onChange={update("gpsDeviceId")} placeholder="GPS-001234" className={inputClass} />
            </FieldGroup>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">
            Pricing & Package
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <FieldGroup label="Regular Price / hr" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8] text-sm font-medium">Rs.</span>
                <input type="number" value={form.regularPrice} onChange={update("regularPrice")} placeholder="89" className={`${inputClass} pl-10`} required />
              </div>
            </FieldGroup>
            <FieldGroup label="Weekend Price / hr" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8] text-sm font-medium">Rs.</span>
                <input type="number" value={form.weekendPrice} onChange={update("weekendPrice")} placeholder="109" className={`${inputClass} pl-10`} required />
              </div>
            </FieldGroup>
            <FieldGroup label="Security Deposit" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8] text-sm font-medium">Rs.</span>
                <input type="number" value={form.securityDeposit} onChange={update("securityDeposit")} placeholder="10000" className={`${inputClass} pl-10`} required />
              </div>
            </FieldGroup>
            <FieldGroup label="KM Package / day">
              <div className="relative">
                <input type="number" value={form.kmPackage} onChange={update("kmPackage")} placeholder="200" className={`${inputClass} pr-10`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9090A8] text-xs font-medium">km</span>
              </div>
            </FieldGroup>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">
            Car Images
          </h3>
          <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-[#E4E5EF] rounded-2xl cursor-pointer hover:border-[#E8540A]/50 hover:bg-[#FFF3ED] transition-all">
            <input
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => setImages(e.target.files ? Array.from(e.target.files) : [])}
            />
            <Upload size={24} className="text-[#9090A8] mb-2" />
            <p className="text-[#4A4A6A] text-sm font-semibold">Click to upload car images</p>
            <p className="text-[#9090A8] text-xs mt-1">Upload multiple images (JPG, PNG, max 5MB each)</p>
          </label>
          {images.length > 0 && (
            <p className="mt-2 text-[#10B981] text-xs font-semibold">{images.length} image(s) selected</p>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">
            Vehicle Documents & Expiry
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { field: "insuranceExpiry" as const, label: "Insurance Expiry" },
              { field: "pucExpiry" as const, label: "PUC Expiry" },
              { field: "fitnessExpiry" as const, label: "Fitness Certificate Expiry" },
              { field: "roadTaxExpiry" as const, label: "Road Tax Expiry" },
              { field: "rcExpiry" as const, label: "RC Expiry" },
            ].map(({ field, label }) => (
              <FieldGroup key={field} label={label} required>
                <input type="date" value={form[field]} onChange={update(field)} className={inputClass} required />
              </FieldGroup>
            ))}
          </div>
        </div>

        {/* Service & Maintenance Alert */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF] flex items-center gap-2">
            <Wrench size={16} className="text-[#E8540A]" />
            Service & Maintenance Alert
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FieldGroup label="Next Service / Alignment Due">
              <input type="date" value={form.nextServiceDue} onChange={update("nextServiceDue")} className={inputClass} />
            </FieldGroup>
            <FieldGroup label="Service Interval (km)">
              <div className="relative">
                <input type="number" value={form.serviceIntervalKm} onChange={update("serviceIntervalKm")} placeholder="5000" className={`${inputClass} pr-10`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9090A8] text-xs font-medium">km</span>
              </div>
            </FieldGroup>
            {form.nextServiceDue && (
              <div className="flex items-end">
                {(() => {
                  const status = getServiceStatus(form.nextServiceDue);
                  if (!status) return null;
                  return (
                    <span
                      className={cn("flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl")}
                      style={{ backgroundColor: status.bg, color: status.color }}
                    >
                      <AlertTriangle size={13} /> {status.label}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
          <p className="text-[#9090A8] text-xs mt-3">
            We&apos;ll flag this car on the dashboard once the service date is within 7 days or overdue.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 btn-gradient px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-[0_8px_24px_rgba(232,84,10,0.35)]"
          >
            <Save size={16} />
            {saved ? "Saved!" : "Save Car"}
          </button>
          <Link
            href="/admin/cars"
            className="px-6 py-3.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm hover:border-[#E8540A]/50 hover:text-[#E8540A] transition-all"
          >
            Cancel
          </Link>
          {saved && (
            <span className="text-[#10B981] text-sm font-semibold flex items-center gap-1.5">
              ✅ Car saved successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
