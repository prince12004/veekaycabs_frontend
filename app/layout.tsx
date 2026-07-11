import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import QueryProvider from "@/components/providers/QueryProvider";
import NumberInputScrollGuard from "@/components/providers/NumberInputScrollGuard";

export const metadata: Metadata = {
  title: "Veekay Cabs - Self Drive Car Rental in Delhi NCR",
  description:
    "Delhi NCR's #1 self-drive car rental platform. Book verified cars at transparent prices. 101+ cars, 2500+ bookings, 24/7 support.",
  keywords:
    "self drive car rental delhi, car rental noida, car rental gurgaon, veekay cabs",
  openGraph: {
    title: "Veekay Cabs - Self Drive Car Rental",
    description: "Book self-drive cars in Delhi NCR starting from Rs. 89/hr",
    url: "https://veekaycabs.com",
    siteName: "Veekay Cabs",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className="antialiased">
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
