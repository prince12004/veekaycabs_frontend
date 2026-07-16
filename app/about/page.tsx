import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import AboutClient from "./AboutClient";

export const metadata: Metadata = buildMetadata({
  title: "About Us",
  description:
    "Learn about VeekayCabs — Delhi NCR's trusted self-drive car rental company since 2004. 101+ verified cars, 2500+ happy customers, transparent pricing.",
  keywords: "about veekay cabs, self drive car rental company delhi, car rental company noida gurgaon",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "About Us", path: "/about" }])} />
      <AboutClient />
    </>
  );
}
