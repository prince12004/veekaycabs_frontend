import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function GoogleErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] flex items-center justify-center mb-5">
        <AlertCircle size={26} className="text-[#EF4444]" />
      </div>
      <h1 className="text-2xl font-bold font-syne text-[#0F0F1A] mb-2">Google sign-in failed</h1>
      <p className="text-[#9090A8] text-sm mb-6 max-w-sm">
        We couldn&apos;t sign you in with Google. Please try again or use mobile OTP instead.
      </p>
      <Link href="/login" className="btn-gradient px-6 py-3 rounded-xl text-white font-semibold text-sm">
        Back to Login
      </Link>
    </div>
  );
}
