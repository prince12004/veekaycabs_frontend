import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import TermsClient from "./TermsClient";

export const metadata: Metadata = buildMetadata({
  title: "Terms & Conditions",
  description:
    "Read the terms and conditions for renting a self-drive car with VeekayCabs — eligibility, documents required, fuel policy, and rental rules.",
  keywords: "veekay cabs terms and conditions, self drive car rental rules delhi",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Terms & Conditions", path: "/terms" }])} />
      <TermsClient />
    </>
  );
}
