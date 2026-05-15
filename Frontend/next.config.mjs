/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Proxy `/api/v1/*` to the real Express host so the browser stays same-origin
   * with the Next.js app. NextAuth’s httpOnly session cookie is only sent to
   * this app’s host — not to a separate API domain (e.g. Render).
   *
   * Set `BACKEND_PROXY_ORIGIN` at build time (e.g. https://openhouse-notify.onrender.com).
   * Use `NEXT_PUBLIC_API_URL=/api/v1` in the browser.
   */
  async rewrites() {
    const origin = process.env.BACKEND_PROXY_ORIGIN?.trim();
    if (!origin) return [];

    const base = origin.replace(/\/$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${base}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
