import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "Read VeekayCabs' privacy policy to understand how we collect, use, and protect your personal information during self-drive car rental bookings.",
  keywords: "veekay cabs privacy policy, car rental data policy",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Privacy Policy", path: "/privacy" }])} />
      <PrivacyClient />
    </>
  );
}
