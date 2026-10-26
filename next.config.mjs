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
    // The dev router proxy otherwise stops a quiet upstream socket after 30s.
    // Uploads of long recordings need the socket to stay open until the file
    // has been stored. Transcription itself is polled on a separate request.
    proxyTimeout: 3_600_000,
    // Middleware clones request bodies (default 10MB). Speech uploads still
    // pass through /api/voice/speech. serverActions.bodySizeLimit does not
    // apply to Route Handlers.
    middlewareClientMaxBodySize: '2gb',
    serverActions: {
      bodySizeLimit: '2gb',
    },
  },
};

export default nextConfig;
