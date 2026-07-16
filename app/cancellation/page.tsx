import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import CancellationClient from "./CancellationClient";

export const metadata: Metadata = buildMetadata({
  title: "Cancellation & Refund Policy",
  description:
    "Understand VeekayCabs' cancellation and refund policy for self-drive car rental bookings in Delhi NCR — timelines, deductions, and refund process.",
  keywords: "veekay cabs cancellation policy, car rental refund policy delhi",
  path: "/cancellation",
});

export default function CancellationPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Cancellation Policy", path: "/cancellation" }])} />
      <CancellationClient />
    </>
  );
}
