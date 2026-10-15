import type { NextConfig } from "next";
const isProd = process.env.NODE_ENV === "production";

// Politique de contenu : l'app ne charge que ses propres scripts, polices et styles.
// Les images peuvent venir de n'importe quel site en https (chaque Actor a ses propres hébergeurs).
// 'unsafe-inline' est nécessaire pour les scripts que Next injecte ; en échange, les contenus d'Apify
// ne sont jamais interprétés comme du HTML. 'unsafe-eval' et ws: servent seulement en développement.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },

  },
  // Dans l'objet nextConfig :
  poweredByHeader: false, // ne révèle plus « X-Powered-By: Next.js »
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Réponses d'API (collectes, résultats) : jamais mises en cache
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
