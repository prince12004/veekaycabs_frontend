"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { bookingsApi, settingsApi } from "@/lib/api";
import { downloadInvoicePdf, generateInvoiceBlob } from "@/lib/invoicePdf";
import { downloadClosingBillPdf, generateClosingBillBlob } from "@/lib/closingBillPdf";
import type { ClosingBillData } from "@/components/admin/ClosingBillDocument";
import {
  ArrowLeft, Phone, FileText, Car, User, Calendar, IndianRupee,
  Video, Upload, CheckCircle, XCircle, Clock,
  MessageSquare, RefreshCw, Camera, ChevronDown, ChevronUp,
  Printer, Shield, Fuel, Gauge, Send, X as XIcon, FileCheck, Loader2,
  MapPin, Truck, AlertTriangle, Eye, Image as ImageIcon, Zap,
  ScanSearch, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MediaRecord { _id: string; type: string; urls: string[]; notes: string; uploadedAt: string; }
interface UserDoc { aadhaar?: any; pan?: any; dl?: any; }
interface Prediction { x: number; y: number; width: number; height: number; confidence: number; class: string; }
interface DamageAnalysisSet {
  thumbnails: string[];
  predictions: Prediction[];
  damageLabels: string[];
  score: number;
  damage: boolean;
  imageWidth: number;
  imageHeight: number;
}
interface DamageReport {
  pickup: DamageAnalysisSet;
  return: DamageAnalysisSet;
  newDamageDetected: boolean;
  verdict: string;
  analyzedAt: string;
  apiUsed: string;
}
interface DentDamage { location: string; type: string; severity: string; description: string; }
interface PartCheck {
  part: string;
  pickupStatus: "ok" | "minor_mark" | "damaged" | "not_visible";
  returnStatus: "ok" | "minor_mark" | "damaged" | "not_visible";
  newDamage: boolean;
  lowConfidence: boolean;
  note: string;
}
interface DentDetectionResult {
  newDamageFound: boolean;
  damageCount: number;
  damages: DentDamage[];
  partsChecked?: PartCheck[];
  summary: string;
  confidenceNote: string;
  analyzedAt: string;
  model: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDT = (d: string) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

// Matches the server's per-request multer limit (routes/admin/bookings.js
// `.array('files', 10)`) — pickup and return are separate upload requests,
// so each stage gets up to 10 files of its own.
const MAX_MEDIA_FILES = 10;

const humanizePart = (part: string) =>
  part.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

const PART_STATUS_STYLE: Record<PartCheck["pickupStatus"], string> = {
  ok: "bg-[#D1FAE5] text-[#065F46]",
  minor_mark: "bg-[#FEF3C7] text-[#92400E]",
  damaged: "bg-[#FEE2E2] text-[#991B1B]",
  not_visible: "bg-[#F1F2F7] text-[#9090A8]",
};

const fmtMode = (m: string) =>
  m === "online" ? "Online" : m === "offline_cash" ? "Offline Cash" : m === "offline_qr" ? "UPI/QR" : m;

const DOC_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  not_uploaded: { label: "Not Uploaded", color: "text-[#9090A8]" },
  pending:      { label: "Pending Review", color: "text-[#F59E0B]" },
  verified:     { label: "Verified", color: "text-[#10B981]" },
  rejected:     { label: "Rejected", color: "text-[#EF4444]" },
  mismatch:     { label: "Mismatch", color: "text-[#EF4444]" },
  expired:      { label: "Expired", color: "text-[#EF4444]" },
};

export default function BookingDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const [rawBooking, setRawBooking] = useState<Record<string, any> | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "vehicle" | "userdocs" | "cardocs" | "payment" | "timeline">("overview");

  // Vehicle verification
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [carReceived, setCarReceived] = useState(false);
  const [carReturned, setCarReturned] = useState(false);
  const [pickupCondition, setPickupCondition] = useState<Record<string, any>>({ fuel: 100, odometer: "", challan: false, damage: "", extras: "", tyres: "Good", ac: true, documents: true });
  const [returnCondition, setReturnCondition] = useState<Record<string, any>>({ fuel: 100, odometer: "", challan: false, damage: "", extras: "", tyres: "", ac: true, documents: true });
  const [savingVerification, setSavingVerification] = useState(false);
  const [showPickupChecklist, setShowPickupChecklist] = useState(false);
  const [showReturnChecklist, setShowReturnChecklist] = useState(false);

  // Close booking / final settlement bill
  const [closeBillModalOpen, setCloseBillModalOpen] = useState(false);
  const [closingForm, setClosingForm] = useState({
    startingMeter: "", closingMeter: "", kmsLimit: "", extraKmRate: "",
    actualReturnTime: "", lateHourRate: "",
    pickupCharges: "", dropCharges: "", fastagStateTax: "", allStateChallan: "",
    overspeedingFine: "", fuelCharges: "", damageCharges: "", washingCharges: "", notes: "",
  });
  const [closingSaving, setClosingSaving] = useState(false);
  const [downloadingClosingBill, setDownloadingClosingBill] = useState(false);
  const [sendingClosingBillWhatsApp, setSendingClosingBillWhatsApp] = useState(false);
  const [markingRefundPaid, setMarkingRefundPaid] = useState(false);

  // Media upload
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);
  const [pickupFiles, setPickupFiles] = useState<File[]>([]);
  const [returnFiles, setReturnFiles] = useState<File[]>([]);
  const [pickupUploading, setPickupUploading] = useState(false);
  const [returnUploading, setReturnUploading] = useState(false);
  const [savedMedia, setSavedMedia] = useState<MediaRecord[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  // Dent analysis + comparison modal
  const [damageReport, setDamageReport] = useState<DamageReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Claude AI dent detection (Return Verification panel)
  const [dentResult, setDentResult] = useState<DentDetectionResult | null>(null);
  const [dentLoading, setDentLoading] = useState(false);
  const [dentError, setDentError] = useState<string | null>(null);
  const [showPartsChecklist, setShowPartsChecklist] = useState(false);

  // User KYC docs
  const [userDocs, setUserDocs] = useState<UserDoc | null>(null);
  const [userDocsLoading, setUserDocsLoading] = useState(false);
  const [userDocsUser, setUserDocsUser] = useState<any>(null);

  // Car documents / WhatsApp
  const [sentDocs, setSentDocs] = useState<string[]>([]);
  const [sendingAllDocs, setSendingAllDocs] = useState(false);
  const [sendingDocKey, setSendingDocKey] = useState<string | null>(null);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ startTime: "", endTime: "", totalAmount: "", amountPaid: "", paymentMode: "online", notes: "" });
  const [editLoading, setEditLoading] = useState(false);

  // Extend Booking modal
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendForm, setExtendForm] = useState({ newEndTime: "", extraAmount: "", additionalPaymentReceived: "0" });
  const [extendLoading, setExtendLoading] = useState(false);

  // Invoice PDF
  const [companySettings, setCompanySettings] = useState<Record<string, any> | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [sendingInvoiceWhatsApp, setSendingInvoiceWhatsApp] = useState(false);

  // ── Load booking ────────────────────────────────────────────────────────────
  useEffect(() => {
    bookingsApi.getById(id)
      .then(({ data }) => {
        const b = data.data;
        setRawBooking(b);
        setCarReceived(!!b?.pickupCondition?.recordedAt || b?.odometerStart != null);
        setCarReturned(!!b?.returnCondition?.recordedAt || b?.odometerEnd != null);
        if (b?.pickupCondition) {
          setPickupCondition(p => ({
            ...p, ...b.pickupCondition,
            fuel: b.pickupCondition.fuel ?? p.fuel,
            odometer: b.pickupCondition.odometer != null ? String(b.pickupCondition.odometer) : (b?.odometerStart ? String(b.odometerStart) : p.odometer),
          }));
        } else if (b?.odometerStart) {
          setPickupCondition(p => ({ ...p, odometer: String(b.odometerStart) }));
        }
        if (b?.returnCondition) {
          setReturnCondition(p => ({
            ...p, ...b.returnCondition,
            fuel: b.returnCondition.fuel ?? p.fuel,
            odometer: b.returnCondition.odometer != null ? String(b.returnCondition.odometer) : (b?.odometerEnd ? String(b.odometerEnd) : p.odometer),
          }));
        } else if (b?.odometerEnd) {
          setReturnCondition(p => ({ ...p, odometer: String(b.odometerEnd) }));
        }
        if (b?.dentDetectionResult?.analyzedAt) setDentResult(b.dentDetectionResult);
      })
      .catch(() => setRawBooking(null))
      .finally(() => setLoadingPage(false));
  }, [id]);

  // ── Load company settings (for invoice branding) ────────────────────────────
  useEffect(() => {
    settingsApi.get()
      .then(({ data }) => setCompanySettings(data.data || null))
      .catch(() => setCompanySettings(null));
  }, []);

  // ── Load saved media ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setMediaLoading(true);
    bookingsApi.getMedia(id)
      .then(({ data }) => setSavedMedia(data.data || []))
      .catch(() => {})
      .finally(() => setMediaLoading(false));
  }, [id]);

  // ── Load user docs when tab active ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "userdocs" || userDocs !== null) return;
    setUserDocsLoading(true);
    bookingsApi.getUserDocs(id)
      .then(({ data }) => {
        setUserDocs(data.data?.documents || null);
        setUserDocsUser(data.data?.user || null);
      })
      .catch(() => {})
      .finally(() => setUserDocsLoading(false));
  }, [activeTab, id]);

  // ── Handlers ────────────────────────────────────────────────────────────────
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

  const deleteMedia = async (mediaId: string, url: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      await bookingsApi.deleteMedia(id, mediaId, url);
      setSavedMedia(prev => prev.map(m =>
        m._id === mediaId ? { ...m, urls: m.urls.filter((u: string) => u !== url) } : m
      ).filter(m => m.urls.length > 0));
      toast.success("File deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const uploadMedia = async (type: "pickup" | "return") => {
    const files = type === "pickup" ? pickupFiles : returnFiles;
    if (!files.length) return;
    const setter = type === "pickup" ? setPickupUploading : setReturnUploading;
    setter(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      fd.append("type", type);
      const { data } = await bookingsApi.uploadMedia(id, fd);
      setSavedMedia((prev) => [...prev, data.data]);
      if (type === "pickup") { setPickupFiles([]); setCarReceived(true); }
      else { setReturnFiles([]); setCarReturned(true); }
      toast.success(`${files.length} ${type} file(s) uploaded to cloud`);
    } catch {
      toast.error("Upload failed. Check Cloudinary config.");
    } finally {
      setter(false);
    }
  };

  const runDamageAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data } = await bookingsApi.analyzeDamage(id);
      setDamageReport(data.data);
      toast.success("Analysis complete");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const runDentDetection = async (force = false) => {
    setDentLoading(true);
    setDentError(null);
    try {
      const { data } = await bookingsApi.runDentDetection(id, force);
      setDentResult(data.data);
    } catch (e: any) {
      setDentError(e?.response?.data?.message || "AI dent detection failed. Try again.");
    } finally {
      setDentLoading(false);
    }
  };

  const sendAllCarDocs = async () => {
    setSendingAllDocs(true);
    try {
      const { data } = await bookingsApi.sendCarDocs(id);
      if (data.failedDocs?.length > 0 && data.failedDocs.length === (data.totalDocs ?? data.failedDocs.length)) {
        toast.error("WhatsApp notification failed. Check NeoDove API.");
      } else {
        setSentDocs(["rc", "insurance", "puc", "fitness"]);
        toast.success("WhatsApp notification sent to customer!");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to send documents");
    } finally {
      setSendingAllDocs(false);
    }
  };

  const sendSingleDoc = async (key: string, label: string) => {
    setSendingDocKey(key);
    try {
      const { data } = await bookingsApi.sendCarDocs(id);
      if (data.success !== false) {
        setSentDocs((d) => (d.includes(key) ? d : [...d, key]));
        toast.success(`Notification sent for ${label}`);
      } else {
        toast.error("Failed to send");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to send");
    } finally {
      setSendingDocKey(null);
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
      toast.success("Booking updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update booking");
    } finally {
      setEditLoading(false);
    }
  };

  // Suggests the extra charge for a new end time — mirrors the server's own
  // calculation (extra hours × the car's weekend/weekday rate) so the admin
  // sees a sensible number immediately, but it's always editable before saving.
  const suggestExtendAmount = (newEndTime: string) => {
    if (!rawBooking?.carId || !newEndTime) return null;
    const newEnd = new Date(newEndTime);
    const currentEnd = new Date(rawBooking.endTime);
    if (isNaN(newEnd.getTime()) || newEnd <= currentEnd) return null;
    const extraHours = Math.ceil((newEnd.getTime() - currentEnd.getTime()) / (1000 * 60 * 60));
    const isWeekend = [0, 6].includes(currentEnd.getDay());
    const rate = isWeekend ? rawBooking.carId.weekendPrice : rawBooking.carId.regularPrice;
    return { extraHours, extraAmount: extraHours * (rate || 0) };
  };

  const openExtendModal = () => {
    if (!rawBooking) return;
    const toLocal = (d: Date) => {
      const copy = new Date(d);
      copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
      return copy.toISOString().slice(0, 16);
    };
    // Default to 1 day past the current return time — just a starting point.
    const defaultNewEnd = new Date(new Date(rawBooking.endTime).getTime() + 24 * 60 * 60 * 1000);
    const defaultNewEndStr = toLocal(defaultNewEnd);
    const suggestion = suggestExtendAmount(defaultNewEndStr);
    setExtendForm({
      newEndTime: defaultNewEndStr,
      extraAmount: suggestion ? String(suggestion.extraAmount) : "",
      additionalPaymentReceived: "0",
    });
    setShowExtendModal(true);
  };

  const handleExtendNewEndTimeChange = (value: string) => {
    const suggestion = suggestExtendAmount(value);
    setExtendForm((f) => ({ ...f, newEndTime: value, extraAmount: suggestion ? String(suggestion.extraAmount) : f.extraAmount }));
  };

  const handleExtendSave = async () => {
    if (!rawBooking || !extendForm.newEndTime) {
      toast.error("Pick the new return date & time");
      return;
    }
    setExtendLoading(true);
    try {
      const { data } = await bookingsApi.extendBooking(rawBooking._id, {
        newEndTime: new Date(extendForm.newEndTime).toISOString(),
        extraAmount: extendForm.extraAmount !== "" ? Number(extendForm.extraAmount) : undefined,
        additionalPaymentReceived: Number(extendForm.additionalPaymentReceived) || 0,
      });
      setRawBooking(data.data);
      setShowExtendModal(false);
      toast.success(data.message || "Booking extended");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to extend booking");
    } finally {
      setExtendLoading(false);
    }
  };

  // ── Loading / not-found ─────────────────────────────────────────────────────
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

  // ── Derived booking object ──────────────────────────────────────────────────
  const booking = {
    id:   rawBooking.bookingId || rawBooking._id,
    _id:  rawBooking._id,
    customer: {
      name:   rawBooking.userId?.name || "—",
      mobile: (rawBooking.userId?.mobile && !rawBooking.userId.mobile.startsWith("google_")) ? rawBooking.userId.mobile : "Google user",
      email:  rawBooking.userId?.email || "—",
      kyc:    rawBooking.userId?.kycStatus || "pending",
    },
    car: {
      name:       rawBooking.carId?.name || "—",
      regNo:      rawBooking.carId?.registrationNo || "—",
      type:       rawBooking.carId?.type || "—",
      fuel:       rawBooking.carId?.fuel || "—",
      documents:  rawBooking.carId?.documents || {},
      images:     rawBooking.carId?.images || [],
    },
    city:            rawBooking.cityId?.name || rawBooking.pickupLocation || "—",
    start:           rawBooking.startTime,
    end:             rawBooking.endTime,
    pickupLocation:  rawBooking.pickupLocation || "—",
    deliveryAddress: rawBooking.deliveryAddress || null,
    doorstep:        rawBooking.doorstepDelivery || false,
    bookingType:     rawBooking.isOffline ? "Offline" : "Online",
    payment: {
      total:    rawBooking.totalAmount   || 0,
      received: rawBooking.amountPaid    || 0,
      mode:     fmtMode(rawBooking.paymentMode || "online"),
      status:   rawBooking.razorpayPaymentId ? "Success" : rawBooking.amountPaid > 0 ? "Partial" : "Pending",
    },
    securityDeposit: rawBooking.securityDeposit || 0,
    homeDelivery:    rawBooking.doorstepCharge || 0,
    remark:          rawBooking.challanDetails || "",
    status:          rawBooking.status,
  };

  const nights  = Math.round((new Date(booking.end).getTime() - new Date(booking.start).getTime()) / (1000 * 60 * 60 * 24));
  const balance = booking.payment.total - booking.payment.received;

  const buildInvoiceData = () => ({
    bookingId: booking.id,
    invoiceNo: `INV-${String(booking.id).replace(/\W/g, "").slice(-8).toUpperCase()}`,
    invoiceDate: new Date().toISOString(),
    status: booking.status,
    customer: booking.customer,
    car: booking.car,
    start: booking.start,
    end: booking.end,
    nights,
    bookingType: booking.bookingType,
    doorstep: booking.doorstep,
    pickupLocation: booking.pickupLocation,
    deliveryAddress: booking.deliveryAddress,
    payment: {
      bookingFare: rawBooking.bookingFare ?? 0,
      gst: rawBooking.gst ?? 0,
      discount: rawBooking.discount ?? 0,
      doorstepCharge: rawBooking.doorstepCharge ?? 0,
      extraKmCharge: rawBooking.extraKmCharge ?? 0,
      securityDeposit: rawBooking.securityDeposit ?? 0,
      totalAmount: rawBooking.totalAmount ?? 0,
      amountPaid: rawBooking.amountPaid ?? 0,
      // Always derive from the totalAmount/amountPaid shown on this same
      // invoice — never trust the separately-stored balanceDue field, which
      // can go stale relative to them (e.g. after a later edit) and produce
      // an invoice whose own numbers don't add up.
      balanceDue: (rawBooking.totalAmount ?? 0) - (rawBooking.amountPaid ?? 0),
      mode: booking.payment.mode,
      status: booking.payment.status,
    },
    company: {
      companyName: companySettings?.companyName || "Veekay Cabs",
      tagline: companySettings?.tagline,
      gstNumber: companySettings?.gstNumber,
      phone1: companySettings?.phone1 || "+91 99999 26867",
      phone2: companySettings?.phone2,
      email: companySettings?.email || "sales@veekaycabs.com",
      website: companySettings?.website || "https://veekaycabs.com",
      addressDelhi: companySettings?.addressDelhi || "A 13, 1st Floor, Ganesh Nagar, New Delhi 110092",
    },
  });

  const handleDownloadInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      await downloadInvoicePdf(buildInvoiceData());
      toast.success("Invoice PDF downloaded");
    } catch {
      toast.error("Failed to generate invoice PDF");
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleSendInvoiceWhatsApp = async () => {
    if (!rawBooking) return;
    setSendingInvoiceWhatsApp(true);
    try {
      const blob = await generateInvoiceBlob(buildInvoiceData());
      await bookingsApi.sendInvoiceWhatsApp(rawBooking._id, blob);
      toast.success("Invoice sent to customer via WhatsApp!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send invoice via WhatsApp");
    } finally {
      setSendingInvoiceWhatsApp(false);
    }
  };

  // ── Close Booking / Final Settlement Bill ───────────────────────────────────
  const closingBill = rawBooking.closingBill;
  const isClosed = !!closingBill?.closedAt;

  const openCloseBillModal = () => {
    const carKmPackage = rawBooking.carId?.kmPackage as string | undefined;
    const perDayKm = carKmPackage ? parseInt(carKmPackage, 10) || 0 : 0;
    const defaultLimit = perDayKm ? perDayKm * Math.max(nights, 1) : "";
    // Always prefer the latest live odometer reading (return verification may
    // have been corrected after the bill was first closed) over whatever was
    // typed into the form at the time of the original close.
    const defaultClosingMeter = returnCondition.odometer || rawBooking.odometerEnd || "";
    // Pulled from the car's own profile (set when adding/editing the car) —
    // admin can still override per-closure below.
    const carExtraKmRate = rawBooking.carId?.extraKmRate;
    // Actual return time defaults to when "Mark Car Returned" was recorded,
    // falling back to now — admin can correct it if the car physically came
    // back at a different time than when this was processed in the system.
    const toLocal = (d: Date) => {
      const copy = new Date(d);
      copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
      return copy.toISOString().slice(0, 16);
    };
    const defaultReturnTime = rawBooking.returnCondition?.recordedAt
      ? toLocal(new Date(rawBooking.returnCondition.recordedAt))
      : toLocal(new Date());
    // Hourly rental rate for this car doubles as the default late-hour rate.
    const carHourlyRate = rawBooking.carId?.regularPrice;

    // Recalculating an already-closed bill — re-fill the manually-entered
    // fields (charges, notes, rates) from what was saved last time instead of
    // blanking them out, since those aren't derivable from live booking data.
    const prev = closingBill;
    setClosingForm({
      startingMeter: rawBooking.odometerStart != null ? String(rawBooking.odometerStart) : "",
      closingMeter: String(defaultClosingMeter),
      kmsLimit: prev?.kmsLimit ? String(prev.kmsLimit) : (defaultLimit ? String(defaultLimit) : ""),
      extraKmRate: prev?.extraKmRate ? String(prev.extraKmRate) : (carExtraKmRate ? String(carExtraKmRate) : ""),
      actualReturnTime: prev?.actualReturnTime ? toLocal(new Date(prev.actualReturnTime)) : defaultReturnTime,
      lateHourRate: prev?.lateHourRate ? String(prev.lateHourRate) : (carHourlyRate ? String(carHourlyRate) : ""),
      pickupCharges: prev?.pickupCharges ? String(prev.pickupCharges) : "",
      dropCharges: prev?.dropCharges ? String(prev.dropCharges) : "",
      fastagStateTax: prev?.fastagStateTax ? String(prev.fastagStateTax) : "",
      allStateChallan: prev?.allStateChallan ? String(prev.allStateChallan) : "",
      overspeedingFine: prev?.overspeedingFine ? String(prev.overspeedingFine) : "",
      fuelCharges: prev?.fuelCharges ? String(prev.fuelCharges) : "",
      damageCharges: prev?.damageCharges ? String(prev.damageCharges) : "",
      washingCharges: prev?.washingCharges ? String(prev.washingCharges) : "",
      notes: prev?.notes || "",
    });
    setCloseBillModalOpen(true);
  };

  const handleCloseBooking = async () => {
    if (!rawBooking) return;
    if (rawBooking.odometerStart == null && !closingForm.startingMeter) {
      toast.error("Enter the starting (pickup) meter reading — it was never recorded for this booking");
      return;
    }
    if (!closingForm.closingMeter) {
      toast.error("Enter the closing meter reading");
      return;
    }
    const wasAlreadyClosed = isClosed;
    setClosingSaving(true);
    try {
      const { data } = await bookingsApi.closeBooking(rawBooking._id, closingForm);
      setRawBooking(data.data);
      setCloseBillModalOpen(false);
      const settlement = data.data?.closingBill?.settlementAmount ?? 0;
      const verb = wasAlreadyClosed ? "recalculated" : "closed";
      toast.success(
        settlement > 0 ? `Booking ${verb} — Rs. ${settlement.toLocaleString("en-IN")} due from customer`
          : settlement < 0 ? `Booking ${verb} — Rs. ${Math.abs(settlement).toLocaleString("en-IN")} refund due`
            : `Booking ${verb} — fully settled`
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to close booking");
    } finally {
      setClosingSaving(false);
    }
  };

  const buildClosingBillData = (): ClosingBillData => ({
    bookingId: booking.id,
    billNo: `BILL-${String(booking.id).replace(/\W/g, "").slice(-8).toUpperCase()}`,
    billDate: closingBill?.closedAt || new Date().toISOString(),
    customer: booking.customer,
    car: booking.car,
    start: booking.start,
    end: booking.end,
    nights,
    meter: {
      startingMeter: rawBooking.odometerStart || 0,
      closingMeter: rawBooking.odometerEnd || 0,
      totalKms: closingBill?.totalKms || 0,
      kmsLimit: closingBill?.kmsLimit || 0,
      extraKms: closingBill?.extraKms || 0,
      extraKmRate: closingBill?.extraKmRate || 0,
      extraKmCharge: rawBooking.extraKmCharge || 0,
    },
    lateReturn: {
      actualReturnTime: closingBill?.actualReturnTime || "",
      lateHours: closingBill?.lateHours || 0,
      lateHourRate: closingBill?.lateHourRate || 0,
      lateCharges: closingBill?.lateCharges || 0,
    },
    charges: {
      bookingFare: rawBooking.bookingFare ?? 0,
      gst: rawBooking.gst ?? 0,
      discount: rawBooking.discount ?? 0,
      doorstepCharge: rawBooking.doorstepCharge ?? 0,
      pickupCharges: closingBill?.pickupCharges || 0,
      dropCharges: closingBill?.dropCharges || 0,
      fastagStateTax: closingBill?.fastagStateTax || 0,
      allStateChallan: closingBill?.allStateChallan || 0,
      overspeedingFine: closingBill?.overspeedingFine || 0,
      fuelCharges: closingBill?.fuelCharges || 0,
      damageCharges: closingBill?.damageCharges || 0,
      washingCharges: closingBill?.washingCharges || 0,
      totalCharges: closingBill?.totalCharges || 0,
    },
    settlement: {
      advancePaid: closingBill?.advancePaid || 0,
      settlementAmount: closingBill?.settlementAmount || 0,
    },
    notes: closingBill?.notes || "",
    company: {
      companyName: companySettings?.companyName || "Veekay Cabs",
      tagline: companySettings?.tagline,
      gstNumber: companySettings?.gstNumber,
      phone1: companySettings?.phone1 || "+91 99999 26867",
      phone2: companySettings?.phone2,
      email: companySettings?.email || "sales@veekaycabs.com",
      website: companySettings?.website || "https://veekaycabs.com",
      addressDelhi: companySettings?.addressDelhi || "A 13, 1st Floor, Ganesh Nagar, New Delhi 110092",
    },
  });

  const handleDownloadClosingBill = async () => {
    setDownloadingClosingBill(true);
    try {
      await downloadClosingBillPdf(buildClosingBillData());
      toast.success("Final bill PDF downloaded");
    } catch {
      toast.error("Failed to generate final bill PDF");
    } finally {
      setDownloadingClosingBill(false);
    }
  };

  const handleSendClosingBillWhatsApp = async () => {
    if (!rawBooking) return;
    setSendingClosingBillWhatsApp(true);
    try {
      const blob = await generateClosingBillBlob(buildClosingBillData());
      await bookingsApi.sendClosingBillWhatsApp(rawBooking._id, blob);
      toast.success("Final bill sent to customer via WhatsApp!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send final bill via WhatsApp");
    } finally {
      setSendingClosingBillWhatsApp(false);
    }
  };

  const handleMarkRefundPaid = async () => {
    if (!rawBooking) return;
    setMarkingRefundPaid(true);
    try {
      const { data } = await bookingsApi.markRefundPaid(rawBooking._id);
      setRawBooking(data.data);
      toast.success("Refund marked as paid");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update refund status");
    } finally {
      setMarkingRefundPaid(false);
    }
  };

  // Car documents list (dynamic from car data)
  const carDocsList = [
    { key: "rc",        label: "RC (Registration Certificate)", url: booking.car.documents?.rc?.url,        expiry: booking.car.documents?.rc?.expiry },
    { key: "insurance", label: "Insurance",                      url: booking.car.documents?.insurance?.url, expiry: booking.car.documents?.insurance?.expiry },
    { key: "puc",       label: "PUC Certificate",                url: booking.car.documents?.puc?.url,       expiry: booking.car.documents?.puc?.expiry },
    { key: "fitness",   label: "Fitness Certificate",            url: booking.car.documents?.fitness?.url,   expiry: booking.car.documents?.fitness?.expiry },
  ];

  const pickupSaved = savedMedia.filter((m) => m.type === "pickup_photos");
  const returnSaved = savedMedia.filter((m) => m.type === "return_photos");

  const tabs = [
    { key: "overview",  label: "Overview" },
    { key: "vehicle",   label: "Vehicle Verification" },
    { key: "userdocs",  label: "User KYC Docs" },
    { key: "cardocs",   label: "Car Documents" },
    { key: "payment",   label: "Payment" },
    { key: "timeline",  label: "Timeline" },
  ] as const;

  return (
    <>
    <div className="p-6 space-y-5 min-h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
          <button
            onClick={isClosed ? handleSendClosingBillWhatsApp : handleSendInvoiceWhatsApp}
            disabled={isClosed ? sendingClosingBillWhatsApp : sendingInvoiceWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#128C7E] text-white font-semibold text-sm disabled:opacity-60">
            {(isClosed ? sendingClosingBillWhatsApp : sendingInvoiceWhatsApp) ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {isClosed ? "Send Final Bill via WhatsApp" : "Send Invoice via WhatsApp"}
          </button>
          <button
            onClick={isClosed ? handleDownloadClosingBill : handleDownloadInvoice}
            disabled={isClosed ? downloadingClosingBill : generatingInvoice}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F0F1A] text-white font-semibold text-sm disabled:opacity-60">
            {(isClosed ? downloadingClosingBill : generatingInvoice) ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />} Print
          </button>
          <button onClick={openEditModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm hover:border-[#E8540A]/50 hover:text-[#E8540A] transition-colors">
            <FileText size={14} /> Edit
          </button>
          {["confirmed", "active"].includes(rawBooking.status) && (
            <button onClick={openExtendModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm hover:border-[#E8540A]/50 hover:text-[#E8540A] transition-colors">
              <Clock size={14} /> Extend Booking
            </button>
          )}
        </div>
      </div>

      {/* ── Status Banner ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#E8540A] to-[#FF6B35] rounded-2xl p-5 text-white flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          {booking.car.images[0] ? (
            <img src={booking.car.images[0]} alt={booking.car.name} className="w-14 h-14 rounded-xl object-cover bg-white/20" />
          ) : (
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center"><Car size={24} /></div>
          )}
          <div>
            <p className="font-black text-lg">{booking.car.name}</p>
            <p className="text-white/80 text-sm">{booking.car.regNo} · {booking.car.type}</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap text-sm">
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-white/70 text-xs">Duration</p>
            <p className="font-bold">{nights} day{nights !== 1 ? "s" : ""}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-3 py-2">
            <p className="text-white/70 text-xs mb-1">Status</p>
            <select value={booking.status} onChange={e => handleStatusChange(e.target.value)} disabled={updatingStatus}
              className="bg-white/20 text-white font-bold text-sm rounded-lg px-2 py-0.5 border border-white/30 outline-none cursor-pointer capitalize disabled:opacity-60">
              {["pending","confirmed","active","completed","cancelled"].map(s => (
                <option key={s} value={s} className="text-[#0F0F1A] bg-white capitalize">{s}</option>
              ))}
            </select>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-white/70 text-xs">Type</p>
            <p className="font-bold">{booking.doorstep ? "Doorstep" : "Office Pickup"}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-white/70 text-xs">Payment</p>
            <p className="font-bold">Rs. {booking.payment.received.toLocaleString("en-IN")} paid</p>
            {balance > 0 ? (
              <p className="text-[11px] font-semibold" style={{ color: "#FEF3C7" }}>Rs. {balance.toLocaleString("en-IN")} pending</p>
            ) : (
              <p className="text-[11px] font-semibold" style={{ color: "#D1FAE5" }}>Fully paid</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-white border border-[#E4E5EF] p-1.5 rounded-2xl flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all", activeTab === t.key ? "bg-[#E8540A] text-white" : "text-[#4A4A6A] hover:bg-[#F8F9FC]")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Overview Tab                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-4">
            <h3 className="font-bold text-[#0F0F1A] flex items-center gap-2"><User size={16} className="text-[#E8540A]" /> Customer Info</h3>
            <div className="space-y-3">
              {[
                { label: "Name",   value: booking.customer.name },
                { label: "Mobile", value: booking.customer.mobile },
                { label: "Email",  value: booking.customer.email },
                { label: "KYC",    value: booking.customer.kyc },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-[#F1F2F7]">
                  <span className="text-[#9090A8] text-sm">{label}</span>
                  <span className={cn("font-semibold text-sm", label === "KYC"
                    ? value === "verified" ? "text-[#10B981]" : "text-[#F59E0B]"
                    : "text-[#0F0F1A]"
                  )}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Period + Delivery */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-4">
            <h3 className="font-bold text-[#0F0F1A] flex items-center gap-2"><Calendar size={16} className="text-[#E8540A]" /> Booking Period</h3>
            <div className="space-y-3">
              {[
                { label: "Start",    value: new Date(booking.start).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) },
                { label: "End",      value: new Date(booking.end).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) },
                { label: "Duration", value: `${nights} day${nights !== 1 ? "s" : ""}` },
                { label: "City",     value: booking.city },
                { label: "Type",     value: booking.bookingType },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-[#F1F2F7]">
                  <span className="text-[#9090A8] text-sm">{label}</span>
                  <span className="font-semibold text-sm text-[#0F0F1A]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pickup / Delivery Info */}
          <div className={cn("bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-3", booking.doorstep ? "border-[#E8540A]/30 bg-[#FFF3ED]/30" : "")}>
            <h3 className="font-bold text-[#0F0F1A] flex items-center gap-2">
              {booking.doorstep ? <Truck size={16} className="text-[#E8540A]" /> : <MapPin size={16} className="text-[#E8540A]" />}
              {booking.doorstep ? "Doorstep Delivery" : "Pickup Location"}
            </h3>
            {booking.doorstep ? (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-[#F1F2F7]">
                  <span className="text-[#9090A8] text-sm">Office Address</span>
                  <span className="font-semibold text-sm text-[#0F0F1A] text-right max-w-[55%]">{booking.pickupLocation}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F1F2F7]">
                  <span className="text-[#9090A8] text-sm">Delivery Address</span>
                  <span className="font-semibold text-sm text-[#E8540A] text-right max-w-[55%]">{booking.deliveryAddress || "—"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#9090A8] text-sm">Delivery Charge</span>
                  <span className="font-semibold text-sm text-[#0F0F1A]">Rs. {booking.homeDelivery.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ) : (
              <p className="text-[#4A4A6A] text-sm font-medium">{booking.pickupLocation}</p>
            )}
          </div>

          {booking.remark && (
            <div className="bg-[#FFF3ED] border border-[#E8540A]/20 rounded-2xl p-4">
              <p className="text-xs font-bold text-[#E8540A] mb-1 flex items-center gap-1.5"><MessageSquare size={13} /> Remark</p>
              <p className="text-[#4A4A6A] text-sm">{booking.remark}</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Vehicle Verification Tab                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "vehicle" && (
        <div className="space-y-5">
          {/* ── Pickup Section ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
            <button onClick={() => setShowPickupChecklist(!showPickupChecklist)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F8F9FC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
                  <Car size={16} className="text-[#10B981]" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-[#0F0F1A]">Car Pickup Verification</p>
                  <p className="text-[#9090A8] text-xs">Condition check when car is handed to customer</p>
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
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Fuel size={13} className="text-[#9090A8]" /> Fuel Level</span>
                      <span className="text-[#E8540A] font-bold">{pickupCondition.fuel}%</span>
                    </label>
                    <input type="range" min={0} max={100} step={5} value={pickupCondition.fuel}
                      onChange={e => setPickupCondition(p => ({ ...p, fuel: Number(e.target.value) }))}
                      className="w-full accent-[#E8540A] mt-2.5" />
                  </div>
                  {[
                    { label: "Odometer (km)", field: "odometer" as const, placeholder: "e.g. 48200", icon: Gauge },
                  ].map(({ label, field, icon: Icon, placeholder }) => (
                    <div key={field} className="col-span-2 sm:col-span-1">
                      <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">{label}</label>
                      <div className="relative">
                        <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                        <input value={pickupCondition[field]} onChange={e => setPickupCondition(p => ({ ...p, [field]: e.target.value }))}
                          placeholder={placeholder} className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none" />
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
                          className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-colors",
                            pickupCondition.challan === v
                              ? v ? "bg-[#EF4444] text-white border-[#EF4444]" : "bg-[#10B981] text-white border-[#10B981]"
                              : "border-[#E4E5EF] text-[#4A4A6A] hover:bg-[#F8F9FC]")}>
                          {v ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Damage Notes</label>
                    <textarea value={pickupCondition.damage} onChange={e => setPickupCondition(p => ({ ...p, damage: e.target.value }))} placeholder="Any pre-existing damage..." rows={2}
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Extra Accessories</label>
                    <textarea value={pickupCondition.extras} onChange={e => setPickupCondition(p => ({ ...p, extras: e.target.value }))} placeholder="FastTag, toolkit, etc." rows={2}
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[{ label: "AC Working", field: "ac" as const }, { label: "Docs Present", field: "documents" as const }].map(({ label, field }) => (
                    <button key={field} onClick={() => setPickupCondition(p => ({ ...p, [field]: !p[field] }))}
                      className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors", pickupCondition[field] ? "bg-[#D1FAE5] text-[#065F46] border-[#10B981]/30" : "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]/30")}>
                      {pickupCondition[field] ? <CheckCircle size={13} /> : <XCircle size={13} />} {label}
                    </button>
                  ))}
                </div>

                {/* Pickup Video Upload → Cloudinary */}
                <div>
                  <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 flex items-center gap-1.5"><Video size={13} /> Handover Video Evidence (saved to Cloud)</label>
                  <p className="text-xs text-[#9090A8] mb-2">Upload video/photos before handing over the car.</p>
                  <input ref={pickupInputRef} type="file" multiple accept="video/*,image/*" className="hidden"
                    onChange={e => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      if (files.length > MAX_MEDIA_FILES) toast.error(`Max ${MAX_MEDIA_FILES} files per upload — only the first ${MAX_MEDIA_FILES} were kept`);
                      setPickupFiles(files.slice(0, MAX_MEDIA_FILES));
                    }} />
                  <div onClick={() => pickupInputRef.current?.click()} className="flex items-center gap-3 border-2 border-dashed border-[#E4E5EF] rounded-xl p-4 cursor-pointer hover:border-[#E8540A]/50 hover:bg-[#FFF3ED] transition-all">
                    <Camera size={20} className="text-[#9090A8]" />
                    <div>
                      <p className="text-sm font-semibold text-[#4A4A6A]">Select handover files</p>
                      <p className="text-xs text-[#9090A8]">Videos (MP4, MOV) or photos — up to {MAX_MEDIA_FILES} files</p>
                    </div>
                    {pickupFiles.length > 0 && <span className="ml-auto text-xs font-bold text-[#10B981]">{pickupFiles.length} selected</span>}
                  </div>
                  {pickupFiles.length > 0 && (
                    <button onClick={() => uploadMedia("pickup")} disabled={pickupUploading}
                      className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#7C3AED] text-white hover:bg-[#6D28D9] disabled:opacity-60 transition-colors">
                      {pickupUploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload {pickupFiles.length} file(s) to Cloud</>}
                    </button>
                  )}
                  {/* Already-saved pickup media */}
                  {pickupSaved.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold text-[#9090A8]">{pickupSaved.reduce((a, m) => a + m.urls.length, 0)} file(s) saved to Cloudinary</p>
                      <div className="grid grid-cols-3 gap-2">
                        {pickupSaved.flatMap((m) => m.urls.map((url: string) => ({ url, mediaId: m._id }))).map(({ url, mediaId }, i) => (
                          <div key={i} className="relative aspect-video bg-[#0F0F1A] rounded-xl overflow-hidden flex items-center justify-center group">
                            <a href={url} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center">
                              {url.match(/\.(mp4|mov|avi|webm)/) ? (
                                <><Video size={20} className="text-white/60" /><span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1 rounded">Video</span></>
                              ) : (
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              )}
                            </a>
                            <button onClick={() => deleteMedia(mediaId, url)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10">
                              <span className="text-[10px] font-bold">✕</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={async () => {
                  if (!rawBooking) return;
                  setSavingVerification(true);
                  try {
                    const { data } = await bookingsApi.updateVerification(rawBooking._id, "pickup", pickupCondition);
                    setRawBooking(data.data);
                    setCarReceived(true);
                    toast.success("Car marked as handed over");
                  } catch {
                    toast.error("Failed to save pickup verification");
                  } finally {
                    setSavingVerification(false);
                  }
                }} disabled={savingVerification}
                  className="flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60">
                  {savingVerification ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Mark Car Handed Over
                </button>
              </div>
            )}
          </div>

          {/* ── Compare Photos Card ────────────────────────────────────────── */}
          {(pickupSaved.length > 0 || returnSaved.length > 0) && (
            <div className="bg-gradient-to-r from-[#1E1040] to-[#2D1A60] rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-white flex items-center gap-2"><ScanSearch size={18} className="text-[#A78BFA]" /> Dent Comparison & AI Analysis</p>
                <p className="text-white/50 text-xs mt-0.5">
                  {pickupSaved.length > 0 && returnSaved.length > 0
                    ? "Pickup + Return media ready — Compare in full screen and detect dents with AI"
                    : pickupSaved.length > 0
                      ? `${pickupSaved.reduce((a, m) => a + m.urls.length, 0)} pickup file(s) — Return media not uploaded yet`
                      : `${returnSaved.reduce((a, m) => a + m.urls.length, 0)} return file(s) — Pickup media not uploaded yet`}
                </p>
                {damageReport && (
                  <p className={cn("text-xs font-bold mt-1.5", damageReport.newDamageDetected ? "text-[#FCA5A5]" : "text-[#6EE7B7]")}>
                    {damageReport.newDamageDetected ? "⚠ AI: New damage detected" : "✓ AI: No new damage"} · {new Date(damageReport.analyzedAt).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowCompareModal(true)}
                className="shrink-0 flex items-center gap-2 px-5 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm rounded-xl transition-colors"
              >
                <ScanSearch size={16} />
                Compare Full Screen
              </button>
            </div>
          )}

          {/* ── Return Section ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
            <button onClick={() => setShowReturnChecklist(!showReturnChecklist)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F8F9FC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] flex items-center justify-center">
                  <RefreshCw size={16} className="text-[#3B82F6]" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-[#0F0F1A]">Car Return Verification</p>
                  <p className="text-[#9090A8] text-xs">Condition when customer returns the car</p>
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
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Fuel size={13} className="text-[#9090A8]" /> Fuel Level on Return</span>
                      <span className="text-[#E8540A] font-bold">{returnCondition.fuel}%</span>
                    </label>
                    <input type="range" min={0} max={100} step={5} value={returnCondition.fuel}
                      onChange={e => setReturnCondition(p => ({ ...p, fuel: Number(e.target.value) }))}
                      className="w-full accent-[#E8540A] mt-2.5" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Odometer on Return</label>
                    <div className="relative">
                      <Gauge size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                      <input value={returnCondition.odometer} onChange={e => setReturnCondition(p => ({ ...p, odometer: e.target.value }))} placeholder="e.g. 48900"
                        className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Tyre Condition</label>
                    <select value={returnCondition.tyres} onChange={e => setReturnCondition(p => ({ ...p, tyres: e.target.value }))}
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                      {["Good", "Fair", "Poor"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">New Challan</label>
                    <div className="flex gap-2 mt-1">
                      {[true, false].map(v => (
                        <button key={String(v)} onClick={() => setReturnCondition(p => ({ ...p, challan: v }))}
                          className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-colors",
                            returnCondition.challan === v
                              ? v ? "bg-[#EF4444] text-white border-[#EF4444]" : "bg-[#10B981] text-white border-[#10B981]"
                              : "border-[#E4E5EF] text-[#4A4A6A] hover:bg-[#F8F9FC]")}>
                          {v ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Damage on Return</label>
                    <textarea value={returnCondition.damage} onChange={e => setReturnCondition(p => ({ ...p, damage: e.target.value }))} placeholder="Any new damage..." rows={2}
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Extra Charges</label>
                    <textarea value={returnCondition.extras} onChange={e => setReturnCondition(p => ({ ...p, extras: e.target.value }))} placeholder="Extra KM, cleaning, fuel..." rows={2}
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
                  </div>
                </div>

                {/* AC + Docs toggle */}
                <div className="flex flex-wrap gap-2">
                  {[{ label: "AC Working", field: "ac" as const }, { label: "Docs Present", field: "documents" as const }].map(({ label, field }) => (
                    <button key={field} onClick={() => setReturnCondition(p => ({ ...p, [field]: !p[field] }))}
                      className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors", returnCondition[field] ? "bg-[#D1FAE5] text-[#065F46] border-[#10B981]/30" : "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]/30")}>
                      {returnCondition[field] ? <CheckCircle size={13} /> : <XCircle size={13} />} {label}
                    </button>
                  ))}
                </div>

                {/* Return Video Upload → Cloudinary */}
                <div>
                  <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 flex items-center gap-1.5"><Video size={13} /> Return Video Evidence (saved to Cloud)</label>
                  <p className="text-xs text-[#9090A8] mb-2">Upload video/photos after car is returned — used for dent comparison.</p>
                  <input ref={returnInputRef} type="file" multiple accept="video/*,image/*" className="hidden"
                    onChange={e => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      if (files.length > MAX_MEDIA_FILES) toast.error(`Max ${MAX_MEDIA_FILES} files per upload — only the first ${MAX_MEDIA_FILES} were kept`);
                      setReturnFiles(files.slice(0, MAX_MEDIA_FILES));
                    }} />
                  <div onClick={() => returnInputRef.current?.click()} className="flex items-center gap-3 border-2 border-dashed border-[#E4E5EF] rounded-xl p-4 cursor-pointer hover:border-[#E8540A]/50 hover:bg-[#FFF3ED] transition-all">
                    <Upload size={20} className="text-[#9090A8]" />
                    <div>
                      <p className="text-sm font-semibold text-[#4A4A6A]">Select return files</p>
                      <p className="text-xs text-[#9090A8]">Compare against pickup footage for dent analysis — up to {MAX_MEDIA_FILES} files</p>
                    </div>
                    {returnFiles.length > 0 && <span className="ml-auto text-xs font-bold text-[#10B981]">{returnFiles.length} selected</span>}
                  </div>
                  {returnFiles.length > 0 && (
                    <button onClick={() => uploadMedia("return")} disabled={returnUploading}
                      className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#7C3AED] text-white hover:bg-[#6D28D9] disabled:opacity-60 transition-colors">
                      {returnUploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload {returnFiles.length} file(s) to Cloud</>}
                    </button>
                  )}
                  {returnSaved.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold text-[#9090A8]">{returnSaved.reduce((a, m) => a + m.urls.length, 0)} return file(s) saved</p>
                      <div className="grid grid-cols-3 gap-2">
                        {returnSaved.flatMap((m) => m.urls.map((url: string) => ({ url, mediaId: m._id }))).map(({ url, mediaId }, i) => (
                          <div key={i} className="relative aspect-video bg-[#0F0F1A] rounded-xl overflow-hidden flex items-center justify-center group">
                            <a href={url} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center">
                              {url.match(/\.(mp4|mov|avi|webm)/) ? (
                                <><Video size={20} className="text-white/60" /><span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1 rounded">Video</span></>
                              ) : (
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              )}
                            </a>
                            <button onClick={() => deleteMedia(mediaId, url)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10">
                              <span className="text-[10px] font-bold">✕</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Dent Detection (Claude vision — pickup vs return) */}
                {pickupSaved.length > 0 && returnSaved.length > 0 && (
                  <div className="border-t border-[#E4E5EF] pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-[#0F0F1A] flex items-center gap-1.5"><Zap size={14} className="text-[#7C3AED]" /> AI Dent Detection</p>
                        <p className="text-xs text-[#9090A8]">Claude compares pickup vs return photos for new damage</p>
                      </div>
                      {dentResult && (
                        <button onClick={() => runDentDetection(true)} disabled={dentLoading}
                          className="text-xs font-bold text-[#7C3AED] hover:underline disabled:opacity-50 shrink-0">
                          {dentLoading ? "Running..." : "Re-run"}
                        </button>
                      )}
                    </div>

                    {!dentResult && (
                      <button onClick={() => runDentDetection(false)} disabled={dentLoading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#7C3AED] text-white hover:bg-[#6D28D9] disabled:opacity-60 transition-colors">
                        {dentLoading ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</> : <><Zap size={14} /> Run Dent Detection</>}
                      </button>
                    )}

                    {dentError && (
                      <p className="text-xs text-[#EF4444] font-semibold mt-2 flex items-center gap-1.5"><AlertTriangle size={13} /> {dentError}</p>
                    )}

                    {dentResult && (
                      <div className="mt-2 space-y-3">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full",
                          dentResult.newDamageFound ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#D1FAE5] text-[#065F46]")}>
                          {dentResult.newDamageFound ? <AlertTriangle size={13} /> : <CheckCircle size={13} />}
                          {dentResult.newDamageFound ? `${dentResult.damageCount} new damage found` : "No new damage found"}
                        </span>
                        {dentResult.summary && <p className="text-xs text-[#4A4A6A]">{dentResult.summary}</p>}
                        {dentResult.damages?.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {dentResult.damages.map((d, i) => (
                              <div key={i} className="border border-[#E4E5EF] rounded-xl p-3 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold text-[#0F0F1A] break-words">{d.location}</p>
                                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                                    d.severity === "severe" ? "bg-[#FEE2E2] text-[#991B1B]" :
                                    d.severity === "moderate" ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#F1F2F7] text-[#4A4A6A]")}>
                                    {d.severity}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#9090A8] mt-1 break-words">{d.type}</p>
                                <p className="text-xs text-[#4A4A6A] mt-1 break-words">{d.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {(dentResult.partsChecked?.length ?? 0) > 0 && (() => {
                          const partsChecked = dentResult.partsChecked!;
                          return (
                            <div>
                              <button onClick={() => setShowPartsChecklist(!showPartsChecklist)}
                                className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:underline">
                                {showPartsChecklist ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                {showPartsChecklist ? "Hide" : "Show"} full {partsChecked.length}-part checklist
                              </button>
                              {showPartsChecklist && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                                  {partsChecked.map((p, i) => (
                                    <div key={i} className={cn(
                                      "flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[#E4E5EF] text-xs",
                                      p.newDamage && "border-l-2 border-l-[#EF4444]"
                                    )}>
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        {p.newDamage && <AlertTriangle size={11} className="text-[#EF4444] shrink-0" />}
                                        <span className="font-semibold text-[#0F0F1A] truncate">{humanizePart(p.part)}</span>
                                        {p.lowConfidence && <span title="Low confidence — pickup angle unclear"><Eye size={11} className="text-[#9090A8] shrink-0" /></span>}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", PART_STATUS_STYLE[p.pickupStatus])}>{p.pickupStatus}</span>
                                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", PART_STATUS_STYLE[p.returnStatus])}>{p.returnStatus}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        {dentResult.confidenceNote && (
                          <p className="text-[11px] text-[#9090A8] italic">{dentResult.confidenceNote}</p>
                        )}
                        <p className="text-[10px] text-[#9090A8]">Analyzed {new Date(dentResult.analyzedAt).toLocaleString("en-IN")} · {dentResult.model}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  <button onClick={async () => {
                    if (!rawBooking) return;
                    setSavingVerification(true);
                    try {
                      const { data } = await bookingsApi.updateVerification(rawBooking._id, "return", returnCondition);
                      setRawBooking(data.data);
                      setCarReturned(true);
                      toast.success("Car marked as returned");
                    } catch {
                      toast.error("Failed to save return verification");
                    } finally {
                      setSavingVerification(false);
                    }
                  }} disabled={savingVerification}
                    className="flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60">
                    {savingVerification ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Mark Car Returned
                  </button>
                  {carReturned && !isClosed && (
                    <button onClick={openCloseBillModal}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EDE9FE] text-[#7C3AED] font-bold text-sm hover:bg-[#7C3AED] hover:text-white transition-colors">
                      <FileText size={16} /> Close Booking &amp; Generate Bill
                    </button>
                  )}
                  {isClosed && (
                    <button onClick={openCloseBillModal} title="Re-run the KM/late-fee/charges calculation — e.g. if the odometer reading was corrected after closing"
                      className="flex items-center gap-2 px-6 py-3 rounded-xl border-[1.5px] border-[#E4E5EF] text-[#4A4A6A] font-bold text-sm hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors">
                      <Pencil size={16} /> Recalculate Closing Bill
                    </button>
                  )}
                </div>

                {/* Final settlement summary, once closed */}
                {isClosed && closingBill && (
                  <div className="border-t border-[#E4E5EF] pt-5 space-y-3">
                    <p className="text-sm font-bold text-[#0F0F1A] flex items-center gap-1.5"><FileText size={14} className="text-[#7C3AED]" /> Final Settlement</p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-[#F8F9FC] rounded-xl p-4">
                        <p className="text-[10px] font-bold text-[#9090A8] uppercase tracking-wider mb-2">Trip Details</p>
                        {[
                          ["Departure Date", fmtDT(booking.start)],
                          ["Arrival Date", fmtDT(booking.end)],
                          ["Cab No", booking.car.regNo],
                          ["Day Rental", `Rs. ${(rawBooking.bookingFare || 0).toLocaleString("en-IN")}`],
                          ["Advance Payment (Security Deposit)", `Rs. ${(closingBill.advancePaid || 0).toLocaleString("en-IN")}`],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between items-center py-1.5 text-xs">
                            <span className="text-[#9090A8]">{label}</span>
                            <span className="font-semibold text-[#0F0F1A]">{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-[#F8F9FC] rounded-xl p-4">
                        <p className="text-[10px] font-bold text-[#9090A8] uppercase tracking-wider mb-2">Meter &amp; KM</p>
                        {[
                          ["Starting Meter", `${(rawBooking.odometerStart || 0).toLocaleString("en-IN")} km`],
                          ["Closing Meter", `${(rawBooking.odometerEnd || 0).toLocaleString("en-IN")} km`],
                          ["Total KMs", `${(closingBill.totalKms || 0).toLocaleString("en-IN")} km`],
                          ["KMs Limit", `${(closingBill.kmsLimit || 0).toLocaleString("en-IN")} km`],
                          ["Extra KMs", `${(closingBill.extraKms || 0).toLocaleString("en-IN")} km @ Rs. ${closingBill.extraKmRate || 0}/km`],
                          ["Extra KM Charge", `Rs. ${(rawBooking.extraKmCharge || 0).toLocaleString("en-IN")}`],
                          ...(closingBill.actualReturnTime ? [["Actual Return", fmtDT(closingBill.actualReturnTime)]] : []),
                          ...(closingBill.lateHours > 0 ? [["Late Return", `${closingBill.lateHours} hr${closingBill.lateHours !== 1 ? "s" : ""} @ Rs. ${closingBill.lateHourRate || 0}/hr`]] : []),
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between items-center py-1.5 text-xs">
                            <span className="text-[#9090A8]">{label}</span>
                            <span className="font-semibold text-[#0F0F1A]">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#F8F9FC] rounded-xl p-4">
                      <p className="text-[10px] font-bold text-[#9090A8] uppercase tracking-wider mb-2">Return-Time Charges</p>
                      {([
                        ["Late Return Charge", closingBill.lateCharges],
                        ["Pickup Charges", closingBill.pickupCharges],
                        ["Drop Charges", closingBill.dropCharges],
                        ["Fastag / State Tax", closingBill.fastagStateTax],
                        ["All State Challan", closingBill.allStateChallan],
                        ["Overspeeding Fine", closingBill.overspeedingFine],
                        ["Fuel Charges", closingBill.fuelCharges],
                        ["Damages", closingBill.damageCharges],
                        ["Washing", closingBill.washingCharges],
                      ] as Array<[string, number | undefined]>).map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center py-1.5 text-xs">
                          <span className="text-[#9090A8]">{label}</span>
                          <span className="font-semibold text-[#0F0F1A]">Rs. {(value || 0).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2.5 mt-1.5 border-t border-[#E4E5EF] text-sm">
                        <span className="font-bold text-[#0F0F1A]">Total Charges</span>
                        <span className="font-black text-[#7C3AED]">Rs. {(closingBill.totalCharges || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <div className={cn("flex items-center justify-between p-4 rounded-xl",
                      closingBill.settlementAmount === 0 ? "bg-[#D1FAE5]" : closingBill.settlementAmount < 0 ? "bg-[#D1FAE5]" : "bg-[#FFF3ED]"
                    )}>
                      <span className={cn("text-sm font-bold",
                        closingBill.settlementAmount <= 0 ? "text-[#065F46]" : "text-[#E8540A]"
                      )}>
                        {closingBill.settlementAmount === 0 ? "Fully Settled" : closingBill.settlementAmount < 0 ? "Refund Due to Customer" : "Balance Due from Customer"}
                      </span>
                      <span className={cn("text-lg font-black",
                        closingBill.settlementAmount <= 0 ? "text-[#065F46]" : "text-[#E8540A]"
                      )}>
                        Rs. {Math.abs(closingBill.settlementAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <button onClick={handleDownloadClosingBill} disabled={downloadingClosingBill}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F0F1A] text-white font-semibold text-sm disabled:opacity-60">
                        {downloadingClosingBill ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />} Download Bill PDF
                      </button>
                      <button onClick={handleSendClosingBillWhatsApp} disabled={sendingClosingBillWhatsApp}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#128C7E] text-white font-semibold text-sm disabled:opacity-60">
                        {sendingClosingBillWhatsApp ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Bill via WhatsApp
                      </button>
                      {closingBill.settlementAmount < 0 && !closingBill.refundPaid && (
                        <button onClick={handleMarkRefundPaid} disabled={markingRefundPaid}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EDE9FE] text-[#7C3AED] font-semibold text-sm hover:bg-[#7C3AED] hover:text-white transition-colors disabled:opacity-60">
                          {markingRefundPaid ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Mark Refund Paid
                        </button>
                      )}
                      {closingBill.refundPaid && (
                        <span className="flex items-center gap-2 px-4 py-2.5 bg-[#D1FAE5] text-[#065F46] rounded-xl text-sm font-bold">
                          <CheckCircle size={15} /> Refund Paid
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Close Booking Modal                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {closeBillModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCloseBillModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[#E4E5EF] flex items-center justify-between shrink-0">
              <h2 className="font-bold text-[#0F0F1A] text-base flex items-center gap-2">
                <FileText size={16} className="text-[#7C3AED]" /> {isClosed ? "Recalculate Closing Bill" : "Close Booking & Generate Bill"}
              </h2>
              <button onClick={() => setCloseBillModalOpen(false)} className="text-[#9090A8] hover:text-[#EF4444]"><XIcon size={18} /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Read-only trip summary — reference while filling the form below */}
              <div className="bg-[#F8F9FC] rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {[
                  ["Guest Name", booking.customer.name],
                  ["Mobile No.", booking.customer.mobile],
                  ["Cab No.", booking.car.regNo],
                  ["Departure Date", fmtDT(booking.start)],
                  ["Arrival Date", fmtDT(booking.end)],
                  ["Day Rental", `Rs. ${(rawBooking.bookingFare || 0).toLocaleString("en-IN")}`],
                  ["Advance Payment (Security Deposit)", `Rs. ${(rawBooking.amountPaid || 0).toLocaleString("en-IN")}`],
                  ...(rawBooking.odometerStart != null ? [["Starting Meter", `${rawBooking.odometerStart.toLocaleString("en-IN")} km`]] : []),
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[9px] font-bold text-[#9090A8] uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-semibold text-[#0F0F1A] mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {rawBooking.odometerStart == null && (
                <div className="bg-[#FEF3C7] border border-[#F59E0B]/40 rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#92400E] mb-2">
                    ⚠ Pickup odometer was never recorded for this booking. Enter it below to proceed.
                  </p>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Starting Meter (km)</label>
                  <input type="number" min="0" value={closingForm.startingMeter}
                    onChange={(e) => setClosingForm((f) => ({ ...f, startingMeter: e.target.value }))}
                    className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]" placeholder="e.g. 99719" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Closing Meter (km)</label>
                  <input type="number" min="0" value={closingForm.closingMeter}
                    onChange={(e) => setClosingForm((f) => ({ ...f, closingMeter: e.target.value }))}
                    className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]" placeholder="e.g. 100707" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">KMs Limit</label>
                  <input type="number" min="0" value={closingForm.kmsLimit}
                    onChange={(e) => setClosingForm((f) => ({ ...f, kmsLimit: e.target.value }))}
                    className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]" placeholder="e.g. 700" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">
                    Extra KM Rate (Rs./km) {rawBooking.carId?.extraKmRate ? <span className="text-[#9090A8] font-normal">· from car profile</span> : null}
                  </label>
                  <input type="number" min="0" value={closingForm.extraKmRate}
                    onChange={(e) => setClosingForm((f) => ({ ...f, extraKmRate: e.target.value }))}
                    className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]" placeholder="e.g. 6" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Notes</label>
                  <input value={closingForm.notes}
                    onChange={(e) => setClosingForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]" placeholder="Optional" />
                </div>
              </div>

              <p className="text-xs font-bold text-[#9090A8] uppercase tracking-wider pt-1">Late Return</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">
                    Actual Return Date &amp; Time <span className="text-[#9090A8] font-normal">· scheduled {fmtDT(booking.end)}</span>
                  </label>
                  <input type="datetime-local" value={closingForm.actualReturnTime}
                    onChange={(e) => setClosingForm((f) => ({ ...f, actualReturnTime: e.target.value }))}
                    className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">
                    Late Hour Rate (Rs./hr) {rawBooking.carId?.regularPrice ? <span className="text-[#9090A8] font-normal">· car's hourly rate</span> : null}
                  </label>
                  <input type="number" min="0" value={closingForm.lateHourRate}
                    onChange={(e) => setClosingForm((f) => ({ ...f, lateHourRate: e.target.value }))}
                    className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]" placeholder="e.g. 110" />
                </div>
              </div>
              {(() => {
                const scheduledEnd = new Date(booking.end);
                const actualReturn = closingForm.actualReturnTime ? new Date(closingForm.actualReturnTime) : null;
                const lateHours = actualReturn && !isNaN(actualReturn.getTime()) && actualReturn > scheduledEnd
                  ? Math.ceil((actualReturn.getTime() - scheduledEnd.getTime()) / (60 * 60 * 1000)) : 0;
                const lateCharges = lateHours * (Number(closingForm.lateHourRate) || 0);
                if (lateHours <= 0) return null;
                return (
                  <p className="text-xs text-[#7C3AED] font-semibold -mt-2">
                    {lateHours} hr{lateHours !== 1 ? "s" : ""} late → Rs. {lateCharges.toLocaleString("en-IN")} late return charge
                  </p>
                );
              })()}

              <p className="text-xs font-bold text-[#9090A8] uppercase tracking-wider pt-1">Return-Time Charges (Rs.)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([
                  ["pickupCharges", "Pickup Charges"],
                  ["dropCharges", "Drop Charges"],
                  ["fastagStateTax", "Fastag / State Tax"],
                  ["allStateChallan", "All State Challan"],
                  ["overspeedingFine", "Overspeeding Fine"],
                  ["fuelCharges", "Fuel"],
                  ["damageCharges", "Damages"],
                  ["washingCharges", "Washing"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">{label}</label>
                    <input type="number" min="0" value={closingForm[key]}
                      onChange={(e) => setClosingForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]" placeholder="0" />
                  </div>
                ))}
              </div>

              <button onClick={handleCloseBooking} disabled={closingSaving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#7C3AED] text-white rounded-xl text-sm font-bold hover:bg-[#6D28D9] transition-colors disabled:opacity-60">
                {closingSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                {closingSaving ? "Saving..." : isClosed ? "Recalculate & Save" : "Close Booking & Compute Bill"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* User KYC Docs Tab — dynamic, shows what user actually uploaded        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "userdocs" && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h3 className="font-bold text-[#0F0F1A] flex items-center gap-2 mb-1">
              <FileCheck size={16} className="text-[#E8540A]" /> Customer KYC Documents
            </h3>
            <p className="text-[#9090A8] text-xs mb-5">Documents uploaded by {booking.customer.name}</p>

            {userDocsLoading && (
              <div className="flex items-center gap-2 text-[#9090A8] py-8 justify-center">
                <Loader2 size={18} className="animate-spin" /> Loading documents...
              </div>
            )}

            {!userDocsLoading && !userDocs && (
              <div className="text-center py-8 text-[#9090A8]">
                <FileText size={32} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold">No documents uploaded yet</p>
              </div>
            )}

            {!userDocsLoading && userDocs && (
              <div className="space-y-6">
                {/* Aadhaar */}
                {(userDocs.aadhaar?.front || userDocs.aadhaar?.back) && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-sm text-[#0F0F1A]">Aadhaar Card</p>
                      <span className={cn("text-xs font-bold px-3 py-1 rounded-full bg-[#F1F2F7]", DOC_STATUS_CONFIG[userDocs.aadhaar?.status || "not_uploaded"]?.color)}>
                        {DOC_STATUS_CONFIG[userDocs.aadhaar?.status || "not_uploaded"]?.label}
                      </span>
                    </div>
                    {userDocs.aadhaar?.number && (
                      <p className="text-xs text-[#9090A8] mb-3">Number: {userDocs.aadhaar.number}</p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {[{ label: "Front", url: userDocs.aadhaar.front }, { label: "Back", url: userDocs.aadhaar.back }].map(({ label, url }) => url && (
                        <a key={label} href={url} target="_blank" rel="noreferrer"
                          className="relative group overflow-hidden rounded-xl border border-[#E4E5EF] hover:border-[#E8540A] transition-colors">
                          <img src={url} alt={`Aadhaar ${label}`} className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-doc.png"; }} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Eye size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs font-semibold text-[#4A4A6A] text-center py-2">{label}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAN */}
                {userDocs.pan?.photo && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-sm text-[#0F0F1A]">PAN Card</p>
                      <span className={cn("text-xs font-bold px-3 py-1 rounded-full bg-[#F1F2F7]", DOC_STATUS_CONFIG[userDocs.pan?.status || "not_uploaded"]?.color)}>
                        {DOC_STATUS_CONFIG[userDocs.pan?.status || "not_uploaded"]?.label}
                      </span>
                    </div>
                    {userDocs.pan?.number && <p className="text-xs text-[#9090A8] mb-3">Number: {userDocs.pan.number}</p>}
                    <a href={userDocs.pan.photo} target="_blank" rel="noreferrer"
                      className="relative group inline-block w-48 overflow-hidden rounded-xl border border-[#E4E5EF] hover:border-[#E8540A]">
                      <img src={userDocs.pan.photo} alt="PAN Card" className="w-full h-28 object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                        <Eye size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  </div>
                )}

                {/* Driving Licence */}
                {(userDocs.dl?.front || userDocs.dl?.back) && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-sm text-[#0F0F1A]">Driving Licence</p>
                      <span className={cn("text-xs font-bold px-3 py-1 rounded-full bg-[#F1F2F7]", DOC_STATUS_CONFIG[userDocs.dl?.status || "not_uploaded"]?.color)}>
                        {DOC_STATUS_CONFIG[userDocs.dl?.status || "not_uploaded"]?.label}
                      </span>
                    </div>
                    {userDocs.dl?.number && <p className="text-xs text-[#9090A8] mb-1">DL No: {userDocs.dl.number}</p>}
                    {userDocs.dl?.validity && <p className="text-xs text-[#9090A8] mb-3">Valid till: {new Date(userDocs.dl.validity).toLocaleDateString("en-IN")}</p>}
                    <div className="grid grid-cols-2 gap-3">
                      {[{ label: "Front", url: userDocs.dl.front }, { label: "Back", url: userDocs.dl.back }].map(({ label, url }) => url && (
                        <a key={label} href={url} target="_blank" rel="noreferrer"
                          className="relative group overflow-hidden rounded-xl border border-[#E4E5EF] hover:border-[#E8540A] transition-colors">
                          <img src={url} alt={`DL ${label}`} className="w-full h-32 object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                            <Eye size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs font-semibold text-[#4A4A6A] text-center py-2">{label}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* No docs uploaded at all */}
                {!userDocs.aadhaar?.front && !userDocs.pan?.photo && !userDocs.dl?.front && (
                  <div className="text-center py-8 text-[#9090A8]">
                    <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Customer hasn&apos;t uploaded any documents yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Car Documents Tab — send to customer via WhatsApp                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "cardocs" && (
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-[#0F0F1A] flex items-center gap-2"><FileCheck size={16} className="text-[#E8540A]" /> Car Documents</h3>
              <p className="text-[#9090A8] text-xs mt-1">Send the booked car documents to {booking.customer.name} via WhatsApp</p>
            </div>
            <button onClick={sendAllCarDocs} disabled={sendingAllDocs}
              className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60">
              {sendingAllDocs ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send All via WhatsApp
            </button>
          </div>

          <div className="space-y-3">
            {carDocsList.map((doc) => {
              const sent = sentDocs.includes(doc.key);
              const sending = sendingDocKey === doc.key;
              const available = Boolean(doc.url);
              return (
                <div key={doc.key} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#E4E5EF]">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", available ? "bg-[#FFF3ED]" : "bg-[#F1F2F7]")}>
                      <FileText size={16} className={available ? "text-[#E8540A]" : "text-[#9090A8]"} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#0F0F1A]">{doc.label}</p>
                      <p className={cn("text-xs", available ? "text-[#10B981]" : "text-[#9090A8]")}>
                        {available
                          ? doc.expiry ? `Valid till ${new Date(doc.expiry).toLocaleDateString("en-IN")}` : "Available on file"
                          : "Not uploaded yet"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sent && <span className="flex items-center gap-1 text-[#10B981] text-xs font-bold"><CheckCircle size={13} /> Sent</span>}
                    {available && (
                      <a href={doc.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F8F9FC] text-[#4A4A6A] hover:bg-[#FFF3ED] hover:text-[#E8540A] transition-colors">
                        <Eye size={12} /> View
                      </a>
                    )}
                    <button disabled={!available || sending}
                      onClick={() => sendSingleDoc(doc.key, doc.label)}
                      className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors",
                        !available ? "bg-[#F1F2F7] text-[#D1D5DB] cursor-not-allowed"
                          : sent ? "bg-[#F8F9FC] text-[#4A4A6A] hover:bg-[#FFF3ED] hover:text-[#E8540A]"
                            : "bg-[#FFF3ED] text-[#E8540A] hover:bg-[#E8540A] hover:text-white"
                      )}>
                      {sending ? <Loader2 size={11} className="animate-spin" /> : <Send size={12} />}
                      {sent ? "Resend" : "Send"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Payment Tab                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "payment" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h3 className="font-bold text-[#0F0F1A] flex items-center gap-2 mb-4"><IndianRupee size={16} className="text-[#E8540A]" /> Payment Summary</h3>
            <div className="space-y-3">
              {[
                { label: "Booking Amount",    value: `Rs. ${booking.payment.total.toLocaleString("en-IN")}`,    color: "text-[#0F0F1A]" },
                { label: "Amount Received",   value: `Rs. ${booking.payment.received.toLocaleString("en-IN")}`, color: "text-[#10B981]" },
                { label: "Balance Due",       value: `Rs. ${balance.toLocaleString("en-IN")}`,                  color: balance > 0 ? "text-[#EF4444]" : "text-[#10B981]" },
                { label: "Security Deposit",  value: `Rs. ${booking.securityDeposit.toLocaleString("en-IN")}`,  color: "text-[#F59E0B]" },
                { label: "Home Delivery",     value: `Rs. ${booking.homeDelivery.toLocaleString("en-IN")}`,     color: "text-[#4A4A6A]" },
                { label: "Payment Mode",      value: booking.payment.mode,                                      color: "text-[#4A4A6A]" },
                { label: "Payment Status",    value: booking.payment.status, color: booking.payment.status === "Success" ? "text-[#10B981]" : "text-[#EF4444]" },
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
              <button
                onClick={isClosed ? handleSendClosingBillWhatsApp : handleSendInvoiceWhatsApp}
                disabled={isClosed ? sendingClosingBillWhatsApp : sendingInvoiceWhatsApp}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#F0FDF4] border border-[#10B981]/20 hover:bg-[#D1FAE5] transition-colors text-left disabled:opacity-60">
                {(isClosed ? sendingClosingBillWhatsApp : sendingInvoiceWhatsApp) ? <Loader2 size={18} className="text-[#10B981] animate-spin" /> : <Phone size={18} className="text-[#10B981]" />}
                <div>
                  <p className="font-semibold text-sm text-[#0F0F1A]">
                    {(isClosed ? sendingClosingBillWhatsApp : sendingInvoiceWhatsApp) ? "Sending..." : isClosed ? "Send Final Bill" : "Send WhatsApp Bill"}
                  </p>
                  <p className="text-xs text-[#9090A8]">{isClosed ? "Send final settlement bill (with refund/due) to customer via WhatsApp" : "Send invoice PDF to customer via WhatsApp"}</p>
                </div>
              </button>
              <button
                onClick={isClosed ? handleDownloadClosingBill : handleDownloadInvoice}
                disabled={isClosed ? downloadingClosingBill : generatingInvoice}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#F8F9FC] border border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors text-left disabled:opacity-60">
                {(isClosed ? downloadingClosingBill : generatingInvoice) ? <Loader2 size={18} className="text-[#4A4A6A] animate-spin" /> : <Printer size={18} className="text-[#4A4A6A]" />}
                <div>
                  <p className="font-semibold text-sm text-[#0F0F1A]">
                    {(isClosed ? downloadingClosingBill : generatingInvoice) ? "Generating PDF..." : isClosed ? "Print Final Bill" : "Print Invoice"}
                  </p>
                  <p className="text-xs text-[#9090A8]">{isClosed ? "Download the final settlement bill PDF" : "Download a professional invoice PDF"}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Timeline Tab                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
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

    {/* ═══════════════════════════════════════════════════════════════════════ */}
    {/* Dent Comparison Full-Screen Modal                                       */}
    {/* ═══════════════════════════════════════════════════════════════════════ */}
    {showCompareModal && (
      <DentComparisonModal
        bookingId={id}
        pickupMedia={pickupSaved}
        returnMedia={returnSaved}
        damageReport={damageReport}
        onAnalysisDone={setDamageReport}
        onClose={() => setShowCompareModal(false)}
      />
    )}

    {/* ═══════════════════════════════════════════════════════════════════════ */}
    {/* Edit Booking Modal                                                      */}
    {/* ═══════════════════════════════════════════════════════════════════════ */}
    {showEditModal && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl my-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">Edit Booking</h3>
              <p className="text-[#9090A8] text-xs mt-0.5">#{rawBooking?.bookingId || rawBooking?._id?.slice(-8)}</p>
            </div>
            <button onClick={() => setShowEditModal(false)} className="text-[#9090A8] hover:text-[#0F0F1A] transition-colors"><XIcon size={20} /></button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Pickup Date & Time</label>
                <input type="datetime-local" value={editForm.startTime} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Return Date & Time</label>
                <input type="datetime-local" value={editForm.endTime} onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Total Amount (Rs.)</label>
                <input type="number" value={editForm.totalAmount} onChange={e => setEditForm(f => ({ ...f, totalAmount: e.target.value }))}
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Amount Paid (Rs.)</label>
                <input type="number" value={editForm.amountPaid} onChange={e => setEditForm(f => ({ ...f, amountPaid: e.target.value }))}
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Payment Mode</label>
              <select value={editForm.paymentMode} onChange={e => setEditForm(f => ({ ...f, paymentMode: e.target.value }))}
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                <option value="online">Online / Razorpay</option>
                <option value="offline_cash">Cash</option>
                <option value="offline_qr">UPI / QR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Remarks / Notes</label>
              <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                placeholder="Internal notes or challan details..." />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl border-2 border-[#E4E5EF] font-bold text-sm text-[#4A4A6A] hover:bg-[#F8F9FC]">
              Cancel
            </button>
            <button onClick={handleEditSave} disabled={editLoading} className="flex-1 py-3 rounded-xl btn-gradient text-white font-bold text-sm disabled:opacity-60">
              {editLoading ? <><Loader2 size={14} className="animate-spin inline mr-1" />Saving...</> : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ═══════════════════════════════════════════════════════════════════════ */}
    {/* Extend Booking Modal                                                    */}
    {/* ═══════════════════════════════════════════════════════════════════════ */}
    {showExtendModal && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl my-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">Extend Booking</h3>
              <p className="text-[#9090A8] text-xs mt-0.5">#{rawBooking?.bookingId || rawBooking?._id?.slice(-8)} · Current return: {fmtDT(rawBooking?.endTime)}</p>
            </div>
            <button onClick={() => setShowExtendModal(false)} className="text-[#9090A8] hover:text-[#0F0F1A] transition-colors"><XIcon size={20} /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">New Return Date & Time</label>
              <input type="datetime-local" value={extendForm.newEndTime} onChange={e => handleExtendNewEndTimeChange(e.target.value)}
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Extra Charge (Rs.)</label>
                <input type="number" min="0" value={extendForm.extraAmount} onChange={e => setExtendForm(f => ({ ...f, extraAmount: e.target.value }))}
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Additional Payment Received (Rs.)</label>
                <input type="number" min="0" value={extendForm.additionalPaymentReceived} onChange={e => setExtendForm(f => ({ ...f, additionalPaymentReceived: e.target.value }))}
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="0" />
              </div>
            </div>
            <p className="text-[11px] text-[#9090A8]">Extra Charge auto-fills from the car's rate for the added hours — edit if you negotiated a different amount. It's added to the booking's total; the additional payment (if any) is added to what's already been received.</p>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowExtendModal(false)} className="flex-1 py-3 rounded-xl border-2 border-[#E4E5EF] font-bold text-sm text-[#4A4A6A] hover:bg-[#F8F9FC]">
              Cancel
            </button>
            <button onClick={handleExtendSave} disabled={extendLoading} className="flex-1 py-3 rounded-xl btn-gradient text-white font-bold text-sm disabled:opacity-60">
              {extendLoading ? <><Loader2 size={14} className="animate-spin inline mr-1" />Saving...</> : "Extend Booking"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─── Dent Comparison Full-Screen Modal ────────────────────────────────────────
function isVideoUrl(url: string): boolean {
  return url.match(/\.(mp4|mov|avi|webm)/i) !== null || url.includes("/video/upload/");
}

function getThumbnailUrl(url: string): string {
  if (!isVideoUrl(url)) return url;
  try {
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;
    const base = parts[1].replace(/\.(mp4|mov|avi|webm)$/i, "");
    return `${parts[0]}/upload/so_3,w_800,h_600,c_fill,f_jpg/${base}.jpg`;
  } catch { return url; }
}

interface Pred { x: number; y: number; width: number; height: number; confidence: number; class: string; }

function PhotoWithBoxes({ url, predictions, imgW, imgH }: { url: string; predictions: Pred[]; imgW: number; imgH: number; }) {
  return (
    <div className="relative w-full">
      <img
        src={getThumbnailUrl(url)}
        alt=""
        className="w-full rounded-xl object-contain max-h-[55vh]"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      {predictions.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${((p.x - p.width / 2) / imgW) * 100}%`,
            top: `${((p.y - p.height / 2) / imgH) * 100}%`,
            width: `${(p.width / imgW) * 100}%`,
            height: `${(p.height / imgH) * 100}%`,
            border: "2px solid #EF4444",
            borderRadius: 4,
          }}
        >
          <span style={{
            position: "absolute", top: -18, left: 0,
            background: "#EF4444", color: "#fff",
            fontSize: 10, padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap",
          }}>
            {p.class} {Math.round(p.confidence * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function MediaItem({ url, active, onClick }: { url: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("w-16 h-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-black",
        active ? "border-white opacity-100 scale-105" : "border-white/10 opacity-50 hover:opacity-80")}>
      <img src={getThumbnailUrl(url)} alt="" className="w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
    </button>
  );
}

function MediaViewer({ url, predictions, imgW, imgH }: { url: string; predictions: Pred[]; imgW: number; imgH: number }) {
  if (isVideoUrl(url)) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-black">
        <video src={url} controls className="w-full max-h-[60vh] object-contain" />
      </div>
    );
  }
  return <PhotoWithBoxes url={url} predictions={predictions} imgW={imgW} imgH={imgH} />;
}

function DentComparisonModal({
  bookingId, pickupMedia, returnMedia, damageReport, onAnalysisDone, onClose,
}: {
  bookingId: string;
  pickupMedia: MediaRecord[];
  returnMedia: MediaRecord[];
  damageReport: DamageReport | null;
  onAnalysisDone: (r: DamageReport) => void;
  onClose: () => void;
}) {
  const pickupUrls = pickupMedia.flatMap((m) => m.urls);
  const returnUrls = returnMedia.flatMap((m) => m.urls);

  const [selPickup, setSelPickup] = useState(0);
  const [selReturn, setSelReturn] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [localReport, setLocalReport] = useState<DamageReport | null>(damageReport);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data } = await bookingsApi.analyzeDamage(bookingId);
      setLocalReport(data.data);
      onAnalysisDone(data.data);
      toast.success("Analysis complete!");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Analysis failed — check API config");
    } finally {
      setAnalyzing(false);
    }
  };

  const pickupPredictions = localReport?.pickup.predictions || [];
  const returnPredictions = localReport?.return.predictions || [];
  const pickupImgW = localReport?.pickup.imageWidth || 640;
  const pickupImgH = localReport?.pickup.imageHeight || 480;
  const returnImgW = localReport?.return.imageWidth || 640;
  const returnImgH = localReport?.return.imageHeight || 480;

  return (
    <div className="fixed inset-0 z-[60] bg-[#050508] flex flex-col" style={{ fontFamily: "inherit" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0A0A14] shrink-0">
        <div className="flex items-center gap-3">
          <ScanSearch size={17} className="text-[#A78BFA]" />
          <div>
            <p className="text-white font-bold text-sm">Dent Comparison</p>
            <p className="text-white/30 text-[10px]">{pickupUrls.length} pickup · {returnUrls.length} return files</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runAnalysis}
            disabled={analyzing || pickupUrls.length === 0 || returnUrls.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors">
            {analyzing ? <><Loader2 size={11} className="animate-spin" /> Analyzing...</> : <><Zap size={11} /> Run Analysis</>}
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
            <XIcon size={15} />
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Pickup side */}
        <div className="flex-1 flex flex-col border-r border-white/[0.08] overflow-hidden">
          <div className="px-4 py-2 bg-emerald-950/60 border-b border-emerald-900/40 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-emerald-400 text-xs font-bold tracking-wider">PICKUP</span>
              <span className="text-emerald-600 text-[10px]">{pickupUrls.length} file{pickupUrls.length !== 1 ? "s" : ""}</span>
            </div>
            {pickupUrls.length > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setSelPickup(p => Math.max(0, p - 1))} disabled={selPickup === 0}
                  className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20">
                  <ChevronLeft size={12} />
                </button>
                <span className="text-white/30 text-[10px] w-8 text-center">{selPickup + 1}/{pickupUrls.length}</span>
                <button onClick={() => setSelPickup(p => Math.min(pickupUrls.length - 1, p + 1))} disabled={selPickup === pickupUrls.length - 1}
                  className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20">
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {pickupUrls[selPickup] ? (
              <MediaViewer url={pickupUrls[selPickup]} predictions={pickupPredictions} imgW={pickupImgW} imgH={pickupImgH} />
            ) : (
              <div className="flex items-center justify-center h-64 text-white/20">
                <div className="text-center"><Camera size={32} className="mx-auto mb-2 opacity-40" /><p className="text-xs">No pickup media</p></div>
              </div>
            )}
            {pickupUrls.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                {pickupUrls.map((url, i) => (
                  <MediaItem key={i} url={url} active={selPickup === i} onClick={() => setSelPickup(i)} />
                ))}
              </div>
            )}
            {pickupPredictions.length > 0 && (
              <div className="bg-emerald-950/50 rounded-xl p-3 border border-emerald-500/20">
                <p className="text-emerald-400 text-[10px] font-bold mb-1">PICKUP — Detected</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(pickupPredictions.map(p => p.class))).map(cls => (
                    <span key={cls} className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 text-[10px] rounded-full capitalize">{cls}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Return side */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-red-950/60 border-b border-red-900/40 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span className="text-red-400 text-xs font-bold tracking-wider">RETURN</span>
              <span className="text-red-600 text-[10px]">{returnUrls.length} file{returnUrls.length !== 1 ? "s" : ""}</span>
            </div>
            {returnUrls.length > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setSelReturn(p => Math.max(0, p - 1))} disabled={selReturn === 0}
                  className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20">
                  <ChevronLeft size={12} />
                </button>
                <span className="text-white/30 text-[10px] w-8 text-center">{selReturn + 1}/{returnUrls.length}</span>
                <button onClick={() => setSelReturn(p => Math.min(returnUrls.length - 1, p + 1))} disabled={selReturn === returnUrls.length - 1}
                  className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20">
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {returnUrls[selReturn] ? (
              <MediaViewer url={returnUrls[selReturn]} predictions={returnPredictions} imgW={returnImgW} imgH={returnImgH} />
            ) : (
              <div className="flex items-center justify-center h-64 text-white/20">
                <div className="text-center"><Camera size={32} className="mx-auto mb-2 opacity-40" /><p className="text-xs">No return media uploaded</p></div>
              </div>
            )}
            {returnUrls.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                {returnUrls.map((url, i) => (
                  <MediaItem key={i} url={url} active={selReturn === i} onClick={() => setSelReturn(i)} />
                ))}
              </div>
            )}
            {returnPredictions.length > 0 && (
              <div className="bg-red-950/50 rounded-xl p-3 border border-red-500/20">
                <p className="text-red-400 text-[10px] font-bold mb-1">RETURN — Detected</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(returnPredictions.map(p => p.class))).map(cls => (
                    <span key={cls} className="px-2 py-0.5 bg-red-900/50 text-red-300 text-[10px] rounded-full capitalize">{cls}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verdict bar */}
      <div className="border-t border-white/10 bg-[#0A0A14] px-5 py-2.5 shrink-0">
        {localReport ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border",
              localReport.newDamageDetected
                ? "bg-red-950/70 text-red-300 border-red-500/30"
                : "bg-emerald-950/70 text-emerald-300 border-emerald-500/30")}>
              {localReport.newDamageDetected ? <AlertTriangle size={13} /> : <CheckCircle size={13} />}
              {localReport.newDamageDetected ? "New damage detected!" : "No new damage found"}
            </div>
            <span className="text-white/30 text-[10px]">Pickup: {localReport.pickup.score}% · Return: {localReport.return.score}% · {new Date(localReport.analyzedAt).toLocaleString("en-IN")}</span>
            {localReport.return.damageLabels?.length > 0 && localReport.return.damageLabels.map(l => (
              <span key={l} className="px-2 py-0.5 bg-red-900/50 text-red-300 text-[10px] rounded-full capitalize">{l}</span>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-xs">
            {pickupUrls.length > 0 && returnUrls.length > 0 ? 'Click "Run Analysis" to detect dents' : "Upload both pickup and return media to compare"}
          </p>
        )}
      </div>
    </div>
  );
}
