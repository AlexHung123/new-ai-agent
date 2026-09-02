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
  serverExternalPackages: [
    '@earendil-works/pi-agent-core',
    '@earendil-works/pi-ai',
    'better-sqlite3',
    '@firecrawl/anydoc',
  ],
  experimental: {
    // Middleware clones request bodies (default 10MB). Video transcribe
    // uploads go through /api/voice middleware; serverActions.bodySizeLimit
    // does not apply to Route Handlers.
    middlewareClientMaxBodySize: '2gb',
    serverActions: {
      bodySizeLimit: '2gb',
    },
  },
};

export default nextConfig;
