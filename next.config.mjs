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
  ],
};

export default nextConfig;
