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
  serverExternalPackages: ['pdf-parse', '@shareai-lab/kode-sdk', 'better-sqlite3', 'e2b'],
};

export default nextConfig;
