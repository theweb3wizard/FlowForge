import type { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';

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
    const supabase = await createServerClient();

    // Select all columns to avoid Supabase TypeScript inference issues with partial selects
    const { data: publicRecipes, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(500);

    if (error || !publicRecipes) {
      console.error('Sitemap: failed to fetch public recipes', error);
      return STATIC_ROUTES;
    }

    const recipeUrls: MetadataRoute.Sitemap = publicRecipes.map((recipe) => ({
      url: `${APP_URL}/recipe/shared/${recipe.id}`,
      lastModified: new Date(recipe.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...STATIC_ROUTES, ...recipeUrls];
  } catch (err) {
    // If Supabase is unavailable at build time, return only static routes
    console.error('Sitemap: unexpected error', err);
    return STATIC_ROUTES;
  }
}
