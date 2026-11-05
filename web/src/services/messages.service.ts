import { supabase } from '../lib/supabase';
import type { Conversation, Message } from '../types/database';

export async function getOrCreateConversation(params: {
  productId: string;
  buyerId: string;
  sellerId: string;
  productTitle?: string;
  productOfferType?: string;
  productPhotoPaths?: string[];
}): Promise<Conversation> {
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .eq('product_id', params.productId)
    .eq('buyer_id', params.buyerId)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing as Conversation;

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      product_id: params.productId,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      product_title: params.productTitle ?? 'Annonce BUILDTRACE',
      product_offer_type: params.productOfferType ?? 'sale',
      product_photo_paths: params.productPhotoPaths ?? [],
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function listConversationsForUser(
  userId: string,
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Conversation[];
}

export async function listMessages(
  conversationId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
}): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: params.conversationId,
      sender_id: params.senderId,
      body: params.content.trim(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Message;
}
