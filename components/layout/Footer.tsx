"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  X,
  Search,
} from "lucide-react";
import { carSeoPagesAPI } from "@/lib/api";
import { CITY_PAGES } from "@/lib/cityPages";

// lucide-react has no dedicated Pinterest glyph — a minimal inline mark instead
// of pulling in a whole brand-icon package for one icon.
function PinterestIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.017 0C5.396 0 0 5.396 0 12.017c0 5.084 3.163 9.42 7.627 11.174-.105-.949-.2-2.406.042-3.443.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.194-.332 1.361-.052.221-.174.267-.401.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.621 0 12.017-5.396 12.017-12.017C24.034 5.396 18.638 0 12.017 0z" />
    </svg>
  );
}

const quickLinks = [
  { href: "/book", label: "Self Drive Rental" },
  { href: "/tempo-traveller", label: "Tempo Traveller" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cancellation", label: "Cancellation Policy" },
  { href: "/sitemap", label: "Sitemap" },
];

const socialLinks = [
  { icon: Facebook, href: "https://www.facebook.com/veekaycabs/", label: "Facebook" },
  { icon: Instagram, href: "https://www.instagram.com/veekay_cabs/", label: "Instagram" },
  { icon: PinterestIcon, href: "https://in.pinterest.com/veekay_cabs/", label: "Pinterest" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/veekaycabs/", label: "LinkedIn" },
  { icon: X, href: "https://x.com/veekaycabs", label: "X (Twitter)" },
];

export default function Footer() {
  const [seoPages, setSeoPages] = useState<{ pageName: string; pageSlug: string }[]>([]);
  const [showSeoModal, setShowSeoModal] = useState(false);

  // Fetched unconditionally (not gated behind the click) so the links exist
  // in the page as soon as it loads — this list exists for internal-linking
  // SEO value, which only counts if the links are actually in the DOM.
  useEffect(() => {
    carSeoPagesAPI.getAll()
      .then(({ data }) => setSeoPages(data?.data || []))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-gradient-to-b from-[#0F0F1A] to-[#080810]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/" className="flex items-center group">
            <Image
              src="/logowhite.png"
              alt="Veekay Cabs"
              width={160}
              height={29}
              className="h-9 w-auto object-contain group-hover:opacity-90 transition-opacity"
              priority
            />
          </Link>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Delhi NCR&apos;s premier self-drive car rental platform. Drive
              your adventure with us since 2003.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-[#E8540A] hover:border-[#E8540A] hover:text-white transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/50 text-sm hover:text-[#E8540A] hover:pl-2 transition-all duration-200 block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {seoPages.length > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => setShowSeoModal(true)}
                    className="flex items-center gap-1.5 text-white/50 text-sm hover:text-[#E8540A] hover:pl-2 transition-all duration-200"
                  >
                    <Search size={13} /> Popular Searches
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs mb-5">
              Our Cities
            </h4>
            <ul className="space-y-3">
              {CITY_PAGES.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={`/self-drive-cars-in-${city.slug}`}
                    className="text-white/50 text-sm hover:text-[#E8540A] hover:pl-2 transition-all duration-200 block"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs mb-5">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPin
                  size={16}
                  className="text-[#E8540A] mt-1 shrink-0"
                />
                <p className="text-white/50 text-sm leading-relaxed">
                  A 13, 1st Floor, Ganesh Nagar, New Delhi 110092
                </p>
              </li>
              <li className="flex gap-3">
                <MapPin
                  size={16}
                  className="text-[#E8540A] mt-1 shrink-0"
                />
                <p className="text-white/50 text-sm leading-relaxed">
                  Flat 1007, Skyline Plaza-3, Sushant Golf City, Lucknow
                </p>
              </li>
              <li className="flex gap-3">
                <Phone
                  size={16}
                  className="text-[#E8540A] mt-0.5 shrink-0"
                />
                <div className="text-white/50 text-sm space-y-1">
                  <a
                    href="tel:+919999926867"
                    className="hover:text-[#E8540A] block transition-colors"
                  >
                    +91 99999 26867
                  </a>
                  <a
                    href="tel:+919311826201"
                    className="hover:text-[#E8540A] block transition-colors"
                  >
                    +91 9311826201
                  </a>
                  <a
                    href="tel:+918448586825"
                    className="hover:text-[#E8540A] block transition-colors"
                  >
                    +91 8448586825
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail size={16} className="text-[#E8540A] mt-0.5 shrink-0" />
                <a
                  href="mailto:sales@veekaycabs.com"
                  className="text-white/50 text-sm hover:text-[#E8540A] transition-colors"
                >
                  sales@veekaycabs.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="border-t border-white/[0.08] pt-6">
          <p className="text-center text-white/40 text-sm">
            © 2026 Veekay Cabs. All Rights Reserved. | Built with ❤️ in India
          </p>
        </div>
      </div>

      {/* Orange bottom bar */}
      <div className="bg-[#E8540A] py-3">
        <p className="text-center text-white font-medium text-sm">
          © 2026 Veekay Cabs. All Rights Reserved. | Delhi NCR&apos;s #1
          Self-Drive Car Rental Platform
        </p>
      </div>

      {/* Popular Searches — rendered whenever there's data (not just when
          open) so these internal links are always present in the page's
          HTML for crawlers; only the visibility is toggled for humans. */}
      {seoPages.length > 0 && (
        <div
          className={`fixed inset-0 z-[200] items-center justify-center p-4 bg-black/60 ${showSeoModal ? "flex" : "hidden"}`}
          onClick={() => setShowSeoModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E4E5EF] flex items-center justify-between shrink-0">
              <h2 className="font-bold text-[#0F0F1A] text-base flex items-center gap-2">
                <Search size={16} className="text-[#E8540A]" /> Popular Searches
              </h2>
              <button onClick={() => setShowSeoModal(false)} className="text-[#9090A8] hover:text-[#EF4444]">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                {seoPages.map((p) => (
                  <Link
                    key={p.pageSlug}
                    href={`/car/${p.pageSlug}`}
                    className="text-[#4A4A6A] text-sm hover:text-[#E8540A] py-1.5 truncate"
                  >
                    {p.pageName}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
