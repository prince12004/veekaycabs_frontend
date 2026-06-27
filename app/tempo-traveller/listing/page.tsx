"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Users, Star, ArrowRight, Phone, ArrowLeft,
  Calendar, Clock, SlidersHorizontal, X, ChevronDown, Search,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
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

const SEAT_OPTIONS = ["Any", "9", "12", "13", "16", "17", "20", "26"];
const SORT_OPTIONS = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Seats: Low to High", value: "seats_asc" },
  { label: "Seats: High to Low", value: "seats_desc" },
];

function TempoListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const city = searchParams.get("city") || "Delhi";
  const tripType = searchParams.get("tripType") || "round_trip";
  const start = searchParams.get("start") || "";
  const end = searchParams.get("end") || "";
  const days = Number(searchParams.get("days") || 1);

  const [tempos, setTempos] = useState<Tempo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [seatFilter, setSeatFilter] = useState("Any");
  const [sortBy, setSortBy] = useState("recommended");
  const [maxPerDay, setMaxPerDay] = useState<number | "">("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get("/api/tempo/available")
      .then(({ data }) => setTempos(data.data || []))
      .catch(() => setTempos([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...tempos];

    if (seatFilter !== "Any") {
      list = list.filter((t) => t.seats === Number(seatFilter));
    }
    if (maxPerDay !== "") {
      list = list.filter((t) => t.pricePerDay <= Number(maxPerDay));
    }

    switch (sortBy) {
      case "price_asc":  list.sort((a, b) => a.pricePerDay - b.pricePerDay); break;
      case "price_desc": list.sort((a, b) => b.pricePerDay - a.pricePerDay); break;
      case "seats_asc":  list.sort((a, b) => a.seats - b.seats); break;
      case "seats_desc": list.sort((a, b) => b.seats - a.seats); break;
      default:
        list.sort((a, b) => (b.showOnTop ? 1 : 0) - (a.showOnTop ? 1 : 0));
    }
    return list;
  }, [tempos, seatFilter, sortBy, maxPerDay]);

  const activeFilters = (seatFilter !== "Any" ? 1 : 0) + (maxPerDay !== "" ? 1 : 0);

  const clearFilters = () => { setSeatFilter("Any"); setMaxPerDay(""); setSortBy("recommended"); };

  const formatDT = (dt: string) => {
    if (!dt) return "";
    const d = new Date(dt.replace(" ", "T"));
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
      " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const buildBookUrl = (tempo: Tempo) => {
    const params = new URLSearchParams({ city, tripType, start, end, days: String(days) });
    return `/tempo-traveller/${tempo.slug}?${params}`;
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F0F1F6]">

        {/* ── Sticky header bar ── */}
        <div className="bg-white border-b border-[#E4E5EF] sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-[#4A4A6A] hover:text-[#E8540A] transition-colors text-sm font-semibold shrink-0"
            >
              <ArrowLeft size={15} /> Back
            </button>

            <div className="h-5 w-px bg-[#E4E5EF] hidden sm:block" />

            <div className="flex flex-wrap items-center gap-3 flex-1 text-xs text-[#4A4A6A]">
              <span className="flex items-center gap-1 font-semibold">
                <MapPin size={13} className="text-[#E8540A]" /> {city}
              </span>
              {start && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-[#E8540A]" /> {formatDT(start)}
                </span>
              )}
              {end && (
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-[#E8540A]" /> {formatDT(end)}
                </span>
              )}
              <span className="bg-[#E8540A]/10 text-[#E8540A] font-bold px-2.5 py-0.5 rounded-full">
                {days} Day{days > 1 ? "s" : ""} · {tripType === "round_trip" ? "Round Trip" : "Local"}
              </span>
            </div>

            <Link href="/tempo-traveller" className="text-xs font-bold text-[#E8540A] hover:underline shrink-0">
              Modify Search
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {loading ? (
            <div className="flex flex-col items-center py-28 gap-4">
              <div className="w-14 h-14 border-4 border-[#E8540A] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#9090A8] font-medium text-sm">Finding available tempo travellers...</p>
            </div>
          ) : (
            <>
              {/* ── Filter & Sort bar ── */}
              <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-sm p-4 mb-5">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Result count */}
                  <p className="text-sm font-black text-[#0F0F1A] font-syne flex-1 min-w-max">
                    {filtered.length} Tempo{filtered.length !== 1 ? "s" : ""} Available
                  </p>

                  {/* Seats filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider whitespace-nowrap">Seats:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {SEAT_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSeatFilter(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            seatFilter === s
                              ? "bg-[#E8540A] text-white shadow-sm"
                              : "bg-[#F8F9FC] text-[#4A4A6A] hover:bg-[#E8540A]/10 hover:text-[#E8540A]"
                          }`}
                        >
                          {s === "Any" ? "Any" : `${s} Seater`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max price filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider whitespace-nowrap">Max ₹/day:</span>
                    <input
                      type="number"
                      value={maxPerDay}
                      onChange={(e) => setMaxPerDay(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Any"
                      className="w-24 border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-1.5 text-xs text-[#0F0F1A] outline-none bg-white"
                    />
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider whitespace-nowrap">Sort:</span>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl pl-3 pr-8 py-1.5 text-xs font-semibold text-[#0F0F1A] outline-none bg-white cursor-pointer"
                      >
                        {SORT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9090A8] pointer-events-none" />
                    </div>
                  </div>

                  {/* Clear filters */}
                  {activeFilters > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <X size={12} /> Clear ({activeFilters})
                    </button>
                  )}
                </div>
              </div>

              {/* ── Results ── */}
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-sm py-20 text-center">
                  <Search size={36} className="text-[#E4E5EF] mx-auto mb-3" />
                  <h3 className="text-lg font-black text-[#0F0F1A] mb-1 font-syne">No match found</h3>
                  <p className="text-[#9090A8] text-sm mb-4">Try adjusting your filters</p>
                  <button onClick={clearFilters} className="text-sm font-bold text-[#E8540A] hover:underline">
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((tempo) => (
                    <div
                      key={tempo._id}
                      className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden group hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-[#F8F9FC] overflow-hidden">
                        {tempo.images?.[0] ? (
                          <img
                            src={tempo.images[0]}
                            alt={tempo.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-7xl opacity-10">🚐</div>
                        )}
                        {tempo.showOnTop && (
                          <div className="absolute top-3 left-3 bg-[#E8540A] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <Star size={10} fill="white" /> Featured
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#0F0F1A] text-xs font-black px-2.5 py-1 rounded-full border border-[#E4E5EF]">
                          {tempo.seats} Seater
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-5">
                        <div className="mb-3">
                          <h3 className="font-black text-[#0F0F1A] text-lg font-syne group-hover:text-[#E8540A] transition-colors leading-tight">
                            {tempo.name}
                          </h3>
                          <div className="flex items-center gap-3 text-[#9090A8] text-xs mt-1">
                            <span className="flex items-center gap-1"><Users size={11} /> {tempo.seats} Seats</span>
                            <span>{tempo.fuel}</span>
                            <span className="flex items-center gap-1"><MapPin size={11} /> {tempo.location}</span>
                          </div>
                        </div>

                        {/* Pricing grid */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {[
                            { label: "Base", value: `₹${tempo.basePrice.toLocaleString("en-IN")}` },
                            { label: "Per Day", value: `₹${tempo.pricePerDay.toLocaleString("en-IN")}` },
                            { label: "Per KM", value: `₹${tempo.pricePerKm}` },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-[#FFF3ED] rounded-xl p-2.5 text-center border border-[#E8540A]/10">
                              <div className="text-[#E8540A] font-black text-sm">{value}</div>
                              <p className="text-[#9090A8] text-[10px] mt-0.5">{label}</p>
                            </div>
                          ))}
                        </div>

                        {tempo.shortDescription && (
                          <p className="text-[#4A4A6A] text-xs leading-relaxed mb-4 line-clamp-2">{tempo.shortDescription}</p>
                        )}

                        <Link
                          href={buildBookUrl(tempo)}
                          className="w-full py-3 bg-gradient-to-r from-[#E8540A] to-[#FF6B35] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(232,84,10,0.25)]"
                        >
                          View Details & Book <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Help strip ── */}
              <div className="mt-6 bg-white rounded-2xl border border-[#E4E5EF] p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[#0F0F1A] text-sm">Need help choosing the right vehicle?</p>
                  <p className="text-[#9090A8] text-xs mt-0.5">Our team is available 24/7</p>
                </div>
                <a
                  href="tel:+919999926867"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#E8540A] text-white rounded-xl font-bold text-sm hover:bg-[#d4470a] transition-colors shrink-0"
                >
                  <Phone size={14} /> +91 99999 26867
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default function TempoListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E8540A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TempoListingContent />
    </Suspense>
  );
}
