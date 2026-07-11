"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Save, ArrowLeft, AlertTriangle, Loader2, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminCarsApi } from "@/lib/api";
import toast from "react-hot-toast";

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

function ExpiryField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const diff = value ? Math.ceil((new Date(value).getTime() - Date.now()) / 86400000) : null;
  const isExpired = diff !== null && diff < 0;
  const isCritical = diff !== null && diff >= 0 && diff <= 10;
  const isWarning = diff !== null && diff > 10 && diff <= 30;
  return (
    <div>
      <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">{label}</label>
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none" />
      {diff !== null && (
        <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${isExpired || isCritical ? "text-[#EF4444]" : isWarning ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
          {(isExpired || isCritical) && <AlertTriangle size={11} />}
          {isExpired ? `EXPIRED ${Math.abs(diff)} days ago` : `${diff} days remaining`}
        </p>
      )}
    </div>
  );
}

function KmDueField({ label, odometer, lastKm, intervalKm }: { label: string; odometer: number; lastKm: number; intervalKm: number }) {
  const dueAtKm = lastKm + intervalKm;
  const kmLeft = dueAtKm - odometer;
  const isOverdue = kmLeft < 0;
  const isCritical = kmLeft >= 0 && kmLeft <= 200;
  const isWarning = kmLeft > 200 && kmLeft <= 500;
  return (
    <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${isOverdue || isCritical ? "text-[#EF4444]" : isWarning ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
      {(isOverdue || isCritical) && <AlertTriangle size={11} />}
      {label}: due at {dueAtKm.toLocaleString("en-IN")} km — {isOverdue ? `overdue by ${Math.abs(kmLeft).toLocaleString("en-IN")} km` : `${kmLeft.toLocaleString("en-IN")} km left`}
    </p>
  );
}

const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";
const selectCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

export default function AddCarPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<{ _id: string; name: string }[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", registrationNo: "", modelYear: "", type: "SUV",
    fuel: "Petrol", transmission: "Automatic", seats: "5",
    cityId: "", gpsDeviceId: "",
    regularPrice: "", weekendPrice: "", securityDeposit: "10000", doorstepDeliveryCharge: "500", kmPackage: "250 km/day", extraKmRate: "6",
    insuranceExpiry: "", pucExpiry: "", fitnessExpiry: "", roadTaxExpiry: "", rcExpiry: "", permitExpiry: "",
    odometer: "0", serviceIntervalKm: "8000", lastServiceKm: "0", alignmentIntervalKm: "5000", lastAlignmentKm: "0",
    isActive: true,
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/cities`)
      .then(r => r.json())
      .then(d => {
        setCities(d.data || []);
        if (d.data?.length > 0) setForm(f => ({ ...f, cityId: d.data[0]._id }));
      })
      .catch(() => { });
  }, []);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.registrationNo || !form.cityId || !form.regularPrice) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("registrationNo", form.registrationNo);
      fd.append("modelYear", form.modelYear);
      fd.append("type", form.type);
      fd.append("fuel", form.fuel);
      fd.append("transmission", form.transmission);
      fd.append("seats", form.seats);
      fd.append("cityId", form.cityId);
      fd.append("gpsDeviceId", form.gpsDeviceId);
      fd.append("regularPrice", form.regularPrice);
      fd.append("weekendPrice", form.weekendPrice || form.regularPrice);
      fd.append("securityDeposit", form.securityDeposit);
      fd.append("doorstepDeliveryCharge", form.doorstepDeliveryCharge);
      fd.append("kmPackage", form.kmPackage);
      fd.append("extraKmRate", form.extraKmRate || "0");
      fd.append("isActive", String(form.isActive));
      fd.append("documents", JSON.stringify({
        insurance: { expiry: form.insuranceExpiry || null },
        puc: { expiry: form.pucExpiry || null },
        fitness: { expiry: form.fitnessExpiry || null },
        roadTax: { expiry: form.roadTaxExpiry || null },
        rc: { expiry: form.rcExpiry || null },
        permit: { expiry: form.permitExpiry || null },
      }));
      fd.append("odometer", form.odometer);
      fd.append("maintenance", JSON.stringify({
        serviceIntervalKm: Number(form.serviceIntervalKm) || 0,
        lastServiceKm: Number(form.lastServiceKm) || 0,
        alignmentIntervalKm: Number(form.alignmentIntervalKm) || 0,
        lastAlignmentKm: Number(form.lastAlignmentKm) || 0,
      }));
      images.forEach(img => fd.append("images", img));

      await adminCarsApi.create(fd);
      toast.success("Car added successfully!");
      router.push("/admin/cars");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add car");
    } finally {
      setSaving(false);
    }
  };

  const docFields = [
    { key: "insuranceExpiry" as const, label: "Insurance Expiry" },
    { key: "pucExpiry" as const, label: "PUC Expiry" },
    { key: "fitnessExpiry" as const, label: "Fitness Certificate Expiry" },
    { key: "roadTaxExpiry" as const, label: "Road Tax Expiry" },
    { key: "rcExpiry" as const, label: "RC Expiry" },
    { key: "permitExpiry" as const, label: "Permit Expiry" },
  ];

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

      <form onSubmit={handleSave} className="space-y-5 max-w-4xl">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FieldGroup label="Car Name" required>
              <input type="text" value={form.name} onChange={update("name")} placeholder="e.g., Hyundai Creta" className={inputCls} required />
            </FieldGroup>
            <FieldGroup label="Registration No." required>
              <input type="text" value={form.registrationNo} onChange={update("registrationNo")} placeholder="e.g., DL-01-AB-1234" className={inputCls} required />
            </FieldGroup>
            <FieldGroup label="Model Year" required>
              <input type="number" value={form.modelYear} onChange={update("modelYear")} placeholder="2023" min="2010" max="2030" className={inputCls} required />
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
              <select value={form.cityId} onChange={update("cityId")} className={selectCls}>
                <option value="">Select city</option>
                {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="GPS Device IMEI">
              <input type="text" value={form.gpsDeviceId} onChange={update("gpsDeviceId")} placeholder="e.g. 860187061953042" className={inputCls} />
            </FieldGroup>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-[#E8540A]" />
              <span className="text-sm text-[#4A4A6A] font-semibold">Car is Active (visible on website)</span>
            </label>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">Pricing</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {([
              ["regularPrice", "Regular Price/hr", false],
              ["weekendPrice", "Weekend Price/hr", false],
              ["securityDeposit", "Security Deposit", false],
              ["doorstepDeliveryCharge", "Doorstep Delivery Charge", false],
              ["kmPackage", "KM Package", true],
            ] as [keyof typeof form, string, boolean][]).map(([field, label, isText]) => (
              <FieldGroup key={field} label={label} required={!isText}>
                <input
                  type={isText ? "text" : "number"}
                  value={form[field] as string}
                  onChange={update(field)}
                  className={inputCls}
                  placeholder={isText ? "250 km/day" : "0"}
                  required={!isText}
                />
              </FieldGroup>
            ))}
            <FieldGroup label="Extra KM Rate (Rs./km)">
              <input
                type="number"
                min="0"
                value={form.extraKmRate}
                onChange={update("extraKmRate")}
                className={inputCls}
                placeholder="e.g. 6"
              />
            </FieldGroup>
          </div>
        </div>

        {/* Car Images */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">Car Images</h3>
          <input
            ref={imgInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => setImages(e.target.files ? Array.from(e.target.files) : [])}
          />
          <div
            onClick={() => imgInputRef.current?.click()}
            className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#E4E5EF] rounded-2xl cursor-pointer hover:border-[#E8540A]/50 hover:bg-[#FFF3ED] transition-all"
          >
            <Upload size={22} className="text-[#9090A8] mb-1.5" />
            <p className="text-sm font-semibold text-[#4A4A6A]">{images.length > 0 ? `${images.length} image(s) selected` : "Upload car images"}</p>
            <p className="text-xs text-[#9090A8]">JPG, PNG, WebP — multiple images supported</p>
          </div>
          {images.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <img key={i} src={URL.createObjectURL(img)} alt="" className="w-20 h-14 rounded-xl object-cover border border-[#E4E5EF]" />
              ))}
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">Vehicle Documents & Expiry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {docFields.map(({ key, label }) => (
              <ExpiryField key={key} label={label} value={form[key]} onChange={v => setForm(f => ({ ...f, [key]: v }))} />
            ))}
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF] flex items-center gap-2">
            <Wrench size={16} className="text-[#E8540A]" /> Service & Alignment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-4">
            <FieldGroup label="Current Odometer (km)">
              <input type="number" value={form.odometer} onChange={update("odometer")} min="0" className={inputCls} />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Service Interval (km)">
                  <input type="number" value={form.serviceIntervalKm} onChange={update("serviceIntervalKm")} min="0" className={inputCls} />
                </FieldGroup>
                <FieldGroup label="Last Service Odometer (km)">
                  <input type="number" value={form.lastServiceKm} onChange={update("lastServiceKm")} min="0" className={inputCls} />
                </FieldGroup>
              </div>
              <KmDueField label="Service" odometer={Number(form.odometer) || 0} lastKm={Number(form.lastServiceKm) || 0} intervalKm={Number(form.serviceIntervalKm) || 0} />
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Alignment Interval (km)">
                  <input type="number" value={form.alignmentIntervalKm} onChange={update("alignmentIntervalKm")} min="0" className={inputCls} />
                </FieldGroup>
                <FieldGroup label="Last Alignment Odometer (km)">
                  <input type="number" value={form.lastAlignmentKm} onChange={update("lastAlignmentKm")} min="0" className={inputCls} />
                </FieldGroup>
              </div>
              <KmDueField label="Alignment" odometer={Number(form.odometer) || 0} lastKm={Number(form.lastAlignmentKm) || 0} intervalKm={Number(form.alignmentIntervalKm) || 0} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="flex items-center gap-2 btn-gradient px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-[0_8px_24px_rgba(232,84,10,0.35)] disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Add Car"}
          </button>
          <Link href="/admin/cars" className="px-6 py-3.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm hover:border-[#E8540A]/50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
