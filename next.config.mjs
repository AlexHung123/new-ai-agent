/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/itms/ai',
  output: 'standalone',
  devIndicators: false,
  allowedDevOrigins: ['192.168.56.1'],
  images: {
    remotePatterns: [
      {
        hostname: 's2.googleusercontent.com',
      },
    ],
  },
  transpilePackages: ['react-pdf', 'pdfjs-dist'],
  serverExternalPackages: [
    '@earendil-works/pi-agent-core',
    '@earendil-works/pi-ai',
    'better-sqlite3',
    '@firecrawl/anydoc',
    'pdfjs-dist',
  ],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
