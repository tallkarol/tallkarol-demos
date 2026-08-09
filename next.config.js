/** @type {import('next').NextConfig} */

// Mirrors the header posture of tallkarol.com. These demos are linked from the
// marketing site as proof of work, so they get held to the same bar — a demo
// that fails a security header check would undercut the thing it's proving.
//
// Everything here is self-hosted and self-contained: no third-party scripts,
// no fonts from a CDN, no analytics, no outbound fetches. The CSP says so.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // next dev needs eval() for source maps; production stays strict.
      process.env.NODE_ENV !== "production"
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
]

const nextConfig = {
  reactStrictMode: true,
  // Lets a build run isolated from the .next/ a dev server is using, so a
  // second session can build without killing the first one's server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  compress: true,
  productionBrowserSourceMaps: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

module.exports = nextConfig
