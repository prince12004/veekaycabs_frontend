/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/seo/:slug", destination: "/car/:slug", permanent: true },
      { source: "/blogs", destination: "/blog", permanent: true },
      { source: "/blogs/:slug", destination: "/blog/:slug", permanent: true },

      {
        source: "/:path*",
        has: [{ type: "host", value: "www.veekaycabs.com" }],
        destination: "https://veekaycabs.com/:path*",
        permanent: true,
      },

      {
        source: "/self-drive-cars-in-delhi",
        destination: "/",
        permanent: true,
      },
      {
        source: "/self-drive-cars-in-noida",
        destination: "/car/self-drive-car-on-rent-noida",
        permanent: true,
      },
      {
        source: "/self-drive-cars-in-gurgaon",
        destination: "/car/self-drive-car-on-rent-gurgaon",
        permanent: true,
      },
      {
        source: "/self-drive-cars-in-ghaziabad",
        destination: "/car/self-drive-car-on-rent-ghaziabad",
        permanent: true,
      },
      {
        source: "/self-drive-cars-in-greater-noida",
        destination: "/car/self-drive-car-rental-in-greater-noida",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
