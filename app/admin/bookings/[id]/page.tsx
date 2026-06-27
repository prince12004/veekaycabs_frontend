"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { bookingsApi } from "@/lib/api";
import {
  ArrowLeft, Phone, FileText, Car, User, Calendar, IndianRupee,
  Video, Upload, CheckCircle, XCircle, Clock,
  MessageSquare, RefreshCw, Camera, ChevronDown, ChevronUp,
  Printer, Shield, Fuel, Gauge, Send, X as XIcon, FileCheck, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CAR_DOCUMENTS = [
  { key: "rc", label: "RC (Registration Certificate)", available: true },
  { key: "insurance", label: "Insurance", available: true },
  { key: "puc", label: "PUC Certificate", available: true },
  { key: "fitness", label: "Fitness Certificate", available: false },
] as const;

const fmtDT = (d: string) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const fmtMode = (m: string) =>
  m === "online" ? "Online" : m === "offline_cash" ? "Offline Cash" : m === "offline_qr" ? "UPI/QR" : m;

export default function BookingDetailPage() {
  const params = useParams();
  const id = String(params.id);

  // All hooks must be declared before any early returns
  const [rawBooking, setRawBooking] = useState<Record<string, any> | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "vehicle" | "documents" | "payment" | "timeline">("overview");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [carReceived, setCarReceived] = useState(false);
  const [carReturned, setCarReturned] = useState(false);
  const [pickupVideos, setPickupVideos] = useState<File[]>([]);
  const [returnVideos, setReturnVideos] = useState<File[]>([]);
  const [pickupVideosSaved, setPickupVideosSaved] = useState(false);
  const [returnVideosSaved, setReturnVideosSaved] = useState(false);
  const [showPickupChecklist, setShowPickupChecklist] = useState(false);
  const [showReturnChecklist, setShowReturnChecklist] = useState(false);
  const [pickupCondition, setPickupCondition] = useState({ fuel: "", odometer: "", challan: false, damage: "", extras: "", tyres: "Good", ac: true, documents: true });
  const [returnCondition, setReturnCondition] = useState({ fuel: "", odometer: "", challan: false, damage: "", extras: "", tyres: "", ac: true, documents: true });
  const [refundInitiated, setRefundInitiated] = useState(false);
  const [sentDocs, setSentDocs] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ startTime: "", endTime: "", totalAmount: "", amountPaid: "", paymentMode: "online", notes: "" });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    bookingsApi.getById(id)
      .then(({ data }) => {
        const b = data.data;
        setRawBooking(b);
        setCarReceived(b?.odometerStart != null);
        setCarReturned(b?.odometerEnd != null);
        if (b?.odometerStart) setPickupCondition(p => ({ ...p, odometer: String(b.odometerStart) }));
      })
      .catch(() => setRawBooking(null))
      .finally(() => setLoadingPage(false));
  }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!rawBooking) return;
    setUpdatingStatus(true);
    try {
      const { data } = await bookingsApi.updateStatus(rawBooking._id, { status });
      setRawBooking(data.data);
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openEditModal = () => {
    if (!rawBooking) return;
    const toLocal = (iso: string) => {
      const d = new Date(iso);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };
    setEditForm({
      startTime:   toLocal(rawBooking.startTime),
      endTime:     toLocal(rawBooking.endTime),
      totalAmount: String(rawBooking.totalAmount || ""),
      amountPaid:  String(rawBooking.amountPaid  || ""),
      paymentMode: rawBooking.paymentMode || "online",
      notes:       rawBooking.challanDetails || "",
    });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!rawBooking) return;
    setEditLoading(true);
    try {
      const { data } = await bookingsApi.update(rawBooking._id, {
        startTime:   editForm.startTime  ? new Date(editForm.startTime).toISOString()  : undefined,
        endTime:     editForm.endTime    ? new Date(editForm.endTime).toISOString()    : undefined,
        totalAmount: editForm.totalAmount ? Number(editForm.totalAmount) : undefined,
        amountPaid:  editForm.amountPaid  ? Number(editForm.amountPaid)  : undefined,
        paymentMode: editForm.paymentMode,
        notes:       editForm.notes,
      });
      setRawBooking(data.data);
      setShowEditModal(false);
      toast.success("Booking updated successfully");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update booking");
    } finally {
      setEditLoading(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-[#9090A8]">
        <Loader2 size={24} className="animate-spin" /> Loading booking...
      </div>
    );
  }

  if (!rawBooking) {
    return (
      <div className="p-8 text-center text-[#9090A8]">
        <p className="font-bold text-lg">Booking not found</p>
        <Link href="/admin/bookings" className="text-[#E8540A] text-sm font-semibold mt-2 inline-block">← Back to Bookings</Link>
      </div>
    );
  }

  // Map API fields to display (after hooks, after early returns)
  const booking = {
    id: rawBooking.bookingId || rawBooking._id,
    customer: {
      name: rawBooking.userId?.name || "—",
      mobile: rawBooking.userId?.mobile || "—",
      email: rawBooking.userId?.email || "—",
      kyc: rawBooking.userId?.kycStatus || "pending",
    },
    car: {
      name: rawBooking.carId?.name || "—",
      regNo: rawBooking.carId?.registrationNo || "—",
      type: rawBooking.carId?.type || "—",
      fuel: rawBooking.carId?.fuel || "—",
    },
    city: rawBooking.cityId?.name || rawBooking.pickupLocation || "—",
    start: rawBooking.startTime,
    end: rawBooking.endTime,
    bookingType: rawBooking.isOffline ? "Offline" : "Online",
    addedBy: rawBooking.isOffline ? "Offline Entry" : "Customer",
    payment: {
      total: rawBooking.totalAmount || 0,
      received: rawBooking.amountPaid || 0,
      mode: fmtMode(rawBooking.paymentMode || "online"),
      status: rawBooking.razorpayPaymentId ? "Success" : rawBooking.amountPaid > 0 ? "Partial" : "Pending",
    },
    securityDeposit: rawBooking.securityDeposit || 0,
    homeDelivery: rawBooking.doorstepCharge || 0,
    remark: rawBooking.challanDetails || "",
    status: rawBooking.status,
  };

  const sendDocument = (key: string, label: string) => {
    setSentDocs((d) => (d.includes(key) ? d : [...d, key]));
    toast.success(`${label} sent to ${booking.customer.name} via WhatsApp`);
  };

  const sendAllDocuments = () => {
    const available = CAR_DOCUMENTS.filter((d) => d.available);
    setSentDocs(available.map((d) => d.key));
    toast.success(`${available.length} document(s) sent to ${booking.customer.name} via WhatsApp`);
  };

  const removePickupVideo = (idx: number) => setPickupVideos((v) => v.filter((_, i) => i !== idx));
  const removeReturnVideo = (idx: number) => setReturnVideos((v) => v.filter((_, i) => i !== idx));

  const savePickupVideos = () => {
    setPickupVideosSaved(true);
    toast.success(`${pickupVideos.length} pickup video(s) saved`);
  };

  const saveReturnVideos = () => {
    setReturnVideosSaved(true);
    toast.success(`${returnVideos.length} return video(s) saved`);
  };

  const nights = Math.round((new Date(booking.end).getTime() - new Date(booking.start).getTime()) / (1000 * 60 * 60 * 24));
  const balance = booking.payment.total - booking.payment.received;

  const whatsappMsg = encodeURIComponent(`*Veekay Cabs — Booking Confirmation* ✅\n\nBooking ID: ${booking.id}\nCar: ${booking.car.name} (${booking.car.regNo})\nCustomer: ${booking.customer.name}\n\n*Booking Period:*\nFrom: ${new Date(booking.start).toLocaleString("en-IN")}\nTo: ${new Date(booking.end).toLocaleString("en-IN")}\n\n*Payment Summary:*\nTotal Amount: Rs. ${booking.payment.total.toLocaleString("en-IN")}\nAmount Paid: Rs. ${booking.payment.received.toLocaleString("en-IN")}\nBalance Due: Rs. ${balance.toLocaleString("en-IN")}\n\nSecurity Deposit: Rs. ${booking.securityDeposit.toLocaleString("en-IN")}\n\nThank you for choosing Veekay Cabs! 🚗\n📞 +91 99999 26867`);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "vehicle", label: "Vehicle Verification" },
    { key: "documents", label: "Car Documents" },
    { key: "payment", label: "Payment" },
    { key: "timeline", label: "Timeline" },
  ] as const;

  return (
    <>
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/bookings" className="text-[#9090A8] hover:text-[#E8540A] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-black font-syne text-xl text-[#0F0F1A]">Booking Detail</h1>
            <p className="text-[#9090A8] text-xs font-mono mt-0.5">{booking.id}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={`https://wa.me/${booking.customer.mobile}?text=${whatsappMsg}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm">
            <Phone size={14} /> WhatsApp Bill
          </a>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F0F1A] text-white font-semibold text-sm">
            <Printer size={14} /> Print
          </button>
          <button
            onClick={openEditModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm hover:border-[#E8540A]/50 hover:text-[#E8540A] transition-colors"
          >
            <FileText size={14} /> Edit Booking
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-gradient-to-r from-[#E8540A] to-[#FF6B35] rounded-2xl p-5 text-white flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Car size={24} />
          </div>
          <div>
            <p className="font-black text-lg">{booking.car.name}</p>
            <p className="text-white/80 text-sm">{booking.car.regNo} · {booking.car.type}</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-white/70 text-xs">Duration</p>
            <p className="font-bold">{nights} day{nights !== 1 ? "s" : ""}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-3 py-2">
            <p className="text-white/70 text-xs mb-1">Status</p>
            <select
              value={booking.status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className="bg-white/20 text-white font-bold text-sm rounded-lg px-2 py-0.5 border border-white/30 outline-none cursor-pointer capitalize disabled:opacity-60"
            >
              {["pending","confirmed","active","completed","cancelled"].map(s => (
                <option key={s} value={s} className="text-[#0F0F1A] bg-white capitalize">{s}</option>
              ))}
            </select>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-white/70 text-xs">Type</p>
            <p className="font-bold">{booking.bookingType}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-[#E4E5EF] p-1.5 rounded-2xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all", activeTab === t.key ? "bg-[#E8540A] text-white" : "text-[#4A4A6A] hover:bg-[#F8F9FC]")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-4">
            <h3 className="font-bold text-[#0F0F1A] flex items-center gap-2"><User size={16} className="text-[#E8540A]" /> Customer Info</h3>
            <div className="space-y-3">
              {[
                { label: "Name", value: booking.customer.name },
                { label: "Mobile", value: booking.customer.mobile },
                { label: "Email", value: booking.customer.email },
                { label: "KYC", value: booking.customer.kyc },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-[#F1F2F7]">
                  <span className="text-[#9090A8] text-sm">{label}</span>
                  <span className={cn("font-semibold text-sm", label === "KYC" ? value === "verified" ? "text-[#10B981]" : "text-[#F59E0B]" : "text-[#0F0F1A]")}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-4">
            <h3 className="font-bold text-[#0F0F1A] flex items-center gap-2"><Calendar size={16} className="text-[#E8540A]" /> Booking Period</h3>
            <div className="space-y-3">
              {[
                { label: "Start", value: new Date(booking.start).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) },
                { label: "End", value: new Date(booking.end).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) },
                { label: "Duration", value: `${nights} day${nights !== 1 ? "s" : ""}` },
                { label: "City", value: booking.city },
                { label: "Added By", value: booking.addedBy },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-[#F1F2F7]">
                  <span className="text-[#9090A8] text-sm">{label}</span>
                  <span className="font-semibold text-sm text-[#0F0F1A]">{value}</span>
                </div>
              ))}
            </div>
          </div>
          {booking.remark && (
            <div className="lg:col-span-2 bg-[#FFF3ED] border border-[#E8540A]/20 rounded-2xl p-4">
              <p className="text-xs font-bold text-[#E8540A] mb-1 flex items-center gap-1.5"><MessageSquare size={13} /> Remark</p>
              <p className="text-[#4A4A6A] text-sm">{booking.remark}</p>
            </div>
          )}
        </div>
      )}

      {/* Vehicle Verification Tab */}
      {activeTab === "vehicle" && (
        <div className="space-y-5">
          {/* Pickup Section */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
            <button onClick={() => setShowPickupChecklist(!showPickupChecklist)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F8F9FC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
                  <Car size={16} className="text-[#10B981]" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-[#0F0F1A]">Car Pickup Verification</p>
                  <p className="text-[#9090A8] text-xs">Condition check when car is handed over to customer</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-bold px-3 py-1 rounded-full", carReceived ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEF3C7] text-[#92400E]")}>
                  {carReceived ? "Completed" : "Pending"}
                </span>
                {showPickupChecklist ? <ChevronUp size={18} className="text-[#9090A8]" /> : <ChevronDown size={18} className="text-[#9090A8]" />}
              </div>
            </button>
            {showPickupChecklist && (
              <div className="border-t border-[#E4E5EF] p-6 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Fuel Level", icon: Fuel, field: "fuel" as const, placeholder: "Full / 3/4 / Half" },
                    { label: "Odometer (km)", icon: Gauge, field: "odometer" as const, placeholder: "e.g. 48200" },
                  ].map(({ label, icon: Icon, field, placeholder }) => (
                    <div key={field} className="col-span-2 sm:col-span-1">
                      <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">{label}</label>
                      <div className="relative">
                        <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                        <input value={pickupCondition[field]} onChange={e => setPickupCondition(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder}
                          className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none" />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Tyre Condition</label>
                    <select value={pickupCondition.tyres} onChange={e => setPickupCondition(p => ({ ...p, tyres: e.target.value }))}
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                      {["Good", "Fair", "Poor"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Pending Challan</label>
                    <div className="flex gap-3 mt-2">
                      {[true, false].map(v => (
                        <button key={String(v)} onClick={() => setPickupCondition(p => ({ ...p, challan: v }))}
                          className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-colors", pickupCondition.challan === v ? "bg-[#EF4444] text-white border-[#EF4444]" : "border-[#E4E5EF] text-[#4A4A6A]")}>
                          {v ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Damage Notes</label>
                    <textarea value={pickupCondition.damage} onChange={e => setPickupCondition(p => ({ ...p, damage: e.target.value }))} placeholder="Any pre-existing scratches or damage..." rows={2}
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Extra Accessories</label>
                    <textarea value={pickupCondition.extras} onChange={e => setPickupCondition(p => ({ ...p, extras: e.target.value }))} placeholder="FastTag, toolkit, umbrella, etc." rows={2}
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {[{ label: "AC Working", field: "ac" as const }, { label: "Docs Present", field: "documents" as const }].map(({ label, field }) => (
                    <button key={field} onClick={() => setPickupCondition(p => ({ ...p, [field]: !p[field] }))}
                      className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors", pickupCondition[field] ? "bg-[#D1FAE5] text-[#065F46] border-[#10B981]/30" : "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]/30")}>
                      {pickupCondition[field] ? <CheckCircle size={13} /> : <XCircle size={13} />} {label}
                    </button>
                  ))}
                </div>
                {/* Video Upload */}
                <div>
                  <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block flex items-center gap-1.5"><Video size={13} /> Handover Video Evidence</label>
                  <p className="text-xs text-[#9090A8] mb-2">Record the car from all angles right before handover — this is your proof against later damage claims.</p>
                  <label className="flex items-center gap-3 border-2 border-dashed border-[#E4E5EF] rounded-xl p-4 cursor-pointer hover:border-[#E8540A]/50 hover:bg-[#FFF3ED] transition-all">
                    <input type="file" multiple accept="video/*" className="sr-only" onChange={e => { setPickupVideos(e.target.files ? Array.from(e.target.files) : []); setPickupVideosSaved(false); }} />
                    <Camera size={20} className="text-[#9090A8]" />
                    <div>
                      <p className="text-sm font-semibold text-[#4A4A6A]">Upload handover videos</p>
                      <p className="text-xs text-[#9090A8]">MP4, MOV — multiple angles supported</p>
                    </div>
                    {pickupVideos.length > 0 && <span className="ml-auto text-xs font-bold text-[#10B981]">{pickupVideos.length} selected</span>}
                  </label>
                  {pickupVideos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {pickupVideos.map((file, idx) => (
                        <div key={idx} className="relative bg-[#0F0F1A] rounded-xl overflow-hidden aspect-video flex items-center justify-center group">
                          <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" muted />
                          <button onClick={() => removePickupVideo(idx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <XIcon size={12} />
                          </button>
                          <span className="absolute bottom-1.5 left-1.5 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded truncate max-w-[90%]">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {pickupVideos.length > 0 && (
                    <button onClick={savePickupVideos}
                      className={cn("mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors", pickupVideosSaved ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#7C3AED] text-white hover:bg-[#6D28D9]")}>
                      {pickupVideosSaved ? <CheckCircle size={15} /> : <Upload size={15} />}
                      {pickupVideosSaved ? `${pickupVideos.length} video(s) saved` : "Save Handover Videos"}
                    </button>
                  )}
                </div>
                <button onClick={() => { setCarReceived(true); toast.success("Car marked as handed over"); }}
                  className="flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-white font-bold text-sm">
                  <CheckCircle size={16} /> Mark Car Handed Over
                </button>
              </div>
            )}
          </div>

          {/* Return Section */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
            <button onClick={() => setShowReturnChecklist(!showReturnChecklist)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F8F9FC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] flex items-center justify-center">
                  <RefreshCw size={16} className="text-[#3B82F6]" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-[#0F0F1A]">Car Return Verification</p>
                  <p className="text-[#9090A8] text-xs">Condition check when car is returned by customer</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-bold px-3 py-1 rounded-full", carReturned ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#F1F2F7] text-[#9090A8]")}>
                  {carReturned ? "Completed" : "Not Returned Yet"}
                </span>
                {showReturnChecklist ? <ChevronUp size={18} className="text-[#9090A8]" /> : <ChevronDown size={18} className="text-[#9090A8]" />}
              </div>
            </button>
            {showReturnChecklist && (
              <div className="border-t border-[#E4E5EF] p-6 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Fuel Level on Return</label>
                    <input value={returnCondition.fuel} onChange={e => setReturnCondition(p => ({ ...p, fuel: e.target.value }))} placeholder="e.g., Half"
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Odometer on Return</label>
                    <input value={returnCondition.odometer} onChange={e => setReturnCondition(p => ({ ...p, odometer: e.target.value }))} placeholder="e.g. 48900"
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">New Challan Received</label>
                    <div className="flex gap-3 mt-2">
                      {[true, false].map(v => (
                        <button key={String(v)} onClick={() => setReturnCondition(p => ({ ...p, challan: v }))}
                          className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-colors", returnCondition.challan === v ? "bg-[#EF4444] text-white border-[#EF4444]" : "border-[#E4E5EF] text-[#4A4A6A]")}>
                          {v ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Damage on Return</label>
                    <textarea value={returnCondition.damage} onChange={e => setReturnCondition(p => ({ ...p, damage: e.target.value }))} placeholder="Any new damage found on return..." rows={2}
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Extra Charges</label>
                    <textarea value={returnCondition.extras} onChange={e => setReturnCondition(p => ({ ...p, extras: e.target.value }))} placeholder="Extra KM charges, cleaning, fuel deficit..." rows={2}
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block flex items-center gap-1.5"><Video size={13} /> Return Video Evidence</label>
                  <p className="text-xs text-[#9090A8] mb-2">Capture the car from all angles on return — compare against the handover video for any new dents or damage.</p>
                  <label className="flex items-center gap-3 border-2 border-dashed border-[#E4E5EF] rounded-xl p-4 cursor-pointer hover:border-[#E8540A]/50 hover:bg-[#FFF3ED] transition-all">
                    <input type="file" multiple accept="video/*" className="sr-only" onChange={e => { setReturnVideos(e.target.files ? Array.from(e.target.files) : []); setReturnVideosSaved(false); }} />
                    <Upload size={20} className="text-[#9090A8]" />
                    <div>
                      <p className="text-sm font-semibold text-[#4A4A6A]">Upload return videos</p>
                      <p className="text-xs text-[#9090A8]">MP4, MOV — multiple angles supported</p>
                    </div>
                    {returnVideos.length > 0 && <span className="ml-auto text-xs font-bold text-[#10B981]">{returnVideos.length} selected</span>}
                  </label>
                  {returnVideos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {returnVideos.map((file, idx) => (
                        <div key={idx} className="relative bg-[#0F0F1A] rounded-xl overflow-hidden aspect-video flex items-center justify-center group">
                          <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" muted />
                          <button onClick={() => removeReturnVideo(idx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <XIcon size={12} />
                          </button>
                          <span className="absolute bottom-1.5 left-1.5 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded truncate max-w-[90%]">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {returnVideos.length > 0 && (
                    <button onClick={saveReturnVideos}
                      className={cn("mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors", returnVideosSaved ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#7C3AED] text-white hover:bg-[#6D28D9]")}>
                      {returnVideosSaved ? <CheckCircle size={15} /> : <Upload size={15} />}
                      {returnVideosSaved ? `${returnVideos.length} video(s) saved` : "Save Return Videos"}
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setCarReturned(true); toast.success("Car marked as returned"); }}
                    className="flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-white font-bold text-sm">
                    <CheckCircle size={16} /> Mark Car Returned
                  </button>
                  {carReturned && !refundInitiated && (
                    <button onClick={() => setRefundInitiated(true)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EDE9FE] text-[#7C3AED] font-bold text-sm hover:bg-[#7C3AED] hover:text-white transition-colors">
                      <RefreshCw size={16} /> Initiate Deposit Refund
                    </button>
                  )}
                  {refundInitiated && (
                    <span className="flex items-center gap-2 px-4 py-3 bg-[#D1FAE5] text-[#065F46] rounded-xl text-sm font-bold">
                      <CheckCircle size={15} /> Refund Initiated
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-[#0F0F1A] flex items-center gap-2"><FileCheck size={16} className="text-[#E8540A]" /> Car Documents</h3>
              <p className="text-[#9090A8] text-xs mt-1">Send the booked car&apos;s documents to {booking.customer.name} the moment they book.</p>
            </div>
            <button onClick={sendAllDocuments}
              className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm">
              <Send size={14} /> Send All to Customer
            </button>
          </div>

          <div className="space-y-3">
            {CAR_DOCUMENTS.map((doc) => {
              const sent = sentDocs.includes(doc.key);
              return (
                <div key={doc.key} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#E4E5EF]">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", doc.available ? "bg-[#FFF3ED]" : "bg-[#F1F2F7]")}>
                      <FileText size={16} className={doc.available ? "text-[#E8540A]" : "text-[#9090A8]"} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#0F0F1A]">{doc.label}</p>
                      <p className={cn("text-xs", doc.available ? "text-[#10B981]" : "text-[#9090A8]")}>
                        {doc.available ? "Available on file" : "Not uploaded yet"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sent && (
                      <span className="flex items-center gap-1 text-[#10B981] text-xs font-bold">
                        <CheckCircle size={13} /> Sent
                      </span>
                    )}
                    <button
                      disabled={!doc.available}
                      onClick={() => sendDocument(doc.key, doc.label)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors",
                        !doc.available
                          ? "bg-[#F1F2F7] text-[#D1D5DB] cursor-not-allowed"
                          : sent
                            ? "bg-[#F8F9FC] text-[#4A4A6A] hover:bg-[#FFF3ED] hover:text-[#E8540A]"
                            : "bg-[#FFF3ED] text-[#E8540A] hover:bg-[#E8540A] hover:text-white"
                      )}
                    >
                      <Send size={12} /> {sent ? "Resend" : "Send to Customer"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === "payment" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h3 className="font-bold text-[#0F0F1A] flex items-center gap-2 mb-4"><IndianRupee size={16} className="text-[#E8540A]" /> Payment Summary</h3>
            <div className="space-y-3">
              {[
                { label: "Booking Amount", value: `Rs. ${booking.payment.total.toLocaleString("en-IN")}`, color: "text-[#0F0F1A]" },
                { label: "Amount Received", value: `Rs. ${booking.payment.received.toLocaleString("en-IN")}`, color: "text-[#10B981]" },
                { label: "Balance Due", value: `Rs. ${balance.toLocaleString("en-IN")}`, color: balance > 0 ? "text-[#EF4444]" : "text-[#10B981]" },
                { label: "Security Deposit", value: `Rs. ${booking.securityDeposit.toLocaleString("en-IN")}`, color: "text-[#F59E0B]" },
                { label: "Home Delivery", value: `Rs. ${booking.homeDelivery.toLocaleString("en-IN")}`, color: "text-[#4A4A6A]" },
                { label: "Payment Mode", value: booking.payment.mode, color: "text-[#4A4A6A]" },
                { label: "Payment Status", value: booking.payment.status, color: booking.payment.status === "Success" ? "text-[#10B981]" : "text-[#EF4444]" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-[#F1F2F7]">
                  <span className="text-[#9090A8] text-sm">{label}</span>
                  <span className={cn("font-bold text-sm", color)}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h3 className="font-bold text-[#0F0F1A] flex items-center gap-2 mb-4"><Shield size={16} className="text-[#E8540A]" /> Quick Actions</h3>
            <div className="space-y-3">
              <a href={`https://wa.me/${booking.customer.mobile}?text=${whatsappMsg}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl bg-[#F0FDF4] border border-[#10B981]/20 hover:bg-[#D1FAE5] transition-colors">
                <Phone size={18} className="text-[#10B981]" />
                <div>
                  <p className="font-semibold text-sm text-[#0F0F1A]">Send WhatsApp Bill</p>
                  <p className="text-xs text-[#9090A8]">Send booking summary & bill to customer</p>
                </div>
              </a>
              <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#EDE9FE] border border-[#7C3AED]/20 hover:bg-[#DDD6FE] transition-colors text-left">
                <IndianRupee size={18} className="text-[#7C3AED]" />
                <div>
                  <p className="font-semibold text-sm text-[#0F0F1A]">Create Payment Link</p>
                  <p className="text-xs text-[#9090A8]">Generate Razorpay link for balance amount</p>
                </div>
              </button>
              <button onClick={() => window.print()} className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#F8F9FC] border border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors text-left">
                <Printer size={18} className="text-[#4A4A6A]" />
                <div>
                  <p className="font-semibold text-sm text-[#0F0F1A]">Print Invoice</p>
                  <p className="text-xs text-[#9090A8]">Print full booking invoice</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6">
          <h3 className="font-bold text-[#0F0F1A] mb-5">Booking Timeline</h3>
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-[#E4E5EF]" />
            <div className="space-y-6">
              {[
                { time: rawBooking.createdAt, event: "Booking Created", by: booking.bookingType, color: "#10B981" },
                ...(rawBooking.amountPaid > 0 ? [{ time: rawBooking.updatedAt, event: `Payment Received — Rs. ${rawBooking.amountPaid?.toLocaleString("en-IN")}`, by: fmtMode(rawBooking.paymentMode), color: "#10B981" }] : []),
                ...(rawBooking.status === "confirmed" ? [{ time: rawBooking.updatedAt, event: "Booking Confirmed", by: "Admin", color: "#3B82F6" }] : []),
                ...(rawBooking.status === "active" ? [{ time: rawBooking.updatedAt, event: "Car Handed Over — Trip Active", by: "Admin", color: "#F59E0B" }] : []),
                ...(rawBooking.status === "completed" ? [{ time: rawBooking.updatedAt, event: "Trip Completed — Car Returned", by: "Admin", color: "#9090A8" }] : []),
                ...(rawBooking.status === "cancelled" ? [{ time: rawBooking.cancelledAt || rawBooking.updatedAt, event: "Booking Cancelled", by: "System", color: "#EF4444" }] : []),
              ].map((item, i) => (
                <div key={i} className="relative flex gap-4">
                  <div className="absolute -left-4 w-3 h-3 rounded-full border-2 border-white shadow" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="font-semibold text-sm text-[#0F0F1A]">{item.event}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={11} className="text-[#9090A8]" />
                      <p className="text-xs text-[#9090A8]">{fmtDT(item.time)}</p>
                      <span className="text-xs text-[#4A4A6A] font-medium">by {item.by}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!carReceived && (
                <div className="relative flex gap-4">
                  <div className="absolute -left-4 w-3 h-3 rounded-full border-2 border-[#E4E5EF] bg-white" />
                  <div>
                    <p className="font-semibold text-sm text-[#9090A8]">Car Received by Customer</p>
                    <p className="text-xs text-[#9090A8] mt-0.5">Pending — complete Vehicle Verification tab</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

      {/* ── Edit Booking Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl my-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">Edit Booking</h3>
                <p className="text-[#9090A8] text-xs mt-0.5">#{rawBooking?.bookingId || rawBooking?._id?.slice(-8)}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-[#9090A8] hover:text-[#0F0F1A] transition-colors">
                <XIcon size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Pickup Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editForm.startTime}
                    onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Return Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editForm.endTime}
                    onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Total Amount (Rs.)</label>
                  <input
                    type="number"
                    value={editForm.totalAmount}
                    onChange={e => setEditForm(f => ({ ...f, totalAmount: e.target.value }))}
                    className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Amount Paid (Rs.)</label>
                  <input
                    type="number"
                    value={editForm.amountPaid}
                    onChange={e => setEditForm(f => ({ ...f, amountPaid: e.target.value }))}
                    className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Payment Mode</label>
                <select
                  value={editForm.paymentMode}
                  onChange={e => setEditForm(f => ({ ...f, paymentMode: e.target.value }))}
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="online">Online / Razorpay</option>
                  <option value="offline_cash">Cash</option>
                  <option value="offline_qr">UPI / QR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Remarks / Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  placeholder="Internal notes or challan details..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                className="flex-1 py-2.5 rounded-xl btn-gradient text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editLoading && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
