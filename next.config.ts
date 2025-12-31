import type { NextConfig } from "next";

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
  },
  {
    // Content Security Policy
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://unpkg.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.stripe.com https://tools.rki.de",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; ')
  }
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
