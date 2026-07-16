import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import ContactClient from "./ContactClient";

export const metadata: Metadata = buildMetadata({
  title: "Contact Us",
  description:
    "Get in touch with VeekayCabs for self-drive car rental and tempo traveller bookings in Delhi NCR. Call, WhatsApp, or visit our office in New Delhi.",
  keywords: "contact veekay cabs, veekay cabs phone number, car rental office delhi",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Contact Us", path: "/contact" }])} />
      <ContactClient />
    </>
  );
}
