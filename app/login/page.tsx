"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { authAPI } from "@/lib/api";
import toast from "react-hot-toast";

const GOOGLE_SVG = (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";

  const [tab, setTab] = useState<"otp" | "google">("otp");
  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(45);
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const t = setInterval(() => setTimer((p) => p - 1), 1000);
      return () => clearInterval(t);
    }
    if (timer === 0) setCanResend(true);
  }, [step, timer]);

  const sendOtp = async () => {
    if (mobile.length < 10) return;
    setLoading(true);
    try {
      await authAPI.sendOtp(mobile);
      toast.success("OTP sent to +91 " + mobile);
      setStep(2);
      setTimer(45);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpStr = otp.join("");
    if (otpStr.length < 6) return;
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOtp(mobile, otpStr);
      // Save auth token + user info
      localStorage.setItem("vk_token", data.token);
      if (data.refreshToken) localStorage.setItem("vk_refresh_token", data.refreshToken);
      localStorage.setItem("vk_user", JSON.stringify(data.user));
      toast.success("Login successful!");
      router.push(redirect);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid OTP. Try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
    // Auto-submit when last digit entered
    if (val && idx === 5) {
      const full = [...next].join("");
      if (full.length === 6) setTimeout(() => verifyOtp(), 100);
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
    if (e.key === "Enter") verifyOtp();
  };

  const handleMobileKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && mobile.length === 10) sendOtp();
  };

  const resendOtp = async () => {
    setTimer(45);
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);
    try {
      await authAPI.sendOtp(mobile);
      toast.success("OTP resent!");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      toast.error("Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center px-4 py-16">
      <div className="fixed inset-0 bg-gradient-to-br from-[#0F0F1A]/5 to-[#E8540A]/5 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-[#E4E5EF]">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Image src="/logo.png" alt="Veekay Cabs" width={180} height={40} className="h-10 w-auto object-contain" priority />
          </div>

          {/* Tabs */}
          <div className="flex bg-[#F8F9FC] rounded-2xl p-1 mb-8">
            <button
              onClick={() => setTab("otp")}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                tab === "otp" ? "bg-white text-[#0F0F1A] shadow-sm" : "text-[#9090A8]"
              )}
            >
              <Phone size={14} />
              Mobile OTP
            </button>
            <button
              onClick={() => setTab("google")}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                tab === "google" ? "bg-white text-[#0F0F1A] shadow-sm" : "text-[#9090A8]"
              )}
            >
              {GOOGLE_SVG}
              Google Login
            </button>
          </div>

          {/* Mobile OTP Tab */}
          {tab === "otp" && (
            <div>
              {step === 1 ? (
                <div>
                  <h2 className="font-black font-syne text-2xl text-[#0F0F1A] mb-1">Welcome back!</h2>
                  <p className="text-[#9090A8] text-sm mb-6">Enter your mobile number to continue</p>

                  <div className="mb-4">
                    <label className="text-[#4A4A6A] text-xs font-semibold mb-1.5 block">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 py-3 bg-[#F8F9FC] border border-[#E4E5EF] rounded-xl">
                        <span className="text-[#0F0F1A] font-semibold text-sm">+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={handleMobileKeyDown}
                        placeholder="Enter 10-digit number"
                        autoFocus
                        className="flex-1 border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-3 text-sm text-[#0F0F1A] placeholder:text-[#9090A8] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={sendOtp}
                    disabled={mobile.length < 10 || loading}
                    className={cn(
                      "w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all",
                      mobile.length >= 10 && !loading
                        ? "btn-gradient"
                        : "bg-[#E4E5EF] cursor-not-allowed text-[#9090A8]"
                    )}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {loading ? "Sending OTP..." : "Get OTP"}
                  </button>

                  <p className="text-center text-xs text-[#9090A8] mt-4">
                    By continuing, you agree to our{" "}
                    <Link href="/terms" className="text-[#E8540A] hover:underline">Terms</Link>
                    {" & "}
                    <Link href="/privacy" className="text-[#E8540A] hover:underline">Privacy Policy</Link>
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="font-black font-syne text-2xl text-[#0F0F1A] mb-1">Verify your number</h2>
                  <div className="flex items-center gap-2 mb-6">
                    <p className="text-[#4A4A6A] text-sm">OTP sent to +91 {mobile}</p>
                    <button
                      onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); }}
                      className="text-[#E8540A] text-xs font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>

                  <label className="text-[#4A4A6A] text-xs font-semibold mb-3 block">Enter 6-Digit OTP</label>
                  <div className="flex gap-2 mb-5 justify-between">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpRefs.current[idx] = el; }}
                        type="number"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-12 h-12 text-center border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl text-lg font-bold text-[#0F0F1A] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-5">
                    {canResend ? (
                      <button onClick={resendOtp} className="text-[#E8540A] text-xs font-semibold hover:underline">
                        Resend OTP
                      </button>
                    ) : (
                      <p className="text-[#9090A8] text-xs">
                        Resend OTP in{" "}
                        <span className="font-bold text-[#0F0F1A]">
                          00:{String(timer).padStart(2, "0")}
                        </span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={verifyOtp}
                    disabled={otp.join("").length < 6 || loading}
                    className={cn(
                      "w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all",
                      otp.join("").length === 6 && !loading
                        ? "btn-gradient"
                        : "bg-[#E4E5EF] cursor-not-allowed text-[#9090A8]"
                    )}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {loading ? "Verifying..." : "Verify & Login"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Google Tab */}
          {tab === "google" && (
            <div className="py-4">
              <h2 className="font-black font-syne text-2xl text-[#0F0F1A] mb-1 text-center">Sign in with Google</h2>
              <p className="text-[#9090A8] text-sm mb-8 text-center">Quick and secure login with your Google account</p>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/google`}
                onClick={() => {
                  if (redirect && redirect !== "/account") {
                    localStorage.setItem("vk_login_redirect", redirect);
                  }
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border-2 border-[#E4E5EF] bg-white text-[#0F0F1A] font-semibold text-sm hover:border-[#E8540A]/50 hover:shadow-md transition-all shadow-sm"
              >
                {GOOGLE_SVG}
                Sign in with Google
              </a>
              <p className="text-center text-xs text-[#9090A8] mt-5">
                We only access your name and email address
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#9090A8] mt-5">
          <Link href="/" className="hover:text-[#E8540A] transition-colors">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-[#E8540A]" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
