import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flowforge.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/recipe/shared/'],
        disallow: ['/dashboard', '/api/', '/pricing', '/recipe/'],
      },
      {
        // Re-allow shared recipe URLs that were caught by /recipe/ disallow
        userAgent: '*',
        allow: ['/recipe/shared/'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
