"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Users, Fuel, IndianRupee, Phone, ChevronRight,
  CheckCircle, Calendar, Clock, Shield, Star, ArrowLeft,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { LocationInput } from "@/components/ui/LocationAutocomplete";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Tempo {
  _id: string;
  name: string;
  registrationNo: string;
  seats: number;
  fuel: string;
  location: string;
  basePrice: number;
  pricePerDay: number;
  pricePerKm: number;
  tollForExtraTrip: number;
  refundableDeposit: number;
  homeDeliveryAvailable: boolean;
  homeDeliveryCharge: number;
  shortDescription: string;
  images: string[];
  slug: string;
  showOnTop: boolean;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string; amount: number; currency: string; name: string;
  description: string; order_id: string; prefill?: Record<string, string>;
  theme?: { color: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss: () => void };
}
interface RazorpayInstance { open(): void; }

const FEATURES = ["AC Vehicle", "GPS Enabled", "Music System", "Experienced Driver", "24/7 Support", "Insured Trip"];
const TERMS = [
  "Valid ID proof required at pickup",
  "No smoking/drinking inside vehicle",
  "Toll & parking charges extra",
  "Driver allowance included",
  "Fuel included in price per km",
];

export default function TempoDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = String(params.slug);

  const city = searchParams.get("city") || "Delhi";
  const tripType = searchParams.get("tripType") || "round_trip";
  const startParam = searchParams.get("start") || "";
  const endParam = searchParams.get("end") || "";
  const daysParam = Number(searchParams.get("days") || 1);

  const [tempo, setTempo] = useState<Tempo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking form
  const [destination, setDestination] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [paymentMode, setPaymentMode] = useState<"token" | "full">("token");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetchTempo();
  }, [slug]);

  const fetchTempo = async () => {
    try {
      const { data } = await api.get(`/api/tempo/${slug}`);
      setTempo(data.data);
    } catch {
      toast.error("Tempo not found");
    } finally {
      setLoading(false);
    }
  };

  // Fare calculation — no GST; local = 200 km, outstation = 250 km/day
  const days = daysParam || 1;
  const kmPerDay = tripType === "local" ? 200 : 250;
  const kmIncluded = kmPerDay * days;
  const baseFare = tempo ? tempo.basePrice + (tempo.pricePerDay * Math.max(0, days - 1)) : 0;
  const securityDeposit = tempo?.refundableDeposit || 0;
  const totalAmount = baseFare + (tempo?.tollForExtraTrip || 0) + securityDeposit;
  const tokenAmount = Math.round(totalAmount * 0.10);
  const balanceDue = totalAmount - tokenAmount;
  const toPay = paymentMode === "token" ? tokenAmount : totalAmount;

  const handleBook = async () => {
    const user = typeof window !== "undefined" ? localStorage.getItem("vk_user") : null;
    if (!user) {
      toast.error("Please login to book");
      router.push(`/login?redirect=/tempo-traveller/${slug}`);
      return;
    }
    if (!destination) { toast.error("Please enter destination"); return; }
    if (!agreed) { toast.error("Please accept the terms"); return; }
    if (!tempo) return;

    setBookingLoading(true);
    try {
      // 1. Create booking record
      const { data: bookingRes } = await api.post("/api/tempo/bookings", {
        tempoId: tempo._id,
        tripType,
        pickupCity: city,
        destination,
        pickupLocation,
        startTime: startParam || new Date().toISOString(),
        endTime: endParam || new Date(Date.now() + days * 86400000).toISOString(),
        totalDays: days,
        passengers,
        baseFare,
        gst: 0,
        totalAmount,
        tokenAmount,
        balanceDue,
        securityDeposit,
        paymentMode: "online",
      });

      // 2. Create Razorpay order
      const { data: orderRes } = await api.post("/api/payments/create-order", {
        amount: toPay,
        bookingId: bookingRes.data._id,
        purpose: "tempo_booking",
      });

      // 3. Open Razorpay
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          amount: toPay * 100,
          currency: "INR",
          name: "Veekay Cabs",
          description: `Tempo Traveller Booking - ${tempo.name}`,
          order_id: orderRes.data.orderId,
          prefill: {
            name: JSON.parse(user).name || "",
            contact: JSON.parse(user).mobile || "",
          },
          theme: { color: "#7C3AED" },
          handler: async (response) => {
            try {
              await api.post("/api/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingRes.data._id,
                type: "tempo",
              });
              toast.success("Booking confirmed! 🎉");
              router.push("/account");
            } catch {
              toast.error("Payment verification failed. Contact support.");
            }
          },
          modal: { ondismiss: () => setBookingLoading(false) },
        });
        rzp.open();
      };
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Booking failed";
      toast.error(msg);
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9090A8]">Loading tempo details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!tempo) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚐</div>
            <h2 className="text-2xl font-black text-[#0F0F1A] font-syne mb-2">Tempo Not Found</h2>
            <Link href="/tempo-traveller" className="text-[#7C3AED] font-semibold">← Back to listing</Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <div className="bg-[#F8F9FC] border-b border-[#E4E5EF] pt-24 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-[#9090A8]">
            <Link href="/" className="hover:text-[#7C3AED] transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link href="/tempo-traveller" className="hover:text-[#7C3AED] transition-colors">Tempo Traveller</Link>
            <ChevronRight size={14} />
            <span className="text-[#0F0F1A] font-semibold">{tempo.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/tempo-traveller" className="inline-flex items-center gap-1.5 text-[#7C3AED] text-sm font-semibold mb-6 hover:gap-2 transition-all">
          <ArrowLeft size={15} /> Back to listing
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
              <div className="relative h-72 md:h-96 bg-gradient-to-br from-[#7C3AED]/10 to-[#A855F7]/5">
                {tempo.images?.[activeImage] ? (
                  <img src={tempo.images[activeImage]} alt={tempo.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-8xl opacity-30">🚐</span>
                  </div>
                )}
                {tempo.showOnTop && (
                  <div className="absolute top-4 left-4 bg-[#7C3AED] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={11} fill="white" /> FEATURED
                  </div>
                )}
              </div>
              {tempo.images?.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto">
                  {tempo.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${i === activeImage ? "border-[#7C3AED]" : "border-transparent"}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">{tempo.name}</h1>
                  <p className="text-[#9090A8] text-sm font-mono mt-0.5">{tempo.registrationNo}</p>
                </div>
                {tempo.showOnTop && (
                  <div className="flex items-center gap-1 text-[#F59E0B] bg-[#FEF3C7] px-3 py-1 rounded-full text-xs font-bold">
                    <Star size={12} fill="#F59E0B" /> Top Pick
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1.5 text-[#4A4A6A]"><Users size={15} className="text-[#7C3AED]" />{tempo.seats} Seater</div>
                <div className="flex items-center gap-1.5 text-[#4A4A6A]"><Fuel size={15} className="text-[#7C3AED]" />{tempo.fuel}</div>
                <div className="flex items-center gap-1.5 text-[#4A4A6A]"><MapPin size={15} className="text-[#7C3AED]" />{tempo.location}</div>
                {tempo.homeDeliveryAvailable && (
                  <div className="flex items-center gap-1.5 text-[#10B981]"><CheckCircle size={15} />Home Delivery Available</div>
                )}
              </div>

              {tempo.shortDescription && (
                <p className="text-[#4A4A6A] text-sm leading-relaxed border-t border-[#F0F1F6] pt-4">{tempo.shortDescription}</p>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6">
              <h2 className="font-black text-[#0F0F1A] font-syne mb-4 flex items-center gap-2">
                <IndianRupee size={16} className="text-[#7C3AED]" /> Pricing Details
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Base Price", value: `₹${tempo.basePrice.toLocaleString("en-IN")}`, sub: "starting fare" },
                  { label: "Per Day", value: `₹${tempo.pricePerDay.toLocaleString("en-IN")}`, sub: "per additional day" },
                  { label: "Per KM", value: `₹${tempo.pricePerKm}`, sub: "per kilometer" },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="bg-[#F5F3FF] rounded-xl p-4 text-center">
                    <p className="text-[#7C3AED] font-black text-xl">{value}</p>
                    <p className="text-[#0F0F1A] font-semibold text-xs mt-0.5">{label}</p>
                    <p className="text-[#9090A8] text-[10px]">{sub}</p>
                  </div>
                ))}
              </div>
              {tempo.refundableDeposit > 0 && (
                <div className="mt-4 flex items-center gap-2 bg-[#D1FAE5] rounded-xl px-4 py-2.5 text-sm text-[#10B981] font-semibold">
                  <Shield size={14} />
                  Refundable Security Deposit: ₹{tempo.refundableDeposit.toLocaleString("en-IN")}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6">
              <h2 className="font-black text-[#0F0F1A] font-syne mb-4">Inclusions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-[#4A4A6A]">
                    <CheckCircle size={15} className="text-[#10B981] shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="bg-[#FFF3ED] rounded-2xl border border-[#E8540A]/20 p-6">
              <h2 className="font-black text-[#0F0F1A] font-syne mb-3 flex items-center gap-2">
                <Shield size={15} className="text-[#E8540A]" /> Terms & Conditions
              </h2>
              <ul className="space-y-2">
                {TERMS.map(t => (
                  <li key={t} className="flex items-start gap-2 text-sm text-[#4A4A6A]">
                    <span className="text-[#E8540A] mt-0.5">•</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_8px_30px_rgba(0,0,0,0.08)] sticky top-24">
              <div className="bg-gradient-to-r from-[#7C3AED] to-[#A855F7] p-5 rounded-t-2xl">
                <h2 className="text-white font-black text-lg font-syne">Book This Tempo</h2>
                <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
                  <Calendar size={13} />{days} day{days !== 1 ? "s" : ""} ·{" "}
                  {tripType === "round_trip" ? "Round Trip" : "Local"} · {city}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Destination */}
                <div>
                  <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <LocationInput
                    value={destination}
                    onChange={setDestination}
                    placeholder="e.g. Agra, Jaipur, Haridwar..."
                    className="w-full px-3 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none"
                  />
                </div>

                {/* Pickup Location */}
                <div>
                  <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Pickup Address</label>
                  <LocationInput
                    value={pickupLocation}
                    onChange={setPickupLocation}
                    placeholder="Your pickup address (optional)"
                    className="w-full px-3 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none"
                  />
                </div>

                {/* Passengers */}
                <div>
                  <label className="block text-sm font-semibold text-[#4A4A6A] mb-1.5">Passengers</label>
                  <select
                    value={passengers}
                    onChange={e => setPassengers(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#7C3AED] outline-none bg-white"
                  >
                    {Array.from({ length: tempo.seats }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} Passenger{n > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>

                {/* Dates Summary */}
                {startParam && (
                  <div className="bg-[#F8F9FC] rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#4A4A6A]">
                      <span className="flex items-center gap-1"><Clock size={11} /> Pickup</span>
                      <span className="font-semibold">{new Date(startParam).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <div className="flex justify-between text-[#4A4A6A]">
                      <span className="flex items-center gap-1"><Clock size={11} /> Return</span>
                      <span className="font-semibold">{new Date(endParam).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                  </div>
                )}

                {/* Fare Breakdown */}
                <div className="bg-[#F5F3FF] rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-[#4A4A6A]">
                    <span>Base Fare</span><span className="font-semibold">₹{baseFare.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#10B981] text-xs font-semibold">
                    <CheckCircle size={12} />
                    {kmIncluded} km included ({kmPerDay} km/day)
                  </div>
                  {tempo.tollForExtraTrip > 0 && (
                    <div className="flex justify-between text-[#4A4A6A]">
                      <span>Toll</span><span className="font-semibold">₹{tempo.tollForExtraTrip.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {securityDeposit > 0 && (
                    <div className="flex justify-between text-[#4A4A6A]">
                      <span className="flex items-center gap-1"><Shield size={11} className="text-[#10B981]" /> Security Deposit (Refundable)</span>
                      <span className="font-semibold text-[#10B981]">₹{securityDeposit.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="border-t border-[#7C3AED]/20 pt-2 flex justify-between font-black text-[#0F0F1A]">
                    <span>Total</span><span className="text-[#7C3AED]">₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Payment Mode */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#4A4A6A]">Pay Now</p>
                  {[
                    { value: "token", label: "Token Amount (10%)", amount: tokenAmount, desc: `Pay ₹${tokenAmount.toLocaleString("en-IN")} now · ₹${balanceDue.toLocaleString("en-IN")} on pickup` },
                    { value: "full", label: "Full Payment", amount: totalAmount, desc: "Pay full amount now (deposit included)" },
                  ].map(opt => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMode === opt.value ? "border-[#7C3AED] bg-[#F5F3FF]" : "border-[#E4E5EF] hover:border-[#7C3AED]/40"}`}>
                      <input type="radio" name="payMode" value={opt.value} checked={paymentMode === opt.value} onChange={() => setPaymentMode(opt.value as "token" | "full")} className="mt-0.5 accent-[#7C3AED]" />
                      <div>
                        <p className="font-semibold text-sm text-[#0F0F1A]">{opt.label}</p>
                        <p className="text-xs text-[#9090A8]">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* T&C */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-[#7C3AED]" />
                  <span className="text-xs text-[#4A4A6A]">
                    I agree to the <Link href="/terms" className="text-[#7C3AED] font-semibold">terms & conditions</Link> and <Link href="/cancellation" className="text-[#7C3AED] font-semibold">cancellation policy</Link>
                  </span>
                </label>

                {/* Book Button */}
                <button
                  onClick={handleBook}
                  disabled={bookingLoading}
                  className="w-full py-4 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-black rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_4px_20px_rgba(124,58,237,0.4)] text-base"
                >
                  {bookingLoading ? "Processing..." : `Pay ₹${toPay.toLocaleString("en-IN")}`}
                </button>

                {/* Call Option */}
                <div className="text-center">
                  <p className="text-xs text-[#9090A8] mb-2">Or book via call</p>
                  <a href="tel:+919999926867" className="flex items-center justify-center gap-2 w-full py-3 border-2 border-[#E4E5EF] rounded-xl text-[#0F0F1A] font-semibold text-sm hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all">
                    <Phone size={15} />
                    +91 99999 26867
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
