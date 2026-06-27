"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MapPin, Search, Users, Star, ArrowRight, Phone, ChevronDown, ChevronUp, ArrowLeftRight } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import DateTimePicker, { DateTimePickerHandle } from "@/components/ui/DateTimePicker";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";
import { addHoursToSlot, getEarliestPickup } from "@/lib/utils";
import api from "@/lib/api";

interface Tempo {
  _id: string;
  name: string;
  slug: string;
  seats: number;
  fuel: string;
  location: string;
  basePrice: number;
  pricePerDay: number;
  pricePerKm: number;
  images: string[];
  shortDescription: string;
  showOnTop: boolean;
  isActive: boolean;
}

const TT_RATES = [
  { seats: "9 SEATER", outstation: "STARTING FROM ₹14 /KM", fullDay: "₹ 3500" },
  { seats: "12 SEATER", outstation: "STARTING FROM ₹18 /KM", fullDay: "₹ 4500" },
  { seats: "17 SEATER", outstation: "STARTING FROM ₹40 /KM", fullDay: "₹ 10,000" },
];

const FAQS = [
  { q: "What seating options are available in your Tempo Travellers?", a: "We offer 9, 12, 13, 16, 17, 20, and 26 seater AC Tempo Travellers to suit any group size." },
  { q: "Can I book a Tempo Traveller for both local and outstation trips?", a: "Yes! We provide Tempo Travellers for both local city tours and outstation trips across Delhi NCR and beyond." },
  { q: "Do you offer pickup and drop services across the NCR?", a: "Absolutely. We cover Delhi, Noida, Gurgaon, Ghaziabad, Greater Noida, and Faridabad for pickup and drop." },
  { q: "Are your Tempo Travellers suitable for weddings and corporate events?", a: "Yes, our well-maintained luxury Tempo Travellers are perfect for weddings, corporate events, pilgrimages, and family outings." },
  { q: "Is your Tempo Traveller AC or Non-AC?", a: "All our Tempo Travellers are fully air-conditioned with push-back seats, music system, and GPS tracking for a comfortable journey." },
];

const SERVICES = [
  {
    title: "Corporate Events, Offsites, & Employee Transportation",
    desc: "For team outings, conferences, and airport transfers, our well-maintained fleet offers professional, punctual service. Impress clients or give your staff a stress-free commute across Delhi, Noida, Gurgaon, and beyond.",
    img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
    alt: "Corporate events",
  },
  {
    title: "Spiritual Journeys to Ujjain",
    desc: "Plan your visit to the sacred city of Ujjain with our reliable travel services. Enjoy smooth, hassle-free transportation for Mahakal Darshan, temple tours, and local sightseeing.",
    img: "https://images.unsplash.com/photo-1585936369940-bbcd6b7428d8?w=600&q=80",
    alt: "Ujjain temple",
  },
  {
    title: "Amusement Park Outings and Picnics",
    desc: "Head to popular destinations like Worlds of Wonder, Appu Ghar, or Adventure Island without the headache of organizing multiple vehicles. Travel as a group and enjoy the day from start to finish together.",
    img: "https://images.unsplash.com/photo-1567591370989-7702d1734b7d?w=600&q=80",
    alt: "Amusement park",
  },
  {
    title: "Pilgrimages",
    desc: "Planning a trip to Haridwar, Mathura, Vrindavan, or other holy sites? Our Tempo Travellers provide a peaceful and comfortable ride, perfect for spiritual journeys with friends, family, or community groups.",
    img: "https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?w=600&q=80",
    alt: "Pilgrimage",
  },
];

const GALLERY = [
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
  "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
];

const REVIEWS = [
  {
    name: "Nikhil", city: "Noida",
    text: "Our traveller bus booking in Delhi was super easy and fast with Veekay Cabs. The support team was responsive, and the bus arrived right on time. The seats were comfortable, and the trip was hassle-free. For reliable and safe group transport, this traveller bus booking Delhi service is flawless.",
  },
  {
    name: "Mohit Singh", city: "Ghaziabad",
    text: "We were pleasantly surprised by the traveller bus price for 16 seater in Delhi — very reasonable for such great quality service. The bus was spotless, well-maintained, and comfortable for our entire wedding group. Best value for money among all traveller bus price 26 seater Delhi options available.",
  },
  {
    name: "Mukul Parmar", city: "Delhi",
    text: "The tempo traveller service in Delhi from Veekay Cabs is simply outstanding. We rented a vehicle for a family trip, and everything went perfectly — from booking to drop-off. The bus was neat, the driver courteous, and the ride smooth. Definitely one of the best traveller service in Delhi providers near you.",
  },
];

const STATS = [
  { value: "2003", label: "Car rental expert since 2003" },
  { value: "46+", label: "Car and coaches rental expert since" },
  { value: "18,000+", label: "Happy customers" },
];

export default function TempoTravellerPage() {
  const [tripType, setTripType] = useState<"round_trip" | "local">("round_trip");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [startDT, setStartDT] = useState("");
  const [endDT, setEndDT] = useState("");
  const [searchError, setSearchError] = useState("");

  const [tempos, setTempos] = useState<Tempo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);

  const dropPickerRef = useRef<DateTimePickerHandle>(null);

  useEffect(() => {
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${y}-${mo}-${day} ${h}:${m}`;
    };
    const now = new Date();
    const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setStartDT(fmt(now));
    setEndDT(fmt(next));
  }, []);

  const handlePickupChange = (v: string) => {
    setStartDT(v);
    if (v && v.split(" ")[1]) dropPickerRef.current?.open();
  };

  const swapLocations = () => {
    setPickupLocation(dropLocation);
    setDropLocation(pickupLocation);
  };

  const calcDays = () => {
    if (!startDT || !endDT) return 1;
    const diff = new Date(endDT.replace(" ", "T")).getTime() - new Date(startDT.replace(" ", "T")).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleSearch = async () => {
    if (!startDT) { setSearchError("Please select pickup date & time"); return; }
    if (tripType === "round_trip" && !endDT) { setSearchError("Please select return date & time"); return; }
    setSearchError("");
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get("/api/tempo/available");
      setTempos(data.data || []);
    } catch {
      setTempos([]);
    } finally {
      setLoading(false);
    }
  };

  const buildBookUrl = (tempo: Tempo) => {
    const days = calcDays();
    const params = new URLSearchParams({
      city: pickupLocation || "Delhi",
      tripType,
      start: startDT,
      end: endDT,
      days: String(days),
    });
    return `/tempo-traveller/${tempo.slug}?${params}`;
  };

  return (
    <PageLayout>
      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
        {/* Bg image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-black/65" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white text-center mb-2 leading-tight">
            Tempo traveller on rent in{" "}
            <span className="text-[#E8540A]">Delhi NCR</span>
          </h1>
          <p className="text-white/60 text-center mb-10 text-sm">9 to 26 Seater AC Tempo Travellers • Starting ₹14/km • Available 24/7</p>

          {/* Search Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-5xl mx-auto">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(["round_trip", "local"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTripType(t)}
                  className={`flex-1 py-3.5 text-sm font-bold uppercase tracking-widest transition-all ${
                    tripType === t
                      ? "text-[#0EA5E9] border-b-2 border-[#0EA5E9]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t === "round_trip" ? "Round Trip" : "Local Trip"}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-6">
              {/* Location Row */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {tripType === "round_trip" ? "Pick Up & Return City" : "Pick Up City"}
                </label>
                <div className="flex items-center gap-2">
                  <LocationAutocomplete
                    value={pickupLocation}
                    onChange={setPickupLocation}
                    placeholder="Enter a location"
                    className="flex-1"
                  />
                  {tripType === "round_trip" && (
                    <>
                      <button
                        onClick={swapLocations}
                        className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center text-white hover:bg-[#059669] transition-colors shrink-0 shadow-md"
                      >
                        <ArrowLeftRight size={16} />
                      </button>
                      <LocationAutocomplete
                        value={dropLocation}
                        onChange={setDropLocation}
                        placeholder="Enter a return location"
                        className="flex-1"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Pick Up Date & Time
                  </label>
                  <DateTimePicker
                    label="Pickup"
                    value={startDT}
                    onChange={handlePickupChange}
                    minDateTime={getEarliestPickup()}
                    placeholder="Start date and time"
                    error={!!searchError && !startDT}
                  />
                </div>
                {tripType === "round_trip" && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Return Date & Time
                    </label>
                    <DateTimePicker
                      ref={dropPickerRef}
                      label="Return"
                      value={endDT}
                      onChange={setEndDT}
                      minDateTime={startDT ? addHoursToSlot(startDT, 24) : undefined}
                      placeholder="End date and time"
                      hint="Min 24 hrs from pickup"
                      error={!!searchError && !endDT}
                    />
                  </div>
                )}
              </div>

              {searchError && <p className="text-red-500 text-xs font-semibold mb-3">{searchError}</p>}

              <button
                onClick={handleSearch}
                className="w-full sm:w-auto px-10 py-3.5 bg-[#E8540A] text-white font-bold rounded-full flex items-center justify-center gap-2 hover:bg-[#d4470a] transition-colors text-sm uppercase tracking-widest mx-auto block"
              >
                <Search size={16} />
                Explore Cabs
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESULTS ── */}
      {searched && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex flex-col items-center py-20">
                <div className="w-12 h-12 border-4 border-[#E8540A] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Finding available tempos...</p>
              </div>
            ) : tempos.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🚐</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No tempos available</h3>
                <p className="text-gray-500 mb-6">Contact us directly for bookings</p>
                <a href="tel:+919999926867" className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8540A] text-white rounded-full font-semibold text-sm">
                  <Phone size={16} /> Call Now
                </a>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900">
                    {tempos.length} Tempo{tempos.length > 1 ? "s" : ""} Available
                  </h2>
                  <p className="text-gray-500 text-sm">{calcDays()} day{calcDays() > 1 ? "s" : ""} · {tripType === "round_trip" ? "Round Trip" : "Local"}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tempos.map(tempo => (
                    <div key={tempo._id} className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {tempo.images?.[0] ? (
                          <img src={tempo.images[0]} alt={tempo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-6xl opacity-20">🚐</div>
                        )}
                        {tempo.showOnTop && (
                          <div className="absolute top-3 left-3 bg-[#E8540A] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Star size={11} fill="white" /> Featured
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#E8540A] transition-colors">{tempo.name}</h3>
                            <div className="flex items-center gap-3 text-gray-400 text-xs mt-0.5">
                              <span className="flex items-center gap-1"><Users size={11} />{tempo.seats} Seats</span>
                              <span>{tempo.fuel}</span>
                              <span className="flex items-center gap-1"><MapPin size={11} />{tempo.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {[
                            { label: "Base", value: `₹${tempo.basePrice.toLocaleString("en-IN")}` },
                            { label: "Per Day", value: `₹${tempo.pricePerDay.toLocaleString("en-IN")}` },
                            { label: "Per KM", value: `₹${tempo.pricePerKm}` },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-orange-50 rounded-xl p-2.5 text-center">
                              <div className="text-[#E8540A] font-bold text-sm">{value}</div>
                              <p className="text-gray-400 text-[10px] mt-0.5">{label}</p>
                            </div>
                          ))}
                        </div>
                        {tempo.shortDescription && (
                          <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">{tempo.shortDescription}</p>
                        )}
                        <Link
                          href={buildBookUrl(tempo)}
                          className="w-full py-3 bg-[#E8540A] text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-[#d4470a] transition-colors"
                        >
                          Book Now <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── WHY BOOK ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-gray-900 leading-tight mb-6">
                Why Book Tempo Traveller Rental Service in Delhi
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                We at Veekay Cabs provide premium, comfortable and affordable group travel options ensuring smooth journeys at reasonable prices. Whether it is a family vacation, a corporate outing, or a weekend trip with friends, we have the right vehicle for you.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our fleet comprises various models ranging from the basic ones to the luxurious Force Urbania Van. Our skilled and professional drivers have thorough understanding of Delhi&apos;s roads and traffic situations enabling them to pick the fastest and less congested routes.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {STATS.map(s => (
                <div key={s.value} className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm">
                  <div className="text-3xl font-black text-[#0EA5E9] mb-1">{s.value}</div>
                  <p className="text-gray-500 text-xs leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AFFORDABLE SERVICES ── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Images */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden h-64 md:h-80 bg-gray-100">
                <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80" alt="Tempo Traveller" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 right-0 w-2/3 rounded-2xl overflow-hidden h-36 border-4 border-white shadow-xl">
                <img src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&q=80" alt="Tempo Interior" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Content */}
            <div className="pt-4">
              <p className="text-[#E8540A] font-bold text-sm mb-1">Affordable Services</p>
              <h2 className="text-3xl font-black text-gray-900 mb-3">Rent A Tempo Traveller In Delhi</h2>
              <p className="font-bold text-gray-800 text-sm mb-3">VeekayCabs - Luxury Tempo Traveller Services In Delhi At Reasonable Prices</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-3">
                We the Veekaycabs, Luxury Tempo Traveller in Delhi offers premium, comfortable and affordable travel options for groups, ensuring smooth journeys at reasonable prices.
              </p>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Hiring Tempo Travelling in Delhi is not an easy task, especially during the peak hours. However, you can forget about the troubles if you have our skilled and professional drivers.
              </p>
              <blockquote className="border-l-4 border-[#E8540A] pl-4 italic text-gray-600 text-sm leading-relaxed">
                All the vehicles have been crafted to provide the highest level of comfort and they come with roomy interiors, seats that can be reclined, are air-conditioned and have enough space for the luggage of the entire trip to be stored thus making it a pleasant ride for all the passengers.
              </blockquote>

              {/* Rates table */}
              <div className="mt-6 rounded-xl overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0EA5E9] text-white">
                      <th className="py-3 px-4 text-left font-bold text-xs tracking-wider">TT RATES</th>
                      <th className="py-3 px-4 text-left font-bold text-xs tracking-wider">OUTSTATION PRICE (PER KM)</th>
                      <th className="py-3 px-4 text-left font-bold text-xs tracking-wider">FULL DAY HIRE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TT_RATES.map((r, i) => (
                      <tr key={r.seats} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="py-3 px-4 font-semibold text-gray-800">{r.seats}</td>
                        <td className="py-3 px-4 text-gray-600">{r.outstation}</td>
                        <td className="py-3 px-4 text-gray-800 font-bold">{r.fullDay}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPLORE DELHI DARK SECTION ── */}
      <section className="py-14 relative overflow-hidden" style={{ background: "#5C2300" }}>
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&q=60" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Explore Delhi &amp; Beyond Tempo Traveller Rentals</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Group travel is made by us at Veekay Cabs, easy and comfortable not only in Delhi but also in the whole NCR region that comprises Noida, Gurgaon, Ghaziabad, and Faridabad. A local city tour, an outstation trip, airport transfers, or any group travel plan is a perfect match with our Tempo Travellers Delhi.
          </p>
        </div>
      </section>

      {/* ── IMAGE GALLERY ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {GALLERY.map((img, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden cursor-pointer group" onClick={() => setGalleryIdx(i)}>
                  <img src={img} alt={`gallery ${i + 1}`} className={`w-full h-full object-cover transition-all duration-300 ${galleryIdx === i ? "ring-4 ring-[#E8540A]" : "group-hover:scale-105"}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="bg-gray-900 rounded-2xl overflow-hidden relative h-72">
              <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80" alt="Tempo fleet" className="w-full h-full object-cover opacity-60" />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90">
                <h3 className="text-white font-black text-lg mb-2">Hire a 9-26 seater Tempo Traveller in Delhi</h3>
                <p className="text-white/70 text-xs leading-relaxed">In case, you wish to make a group trip convenient and comfortable in Delhi, the hiring of a 9 – 26 seater tempo traveller on rent in delhi would be just right to space for the people as well as the luggage.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 flex flex-col justify-center">
              <h3 className="text-xl font-black text-gray-900 mb-4">Trusted By Thousand Clients And Across Delhi Wide Traveller</h3>
              {["Comfortable & Well-Maintained Fleet for All Group Sizes", "Professional Drivers with Local Route Expertise", "24/7 Customer Support for Hassle-Free Booking", "Affordable Pricing with No Hidden Charges"].map(t => (
                <div key={t} className="flex items-start gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-[#E8540A]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#E8540A] text-xs">✓</span>
                  </div>
                  <p className="text-gray-600 text-sm">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HAPPY CUSTOMERS ── */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&q=40" alt="" className="w-full h-full object-cover opacity-10" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[#E8540A] font-bold text-sm mb-1">Happy customers</p>
            <h2 className="text-3xl font-black text-gray-900">Rent A Tempo Traveller In Delhi</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <p className="text-gray-600 text-sm leading-relaxed mb-5">{r.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8540A]/10 flex items-center justify-center text-[#E8540A] font-bold">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-[#E8540A] font-bold text-sm">{r.name}</p>
                    <p className="text-gray-400 text-xs">{r.city}</p>
                  </div>
                  <div className="ml-auto w-8 h-8 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center">
                    <span className="text-[#0EA5E9] text-xs">💬</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === reviewIdx ? "bg-[#E8540A] w-6" : "bg-gray-300"}`} onClick={() => setReviewIdx(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR SERVICES ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#E8540A] font-bold text-sm mb-1">Our Services</p>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Rent A Tempo Traveller In Delhi</h2>
          <p className="text-gray-500 text-xs mb-1">Tempo Traveller in Delhi | Rent luxury 9 to 26 Seater at best price</p>
          <p className="text-gray-500 text-xs mb-6">Book a luxury tempo traveller in delhi. Avail 9 to 26 seater Tempo traveller in delhi location for group travel, corporate events and family trips at best price</p>
          <p className="text-gray-400 text-xs mb-8 leading-relaxed">Tempo traveller for rent delhi, tempo traveller for rent delhi, tempo traveller delhi, tempo traveller delhi, tempo traveller hire delhi, tempo traveller hire in delhi, delhi tempo traveller booking, hire a tempo traveller in delhi, luxury 12 seater tempo traveller delhi, luxury tempo traveller delhi</p>

          <div className="space-y-8">
            {SERVICES.map((s, i) => (
              <div key={s.title} className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                <div className={i % 2 === 1 ? "md:order-2" : ""}>
                  <h3 className="text-xl font-black text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
                <div className={`rounded-2xl overflow-hidden h-56 ${i % 2 === 1 ? "md:order-1" : ""}`}>
                  <img src={s.img} alt={s.alt} className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="rounded-2xl overflow-hidden h-72 md:h-96 relative">
                <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80" alt="Tempo fleet" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-5">
                  <h3 className="text-white font-black text-lg mb-2">Trusted By Thousand Clients And Across Delhi Wide Traveller</h3>
                  {["Comfortable & Well-Maintained Fleet for All Group Sizes", "Professional Drivers with Local Route Expertise", "24/7 Customer Support for Hassle-Free Booking", "Affordable Pricing with No Hidden Charges"].map(t => (
                    <div key={t} className="flex items-center gap-2 mt-1">
                      <span className="text-[#E8540A] text-xs">✓</span>
                      <span className="text-white/70 text-xs">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-[#E8540A] font-bold text-sm mb-1">Our Question And Answer</p>
              <h2 className="text-3xl font-black text-gray-900 mb-6">Do you have question? Find Answer Here</h2>
              <div className="space-y-3">
                {FAQS.map((faq, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-800 pr-4">{faq.q}</span>
                      {faqOpen === i ? <ChevronUp size={18} className="text-[#E8540A] shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                    </button>
                    {faqOpen === i && (
                      <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 bg-[#E8540A] text-center">
        <h2 className="text-2xl font-black text-white mb-2">Need Help Booking a Tempo Traveller?</h2>
        <p className="text-white/80 text-sm mb-6">Our team is available 24/7 to help you plan your group trip</p>
        <a href="tel:+919999926867" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#E8540A] font-bold rounded-full hover:bg-orange-50 transition-colors text-sm">
          <Phone size={18} />
          +91 9999926867
        </a>
      </section>
    </PageLayout>
  );
}
