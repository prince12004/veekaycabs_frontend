"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, ArrowRight, ChevronLeft, ChevronRight, Loader2, BookOpen } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { blogsAPI } from "@/lib/api";

interface BlogRow {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  tags?: string[];
  author: string;
  readTime: number;
  publishedAt: string;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function BlogsListClient() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const POSTS_PER_PAGE = 6;

  useEffect(() => {
    setLoading(true);
    blogsAPI.getAll({ page: String(page), limit: String(POSTS_PER_PAGE) })
      .then(({ data }) => {
        setBlogs(data.data || []);
        setTotalPages(data.pages || 1);
      })
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, [page]);

  const featured = page === 1 ? blogs[0] : undefined;
  const rest = page === 1 ? blogs.slice(1) : blogs;

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
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#9090A8]">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen size={40} className="mx-auto text-[#E4E5EF] mb-4" />
            <p className="text-[#9090A8]">No blog posts yet — check back soon!</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featured && (
              <Link href={`/blogs/${featured.slug}`} className="block mb-10 group">
                <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all flex flex-col lg:flex-row">
                  <div className="lg:w-1/2 h-64 lg:h-auto bg-gradient-to-br from-[#E8540A]/20 to-[#FF9A3C]/10 flex items-center justify-center relative overflow-hidden">
                    {featured.coverImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={featured.coverImage} alt={featured.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={64} className="text-[#E8540A]/40" />
                    )}
                    {featured.tags?.[0] && (
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs font-bold bg-[#E8540A]">
                        {featured.tags[0]}
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="text-white text-xs font-medium">Latest</span>
                    </div>
                  </div>
                  <div className="lg:w-1/2 p-8 lg:p-10 flex flex-col justify-center">
                    <p className="text-[#9090A8] text-xs mb-2 flex items-center gap-2">
                      <Clock size={11} />
                      {featured.readTime} min read &bull; {fmtDate(featured.publishedAt)}
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
              {rest.map((blog) => (
                <Link
                  key={blog._id}
                  href={`/blogs/${blog.slug}`}
                  className="block bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group"
                >
                  <div className="h-48 bg-gradient-to-br from-[#E8540A]/15 to-[#FF9A3C]/5 flex items-center justify-center relative overflow-hidden">
                    {blog.coverImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={40} className="text-[#E8540A]/30" />
                    )}
                    {blog.tags?.[0] && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-[10px] font-bold bg-[#E8540A]">
                        {blog.tags[0]}
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      <span className="text-white text-[10px] font-medium">{blog.readTime} min</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold font-syne text-[#0F0F1A] text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#E8540A] transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-[#4A4A6A] text-sm leading-relaxed line-clamp-3 mb-4">
                      {blog.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-[#E4E5EF]">
                      <span className="text-[#9090A8] text-xs flex items-center gap-1">
                        <Clock size={10} />
                        {fmtDate(blog.publishedAt)}
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
          </>
        )}
      </div>
    </PageLayout>
  );
}
