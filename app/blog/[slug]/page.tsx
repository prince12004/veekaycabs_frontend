import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/schema";
import BlogDetailClient from "./BlogDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Props {
  params: Promise<{ slug: string }>;
}

interface BlogSeoData {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  author: string;
  readTime: number;
  publishedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

async function fetchBlog(slug: string): Promise<BlogSeoData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/blog/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = await fetchBlog(slug);

  if (!blog) {
    return buildMetadata({
      title: "Blog",
      description: "Read the latest from Veekay Cabs on self-drive car rentals in Delhi NCR.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  const title = blog.seoTitle || blog.title;
  const description = blog.seoDescription || blog.excerpt;
  const keywords = blog.seoKeywords || (blog.tags || []).join(", ");

  return buildMetadata({
    title,
    description,
    keywords,
    path: `/blog/${slug}`,
    image: blog.coverImage,
  });
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const blog = await fetchBlog(slug);

  return (
    <>
      {blog && (
        <JsonLd
          data={[
            articleSchema({
              headline: blog.title,
              description: blog.excerpt,
              image: blog.coverImage,
              datePublished: blog.publishedAt,
              author: blog.author,
              url: `/blog/${slug}`,
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Blogs", path: "/blog" },
              { name: blog.title, path: `/blog/${slug}` },
            ]),
          ]}
        />
      )}
      <BlogDetailClient initialBlog={blog} />
    </>
  );
}
