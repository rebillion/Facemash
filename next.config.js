/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // waifu.im images are loaded directly in the browser. This avoids routing each
  // image through the Next.js server, which can prevent them rendering locally.
  images: { unoptimized: true },
};

module.exports = nextConfig;
