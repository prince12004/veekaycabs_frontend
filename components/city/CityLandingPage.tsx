import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { COMPANY_INFO } from "@/lib/constants";
import { Truck, ShieldCheck, Eye, Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import type { CityPageData } from "@/lib/cityPages";

const highlights = [
  { icon: Truck, title: "Doorstep Delivery", desc: "We deliver the car to your home, office, or the airport — no counter, no queue." },
  { icon: ShieldCheck, title: "Verified & Insured", desc: "Every car is KYC-verified, GPS-enabled, and fully insured before it reaches you." },
  { icon: Eye, title: "Transparent Pricing", desc: "The price you see at booking is the price you pay. No hidden charges." },
  { icon: Clock, title: "24/7 Support", desc: "Our support team is available round the clock for any help during your trip." },
];

export default function CityLandingPage({ data }: { data: CityPageData }) {
  const whatsappNumber = COMPANY_INFO.whatsapp.replace(/\D/g, "");

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative min-h-[55vh] bg-gradient-to-br from-[#0F0F1A] via-[#1C1C2E] to-[#0F0F1A] flex items-center justify-center pt-20">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #E8540A 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-20">
          <div className="inline-flex items-center gap-2 bg-[#E8540A]/10 border border-[#E8540A]/25 text-[#E8540A] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            ✦ {data.name}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-syne leading-tight mb-6">
            Self Drive Cars in{" "}
            <span className="bg-gradient-to-r from-[#E8540A] to-[#FF9A3C] bg-clip-text text-transparent">
              {data.name}
            </span>
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            {data.heroSubtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/book?city=${data.slug}`}
              className="bg-[#E8540A] hover:bg-[#d64a08] text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Book a Self Drive Car in {data.name}
            </Link>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/5 border border-white/15 hover:border-[#25D366]/50 hover:text-[#25D366] text-white font-semibold px-6 py-4 rounded-xl transition-colors"
            >
              <MessageCircle size={18} /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#4A4A6A] text-lg leading-relaxed">{data.intro}</p>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16 bg-[#F7F7FB]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F0F1A] font-syne text-center mb-12">
            Why Rent a Self Drive Car in {data.name} with Veekay Cabs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 border border-[#E4E5EF] shadow-sm"
              >
                <div className="w-11 h-11 rounded-xl bg-[#E8540A]/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#E8540A]" />
                </div>
                <h3 className="font-bold text-[#0F0F1A] mb-2">{title}</h3>
                <p className="text-[#4A4A6A] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas served */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F0F1A] font-syne text-center mb-10">
            Self Drive Car Delivery Across {data.name}
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {data.areas.map((area) => (
              <span
                key={area}
                className="flex items-center gap-1.5 bg-[#F7F7FB] border border-[#E4E5EF] text-[#4A4A6A] text-sm font-medium px-4 py-2 rounded-full"
              >
                <MapPin size={14} className="text-[#E8540A]" /> {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-br from-[#0F0F1A] via-[#1C1C2E] to-[#0F0F1A]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-syne mb-4">
            Ready to Drive in {data.name}?
          </h2>
          <p className="text-white/70 mb-8">
            Pick your car, choose your dates, and get it delivered to your doorstep in {data.name}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/book?city=${data.slug}`}
              className="bg-[#E8540A] hover:bg-[#d64a08] text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Book Now
            </Link>
            <a
              href={`tel:${COMPANY_INFO.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 bg-white/5 border border-white/15 hover:border-[#E8540A]/50 hover:text-[#E8540A] text-white font-semibold px-6 py-4 rounded-xl transition-colors"
            >
              <Phone size={18} /> {COMPANY_INFO.phone}
            </a>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
