export const CEFR_LEVELS = ['A2', 'B1', 'B2', 'C1'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/** One word returned by the AI analysis of an image. */
export interface AnalyzedWord {
  word: string;
  base_form: string;
  persian_translation: string;
  simple_german: string;
}

/** A row of the `flashcards` table in Supabase. */
export interface Flashcard {
  id: string;
  user_id: string;
  german_word: string;
  context_image_url: string | null;
  persian_translation: string;
  german_explanation: string;
  leitner_box: 1 | 2 | 3 | 4 | 5;
  next_review_date: string;
}
