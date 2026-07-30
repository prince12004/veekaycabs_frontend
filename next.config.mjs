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
    ],
  },
  // Permanent redirects for the /seo/ -> /car/ and /blogs/ -> /blog/ URL
  // structure changes, so existing SEO rankings / bookmarked / indexed links
  // to the old paths keep working instead of 404ing.
  async redirects() {
    return [
      { source: "/seo/:slug", destination: "/car/:slug", permanent: true },
      { source: "/blogs", destination: "/blog", permanent: true },
      { source: "/blogs/:slug", destination: "/blog/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
