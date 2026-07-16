import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import BookClient from "./BookClient";

export const metadata: Metadata = buildMetadata({
  title: "Book a Self Drive Car",
  description:
    "Book a self-drive car in Delhi NCR in 60 seconds. Choose from 101+ verified hatchbacks, SUVs and luxury cars with transparent pricing. Starting ₹89/hour.",
  keywords: "book self drive car delhi, car rental booking noida gurgaon, self drive car booking online",
  path: "/book",
});

export default function BookPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Book a Car", path: "/book" }])} />
      <BookClient />
    </>
  );
}
