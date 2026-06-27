"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

const BLOGS = [
  {
    id: 1,
    slug: "top-10-road-trips-from-delhi-2026",
    title: "Top 10 Road Trips From Delhi You Must Take in 2026",
    excerpt: "Pack your bags and fuel your wanderlust — Delhi NCR is surrounded by incredible destinations within a day's drive. From the majestic Taj Mahal in Agra to the serene valleys of Manali, here are our top picks for the perfect self-drive road trip you simply cannot miss.",
    category: "Road Trips",
    categoryColor: "#E8540A",
    author: "Veekay Team",
    date: "Jun 1, 2026",
    readTime: 8,
    emoji: "🗺️",
    gradient: "from-[#E8540A]/20 to-[#FF9A3C]/10",
    featured: true,
  },
  {
    id: 2,
    slug: "self-drive-vs-hiring-driver",
    title: "Self Drive vs Hiring a Driver: Which is Better?",
    excerpt: "A complete guide to choosing between self-drive car rentals and chauffeur-driven cabs based on your trip type, budget, and convenience needs.",
    category: "Tips",
    categoryColor: "#10B981",
    author: "Rahul Sharma",
    date: "May 20, 2026",
    readTime: 6,
    emoji: "🚦",
    gradient: "from-[#10B981]/20 to-[#10B981]/5",
    featured: false,
  },
  {
    id: 3,
    slug: "manali-road-trip-guide",
    title: "Manali Road Trip Guide: Best Time, Route & Tips",
    excerpt: "Everything you need to know about driving to Manali from Delhi — best routes, road conditions, must-visit stops, and insider tips for a memorable journey.",
    category: "Travel Guide",
    categoryColor: "#6366F1",
    author: "Priya Mehta",
    date: "May 10, 2026",
    readTime: 10,
    emoji: "🏔️",
    gradient: "from-[#6366F1]/20 to-[#6366F1]/5",
    featured: false,
  },
  {
    id: 4,
    slug: "save-money-car-rentals-insider-tips",
    title: "How to Save Money on Car Rentals: Insider Tips",
    excerpt: "Smart travelers know these tricks to slash car rental costs. From booking at the right time to choosing the optimal km package, here's how to get the best deal.",
    category: "Money Saving",
    categoryColor: "#F59E0B",
    author: "Vikram Joshi",
    date: "Apr 28, 2026",
    readTime: 5,
    emoji: "💰",
    gradient: "from-[#F59E0B]/20 to-[#F59E0B]/5",
    featured: false,
  },
  {
    id: 5,
    slug: "kyc-documents-self-drive-car-rental",
    title: "KYC Documents Needed for Self Drive Car Rental",
    excerpt: "Planning your first self-drive rental? Here's a complete checklist of all documents — Aadhaar, PAN, driving licence, and more — to ensure a hassle-free booking experience.",
    category: "Guides",
    categoryColor: "#0EA5E9",
    author: "Veekay Team",
    date: "Apr 15, 2026",
    readTime: 4,
    emoji: "📋",
    gradient: "from-[#0EA5E9]/20 to-[#0EA5E9]/5",
    featured: false,
  },
  {
    id: 6,
    slug: "weekend-getaways-from-delhi",
    title: "Weekend Getaways from Delhi: A Complete 2026 List",
    excerpt: "Escape the city grind with these handpicked weekend getaway destinations from Delhi. All reachable by self-drive in 2-6 hours with our curated fleet of verified cars.",
    category: "Travel",
    categoryColor: "#EC4899",
    author: "Arju Sharma",
    date: "Apr 5, 2026",
    readTime: 7,
    emoji: "🌄",
    gradient: "from-[#EC4899]/20 to-[#EC4899]/5",
    featured: false,
  },
];

const CATEGORIES = ["All", "Road Trips", "Tips", "Travel Guide", "Money Saving", "Guides", "Travel"];

export default function BlogsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(1);
  const POSTS_PER_PAGE = 5;

  const filtered = activeCategory === "All"
    ? BLOGS
    : BLOGS.filter((b) => b.category === activeCategory);

  const featured = filtered.find((b) => b.featured) ?? filtered[0];
  const rest = filtered.filter((b) => b.id !== featured?.id);

  const totalPages = Math.ceil(rest.length / POSTS_PER_PAGE);
  const paged = rest.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F0F1A] to-[#1C1C2E] pt-32 pb-20 text-center overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#E8540A] rounded-full opacity-[0.06] blur-[100px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="section-chip mx-auto w-fit mb-4">📝 Our Blog</div>
          <h1 className="font-black font-syne text-5xl lg:text-6xl text-white mb-4 leading-tight">
            Our Stories & Guides
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Travel guides, road trip inspiration, money-saving tips, and everything you need to know about self-drive car rentals.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === cat
                  ? "bg-[#E8540A] text-white shadow-[0_4px_12px_rgba(232,84,10,0.3)]"
                  : "bg-white text-[#4A4A6A] border border-[#E4E5EF] hover:border-[#E8540A]/50 hover:text-[#E8540A]"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {featured && (
          <Link href={`/blogs/${featured.slug}`} className="block mb-10 group">
            <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all flex flex-col lg:flex-row">
              <div className={`lg:w-1/2 h-64 lg:h-auto bg-gradient-to-br ${featured.gradient} flex items-center justify-center relative`}>
                <span className="text-8xl">{featured.emoji}</span>
                <div
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs font-bold"
                  style={{ backgroundColor: featured.categoryColor }}
                >
                  {featured.category}
                </div>
                <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <span className="text-white text-xs font-medium">Featured</span>
                </div>
              </div>
              <div className="lg:w-1/2 p-8 lg:p-10 flex flex-col justify-center">
                <p className="text-[#9090A8] text-xs mb-2 flex items-center gap-2">
                  <Clock size={11} />
                  {featured.readTime} min read &bull; {featured.date}
                </p>
                <h2 className="font-black font-syne text-2xl lg:text-3xl text-[#0F0F1A] mb-4 leading-tight group-hover:text-[#E8540A] transition-colors">
                  {featured.title}
                </h2>
                <p className="text-[#4A4A6A] text-base leading-relaxed mb-6 line-clamp-3">
                  {featured.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[#9090A8] text-sm">By {featured.author}</span>
                  <span className="flex items-center gap-1.5 text-[#E8540A] font-semibold text-sm group-hover:gap-2.5 transition-all">
                    Read More <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Regular Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {paged.map((blog) => (
            <Link
              key={blog.id}
              href={`/blogs/${blog.slug}`}
              className="block bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group"
            >
              <div className={`h-48 bg-gradient-to-br ${blog.gradient} flex items-center justify-center relative`}>
                <span className="text-6xl">{blog.emoji}</span>
                <div
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-[10px] font-bold"
                  style={{ backgroundColor: blog.categoryColor }}
                >
                  {blog.category}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  <span className="text-white text-[10px] font-medium">{blog.readTime} min</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${blog.categoryColor}20`, color: blog.categoryColor }}
                  >
                    {blog.category}
                  </span>
                </div>
                <h3 className="font-bold font-syne text-[#0F0F1A] text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#E8540A] transition-colors">
                  {blog.title}
                </h3>
                <p className="text-[#4A4A6A] text-sm leading-relaxed line-clamp-3 mb-4">
                  {blog.excerpt}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-[#E4E5EF]">
                  <span className="text-[#9090A8] text-xs flex items-center gap-1">
                    <Clock size={10} />
                    {blog.date}
                  </span>
                  <span className="flex items-center gap-1 text-[#E8540A] text-xs font-semibold group-hover:gap-1.5 transition-all">
                    Read More <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-full border border-[#E4E5EF] flex items-center justify-center text-[#4A4A6A] disabled:opacity-40 hover:border-[#E8540A] hover:text-[#E8540A] transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${page === n
                    ? "bg-[#E8540A] text-white"
                    : "border border-[#E4E5EF] text-[#4A4A6A] hover:border-[#E8540A] hover:text-[#E8540A]"
                  }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-full border border-[#E4E5EF] flex items-center justify-center text-[#4A4A6A] disabled:opacity-40 hover:border-[#E8540A] hover:text-[#E8540A] transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
