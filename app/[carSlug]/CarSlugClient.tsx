"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter, notFound } from "next/navigation";
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
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { cn, getDefaultBookingWindow, getSlotHours, getDurationLabel } from "@/lib/utils";
import { MIN_BOOKING_HOURS } from "@/lib/constants";
import { getCarById } from "@/lib/cars-data";
import api, { bookingsAPI, paymentsAPI, carsAPI } from "@/lib/api";
import toast from "react-hot-toast";

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

export default function CarSlugClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const carSlug = String(params.carSlug);
  const localCar = getCarById(carSlug);

  const city   = searchParams.get("city")  || "Delhi";
  const carId  = searchParams.get("carId") || "";   // real MongoDB _id passed from book page
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
  const [couponData, setCouponData] = useState<{ discountType: string; discountValue: number; maxDiscount?: number; discountAmount?: number } | null>(null);
  const [paymentMode, setPaymentMode] = useState<"token" | "full">("token");
  const [showKmModal, setShowKmModal] = useState(false);
  // Site-wide defaults, fetched from /api/public/settings. Overridden below
  // by this specific car's own kmPackage/extraKmRate when it has one set —
  // otherwise every car would show the same policy regardless of what's
  // configured on it in Add/Edit Car.
  const [globalKmPolicy, setGlobalKmPolicy] = useState({ includedKmPerDay: 250, extraKmRate: 12 });
  const [doorstepCharge, setDoorstepCharge] = useState(500);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryAddressError, setDeliveryAddressError] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [apiCar, setApiCar] = useState<any>(null);
  const [carFetchDone, setCarFetchDone] = useState(!!localCar);

  const SESSION_KEY = `vk_booking_${carSlug}`;

  // Always fetch car from API when carId is available so admin changes to pricing are reflected
  useEffect(() => {
    if (carId) {
      carsAPI.getById(carId)
        .then(({ data }) => {
          setApiCar(data.data);
          if (data.data?.doorstepDeliveryCharge !== undefined) {
            setDoorstepCharge(data.data.doorstepDeliveryCharge);
          } else if (data.data?.cityId?.deliveryCharge !== undefined) {
            setDoorstepCharge(data.data.cityId.deliveryCharge);
          }
        })
        .catch(() => {})
        .finally(() => setCarFetchDone(!!localCar || true));
    } else if (!localCar) {
      setCarFetchDone(true);
    }
  }, []);

  useEffect(() => {
    api.get("/api/public/settings").then(({ data }) => {
      if (data?.data) {
        setGlobalKmPolicy({
          includedKmPerDay: data.data.includedKmPerDay || 250,
          extraKmRate: data.data.extraKmRate || 12,
        });
        // Only use global setting if no carId (can't fetch car-specific charge)
        if (!carId && data.data.doorstepDeliveryCharge) {
          setDoorstepCharge(data.data.doorstepDeliveryCharge);
        }
      }
    }).catch(() => {});
  }, []);

  // This car's own policy wins over the site-wide default whenever it's set
  // (Add/Edit Car → Pricing). Falls back to the global setting otherwise.
  const kmPolicy = {
    includedKmPerDay: (() => {
      const perDay = apiCar?.kmPackage ? parseInt(apiCar.kmPackage, 10) : NaN;
      return Number.isFinite(perDay) && perDay > 0 ? perDay : globalKmPolicy.includedKmPerDay;
    })(),
    extraKmRate: apiCar?.extraKmRate > 0 ? apiCar.extraKmRate : globalKmPolicy.extraKmRate,
  };

  // Restore saved state on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.coupon) setCoupon(s.coupon);
        if (s.couponApplied) setCouponApplied(s.couponApplied);
        if (s.couponData) setCouponData(s.couponData);
        if (s.doorstep) setDoorstep(s.doorstep);
        if (s.deliveryAddress) setDeliveryAddress(s.deliveryAddress);
      }
    } catch {}
  }, []);

  // Persist state on change
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ coupon, couponApplied, couponData, doorstep, deliveryAddress }));
    } catch {}
  }, [coupon, couponApplied, couponData, doorstep, deliveryAddress]);

  // Show spinner while fetching non-local car from API
  if (!localCar && !carFetchDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
        <Loader2 size={40} className="animate-spin text-[#E8540A]" />
      </div>
    );
  }

  // API pricing overrides static data so admin changes always reflect on booking page
  const CAR = (localCar || apiCar) ? {
    name: apiCar?.name || localCar?.name,
    type: apiCar?.type || localCar?.type,
    fuel: apiCar?.fuel || localCar?.fuel,
    transmission: apiCar?.transmission || localCar?.transmission,
    seats: apiCar?.seats || localCar?.seats,
    pricePerHr: apiCar?.regularPrice || localCar?.pricePerHr,
    securityDeposit: apiCar?.securityDeposit ?? localCar?.securityDeposit ?? 10000,
    doorstepDeliveryCharge: apiCar?.doorstepDeliveryCharge ?? 500,
    year: apiCar?.modelYear || localCar?.year || 2023,
    image: apiCar?.images?.[0] || localCar?.image || "",
    gradient: localCar?.gradient || "from-[#1C1C2E] to-[#242438]",
    badge: apiCar?.type || localCar?.badge,
    badgeColor: localCar?.badgeColor || "#E8540A",
    rating: localCar?.rating || 4.8,
    reviews: localCar?.reviews || 0,
    kmPackage: apiCar?.kmPackage || (localCar?.kmIncluded ? `${localCar.kmIncluded} km/day` : "250 km/day"),
  } : null;

  if (!CAR) notFound();

  const isOneDayBooking = hours >= 24 && hours < 48;

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const proceedToPayment = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("vk_token") : null;
    const redirectTarget = `/${carSlug}?city=${city}&carId=${carId}&start=${startSlot}&end=${endSlot}`;
    if (!token) {
      toast.error("Please login to continue booking");
      router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    // Google sign-in leaves a placeholder mobile until the user adds and
    // OTP-verifies a real one — booking confirmations go out over WhatsApp/
    // SMS, so send them to add it first instead of letting the booking fail
    // server-side with no number to actually notify.
    const currentUser = JSON.parse(localStorage.getItem("vk_user") || "{}");
    if (String(currentUser?.mobile || "").startsWith("google_")) {
      toast.error("Please add and verify your mobile number before booking");
      localStorage.setItem("vk_login_redirect", redirectTarget);
      router.push("/auth/add-mobile");
      return;
    }

    if (doorstep && !deliveryAddress.trim()) {
      setDeliveryAddressError(true);
      return;
    }

    setPayLoading(true);
    try {
      const startISO = new Date(startSlot.replace(" ", "T")).toISOString();
      const endISO   = new Date(endSlot.replace(" ", "T")).toISOString();

      // Resolve real MongoDB car _id
      let realCarId = carId; // passed from book page via URL param
      if (!realCarId) {
        // Fallback: search by name
        const { data: carsData } = await carsAPI.getAvailable({ city, startTime: startISO, endTime: endISO });
        const realCar = (carsData.data || []).find(
          (c: any) => c.name.toLowerCase() === CAR!.name.toLowerCase()
        );
        if (!realCar) { toast.error("Car not available. Please go back and search again."); return; }
        realCarId = realCar._id;
      }

      // Create booking on backend
      const { data: bookingData } = await bookingsAPI.create({
        carId: realCarId,
        startTime: startISO,
        endTime: endISO,
        pickupLocation: doorstep ? (deliveryAddress || "Doorstep Delivery") : (PICKUP_LOCATIONS.find(l => l.id === pickupLocation)?.address || pickupLocation),
        doorstepDelivery: doorstep,
        deliveryAddress: doorstep ? deliveryAddress : undefined,
        couponCode: couponApplied ? coupon : undefined,
      });

      const { razorpayOrderId, razorpayKeyId, fareBreakdown, booking } = bookingData.data;
      const payAmount = paymentMode === "full" ? fareBreakdown.totalAmount : fareBreakdown.tokenAmount;

      if (!razorpayOrderId) {
        toast.error("Payment gateway error. Please try again.");
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) { toast.error("Failed to load payment gateway. Check your internet connection."); return; }

      const user = JSON.parse(localStorage.getItem("vk_user") || "{}");

      const rzp = new (window as any).Razorpay({
        key: razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: payAmount * 100,
        currency: "INR",
        name: "Veekay Cabs",
        description: `Booking ${booking.bookingId} — ${CAR.name}`,
        order_id: razorpayOrderId,
        prefill: {
          name:    user?.name  || "",
          contact: (user?.mobile && !user.mobile.startsWith("google_")) ? user.mobile : "",
          email:   user?.email  || "",
        },
        theme: { color: "#E8540A" },
        handler: async (response: any) => {
          try {
            await paymentsAPI.verify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              bookingId: booking.bookingId,
            });
            toast.success("Booking confirmed! Check your SMS for details.");
            router.push("/account/history");
          } catch {
            toast.error("Payment received but verification failed. Please contact support with your payment ID: " + response.razorpay_payment_id);
          }
        },
        modal: {
          ondismiss: () => { toast("Payment cancelled. Your booking is on hold.", { icon: "ℹ️" }); },
        },
      });
      rzp.open();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(msg);
      // Defense in depth — the client-side check above should already catch
      // this, but if localStorage's cached user was stale, fall back to the
      // server's own rejection here.
      if (e?.response?.data?.code === "MOBILE_NOT_VERIFIED") {
        localStorage.setItem("vk_login_redirect", redirectTarget);
        router.push("/auth/add-mobile");
      }
    } finally {
      setPayLoading(false);
    }
  };

  const handlePayClick = () => {
    if (isOneDayBooking) { setShowKmModal(true); return; }
    proceedToPayment();
  };

  const baseFare = CAR.pricePerHr * hours;
  const doorstepFee = doorstep ? doorstepCharge : 0;

  const calcDiscount = () => {
    if (!couponApplied || !couponData) return 0;
    if (couponData.discountAmount !== undefined) return couponData.discountAmount;
    if (couponData.discountType === "percentage") {
      const raw = Math.round((baseFare * couponData.discountValue) / 100);
      return couponData.maxDiscount ? Math.min(raw, couponData.maxDiscount) : raw;
    }
    return Math.min(couponData.discountValue, baseFare);
  };
  const discount = calcDiscount();
  // Mirrors the server's calculateFare exactly (bookingsController.js) — GST
  // on the taxable rental fare after discount, so what's shown here always
  // matches what fareBreakdown.totalAmount actually charges via Razorpay.
  const gst = Math.round((baseFare - discount) * 0.12);
  const total = baseFare + gst + CAR.securityDeposit + doorstepFee - discount;
  const tokenAmount = Math.round(total * 0.25);
  const balanceDue = total - tokenAmount;

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const { data } = await api.post("/api/coupons/validate", {
        code: coupon.toUpperCase(),
        bookingAmount: baseFare,
      });
      setCouponData(data.data);
      setCouponApplied(true);
      toast.success("Coupon applied!");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Invalid coupon code");
    }
  };

  const removeCoupon = () => {
    setCoupon("");
    setCouponApplied(false);
    setCouponData(null);
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
                            {getDurationLabel(hours)}
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-[#F8F9FC] rounded-xl border border-[#E4E5EF]">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-[#E8540A]" />
                        <div>
                          <p className="text-[#0F0F1A] text-sm font-semibold">Doorstep Delivery</p>
                          <p className="text-[#9090A8] text-xs">+Rs. {doorstepCharge}</p>
                        </div>
                      </div>
                      <button
                        type="button"
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
                    {doorstep && (
                      <div>
                        <input
                          type="text"
                          value={deliveryAddress}
                          onChange={e => { setDeliveryAddress(e.target.value); setDeliveryAddressError(false); }}
                          placeholder="Enter full delivery address *"
                          className={cn(
                            "w-full border-[1.5px] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none placeholder:text-[#9090A8]",
                            deliveryAddressError ? "border-red-500 focus:border-red-500" : "border-[#E8540A]/50 focus:border-[#E8540A]"
                          )}
                        />
                        {deliveryAddressError && (
                          <p className="text-red-500 text-xs mt-1 font-medium">Please enter your delivery address</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Fare Breakdown */}
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="font-bold font-syne text-[#0F0F1A] text-base mb-4">Fare Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { label: `Base fare (Rs. ${CAR.pricePerHr} × ${hours} hrs)`, value: baseFare },
                      { label: "Security deposit (refundable)", value: CAR.securityDeposit },
                      ...(doorstep ? [{ label: "Doorstep delivery", value: doorstepFee }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-[#4A4A6A]">{label}</span>
                        <span className="text-[#0F0F1A] font-semibold">Rs. {value.toLocaleString("en-IN")}</span>
                      </div>
                    ))}

                    {couponApplied && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#10B981] flex items-center gap-1"><Tag size={12} /> Discount ({coupon})</span>
                        <span className="text-[#10B981] font-semibold">- Rs. {discount.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#4A4A6A]">GST (12%)</span>
                      <span className="text-[#0F0F1A] font-semibold">Rs. {gst.toLocaleString("en-IN")}</span>
                    </div>

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
                      placeholder="Enter promo code"
                      className="flex-1 border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2 text-sm text-[#0F0F1A] placeholder:text-[#9090A8] uppercase"
                      disabled={couponApplied}
                    />
                    {couponApplied ? (
                      <button onClick={removeCoupon}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#D1FAE5] text-[#065F46] whitespace-nowrap">
                        Applied ✓
                      </button>
                    ) : (
                      <button onClick={applyCoupon} disabled={!coupon}
                        className="px-4 py-2 rounded-xl text-sm font-semibold btn-gradient text-white whitespace-nowrap disabled:opacity-50">
                        Apply
                      </button>
                    )}
                  </div>
                  {couponApplied && (
                    <button onClick={removeCoupon} className="text-xs text-[#9090A8] hover:text-[#EF4444] mt-1 transition-colors">
                      Remove coupon
                    </button>
                  )}
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

                  <button
                    onClick={handlePayClick}
                    disabled={payLoading}
                    className="w-full btn-gradient py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_12px_32px_rgba(232,84,10,0.4)] disabled:opacity-70"
                  >
                    {payLoading
                      ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                      : <><Lock size={16} /> Pay Now Rs. {paymentMode === "token" ? tokenAmount.toLocaleString("en-IN") : total.toLocaleString("en-IN")}</>
                    }
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

      {/* KM Policy Modal — shown for 1-day bookings */}
      {showKmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#E8540A] to-[#FF6B35] px-6 py-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg font-syne leading-tight">KM Policy — 1 Day Booking</h3>
                  <p className="text-white/80 text-xs mt-0.5">Please read before proceeding</p>
                </div>
              </div>
              <button onClick={() => setShowKmModal(false)} className="text-white/60 hover:text-white transition-colors mt-0.5">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Included km */}
              <div className="bg-[#FFF3ED] border border-[#E8540A]/20 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#E8540A]/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🛣️</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Included in 1 Day</p>
                  <p className="text-2xl font-black text-[#E8540A] font-syne leading-none mt-0.5">
                    {kmPolicy.includedKmPerDay} KM
                  </p>
                  <p className="text-xs text-[#4A4A6A] mt-0.5">Free kilometres for your trip</p>
                </div>
              </div>

              {/* Extra km charge */}
              <div className="bg-[#F8F9FC] border border-[#E4E5EF] rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0F0F1A]/5 flex items-center justify-center shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Extra KM Charge</p>
                  <p className="text-2xl font-black text-[#0F0F1A] font-syne leading-none mt-0.5">
                    ₹{kmPolicy.extraKmRate}<span className="text-base font-semibold text-[#4A4A6A]">/km</span>
                  </p>
                  <p className="text-xs text-[#4A4A6A] mt-0.5">Charged after {kmPolicy.includedKmPerDay} km limit</p>
                </div>
              </div>

              {/* Info points */}
              <div className="space-y-2">
                {[
                  `First ${kmPolicy.includedKmPerDay} km are completely free`,
                  `Extra km billed at ₹${kmPolicy.extraKmRate}/km at return`,
                  "Odometer reading verified at pickup & drop",
                  "Extra km charges settled in cash or UPI at return",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-[#10B981] mt-0.5 shrink-0" />
                    <p className="text-[#4A4A6A] text-sm">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowKmModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-[#E4E5EF] font-bold text-sm text-[#4A4A6A] hover:bg-[#F8F9FC] transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => { setShowKmModal(false); proceedToPayment(); }}
                className="flex-1 py-3 rounded-xl btn-gradient text-white font-bold text-sm shadow-[0_4px_16px_rgba(232,84,10,0.3)]"
              >
                Understood, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
