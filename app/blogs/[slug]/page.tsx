"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Clock, ArrowLeft, Twitter, Copy, ChevronRight, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

const BLOG_CONTENT = {
  title: "Top 10 Road Trips From Delhi You Must Take in 2026",
  tag: "Road Trips",
  date: "June 5, 2026",
  readTime: 8,
  author: "Veekay Cabs Team",
  emoji: "🗺️",
  intro: `Delhi NCR is perfectly positioned as the launchpad for some of India's most iconic road trips. Whether you're a weekend warrior or planning a long vacation, the capital's road network connects you to mountains, deserts, heritage cities, and spiritual destinations.`,
  toc: [
    { id: "shimla", title: "1. Delhi to Shimla" },
    { id: "manali", title: "2. Delhi to Manali" },
    { id: "jaipur", title: "3. Delhi to Jaipur" },
    { id: "agra", title: "4. Delhi to Agra" },
    { id: "haridwar", title: "5. Delhi to Haridwar & Rishikesh" },
    { id: "amritsar", title: "6. Delhi to Amritsar" },
    { id: "tips", title: "Road Trip Tips" },
  ],
  sections: [
    {
      id: "shimla",
      title: "1. Delhi to Shimla — The Classic Hill Escape",
      body: `Distance: ~350 km | Drive Time: ~7 hours\n\nShimla remains the timeless favourite for Delhi drivers. Take NH44 to Ambala, then NH5 through Kalka into the hills. The winding roads beyond Kalka are a joy — but go slow, especially in monsoon.\n\n**Best for:** Couples, families, first-time hill drivers\n**Best time:** March–June, September–November\n**Stay:** Hotel Willow Banks, Span Resorts`,
    },
    {
      id: "manali",
      title: "2. Delhi to Manali — The Epic Mountain Drive",
      body: `Distance: ~540 km | Drive Time: ~12-14 hours\n\nThe Delhi–Manali highway is one of India's most scenic drives. Pass through Chandigarh, Mandi, Kullu before reaching Manali. The Rohtang Pass beyond Manali is pure bucket-list territory.\n\n**Best for:** Adventure seekers, groups, long drives\n**Best time:** May–June, September–October\n**Tip:** Start at 4 AM from Delhi to reach Manali by evening.`,
    },
    {
      id: "jaipur",
      title: "3. Delhi to Jaipur — The Royal Road",
      body: `Distance: ~280 km | Drive Time: ~5 hours\n\nThe Delhi–Jaipur expressway is one of India's best highways. Cruise at 100+ km/h and stop at Neemrana Fort for chai with a view. Jaipur's palaces, forts, and food are world-class.\n\n**Best for:** Culture lovers, photographers, foodies\n**Best time:** October–March\n**Must stop:** Neemrana Fort Palace`,
    },
    {
      id: "agra",
      title: "4. Delhi to Agra — The Taj Express",
      body: `Distance: ~230 km | Drive Time: ~3.5 hours\n\nYamuna Expressway makes this the fastest long drive from Delhi. Leave at 6 AM, reach Agra by 9:30 AM, see the Taj at dawn — the best light of the day.\n\n**Best for:** Day trips, couples, tourists\n**Best time:** October–March\n**Tip:** Park at Shilpgram, take an e-rickshaw to Taj East Gate.`,
    },
    {
      id: "haridwar",
      title: "5. Delhi to Haridwar & Rishikesh — The Spiritual Drive",
      body: `Distance: ~225 km | Drive Time: ~4-5 hours\n\nThe route via NH58 passes through Meerut and Muzaffarnagar. Haridwar's Ganga Aarti at sunset is a spiritual experience like no other. Continue 25 km to Rishikesh for river rafting.\n\n**Best for:** Spirituality, adventure, yoga retreats\n**Best time:** Year-round (avoid monsoon for rafting)`,
    },
    {
      id: "amritsar",
      title: "6. Delhi to Amritsar — The Golden Triangle",
      body: `Distance: ~450 km | Drive Time: ~7-8 hours\n\nNH44 is a smooth drive. Stop at Karnal for breakfast, Ambala for lunch. The Golden Temple in Amritsar is one of India's most moving experiences.\n\n**Best for:** Cultural immersion, history, food lovers\n**Best time:** October–March`,
    },
    {
      id: "tips",
      title: "General Road Trip Tips from Veekay Cabs",
      body: `✅ Always carry original documents (DL, Aadhaar, RC)\n✅ Check tyre pressure and fuel before long drives\n✅ Use Google Maps offline in hilly areas with poor signal\n✅ Book your return slot in advance to avoid last-minute panic\n✅ Our 250 km/day package covers most of these trips comfortably\n✅ Emergency: Call us 24/7 at +91 99999 26867`,
    },
  ],
};

const RELATED = [
  { slug: "manali-road-trip-guide", title: "Manali Road Trip Guide: Best Time, Route & Tips", emoji: "🏔️", readTime: 12 },
  { slug: "weekend-getaways-from-delhi", title: "Weekend Getaways From Delhi: A Complete 2026 List", emoji: "🌅", readTime: 10 },
  { slug: "save-money-car-rentals", title: "How to Save Money on Car Rentals: 10 Insider Tips", emoji: "💰", readTime: 6 },
];

export default function BlogDetailPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("shimla");

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((window.scrollY / total) * 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  return (
    <PageLayout>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-[#E4E5EF]">
        <motion.div
          className="h-full bg-gradient-to-r from-[#E8540A] to-[#FF9A3C]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0F0F1A] to-[#1C1C2E] pt-32 pb-16">
        <div className="max-w-4xl blog_details mx-auto px-6">
          <Link href="/blogs" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm">
            <ArrowLeft size={16} /> Back to Blog
          </Link>
          <div className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
            {BLOG_CONTENT.tag}
          </div>
          <h1 className="text-3xl lg:text-5xl font-black text-white font-syne leading-tight mb-6">
            {BLOG_CONTENT.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
            <span>{BLOG_CONTENT.date}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {BLOG_CONTENT.readTime} min read</span>
            <span>By {BLOG_CONTENT.author}</span>
          </div>
        </div>
      </section>

      {/* Cover */}
      <div className="max-w-4xl blog_details mx-auto px-6 -mt-8 mb-0">
        <div className="relative h-72 lg:h-96 bg-gradient-to-br from-[#242438] via-[#1C1C2E] to-[#0F0F1A] rounded-2xl flex items-center justify-center border border-[#2E2E45] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {/* Decorative glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#E8540A] rounded-full opacity-[0.15] blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#FF9A3C] rounded-full opacity-[0.08] blur-[100px] pointer-events-none" />
          {/* Dot grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />
          {/* Emoji badge */}
          <div className="relative w-40 h-40 lg:w-52 lg:h-52 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-[0_8px_40px_rgba(232,84,10,0.15)]">
            <span className="text-7xl lg:text-8xl drop-shadow-lg">{BLOG_CONTENT.emoji}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-16 bg-[#F8F9FC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lg:grid lg:grid-cols-4 lg:gap-10">
            {/* TOC */}
            <div className="hidden lg:block">
              <div className="sticky top-28">
                <p className="text-xs font-bold uppercase tracking-widest text-[#9090A8] mb-4">Contents</p>
                <nav className="space-y-1">
                  {BLOG_CONTENT.toc.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${activeSection === item.id ? "bg-[#FFF3ED] text-[#E8540A] font-semibold" : "text-[#4A4A6A] hover:text-[#E8540A]"}`}
                    >
                      {item.title}
                    </button>
                  ))}
                </nav>

                {/* Share */}
                <div className="mt-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9090A8] mb-3">Share</p>
                  <div className="flex gap-2">
                    <button onClick={copyLink} className="w-9 h-9 rounded-full border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-all text-[#4A4A6A]">
                      <Copy size={14} />
                    </button>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(BLOG_CONTENT.title)}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-[#E4E5EF] flex items-center justify-center hover:border-blue-400 hover:text-blue-400 transition-all text-[#4A4A6A]">
                      <Twitter size={14} />
                    </a>
                    <a href={`https://wa.me/?text=${encodeURIComponent(BLOG_CONTENT.title + " " + (typeof window !== "undefined" ? window.location.href : ""))}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-[#E4E5EF] flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-all text-[#4A4A6A]">
                      <MessageCircle size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Article */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-[#E4E5EF] p-8 lg:p-12 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                <p className="text-[#4A4A6A] text-lg leading-relaxed mb-10 border-l-4 border-[#E8540A] pl-6 italic">
                  {BLOG_CONTENT.intro}
                </p>

                <div className="space-y-12">
                  {BLOG_CONTENT.sections.map(section => (
                    <div key={section.id} id={section.id} className="scroll-mt-28">
                      <h2 className="text-2xl font-black text-[#0F0F1A] font-syne mb-4 flex items-center gap-3">
                        <span className="w-1 h-8 bg-[#E8540A] rounded-full" />
                        {section.title}
                      </h2>
                      <div className="text-[#4A4A6A] leading-relaxed whitespace-pre-line">
                        {section.body.split("\n").map((line, j) => {
                          if (line.startsWith("**") && line.endsWith("**")) {
                            return <p key={j} className="font-bold text-[#0F0F1A] mt-3 mb-1">{line.replace(/\*\*/g, "")}</p>;
                          }
                          if (line.startsWith("✅")) {
                            return <p key={j} className="flex items-start gap-2 py-1">{line}</p>;
                          }
                          return line ? <p key={j} className="mb-2">{line}</p> : <br key={j} />;
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Author */}
                <div className="mt-12 pt-8 border-t border-[#E4E5EF] flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-black text-lg font-syne shrink-0">
                    VK
                  </div>
                  <div>
                    <p className="font-bold text-[#0F0F1A]">{BLOG_CONTENT.author}</p>
                    <p className="text-[#9090A8] text-sm">Delhi NCR&apos;s #1 Self-Drive Car Rental Platform since 2003</p>
                  </div>
                </div>
              </div>

              {/* Related Posts */}
              <div className="mt-10">
                <h3 className="text-xl font-bold text-[#0F0F1A] font-syne mb-6">Related Articles</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {RELATED.map(post => (
                    <Link key={post.slug} href={`/blogs/${post.slug}`}>
                      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 hover:border-[#E8540A]/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
                        <div className="text-4xl mb-3">{post.emoji}</div>
                        <h4 className="font-bold text-[#0F0F1A] text-sm mb-2 group-hover:text-[#E8540A] transition-colors line-clamp-3 leading-snug">{post.title}</h4>
                        <span className="text-[#9090A8] text-xs flex items-center gap-1"><Clock size={11} /> {post.readTime} min read</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 bg-gradient-to-r from-[#E8540A] to-[#FF6B35] rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-black text-white font-syne mb-2">Ready to Hit the Road?</h3>
                <p className="text-white/80 mb-6">Book a self-drive car in Delhi NCR. 60-second booking, 101+ verified cars.</p>
                <Link href="/book" className="bg-white text-[#E8540A] font-bold px-8 py-3 rounded-xl hover:bg-[#FFF3ED] transition-colors inline-flex items-center gap-2">
                  Book Now <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
