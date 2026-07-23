/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lukyss-bar/api-types"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "3001" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
