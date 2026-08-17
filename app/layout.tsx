import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import QueryProvider from "@/components/providers/QueryProvider";
import NumberInputScrollGuard from "@/components/providers/NumberInputScrollGuard";
import JsonLd from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Veekay Cabs - Self Drive Car Rental in Delhi NCR",
    template: "%s | Veekay Cabs",
  },
  description:
    "Delhi NCR's #1 self-drive car rental platform. Book verified cars at transparent prices. 101+ cars, 2500+ bookings, 24/7 support.",
  keywords:
    "self drive car rental delhi, car rental noida, car rental gurgaon, veekay cabs",
  authors: [{ name: "VeekayCabs" }],
  robots: { index: true, follow: true },
  verification: {
    google: "2IN6m_g6qsunbcJfEDroMrreYBNAHcMopYEXdezFSkM",
  },
  icons: {
    icon: "/favi.png",
    shortcut: "/favi.png",
    apple: "/favi.png",
  },
  openGraph: {
    title: "Veekay Cabs - Self Drive Car Rental",
    description: "Book self-drive cars in Delhi NCR starting from Rs. 89/hr",
    url: SITE_URL,
    siteName: "VeekayCabs",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@veekaycabs",
    title: "Veekay Cabs - Self Drive Car Rental",
    description: "Book self-drive cars in Delhi NCR starting from Rs. 89/hr",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18348859511"
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18348859511');
          `}
        </Script>
      </head>
      <body className="antialiased">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <QueryProvider>
          <NumberInputScrollGuard />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0F0F1A",
                color: "#fff",
                borderRadius: "12px",
                border: "1px solid #2E2E45",
                fontFamily: "Inter, sans-serif",
              },
              success: {
                iconTheme: { primary: "#10B981", secondary: "#fff" },
              },
              error: { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
