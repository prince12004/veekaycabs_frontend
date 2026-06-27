"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import { MapPin, Fuel, Users, IndianRupee, Upload, CheckSquare, X, ImagePlus } from "lucide-react";
import { LocationInput } from "@/components/ui/LocationAutocomplete";

const SEAT_OPTIONS = [9, 12, 13, 14, 16, 17, 20, 26];
const FUEL_OPTIONS = ["Petrol", "Diesel", "CNG", "Electric"];
const MAX_IMAGES = 6;

export default function AddTempoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    registrationNo: "",
    seats: "",
    fuel: "Diesel",
    location: "",
    latitude: "",
    longitude: "",
    basePrice: "",
    pricePerDay: "",
    pricePerKm: "",
    tollForExtraTrip: "",
    refundableDeposit: "",
    homeDeliveryCharge: "",
    homeDeliveryAvailable: false,
    showOnTop: false,
    shortDescription: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length < files.length) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
    }
    const newFiles = [...imageFiles, ...toAdd];
    const newPreviews = [...imagePreviews, ...toAdd.map(f => URL.createObjectURL(f))];
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.registrationNo || !form.seats || !form.location || !form.basePrice || !form.pricePerDay || !form.pricePerKm) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));
      imageFiles.forEach(file => formData.append("images", file));
      await adminApi.post("/api/admin/tempo", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Tempo Traveller added successfully!");
      router.push("/admin/tempo-admin/list");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add tempo";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Add Tempo Traveller</h1>
        <p className="text-[#9090A8] text-sm mt-1">Add a new tempo traveller to your fleet</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E4E5EF]">
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
              <span className="text-[#7C3AED] text-sm">🚐</span>
            </div>
            <h2 className="font-bold text-[#0F0F1A]">MANAGE TEMPO TRAVELLER</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Tempo Name <span className="text-red-500">*</span></label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Force Urbania" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Vehicle Number <span className="text-red-500">*</span></label>
              <input name="registrationNo" value={form.registrationNo} onChange={handleChange} placeholder="DL01AB1234" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none uppercase" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5 flex items-center gap-1">
                <MapPin size={13} /> Location Of Tempo <span className="text-red-500">*</span>
              </label>
              <LocationInput
                value={form.location}
                onChange={(v) => setForm(prev => ({ ...prev, location: v }))}
                placeholder="Enter a location"
                className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Latitude</label>
              <input name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} placeholder="28.6139" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none bg-[#FAFAFA]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Longitude</label>
              <input name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} placeholder="77.2090" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none bg-[#FAFAFA]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5 flex items-center gap-1">
                <Fuel size={13} /> Fuel Type <span className="text-red-500">*</span>
              </label>
              <select name="fuel" value={form.fuel} onChange={handleChange} className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none bg-white">
                {FUEL_OPTIONS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5 flex items-center gap-1">
                <Users size={13} /> Select Seats <span className="text-red-500">*</span>
              </label>
              <select name="seats" value={form.seats} onChange={handleChange} className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none bg-white" required>
                <option value="">Select Number of Seats</option>
                {SEAT_OPTIONS.map(s => <option key={s} value={s}>{s} Seater</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5 flex items-center gap-1">
                <IndianRupee size={13} /> Base Price <span className="text-red-500">*</span>
              </label>
              <input name="basePrice" type="number" value={form.basePrice} onChange={handleChange} placeholder="e.g. 8500" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Price Per Day <span className="text-red-500">*</span></label>
              <input name="pricePerDay" type="number" value={form.pricePerDay} onChange={handleChange} placeholder="e.g. 5000" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Price Per KM <span className="text-red-500">*</span></label>
              <input name="pricePerKm" type="number" step="0.5" value={form.pricePerKm} onChange={handleChange} placeholder="e.g. 18" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Toll For Extra Trip</label>
              <input name="tollForExtraTrip" type="number" value={form.tollForExtraTrip} onChange={handleChange} placeholder="e.g. 500" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Short Description</label>
              <textarea name="shortDescription" value={form.shortDescription} onChange={handleChange} rows={3} placeholder="Brief description of the tempo..." className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none resize-none" />
            </div>
          </div>

          {/* ── Multi Image Upload ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-[#4A4A6A]">
                Tempo Images <span className="text-[#9090A8] font-normal">({imageFiles.length}/{MAX_IMAGES})</span>
              </label>
              {imageFiles.length < MAX_IMAGES && (
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-semibold rounded-xl cursor-pointer hover:bg-[#7C3AED]/20 transition-colors">
                  <ImagePlus size={14} />
                  Add Images
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {imagePreviews.length === 0 ? (
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#7C3AED]/30 rounded-2xl p-8 cursor-pointer hover:border-[#7C3AED]/60 hover:bg-[#7C3AED]/5 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center">
                  <Upload size={24} className="text-[#7C3AED]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#4A4A6A]">Click to upload images</p>
                  <p className="text-xs text-[#9090A8] mt-0.5">Upload up to {MAX_IMAGES} images · JPG, PNG, WebP</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-[#E4E5EF]">
                    <img src={src} alt={`tempo ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1 left-1 bg-[#7C3AED] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">MAIN</div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {imageFiles.length < MAX_IMAGES && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-[#7C3AED]/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#7C3AED] hover:bg-[#7C3AED]/5 transition-all">
                    <ImagePlus size={20} className="text-[#7C3AED]/50" />
                    <span className="text-[9px] text-[#9090A8] mt-1">Add more</span>
                    <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Deposit & Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Refundable Deposit</label>
              <input name="refundableDeposit" type="number" value={form.refundableDeposit} onChange={handleChange} placeholder="e.g. 5000" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Home Delivery Charge</label>
              <input name="homeDeliveryCharge" type="number" value={form.homeDeliveryCharge} onChange={handleChange} placeholder="e.g. 500" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.showOnTop ? "border-[#7C3AED] bg-[#7C3AED]" : "border-[#E4E5EF] group-hover:border-[#7C3AED]"}`}>
                {form.showOnTop && <CheckSquare size={12} className="text-white" />}
              </div>
              <input type="checkbox" name="showOnTop" checked={form.showOnTop} onChange={handleChange} className="hidden" />
              <span className="text-sm text-[#4A4A6A] font-medium">Show on Top</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.homeDeliveryAvailable ? "border-[#7C3AED] bg-[#7C3AED]" : "border-[#E4E5EF] group-hover:border-[#7C3AED]"}`}>
                {form.homeDeliveryAvailable && <CheckSquare size={12} className="text-white" />}
              </div>
              <input type="checkbox" name="homeDeliveryAvailable" checked={form.homeDeliveryAvailable} onChange={handleChange} className="hidden" />
              <span className="text-sm text-[#4A4A6A] font-medium">Home Delivery is available</span>
            </label>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-[#7C3AED] to-[#9D4EDD] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_4px_14px_rgba(124,58,237,0.4)]"
            >
              {loading ? "Adding..." : "Add Tempo"}
            </button>
            <p className="text-[#9090A8] text-xs">{imageFiles.length} image{imageFiles.length !== 1 ? "s" : ""} selected</p>
          </div>
        </div>
      </form>
    </div>
  );
}
