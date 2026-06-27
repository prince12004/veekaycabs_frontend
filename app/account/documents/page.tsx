"use client";

import { useState } from "react";
import { Upload, CheckCircle, AlertCircle, Eye } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { cn } from "@/lib/utils";

const STEPS = ["Aadhaar", "PAN", "Driving Licence"];

type DocStatus = "not_uploaded" | "uploaded" | "verified" | "rejected";

interface DocSection {
  front: File | null;
  back: File | null;
  number: string;
  validity?: string;
  status: DocStatus;
}

const STATUS_CONFIG: Record<DocStatus, { label: string; class: string }> = {
  not_uploaded: { label: "Not Uploaded", class: "bg-[#F1F2F7] text-[#9090A8]" },
  uploaded: { label: "Under Review", class: "bg-[#FEF3C7] text-[#92400E]" },
  verified: { label: "Verified", class: "bg-[#D1FAE5] text-[#065F46]" },
  rejected: { label: "Rejected", class: "bg-[#FEE2E2] text-[#991B1B]" },
};

function UploadBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className={cn(
      "flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-all group",
      value
        ? "border-[#10B981] bg-[#D1FAE5]/30"
        : "border-[#E4E5EF] hover:border-[#E8540A]/60 hover:bg-[#FFF3ED]"
    )}>
      <input
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {value ? (
        <div className="text-center">
          <CheckCircle size={28} className="text-[#10B981] mx-auto mb-1" />
          <p className="text-[#10B981] text-xs font-semibold">Uploaded</p>
          <p className="text-[#9090A8] text-[10px] mt-0.5 truncate max-w-[160px] px-2">{value.name}</p>
        </div>
      ) : (
        <div className="text-center">
          <Upload size={24} className="text-[#9090A8] mx-auto mb-2 group-hover:text-[#E8540A] transition-colors" />
          <p className="text-[#4A4A6A] text-xs font-semibold">{label}</p>
          <p className="text-[#9090A8] text-[10px] mt-1">Click or drag to upload</p>
          <p className="text-[#9090A8] text-[10px]">JPG, PNG or PDF (max 5MB)</p>
        </div>
      )}
    </label>
  );
}

export default function DocumentsPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [aadhaar, setAadhaar] = useState<DocSection>({
    front: null,
    back: null,
    number: "",
    status: "verified",
  });

  const [pan, setPan] = useState<DocSection>({
    front: null,
    back: null,
    number: "",
    status: "verified",
  });

  const [dl, setDl] = useState<DocSection>({
    front: null,
    back: null,
    number: "",
    validity: "",
    status: "not_uploaded",
  });

  const handleSubmit = () => setSubmitted(true);

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F8F9FC] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="mb-8">
            <h1 className="font-black font-syne text-3xl text-[#0F0F1A]">KYC Documents</h1>
            <p className="text-[#9090A8] text-sm mt-1">Upload and verify your identity documents to unlock bookings</p>
          </div>

          {/* 3-Step Progress */}
          <div className="flex items-center mb-10">
            {STEPS.map((step, idx) => {
              const status = [aadhaar.status, pan.status, dl.status][idx];
              const isComplete = status === "verified";
              const isActive = idx === currentStep;
              return (
                <div key={step} className="flex items-center flex-1">
                  <button
                    onClick={() => setCurrentStep(idx)}
                    className="flex flex-col items-center group"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all mb-1.5",
                      isComplete
                        ? "bg-[#10B981] text-white"
                        : isActive
                          ? "bg-[#E8540A] text-white ring-4 ring-[#E8540A]/20"
                          : "bg-white border-2 border-[#E4E5EF] text-[#9090A8]"
                    )}>
                      {isComplete ? <CheckCircle size={16} /> : idx + 1}
                    </div>
                    <p className={cn(
                      "text-xs font-semibold",
                      isActive ? "text-[#E8540A]" : isComplete ? "text-[#10B981]" : "text-[#9090A8]"
                    )}>
                      {step}
                    </p>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2 mb-5 transition-all",
                      status === "verified" ? "bg-[#10B981]" : "bg-[#E4E5EF]"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl border border-[#E4E5EF] p-12 text-center shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="font-black font-syne text-[#0F0F1A] text-2xl mb-2">Documents Submitted!</h3>
              <p className="text-[#4A4A6A] text-sm mb-2">Our team will verify your documents within 2-4 hours.</p>
              <p className="text-[#9090A8] text-xs">You&apos;ll receive an SMS notification once verified.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* AADHAAR */}
              {currentStep === 0 && (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold font-syne text-[#0F0F1A] text-lg flex items-center gap-2">
                      📋 Aadhaar Card
                    </h3>
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full", STATUS_CONFIG[aadhaar.status].class)}>
                      {STATUS_CONFIG[aadhaar.status].label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="text-xs font-semibold text-[#4A4A6A] mb-2">Front Side</p>
                      <UploadBox
                        label="Front of Aadhaar"
                        value={aadhaar.front}
                        onChange={(f) => setAadhaar({ ...aadhaar, front: f })}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#4A4A6A] mb-2">Back Side</p>
                      <UploadBox
                        label="Back of Aadhaar"
                        value={aadhaar.back}
                        onChange={(f) => setAadhaar({ ...aadhaar, back: f })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Aadhaar Number</label>
                    <input
                      type="text"
                      maxLength={14}
                      value={aadhaar.number}
                      onChange={(e) => setAadhaar({ ...aadhaar, number: e.target.value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ") })}
                      placeholder="XXXX XXXX XXXX"
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest"
                    />
                    {aadhaar.status === "verified" && (
                      <p className="flex items-center gap-1.5 mt-1.5 text-xs text-[#10B981]">
                        <CheckCircle size={12} />
                        Aadhaar verified successfully
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentStep(1)}
                    className="mt-5 btn-gradient px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
                  >
                    Continue to PAN →
                  </button>
                </div>
              )}

              {/* PAN */}
              {currentStep === 1 && (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">🪪 PAN Card</h3>
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full", STATUS_CONFIG[pan.status].class)}>
                      {STATUS_CONFIG[pan.status].label}
                    </span>
                  </div>

                  <div className="mb-5">
                    <p className="text-xs font-semibold text-[#4A4A6A] mb-2">PAN Card Photo</p>
                    <UploadBox
                      label="PAN Card"
                      value={pan.front}
                      onChange={(f) => setPan({ ...pan, front: f })}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">PAN Number</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={pan.number}
                      onChange={(e) => setPan({ ...pan, number: e.target.value.toUpperCase() })}
                      placeholder="ABCDE1234F"
                      className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest uppercase"
                    />
                    {pan.status === "verified" && (
                      <p className="flex items-center gap-1.5 mt-1.5 text-xs text-[#10B981]">
                        <CheckCircle size={12} />
                        PAN verified successfully
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setCurrentStep(0)} className="px-5 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] text-sm font-semibold">
                      ← Back
                    </button>
                    <button onClick={() => setCurrentStep(2)} className="btn-gradient px-6 py-2.5 rounded-xl text-white font-semibold text-sm">
                      Continue to DL →
                    </button>
                  </div>
                </div>
              )}

              {/* DRIVING LICENCE */}
              {currentStep === 2 && (
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">🚗 Driving Licence</h3>
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full", STATUS_CONFIG[dl.status].class)}>
                      {STATUS_CONFIG[dl.status].label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="text-xs font-semibold text-[#4A4A6A] mb-2">Front Side</p>
                      <UploadBox label="Front of DL" value={dl.front} onChange={(f) => setDl({ ...dl, front: f })} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#4A4A6A] mb-2">Back Side</p>
                      <UploadBox label="Back of DL" value={dl.back} onChange={(f) => setDl({ ...dl, back: f })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">DL Number</label>
                      <input
                        type="text"
                        value={dl.number}
                        onChange={(e) => setDl({ ...dl, number: e.target.value.toUpperCase() })}
                        placeholder="DL-0420110012345"
                        className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#4A4A6A] mb-1.5 block">Valid Until</label>
                      <input
                        type="date"
                        value={dl.validity}
                        onChange={(e) => setDl({ ...dl, validity: e.target.value })}
                        className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  {/* Important Rules */}
                  <div className="bg-[#FFF3ED] border border-[#E8540A]/20 rounded-xl p-4 mb-5 space-y-2">
                    <p className="text-[#E8540A] text-xs font-bold uppercase tracking-wider">Important Rules</p>
                    {[
                      "DL must be at least 1 year old",
                      "Minimum age to rent: 21 years",
                      "All documents must have matching name",
                      "DL must be valid throughout the trip",
                    ].map((rule) => (
                      <div key={rule} className="flex items-center gap-2">
                        <AlertCircle size={11} className="text-[#E8540A] shrink-0" />
                        <p className="text-[#E8540A] text-xs">{rule}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setCurrentStep(1)} className="px-5 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] text-sm font-semibold">
                      ← Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 btn-gradient py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <Eye size={14} />
                      Submit for Verification
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
