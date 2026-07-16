import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATIC_ROUTES = [
  "/",
  "/book",
  "/tempo-traveller",
  "/tempo-traveller/listing",
  "/about",
  "/contact",
  "/blogs",
  "/sitemap",
  "/privacy",
  "/terms",
  "/cancellation",
];

async function fetchJson<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogs, carSeoPages, tempoSeoPages, tempos] = await Promise.all([
    fetchJson<{ slug: string; publishedAt?: string }>("/api/blogs?limit=1000"),
    fetchJson<{ pageSlug: string }>("/api/public/car-seo-pages"),
    fetchJson<{ pageSlug: string }>("/api/public/tempo-seo-pages"),
    fetchJson<{ slug: string }>("/api/tempo/available"),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogs.map((b) => ({
    url: `${SITE_URL}/blogs/${b.slug}`,
    lastModified: b.publishedAt ? new Date(b.publishedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const carSeoEntries: MetadataRoute.Sitemap = carSeoPages.map((p) => ({
    url: `${SITE_URL}/seo/${p.pageSlug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const tempoSlugEntries: MetadataRoute.Sitemap = [
    ...tempoSeoPages.map((p) => p.pageSlug),
    ...tempos.map((t) => t.slug),
  ]
    .filter((slug, i, arr) => slug && arr.indexOf(slug) === i)
    .map((slug) => ({
      url: `${SITE_URL}/tempo-traveller/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...staticEntries, ...blogEntries, ...carSeoEntries, ...tempoSlugEntries];
}
