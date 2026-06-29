"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Shield, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { authAPI, usersAPI } from "@/lib/api";

export default function AddMobilePage() {
  const router = useRouter();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authAPI.sendOtp(mobile);
      setStep("otp");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSave = async () => {
    if (otp.length < 4) {
      setError("Enter the OTP sent to your number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Verify OTP + save mobile in one call (won't create a new user)
      const res = await usersAPI.addMobile(mobile, otp);
      localStorage.setItem("vk_user", JSON.stringify(res.data.data));
      router.replace("/account");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_rgba(232,84,10,0.3)]">
            <span className="text-white font-black text-lg">VK</span>
          </div>
          <h1 className="text-[#0F0F1A] font-bold text-xl">
            Add Mobile Number
          </h1>
          <p className="text-[#9090A8] text-sm mt-1">
            Required to receive booking confirmations on WhatsApp
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-sm space-y-5">
          {step === "mobile" ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-2">
                  Mobile Number
                </label>
                <div className="flex items-center gap-2 px-4 py-3 border border-[#E4E5EF] rounded-xl bg-[#F8F9FC] focus-within:border-[#E8540A] transition-colors">
                  <span className="text-sm font-semibold text-[#0F0F1A]">
                    +91
                  </span>
                  <div className="w-px h-4 bg-[#E4E5EF]" />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, ""))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    className="flex-1 bg-transparent text-sm text-[#0F0F1A] placeholder:text-[#9090A8] outline-none"
                    autoFocus
                  />
                  <Phone size={15} className="text-[#9090A8]" />
                </div>
              </div>

              {error && <p className="text-xs text-[#EF4444]">{error}</p>}

              <button
                onClick={handleSendOtp}
                disabled={loading || mobile.length < 10}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#E8540A] text-white rounded-xl font-semibold text-sm hover:bg-[#c94508] disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
                Send OTP
              </button>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center mx-auto mb-3">
                  <Shield size={18} className="text-[#10B981]" />
                </div>
                <p className="text-sm font-semibold text-[#0F0F1A]">
                  OTP sent to +91 {mobile}
                </p>
                <button
                  onClick={() => {
                    setStep("mobile");
                    setOtp("");
                    setError("");
                  }}
                  className="text-xs text-[#E8540A] mt-1"
                >
                  Change number
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-2">
                  Enter OTP
                </label>
                <input
                  type="tel"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyAndSave()}
                  className="w-full text-center text-xl font-bold tracking-[0.5em] px-4 py-3 border border-[#E4E5EF] rounded-xl bg-[#F8F9FC] focus:outline-none focus:border-[#E8540A] transition-colors"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-xs text-[#EF4444] text-center">{error}</p>
              )}

              <button
                onClick={handleVerifyAndSave}
                disabled={loading || otp.length < 4}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#E8540A] text-white rounded-xl font-semibold text-sm hover:bg-[#c94508] disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Verify & Continue
              </button>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full text-xs text-[#9090A8] hover:text-[#E8540A] transition-colors"
              >
                Resend OTP
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#9090A8] mt-4">
          Your number is used only for booking updates via WhatsApp
        </p>
      </div>
    </div>
  );
}
