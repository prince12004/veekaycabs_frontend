"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle, AlertCircle, Eye, Loader2, RefreshCw } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { documentsAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const STEPS = ["Aadhaar", "PAN", "Driving Licence"];

type DocStatus = "not_uploaded" | "pending" | "verified" | "rejected" | "mismatch" | "expired";

const STATUS_CONFIG: Record<DocStatus, { label: string; class: string }> = {
  not_uploaded: { label: "Not Uploaded",   class: "bg-[#F1F2F7] text-[#9090A8]" },
  pending:      { label: "Under Review",   class: "bg-[#FEF3C7] text-[#92400E]" },
  verified:     { label: "Verified",       class: "bg-[#D1FAE5] text-[#065F46]" },
  rejected:     { label: "Rejected",       class: "bg-[#FEE2E2] text-[#991B1B]" },
  mismatch:     { label: "Mismatch",       class: "bg-[#FEE2E2] text-[#991B1B]" },
  expired:      { label: "Expired",        class: "bg-[#FEE2E2] text-[#991B1B]" },
};

// ─── Upload box: shows uploaded file preview OR current Cloudinary URL ────────
function UploadBox({
  label, file, savedUrl, uploading, onChange,
}: {
  label: string;
  file: File | null;
  savedUrl?: string;
  uploading?: boolean;
  onChange: (f: File | null) => void;
}) {
  const hasContent = file || savedUrl;
  return (
    <label className={cn(
      "flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-all group relative",
      hasContent ? "border-[#10B981] bg-[#D1FAE5]/30" : "border-[#E4E5EF] hover:border-[#E8540A]/60 hover:bg-[#FFF3ED]"
    )}>
      <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      {uploading ? (
        <div className="text-center">
          <Loader2 size={28} className="text-[#E8540A] mx-auto mb-1 animate-spin" />
          <p className="text-[#E8540A] text-xs font-semibold">Uploading...</p>
        </div>
      ) : hasContent ? (
        <div className="text-center w-full px-3">
          {savedUrl && !file ? (
            <div className="relative">
              <img src={savedUrl} alt="" className="w-full h-24 object-cover rounded-xl mb-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <CheckCircle size={20} className="text-[#10B981] mx-auto" />
            </div>
          ) : (
            <>
              <CheckCircle size={28} className="text-[#10B981] mx-auto mb-1" />
              <p className="text-[#10B981] text-xs font-semibold">Ready to upload</p>
              <p className="text-[#9090A8] text-[10px] mt-0.5 truncate">{file?.name}</p>
            </>
          )}
        </div>
      ) : (
        <div className="text-center">
          <Upload size={24} className="text-[#9090A8] mx-auto mb-2 group-hover:text-[#E8540A] transition-colors" />
          <p className="text-[#4A4A6A] text-xs font-semibold">{label}</p>
          <p className="text-[#9090A8] text-[10px] mt-1">Click to upload</p>
          <p className="text-[#9090A8] text-[10px]">JPG, PNG or PDF (max 10MB)</p>
        </div>
      )}
      {savedUrl && !file && (
        <a href={savedUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 w-7 h-7 bg-white rounded-lg border border-[#E4E5EF] flex items-center justify-center hover:bg-[#FFF3ED] transition-colors">
          <Eye size={13} className="text-[#E8540A]" />
        </a>
      )}
    </label>
  );
}

export default function DocumentsPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Saved state from API (Cloudinary URLs)
  const [savedDocs, setSavedDocs] = useState<Record<string, any>>({});

  // Local file selections
  const [aadhaarFront, setAadhaarFront] = useState<File | null>(null);
  const [aadhaarBack,  setAadhaarBack]  = useState<File | null>(null);
  const [aadhaarNum,   setAadhaarNum]   = useState("");
  const [panPhoto,     setPanPhoto]     = useState<File | null>(null);
  const [panNum,       setPanNum]       = useState("");
  const [dlFront,      setDlFront]      = useState<File | null>(null);
  const [dlBack,       setDlBack]       = useState<File | null>(null);
  const [dlNum,        setDlNum]        = useState("");
  const [dlValidity,   setDlValidity]   = useState("");

  // Per-field upload loading
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // Load existing docs from API
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("vk_token") : null;
    if (!token) { setLoading(false); return; }

    documentsAPI.getMy()
      .then(({ data }) => {
        const d = data.data;
        setSavedDocs(d);
        if (d?.aadhaar?.number) setAadhaarNum(d.aadhaar.number);
        if (d?.pan?.number)     setPanNum(d.pan.number);
        if (d?.dl?.number)      setDlNum(d.dl.number);
        if (d?.dl?.validity)    setDlValidity(d.dl.validity?.slice(0, 10) || "");
        // Determine overall submission status
        const anyPending   = ["aadhaar", "pan", "dl"].some((t) => d?.[t]?.status === "pending");
        const anyVerified  = ["aadhaar", "pan", "dl"].some((t) => d?.[t]?.status === "verified");
        if (anyPending || anyVerified) setSubmitted(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Upload a single file to Cloudinary via the API ──────────────────────────
  const uploadFile = async (docType: string, side: string, file: File) => {
    const key = `${docType}_${side}`;
    setUploading((p) => ({ ...p, [key]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("docType", docType);
      fd.append("side", side);
      const { data } = await documentsAPI.upload(fd);
      setSavedDocs(data.data);
      toast.success(`${docType.toUpperCase()} ${side} uploaded`);
      return true;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Upload failed");
      return false;
    } finally {
      setUploading((p) => ({ ...p, [key]: false }));
    }
  };

  // ── Save current step files, then advance ───────────────────────────────────
  const saveStepAndNext = async () => {
    if (currentStep === 0) {
      let ok = true;
      if (aadhaarFront) ok = await uploadFile("aadhaar", "front", aadhaarFront) && ok;
      if (aadhaarBack)  ok = await uploadFile("aadhaar", "back", aadhaarBack) && ok;
      if (ok) setCurrentStep(1);
    } else if (currentStep === 1) {
      if (panPhoto) await uploadFile("pan", "photo", panPhoto);
      setCurrentStep(2);
    } else {
      let ok = true;
      if (dlFront) ok = await uploadFile("dl", "front", dlFront) && ok;
      if (dlBack)  ok = await uploadFile("dl", "back", dlBack) && ok;
      if (ok) await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await documentsAPI.submit();
      setSubmitted(true);
      toast.success("Documents submitted for review!");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const aadhaarStatus: DocStatus = savedDocs?.aadhaar?.status || "not_uploaded";
  const panStatus:     DocStatus = savedDocs?.pan?.status     || "not_uploaded";
  const dlStatus:      DocStatus = savedDocs?.dl?.status      || "not_uploaded";

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-[#F8F9FC] pt-24 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#E8540A]" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F8F9FC] pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 lg:px-8">
          <div className="mb-8">
            <h1 className="font-black font-syne text-3xl text-[#0F0F1A]">KYC Documents</h1>
            <p className="text-[#9090A8] text-sm mt-1">Upload your identity documents — they're stored securely on cloud</p>
          </div>

          {/* 3-Step Progress */}
          <div className="flex items-center mb-10">
            {STEPS.map((step, idx) => {
              const status = [aadhaarStatus, panStatus, dlStatus][idx];
              const isComplete = status === "verified" || status === "pending";
              const isActive = idx === currentStep;
              return (
                <div key={step} className="flex items-center flex-1">
                  <button onClick={() => setCurrentStep(idx)} className="flex flex-col items-center group">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all mb-1.5",
                      status === "verified" ? "bg-[#10B981] text-white"
                        : status === "pending" ? "bg-[#F59E0B] text-white"
                          : status === "rejected" ? "bg-[#EF4444] text-white"
                            : isActive ? "bg-[#E8540A] text-white ring-4 ring-[#E8540A]/20"
                              : "bg-white border-2 border-[#E4E5EF] text-[#9090A8]"
                    )}>
                      {status === "verified" ? <CheckCircle size={16} /> : idx + 1}
                    </div>
                    <p className={cn("text-xs font-semibold", isActive ? "text-[#E8540A]" : isComplete ? "text-[#10B981]" : "text-[#9090A8]")}>{step}</p>
                    <span className={cn("text-[9px] mt-0.5", STATUS_CONFIG[status]?.class?.includes("text-") ? STATUS_CONFIG[status].class.split(" ").find((c) => c.startsWith("text-")) : "text-[#9090A8]")}>
                      {STATUS_CONFIG[status]?.label}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={cn("flex-1 h-0.5 mx-2 mb-7 transition-all", isComplete ? "bg-[#10B981]" : "bg-[#E4E5EF]")} />
                  )}
                </div>
              );
            })}
          </div>

          {submitted && (aadhaarStatus === "verified" && panStatus === "verified" && dlStatus === "verified") ? (
            <div className="bg-white rounded-2xl border border-[#10B981]/30 p-12 text-center shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
              <CheckCircle size={52} className="text-[#10B981] mx-auto mb-4" />
              <h3 className="font-black font-syne text-[#0F0F1A] text-2xl mb-2">KYC Verified!</h3>
              <p className="text-[#4A4A6A] text-sm">All your documents are verified. You can book any car.</p>
            </div>
          ) : submitted ? (
            <div className="bg-white rounded-2xl border border-[#FEF3C7] p-10 text-center shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
              <div className="text-5xl mb-4">⏳</div>
              <h3 className="font-black font-syne text-[#0F0F1A] text-2xl mb-2">Documents Under Review</h3>
              <p className="text-[#4A4A6A] text-sm mb-2">Our team will verify within 2-4 hours.</p>
              <p className="text-[#9090A8] text-xs mb-6">You&apos;ll receive an SMS once verified.</p>
              <button onClick={() => setSubmitted(false)} className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl border border-[#E4E5EF] text-sm text-[#4A4A6A] font-semibold hover:bg-[#F8F9FC]">
                <RefreshCw size={14} /> Update Documents
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ── AADHAAR ─────────────────────────────────────────────────── */}
              {currentStep === 0 && (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold font-syne text-[#0F0F1A] text-lg flex items-center gap-2">📋 Aadhaar Card</h3>
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full", STATUS_CONFIG[aadhaarStatus].class)}>{STATUS_CONFIG[aadhaarStatus].label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="text-xs font-semibold text-[#4A4A6A] mb-2">Front Side</p>
                      <UploadBox label="Front of Aadhaar" file={aadhaarFront} savedUrl={savedDocs?.aadhaar?.front}
                        uploading={uploading["aadhaar_front"]} onChange={setAadhaarFront} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#4A4A6A] mb-2">Back Side</p>
                      <UploadBox label="Back of Aadhaar" file={aadhaarBack} savedUrl={savedDocs?.aadhaar?.back}
                        uploading={uploading["aadhaar_back"]} onChange={setAadhaarBack} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Aadhaar Number</label>
                    <input type="text" maxLength={14} value={aadhaarNum}
                      onChange={(e) => setAadhaarNum(e.target.value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 "))}
                      placeholder="XXXX XXXX XXXX"
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest outline-none" />
                    {aadhaarStatus === "verified" && (
                      <p className="flex items-center gap-1.5 mt-1.5 text-xs text-[#10B981]"><CheckCircle size={12} /> Aadhaar verified</p>
                    )}
                    {aadhaarStatus === "rejected" && savedDocs?.aadhaar?.rejectedReason && (
                      <p className="flex items-center gap-1.5 mt-1.5 text-xs text-[#EF4444]"><AlertCircle size={12} /> {savedDocs.aadhaar.rejectedReason}</p>
                    )}
                  </div>
                  <button onClick={saveStepAndNext} disabled={!aadhaarFront && !savedDocs?.aadhaar?.front}
                    className="mt-5 btn-gradient px-6 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50">
                    {aadhaarFront ? "Upload & Continue →" : "Continue to PAN →"}
                  </button>
                </div>
              )}

              {/* ── PAN ─────────────────────────────────────────────────────── */}
              {currentStep === 1 && (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">🪪 PAN Card</h3>
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full", STATUS_CONFIG[panStatus].class)}>{STATUS_CONFIG[panStatus].label}</span>
                  </div>
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-[#4A4A6A] mb-2">PAN Card Photo</p>
                    <UploadBox label="PAN Card" file={panPhoto} savedUrl={savedDocs?.pan?.photo}
                      uploading={uploading["pan_photo"]} onChange={setPanPhoto} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">PAN Number</label>
                    <input type="text" maxLength={10} value={panNum}
                      onChange={(e) => setPanNum(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest uppercase outline-none" />
                    {panStatus === "verified" && (
                      <p className="flex items-center gap-1.5 mt-1.5 text-xs text-[#10B981]"><CheckCircle size={12} /> PAN verified</p>
                    )}
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setCurrentStep(0)} className="px-5 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] text-sm font-semibold">← Back</button>
                    <button onClick={saveStepAndNext} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-semibold text-sm">
                      {panPhoto ? "Upload & Continue →" : "Continue to DL →"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── DRIVING LICENCE ─────────────────────────────────────────── */}
              {currentStep === 2 && (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">🚗 Driving Licence</h3>
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full", STATUS_CONFIG[dlStatus].class)}>{STATUS_CONFIG[dlStatus].label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="text-xs font-semibold text-[#4A4A6A] mb-2">Front Side</p>
                      <UploadBox label="Front of DL" file={dlFront} savedUrl={savedDocs?.dl?.front}
                        uploading={uploading["dl_front"]} onChange={setDlFront} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#4A4A6A] mb-2">Back Side</p>
                      <UploadBox label="Back of DL" file={dlBack} savedUrl={savedDocs?.dl?.back}
                        uploading={uploading["dl_back"]} onChange={setDlBack} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">DL Number</label>
                      <input type="text" value={dlNum} onChange={(e) => setDlNum(e.target.value.toUpperCase())}
                        placeholder="DL-0420110012345"
                        className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Valid Until</label>
                      <input type="date" value={dlValidity} onChange={(e) => setDlValidity(e.target.value)}
                        className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none" />
                    </div>
                  </div>
                  <div className="bg-[#FFF3ED] border border-[#E8540A]/20 rounded-xl p-4 mb-5 space-y-2">
                    <p className="text-[#E8540A] text-xs font-bold uppercase tracking-wider">Important Rules</p>
                    {["DL must be at least 1 year old", "Minimum age to rent: 21 years", "All documents must have matching name", "DL must be valid throughout the trip"].map((rule) => (
                      <div key={rule} className="flex items-center gap-2">
                        <AlertCircle size={11} className="text-[#E8540A] shrink-0" />
                        <p className="text-[#E8540A] text-xs">{rule}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setCurrentStep(1)} className="px-5 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] text-sm font-semibold">← Back</button>
                    <button onClick={saveStepAndNext} disabled={submitting || (!dlFront && !savedDocs?.dl?.front)}
                      className="flex-1 btn-gradient py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                      {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : <><Eye size={14} /> Submit for Verification</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
