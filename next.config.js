/** @type {import('next').NextConfig} */

// CSP только в проде: dev-серверу Next нужны eval (source maps) и ws (HMR).
// 'unsafe-inline' для script-src вынужден: страницы статические (SSG),
// per-request nonce для них невозможен, а Next вставляет инлайн-бутстрап.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Content-Security-Policy', value: csp }]
    : []),
  // Год HSTS без preload: preload требует отдельного осознанного решения.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
