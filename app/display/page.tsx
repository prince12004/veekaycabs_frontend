import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import DisplayClient from "./DisplayClient";

export const metadata: Metadata = buildMetadata({
  title: "Our Fleet",
  description:
    "Browse VeekayCabs' full fleet of self-drive hatchbacks, sedans, SUVs and luxury cars available for rent in Delhi NCR.",
  keywords: "veekay cabs fleet, self drive car fleet delhi, car rental options noida gurgaon",
  path: "/display",
});

export default function FleetDisplayPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Our Fleet", path: "/display" }])} />
      <DisplayClient />
    </>
  );
}
