"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import {
  MapPin,
  Search,
  Shield,
  Star,
  ChevronRight,
  ChevronLeft,
  Fuel,
  Users,
  Settings,
  Phone,
  ArrowRight,
  Zap,
  Award,
  Headphones,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DateTimePicker, { DateTimePickerHandle } from "@/components/ui/DateTimePicker";
import { cn, addHoursToSlot, getEarliestPickup, getDefaultBookingWindow, isSlotBefore } from "@/lib/utils";
import { MIN_BOOKING_HOURS } from "@/lib/constants";
import { carsAPI } from "@/lib/api";

// ─── Car Images (Unsplash) ────────────────────────────────────────────────────

const CAR_IMAGES: Record<string, string> = {
  hatchback1:
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80",
  hatchback2:
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop&q=80",
  hatchback3:
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80",
  suv1: "https://images.unsplash.com/photo-1519641471654-76ce0107ad98?w=800&auto=format&fit=crop&q=80",
  suv2: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80",
  suv3: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80",
  mpv: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&auto=format&fit=crop&q=80",
  sedan:
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80",
  hero: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&auto=format&fit=crop&q=85",
};

// ─── Sample Data ──────────────────────────────────────────────────────────────


const SAMPLE_BLOGS = [
  {
    id: "1",
    title: "Top 10 Road Trip Destinations from Delhi You Must Explore",
    excerpt:
      "Pack your bags and fuel your wanderlust — Delhi NCR is surrounded by incredible destinations within a day's drive. Here are our top picks for the perfect self-drive road trip.",
    tag: "Road Trips",
    tagColor: "#E8540A",
    readTime: 6,
    date: "Dec 15, 2025",
    slug: "top-10-road-trips-from-delhi",
    image:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=700&auto=format&fit=crop&q=80",
    gradient: "from-[#E8540A]/20 to-[#FF6B35]/5",
  },
  {
    id: "2",
    title: "Self-Drive vs Chauffeur: Which is Right for You in 2025?",
    excerpt:
      "A complete guide to choosing between self-drive car rentals and chauffeur-driven cabs based on your trip type, budget, and convenience needs.",
    tag: "Tips & Guides",
    tagColor: "#10B981",
    readTime: 5,
    date: "Nov 28, 2025",
    slug: "self-drive-vs-chauffeur-guide",
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=700&auto=format&fit=crop&q=80",
    gradient: "from-[#10B981]/20 to-[#10B981]/5",
  },
  {
    id: "3",
    title: "Documents Required for Renting a Self-Drive Car in India",
    excerpt:
      "Planning your first self-drive rental? Here's a complete checklist of all documents you'll need — Aadhaar, driving licence, and more — to ensure a hassle-free booking.",
    tag: "KYC & Documents",
    tagColor: "#6366F1",
    readTime: 4,
    date: "Nov 10, 2025",
    slug: "documents-for-self-drive-car-rental",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=700&auto=format&fit=crop&q=80",
    gradient: "from-[#6366F1]/20 to-[#6366F1]/5",
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Fully Verified Fleet",
    description:
      "Every car undergoes 50-point safety inspection. GPS-enabled, fully insured, and maintained to manufacturer standards.",
    color: "#E8540A",
  },
  {
    icon: FileCheck,
    title: "Paperless KYC",
    description:
      "Complete your KYC in under 3 minutes with Aadhaar-based digital verification. No physical visits required.",
    color: "#10B981",
  },
  {
    icon: Headphones,
    title: "24/7 Live Support",
    description:
      "Our dedicated support team is available around the clock via call, WhatsApp, or chat — whenever you need us.",
    color: "#6366F1",
  },
  {
    icon: Award,
    title: "Zero Hidden Charges",
    description:
      "What you see is what you pay. Transparent pricing with itemized bills, no surprise fees at the end of your trip.",
    color: "#F59E0B",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Search & Select",
    description:
      "Choose your city, set your pickup date & time, and browse our verified fleet. Filter by type, fuel, and budget.",
    icon: Search,
    color: "#E8540A",
  },
  {
    step: "02",
    title: "Complete KYC",
    description:
      "Upload your driving licence and Aadhaar once. Our team verifies in minutes. You're ready to book for life.",
    icon: FileCheck,
    color: "#10B981",
  },
  {
    step: "03",
    title: "Drive & Enjoy",
    description:
      "Pay a small token amount, pick up your car at the designated location, and hit the road on your own terms.",
    icon: Zap,
    color: "#6366F1",
  },
];

const REVIEWS = [
  {
    name: "Arju Sharma",
    initials: "AS",
    rating: 5,
    review:
      "Absolutely amazing experience! The car was spotless, fuel was full, and the whole booking process took less than 2 minutes. Will definitely book again!",
    color: "#E8540A",
    location: "Delhi",
  },
  {
    name: "Rahul Kumar",
    initials: "RK",
    rating: 5,
    review:
      "Best self-drive service in Delhi NCR. Transparent pricing, no hidden charges. The Hyundai Creta was in perfect condition. Highly recommended!",
    color: "#10B981",
    location: "Noida",
  },
  {
    name: "Rajeev Singh",
    initials: "RS",
    rating: 5,
    review:
      "Used Veekay Cabs for a family trip to Jaipur. The car was GPS-enabled, support team was available 24/7. Amazing service throughout!",
    color: "#6366F1",
    location: "Gurgaon",
  },
  {
    name: "Ajay Srivastav",
    initials: "AS",
    rating: 5,
    review:
      "Booked a Swift for the weekend. Super smooth experience. Security deposit was returned within 3 days. 5 stars from me!",
    color: "#F59E0B",
    location: "Ghaziabad",
  },
  {
    name: "Priya Mehta",
    initials: "PM",
    rating: 5,
    review:
      "As a solo traveler, I felt completely safe. The KYC process was simple, car was verified, and the team was always reachable.",
    color: "#EC4899",
    location: "Greater Noida",
  },
  {
    name: "Vikram Joshi",
    initials: "VJ",
    rating: 5,
    review:
      "Third time booking with Veekay. Never disappointed. Great fleet, great prices, great service. My go-to for every trip!",
    color: "#0EA5E9",
    location: "Delhi",
  },
];

const STATS = [
  { value: 2587, suffix: "+", label: "Total Bookings" },
  { value: 101, suffix: "", label: "Cars in Fleet" },
  { value: 2165, suffix: "+", label: "Happy Customers" },
  { value: 5, suffix: "+", label: "Years of Trust" },
];

const CAR_FILTER_TABS = ["All", "SUV", "Hatchback", "Sedan", "MUV"];

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function SectionInView({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Car Card ─────────────────────────────────────────────────────────────────

interface HomeCar {
  id: string;
  _id: string;
  name: string;
  type: string;
  fuel: string;
  transmission: string;
  seats: number;
  pricePerHr: number;
  pricePerDay: number;
  rating: number;
  reviews: number;
  badge: string;
  badgeColor: string;
  gradient: string;
  image: string;
  kmPackage: string;
  isAvailable: boolean;
}

function CarCard({ car, bookUrl }: { car: HomeCar; bookUrl: string }) {
  const soldOut = car.isAvailable === false;
  return (
    <motion.div
      variants={scaleIn}
      className={cn(
        "bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)] card-hover border border-[#E4E5EF] group",
        soldOut && "opacity-60 grayscale-[0.4]"
      )}
    >
      {/* Car Image */}
      <div
        className={cn(
          "relative h-48 overflow-hidden bg-gradient-to-br",
          car.gradient
        )}
      >
        <img
          src={car.image}
          alt={car.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0";
          }}
        />
        {soldOut && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-[#0F0F1A] text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wide">
              SOLD OUT
            </span>
          </div>
        )}
        {/* Badge */}
        <div
          className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-bold shadow-md"
          style={{ backgroundColor: car.badgeColor }}
        >
          {car.badge}
        </div>
        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="text-white text-xs font-semibold">{car.rating}</span>
          <span className="text-white/60 text-xs">({car.reviews})</span>
        </div>
        {/* Pills */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <span className="bg-black/50 backdrop-blur-sm border border-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {car.fuel}
          </span>
          <span className="bg-black/50 backdrop-blur-sm border border-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {car.transmission}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-[#0F0F1A] font-syne text-base group-hover:text-[#E8540A] transition-colors">
              {car.name}
            </h3>
            <span className="text-[#9090A8] text-xs">
              {car.type}
            </span>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[#E8540A] font-bold text-lg font-syne leading-none">
              Rs. {car.pricePerHr}/hr
            </div>
            <div className="text-[#9090A8] text-xs">
              Rs. {car.pricePerDay.toLocaleString("en-IN")}/day
            </div>
          </div>
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-4 py-3 border-t border-[#E4E5EF] mb-3">
          <div className="flex items-center gap-1.5 text-[#4A4A6A] text-xs">
            <Users size={13} className="text-[#9090A8]" />
            <span>{car.seats} Seats</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#4A4A6A] text-xs">
            <Fuel size={13} className="text-[#9090A8]" />
            <span>{car.fuel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#4A4A6A] text-xs">
            <Settings size={13} className="text-[#9090A8]" />
            <span>{car.transmission}</span>
          </div>
        </div>

        {/* CTA */}
        {soldOut ? (
          <span className="w-full py-3 rounded-xl bg-[#F1F2F7] text-[#9090A8] font-semibold text-sm text-center block cursor-not-allowed">
            Sold Out
          </span>
        ) : (
          <Link
            href={bookUrl}
            className="btn-gradient w-full py-3 rounded-xl text-white font-semibold text-sm text-center block hover:opacity-90 transition-opacity"
          >
            Book Now — Rs. {car.pricePerHr}/hr
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: (typeof REVIEWS)[0] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#E4E5EF] h-full flex flex-col">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <p className="text-[#4A4A6A] text-sm leading-relaxed flex-1 mb-5">
        &ldquo;{review.review}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: review.color }}
        >
          {review.initials}
        </div>
        <div>
          <div className="text-[#0F0F1A] font-semibold text-sm">{review.name}</div>
          <div className="flex items-center gap-1 text-[#9090A8] text-xs">
            <MapPin size={10} />
            {review.location}
          </div>
        </div>
        <div className="ml-auto">
          <div className="text-[#E8540A] text-xs font-bold bg-[#FFF3ED] px-2 py-1 rounded-full">
            Verified
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [activeCarFilter, setActiveCarFilter] = useState("All");
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [pickupDateTime, setPickupDateTime] = useState("");
  const [dropDateTime, setDropDateTime] = useState("");
  const [searchError, setSearchError] = useState("");
  const [reviewPage, setReviewPage] = useState(0);
  const [popularCars, setPopularCars] = useState<HomeCar[]>([]);

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const startTime = pickupDateTime ? new Date(pickupDateTime.replace(" ", "T")).toISOString() : undefined;
    const endTime = dropDateTime ? new Date(dropDateTime.replace(" ", "T")).toISOString() : undefined;
    carsAPI.getPopular(selectedCity, 8, startTime, endTime).then(({ data }) => {
      const cars: HomeCar[] = (data.data || []).map((c: any) => ({
        id: c.slug || c._id,
        _id: c._id,
        name: c.name,
        type: c.type,
        fuel: c.fuel,
        transmission: c.transmission,
        seats: c.seats,
        pricePerHr: c.regularPrice,
        pricePerDay: (c.regularPrice || 0) * 24,
        rating: 4.8,
        reviews: 0,
        badge: c.type,
        badgeColor: c.type === "SUV" || c.type === "MUV" ? "#E8540A" : c.type === "Luxury" ? "#6366F1" : "#10B981",
        gradient: "from-[#1C1C2E] to-[#242438]",
        image: c.images?.[0] || "",
        kmPackage: c.kmPackage || "250 km/day",
        isAvailable: c.isAvailable !== false,
      }));
      setPopularCars(cars);
    }).catch(() => setPopularCars([]));
  }, [selectedCity, pickupDateTime, dropDateTime]);

  const filteredCars =
    activeCarFilter === "All"
      ? popularCars
      : popularCars.filter((c) => c.type === activeCarFilter);

  const reviewsPerPage = 3;
  const totalReviewPages = Math.ceil(REVIEWS.length / reviewsPerPage);
  const visibleReviews = REVIEWS.slice(
    reviewPage * reviewsPerPage,
    reviewPage * reviewsPerPage + reviewsPerPage
  );

  const dropPickerRef = useRef<DateTimePickerHandle>(null);

  const handlePickupChange = (v: string) => {
    setPickupDateTime(v);
    // Keep the drop time at least MIN_BOOKING_HOURS after the new pickup
    if (v && (!dropDateTime || isSlotBefore(dropDateTime, addHoursToSlot(v, MIN_BOOKING_HOURS)))) {
      setDropDateTime(addHoursToSlot(v, MIN_BOOKING_HOURS));
    }
    // Once pickup date & time are both chosen, auto-open the drop picker
    if (v && v.split(" ")[1]) {
      dropPickerRef.current?.open();
    }
  };

  const handleSearch = () => {
    if (!selectedCity || !pickupDateTime || !dropDateTime) {
      setSearchError("Please select city, pickup and drop date & time to continue.");
      return;
    }
    if (isSlotBefore(dropDateTime, addHoursToSlot(pickupDateTime, MIN_BOOKING_HOURS))) {
      setSearchError(`Minimum booking duration is ${MIN_BOOKING_HOURS} hours.`);
      return;
    }
    setSearchError("");
    const params = new URLSearchParams({ city: selectedCity, start: pickupDateTime, end: dropDateTime });
    router.push(`/book?${params.toString()}`);
  };

  const buildCarBookUrl = (car: HomeCar) => {
    const { start, end } = getDefaultBookingWindow();
    const params = new URLSearchParams({ city: selectedCity, start, end, carId: car._id });
    return `/${car.id}?${params.toString()}`;
  };

  const buildDefaultBookUrl = () => {
    const { start, end } = getDefaultBookingWindow();
    const params = new URLSearchParams({ city: selectedCity, start, end });
    return `/book?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <Navbar />

      {/* ─── HERO SECTION ───────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B16] via-[#12121F] to-[#0F0F1A]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-[#E8540A] rounded-full opacity-[0.05] blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#6366F1] rounded-full opacity-[0.04] blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text + Search */}
            <div>
              {/* Chip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="section-chip mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-[#E8540A] animate-pulse inline-block" />
                Delhi NCR&apos;s #1 Self-Drive Platform
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="main_headingss text-4xl sm:text-5xl md:text-6xl lg:text-[62px] font-black font-syne text-white leading-[1.06] mb-5"
              >
                Self Drive Car
                <br />
                <span className="gradient-text">On Rent</span>
                <br />
                Delhi NCR
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="textmain paragraphs text-white/55 text-base md:text-lg leading-relaxed mb-8 max-w-lg"
              >
                101+ verified self-drive cars. Transparent pricing from{" "}
                <span className="text-[#E8540A] font-semibold">Rs. 89/hr</span>
                . No driver. No hidden charges. Just you and the open road.
              </motion.p>

              {/* ── Inline Search Widget ── */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.7 }}
                className="bg-white rounded-3xl p-5 sm:p-6 mb-8 shadow-[0_30px_90px_rgba(0,0,0,0.35)] border border-white/10"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-[#FFF3ED] flex items-center justify-center">
                    <Search size={13} className="text-[#E8540A]" />
                  </span>
                  <p className="text-[#0F0F1A] font-bold font-syne text-sm">Find Your Perfect Ride</p>
                </div>

                {/* Row 1: city + 2 date-time pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {/* City */}
                  <div className="space-y-1 citys">
                    <label className="text-[#9090A8] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={10} className="text-[#E8540A]" /> City
                    </label>
                    <div className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm bg-white border-2 border-[#E4E5EF] hover:border-[#E8540A]/60 transition-all">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[#FFF3ED]">
                        <MapPin size={12} className="text-[#E8540A]" />
                      </span>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="flex-1 bg-transparent text-[#0F0F1A] font-medium appearance-none cursor-pointer focus:outline-none"
                      >
                        {["Delhi", "Noida", "Gurgaon", "Ghaziabad", "Greater Noida"].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pickup Date & Time */}
                  <div className="space-y-1">
                    <label className="text-[#9090A8] text-[10px] font-bold uppercase tracking-wider">
                      Pickup Date &amp; Time
                    </label>
                    <DateTimePicker
                      label="Pickup"
                      value={pickupDateTime}
                      onChange={handlePickupChange}
                      minDateTime={getEarliestPickup()}
                      placeholder="Pick date & time"
                      error={!!searchError && !pickupDateTime}
                    />
                  </div>

                  {/* Drop Date & Time */}
                  <div className="space-y-1">
                    <label className="text-[#9090A8] text-[10px] font-bold uppercase tracking-wider">
                      Drop Date &amp; Time
                    </label>
                    <DateTimePicker
                      ref={dropPickerRef}
                      label="Drop"
                      value={dropDateTime}
                      onChange={setDropDateTime}
                      minDateTime={pickupDateTime ? addHoursToSlot(pickupDateTime, MIN_BOOKING_HOURS) : undefined}
                      placeholder="Pick date & time"
                      hint={`Minimum ${MIN_BOOKING_HOURS} hours from pickup`}
                      error={!!searchError && !dropDateTime}
                    />
                  </div>
                </div>

                {searchError && (
                  <p className="flex items-center gap-1.5 text-red-500 text-xs font-semibold mb-3">
                    <AlertCircle size={13} /> {searchError}
                  </p>
                )}

                {/* Row 2: Search button + quick cities */}
                <div className="res_buttons flex items-center gap-3 pt-3 border-t border-[#E4E5EF]">
                  <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                    <span className="text-[#9090A8] text-[10px] font-semibold shrink-0">Quick city:</span>
                    {["Delhi", "Noida", "Gurgaon", "Ghaziabad"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCity(c)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all",
                          selectedCity === c
                            ? "bg-[#E8540A] text-white"
                            : "bg-[#F8F9FC] text-[#9090A8] hover:bg-[#FFF3ED] hover:text-[#E8540A]"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleSearch}
                    className="shrink-0 btn-gradient px-6 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Search size={15} />
                    Search
                  </button>
                </div>
              </motion.div>

              {/* CTA row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-wrap items-center gap-4 mb-10"
              >
                <a
                  href="https://wa.me/919999926867"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/50 transition-all"
                >
                  <Phone size={16} className="text-[#E8540A]" />
                  WhatsApp Us
                </a>
                <a
                  href="tel:+919999926867"
                  className="text-white/60 text-sm hover:text-white transition-colors font-medium"
                >
                  +91 99999 26867
                </a>
              </motion.div>

              {/* Inline Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="flex flex-wrap gap-8"
              >
                {[
                  { value: "2587+", label: "Bookings Done" },
                  { value: "101", label: "Cars Available" },
                  { value: "4.9★", label: "Avg Rating" },
                  { value: "5+", label: "Years Trust" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-white font-black text-2xl font-syne">{s.value}</div>
                    <div className="text-white/45 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Hero Car Image */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: "easeOut" }}
              className="hidden lg:block relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-[0_40px_120px_rgba(232,84,10,0.15)]">
                <img
                  src={CAR_IMAGES.hero}
                  alt="Premium self-drive car"
                  className="w-full h-[520px] object-cover object-center"
                  onError={(e) => {
                    const container = (e.currentTarget as HTMLImageElement).parentElement;
                    if (container) container.style.background = "linear-gradient(135deg,#1C1C2E,#2E1C0F)";
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A]/70 via-transparent to-transparent" />

                {/* Floating price card */}
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-xl">
                  <p className="text-[#9090A8] text-xs font-semibold mb-1">Starting from</p>
                  <p className="text-[#E8540A] font-black font-syne text-2xl leading-none">
                    Rs. 89<span className="text-sm font-semibold text-[#4A4A6A]">/hr</span>
                  </p>
                  <p className="text-[#9090A8] text-xs mt-1">Petrol · Manual · 5 Seats</p>
                </div>

                {/* Rating badge */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-xl rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-2">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-black text-[#0F0F1A] text-sm">4.9</span>
                  <span className="text-[#9090A8] text-xs">· 2500+ reviews</span>
                </div>

                {/* GPS badge */}
                <div className="absolute top-6 left-6 bg-[#E8540A] rounded-xl px-3 py-2 shadow-xl">
                  <p className="text-white text-xs font-bold">📍 GPS Enabled</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="textmain absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-[10px] tracking-widest uppercase">Scroll</span>
          <div className="w-px h-6 bg-gradient-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>

      {/* ─── TRUST BADGES STRIP ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#E4E5EF]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { icon: "🔒", label: "Secure Payments" },
              { icon: "📋", label: "Paperless KYC" },
              { icon: "🚗", label: "Verified Fleet" },
              { icon: "📍", label: "GPS Tracking" },
              { icon: "🛡️", label: "Fully Insured" },
              { icon: "💬", label: "24/7 Support" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="text-lg">{b.icon}</span>
                <span className="text-[#4A4A6A] text-sm font-semibold whitespace-nowrap">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POPULAR CARS ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#F8F9FC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <SectionInView>
            {/* Header */}
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <div className="section-chip mx-auto w-fit mb-4">🚗 Our Fleet</div>
              <h2 className="text-4xl md:text-5xl font-black font-syne text-[#0F0F1A] mb-4">
                Popular Cars in Delhi NCR
              </h2>
              <p className="text-[#4A4A6A] text-lg max-w-xl mx-auto">
                Choose from our curated fleet of verified, well-maintained self-drive
                cars at unbeatable prices.
              </p>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap gap-3 justify-center mb-10"
            >
              {CAR_FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCarFilter(tab)}
                  className={cn(
                    "px-5 py-2 rounded-full text-sm font-semibold transition-all",
                    activeCarFilter === tab
                      ? "bg-[#E8540A] text-white shadow-[0_4px_16px_rgba(232,84,10,0.35)]"
                      : "bg-white text-[#4A4A6A] border border-[#E4E5EF] hover:border-[#E8540A]/50 hover:text-[#E8540A]"
                  )}
                >
                  {tab}
                </button>
              ))}
            </motion.div>

            {/* Car Grid */}
            <motion.div
              key={activeCarFilter}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {filteredCars.map((car) => (
                <CarCard key={car.id} car={car} bookUrl={buildCarBookUrl(car)} />
              ))}
            </motion.div>

            {/* View All */}
            <motion.div variants={fadeInUp} className="text-center mt-12">
              <Link
                href={buildDefaultBookUrl()}
                className="inline-flex items-center gap-2 btn-gradient px-10 py-4 rounded-2xl text-white font-bold text-base"
              >
                View All Cars
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </SectionInView>
        </div>
      </section>

      {/* ─── WHY CHOOSE VEEKAY ──────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0F0F1A] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E8540A] rounded-full opacity-[0.04] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#6366F1] rounded-full opacity-[0.04] blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <SectionInView>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="section-chip mx-auto w-fit mb-4">⚡ Why Choose Us</div>
              <h2 className="text-4xl md:text-5xl font-black font-syne text-white mb-4">
                The Veekay Difference
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                We don&apos;t just rent cars — we deliver an experience built on trust,
                transparency, and technology.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={scaleIn}
                  className="bg-[#17172A] border border-[#2A2A3E] rounded-2xl p-6 group hover:border-[#E8540A]/40 hover:-translate-y-2 transition-all duration-300"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${feature.color}18` }}
                  >
                    <feature.icon size={22} style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-white font-bold font-syne text-lg mb-2 group-hover:text-[#E8540A] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA Banner */}
            <motion.div
              variants={fadeInUp}
              className="mt-16 bg-gradient-to-r from-[#E8540A] to-[#FF6B35] rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_60px_rgba(232,84,10,0.25)]"
            >
              <div>
                <h3 className="text-white font-black font-syne text-2xl md:text-3xl mb-2">
                  Ready to Hit the Road?
                </h3>
                <p className="text-white/80 text-base">
                  Join 2500+ happy customers who chose Veekay for their journey.
                </p>
              </div>
              <div className="flex gap-4 shrink-0">
                <Link
                  href={buildDefaultBookUrl()}
                  className="bg-white text-[#E8540A] font-bold px-7 py-3 rounded-xl hover:bg-[#FFF3ED] transition-colors text-sm"
                >
                  Book Now
                </Link>
                <a
                  href="tel:+919999926867"
                  className="border border-white/40 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
                >
                  <Phone size={16} />
                  Call Us
                </a>
              </div>
            </motion.div>
          </SectionInView>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F8F9FC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <SectionInView>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="section-chip mx-auto w-fit mb-4">📋 Simple Process</div>
              <h2 className="text-4xl md:text-5xl font-black font-syne text-[#0F0F1A] mb-4">
                How It Works
              </h2>
              <p className="text-[#4A4A6A] text-lg max-w-xl mx-auto">
                From search to steering wheel — booking a self-drive car with Veekay
                takes just 3 easy steps.
              </p>
            </motion.div>

            <div className="relative">
              <div className="hidden lg:block absolute top-16 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-[#E8540A]/30 via-[#10B981]/30 to-[#6366F1]/30" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {STEPS.map((step, idx) => (
                  <motion.div
                    key={step.step}
                    variants={fadeInUp}
                    custom={idx}
                    className="relative flex flex-col items-center text-center"
                  >
                    <div className="relative mb-6">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg relative z-10"
                        style={{
                          background: `linear-gradient(135deg, ${step.color}20, ${step.color}08)`,
                          border: `2px solid ${step.color}30`,
                        }}
                      >
                        <step.icon size={32} style={{ color: step.color }} />
                      </div>
                      <div
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs"
                        style={{ backgroundColor: step.color }}
                      >
                        {step.step}
                      </div>
                    </div>

                    <h3 className="text-[#0F0F1A] font-black font-syne text-xl mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[#4A4A6A] text-sm leading-relaxed max-w-xs">
                      {step.description}
                    </p>

                    {idx < STEPS.length - 1 && (
                      <div className="lg:hidden mt-6">
                        <ChevronRight size={24} className="text-[#E8540A] rotate-90" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div variants={fadeInUp} className="text-center mt-14">
              <Link
                href={buildDefaultBookUrl()}
                className="btn-gradient inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-white font-bold text-base"
              >
                Get Started — It&apos;s Free
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </SectionInView>
        </div>
      </section>

      {/* ─── STATS ──────────────────────────────────────────────────────────── */}
      <section
        ref={statsRef}
        className="py-20 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #E8540A 0%, #C94508 50%, #FF6B35 100%)",
        }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full opacity-[0.05] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full opacity-[0.05] -translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-white font-black text-5xl md:text-6xl font-syne mb-2">
                  {statsInView ? (
                    <CountUp
                      end={stat.value}
                      duration={2.5}
                      separator=","
                      suffix={stat.suffix}
                    />
                  ) : (
                    "0"
                  )}
                </div>
                <div className="text-white/80 font-semibold text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <SectionInView>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
            >
              <div>
                <div className="section-chip w-fit mb-3">⭐ Reviews</div>
                <h2 className="text-4xl md:text-5xl font-black font-syne text-[#0F0F1A] mb-2">
                  What Our Customers Say
                </h2>
                <p className="text-[#4A4A6A] text-base">
                  2500+ verified reviews. 4.9★ average rating across all platforms.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                  disabled={reviewPage === 0}
                  className={cn(
                    "w-10 h-10 rounded-full border flex items-center justify-center transition-all",
                    reviewPage === 0
                      ? "border-[#E4E5EF] text-[#9090A8] cursor-not-allowed"
                      : "border-[#E8540A] text-[#E8540A] hover:bg-[#E8540A] hover:text-white"
                  )}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[#9090A8] text-sm">
                  {reviewPage + 1} / {totalReviewPages}
                </span>
                <button
                  onClick={() =>
                    setReviewPage((p) => Math.min(totalReviewPages - 1, p + 1))
                  }
                  disabled={reviewPage === totalReviewPages - 1}
                  className={cn(
                    "w-10 h-10 rounded-full border flex items-center justify-center transition-all",
                    reviewPage === totalReviewPages - 1
                      ? "border-[#E4E5EF] text-[#9090A8] cursor-not-allowed"
                      : "border-[#E8540A] text-[#E8540A] hover:bg-[#E8540A] hover:text-white"
                  )}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>

            <motion.div
              key={reviewPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {visibleReviews.map((review) => (
                <ReviewCard key={review.name} review={review} />
              ))}
            </motion.div>

            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalReviewPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewPage(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === reviewPage ? "w-8 bg-[#E8540A]" : "w-2 bg-[#E4E5EF]"
                  )}
                />
              ))}
            </div>
          </SectionInView>
        </div>
      </section>

      {/* ─── BLOG PREVIEW ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F8F9FC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <SectionInView>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
            >
              <div>
                <div className="section-chip w-fit mb-3">📝 Our Blog</div>
                <h2 className="text-4xl md:text-5xl font-black font-syne text-[#0F0F1A] mb-2">
                  Tips, Guides & Travel Stories
                </h2>
                <p className="text-[#4A4A6A] text-base max-w-md">
                  Stay informed with our latest articles on road trips, car care, and
                  self-drive travel.
                </p>
              </div>
              <Link
                href="/blogs"
                className="btn-gradient px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2 w-fit shrink-0"
              >
                View All Posts
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SAMPLE_BLOGS.map((blog, idx) => (
                <motion.article
                  key={blog.id}
                  variants={fadeInUp}
                  custom={idx}
                  className="bg-white rounded-2xl overflow-hidden border border-[#E4E5EF] shadow-[0_4px_24px_rgba(0,0,0,0.06)] card-hover group"
                >
                  {/* Blog cover image */}
                  <div
                    className={cn(
                      "h-52 bg-gradient-to-br relative overflow-hidden",
                      blog.gradient
                    )}
                  >
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = "0";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div
                      className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs font-bold shadow-md"
                      style={{ backgroundColor: blog.tagColor }}
                    >
                      {blog.tag}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="text-white text-xs font-medium">
                        {blog.readTime} min read
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="text-[#9090A8] text-xs mb-3">{blog.date}</div>
                    <h3 className="font-bold font-syne text-[#0F0F1A] text-lg leading-snug mb-3 group-hover:text-[#E8540A] transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-[#4A4A6A] text-sm leading-relaxed line-clamp-3 mb-5">
                      {blog.excerpt}
                    </p>
                    <Link
                      href={`/blogs/${blog.slug}`}
                      className="flex items-center gap-2 text-[#E8540A] text-sm font-semibold hover:gap-3 transition-all"
                    >
                      Read Article
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </SectionInView>
        </div>
      </section>

      {/* ─── BOTTOM CTA BANNER ──────────────────────────────────────────────── */}
      <section className="py-20 bg-[#0F0F1A] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8540A]/10 via-transparent to-[#6366F1]/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
          <SectionInView>
            <motion.div variants={fadeInUp} className="section-chip mx-auto w-fit mb-6">
              🚀 Start Your Journey
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-black font-syne text-white mb-6 leading-tight"
            >
              Drive on Your Terms.
              <br />
              <span className="gradient-text">Book in 2 Minutes.</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-white/55 text-lg mb-10 max-w-xl mx-auto"
            >
              No driver. No restrictions. Just you, the car, and the open road. Join
              thousands of smart travelers who choose Veekay.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link
                href={buildDefaultBookUrl()}
                className="btn-gradient px-10 py-4 rounded-2xl text-white font-bold text-base flex items-center gap-2"
              >
                Book Your Car Now
                <ArrowRight size={18} />
              </Link>
              <a
                href="tel:+919999926867"
                className="flex items-center gap-2 px-10 py-4 rounded-2xl border border-white/25 text-white font-semibold text-base hover:bg-white/10 hover:border-white/50 transition-all"
              >
                <Phone size={18} className="text-[#E8540A]" />
                +91 99999 26867
              </a>
            </motion.div>
          </SectionInView>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/919999926867"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <Footer />
    </div>
  );
}
