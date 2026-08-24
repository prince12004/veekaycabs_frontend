import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { productSchema, breadcrumbSchema } from "@/lib/schema";
import { getCarById } from "@/lib/cars-data";
import CarSlugClient from "./CarSlugClient";

interface Props {
  params: Promise<{ carSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { carSlug } = await params;
  const car = getCarById(carSlug);

  if (!car) {
    return buildMetadata({
      title: "Self Drive Car Rental in Delhi NCR",
      description:
        "Book a self-drive car in Delhi NCR with Veekay Cabs. Transparent pricing, verified fleet, doorstep delivery.",
      path: `/${carSlug}`,
    });
  }

  const title = `${car.name} – Self Drive Car Rental in Delhi NCR`;
  const description = `Rent ${car.name} (${car.seats} Seater, ${car.fuel}, ${car.transmission}) on self-drive in Delhi NCR with Veekay Cabs. Starting ₹${car.pricePerHr}/hour.`;
  const keywords = `self drive ${car.name} rental, ${car.type} rental delhi, ${car.name} rent delhi ncr, self drive car rental delhi`;

  return buildMetadata({
    title,
    description,
    keywords,
    path: `/${carSlug}`,
    image: car.image,
  });
}

export default async function CarSlugPage({ params }: Props) {
  const { carSlug } = await params;
  const car = getCarById(carSlug);

  return (
    <>
      {car && (
        <JsonLd
          data={[
            productSchema({
              name: car.name,
              description: `${car.name} (${car.seats} Seater, ${car.fuel}, ${car.transmission}) available for self-drive rental in Delhi NCR.`,
              image: car.image,
              price: car.pricePerHr,
              url: `/${carSlug}`,
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: car.name, path: `/${carSlug}` },
            ]),
          ]}
        />
      )}
      <CarSlugClient />
    </>
  );
}
