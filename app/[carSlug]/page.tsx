"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, notFound } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Clock,
  Fuel,
  Users,
  Settings,
  Shield,
  FileText,
  CheckCircle,
  Tag,
  Lock,
  Truck,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { cn, getDefaultBookingWindow, getSlotHours, getDurationLabel } from "@/lib/utils";
import { MIN_BOOKING_HOURS } from "@/lib/constants";
import { getCarById } from "@/lib/cars-data";

const PICKUP_LOCATIONS = [
  { id: "delhi", label: "Delhi Office", address: "A 13, 1st Floor, Ganesh Nagar, New Delhi" },
  { id: "noida", label: "Noida Office", address: "Sector 62, Noida, UP" },
  { id: "gurgaon", label: "Gurgaon Office", address: "Cyber Hub, Gurugram, Haryana" },
];

const DOCS_REQUIRED = [
  "Aadhaar Card (front & back)",
  "PAN Card",
  "Valid Driving Licence (1+ year old)",
  "Selfie with Driving Licence",
];

const TERMS = [
  "Minimum age: 21 years",
  "Speed limit: 120 km/hr",
  "No smoking inside the vehicle",
  "Driver must carry original DL",
  "Fuel to be refilled before return",
  "No outstation travel without prior approval",
];

export default function CarSlugPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const carSlug = String(params.carSlug);
  const CAR = getCarById(carSlug);

  if (!CAR) notFound();

  const city = searchParams.get("city") || "Delhi";
  const fallback = getDefaultBookingWindow();
  const startSlot = searchParams.get("start") || fallback.start;
  const endSlot = searchParams.get("end") || fallback.end;
  const hours = getSlotHours(startSlot, endSlot);

  const formatTripDate = (slot: string) => {
    const [d, t] = slot.split(" ");
    const dateObj = new Date(`${d}T${t || "00:00"}:00`);
    return {
      date: dateObj.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      time: dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  };
  const tripStart = formatTripDate(startSlot);
  const tripEnd = formatTripDate(endSlot);

  const [pickupLocation, setPickupLocation] = useState("delhi");
  const [doorstep, setDoorstep] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"token" | "full">("token");

  const baseFare = CAR.pricePerHr * hours;
  const gst = Math.round(baseFare * 0.05);
  const doorstepFee = doorstep ? 500 : 0;
  const discount = couponApplied ? 200 : 0;
  const total = baseFare + CAR.securityDeposit + gst + doorstepFee - discount;
  const tokenAmount = Math.min(1000, Math.round(total * 0.2));
  const balanceDue = total - tokenAmount;

  const applyCoupon = () => {
    if (coupon.toUpperCase() === "VKFIRST") setCouponApplied(true);
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F8F9FC] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#9090A8] mb-6">
            <Link href="/" className="hover:text-[#E8540A] transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link href={`/book?city=${city}&start=${startSlot}&end=${endSlot}`} className="hover:text-[#E8540A] transition-colors">Book a Car</Link>
            <ChevronRight size={14} />
            <span className="text-[#0F0F1A] font-medium">{CAR.name} — Booking Summary</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT — Trip Details */}
            <div className="lg:col-span-2 space-y-5">
              {/* Card 1: Trip Overview */}
              <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="bg-gradient-to-r from-[#E8540A] to-[#FF6B35] px-6 py-4">
                  <h2 className="text-white font-bold font-syne text-lg">Your Trip Details</h2>
                </div>
                <div className="p-6">
                  <div className="flex gap-5 items-center mb-6">
                    <div className={cn("w-28 h-24 bg-gradient-to-br rounded-xl overflow-hidden shrink-0", CAR.gradient)}>
                      <img
                        src={CAR.image}
                        alt={CAR.name}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
                      />
                    </div>
                    <div>
                      <h3 className="font-black font-syne text-xl text-[#0F0F1A]">{CAR.name}</h3>
                      <p className="text-[#9090A8] text-sm mt-0.5">{CAR.type} • {CAR.year} • {CAR.fuel} • {CAR.transmission}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="bg-[#FFF3ED] text-[#E8540A] text-xs font-bold px-3 py-1 rounded-full">
                          Rs. {CAR.pricePerHr}/hr
                        </span>
                        <span className="bg-[#D1FAE5] text-[#065F46] text-xs font-bold px-3 py-1 rounded-full">
                          {CAR.kmIncluded} km included
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    <div className="flex items-center gap-4">
                      <div className="text-center w-24 shrink-0">
                        <div className="w-4 h-4 rounded-full bg-[#10B981] mx-auto mb-1 ring-4 ring-[#10B981]/20" />
                        <p className="text-xs font-bold text-[#0F0F1A]">{tripStart.date}</p>
                        <p className="text-xs text-[#9090A8]">{tripStart.time}</p>
                      </div>
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-[#10B981] to-[#E8540A] relative">
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center">
                          <span className="bg-[#FFF3ED] text-[#E8540A] text-xs font-bold px-3 py-1 rounded-full border border-[#E8540A]/30 whitespace-nowrap">
                            {getDurationLabel(hours)} • {CAR.kmIncluded} km
                          </span>
                        </div>
                      </div>
                      <div className="text-center w-24 shrink-0">
                        <div className="w-4 h-4 rounded-full bg-[#E8540A] mx-auto mb-1 ring-4 ring-[#E8540A]/20" />
                        <p className="text-xs font-bold text-[#0F0F1A]">{tripEnd.date}</p>
                        <p className="text-xs text-[#9090A8]">{tripEnd.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Car Specs */}
              <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-4 flex items-center gap-2">
                  <Settings size={16} className="text-[#E8540A]" />
                  Car Specifications
                </h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Fuel, label: CAR.fuel },
                    { icon: Settings, label: CAR.transmission },
                    { icon: Users, label: `${CAR.seats} Seats` },
                    { icon: MapPin, label: `${CAR.kmIncluded} km included` },
                    { icon: Clock, label: `Min ${MIN_BOOKING_HOURS} hrs` },
                    { icon: Shield, label: "Fully Insured" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 bg-[#F8F9FC] border border-[#E4E5EF] rounded-xl px-4 py-2">
                      <Icon size={14} className="text-[#E8540A]" />
                      <span className="text-[#4A4A6A] text-sm font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Documents Required */}
              <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-[#E8540A]" />
                  Documents Required
                </h3>
                <ul className="space-y-2.5">
                  {DOCS_REQUIRED.map((doc) => (
                    <li key={doc} className="flex items-center gap-3">
                      <CheckCircle size={14} className="text-[#10B981] shrink-0" />
                      <span className="text-[#4A4A6A] text-sm">{doc}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-[#FFF3ED] rounded-xl border border-[#E8540A]/20">
                  <p className="text-[#E8540A] text-xs font-semibold">
                    Documents must be uploaded and verified before pickup. Complete KYC under My Account.
                  </p>
                </div>
              </div>

              {/* Card 4: Terms */}
              <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-4 flex items-center gap-2">
                  <Shield size={16} className="text-[#E8540A]" />
                  Terms & Conditions
                </h3>
                <ul className="space-y-2.5">
                  {TERMS.map((term) => (
                    <li key={term} className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="accent-[#E8540A] w-4 h-4 rounded" />
                      <span className="text-[#4A4A6A] text-sm">{term}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[#9090A8] mt-4">
                  By proceeding to pay, you agree to our{" "}
                  <Link href="/terms" className="text-[#E8540A] hover:underline">Terms & Conditions</Link>
                  {" "}and{" "}
                  <Link href="/cancellation" className="text-[#E8540A] hover:underline">Cancellation Policy</Link>.
                </p>
              </div>
            </div>

            {/* RIGHT — Sticky Sidebar */}
            <div className="space-y-5">
              <div className="lg:sticky lg:top-24 space-y-5">
                {/* Pickup Location */}
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-[#E8540A]" />
                    Select Pickup Location
                  </h3>
                  <div className="space-y-2.5 mb-4">
                    {PICKUP_LOCATIONS.map((loc) => (
                      <label
                        key={loc.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                          pickupLocation === loc.id
                            ? "border-[#E8540A] bg-[#FFF3ED]"
                            : "border-[#E4E5EF] hover:border-[#E8540A]/50"
                        )}
                      >
                        <div className="relative mt-0.5">
                          <input
                            type="radio"
                            name="pickup"
                            value={loc.id}
                            checked={pickupLocation === loc.id}
                            onChange={() => setPickupLocation(loc.id)}
                            className="sr-only"
                          />
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                            pickupLocation === loc.id ? "border-[#E8540A]" : "border-[#9090A8]"
                          )}>
                            {pickupLocation === loc.id && (
                              <div className="w-2 h-2 rounded-full bg-[#E8540A]" />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[#0F0F1A] text-sm font-semibold">{loc.label}</p>
                          <p className="text-[#9090A8] text-xs mt-0.5">{loc.address}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Doorstep Toggle */}
                  <div className="flex items-center justify-between p-3 bg-[#F8F9FC] rounded-xl border border-[#E4E5EF]">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-[#E8540A]" />
                      <div>
                        <p className="text-[#0F0F1A] text-sm font-semibold">Doorstep Delivery</p>
                        <p className="text-[#9090A8] text-xs">+Rs. 500</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDoorstep(!doorstep)}
                      className={cn(
                        "w-11 h-6 rounded-full transition-all relative",
                        doorstep ? "bg-[#E8540A]" : "bg-[#E4E5EF]"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
                        doorstep ? "left-5" : "left-0.5"
                      )} />
                    </button>
                  </div>
                </div>

                {/* Fare Breakdown */}
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-4">Fare Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { label: `Base fare (Rs. ${CAR.pricePerHr} × ${hours} hrs)`, value: baseFare },
                      { label: "Security deposit (refundable)", value: CAR.securityDeposit },
                      { label: "GST (5%)", value: gst },
                      ...(doorstep ? [{ label: "Doorstep delivery", value: doorstepFee }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-[#4A4A6A]">{label}</span>
                        <span className="text-[#0F0F1A] font-semibold">Rs. {value.toLocaleString("en-IN")}</span>
                      </div>
                    ))}

                    {couponApplied && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#10B981] flex items-center gap-1"><Tag size={12} /> Discount (VKFIRST)</span>
                        <span className="text-[#10B981] font-semibold">- Rs. {discount}</span>
                      </div>
                    )}

                    <div className="border-t border-[#E4E5EF] pt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F0F1A] font-syne">Total Amount</span>
                        <span className="font-black text-[#0F0F1A] font-syne text-xl">Rs. {total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Token / Balance Split */}
                    <div className="bg-[#F8F9FC] rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#4A4A6A]">Token amount (pay now)</span>
                        <span className="text-[#E8540A] font-bold">Rs. {tokenAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E4E5EF] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E8540A] rounded-full" style={{ width: `${(tokenAmount / total) * 100}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#4A4A6A]">Balance due at pickup</span>
                        <span className="text-[#0F0F1A] font-bold">Rs. {balanceDue.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-5">
                  <p className="text-[#0F0F1A] text-sm font-semibold mb-2 flex items-center gap-2">
                    <Tag size={14} className="text-[#E8540A]" />
                    Promo Code
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      placeholder="Enter code (try VKFIRST)"
                      className="flex-1 border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2 text-sm text-[#0F0F1A] placeholder:text-[#9090A8]"
                      disabled={couponApplied}
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponApplied || !coupon}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                        couponApplied
                          ? "bg-[#D1FAE5] text-[#065F46]"
                          : "btn-gradient text-white"
                      )}
                    >
                      {couponApplied ? "Applied ✓" : "Apply"}
                    </button>
                  </div>
                </div>

                {/* Payment Toggle + Pay Button */}
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-5">
                  <div className="flex gap-2 mb-4 bg-[#F8F9FC] p-1 rounded-xl">
                    {(["token", "full"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                          paymentMode === mode
                            ? "bg-white text-[#0F0F1A] shadow-sm"
                            : "text-[#9090A8]"
                        )}
                      >
                        {mode === "token" ? `Token Rs. ${tokenAmount.toLocaleString("en-IN")}` : `Full Rs. ${total.toLocaleString("en-IN")}`}
                      </button>
                    ))}
                  </div>

                  <button className="w-full btn-gradient py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_12px_32px_rgba(232,84,10,0.4)]">
                    <Lock size={16} />
                    Pay Now Rs. {paymentMode === "token" ? tokenAmount.toLocaleString("en-IN") : total.toLocaleString("en-IN")}
                  </button>

                  <p className="text-center text-xs text-[#9090A8] mt-3">
                    100% secure payment • Instant confirmation via SMS & Email
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
