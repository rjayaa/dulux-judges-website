import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "nos.wjv-1.neo.id",
      "st01.nos.wjv-1.neo.id",
      "dulux-demo.codenito.id",
      "duluxdesigncompetition.com",
    ],
    // Next.js memiliki batasan untuk format yang dapat digunakan
    formats: ['image/avif', 'image/webp'],
    // remotePatterns harus berada di dalam objek images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.nos.wjv-1.neo.id',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'st01.nos.wjv-1.neo.id',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'duluxdesigncompetition.com',
        pathname: '/**',
      },
    ],
    // Meningkatkan batas ukuran gambar untuk OpenGraph
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 1024],
  },
  // Tambahkan konfigurasi untuk headers khusus
  async headers() {
    return [
      {
        // Berlaku untuk semua routes
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=60',
          },
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
      {
        // Khusus untuk rute news
        source: '/news/:id',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // public routing
      {
        source: "/home",
        destination: "/pages/public/general/home",
      },
      {
        source: "/about-us",
        destination: "/pages/public/general/about-us",
      },
      {
        source: "/term-of-references",
        destination: "/pages/public/general/term-of-references",
      },
      {
        source: "/prize",
        destination: "/pages/public/general/prize",
      },
      {
        source: "/contact-us",
        destination: "/pages/public/general/contact-us",
      },
      {
        source: "/news",
        destination: "/pages/public/general/news",
      },
      {
        source: "/news/:id",
        destination: "/pages/public/general/news/:id",
      },
      {
        source: "/contact-us",
        destination: "/pages/public/general/contact-us",
      },
      {
        source: "/faq",
        destination: "/pages/public/general/faq",
      },
      {
        source: "/privacy-policy",
        destination: "/pages/privacy-policy",
      },
      {
        source: "/id/privacy-policy",
        destination: "/pages/id/privacy-policy",
      },
      // public autentikasi
      {
        source: "/auth/login",
        destination: "/pages/public/auth/login",
      },
      {
        source: "/auth/register",
        destination: "/pages/public/auth/register",
      },
      {
        source: "/auth/forgot-password",
        destination: "/pages/public/auth/forgot-password",
      },
      // user routes
      {
        source: "/user/dashboard",
        destination: "/pages/user/dashboard/",
      },
      {
        source: "/user/submission",
        destination: "/pages/user/submission/",
      },
      {
        source: "/submissionFile/:path*",
        destination: "/submissionFile/:path*",
      },
      {
        source: "/formSubmissionFile/:path*",
        destination: "/formSubmissionFile/:path*",
      },
      {
        source: "/user/profile",
        destination: "/pages/user/profile/",
      },
      // admin routes
      {
        source: "/dashboard/admin",
        destination: "/pages/dashboard/admin",
      },
      {
        source: "/admin/cms",
        destination: "/pages/admin/cms",
      },
      {
        source: "/admin/dashboard",
        destination: "/pages/admin/dashboard",
      },
      {
        source: "/admin/users",
        destination: "/pages/admin/users",
      },
      {
        source: "/admin/submissions",
        destination: "/pages/admin/submissions",
      },
      {
        source: "/admin/contact",
        destination: "/pages/admin/contact",
      },
      {
        source: "/auth/verify-otp",
        destination: "/pages/public/auth/verify-otp",
      },
      {
        source: "/auth/participant-level",
        destination: "/pages/public/auth/participant-level",
      },
      // jury routes
      {
        source: "/jury/dashboard",
        destination: "/pages/jury/dashboard",
      },
      {
        source: "/jury/submissions",
        destination: "/pages/jury/submissions",
      },
      {
        source: "/jury/submissions/:id",
        destination: "/pages/jury/submissions/[id]",
      },
    ];
  },
};

export default nextConfig;