import { COMPANY_INFO } from "./constants";
import { SITE_URL } from "./seo";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "AutoRental"],
    "@id": `${SITE_URL}/#business`,
    name: "VeekayCabs - Self Drive Car Rental Delhi",
    alternateName: "Veekay Cabs",
    description:
      "VeekayCabs provides self drive car rental services in Delhi NCR. Hatchbacks, SUVs and luxury cars available. No driver required. Book online 24/7.",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
      width: 300,
      height: 80,
    },
    telephone: [COMPANY_INFO.phone],
    email: COMPANY_INFO.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "A 13, 1st Floor, Ganesh Nagar",
      addressLocality: "New Delhi",
      addressRegion: "Delhi",
      postalCode: "110092",
      addressCountry: "IN",
    },
    areaServed: [
      { "@type": "City", name: "Delhi" },
      { "@type": "City", name: "Noida" },
      { "@type": "City", name: "Gurgaon" },
      { "@type": "City", name: "Ghaziabad" },
      { "@type": "City", name: "Greater Noida" },
      { "@type": "City", name: "Faridabad" },
    ],
    sameAs: [
      "https://www.facebook.com/veekaycabs/",
      "https://www.instagram.com/veekay_cabs",
      "https://x.com/veekaycabs",
      "https://www.linkedin.com/company/veekaycabs/",
      "https://in.pinterest.com/veekay_cabs/",
    ],
    foundingDate: "2004",
    slogan: "Self Drive Car Rental in Delhi NCR — Drive on Your Terms",
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "VeekayCabs",
    url: SITE_URL,
    description:
      "Self Drive Car Rental & Tempo Traveller Hire in Delhi NCR – Noida, Ghaziabad, Gurgaon",
    publisher: { "@type": "Organization", "@id": `${SITE_URL}/#business` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/book?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function productSchema(opts: {
  name: string;
  description: string;
  image: string;
  price: number;
  url: string;
  brand?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    ...(opts.brand ? { brand: { "@type": "Brand", name: opts.brand } } : {}),
    image: opts.image,
    url: `${SITE_URL}${opts.url}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: String(opts.price),
      availability: "https://schema.org/InStock",
      seller: { "@id": `${SITE_URL}/#business` },
    },
  };
}

export function articleSchema(opts: {
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
  author?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.headline,
    description: opts.description,
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    author: { "@type": "Organization", name: opts.author || "Veekay Cabs Team" },
    publisher: { "@type": "Organization", "@id": `${SITE_URL}/#business` },
    mainEntityOfPage: `${SITE_URL}${opts.url}`,
  };
}
