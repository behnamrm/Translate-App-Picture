export const CEFR_LEVELS = ['A2', 'B1', 'B2', 'C1'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/** One word returned by the AI analysis of an image. */
export interface AnalyzedWord {
  word: string;
  base_form: string;
  persian_translation: string;
  simple_german: string;
}

/** A flashcard, stored in flashcards.json in the user's Google Drive app folder. */
export interface Flashcard {
  id: string;
  german_word: string;
  /** Google Drive file id of the scanned photo, if it was saved. */
  context_image_url: string | null;
  persian_translation: string;
  german_explanation: string;
  /** Leitner box, 1–5. */
  leitner_box: number;
  /** ISO timestamp. */
  next_review_date: string;
  created_at: string;
}
