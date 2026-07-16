"use client";

import { useCallback, useEffect, useState } from "react";
import { Car as CarIcon, MapPin, Gauge, Clock, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { FleetMap } from "@/components/admin/FleetMap";
import { FLEET_STATUS, type FleetStatus } from "@/lib/fleetStatus";

// Public, no-login "track my shuttle"-style board: a shareable link showing
// where the whole fleet is right now. Deliberately thinner than /admin/gps —
// backed by /api/public/gps/live, which strips customer/booking details.
type PublicCar = {
  carId: string;
  name: string;
  regNo: string;
  status: FleetStatus;
  speed: number;
  lat: number | null;
  lng: number | null;
  lastUpdate: string | null;
  address: string | null;
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

export default function DisplayClient() {
  const [cars, setCars] = useState<PublicCar[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/api/public/gps/live");
      const data: PublicCar[] = res.data.data || [];
      setConfigured(res.data.configured !== false);
      setCars(data);
      setSelectedId((prev) => (data.some((c) => c.carId === prev) ? prev : data[0]?.carId ?? null));
    } catch {
      // keep last known data on transient failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Millitrack refreshes every 10-15s and blocks IPs polling faster than that
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, [load]);

  const counts: Record<FleetStatus, number> = {
    online: cars.filter((c) => c.status === "online").length,
    idle: cars.filter((c) => c.status === "idle").length,
    offline: cars.filter((c) => c.status === "offline").length,
  };

  return (
    <div className="h-screen bg-[#F0F1F6] flex flex-col overflow-hidden">
      <div className="bg-white border-b border-[#E4E5EF] px-6 py-3.5 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center shadow-[0_4px_16px_rgba(232,84,10,0.35)] shrink-0">
            <span className="text-white font-black text-sm font-syne">VK</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-[#0F0F1A] font-syne leading-none">Veekay Cabs — Live Fleet</h1>
            <p className="text-[#9090A8] text-xs mt-1">{cars.length} vehicle{cars.length === 1 ? "" : "s"} tracked · updates every 15s</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(["online", "idle", "offline"] as const).map((key) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: FLEET_STATUS[key].bg, color: FLEET_STATUS[key].text }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FLEET_STATUS[key].solid }} />
              {counts[key]} {FLEET_STATUS[key].label}
            </span>
          ))}
          <button
            onClick={() => load()}
            className="flex items-center gap-2 border border-[#E4E5EF] text-[#4A4A6A] px-3 py-1.5 rounded-xl text-xs font-semibold hover:border-[#E8540A] hover:text-[#E8540A] transition-colors"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
        </div>
      </div>

      {!configured && (
        <div className="m-6 bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-2xl p-4 text-sm text-[#92400E]">
          Live tracking isn&apos;t set up yet — check back shortly.
        </div>
      )}

      {configured && !loading && cars.length === 0 && (
        <div className="m-6 bg-white border border-[#E4E5EF] rounded-2xl p-8 text-center text-sm text-[#9090A8]">
          No vehicles are being tracked right now.
        </div>
      )}

      {cars.length > 0 && (
        <div className="flex-1 grid lg:grid-cols-5 gap-5 p-6 min-h-0">
          <div className="lg:col-span-1 space-y-2 overflow-y-auto pr-1">
            {cars.map((car) => {
              const sc = FLEET_STATUS[car.status];
              return (
                <button
                  key={car.carId}
                  onClick={() => setSelectedId(car.carId)}
                  className={cn(
                    "w-full text-left bg-white rounded-xl border p-4 transition-all",
                    selectedId === car.carId ? "border-[#E8540A] shadow-[0_0_0_3px_rgba(232,84,10,0.1)]" : "border-[#E4E5EF] hover:border-[#E8540A]/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
                          <CarIcon size={18} className="text-[#E8540A]" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: sc.solid }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#0F0F1A] truncate">{car.name}</p>
                        <p className="text-xs text-[#9090A8] font-mono">{car.regNo}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: sc.bg, color: sc.text }}>{sc.label}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-[#4A4A6A]">
                    <span className="flex items-center gap-1 min-w-0"><MapPin size={10} className="text-[#9090A8] shrink-0" /> <span className="truncate">{car.address ? car.address.split(",")[0] : "No fix"}</span></span>
                    <span className="flex items-center gap-1 shrink-0"><Gauge size={10} className="text-[#9090A8]" /> {car.speed} km/h</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#9090A8]">
                    <Clock size={9} /> Last seen {timeAgo(car.lastUpdate)}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
            <FleetMap cars={cars} selectedId={selectedId} onSelect={setSelectedId} height="100%" />
          </div>
        </div>
      )}
    </div>
  );
}
