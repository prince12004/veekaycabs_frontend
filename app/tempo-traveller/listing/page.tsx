import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import TempoListingClient from "./TempoListingClient";

export const metadata: Metadata = buildMetadata({
  title: "Available Tempo Travellers",
  description:
    "Browse and book available tempo travellers in Delhi NCR for your trip dates. Compare seats, pricing and features across our fleet.",
  keywords: "tempo traveller availability delhi, book tempo traveller online, tempo traveller listing",
  path: "/tempo-traveller/listing",
});

export default function TempoListingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tempo Traveller", path: "/tempo-traveller" },
          { name: "Available Tempo Travellers", path: "/tempo-traveller/listing" },
        ])}
      />
      <TempoListingClient />
    </>
  );
}
