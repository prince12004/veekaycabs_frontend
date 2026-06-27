"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Tempo {
  _id: string;
  name: string;
  registrationNo: string;
  seats: number;
  basePrice: number;
  pricePerDay: number;
}

export default function AddTempoBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tempos, setTempos] = useState<Tempo[]>([]);
  const [form, setForm] = useState({
    mobileNumber: "",
    tempoId: "",
    tripType: "round_trip",
    pickupCity: "Delhi",
    destination: "",
    pickupLocation: "",
    startTime: "",
    endTime: "",
    totalDays: "1",
    passengers: "1",
    totalAmount: "",
    paymentMode: "offline",
    notes: "",
  });

  useEffect(() => {
    adminApi.get("/api/admin/tempo").then(({ data }) => setTempos(data.data || [])).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mobileNumber || !form.tempoId || !form.startTime || !form.totalAmount) {
      toast.error("Mobile, Tempo, Start Time, and Total Amount are required");
      return;
    }
    setLoading(true);
    try {
      await adminApi.post("/api/admin/tempo-bookings/offline", {
        ...form,
        totalDays: Number(form.totalDays),
        passengers: Number(form.passengers),
        totalAmount: Number(form.totalAmount),
      });
      toast.success("Booking added successfully!");
      router.push("/admin/tempo-admin/bookings");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add booking";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const CITIES = ["Delhi", "Noida", "Gurgaon", "Ghaziabad", "Greater Noida", "Faridabad"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/tempo-admin/bookings" className="w-9 h-9 rounded-xl bg-white border border-[#E4E5EF] flex items-center justify-center text-[#4A4A6A] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Add Booking</h1>
          <p className="text-[#9090A8] text-sm mt-0.5">Create an offline booking manually</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E4E5EF]">
            <h2 className="font-bold text-[#0F0F1A] text-sm uppercase tracking-wider">MANAGE BOOKING</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Customer Mobile <span className="text-red-500">*</span></label>
              <input name="mobileNumber" value={form.mobileNumber} onChange={handleChange} placeholder="10-digit mobile" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Select Tempo <span className="text-red-500">*</span></label>
              <select name="tempoId" value={form.tempoId} onChange={handleChange} className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none bg-white" required>
                <option value="">Select Tempo</option>
                {tempos.map(t => (
                  <option key={t._id} value={t._id}>{t.name} — {t.registrationNo} ({t.seats} seats)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Trip Type</label>
              <select name="tripType" value={form.tripType} onChange={handleChange} className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none bg-white">
                <option value="round_trip">Round Trip</option>
                <option value="local">Local Trip</option>
                <option value="outstation">Outstation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Pickup City</label>
              <select name="pickupCity" value={form.pickupCity} onChange={handleChange} className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none bg-white">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Destination</label>
              <input name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Haridwar" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Pickup Location</label>
              <input name="pickupLocation" value={form.pickupLocation} onChange={handleChange} placeholder="Full pickup address" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Start Date & Time <span className="text-red-500">*</span></label>
              <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">End Date & Time</label>
              <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Total Days</label>
              <input type="number" min="1" name="totalDays" value={form.totalDays} onChange={handleChange} className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Passengers</label>
              <input type="number" min="1" name="passengers" value={form.passengers} onChange={handleChange} className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Total Amount (₹) <span className="text-red-500">*</span></label>
              <input type="number" name="totalAmount" value={form.totalAmount} onChange={handleChange} placeholder="e.g. 8500" className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Payment Mode</label>
              <select name="paymentMode" value={form.paymentMode} onChange={handleChange} className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none bg-white">
                <option value="offline">Offline / Cash</option>
                <option value="online">Online</option>
                <option value="upi">UPI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Any special instructions or notes..." className="w-full px-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none resize-none" />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-[#7C3AED] to-[#9D4EDD] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_4px_14px_rgba(124,58,237,0.4)]"
            >
              {loading ? "Adding..." : "Add Booking"}
            </button>
            <Link href="/admin/tempo-admin/bookings" className="px-6 py-3 border border-[#E4E5EF] rounded-xl text-sm font-semibold text-[#4A4A6A] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
