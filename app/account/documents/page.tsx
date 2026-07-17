"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import DatePicker from "@/components/ui/DatePicker";
import { documentsAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const STEPS = ["Aadhaar", "PAN", "Driving Licence"];

type DocStatus = "not_uploaded" | "pending" | "verified" | "rejected" | "mismatch" | "expired";

const STATUS_CONFIG: Record<DocStatus, { label: string; class: string }> = {
  not_uploaded: { label: "Not Verified",   class: "bg-[#F1F2F7] text-[#9090A8]" },
  pending:      { label: "Under Review",   class: "bg-[#FEF3C7] text-[#92400E]" },
  verified:     { label: "Verified",       class: "bg-[#D1FAE5] text-[#065F46]" },
  rejected:     { label: "Rejected",       class: "bg-[#FEE2E2] text-[#991B1B]" },
  mismatch:     { label: "Mismatch",       class: "bg-[#FEE2E2] text-[#991B1B]" },
  expired:      { label: "Expired",        class: "bg-[#FEE2E2] text-[#991B1B]" },
};

const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const DOB_MAX = toISODate(new Date(new Date().setFullYear(new Date().getFullYear() - 18))); // must be at least 18
const DOB_MIN = toISODate(new Date(new Date().setFullYear(new Date().getFullYear() - 100)));

export default function DocumentsPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  // Saved state from API
  const [savedDocs, setSavedDocs] = useState<Record<string, any>>({});

  const [aadhaarNum, setAadhaarNum] = useState("");
  const [panNum,     setPanNum]     = useState("");
  const [dlNum,      setDlNum]      = useState("");
  const [dlValidity, setDlValidity] = useState("");

  // Instant verification state (Aadhaar OTP / PAN / DL via QuickEKYC)
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [aadhaarSending, setAadhaarSending] = useState(false);
  const [aadhaarVerifying, setAadhaarVerifying] = useState(false);
  const [panVerifying, setPanVerifying] = useState(false);
  const [dlDob, setDlDob] = useState("");
  const [dlVerifying, setDlVerifying] = useState(false);

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

        // Resume at the first not-yet-verified step instead of always
        // restarting at Aadhaar. currentStep only lived in memory, so a
        // mobile browser reloading a backgrounded tab wiped progress even
        // though the backend already had Aadhaar/PAN marked verified.
        if (d?.pan?.status === "verified") setCurrentStep(2);
        else if (d?.aadhaar?.status === "verified") setCurrentStep(1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Aadhaar: send OTP to the Aadhaar-linked mobile number ───────────────────
  const sendAadhaarOtp = async () => {
    const digits = aadhaarNum.replace(/\D/g, "");
    if (digits.length !== 12) {
      toast.error("Enter a valid 12-digit Aadhaar number");
      return;
    }
    setAadhaarSending(true);
    try {
      await documentsAPI.sendAadhaarOtp(digits);
      setAadhaarOtpSent(true);
      toast.success("OTP sent to your Aadhaar-linked mobile number");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to send OTP");
    } finally {
      setAadhaarSending(false);
    }
  };

  // ── Aadhaar: verify the entered OTP ──────────────────────────────────────────
  const verifyAadhaarOtp = async () => {
    if (!aadhaarOtp.trim()) {
      toast.error("Enter the OTP");
      return;
    }
    setAadhaarVerifying(true);
    try {
      const { data } = await documentsAPI.verifyAadhaarOtp(aadhaarOtp.trim());
      setSavedDocs((p) => ({ ...p, aadhaar: data.data }));
      setAadhaarOtpSent(false);
      setAadhaarOtp("");
      toast.success("Aadhaar verified successfully!");
      setCurrentStep(1);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Invalid OTP");
    } finally {
      setAadhaarVerifying(false);
    }
  };

  // ── PAN: instant verification ────────────────────────────────────────────────
  const verifyPan = async () => {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNum)) {
      toast.error("Enter a valid PAN number");
      return;
    }
    setPanVerifying(true);
    try {
      const { data } = await documentsAPI.verifyPan(panNum);
      setSavedDocs((p) => ({ ...p, pan: data.data }));
      toast.success("PAN verified successfully!");
      setCurrentStep(2);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "PAN verification failed");
    } finally {
      setPanVerifying(false);
    }
  };

  // ── Driving Licence: instant verification ────────────────────────────────────
  const verifyDL = async () => {
    if (!dlNum.trim()) {
      toast.error("Enter your driving license number");
      return;
    }
    setDlVerifying(true);
    try {
      const { data } = await documentsAPI.verifyDL(dlNum.trim(), dlDob || undefined);
      setSavedDocs((p) => ({ ...p, dl: data.data }));
      toast.success("Driving Licence verified successfully!");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "License verification failed");
    } finally {
      setDlVerifying(false);
    }
  };

  const aadhaarStatus: DocStatus = savedDocs?.aadhaar?.status || "not_uploaded";
  const panStatus:     DocStatus = savedDocs?.pan?.status     || "not_uploaded";
  const dlStatus:      DocStatus = savedDocs?.dl?.status      || "not_uploaded";
  const allVerified = aadhaarStatus === "verified" && panStatus === "verified" && dlStatus === "verified";

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
            <p className="text-[#9090A8] text-sm mt-1">Instant verification — no document photos needed</p>
          </div>

          {/* 3-Step Progress */}
          <div className="flex items-center mb-10">
            {STEPS.map((step, idx) => {
              const status = [aadhaarStatus, panStatus, dlStatus][idx];
              const isComplete = status === "verified";
              const isActive = idx === currentStep;
              return (
                <div key={step} className="flex items-center flex-1">
                  <button onClick={() => setCurrentStep(idx)} className="flex flex-col items-center group">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all mb-1.5",
                      status === "verified" ? "bg-[#10B981] text-white"
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

          {allVerified ? (
            <div className="bg-white rounded-2xl border border-[#10B981]/30 p-12 text-center shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
              <CheckCircle size={52} className="text-[#10B981] mx-auto mb-4" />
              <h3 className="font-black font-syne text-[#0F0F1A] text-2xl mb-2">KYC Verified!</h3>
              <p className="text-[#4A4A6A] text-sm">All your documents are verified. You can book any car.</p>
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
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Aadhaar Number</label>
                    <div className="flex gap-2">
                      <input type="text" maxLength={14} value={aadhaarNum}
                        disabled={aadhaarStatus === "verified"}
                        onChange={(e) => setAadhaarNum(e.target.value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 "))}
                        placeholder="XXXX XXXX XXXX"
                        className="flex-1 border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest outline-none disabled:bg-[#F8F9FC]" />
                      {aadhaarStatus !== "verified" && !aadhaarOtpSent && (
                        <button onClick={sendAadhaarOtp} disabled={aadhaarSending}
                          className="px-4 py-2.5 rounded-xl bg-[#0F0F1A] text-white text-xs font-semibold whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5">
                          {aadhaarSending ? <Loader2 size={13} className="animate-spin" /> : null}
                          {aadhaarSending ? "Sending..." : "Send OTP"}
                        </button>
                      )}
                    </div>
                    {aadhaarStatus === "verified" && (
                      <p className="flex items-center gap-1.5 mt-1.5 text-xs text-[#10B981]"><CheckCircle size={12} /> Aadhaar verified{savedDocs?.aadhaar?.name ? ` — ${savedDocs.aadhaar.name}` : ""}</p>
                    )}
                    {aadhaarStatus === "rejected" && savedDocs?.aadhaar?.rejectedReason && (
                      <p className="flex items-center gap-1.5 mt-1.5 text-xs text-[#EF4444]"><AlertCircle size={12} /> {savedDocs.aadhaar.rejectedReason}</p>
                    )}

                    {aadhaarOtpSent && aadhaarStatus !== "verified" && (
                      <div className="mt-3 flex gap-2">
                        <input type="text" maxLength={6} value={aadhaarOtp}
                          onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter OTP"
                          className="flex-1 border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest outline-none" />
                        <button onClick={verifyAadhaarOtp} disabled={aadhaarVerifying}
                          className="px-4 py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-semibold whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5">
                          {aadhaarVerifying ? <Loader2 size={13} className="animate-spin" /> : null}
                          {aadhaarVerifying ? "Verifying..." : "Verify OTP"}
                        </button>
                        <button onClick={sendAadhaarOtp} disabled={aadhaarSending} title="Resend OTP"
                          className="px-3 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] text-xs font-semibold disabled:opacity-50">
                          <RefreshCw size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setCurrentStep(1)} disabled={aadhaarStatus !== "verified"}
                    className="mt-5 btn-gradient px-6 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50">
                    Continue to PAN →
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
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">PAN Number</label>
                    <div className="flex gap-2">
                      <input type="text" maxLength={10} value={panNum}
                        disabled={panStatus === "verified"}
                        onChange={(e) => setPanNum(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        className="flex-1 border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest uppercase outline-none disabled:bg-[#F8F9FC]" />
                      {panStatus !== "verified" && (
                        <button onClick={verifyPan} disabled={panVerifying}
                          className="px-4 py-2.5 rounded-xl bg-[#0F0F1A] text-white text-xs font-semibold whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5">
                          {panVerifying ? <Loader2 size={13} className="animate-spin" /> : null}
                          {panVerifying ? "Verifying..." : "Verify PAN"}
                        </button>
                      )}
                    </div>
                    {panStatus === "verified" && (
                      <p className="flex items-center gap-1.5 mt-1.5 text-xs text-[#10B981]"><CheckCircle size={12} /> PAN verified{savedDocs?.pan?.name ? ` — ${savedDocs.pan.name}` : ""}</p>
                    )}
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setCurrentStep(0)} className="px-5 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] text-sm font-semibold">← Back</button>
                    <button onClick={() => setCurrentStep(2)} disabled={panStatus !== "verified"}
                      className="btn-gradient px-6 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50">
                      Continue to DL →
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
                      <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">DL Number</label>
                      <input type="text" value={dlNum}
                        disabled={dlStatus === "verified"}
                        onChange={(e) => setDlNum(e.target.value.toUpperCase())}
                        placeholder="DL-0420110012345"
                        className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none disabled:bg-[#F8F9FC]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Valid Until</label>
                      <DatePicker value={dlValidity} onChange={setDlValidity} />
                    </div>
                  </div>
                  {dlStatus !== "verified" && (
                    <div className="flex gap-2 mb-5">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Date of Birth (for verification)</label>
                        <DatePicker value={dlDob} onChange={setDlDob} minDate={DOB_MIN} maxDate={DOB_MAX} />
                      </div>
                      <button onClick={verifyDL} disabled={dlVerifying}
                        className="self-end px-4 py-2.5 rounded-xl bg-[#0F0F1A] text-white text-xs font-semibold whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5">
                        {dlVerifying ? <Loader2 size={13} className="animate-spin" /> : null}
                        {dlVerifying ? "Verifying..." : "Verify License"}
                      </button>
                    </div>
                  )}
                  {dlStatus === "verified" && (
                    <p className="flex items-center gap-1.5 mb-5 text-xs text-[#10B981]"><CheckCircle size={12} /> Driving Licence verified{savedDocs?.dl?.name ? ` — ${savedDocs.dl.name}` : ""}</p>
                  )}
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
