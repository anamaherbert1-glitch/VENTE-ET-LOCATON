import { supabase } from '../lib/supabase';
import type { CreateListingInput, Listing } from '../types/database';

type ProductRow = Record<string, any>;

function mapProduct(row: ProductRow): Listing {
  const listingType = row.offer_type === 'rental' ? 'rent' : row.offer_type;
  return {
    id: row.id,
    public_id: row.public_id,
    owner_id: row.owner_id,
    title: row.title,
    description: row.description ?? '',
    category: row.category,
    quantity: Number(row.quantity),
    unit: row.unit,
    dimensions: row.dimensions ?? null,
    condition: row.condition ?? null,
    listing_type: listingType,
    sale_price_xof: row.sale_price_xof ?? (listingType === 'rent' ? null : Number(row.price_xof)),
    rental_price_xof: row.rental_price_xof ?? (listingType === 'sale' ? null : Number(row.price_xof)),
    rental_period: row.rental_period ?? null,
    location: row.city,
    photo_urls: row.photo_paths ?? [],
    status: row.status,
    published_at: row.created_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function fetchPublishedListings(limit = 40): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('public_products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function fetchMyListings(ownerId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function fetchListingById(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('public_products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function createListing(
  ownerId: string,
  input: CreateListingInput,
): Promise<Listing> {
  const salePrice = input.listing_type === 'rent' ? null : input.sale_price_xof ?? null;
  const rentalPrice = input.listing_type === 'sale' ? null : input.rental_price_xof ?? null;
  const primaryPrice = input.listing_type === 'rent' ? rentalPrice : salePrice;
  if (primaryPrice == null || primaryPrice <= 0) {
    throw new Error('Un prix valide est obligatoire pour publier ce produit.');
  }

  const payload = {
    owner_id: ownerId,
    offer_type: input.listing_type === 'rent' ? 'rental' : input.listing_type,
    title: input.title,
    description: input.description ?? '',
    category: input.category,
    price_xof: primaryPrice,
    sale_price_xof: salePrice,
    rental_price_xof: rentalPrice,
    rental_period: input.rental_period ?? null,
    quantity: input.quantity,
    unit: input.unit,
    dimensions: input.dimensions ?? null,
    condition: input.condition ?? null,
    city: input.location,
    photo_paths: input.photo_urls ?? [],
    status: input.status ?? 'published',
  };
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function searchListings(params: {
  query?: string;
  category?: string;
  location?: string;
}): Promise<Listing[]> {
  let query = supabase
    .from('public_products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (params.category) query = query.eq('category', params.category);
  if (params.location) query = query.ilike('city', `%${params.location}%`);
  if (params.query) query = query.ilike('title', `%${params.query}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}
