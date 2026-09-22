import type { AnalyzedWord, CefrLevel } from '@/types';

import { apiUrl } from './api';
import { requireSupabase } from './supabase';

export async function analyzeImage(imageBase64: string, level: CefrLevel): Promise<AnalyzedWord[]> {
  const { data } = await requireSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Please sign in again.');

  const response = await fetch(apiUrl('/api/analyze'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64, level }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? `Analysis failed (${response.status}).`);
  }
  return body.words as AnalyzedWord[];
}
