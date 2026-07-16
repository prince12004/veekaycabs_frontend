import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import BlogsListClient from "./BlogsListClient";

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description:
    "Tips, guides and news on self-drive car rental, road trips, and travel in Delhi NCR from the VeekayCabs team.",
  keywords: "veekay cabs blog, self drive car rental tips, road trip guides delhi ncr",
  path: "/blogs",
});

export default function BlogsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blogs" }])} />
      <BlogsListClient />
    </>
  );
}
