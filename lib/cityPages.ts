export interface CityPageData {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  heroSubtitle: string;
  intro: string;
  areas: string[];
}

export const CITY_PAGES: CityPageData[] = [
  {
    slug: "delhi",
    name: "Delhi",
    metaTitle: "Self Drive Cars in Delhi | Rent a Car Without Driver",
    metaDescription:
      "Book self drive cars in Delhi at transparent prices. Hatchbacks, sedans, SUVs & luxury cars with doorstep delivery, 24/7 support & no hidden charges.",
    keywords:
      "self drive cars in delhi, self drive car rental delhi, rent a car in delhi without driver, car hire delhi",
    heroSubtitle:
      "Rent hatchbacks, sedans, SUVs and luxury cars anywhere in Delhi with doorstep delivery.",
    intro:
      "Veekay Cabs offers self drive cars in Delhi for city errands, weekend getaways, and long road trips. Every car is verified, sanitized, and delivered to your doorstep across Delhi, so you can skip the rental counter and drive off in minutes. Choose from hatchbacks, sedans, SUVs, and luxury cars, all with transparent pricing and no hidden charges.",
    areas: [
      "Connaught Place",
      "Dwarka",
      "Rohini",
      "Karol Bagh",
      "Preet Vihar",
      "Laxmi Nagar",
      "Vasant Kunj",
      "Saket",
      "Janakpuri",
      "Mayur Vihar",
      "Pitampura",
      "Rajouri Garden",
    ],
  },
  {
    slug: "noida",
    name: "Noida",
    metaTitle: "Self Drive Cars in Noida | Rent a Car Without Driver",
    metaDescription:
      "Rent self drive cars in Noida with doorstep delivery. Verified hatchbacks, sedans & SUVs at transparent prices, available 24/7 near you.",
    keywords:
      "self drive cars in noida, self drive car rental noida, rent a car in noida without driver, car hire noida",
    heroSubtitle:
      "Verified self-drive cars delivered anywhere in Noida, from Sector 18 to Greater Noida Expressway.",
    intro:
      "Need a self drive car in Noida? Veekay Cabs delivers verified, well-maintained cars straight to your home or office across all Noida sectors. Whether it's a quick city drive or a highway trip via the Noida-Greater Noida Expressway, book online in minutes and get transparent pricing with no last-minute surprises.",
    areas: [
      "Sector 18",
      "Sector 62",
      "Sector 137",
      "Noida Extension",
      "Sector 50",
      "Sector 15",
      "Botanical Garden",
      "Sector 76",
      "Noida City Centre",
      "Greater Noida Expressway",
    ],
  },
  {
    slug: "gurgaon",
    name: "Gurgaon",
    metaTitle: "Self Drive Cars in Gurgaon | Rent a Car Without Driver",
    metaDescription:
      "Book self drive cars in Gurgaon (Gurugram) with doorstep delivery. Hatchbacks, sedans, SUVs & luxury cars at transparent prices, 24/7 support.",
    keywords:
      "self drive cars in gurgaon, self drive car rental gurugram, rent a car in gurgaon without driver, car hire gurgaon",
    heroSubtitle:
      "Self-drive cars delivered across Gurgaon (Gurugram) — from Cyber City to Sohna Road.",
    intro:
      "Veekay Cabs brings self drive car rental to Gurgaon (Gurugram) for professionals, families, and travellers alike. Get a verified car delivered to your doorstep anywhere from Cyber City and MG Road to Sohna Road and Golf Course Road, with transparent pricing and round-the-clock support for corporate trips, weekend drives, or airport runs.",
    areas: [
      "Cyber City",
      "MG Road",
      "Sohna Road",
      "Golf Course Road",
      "Sector 29",
      "DLF Phase 1-5",
      "Udyog Vihar",
      "Sector 56",
      "Manesar",
      "IFFCO Chowk",
    ],
  },
  {
    slug: "ghaziabad",
    name: "Ghaziabad",
    metaTitle: "Self Drive Cars in Ghaziabad | Rent a Car Without Driver",
    metaDescription:
      "Rent self drive cars in Ghaziabad with doorstep delivery. Verified hatchbacks, sedans & SUVs at transparent prices, available 24/7.",
    keywords:
      "self drive cars in ghaziabad, self drive car rental ghaziabad, rent a car in ghaziabad without driver, car hire ghaziabad",
    heroSubtitle:
      "Verified self-drive cars delivered anywhere in Ghaziabad, from Indirapuram to Raj Nagar Extension.",
    intro:
      "Looking for self drive cars in Ghaziabad? Veekay Cabs delivers verified, sanitized cars right to your doorstep across Indirapuram, Vaishali, Kaushambi, and beyond. Book a hatchback, sedan, or SUV online in minutes, with transparent pricing and no hidden charges — perfect for daily commutes or weekend trips out of the city.",
    areas: [
      "Vaishali",
      "Indirapuram",
      "Raj Nagar Extension",
      "Kaushambi",
      "Vasundhara",
      "Crossings Republik",
      "Mohan Nagar",
      "Sahibabad",
    ],
  },
  {
    slug: "greater-noida",
    name: "Greater Noida",
    metaTitle: "Self Drive Cars in Greater Noida | Rent a Car Without Driver",
    metaDescription:
      "Book self drive cars in Greater Noida with doorstep delivery. Verified hatchbacks, sedans & SUVs at transparent prices, 24/7 support.",
    keywords:
      "self drive cars in greater noida, self drive car rental greater noida, rent a car in greater noida without driver, car hire greater noida",
    heroSubtitle:
      "Self-drive cars delivered across Greater Noida — from Alpha & Beta sectors to Pari Chowk.",
    intro:
      "Veekay Cabs offers self drive car rental in Greater Noida for students, professionals, and families. Get a verified car delivered to your doorstep across Alpha, Beta, and Gamma sectors, Pari Chowk, and Knowledge Park, with transparent pricing and 24/7 support — ideal for daily use or a quick drive down the Yamuna Expressway.",
    areas: [
      "Alpha Sector",
      "Beta Sector",
      "Gamma Sector",
      "Pari Chowk",
      "Knowledge Park",
      "Surajpur",
      "Jagat Farm",
      "Yamuna Expressway",
    ],
  },
];

export function getCityPage(slug: string): CityPageData | undefined {
  return CITY_PAGES.find((c) => c.slug === slug);
}
