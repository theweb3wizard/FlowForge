import type { MetadataRoute } from 'next';
import { db } from '@/lib/db/index';
import { recipes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flowforge.app';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: `${APP_URL}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 1.0,
  },
  {
    url: `${APP_URL}/playground`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    url: `${APP_URL}/privacy-policy`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.2,
  },
  {
    url: `${APP_URL}/terms-of-service`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.2,
  },
  {
    url: `${APP_URL}/refund-policy`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.2,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const rows = await db
      .select({ id: recipes.id, updatedAt: recipes.updatedAt })
      .from(recipes)
      .where(eq(recipes.isPublic, true))
      .limit(500);

    const recipeUrls: MetadataRoute.Sitemap = rows.map((recipe) => ({
      url: `${APP_URL}/recipe/shared/${recipe.id}`,
      lastModified: recipe.updatedAt instanceof Date ? recipe.updatedAt : new Date(recipe.updatedAt ?? Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...STATIC_ROUTES, ...recipeUrls];
  } catch (err) {
    console.error('Sitemap: unexpected error', err);
    return STATIC_ROUTES;
  }
}
