/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, { isServer }) {
    if (isServer) {
      require('./scripts/generate-token-and-fetch-index');
    }
    return config;
  },
};

module.exports = nextConfig;
