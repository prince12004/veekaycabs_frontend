"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { CheckCircle, Clock, XCircle, AlertCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    id: "aadhaar",
    label: "Aadhaar Card",
    desc: "Front and back photo + Aadhaar number",
    status: "verified",
    icon: "🪪",
  },
  {
    id: "pan",
    label: "PAN Card",
    desc: "PAN card photo + PAN number",
    status: "verified",
    icon: "💳",
  },
  {
    id: "dl",
    label: "Driving Licence",
    desc: "Front and back photo + DL number + validity",
    status: "pending",
    icon: "🚗",
  },
];

const statusConfig = {
  verified: { icon: CheckCircle, color: "#10B981", bg: "#D1FAE5", label: "Verified" },
  pending: { icon: Clock, color: "#F59E0B", bg: "#FEF3C7", label: "Under Review" },
  rejected: { icon: XCircle, color: "#EF4444", bg: "#FEE2E2", label: "Rejected" },
  not_submitted: { icon: AlertCircle, color: "#9090A8", bg: "#F1F2F7", label: "Not Submitted" },
};

export default function VerificationPage() {
  const allVerified = steps.every(s => s.status === "verified");
  const hasPending = steps.some(s => s.status === "pending");

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F8F9FC] pt-28 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-[#0F0F1A] font-syne">Verification Status</h1>
            <p className="text-[#4A4A6A] mt-2">Track your KYC verification progress</p>
          </div>

          {/* Overall status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 mb-8 border ${
              allVerified
                ? "bg-[#D1FAE5] border-[#10B981]/30"
                : hasPending
                ? "bg-[#FEF3C7] border-[#F59E0B]/30"
                : "bg-[#FFF3ED] border-[#E8540A]/30"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${allVerified ? "bg-[#10B981]" : hasPending ? "bg-[#F59E0B]" : "bg-[#E8540A]"}`}>
                <span className="text-white text-2xl">{allVerified ? "✓" : hasPending ? "⏳" : "!"}</span>
              </div>
              <div>
                <h2 className={`font-bold text-lg ${allVerified ? "text-[#065F46]" : hasPending ? "text-[#92400E]" : "text-[#E8540A]"}`}>
                  {allVerified ? "KYC Fully Verified! You can book any car." : hasPending ? "KYC Under Review — Usually takes 2-4 hours" : "KYC Incomplete — Please upload all documents"}
                </h2>
                <p className={`text-sm mt-1 ${allVerified ? "text-[#065F46]/70" : hasPending ? "text-[#92400E]/70" : "text-[#E8540A]/70"}`}>
                  {allVerified
                    ? "All documents verified. Security deposit: Rs. 10,000."
                    : hasPending
                    ? "Our team reviews documents during 9 AM – 9 PM."
                    : "Upload remaining documents to complete verification."}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 mb-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#0F0F1A]">KYC Progress</h3>
              <span className="text-[#E8540A] font-bold text-sm">
                {steps.filter(s => s.status === "verified").length}/{steps.length} Complete
              </span>
            </div>
            <div className="h-2 bg-[#F1F2F7] rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(steps.filter(s => s.status === "verified").length / steps.length) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#E8540A] to-[#FF9A3C] rounded-full"
              />
            </div>

            {/* Step checklist */}
            <div className="space-y-4">
              {steps.map((step, i) => {
                const sc = statusConfig[step.status as keyof typeof statusConfig];
                const StatusIcon = sc.icon;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[#E4E5EF] hover:border-[#E8540A]/30 transition-colors"
                  >
                    <span className="text-2xl">{step.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-[#0F0F1A]">{step.label}</p>
                      <p className="text-[#9090A8] text-sm">{step.desc}</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.color }}>
                      <StatusIcon size={14} />
                      {sc.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {!allVerified && (
              <Link href="/account/documents" className="btn-gradient w-full py-4 rounded-xl text-white font-bold text-center flex items-center justify-center gap-2">
                Upload Documents <ArrowRight size={18} />
              </Link>
            )}
            <Link href="/account" className="w-full py-3.5 rounded-xl border-[1.5px] border-[#E4E5EF] text-[#4A4A6A] font-semibold text-center hover:border-[#E8540A] hover:text-[#E8540A] transition-all">
              Back to Dashboard
            </Link>
          </div>

          {/* Requirements */}
          <div className="mt-8 bg-[#DBEAFE] border border-blue-200 rounded-2xl p-6">
            <h4 className="font-bold text-[#1E40AF] mb-3">📋 Requirements for KYC</h4>
            <ul className="space-y-2 text-[#1E40AF] text-sm">
              <li>• Age must be 21 years or above</li>
              <li>• Driving Licence must be at least 1 year old from issue date</li>
              <li>• All documents must match the same name</li>
              <li>• Documents must be valid and not expired</li>
              <li>• Clear photos — no blur, no glare</li>
            </ul>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
