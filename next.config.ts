import type { NextConfig } from "next";

// Security Headers (ohne CSP - verursacht Kompatibilitätsprobleme mit React/Babel)
const securityHeaders = [
  {
    // Verhindert Clickjacking
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    // Verhindert MIME-Type Sniffing
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    // XSS-Schutz für ältere Browser
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    // Referrer Policy
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    // Permissions Policy - Kamera, Mikrofon etc. blockieren
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    // Strict Transport Security (HTTPS erzwingen)
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }
  // CSP entfernt - verursacht Probleme mit inline React/Babel
];

const nextConfig: NextConfig = {
  // Security Headers für alle Routen
  async headers() {
    return [
      {
        // Alle Routen
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // Powered-by Header entfernen
  poweredByHeader: false,
};

export default nextConfig;
