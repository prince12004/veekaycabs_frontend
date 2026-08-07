import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import Link from "next/link";
import { Map } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sitemap",
  description: "Browse all pages of VeekayCabs — self-drive car rental, tempo traveller hire, blogs, and legal pages.",
  path: "/sitemap",
});

const sitemapData = [
  {
    group: "Main Pages",
    links: [
      { href: "/", label: "Homepage" },
      { href: "/book", label: "Self Drive Car Rental" },
      { href: "/tempo-traveller", label: "Tempo Traveller on Rent" },
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact Us" },
      { href: "/blog", label: "Blogs & Travel Guides" },
    ],
  },
  {
    group: "User Account",
    links: [
      { href: "/login", label: "Login / Register" },
      { href: "/account", label: "My Profile" },
      { href: "/account/history", label: "Booking History" },
      { href: "/account/documents", label: "KYC Documents" },
      { href: "/account/verification", label: "Verification Status" },
      { href: "/account/active", label: "Active Booking" },
    ],
  },
  {
    group: "Cities We Serve",
    links: [
      { href: "/self-drive-cars-in-delhi", label: "Self Drive Cars in Delhi" },
      { href: "/self-drive-cars-in-noida", label: "Self Drive Cars in Noida" },
      { href: "/self-drive-cars-in-gurgaon", label: "Self Drive Cars in Gurgaon" },
      { href: "/self-drive-cars-in-ghaziabad", label: "Self Drive Cars in Ghaziabad" },
      { href: "/self-drive-cars-in-greater-noida", label: "Self Drive Cars in Greater Noida" },
    ],
  },
  {
    group: "Legal",
    links: [
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/cancellation", label: "Cancellation & Refund Policy" },
    ],
  },
  {
    group: "Blog Categories",
    links: [
      { href: "/blog?tag=road-trips", label: "Road Trip Guides" },
      { href: "/blog?tag=tips", label: "Car Rental Tips" },
      { href: "/blog?tag=travel-guide", label: "Travel Guides" },
      { href: "/blog?tag=money-saving", label: "Money Saving Tips" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <PageLayout>
      <div className="bg-gradient-to-b from-[#0F0F1A] to-[#1C1C2E] py-20 pt-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8540A]/10 border border-[#E8540A]/25 text-[#E8540A] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Map size={14} />
            Navigate
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white font-syne mb-4">Sitemap</h1>
          <p className="text-white/60">All pages of Veekay Cabs in one place</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sitemapData.map((group) => (
            <div key={group.group} className="bg-white rounded-2xl border border-[#E4E5EF] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#9090A8] mb-4 pb-3 border-b border-[#E4E5EF]">
                {group.group}
              </h2>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#4A4A6A] hover:text-[#E8540A] hover:pl-2 transition-all duration-200 flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#E8540A] shrink-0" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
