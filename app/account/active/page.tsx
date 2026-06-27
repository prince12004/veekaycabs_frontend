"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { MapPin, Phone, AlertTriangle, Calendar, Car, Fuel, Users, ChevronRight } from "lucide-react";

const ACTIVE_BOOKING = {
  bookingId: "DL_HyundaiCreta_PrincK_7823_2026",
  car: { name: "Hyundai Creta", type: "SUV", fuel: "Petrol", transmission: "Automatic", seats: 5, color: "White", regNo: "DL01AB1234" },
  startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 21 * 60 * 60 * 1000).toISOString(),
  pickupLocation: "Delhi Office — A 13, 1st Floor, Ganesh Nagar, New Delhi",
  totalAmount: 4504,
  balanceDue: 3504,
};

function Countdown({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) { setTimeLeft("Time Expired"); clearInterval(timer); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return <span className="font-black text-3xl text-white font-space-grotesk">{timeLeft}</span>;
}

export default function ActiveBookingPage() {
  const b = ACTIVE_BOOKING;

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F8F9FC] pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <div>
            <h1 className="text-3xl font-black text-[#0F0F1A] font-syne">Active Booking</h1>
            <p className="text-[#9090A8] font-mono text-sm mt-1">{b.bookingId}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main info */}
            <div className="lg:col-span-2 space-y-5">
              {/* Countdown Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-[#E8540A] to-[#FF6B35] rounded-2xl p-6 text-white"
              >
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-2">Time Remaining</p>
                <Countdown endTime={b.endTime} />
                <p className="text-white/70 text-sm mt-2">
                  Return by: {new Date(b.endTime).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </motion.div>

              {/* Car Details */}
              <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                <h3 className="font-bold text-[#0F0F1A] mb-4 font-syne">Your Car</h3>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-24 h-24 bg-[#F8F9FC] rounded-xl flex items-center justify-center text-5xl border border-[#E4E5EF]">🚙</div>
                  <div>
                    <h2 className="text-xl font-black text-[#0F0F1A] font-syne">{b.car.name}</h2>
                    <p className="text-[#9090A8] font-mono text-sm">{b.car.regNo}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-[#FFF3ED] text-[#E8540A] font-bold px-2 py-1 rounded-full">{b.car.type}</span>
                      <span className="text-xs bg-[#F8F9FC] text-[#4A4A6A] px-2 py-1 rounded-full border border-[#E4E5EF]">{b.car.color}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Fuel, label: b.car.fuel },
                    { icon: Car, label: b.car.transmission },
                    { icon: Users, label: `${b.car.seats} Seats` },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="bg-[#F8F9FC] rounded-xl p-3 flex items-center gap-2">
                      <Icon size={16} className="text-[#E8540A]" />
                      <span className="text-sm text-[#4A4A6A] font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Timeline */}
              <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                <h3 className="font-bold text-[#0F0F1A] mb-5 font-syne">Trip Timeline</h3>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#10B981] border-2 border-white shadow" />
                    <div className="w-0.5 h-12 bg-gradient-to-b from-[#10B981] to-[#E8540A]" />
                    <div className="w-4 h-4 rounded-full bg-[#E8540A] border-2 border-white shadow" />
                  </div>
                  <div className="flex-1 space-y-8">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#9090A8] mb-1">Pick Up</p>
                      <p className="font-bold text-[#0F0F1A]">{new Date(b.startTime).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#9090A8] mb-1">Return By</p>
                      <p className="font-bold text-[#0F0F1A]">{new Date(b.endTime).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side panel */}
            <div className="space-y-5">
              {/* Balance Due */}
              <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                <h3 className="font-bold text-[#0F0F1A] mb-4 font-syne">Payment</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A4A6A]">Total Amount</span>
                    <span className="font-bold text-[#0F0F1A]">Rs. {b.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A4A6A]">Token Paid</span>
                    <span className="font-bold text-[#10B981]">Rs. {(b.totalAmount - b.balanceDue).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t border-[#E4E5EF] pt-3 flex justify-between">
                    <span className="font-bold text-[#0F0F1A]">Balance Due</span>
                    <span className="font-black text-[#E8540A] text-lg">Rs. {b.balanceDue.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <p className="text-[#9090A8] text-xs mt-3">Balance due at return + security deposit (Rs. 10,000) will be collected.</p>
              </div>

              {/* Pickup Location */}
              <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#E8540A] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-[#0F0F1A] text-sm mb-1">Pickup Location</p>
                    <p className="text-[#4A4A6A] text-sm leading-relaxed">{b.pickupLocation}</p>
                  </div>
                </div>
              </div>

              {/* Emergency */}
              <div className="bg-[#FEE2E2] border border-red-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} className="text-[#EF4444]" />
                  <p className="font-bold text-[#991B1B] text-sm">Emergency / Issue?</p>
                </div>
                <a href="tel:+919999926867" className="w-full bg-[#EF4444] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#DC2626] transition-colors text-sm">
                  <Phone size={16} /> Call +91 99999 26867
                </a>
              </div>

              {/* Extend */}
              <Link href="/account/history" className="w-full bg-white border-[1.5px] border-[#E8540A] text-[#E8540A] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#FFF3ED] transition-colors text-sm">
                <Calendar size={16} /> Extend Booking <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Rules reminder */}
          <div className="bg-[#FFF3ED] border border-[#E8540A]/20 rounded-2xl p-6">
            <h4 className="font-bold text-[#E8540A] mb-3">⚠️ Important Reminders</h4>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-[#4A4A6A]">
              <p>• Maximum speed: 120 km/hr on highways</p>
              <p>• Return with full fuel tank</p>
              <p>• Keep original documents with you</p>
              <p>• Report any damage immediately</p>
              <p>• No sub-letting the vehicle</p>
              <p>• Parking fines are your responsibility</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
