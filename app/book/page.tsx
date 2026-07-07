"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  SlidersHorizontal,
  Fuel,
  Users,
  Settings,
  CheckCircle,
  Star,
  ChevronDown,
  X,
  MapPin,
  Search,
  AlertCircle,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import DateTimePicker, { DateTimePickerHandle } from "@/components/ui/DateTimePicker";
import {
  cn,
  addHoursToSlot,
  getEarliestPickup,
  getSlotHours,
  isSlotBefore,
} from "@/lib/utils";
import { MIN_BOOKING_HOURS } from "@/lib/constants";
import { CARS as LOCAL_CARS } from "@/lib/cars-data";
import { carsAPI } from "@/lib/api";
import { useActiveCities } from "@/lib/useActiveCities";

// Map API car → local display format so CarGridCard component needs no changes
const mapApiCar = (c: any) => {
  const localMatch = LOCAL_CARS.find(l => l.name.toLowerCase() === c.name.toLowerCase());
  return {
    id: localMatch?.id || c.slug || c._id,
    _id: c._id,
    slug: c.slug,
    name: c.name,
    type: c.type,
    year: c.modelYear || localMatch?.year || 2023,
    fuel: c.fuel,
    transmission: c.transmission,
    seats: c.seats,
    pricePerHr: c.regularPrice,
    kmIncluded: parseInt(c.kmPackage) || 250,
    securityDeposit: c.securityDeposit || 10000,
    rating: localMatch?.rating || 4.8,
    reviews: localMatch?.reviews || 0,
    badge: c.type,
    badgeColor: c.type === "SUV" || c.type === "MUV" ? "#E8540A" : c.type === "Luxury" ? "#6366F1" : "#10B981",
    gradient: "from-[#1C1C2E] to-[#242438]",
    image: c.images?.[0] || localMatch?.image || "",
    isAvailable: c.isAvailable !== false,
  };
};

const SEGMENTS = ["All", "SUV", "Hatchback", "Sedan", "MUV", "Luxury"];
const FUELS = ["Petrol", "Diesel", "CNG", "Electric"];
const TRANSMISSIONS = ["Manual", "Automatic"];
const SEATS_OPTIONS = ["Any", "4", "5", "7", "9+"];
const SORT_OPTIONS = [
  "Recommended",
  "Price: Low to High",
  "Price: High to Low",
  "Rating",
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex gap-3 mt-2">
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-3 bg-gray-100 rounded w-16" />
        </div>
        <div className="h-10 bg-gray-200 rounded-xl mt-4" />
      </div>
    </div>
  );
}

function CarGridCard({
  car,
  highlighted,
  cardRef,
  hours,
  bookUrl,
}: {
  car: ReturnType<typeof mapApiCar>;
  highlighted?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
  hours: number;
  bookUrl: string;
}) {
  const totalPrice = Math.round(car.pricePerHr * hours);
  const soldOut = car.isAvailable === false;
  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-white rounded-2xl border shadow-[0_4px_24px_rgba(0,0,0,0.07)] overflow-hidden hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 group flex flex-col",
        soldOut && "opacity-60 grayscale-[0.4] hover:-translate-y-0",
        highlighted
          ? "border-[#E8540A] ring-4 ring-[#E8540A]/20"
          : "border-[#E4E5EF]",
      )}
    >
      {highlighted && (
        <div className="bg-[#E8540A] text-white text-[11px] font-bold text-center py-1.5">
          You selected this car
        </div>
      )}
      {/* Image */}
      <div
        className={cn(
          "relative h-44 overflow-hidden bg-gradient-to-br shrink-0",
          car.gradient,
        )}
      >
        <img
          src={car.image}
          alt={car.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
        <div
          className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-white text-[10px] font-bold shadow"
          style={{ backgroundColor: car.badgeColor }}
        >
          {car.badge}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star size={10} className="text-yellow-400 fill-yellow-400" />
          <span className="text-white text-[11px] font-bold">{car.rating}</span>
          <span className="text-white/60 text-[10px]">({car.reviews})</span>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-1">
          <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {car.fuel}
          </span>
          <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {car.transmission}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-[#0F0F1A] font-syne text-base group-hover:text-[#E8540A] transition-colors">
              {car.name}
            </h3>
            <p className="text-[#9090A8] text-xs">
              {car.type} · {car.year}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[#E8540A] font-black font-syne text-lg leading-none">
              Rs. {car.pricePerHr}/hr
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2.5 border-y border-[#E4E5EF] mb-3">
          <div className="flex items-center gap-1 text-[#4A4A6A] text-xs">
            <Fuel size={12} className="text-[#9090A8]" />
            {car.fuel}
          </div>
          <div className="flex items-center gap-1 text-[#4A4A6A] text-xs">
            <Settings size={12} className="text-[#9090A8]" />
            {car.transmission}
          </div>
          <div className="flex items-center gap-1 text-[#4A4A6A] text-xs">
            <Users size={12} className="text-[#9090A8]" />
            {car.seats} Seats
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <CheckCircle size={12} className="text-[#10B981]" />
          <span className="text-[#4A4A6A] text-xs">
            {car.kmIncluded} km included
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-[#0F0F1A] font-black font-syne text-base leading-none">
              Rs. {totalPrice.toLocaleString("en-IN")}
            </div>
            <div className="text-[#9090A8] text-[10px] mt-0.5">
              estimated total · {hours}h
            </div>
          </div>
          {soldOut ? (
            <span className="bg-[#F1F2F7] text-[#9090A8] px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap cursor-not-allowed">
              Sold Out
            </span>
          ) : (
            <Link
              href={bookUrl}
              className="btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm whitespace-nowrap"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function CarListingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initCity = searchParams.get("city") || "Delhi";
  const initStart = searchParams.get("start") || "";
  const initEnd = searchParams.get("end") || "";
  const highlightCar = searchParams.get("car") || "";

  const [city, setCity] = useState(initCity);
  const activeCities = useActiveCities();
  const [pickupDT, setPickupDT] = useState(initStart);
  const [dropDT, setDropDT] = useState(initEnd);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [modifyError, setModifyError] = useState("");

  const [segment, setSegment] = useState("All");
  const [fuel, setFuel] = useState<string[]>([]);
  const [transmission, setTransmission] = useState<string[]>([]);
  const [seats, setSeats] = useState("Any");
  const [sort, setSort] = useState("Recommended");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [apiCars, setApiCars] = useState<ReturnType<typeof mapApiCar>[]>([]);
  const [loading, setLoading] = useState(true);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (highlightCar && cardRefs.current[highlightCar]) {
      cardRefs.current[highlightCar]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightCar]);

  // Fetch real cars from API
  useEffect(() => {
    const start = pickupDT || getEarliestPickup();
    const end   = dropDT   || addHoursToSlot(start, MIN_BOOKING_HOURS);
    setLoading(true);
    carsAPI.getAvailable({
      city,
      startTime: new Date(start.replace(" ", "T")).toISOString(),
      endTime:   new Date(end.replace(" ", "T")).toISOString(),
    }).then(({ data }) => {
      setApiCars((data.data || []).map(mapApiCar));
    }).catch(() => setApiCars([]))
    .finally(() => setLoading(false));
  }, [city, pickupDT, dropDT]);

  const toggleArr = (
    arr: string[],
    val: string,
    set: (a: string[]) => void,
  ) => {
    if (arr.includes(val)) set(arr.filter((x) => x !== val));
    else set([...arr, val]);
  };

  const clearAll = () => {
    setSegment("All");
    setFuel([]);
    setTransmission([]);
    setSeats("Any");
  };

  const dropPickerRef = useRef<DateTimePickerHandle>(null);

  const handlePickupChange = (v: string) => {
    setPickupDT(v);
    // Keep the drop time at least MIN_BOOKING_HOURS after the new pickup
    if (
      v &&
      (!dropDT || isSlotBefore(dropDT, addHoursToSlot(v, MIN_BOOKING_HOURS)))
    ) {
      setDropDT(addHoursToSlot(v, MIN_BOOKING_HOURS));
    }
    // Once pickup date & time are both chosen, auto-open the drop picker
    if (v && v.split(" ")[1]) {
      dropPickerRef.current?.open();
    }
  };

  const applyModifySearch = () => {
    if (!city || !pickupDT || !dropDT) {
      setModifyError("Please select city, pickup and drop date & time.");
      return;
    }
    if (isSlotBefore(dropDT, addHoursToSlot(pickupDT, MIN_BOOKING_HOURS))) {
      setModifyError(`Minimum booking duration is ${MIN_BOOKING_HOURS} hours.`);
      return;
    }
    setModifyError("");
    const params = new URLSearchParams({ city, start: pickupDT, end: dropDT });
    router.replace(`/book?${params.toString()}`);
    setModifyOpen(false);
  };

  const bookingHours = pickupDT && dropDT ? getSlotHours(pickupDT, dropDT) : MIN_BOOKING_HOURS;

  const buildCarUrl = (car: ReturnType<typeof mapApiCar>) => {
    const params = new URLSearchParams({
      city,
      start:  pickupDT || getEarliestPickup(),
      end:    dropDT   || addHoursToSlot(pickupDT || getEarliestPickup(), MIN_BOOKING_HOURS),
      carId:  car._id,
    });
    return `/${car.id}?${params.toString()}`;
  };

  const filtered = apiCars.filter((c) => {
    if (segment !== "All" && c.type !== segment) return false;
    if (fuel.length && !fuel.includes(c.fuel)) return false;
    if (transmission.length && !transmission.includes(c.transmission))
      return false;
    if (seats !== "Any") {
      if (seats === "9+" && c.seats < 9) return false;
      if (seats !== "9+" && c.seats !== parseInt(seats)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
    if (sort === "Price: Low to High") return a.pricePerHr - b.pricePerHr;
    if (sort === "Price: High to Low") return b.pricePerHr - a.pricePerHr;
    if (sort === "Rating") return b.rating - a.rating;
    return 0;
  });

  const formatDT = (val: string) => {
    if (!val) return "—";
    const [d, t] = val.split(" ");
    if (!d) return val;
    const dateObj = new Date(d + "T00:00:00");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const mon = dateObj.toLocaleDateString("en-IN", { month: "short" });
    return `${day} ${mon}${t ? ", " + t : ""}`;
  };

  const FilterPanel = () => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E4E5EF]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-[#0F0F1A] font-syne text-sm flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-[#E8540A]" />
          Filters
        </h3>
        <button
          onClick={clearAll}
          className="text-[#E8540A] text-xs font-semibold hover:underline"
        >
          Clear All
        </button>
      </div>

      {/* Segment */}
      <div className="mb-5">
        <p className="text-[#4A4A6A] text-[10px] font-bold uppercase tracking-wider mb-2.5">
          Car Type
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {SEGMENTS.map((s) => (
            <button
              key={s}
              onClick={() => setSegment(s)}
              className={cn(
                "px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-left",
                segment === s
                  ? "border-[#E8540A] bg-[#FFF3ED] text-[#E8540A]"
                  : "border-[#E4E5EF] text-[#4A4A6A] hover:border-[#E8540A]/50",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel */}
      <div className="mb-5">
        <p className="text-[#4A4A6A] text-[10px] font-bold uppercase tracking-wider mb-2.5">
          Fuel Type
        </p>
        <div className="space-y-2">
          {FUELS.map((f) => (
            <label
              key={f}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div
                onClick={() => toggleArr(fuel, f, setFuel)}
                className={cn(
                  "w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all cursor-pointer shrink-0",
                  fuel.includes(f)
                    ? "bg-[#E8540A] border-[#E8540A]"
                    : "border-[#E4E5EF] group-hover:border-[#E8540A]/50",
                )}
              >
                {fuel.includes(f) && (
                  <CheckCircle size={10} className="text-white" />
                )}
              </div>
              <span className="text-[#4A4A6A] text-sm">{f}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div className="mb-5">
        <p className="text-[#4A4A6A] text-[10px] font-bold uppercase tracking-wider mb-2.5">
          Transmission
        </p>
        <div className="space-y-2">
          {TRANSMISSIONS.map((t) => (
            <label
              key={t}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div
                onClick={() => toggleArr(transmission, t, setTransmission)}
                className={cn(
                  "w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all cursor-pointer shrink-0",
                  transmission.includes(t)
                    ? "bg-[#E8540A] border-[#E8540A]"
                    : "border-[#E4E5EF] group-hover:border-[#E8540A]/50",
                )}
              >
                {transmission.includes(t) && (
                  <CheckCircle size={10} className="text-white" />
                )}
              </div>
              <span className="text-[#4A4A6A] text-sm">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Seats */}
      <div className="mb-5">
        <p className="text-[#4A4A6A] text-[10px] font-bold uppercase tracking-wider mb-2.5">
          Seats
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SEATS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSeats(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                seats === s
                  ? "border-[#E8540A] bg-[#FFF3ED] text-[#E8540A]"
                  : "border-[#E4E5EF] text-[#4A4A6A] hover:border-[#E8540A]/50",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button className="w-full btn-gradient py-2.5 rounded-xl text-white font-semibold text-sm">
        Apply Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FC] pt-20">
      {/* ── Professional Search Bar ─────────────────────────────────────── */}
      <div className="sticky top-20 z-30 bg-[#0F0F1A] border-b border-white/[0.07] shadow-lg">
        {/* Summary row — always visible */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#E8540A] px-3 py-1.5 rounded-lg">
            <MapPin size={12} className="text-white" />
            <span className="text-white text-xs font-bold">{city}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-white/60 text-xs">
            <span className="font-medium text-white/80">
              {formatDT(pickupDT)}
            </span>
            <span>→</span>
            <span className="font-medium text-white/80">
              {formatDT(dropDT)}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                setModifyOpen(!modifyOpen);
                setModifyError("");
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-white/20 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
            >
              <Search size={12} />
              {modifyOpen ? "Close" : "Modify Search"}
            </button>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-white text-xs font-medium"
            >
              <SlidersHorizontal size={12} /> Filters
            </button>
          </div>
        </div>

        {/* Expandable modify-search form */}
        {modifyOpen && (
          <div className="border-t border-white/[0.07] bg-[#17172A]">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 items-end">
                {/* City */}
                <div className="space-y-1">
                  <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={9} className="text-[#E8540A]" /> City
                  </label>
                  <div className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm bg-white/[0.07] border border-white/15 hover:border-[#E8540A]/70 hover:bg-white/10 transition-all">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-white/10">
                      <MapPin size={12} className="text-[#E8540A]" />
                    </span>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="flex-1 bg-transparent text-white font-medium appearance-none cursor-pointer focus:outline-none"
                    >
                      {activeCities.map((c) => (
                        <option key={c.slug} value={c.name} className="text-[#0F0F1A]">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pickup + Drop — always side by side, never stacked */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                      Pickup Date &amp; Time
                    </label>
                    <DateTimePicker
                      label="Pickup"
                      value={pickupDT}
                      onChange={handlePickupChange}
                      minDateTime={getEarliestPickup()}
                      placeholder="Select pickup"
                      dark
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                      Drop Date &amp; Time
                    </label>
                    <DateTimePicker
                      ref={dropPickerRef}
                      label="Drop"
                      value={dropDT}
                      onChange={setDropDT}
                      minDateTime={
                        pickupDT
                          ? addHoursToSlot(pickupDT, MIN_BOOKING_HOURS)
                          : undefined
                      }
                      placeholder="Select drop"
                      hint={`Min. ${MIN_BOOKING_HOURS}h from pickup`}
                      dark
                    />
                  </div>
                </div>

                {/* Search */}
                <button
                  onClick={applyModifySearch}
                  className="btn-gradient py-2.5 px-6 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Search size={15} />
                  Update Search
                </button>
              </div>
              {modifyError && (
                <p className="flex items-center gap-1.5 text-red-400 text-xs font-semibold mt-3">
                  <AlertCircle size={13} /> {modifyError}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Left Filter Panel — Desktop */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-[136px]">
              <FilterPanel />
            </div>
          </aside>

          {/* Right: Car Grid */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-bold text-[#0F0F1A] font-syne text-xl">
                  {filtered.length} cars available
                </h1>
                <p className="text-[#9090A8] text-xs mt-0.5">
                  {city}
                  {pickupDT && (
                    <>
                      {" "}
                      · {formatDT(pickupDT)} → {formatDT(dropDT)}
                    </>
                  )}
                </p>
              </div>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#E4E5EF] text-sm text-[#0F0F1A] bg-white focus:border-[#E8540A] font-medium focus:outline-none"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9090A8] pointer-events-none"
                />
              </div>
            </div>

            {/* Car Grid — 3 columns */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((car) => (
                  <CarGridCard
                    key={car._id}
                    car={car}
                    highlighted={car._id === highlightCar}
                    cardRef={(el) => { cardRefs.current[car._id] = el; }}
                    hours={bookingHours}
                    bookUrl={buildCarUrl(car)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-[#E4E5EF]">
                <div className="w-16 h-16 rounded-2xl bg-[#FFF3ED] flex items-center justify-center mx-auto mb-4">
                  <Search size={28} className="text-[#E8540A]" />
                </div>
                <h3 className="font-bold text-[#0F0F1A] font-syne text-xl mb-2">
                  No cars match your filters
                </h3>
                <p className="text-[#9090A8] text-sm mb-5">
                  Try adjusting your filters to see more options
                </p>
                <button
                  onClick={clearAll}
                  className="btn-gradient px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#E4E5EF]">
              <h3 className="font-bold text-[#0F0F1A] font-syne">Filters</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-[#9090A8] hover:text-[#0F0F1A]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookPage() {
  return (
    <PageLayout>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F8F9FC] pt-28 flex items-center justify-center">
            <div className="text-[#9090A8] text-sm">Loading cars...</div>
          </div>
        }
      >
        <CarListingInner />
      </Suspense>
    </PageLayout>
  );
}
