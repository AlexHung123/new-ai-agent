import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'iTMS - Chat with the iTMS',
    short_name: 'iTMS AI',
    description:
      'iTMS AI is an AI powered chatbot that is connected to iTMS.',
    start_url: '/itms/ai/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    screenshots: [
      {
        src: '/itms/ai/screenshots/p1.png',
        form_factor: 'wide',
        sizes: '2560x1600',
      },
      {
        src: '/itms/ai/screenshots/p2.png',
        form_factor: 'wide',
        sizes: '2560x1600',
      },
      {
        src: '/itms/ai/screenshots/p1_small.png',
        form_factor: 'narrow',
        sizes: '828x1792',
      },
      {
        src: '/itms/ai/screenshots/p2_small.png',
        form_factor: 'narrow',
        sizes: '828x1792',
      },
    ],
    icons: [
      {
        src: '/itms/ai/icon-50.png',
        sizes: '50x50',
        type: 'image/png' as const,
      },
      {
        src: '/itms/ai/icon-100.png',
        sizes: '100x100',
        type: 'image/png',
      },
      {
        src: '/itms/ai/icon.png',
        sizes: '440x440',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
