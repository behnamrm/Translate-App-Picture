import type { AnalyzedWord, Flashcard } from '@/types';

import { endOfToday, reviewCard } from './leitner';
import { requireSupabase } from './supabase';

const BUCKET = 'context-images';

export class DuplicateCardError extends Error {
  constructor(word: string) {
    super(`"${word}" is already in your flashcards.`);
  }
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Uploads the scanned photo to private storage and returns its storage path. */
export async function uploadContextImage(base64: string): Promise<string> {
  const supabase = requireSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in.');

  const path = `${auth.user.id}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, base64ToBytes(base64), { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

export async function addFlashcard(word: AnalyzedWord, contextImagePath: string | null) {
  const supabase = requireSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in.');

  const germanWord = word.base_form || word.word;
  const { error } = await supabase.from('flashcards').insert({
    user_id: auth.user.id,
    german_word: germanWord,
    context_image_url: contextImagePath,
    persian_translation: word.persian_translation,
    german_explanation: word.simple_german,
  });
  if (error?.code === '23505') throw new DuplicateCardError(germanWord);
  if (error) throw error;
}

export async function fetchDueFlashcards(): Promise<Flashcard[]> {
  const { data, error } = await requireSupabase()
    .from('flashcards')
    .select('*')
    .lte('next_review_date', endOfToday().toISOString())
    .order('next_review_date', { ascending: true });
  if (error) throw error;
  return data as Flashcard[];
}

export async function fetchBoxCounts(): Promise<Record<number, number>> {
  const { data, error } = await requireSupabase().from('flashcards').select('leitner_box');
  if (error) throw error;
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of data) counts[row.leitner_box] = (counts[row.leitner_box] ?? 0) + 1;
  return counts;
}

export async function submitReview(card: Flashcard, correct: boolean) {
  const update = reviewCard(card.leitner_box, correct);
  const { error } = await requireSupabase().from('flashcards').update(update).eq('id', card.id);
  if (error) throw error;
  return update;
}

export async function deleteFlashcard(id: string) {
  const { error } = await requireSupabase().from('flashcards').delete().eq('id', id);
  if (error) throw error;
}

/** Signed URLs for context images; storage paths are private to each user. */
export async function signContextImages(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await requireSupabase()
    .storage.from(BUCKET)
    .createSignedUrls(paths, 60 * 60);
  if (error) throw error;
  const urls: Record<string, string> = {};
  for (const item of data) if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  return urls;
}
