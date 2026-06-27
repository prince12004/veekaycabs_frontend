"use client";

import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { FileText, Printer } from "lucide-react";

const sections = [
  {
    id: "eligibility",
    title: "1. Eligibility",
    content: `To rent a vehicle from Veekay Cabs, you must:
• Be at least 21 years of age
• Hold a valid Indian driving licence (minimum 1 year old from issue date)
• Have a valid Aadhaar Card and PAN Card
• Complete KYC verification before the booking date
• Not be under the influence of alcohol or controlled substances while driving

We reserve the right to deny rental to anyone who does not meet these criteria.`,
  },
  {
    id: "booking-payment",
    title: "2. Booking & Payment",
    content: `• A non-refundable token amount is required at the time of booking to confirm your reservation.
• The remaining balance is due at the time of vehicle pickup.
• Bookings are confirmed only after successful payment processing.
• Veekay Cabs accepts online payments via Razorpay (cards, UPI, net banking) and offline payments at pickup.
• Booking ID format: DL_{CarName}_{UserName}_{4digits}_{year}
• GST (18%) is applicable on all rental charges.`,
  },
  {
    id: "fuel-policy",
    title: "3. Fuel Policy",
    content: `• All vehicles are provided with a full fuel tank.
• The vehicle must be returned with the same fuel level.
• If returned with less fuel, charges will be deducted from the security deposit at Rs. 120/litre (petrol), Rs. 100/litre (diesel).
• Fuel expenses during the rental period are entirely the renter's responsibility.
• CNG and Electric vehicle charging costs are the renter's responsibility.`,
  },
  {
    id: "km-limits",
    title: "4. KM Limits & Extra Charges",
    content: `• Standard package: 250 km per day included.
• Extra kilometres are charged at Rs. 12/km (Hatchback/Sedan), Rs. 15/km (SUV/MUV), Rs. 20/km (Luxury).
• Odometer readings are checked at pickup and return.
• Tampering with the odometer or GPS is a criminal offence and will result in immediate termination of the rental and full security deposit forfeiture.`,
  },
  {
    id: "speed-limit",
    title: "5. Speed Limits",
    content: `• Maximum permitted speed: 120 km/hr on highways.
• Speed limits within city limits as per traffic rules (typically 40–80 km/hr).
• Our vehicles are GPS-tracked. Overspeeding alerts are generated automatically.
• Repeated overspeeding may result in immediate termination of rental without refund.
• Traffic challans/fines incurred during the rental period are the renter's sole responsibility.`,
  },
  {
    id: "security-deposit",
    title: "6. Security Deposit",
    content: `• A refundable security deposit of Rs. 10,000 is collected at the time of vehicle pickup.
• The deposit will be refunded within 7 working days of vehicle return, subject to:
  - No damage to the vehicle
  - No traffic violations
  - Vehicle returned on time and with full fuel
  - No outstanding dues
• In case of damage, repair costs will be deducted from the security deposit.
• If repair costs exceed the deposit amount, the renter is liable for the difference.`,
  },
  {
    id: "cancellation",
    title: "7. Cancellation Policy",
    content: `• 24+ hours before pickup: 100% refund of token amount
• 12–24 hours before pickup: 75% refund
• 6–12 hours before pickup: 50% refund
• Less than 6 hours before pickup: No refund
• Cancellations must be made via the app or by calling our support.
• No-shows will be treated as less-than-6-hour cancellations.`,
  },
  {
    id: "damage-liability",
    title: "8. Damage & Liability",
    content: `• The renter is fully responsible for any damage to the vehicle during the rental period.
• In case of accident, the renter must immediately notify Veekay Cabs and local police.
• The renter must not attempt to repair the vehicle without prior approval from Veekay Cabs.
• Third-party claims arising from accidents are the renter's liability.
• Interior damage (torn seats, broken parts, stains requiring professional cleaning) will be charged separately.`,
  },
  {
    id: "prohibited",
    title: "9. Prohibited Uses",
    content: `The vehicle must NOT be used for:
• Commercial taxi/cab services (including aggregator platforms like Ola/Uber)
• Racing, off-roading, or stunt driving
• Transporting illegal goods or substances
• Travelling outside India
• Subletting or lending to a third party
• Towing other vehicles
• Driving under influence of alcohol or drugs

Violation of any of the above will result in immediate termination and full security deposit forfeiture.`,
  },
  {
    id: "privacy",
    title: "10. Privacy & Data",
    content: `• We collect personal information (name, mobile, Aadhaar, PAN, DL) for KYC verification purposes only.
• Aadhaar numbers are stored in masked format (XXXX XXXX 1234).
• Vehicle GPS data is monitored for safety and compliance.
• We do not sell your personal data to third parties.
• For full details, please refer to our Privacy Policy.`,
  },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("eligibility");

  return (
    <PageLayout>
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#0F0F1A] to-[#1C1C2E] py-20 pt-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8540A]/10 border border-[#E8540A]/25 text-[#E8540A] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <FileText size={14} />
            Legal
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white font-syne mb-4">
            Terms & Conditions
          </h1>
          <p className="text-white/60 text-lg">Last updated: June 1, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="lg:grid lg:grid-cols-4 lg:gap-10">
          {/* TOC Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-xs font-bold uppercase tracking-widest text-[#9090A8] mb-4">Contents</p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSection(s.id);
                      document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
                      activeSection === s.id
                        ? "bg-[#FFF3ED] text-[#E8540A] font-semibold"
                        : "text-[#4A4A6A] hover:text-[#E8540A] hover:bg-gray-50"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </nav>
              <button
                onClick={() => window.print()}
                className="mt-6 flex items-center gap-2 text-sm text-[#9090A8] hover:text-[#E8540A] transition-colors"
              >
                <Printer size={14} />
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* Article */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#E4E5EF] p-8 lg:p-12 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
              <p className="text-[#4A4A6A] leading-relaxed mb-8 text-base border-l-4 border-[#E8540A] pl-4 bg-[#FFF3ED] py-3 pr-4 rounded-r-lg">
                Please read these Terms & Conditions carefully before renting a vehicle from Veekay Cabs. By completing a booking, you agree to be bound by these terms.
              </p>

              <div className="space-y-10">
                {sections.map((section) => (
                  <div key={section.id} id={section.id} className="scroll-mt-28">
                    <h2 className="text-xl font-bold text-[#0F0F1A] mb-4 font-syne flex items-center gap-3">
                      <span className="w-2 h-6 bg-[#E8540A] rounded-full inline-block" />
                      {section.title}
                    </h2>
                    <div className="text-[#4A4A6A] leading-relaxed whitespace-pre-line text-sm">
                      {section.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-[#E4E5EF] text-center">
                <p className="text-[#9090A8] text-sm mb-2">
                  Questions about these terms?
                </p>
                <a
                  href="mailto:sales@veekaycabs.com"
                  className="text-[#E8540A] font-semibold hover:underline"
                >
                  sales@veekaycabs.com
                </a>
                <span className="text-[#9090A8] mx-3">|</span>
                <a
                  href="tel:+919999926867"
                  className="text-[#E8540A] font-semibold hover:underline"
                >
                  +91 99999 26867
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
