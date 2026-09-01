import { copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

copyFileSync(
  join(root, 'node_modules/pdfjs-dist/build/pdf.min.mjs'),
  join(root, 'public/pdf.min.mjs'),
);
copyFileSync(
  join(root, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
  join(root, 'public/pdf.worker.min.mjs'),
);

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
  transpilePackages: ['react-pdf'],
  serverExternalPackages: [
    '@earendil-works/pi-agent-core',
    '@earendil-works/pi-ai',
    'better-sqlite3',
    '@firecrawl/anydoc',
  ],
  turbopack: {
    resolveAlias: {
      'pdfjs-dist': './src/lib/pdfjsBrowser.ts',
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    config.experiments = { ...config.experiments, topLevelAwait: true };
    if (!isServer) {
      config.resolve.alias['pdfjs-dist$'] = join(
        root,
        'src/lib/pdfjsBrowser.ts',
      );
    }
    return config;
  },
};

export default nextConfig;
