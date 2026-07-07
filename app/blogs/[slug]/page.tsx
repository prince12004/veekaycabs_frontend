"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Clock, ArrowLeft, Twitter, Copy, ChevronRight, MessageCircle, Loader2, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { blogsAPI } from "@/lib/api";

interface BlogDetail {
  _id: string;
  slug: string;
  title: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  author: string;
  readTime: number;
  publishedAt: string;
}

interface RelatedRow {
  _id: string;
  slug: string;
  title: string;
  readTime: number;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

const HTML_ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'",
};
const decodeHtmlEntities = (str: string) =>
  str
    .replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (_m, name) => HTML_ENTITIES[name])
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)));

export default function BlogDetailPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState<RelatedRow[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");

  // Auto-generate a table of contents from the article's <h2> headings, and
  // stamp matching ids onto them so the nav can scroll to each section.
  const { contentHtml, toc } = useMemo(() => {
    if (!blog?.content) return { contentHtml: "", toc: [] as { id: string; title: string }[] };
    let i = 0;
    const items: { id: string; title: string }[] = [];
    const html = blog.content.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_match, attrs, inner) => {
      const id = `section-${i++}`;
      const title = decodeHtmlEntities(inner.replace(/<[^>]+>/g, "")).trim();
      if (title) items.push({ id, title });
      const cleanAttrs = String(attrs).replace(/\sid="[^"]*"/i, "");
      return `<h2${cleanAttrs} id="${id}">${inner}</h2>`;
    });
    return { contentHtml: html, toc: items };
  }, [blog?.content]);

  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-100px 0px -70% 0px" }
    );
    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    blogsAPI.getBySlug(slug)
      .then(({ data }) => setBlog(data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    blogsAPI.getAll({ limit: "4" })
      .then(({ data }) => setRelated((data.data || []).filter((b: RelatedRow) => b.slug !== slug).slice(0, 3)))
      .catch(() => setRelated([]));
  }, [slug]);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#E8540A]" />
        </div>
      </PageLayout>
    );
  }

  if (notFound || !blog) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
          <BookOpen size={40} className="text-[#E4E5EF] mb-4" />
          <p className="text-[#0F0F1A] font-bold mb-2">Blog post not found</p>
          <Link href="/blogs" className="text-[#E8540A] font-semibold text-sm hover:underline">Back to Blog</Link>
        </div>
      </PageLayout>
    );
  }

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
          {blog.tags?.[0] && (
            <div className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
              {blog.tags[0]}
            </div>
          )}
          <h1 className="text-3xl lg:text-5xl font-black text-white font-syne leading-tight mb-6">
            {blog.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
            <span>{fmtDate(blog.publishedAt)}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {blog.readTime} min read</span>
            <span>By {blog.author}</span>
          </div>
        </div>
      </section>

      {/* Cover */}
      <div className="max-w-4xl blog_details mx-auto px-6 -mt-8 mb-0">
        <div className="relative h-72 lg:h-96 bg-gradient-to-br from-[#242438] via-[#1C1C2E] to-[#0F0F1A] rounded-2xl flex items-center justify-center border border-[#2E2E45] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {blog.coverImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#E8540A] rounded-full opacity-[0.15] blur-[90px] pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#FF9A3C] rounded-full opacity-[0.08] blur-[100px] pointer-events-none" />
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
              />
              <div className="relative w-40 h-40 lg:w-52 lg:h-52 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-[0_8px_40px_rgba(232,84,10,0.15)]">
                <BookOpen size={56} className="text-white/40" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <section className="py-16 bg-[#F8F9FC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lg:grid lg:grid-cols-4 lg:gap-10">
            {/* TOC + Share sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-28">
                {toc.length > 0 && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#9090A8] mb-4">Contents</p>
                    <nav className="space-y-1 mb-8">
                      {toc.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${activeSection === item.id ? "bg-[#FFF3ED] text-[#E8540A] font-semibold" : "text-[#4A4A6A] hover:text-[#E8540A]"}`}
                        >
                          {item.title}
                        </button>
                      ))}
                    </nav>
                  </>
                )}
                <p className="text-xs font-bold uppercase tracking-widest text-[#9090A8] mb-3">Share</p>
                <div className="flex gap-2">
                  <button onClick={copyLink} className="w-9 h-9 rounded-full border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-all text-[#4A4A6A]">
                    <Copy size={14} />
                  </button>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(blog.title)}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-[#E4E5EF] flex items-center justify-center hover:border-blue-400 hover:text-blue-400 transition-all text-[#4A4A6A]">
                    <Twitter size={14} />
                  </a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(blog.title + " " + (typeof window !== "undefined" ? window.location.href : ""))}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-[#E4E5EF] flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-all text-[#4A4A6A]">
                    <MessageCircle size={14} />
                  </a>
                </div>
              </div>
            </div>

            {/* Article */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-[#E4E5EF] p-8 lg:p-12 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                <div
                  className="blog-content text-[#4A4A6A] leading-relaxed [&_h2]:text-2xl [&_h2]:font-black [&_h2]:font-syne [&_h2]:text-[#0F0F1A] [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#0F0F1A] [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1.5 [&_strong]:text-[#0F0F1A] [&_strong]:font-bold [&_a]:text-[#E8540A] [&_a]:underline [&_img]:rounded-xl [&_img]:my-4"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />

                {/* Author */}
                <div className="mt-12 pt-8 border-t border-[#E4E5EF] flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-black text-lg font-syne shrink-0">
                    VK
                  </div>
                  <div>
                    <p className="font-bold text-[#0F0F1A]">{blog.author}</p>
                    <p className="text-[#9090A8] text-sm">Delhi NCR&apos;s #1 Self-Drive Car Rental Platform since 2003</p>
                  </div>
                </div>
              </div>

              {/* Related Posts */}
              {related.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-xl font-bold text-[#0F0F1A] font-syne mb-6">Related Articles</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {related.map(post => (
                      <Link key={post._id} href={`/blogs/${post.slug}`}>
                        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 hover:border-[#E8540A]/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
                          <BookOpen size={28} className="text-[#E8540A]/40 mb-3" />
                          <h4 className="font-bold text-[#0F0F1A] text-sm mb-2 group-hover:text-[#E8540A] transition-colors line-clamp-3 leading-snug">{post.title}</h4>
                          <span className="text-[#9090A8] text-xs flex items-center gap-1"><Clock size={11} /> {post.readTime} min read</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

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
