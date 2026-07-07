"use client";

import { useEffect, useState, useCallback } from "react";
import { Navigation, Car, MapPin, Wifi, WifiOff, Battery, Gauge, Clock, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminGpsApi } from "@/lib/api";

type GpsCar = {
  carId: string;
  name: string;
  regNo: string;
  deviceId: string;
  status: "online" | "idle" | "offline";
  speed: number;
  battery: number | null;
  ignition?: boolean | null;
  lat: number | null;
  lng: number | null;
  lastUpdate: string | null;
  address: string | null;
  customer: string;
  bookingEnd: string | null;
};

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  online: { label: "Online", bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  idle: { label: "Idle", bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  offline: { label: "Offline", bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
}

export default function GPSTrackingPage() {
  const [cars, setCars] = useState<GpsCar[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GpsCar | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminGpsApi.getLive();
      const data: GpsCar[] = res.data.data || [];
      setConfigured(res.data.configured !== false);
      setCars(data);
      setSelected((prev) => data.find((c) => c.carId === prev?.carId) || data[0] || null);
    } catch {
      // keep last known data on transient failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Millitrack refreshes data every 10-15s and blocks IPs polling faster than that
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = cars.filter(c => statusFilter === "All" || c.status === statusFilter.toLowerCase());

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">GPS Tracking</h1>
          <p className="text-[#9090A8] text-sm">{cars.filter(c => c.status === "online").length} cars online · {cars.length} total tracked</p>
        </div>
        <button onClick={() => load()} className="flex items-center gap-2 border border-[#E4E5EF] text-[#4A4A6A] px-4 py-2.5 rounded-xl text-sm font-semibold hover:border-[#E8540A] hover:text-[#E8540A] transition-colors">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Refresh
        </button>
      </div>

      {!configured && (
        <div className="bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-2xl p-4 text-sm text-[#92400E]">
          GPS provider not configured. Set <code className="font-mono">UFFIZIO_API_KEY</code> in the server .env to your Millitrack access token to enable live tracking.
        </div>
      )}

      {configured && !loading && cars.length === 0 && (
        <div className="bg-white border border-[#E4E5EF] rounded-2xl p-8 text-center text-sm text-[#9090A8]">
          No cars have a GPS device assigned yet. Add a GPS Device ID on a car's edit page to start tracking it.
        </div>
      )}

      {cars.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Online", count: cars.filter(c => c.status === "online").length, color: "#10B981", bg: "#D1FAE5" },
              { label: "Idle", count: cars.filter(c => c.status === "idle").length, color: "#F59E0B", bg: "#FEF3C7" },
              { label: "Offline", count: cars.filter(c => c.status === "offline").length, color: "#EF4444", bg: "#FEE2E2" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                </div>
                <div>
                  <p className="text-2xl font-black text-[#0F0F1A]">{s.count}</p>
                  <p className="text-[#9090A8] text-xs">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-5">
            {/* Car List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex gap-2">
                {["All", "Online", "Idle", "Offline"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-colors", statusFilter === s ? "bg-[#E8540A] text-white" : "bg-white border border-[#E4E5EF] text-[#4A4A6A] hover:border-[#E8540A]/50")}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filtered.map(car => {
                  const sc = STATUS_CFG[car.status];
                  return (
                    <button key={car.carId} onClick={() => setSelected(car)}
                      className={cn("w-full text-left bg-white rounded-xl border p-4 transition-all", selected?.carId === car.carId ? "border-[#E8540A] shadow-[0_0_0_3px_rgba(232,84,10,0.1)]" : "border-[#E4E5EF] hover:border-[#E8540A]/40")}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
                              <Car size={18} className="text-[#E8540A]" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: sc.dot }} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#0F0F1A]">{car.name}</p>
                            <p className="text-xs text-[#9090A8] font-mono">{car.regNo}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>{sc.label}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-[#4A4A6A]">
                        <span className="flex items-center gap-1"><MapPin size={10} className="text-[#9090A8]" /> {car.address ? car.address.split(",")[0] : car.lat ? `${car.lat.toFixed(3)}, ${car.lng?.toFixed(3)}` : "No fix"}</span>
                        <span className="flex items-center gap-1"><Gauge size={10} className="text-[#9090A8]" /> {car.speed} km/h</span>
                        <span className="flex items-center gap-1"><Battery size={10} className="text-[#9090A8]" /> {car.battery != null ? `${car.battery}%` : "—"}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#9090A8]">
                        <Clock size={9} /> Last seen {timeAgo(car.lastUpdate)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Map + Detail */}
            <div className="lg:col-span-3 space-y-4">
              {/* Map Placeholder */}
              <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden" style={{ height: 320 }}>
                <div className="relative w-full h-full bg-gradient-to-br from-[#E8F5E8] to-[#D1FAE5] flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="absolute border-[#10B981] border" style={{ left: `${i * 14}%`, top: 0, bottom: 0, width: 1 }} />
                    ))}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="absolute border-[#10B981] border" style={{ top: `${i * 18}%`, left: 0, right: 0, height: 1 }} />
                    ))}
                  </div>
                  {filtered.filter(c => c.status !== "offline" && c.lat != null).map((car, i) => {
                    const sc = STATUS_CFG[car.status];
                    const x = 15 + (i * 18) % 70;
                    const y = 20 + (i * 22) % 60;
                    return (
                      <button key={car.carId} onClick={() => setSelected(car)}
                        className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
                        <div className={cn("w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all", selected?.carId === car.carId ? "w-10 h-10" : "")} style={{ backgroundColor: sc.dot }}>
                          <Car size={selected?.carId === car.carId ? 16 : 13} className="text-white" />
                        </div>
                        {selected?.carId === car.carId && (
                          <div className="absolute left-1/2 -translate-x-1/2 mt-1 bg-[#0F0F1A] text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                            {car.regNo}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {selected?.lat != null ? (
                    <a
                      href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-[#4A4A6A] hover:bg-white transition-colors"
                    >
                      <p className="font-bold text-[#0F0F1A]">Live Map</p>
                      <p className="text-[#E8540A] font-semibold">Open in Maps for exact location →</p>
                    </a>
                  ) : (
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-[#4A4A6A]">
                      <p className="font-bold text-[#0F0F1A]">Live Map</p>
                      <p>Relative positions — select a car with a fix to open Maps</p>
                    </div>
                  )}
                  <a
                    href={selected?.lat != null ? `https://www.google.com/maps?q=${selected.lat},${selected.lng}` : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={selected?.lat == null}
                    className={cn(
                      "absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 transition-colors",
                      selected?.lat != null ? "hover:bg-white cursor-pointer" : "opacity-40 pointer-events-none"
                    )}
                  >
                    <Navigation size={14} className="text-[#E8540A]" />
                  </a>
                </div>
              </div>

              {/* Selected Car Details */}
              {selected && (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
                        <Car size={18} className="text-[#E8540A]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#0F0F1A]">{selected.name}</p>
                        <p className="text-xs text-[#9090A8] font-mono">{selected.regNo}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: STATUS_CFG[selected.status].bg, color: STATUS_CFG[selected.status].text }}>
                      {selected.status === "online" ? <Wifi size={11} /> : <WifiOff size={11} />}
                      {STATUS_CFG[selected.status].label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Speed", value: `${selected.speed} km/h`, icon: Gauge, color: "#3B82F6" },
                      { label: "Battery", value: selected.battery != null ? `${selected.battery}%` : "—", icon: Battery, color: (selected.battery ?? 100) < 20 ? "#EF4444" : "#10B981" },
                      { label: "Ignition", value: selected.ignition == null ? "—" : selected.ignition ? "On" : "Off", icon: Wifi, color: "#8B5CF6" },
                      { label: "Last Update", value: timeAgo(selected.lastUpdate), icon: Clock, color: "#F59E0B" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="bg-[#F8F9FC] rounded-xl p-3">
                        <Icon size={14} style={{ color }} className="mb-1.5" />
                        <p className="font-bold text-sm text-[#0F0F1A]">{value}</p>
                        <p className="text-[#9090A8] text-xs">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-[#F8F9FC] rounded-xl flex items-start gap-2">
                    <MapPin size={14} className="text-[#E8540A] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-[#0F0F1A]">{selected.address || "Address unavailable"}</p>
                      {selected.lat != null && (
                        <p className="text-xs text-[#9090A8]">Lat: {selected.lat.toFixed(4)}, Lng: {selected.lng?.toFixed(4)}</p>
                      )}
                      {selected.customer !== "Depot" && (
                        <p className="text-xs text-[#E8540A] font-semibold mt-0.5">Customer: {selected.customer} · Return: {selected.bookingEnd ? new Date(selected.bookingEnd).toLocaleDateString("en-IN") : "—"}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-[#EDE9FE] rounded-xl text-xs text-[#6D28D9]">
                    <p className="font-bold">GPS Device: {selected.deviceId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
