import type { AnalyzedWord, CefrLevel } from '@/types';

import { apiUrl } from './api';
import { getAccessToken } from './session';

export async function analyzeImage(imageBase64: string, level: CefrLevel): Promise<AnalyzedWord[]> {
  const token = await getAccessToken();

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
