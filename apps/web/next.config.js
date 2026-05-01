/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ORGANIZATION/PROJECT-api"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "3001" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
