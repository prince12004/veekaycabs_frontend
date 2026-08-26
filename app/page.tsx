import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import HomeClient from "./HomeClient";

export const metadata: Metadata = buildMetadata({
  title: "Self-Drive Car Rental in Delhi | Book Online | VeekayCabs",
  description:
    "Book a self-drive car on rent in Delhi starting Rs 92/hr. Hatchback, SUV & luxury car rentals available all round the clock across Delhi NCR. Just book online in 2 minutes.",
  keywords:
    "Self drive car rental, self drive car rental delhi ncr, ",
  path: "/",
});

const homeFaqs = [
  {
    question: "What is the lowest price for self-drive car rental in Delhi?",
    answer:
      "VeekayCabs offers self-drive car rentals in Delhi from as low as ₹96 per hour for compact cars like Toyota Glanza. For Mahindra Scorpio N type SUVs, prices start from ₹250/hour, and for luxury SUVs like Toyota Fortuner the rates start from ₹480/hour. Daily and weekly plans are also offered at discounted rates.",
  },
  {
    question:
      "What documents are required to rent a self-drive car on rent in Delhi?",
    answer:
      "You will need the following to hire a self-drive car in Delhi from VeekayCabs: (1) a valid Indian driving license with a minimum validity of 1 year, (2) Aadhaar card or any other government-issued photo ID, and (3) a refundable security deposit.",
  },
  {
    question:
      "Is fuel included in the self-drive car rental price in Delhi?",
    answer:
      "At VeekayCabs, the rental price does not include fuel. You take delivery of the vehicle with a certain amount of fuel and must return the car with the same amount, so the rental stays transparent and you only pay for the fuel you consume.",
  },
  {
    question: "How do I book a self-drive car in Delhi online?",
    answer:
      "There are three steps to booking a self-drive car with VeekayCabs: (1) open veekaycabs.com and go to the booking page, (2) set your city (Delhi NCR), pick your car and the date & time of pickup, and (3) make payment either online or offline. You'll get an instant confirmation once the booking is complete.",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: "Home", path: "/" }]),
          faqSchema(homeFaqs),
        ]}
      />
      <HomeClient />
    </>
  );
}
