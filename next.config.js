/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['twitterbot.dev', 'localhost:3000'],
    unoptimized: true,
  },
};

export default nextConfig;
