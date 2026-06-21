import { getCollection, type CollectionEntry } from "astro:content";

/**
 * Catégories : helpers pour résoudre un slug blog → { slug, title }.
 *
 * Le blog référence une catégorie par son slug (string). On reconstruit ici
 * le titre depuis la collection `categories` afin que les composants puissent
 * afficher le titre et construire le lien comme avant le refactoring.
 */

export type CategoryInfo = { slug: string; title: string };

let cache: Map<string, CategoryInfo> | null = null;

/** Construit une map slug → { slug, title } depuis la collection categories. */
export async function getCategoryMap(): Promise<Map<string, CategoryInfo>> {
  if (cache) return cache;
  const entries = await getCollection("categories");
  const map = new Map<string, CategoryInfo>();
  for (const entry of entries) {
    map.set(entry.id, { slug: entry.id, title: entry.data.title });
  }
  cache = map;
  return map;
}

/**
 * Résout un slug catégorie. Retourne le slug tel quel comme titre si la
 * catégorie n'existe pas encore (évite tout crash pendant la migration).
 */
export async function resolveCategory(slug: string): Promise<CategoryInfo> {
  const map = await getCategoryMap();
  return map.get(slug) ?? { slug, title: slug };
}

/** Toutes les catégories, triées par `order` puis par titre. */
export async function getSortedCategories(): Promise<
  CollectionEntry<"categories">[]
> {
  const entries = await getCollection("categories");
  return entries.sort(
    (a, b) =>
      (a.data.order ?? 0) - (b.data.order ?? 0) ||
      a.data.title.localeCompare(b.data.title),
  );
}
