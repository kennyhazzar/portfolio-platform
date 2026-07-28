import type { MetadataRoute } from 'next';
import { SITE_NAME, SITE_URL } from '@/shared/seo/metadata';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'KH',
    description: 'Personal website of a backend/fullstack engineer.',
    start_url: '/ru',
    scope: '/',
    display: 'standalone',
    background_color: '#070b12',
    theme_color: '#3b82f6',
    categories: ['portfolio', 'technology', 'developer'],
    lang: 'en',
    id: SITE_URL,
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
