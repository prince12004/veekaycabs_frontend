import type { Metadata } from "next";
import { buildMetadata, isNoIndexRobots } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import CarSeoLandingClient from "./CarSeoLandingClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Props {
  params: Promise<{ slug: string }>;
}

interface SeoPageDetail {
  _id: string;
  pageName: string;
  pageSlug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string;
  h1Tag?: string;
  content?: string;
  robots?: string;
}

async function fetchSeoPage(slug: string): Promise<SeoPageDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public/car-seo-pages/${slug}`, {
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
  const page = await fetchSeoPage(slug);

  if (!page) {
    return buildMetadata({
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist.",
      path: `/seo/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.metaKeywords,
    path: `/seo/${slug}`,
    noIndex: isNoIndexRobots(page.robots),
  });
}

export default async function CarSeoLandingPage({ params }: Props) {
  const { slug } = await params;
  const page = await fetchSeoPage(slug);

  return (
    <>
      {page && (
        <JsonLd
          data={breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: page.pageName, path: `/seo/${slug}` },
          ])}
        />
      )}
      <CarSeoLandingClient initialPage={page} />
    </>
  );
}
