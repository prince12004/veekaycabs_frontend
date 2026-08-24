import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import HomeClient from "./HomeClient";

export const metadata: Metadata = buildMetadata({
  title: "Self-Drive Car Rental in Delhi | Book Online | VeekayCabs",
  description:
    "Book a self-drive car on rent in Delhi starting Rs 92/hr. Hatchback, SUV & luxury car rentals available all round the clock across Delhi NCR. Just book online in 2 minutes.",
  keywords:
    "Self drive car rental, self drive car rental delhi ncr, ",
  path: "/",
});

export default function HomePage() {
  return <HomeClient />;
}
