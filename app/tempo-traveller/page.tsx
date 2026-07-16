import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import TempoTravellerClient from "./TempoTravellerClient";

export const metadata: Metadata = buildMetadata({
  title: "Tempo Traveller in Delhi | Rent luxury 9 to 26 Seater at best price",
  description:
    "Book a luxury tempo traveller in delhi. Avail 9 to 26 seater Tempo traveller in delhi location for group travel, corporate events and family trips at best price",
  keywords: "tempo traveller for rent delhi, tempo traveller for rent delhi, tempo traveller delhi, tempo traveller delhi, tempo traveller hire delhi, tempo traveller hire in delhi, delhi tempo traveller booking, hire a tempo traveller in delhi, luxury 12 seater tempo traveller delhi, luxury tempo traveller delhi",
  path: "/tempo-traveller",
});

export default function TempoTravellerPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Tempo Traveller", path: "/tempo-traveller" }])} />
      <TempoTravellerClient />
    </>
  );
}
