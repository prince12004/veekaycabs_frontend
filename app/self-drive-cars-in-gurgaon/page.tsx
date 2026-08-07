import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import CityLandingPage from "@/components/city/CityLandingPage";
import { getCityPage } from "@/lib/cityPages";

const PATH = "/self-drive-cars-in-gurgaon";
const city = getCityPage("gurgaon")!;

export const metadata: Metadata = buildMetadata({
  title: city.metaTitle,
  description: city.metaDescription,
  keywords: city.keywords,
  path: PATH,
});

export default function SelfDriveCarsGurgaonPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: `Self Drive Cars in ${city.name}`, path: PATH },
        ])}
      />
      <CityLandingPage data={city} />
    </>
  );
}
