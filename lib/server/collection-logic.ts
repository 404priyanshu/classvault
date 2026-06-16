export type CollectionSlugVisibility = { isPublic: true } | { ownerId: string };

export type CollectionSlugWhere = {
  slug: string;
  OR: CollectionSlugVisibility[];
};

export function collectionSlugVisibility(userId: string | null): CollectionSlugVisibility[] {
  const visibility: CollectionSlugVisibility[] = [{ isPublic: true }];
  if (userId) visibility.push({ ownerId: userId });
  return visibility;
}

export function collectionSlugWhere(slug: string, userId: string | null): CollectionSlugWhere {
  return {
    slug,
    OR: collectionSlugVisibility(userId),
  };
}
