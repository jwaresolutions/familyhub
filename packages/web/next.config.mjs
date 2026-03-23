/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.CLOUDFLARE ? 'export' : 'standalone',
  images: process.env.CLOUDFLARE ? { unoptimized: true } : undefined,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

export default nextConfig;
