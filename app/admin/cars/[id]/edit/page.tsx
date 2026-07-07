"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, AlertTriangle, CheckCircle, Wrench, Loader2, X } from "lucide-react";
import { adminCarsApi } from "@/lib/api";
import toast from "react-hot-toast";

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
  const diff = value ? Math.ceil((new Date(value).getTime() - Date.now()) / 86400000) : null;
  const isExpired  = diff !== null && diff < 0;
  const isCritical = diff !== null && diff >= 0 && diff <= 10;
  const isWarning  = diff !== null && diff > 10 && diff <= 30;
  return (
    <div>
      <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">{label}</label>
      <input type="date" value={value} onChange={e => onChange(e.target.value)} className={inputCls} />
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

const toDateInput = (d: string | Date | null | undefined) => {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
};

export default function EditCarPage() {
  const { id } = useParams();
  const router = useRouter();
  const carId = String(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [car, setCar] = useState<any>(null);
  const [cities, setCities] = useState<{ _id: string; name: string }[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", registrationNo: "", modelYear: "", type: "SUV",
    fuel: "Petrol", transmission: "Automatic", seats: "5",
    cityId: "", gpsDeviceId: "",
    regularPrice: "", weekendPrice: "", securityDeposit: "", doorstepDeliveryCharge: "500", kmPackage: "",
    insuranceExpiry: "", pucExpiry: "", fitnessExpiry: "", roadTaxExpiry: "", rcExpiry: "", permitExpiry: "",
    odometer: "0", serviceIntervalKm: "5000", lastServiceKm: "0", alignmentIntervalKm: "10000", lastAlignmentKm: "0",
    isActive: true,
  });

  useEffect(() => {
    Promise.all([
      adminCarsApi.getOne(carId),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/cities`).then(r => r.json()),
    ]).then(([carRes, citiesRes]) => {
      const found = carRes.data?.data;
      if (found) {
        setCar(found);
        setForm({
          name: found.name || "",
          registrationNo: found.registrationNo || "",
          modelYear: String(found.modelYear || ""),
          type: found.type || "SUV",
          fuel: found.fuel || "Petrol",
          transmission: found.transmission || "Automatic",
          seats: String(found.seats || "5"),
          cityId: found.cityId?._id || found.cityId || "",
          gpsDeviceId: found.gpsDeviceId || "",
          regularPrice: String(found.regularPrice || ""),
          weekendPrice: String(found.weekendPrice || ""),
          securityDeposit: String(found.securityDeposit || ""),
          doorstepDeliveryCharge: String(found.doorstepDeliveryCharge ?? 500),
          kmPackage: found.kmPackage || "",
          insuranceExpiry: toDateInput(found.documents?.insurance?.expiry),
          pucExpiry:       toDateInput(found.documents?.puc?.expiry),
          fitnessExpiry:   toDateInput(found.documents?.fitness?.expiry),
          roadTaxExpiry:   toDateInput(found.documents?.roadTax?.expiry),
          rcExpiry:        toDateInput(found.documents?.rc?.expiry),
          permitExpiry:    toDateInput(found.documents?.permit?.expiry),
          odometer: String(found.odometer || 0),
          serviceIntervalKm: String(found.maintenance?.serviceIntervalKm ?? 5000),
          lastServiceKm: String(found.maintenance?.lastServiceKm ?? 0),
          alignmentIntervalKm: String(found.maintenance?.alignmentIntervalKm ?? 10000),
          lastAlignmentKm: String(found.maintenance?.lastAlignmentKm ?? 0),
          isActive: found.isActive ?? true,
        });
      }
      setCities(citiesRes.data || []);
    }).catch(() => toast.error("Failed to load car data"))
    .finally(() => setLoading(false));
  }, [carId]);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: field === "isActive" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const remainingImageCount = (car?.images?.length || 0) - removedImages.length + newImages.length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remainingImageCount < 1) {
      toast.error("At least one image is required");
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
      fd.append("weekendPrice", form.weekendPrice);
      fd.append("securityDeposit", form.securityDeposit);
      fd.append("doorstepDeliveryCharge", form.doorstepDeliveryCharge);
      fd.append("kmPackage", form.kmPackage);
      fd.append("isActive", String(form.isActive));
      fd.append("documents", JSON.stringify({
        insurance: { expiry: form.insuranceExpiry || null },
        puc:       { expiry: form.pucExpiry       || null },
        fitness:   { expiry: form.fitnessExpiry   || null },
        roadTax:   { expiry: form.roadTaxExpiry   || null },
        rc:        { expiry: form.rcExpiry        || null },
        permit:    { expiry: form.permitExpiry    || null },
      }));
      fd.append("odometer", form.odometer);
      fd.append("maintenance", JSON.stringify({
        serviceIntervalKm: Number(form.serviceIntervalKm) || 0,
        lastServiceKm: Number(form.lastServiceKm) || 0,
        alignmentIntervalKm: Number(form.alignmentIntervalKm) || 0,
        lastAlignmentKm: Number(form.lastAlignmentKm) || 0,
      }));
      newImages.forEach(img => fd.append("images", img));
      if (removedImages.length > 0) fd.append("removeImages", JSON.stringify(removedImages));

      await adminCarsApi.update(carId, fd);
      toast.success("Car updated successfully!");
      router.push("/admin/cars");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const docFields = [
    { key: "insuranceExpiry" as const, label: "Insurance Expiry" },
    { key: "pucExpiry"       as const, label: "PUC Expiry" },
    { key: "fitnessExpiry"   as const, label: "Fitness Certificate Expiry" },
    { key: "roadTaxExpiry"   as const, label: "Road Tax Expiry" },
    { key: "rcExpiry"        as const, label: "RC Expiry" },
    { key: "permitExpiry"    as const, label: "Permit Expiry" },
  ];

  const expiringSoon = docFields.filter(({ key }) => {
    const v = form[key]; if (!v) return false;
    return Math.ceil((new Date(v).getTime() - Date.now()) / 86400000) <= 10;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={36} className="animate-spin text-[#E8540A]" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#9090A8] text-lg font-semibold">Car not found.</p>
        <Link href="/admin/cars" className="mt-4 inline-block text-[#E8540A] font-bold">← Back to Car Listing</Link>
      </div>
    );
  }

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
              <input type="number" value={form.modelYear} onChange={update("modelYear")} min="2010" max="2030" className={inputCls} required />
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
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-[#E8540A]" />
              <span className="text-sm text-[#4A4A6A] font-semibold">Car is Active (visible on website)</span>
            </label>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">Pricing</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {([
              ["regularPrice",          "Regular Price/hr",        false],
              ["weekendPrice",          "Weekend Price/hr",         false],
              ["securityDeposit",       "Security Deposit",         false],
              ["doorstepDeliveryCharge","Doorstep Delivery Charge", false],
              ["kmPackage",             "KM Package",               true],
            ] as [keyof typeof form, string, boolean][]).map(([field, label, isText]) => (
              <FieldGroup key={field} label={label} required={!isText}>
                <input type={isText ? "text" : "number"} value={form[field] as string} onChange={update(field)} className={inputCls} placeholder={isText ? "250 km/day" : "0"} required={!isText} />
              </FieldGroup>
            ))}
          </div>
        </div>

        {/* Car Images */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">
            Car Images <span className="text-[#EF4444]">*</span>
          </h3>
          {car?.images?.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {car.images.map((img: string, i: number) => {
                const isRemoved = removedImages.includes(img);
                return (
                  <div key={i} className="relative">
                    <img
                      src={img}
                      alt=""
                      className={`w-24 h-16 rounded-xl object-cover border border-[#E4E5EF] ${isRemoved ? "opacity-30" : ""}`}
                    />
                    {!isRemoved ? (
                      <button
                        type="button"
                        onClick={() => setRemovedImages(prev => [...prev, img])}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-md hover:bg-[#DC2626] transition-colors"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRemovedImages(prev => prev.filter(u => u !== img))}
                        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#4A4A6A] bg-white/60 rounded-xl"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {remainingImageCount < 1 && (
            <p className="text-xs font-semibold text-[#EF4444] mb-3 flex items-center gap-1">
              <AlertTriangle size={11} /> At least one image is required
            </p>
          )}
          <input
            ref={imgInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => setNewImages(e.target.files ? Array.from(e.target.files) : [])}
          />
          <div
            onClick={() => imgInputRef.current?.click()}
            className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-[#E4E5EF] rounded-2xl cursor-pointer hover:border-[#E8540A]/50 hover:bg-[#FFF3ED] transition-all"
          >
            <Upload size={22} className="text-[#9090A8] mb-1.5" />
            <p className="text-sm font-semibold text-[#4A4A6A]">{newImages.length > 0 ? `${newImages.length} new image(s) selected` : "Upload new car images"}</p>
            <p className="text-xs text-[#9090A8]">Adds to existing images</p>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm">
          <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-5 pb-3 border-b border-[#E4E5EF]">Vehicle Documents & Expiry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {docFields.map(({ key, label }) => (
              <ExpiryField key={key} label={label} value={form[key]} onChange={v => setForm(p => ({ ...p, [key]: v }))} />
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

        {/* Save Actions */}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving || remainingImageCount < 1} className="flex items-center gap-2 btn-gradient px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-[0_8px_24px_rgba(232,84,10,0.35)] disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link href="/admin/cars" className="px-6 py-3.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm hover:border-[#E8540A]/50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
