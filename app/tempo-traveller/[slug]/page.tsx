import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { productSchema, breadcrumbSchema } from "@/lib/schema";
import TempoDetailClient from "./TempoDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Props {
  params: Promise<{ slug: string }>;
}

interface TempoData {
  name: string;
  seats: number;
  fuel: string;
  location: string;
  pricePerDay: number;
  shortDescription?: string;
  images?: string[];
}

interface TempoSeoData {
  metaTitle: string;
  metaKeywords?: string;
  metaDescription: string;
}

async function fetchTempo(slug: string): Promise<TempoData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tempo/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

async function fetchTempoSeo(slug: string): Promise<TempoSeoData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tempo/seo/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [tempo, seo] = await Promise.all([fetchTempo(slug), fetchTempoSeo(slug)]);

  if (!tempo) {
    return buildMetadata({
      title: "Tempo Traveller Hire in Delhi NCR",
      description: "Book a tempo traveller for group trips and outstation travel in Delhi NCR with Veekay Cabs.",
      path: `/tempo-traveller/${slug}`,
      noIndex: true,
    });
  }

  const title = seo?.metaTitle || `${tempo.name} – Tempo Traveller Hire in Delhi NCR`;
  const description =
    seo?.metaDescription ||
    `Book ${tempo.name} (${tempo.seats} Seater, ${tempo.fuel}) tempo traveller for outstation and local trips in ${tempo.location}. Starting ₹${tempo.pricePerDay}/day.`;
  const keywords = seo?.metaKeywords || `tempo traveller hire ${tempo.location}, ${tempo.seats} seater tempo traveller, tempo traveller rental delhi ncr`;

  return buildMetadata({
    title,
    description,
    keywords,
    path: `/tempo-traveller/${slug}`,
    image: tempo.images?.[0],
  });
}

export default async function TempoDetailPage({ params }: Props) {
  const { slug } = await params;
  const tempo = await fetchTempo(slug);

  return (
    <>
      {tempo && (
        <JsonLd
          data={[
            productSchema({
              name: tempo.name,
              description:
                tempo.shortDescription ||
                `${tempo.name} (${tempo.seats} Seater, ${tempo.fuel}) tempo traveller available for hire in ${tempo.location}.`,
              image: tempo.images?.[0] || "",
              price: tempo.pricePerDay,
              url: `/tempo-traveller/${slug}`,
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Tempo Traveller", path: "/tempo-traveller" },
              { name: tempo.name, path: `/tempo-traveller/${slug}` },
            ]),
          ]}
        />
      )}
      <TempoDetailClient />
    </>
  );
}
