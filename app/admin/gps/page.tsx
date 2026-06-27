"use client";

import { useState } from "react";
import { Navigation, Car, MapPin, Wifi, WifiOff, Battery, Gauge, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const GPS_CARS = [
  { id: "1", name: "Toyota Rumion", regNo: "HR-8125-AX", deviceId: "GPS-0012", status: "online", speed: 45, battery: 82, lat: 28.6139, lng: 77.209, lastUpdate: "2 min ago", location: "Connaught Place, Delhi", customer: "Rajesh Verma", bookingEnd: "16 Jun 2026", signal: "Strong" },
  { id: "2", name: "Toyota Glanza", regNo: "DL3CDA2958", deviceId: "GPS-0015", status: "online", speed: 0, battery: 65, lat: 28.5355, lng: 77.391, lastUpdate: "5 min ago", location: "Sector 18, Noida", customer: "Manish Gupta", bookingEnd: "17 Jun 2026", signal: "Good" },
  { id: "3", name: "Maruti Suzuki Baleno", regNo: "DL7CX6144", deviceId: "GPS-0008", status: "online", speed: 78, battery: 91, lat: 28.4595, lng: 77.0266, lastUpdate: "1 min ago", location: "Golf Course Road, Gurgaon", customer: "Vivek Kumar", bookingEnd: "16 Jun 2026", signal: "Strong" },
  { id: "4", name: "Hyundai Creta", regNo: "DL7CY6997", deviceId: "GPS-0021", status: "idle", speed: 0, battery: 45, lat: 28.6429, lng: 77.2166, lastUpdate: "25 min ago", location: "Lajpat Nagar, Delhi", customer: "Depot", bookingEnd: "—", signal: "Good" },
  { id: "5", name: "Mahindra Scorpio N", regNo: "HR-8504-D", deviceId: "GPS-0033", status: "offline", speed: 0, battery: 12, lat: 28.6692, lng: 77.4538, lastUpdate: "3 hrs ago", location: "Indirapuram, Ghaziabad", customer: "Depot", bookingEnd: "—", signal: "Weak" },
  { id: "6", name: "Kia Carens", regNo: "HR-0916-BB", deviceId: "GPS-0005", status: "online", speed: 32, battery: 78, lat: 28.5355, lng: 77.342, lastUpdate: "3 min ago", location: "Sector 62, Noida", customer: "Amit Shah", bookingEnd: "18 Jun 2026", signal: "Strong" },
];

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  online: { label: "Online", bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  idle: { label: "Idle", bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  offline: { label: "Offline", bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

export default function GPSTrackingPage() {
  const [selected, setSelected] = useState<(typeof GPS_CARS)[0] | null>(GPS_CARS[0]);
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = GPS_CARS.filter(c => statusFilter === "All" || c.status === statusFilter.toLowerCase());

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">GPS Tracking</h1>
          <p className="text-[#9090A8] text-sm">{GPS_CARS.filter(c => c.status === "online").length} cars online · {GPS_CARS.length} total tracked</p>
        </div>
        <button className="flex items-center gap-2 border border-[#E4E5EF] text-[#4A4A6A] px-4 py-2.5 rounded-xl text-sm font-semibold hover:border-[#E8540A] hover:text-[#E8540A] transition-colors">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Online", count: GPS_CARS.filter(c => c.status === "online").length, color: "#10B981", bg: "#D1FAE5" },
          { label: "Idle", count: GPS_CARS.filter(c => c.status === "idle").length, color: "#F59E0B", bg: "#FEF3C7" },
          { label: "Offline", count: GPS_CARS.filter(c => c.status === "offline").length, color: "#EF4444", bg: "#FEE2E2" },
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
                <button key={car.id} onClick={() => setSelected(car)}
                  className={cn("w-full text-left bg-white rounded-xl border p-4 transition-all", selected?.id === car.id ? "border-[#E8540A] shadow-[0_0_0_3px_rgba(232,84,10,0.1)]" : "border-[#E4E5EF] hover:border-[#E8540A]/40")}>
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
                    <span className="flex items-center gap-1"><MapPin size={10} className="text-[#9090A8]" /> {car.location.split(",")[0]}</span>
                    <span className="flex items-center gap-1"><Gauge size={10} className="text-[#9090A8]" /> {car.speed} km/h</span>
                    <span className="flex items-center gap-1"><Battery size={10} className="text-[#9090A8]" /> {car.battery}%</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#9090A8]">
                    <Clock size={9} /> Last seen {car.lastUpdate}
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
              {/* Fake map grid */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="absolute border-[#10B981] border" style={{ left: `${i * 14}%`, top: 0, bottom: 0, width: 1 }} />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="absolute border-[#10B981] border" style={{ top: `${i * 18}%`, left: 0, right: 0, height: 1 }} />
                ))}
              </div>
              {/* Car pins on map */}
              {filtered.filter(c => c.status !== "offline").map((car, i) => {
                const sc = STATUS_CFG[car.status];
                const x = 15 + (i * 18) % 70;
                const y = 20 + (i * 22) % 60;
                return (
                  <button key={car.id} onClick={() => setSelected(car)}
                    className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
                    <div className={cn("w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all", selected?.id === car.id ? "w-10 h-10" : "")} style={{ backgroundColor: sc.dot }}>
                      <Car size={selected?.id === car.id ? 16 : 13} className="text-white" />
                    </div>
                    {selected?.id === car.id && (
                      <div className="absolute left-1/2 -translate-x-1/2 mt-1 bg-[#0F0F1A] text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                        {car.regNo}
                      </div>
                    )}
                  </button>
                );
              })}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-[#4A4A6A]">
                <p className="font-bold text-[#0F0F1A]">Live Map</p>
                <p>GPS Integration Required</p>
              </div>
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5">
                <Navigation size={14} className="text-[#E8540A]" />
              </div>
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
                  { label: "Battery", value: `${selected.battery}%`, icon: Battery, color: selected.battery < 20 ? "#EF4444" : "#10B981" },
                  { label: "Signal", value: selected.signal, icon: Wifi, color: "#8B5CF6" },
                  { label: "Last Update", value: selected.lastUpdate, icon: Clock, color: "#F59E0B" },
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
                  <p className="font-semibold text-sm text-[#0F0F1A]">{selected.location}</p>
                  <p className="text-xs text-[#9090A8]">Lat: {selected.lat.toFixed(4)}, Lng: {selected.lng.toFixed(4)}</p>
                  {selected.customer !== "Depot" && (
                    <p className="text-xs text-[#E8540A] font-semibold mt-0.5">Customer: {selected.customer} · Return: {selected.bookingEnd}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 p-3 bg-[#EDE9FE] rounded-xl text-xs text-[#6D28D9]">
                <p className="font-bold mb-0.5">GPS Device: {selected.deviceId}</p>
                <p>To enable live tracking, integrate your GPS provider API in server/src/services/gps.js and connect device {selected.deviceId}.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
