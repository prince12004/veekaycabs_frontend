"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import {
  ArrowLeft, Loader2, MapPin, ChevronRight, Shield, Clock,
  Headphones, Phone, ShieldCheck, Sparkles,
} from "lucide-react";
import { tempoSeoPagesAPI } from "@/lib/api";

interface SeoPageDetail {
  _id: string;
  pageName: string;
  pageSlug: string;
  metaTitle: string;
  metaDescription: string;
  h1Tag?: string;
  content?: string;
}

interface SeoPageRow {
  pageName: string;
  pageSlug: string;
}

const TRUST_BADGES = [
  { icon: Shield, label: "Verified Fleet" },
  { icon: Clock, label: "60-Sec Booking" },
  { icon: MapPin, label: "Doorstep Pickup" },
  { icon: Headphones, label: "24/7 Support" },
];

// Rendered as a fallback on /tempo-traveller/[slug] whenever the slug isn't a
// real tempo vehicle (fetchTempo returns null) but a matching SEO location
// page exists — same content-article pattern as CarSeoLandingClient on
// /car/[slug], just pointed at the Tempo Traveller fleet instead of self-drive cars.
export default function TempoSeoLandingClient({ initialPage }: { initialPage?: SeoPageDetail | null }) {
  const params = useParams();
  const slug = String(params.slug);

  const [page, setPage] = useState<SeoPageDetail | null>(initialPage ?? null);
  const [loading, setLoading] = useState(!initialPage);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState<SeoPageRow[]>([]);

  useEffect(() => {
    if (initialPage) return;
    setLoading(true);
    setNotFound(false);
    tempoSeoPagesAPI.getBySlug(slug)
      .then(({ data }) => setPage(data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, initialPage]);

  useEffect(() => {
    tempoSeoPagesAPI.getAll()
      .then(({ data }) => setRelated((data?.data || []).filter((p: SeoPageRow) => p.pageSlug !== slug).slice(0, 8)))
      .catch(() => setRelated([]));
  }, [slug]);

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#E8540A]" />
        </div>
      </PageLayout>
    );
  }

  if (notFound || !page) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
          <MapPin size={40} className="text-[#E4E5EF] mb-4" />
          <p className="text-[#0F0F1A] font-bold mb-2">Page not found</p>
          <Link href="/" className="text-[#E8540A] font-semibold text-sm hover:underline">Back to Home</Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F0F1A] to-[#1C1C2E] pt-32 pb-16">
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-[#E8540A] rounded-full opacity-[0.15] blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FF9A3C] rounded-full opacity-[0.08] blur-[110px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Link href="/tempo-traveller" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm">
            <ArrowLeft size={16} /> Back to Tempo Traveller
          </Link>
          <div className="inline-flex items-center gap-1.5 bg-[#E8540A]/15 text-[#FF9A3C] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5 mx-auto">
            <Sparkles size={12} /> Tempo Traveller Hire
          </div>
          <h1 className="text-3xl lg:text-5xl font-black text-white font-syne leading-tight max-w-3xl mx-auto">
            {page.h1Tag || page.pageName}
          </h1>
          {page.metaDescription && (
            <p className="text-white/60 text-base lg:text-lg leading-relaxed max-w-2xl mx-auto mt-5">
              {page.metaDescription}
            </p>
          )}

          {/* CTA row */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link href="/tempo-traveller/listing" className="btn-gradient px-7 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2">
              Book Now <ChevronRight size={16} />
            </Link>
            <a
              href="https://wa.me/919999926867"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/50 transition-all"
            >
              <Phone size={16} className="text-[#E8540A]" />
              WhatsApp Us
            </a>
            <a href="tel:+919999926867" className="text-white/60 text-sm hover:text-white transition-colors font-medium">
              +91 99999 26867
            </a>
          </div>
        </div>
      </section>

      {/* Trust badges strip */}
      <section className="bg-white border-b border-[#E4E5EF]">
        <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF3ED] flex items-center justify-center shrink-0">
                <Icon size={16} className="text-[#E8540A]" />
              </div>
              <span className="text-[#0F0F1A] text-sm font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 bg-[#F8F9FC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lg:grid lg:grid-cols-4 lg:gap-10">
            {/* Article */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-[#E4E5EF] p-8 lg:p-12 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                {page.content ? (
                  <div
                    className="text-[#4A4A6A] leading-relaxed [&_h2]:text-2xl [&_h2]:font-black [&_h2]:font-syne [&_h2]:text-[#0F0F1A] [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#0F0F1A] [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1.5 [&_strong]:text-[#0F0F1A] [&_strong]:font-bold [&_a]:text-[#E8540A] [&_a]:underline [&_img]:rounded-xl [&_img]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[#E4E5EF] [&_td]:p-2 [&_table]:my-4 [&_table]:block [&_table]:overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                ) : (
                  <p className="text-[#9090A8] text-sm">Content coming soon.</p>
                )}
              </div>

              {/* CTA */}
              <div className="mt-8 bg-gradient-to-r from-[#E8540A] to-[#FF6B35] rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-black text-white font-syne mb-2">Ready to Travel Together?</h3>
                <p className="text-white/80 mb-6">Book a Tempo Traveller for your next group trip. 9 to 26 seater AC fleet, verified drivers.</p>
                <Link href="/tempo-traveller/listing" className="bg-white text-[#E8540A] font-bold px-8 py-3 rounded-xl hover:bg-[#FFF3ED] transition-colors inline-flex items-center gap-2">
                  Book Now <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <div className="mt-10 lg:mt-0">
              <div className="sticky top-28 space-y-6">
                {/* Quick book card */}
                <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  <div className="w-11 h-11 rounded-xl bg-[#FFF3ED] flex items-center justify-center mb-4">
                    <ShieldCheck size={20} className="text-[#E8540A]" />
                  </div>
                  <p className="font-bold text-[#0F0F1A] font-syne mb-1">Book in 60 Seconds</p>
                  <p className="text-[#9090A8] text-sm mb-5">No paperwork hassle. Verified fleet, transparent pricing.</p>
                  <Link href="/tempo-traveller/listing" className="btn-gradient w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm mb-3">
                    Book Now <ChevronRight size={15} />
                  </Link>
                  <a href="tel:+919999926867" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E4E5EF] text-[#0F0F1A] font-semibold text-sm hover:border-[#E8540A] hover:text-[#E8540A] transition-colors">
                    <Phone size={14} /> +91 99999 26867
                  </a>
                </div>

                {/* Related searches */}
                {related.length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#9090A8] mb-4">Popular Searches</p>
                    <ul className="space-y-2.5">
                      {related.map((p) => (
                        <li key={p.pageSlug}>
                          <Link
                            href={`/tempo-traveller/${p.pageSlug}`}
                            className="text-[#4A4A6A] text-sm hover:text-[#E8540A] transition-colors block leading-snug"
                          >
                            {p.pageName}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
