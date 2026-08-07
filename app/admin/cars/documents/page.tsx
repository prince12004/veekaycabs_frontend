"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText, Upload, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, Car, Send, ExternalLink, RefreshCw, X, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminCarsApi, bookingsApi } from "@/lib/api";

const DOC_TYPES = [
  { key: "rc", label: "RC Book", color: "#3B82F6" },
  { key: "insurance", label: "Insurance", color: "#10B981" },
  { key: "puc", label: "PUC Certificate", color: "#F59E0B" },
  { key: "fitness", label: "Fitness Certificate", color: "#8B5CF6" },
  { key: "roadTax", label: "Road Tax", color: "#EF4444" },
] as const;

type DocType = typeof DOC_TYPES[number]["key"];

interface CarDoc {
  url?: string;
  expiry?: string;
}

interface CarItem {
  _id: string;
  name: string;
  registrationNo: string;
  type: string;
  documents?: Record<DocType, CarDoc>;
}

interface Booking {
  _id: string;
  bookingId: string;
  userId?: { name?: string; mobile?: string };
  status: string;
}

const docStatus = (doc?: CarDoc) => {
  if (!doc?.url) return "missing";
  if (!doc.expiry) return "valid";
  const days = Math.ceil((new Date(doc.expiry).getTime() - Date.now()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "valid";
};

const statusBadge = (status: string) => {
  switch (status) {
    case "valid": return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">Valid</span>;
    case "expiring": return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">Expiring Soon</span>;
    case "expired": return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">Expired</span>;
    default: return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#9090A8]/10 text-[#9090A8]">Not Uploaded</span>;
  }
};

export default function CarDocumentsPage() {
  const [cars, setCars] = useState<CarItem[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarItem | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingCars, setLoadingCars] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [expiryEdits, setExpiryEdits] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [sendModal, setSendModal] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [manualMobiles, setManualMobiles] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setLoadingCars(true);
    adminCarsApi.getAll({ limit: "all" }).then((res) => {
      setCars(res.data?.data || []);
    }).finally(() => setLoadingCars(false));
  }, []);

  const handleSelectCar = (car: CarItem) => {
    setSelectedCar(car);
    setDropdownOpen(false);
    setExpiryEdits({});
  };

  const refreshCar = async (carId: string) => {
    const res = await adminCarsApi.getAll({ limit: "all" });
    const updated = (res.data?.data || []).find((c: CarItem) => c._id === carId);
    if (updated) {
      setSelectedCar(updated);
      setCars(res.data.data);
    }
  };

  const handleUpload = async (docType: DocType) => {
    const file = fileRefs.current[docType]?.files?.[0];
    if (!file || !selectedCar) return;

    setUploading((p) => ({ ...p, [docType]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (expiryEdits[docType]) fd.append("expiry", expiryEdits[docType]);

      await adminCarsApi.uploadDocument(selectedCar._id, docType, fd);
      showToast("Document uploaded successfully!");
      await refreshCar(selectedCar._id);
      if (fileRefs.current[docType]) fileRefs.current[docType]!.value = "";
    } catch {
      showToast("Upload failed. Try again.", "error");
    } finally {
      setUploading((p) => ({ ...p, [docType]: false }));
    }
  };

  const handleExpiryOnly = async (docType: DocType) => {
    if (!selectedCar || !expiryEdits[docType]) return;
    setUploading((p) => ({ ...p, [docType]: true }));
    try {
      const fd = new FormData();
      fd.append("expiry", expiryEdits[docType]);
      await adminCarsApi.uploadDocument(selectedCar._id, docType, fd);
      showToast("Expiry date updated!");
      await refreshCar(selectedCar._id);
    } catch {
      showToast("Update failed.", "error");
    } finally {
      setUploading((p) => ({ ...p, [docType]: false }));
    }
  };

  const openSendModal = async () => {
    if (!selectedCar) return;
    setSendModal(true);
    const res = await bookingsApi.getAll({ limit: 50 });
    const carBookings = (res.data?.data || []).filter(
      (b: Booking & { carId?: { _id?: string } }) =>
        b.carId?._id === selectedCar._id || (b as any).carId === selectedCar._id
    );
    setBookings(carBookings);
  };

  const handleSend = async (booking: Booking) => {
    const hasRealMobile = booking.userId?.mobile && !String(booking.userId.mobile).startsWith("google_");
    const override = manualMobiles[booking._id];
    if (!hasRealMobile && (!override || override.length !== 10)) {
      showToast("Enter a valid 10-digit WhatsApp number first.", "error");
      return;
    }
    setSendingTo(booking._id);
    try {
      const { data } = await bookingsApi.sendCarDocs(booking._id, hasRealMobile ? undefined : override);
      if (data.failedDocs?.length > 0) {
        showToast(`Text sent but ${data.failedDocs.length} doc(s) failed: ${data.failedDocs[0].error}`, "error");
      } else {
        showToast(`Documents sent to ${booking.userId?.name || "customer"}!`);
        setSendModal(false);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Send failed. Check WhatsApp config.";
      showToast(msg, "error");
    } finally {
      setSendingTo(null);
    }
  };

  const docs = selectedCar?.documents as Record<DocType, CarDoc> | undefined;

  return (
    <div className="p-6 space-y-5 min-h-full">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all",
          toast.type === "success" ? "bg-[#10B981]" : "bg-[#EF4444]"
        )}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[#0F0F1A] font-bold text-xl font-syne">Car Documents</h1>
          <p className="text-[#9090A8] text-sm mt-0.5">Upload & manage RC, Insurance, PUC and other car documents</p>
        </div>
        {selectedCar && (
          <button
            onClick={openSendModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E8540A] text-white rounded-xl text-sm font-semibold hover:bg-[#c94508] transition-colors"
          >
            <Send size={15} />
            Send to Customer
          </button>
        )}
      </div>

      {/* Car Selector */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
        <label className="block text-xs font-semibold text-[#4A4A6A] mb-2">Select Car</label>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 border border-[#E4E5EF] rounded-xl bg-[#F8F9FC] text-sm hover:border-[#E8540A] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Car size={15} className="text-[#E8540A]" />
              <span className={selectedCar ? "text-[#0F0F1A] font-medium" : "text-[#9090A8]"}>
                {selectedCar ? `${selectedCar.name} — ${selectedCar.registrationNo}` : "Choose a car..."}
              </span>
            </div>
            <ChevronDown size={15} className={cn("text-[#9090A8] transition-transform", dropdownOpen && "rotate-180")} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E4E5EF] rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
              {loadingCars ? (
                <div className="p-4 text-center text-sm text-[#9090A8]">Loading...</div>
              ) : cars.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#9090A8]">No cars found</div>
              ) : cars.map((car) => (
                <button
                  key={car._id}
                  onClick={() => handleSelectCar(car)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-[#F8F9FC] transition-colors text-left border-b border-[#E4E5EF] last:border-0",
                    selectedCar?._id === car._id && "bg-[#FFF3ED]"
                  )}
                >
                  <span className="font-medium text-[#0F0F1A]">{car.name}</span>
                  <span className="text-[#9090A8] text-xs">{car.registrationNo}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* No car selected */}
      {!selectedCar && (
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F8F9FC] flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-[#9090A8]" />
          </div>
          <p className="text-[#0F0F1A] font-semibold">Select a car above</p>
          <p className="text-[#9090A8] text-sm mt-1">to manage its documents</p>
        </div>
      )}

      {/* Document Cards */}
      {selectedCar && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DOC_TYPES.map(({ key, label, color }) => {
            const doc = docs?.[key];
            const status = docStatus(doc);
            const isUploading = uploading[key];
            const expiry = doc?.expiry ? new Date(doc.expiry).toISOString().split("T")[0] : "";
            const daysLeft = doc?.expiry
              ? Math.ceil((new Date(doc.expiry).getTime() - Date.now()) / 86400000)
              : null;

            return (
              <div key={`${selectedCar._id}-${key}`} className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-4">
                {/* Title */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${color}18` }}
                    >
                      <FileText size={15} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F0F1A]">{label}</p>
                      {daysLeft !== null && (
                        <p className={cn("text-[10px]", daysLeft < 0 ? "text-[#EF4444]" : daysLeft <= 30 ? "text-[#F59E0B]" : "text-[#10B981]")}>
                          {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                        </p>
                      )}
                    </div>
                  </div>
                  {statusBadge(status)}
                </div>

                {/* Existing doc preview */}
                {doc?.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-[#F8F9FC] border border-[#E4E5EF] rounded-xl text-xs font-medium text-[#0F0F1A] hover:border-[#E8540A] transition-colors"
                  >
                    <ExternalLink size={12} className="text-[#E8540A]" />
                    View Current Document
                  </a>
                )}

                {/* Upload */}
                <div className="space-y-2">
                  <input
                    ref={(el) => { fileRefs.current[key] = el; }}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    id={`file-${key}`}
                    onChange={() => { }}
                  />
                  <label
                    htmlFor={`file-${key}`}
                    className="flex items-center gap-2 w-full px-3 py-2.5 border-2 border-dashed border-[#E4E5EF] rounded-xl text-xs text-[#9090A8] hover:border-[#E8540A] hover:text-[#E8540A] cursor-pointer transition-colors justify-center"
                  >
                    <Upload size={13} />
                    {doc?.url ? "Replace document" : "Upload document"} (PDF / Image)
                  </label>

                  {/* Expiry date */}
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      defaultValue={expiry}
                      onChange={(e) => setExpiryEdits((p) => ({ ...p, [key]: e.target.value }))}
                      className="flex-1 text-xs px-3 py-2 border border-[#E4E5EF] rounded-xl focus:outline-none focus:border-[#E8540A] bg-[#F8F9FC]"
                    />
                    <button
                      onClick={() => handleExpiryOnly(key)}
                      disabled={!expiryEdits[key] || isUploading}
                      className="px-3 py-2 text-xs bg-[#F8F9FC] border border-[#E4E5EF] rounded-xl hover:border-[#E8540A] disabled:opacity-40 transition-colors"
                    >
                      Save Date
                    </button>
                  </div>

                  <button
                    onClick={() => handleUpload(key)}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors"
                    style={{ background: isUploading ? "#c4c4c4" : color }}
                  >
                    {isUploading ? (
                      <><Loader2 size={13} className="animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload size={13} /> Upload {label}</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Send to Customer Modal */}
      {sendModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-[#E4E5EF] flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#0F0F1A] text-sm">Send Car Documents</h2>
                <p className="text-[#9090A8] text-xs mt-0.5">Select the customer booking to send docs via WhatsApp</p>
              </div>
              <button onClick={() => setSendModal(false)} className="text-[#9090A8] hover:text-[#EF4444]">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {bookings.length === 0 ? (
                <p className="text-center text-sm text-[#9090A8] py-8">No bookings found for this car</p>
              ) : bookings.map((b) => {
                const hasRealMobile = b.userId?.mobile && !String(b.userId.mobile).startsWith("google_");
                return (
                  <div key={b._id} className="p-3 border border-[#E4E5EF] rounded-xl hover:bg-[#F8F9FC]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#0F0F1A]">{b.userId?.name || "Unknown"}</p>
                        <p className="text-xs text-[#9090A8]">{b.bookingId} · {hasRealMobile ? b.userId?.mobile : "No mobile"}</p>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block",
                          b.status === "confirmed" ? "bg-[#3B82F6]/10 text-[#3B82F6]" :
                            b.status === "active" ? "bg-[#10B981]/10 text-[#10B981]" :
                              "bg-[#9090A8]/10 text-[#9090A8]"
                        )}>
                          {b.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSend(b)}
                        disabled={!!sendingTo}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#E8540A] text-white rounded-xl text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#c94508] transition-colors"
                      >
                        {sendingTo === b._id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Send
                      </button>
                    </div>
                    {!hasRealMobile && (
                      <div className="mt-2">
                        <p className="text-[10px] text-[#F59E0B] mb-1.5">
                          ⚠ Google login — enter customer WhatsApp number
                        </p>
                        <div className="flex gap-1.5 items-center">
                          <span className="text-[11px] font-semibold text-[#4A4A6A]">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="10-digit number"
                            value={manualMobiles[b._id] || ""}
                            onChange={(e) => setManualMobiles((p) => ({ ...p, [b._id]: e.target.value.replace(/\D/g, "") }))}
                            className="flex-1 border border-[#E4E5EF] focus:border-[#E8540A] rounded-lg px-2 py-1 text-xs text-[#0F0F1A] outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
