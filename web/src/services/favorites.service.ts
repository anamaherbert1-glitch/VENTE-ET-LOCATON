import { supabase } from '../lib/supabase';
import type { Favorite, Listing } from '../types/database';

export async function listFavorites(userId: string): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as Favorite[];
}

export async function listFavoriteListings(userId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('product_id, products(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? [])
    .map((row: { products: Listing | Listing[] | null }) => {
      const l = row.products;
      return Array.isArray(l) ? l[0] : l;
    })
    .filter(Boolean) as Listing[];
}

export async function addFavorite(
  userId: string,
  productId: string,
): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, product_id: productId });
  if (error) throw error;
}

export async function removeFavorite(
  userId: string,
  productId: string,
): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  if (error) throw error;
}
