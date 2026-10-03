"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { CheckCircle2, Phone, Calendar } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";

  return (
    <PageLayout>
      {/* Event snippet for booking complete conversion page — fires once,
          here, as soon as the Thank You page itself loads (not inside the
          payment handler), since this is the literal "thank you page" the
          snippet is meant for. */}
      {bookingId && (
        <Script id="gtag-booking-conversion" strategy="afterInteractive">
          {`
            gtag('event', 'conversion', {
                'send_to': 'AW-18348859511/-UPkCJiw_o0dEPfAta1E',
                'transaction_id': '${bookingId}'
            });
          `}
        </Script>
      )}

      <div className="min-h-[75vh] bg-[#F8F9FC] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-[#10B981]" />
          </div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne mb-2">Booking Confirmed!</h1>
          <p className="text-[#4A4A6A] text-sm mb-6">
            Thank you for choosing Veekay Cabs. We&apos;ve sent the details to your registered mobile number.
          </p>

          {bookingId && (
            <div className="bg-[#F8F9FC] border border-[#E4E5EF] rounded-xl px-4 py-3 mb-6">
              <p className="text-[10px] font-bold text-[#9090A8] uppercase tracking-wider mb-0.5">Booking ID</p>
              <p className="font-mono font-bold text-[#0F0F1A] text-sm">{bookingId}</p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/account/history"
              className="flex items-center justify-center gap-2 w-full bg-[#E8540A] hover:bg-[#c94508] text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              <Calendar size={16} /> View My Bookings
            </Link>
            <a
              href="tel:+919999926867"
              className="flex items-center justify-center gap-2 w-full border border-[#E4E5EF] hover:border-[#E8540A]/50 hover:text-[#E8540A] text-[#4A4A6A] font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <Phone size={16} /> Need help? Call us
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouContent />
    </Suspense>
  );
}
