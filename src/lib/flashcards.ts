// Flashcards are stored as one JSON file in the user's Google Drive appDataFolder.
import type { AnalyzedWord, Flashcard } from '@/types';

import * as drive from './drive';
import { endOfToday, reviewCard } from './leitner';

const FILE_NAME = 'flashcards.json';

interface FlashcardFile {
  version: 1;
  cards: Flashcard[];
}

interface Store {
  fileId: string | null;
  data: FlashcardFile;
}

let storePromise: Promise<Store> | null = null;
// Writes are applied one after another so concurrent saves can't overwrite each other.
let writeQueue: Promise<unknown> = Promise.resolve();
const imageCache = new Map<string, Promise<string>>();

export class DuplicateCardError extends Error {
  constructor(word: string) {
    super(`"${word}" is already in your flashcards.`);
  }
}

async function loadStore(): Promise<Store> {
  const fileId = await drive.findFile(FILE_NAME);
  if (!fileId) return { fileId: null, data: { version: 1, cards: [] } };
  const data = JSON.parse(await drive.downloadText(fileId)) as FlashcardFile;
  return { fileId, data: { version: 1, cards: data.cards ?? [] } };
}

function getStore(): Promise<Store> {
  storePromise ??= loadStore().catch((e) => {
    storePromise = null;
    throw e;
  });
  return storePromise;
}

function mutate<T>(change: (cards: Flashcard[]) => { cards: Flashcard[]; result: T }): Promise<T> {
  const run = async () => {
    const store = await getStore();
    const { cards, result } = change(store.data.cards);
    const next: FlashcardFile = { version: 1, cards };
    const json = JSON.stringify(next);
    if (store.fileId) await drive.updateFile(store.fileId, json, 'application/json');
    else store.fileId = await drive.createFile(FILE_NAME, json, 'application/json');
    store.data = next;
    return result;
  };
  const result = writeQueue.then(run, run);
  writeQueue = result.catch(() => undefined);
  return result;
}

/** Forget the cached file, e.g. after signing out. */
export function clearFlashcardCache() {
  storePromise = null;
  imageCache.clear();
}

/** Saves the scanned photo to Drive and returns its file id. */
export function uploadContextImage(base64: string): Promise<string> {
  return drive.createFile(`scan-${Date.now()}.jpg`, base64, 'image/jpeg', { base64: true });
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function addFlashcard(word: AnalyzedWord, contextImageId: string | null) {
  const germanWord = word.base_form || word.word;
  return mutate((cards) => {
    if (cards.some((c) => c.german_word.toLowerCase() === germanWord.toLowerCase())) {
      throw new DuplicateCardError(germanWord);
    }
    const now = new Date().toISOString();
    const card: Flashcard = {
      id: createId(),
      german_word: germanWord,
      context_image_url: contextImageId,
      persian_translation: word.persian_translation,
      german_explanation: word.simple_german,
      leitner_box: 1,
      // New cards are due immediately so they can be practised the same day.
      next_review_date: now,
      created_at: now,
    };
    return { cards: [...cards, card], result: card };
  });
}

export async function fetchDueFlashcards(): Promise<Flashcard[]> {
  const { data } = await getStore();
  const cutoff = endOfToday().getTime();
  return data.cards
    .filter((c) => new Date(c.next_review_date).getTime() <= cutoff)
    .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date));
}

export async function fetchBoxCounts(): Promise<Record<number, number>> {
  const { data } = await getStore();
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const card of data.cards) counts[card.leitner_box] += 1;
  return counts;
}

export function submitReview(card: Flashcard, correct: boolean) {
  const update = reviewCard(card.leitner_box, correct);
  return mutate((cards) => ({
    cards: cards.map((c) => (c.id === card.id ? { ...c, ...update } : c)),
    result: update,
  }));
}

/** Loads a context image from Drive as a data URI (Drive files need an auth header). */
export function getContextImage(fileId: string): Promise<string> {
  let image = imageCache.get(fileId);
  if (!image) {
    image = drive.downloadDataUri(fileId);
    image.catch(() => imageCache.delete(fileId));
    imageCache.set(fileId, image);
  }
  return image;
}
