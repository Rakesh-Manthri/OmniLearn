/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static 404/error page generation to avoid _document conflicts with App Router
  output: undefined,
  experimental: {
    // Silence Radix UI/Shadcn Dialog SSR warnings  
  },
};

module.exports = nextConfig;
