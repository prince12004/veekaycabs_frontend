import type { Metadata } from "next";
import { COMPANY_INFO } from "./constants";

export const SITE_URL = COMPANY_INFO.website;

// Fallback share image — the PHP site's live OG asset, kept until a local one exists.
const DEFAULT_OG_IMAGE = "https://veekaycabs.com/assets/img/Img2-min.jpg";

interface SeoInput {
  title: string;
  description: string;
  keywords?: string;
  /** Route path starting with "/", e.g. "/about" or "/blogs/my-post" */
  path: string;
  image?: string;
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description,
  keywords,
  path,
  image,
  noIndex,
}: SeoInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: "VeekayCabs",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      site: "@veekaycabs",
      title,
      description,
      images: [ogImage],
    },
  };
}

/** Parses the CarSeoPage/TempoSeoPage `robots` string (e.g. "index, follow") into a boolean. */
export function isNoIndexRobots(robots?: string): boolean {
  return !!robots && robots.toLowerCase().includes("noindex");
}
