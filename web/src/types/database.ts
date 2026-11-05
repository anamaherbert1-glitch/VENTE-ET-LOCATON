/** Types d'interface BUILDTRACE. Les données persistées utilisent public.products. */

export type ListingType = 'sale' | 'rent' | 'both';
export type ListingStatus = 'draft' | 'published' | 'archived';
export type ListingCondition = string;
export type AccountType = 'particulier' | 'professionnel' | 'entreprise';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  account_type: AccountType;
  city: string | null;
  avatar_url: string | null;
  shop_name?: string | null;
  shop_description?: string | null;
  shop_logo_url?: string | null;
  shop_address?: string | null;
  shop_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  public_id?: string;
  owner_id: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  dimensions: string | null;
  condition: ListingCondition | null;
  listing_type: ListingType;
  sale_price_xof: number | null;
  rental_price_xof: number | null;
  rental_period: string | null;
  location: string;
  photo_urls: string[];
  status: ListingStatus;
  published_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  product_title: string;
  product_offer_type: string;
  product_photo_paths: string[];
  buyer_name: string;
  seller_name: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface CreateListingInput {
  title: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  dimensions?: string;
  condition?: ListingCondition;
  listing_type: ListingType;
  sale_price_xof?: number | null;
  rental_price_xof?: number | null;
  rental_period?: string | null;
  location: string;
  photo_urls?: string[];
  status?: ListingStatus;
}
