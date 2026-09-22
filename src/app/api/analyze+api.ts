import { CEFR_LEVELS, type AnalyzedWord, type CefrLevel } from '@/types';

// Runs on the server (Expo dev server locally, a Vercel function in production),
// so the Gemini API key never reaches the client.

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DEFAULT_MODEL = 'gemini-3.8-flash';
const MAX_IMAGE_BASE64_LENGTH = 4_000_000; // ~3 MB JPEG

const WORDS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['words'],
  properties: {
    words: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['word', 'base_form', 'persian_translation', 'simple_german'],
        properties: {
          word: { type: 'string', description: 'The German word as it appears in the image.' },
          base_form: {
            type: 'string',
            description:
              'Infinitive for verbs; nominative singular with article for nouns (e.g. "die Zutat").',
          },
          persian_translation: { type: 'string', description: 'Meaning in Persian (Farsi).' },
          simple_german: {
            type: 'string',
            description: 'Short explanation in simple A2-level German.',
          },
        },
      },
    },
  },
} as const;

function systemPrompt(level: CefrLevel) {
  return [
    'You are a German language teacher. Examine the attached image of a product or sign.',
    '1. Extract all meaningful German words.',
    `2. Filter the words to only include those at the ${level} level.`,
    "3. Return a JSON object with a 'words' array of objects with the following keys: 'word' (the German word), " +
      "'base_form' (infinitive or nominative form), 'persian_translation' (Farsi meaning), " +
      "'simple_german' (explanation in A2 German).",
    'Do not include basic A1 words. Ignore brand names, numbers, and non-German text. ' +
      'List each word only once. If there is no German text, return an empty array.',
  ].join('\n');
}

function error(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

/** Client IDs whose Google access tokens may call this route. */
function allowedClientIds(): string[] {
  return [
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    ...(process.env.GOOGLE_ALLOWED_CLIENT_IDS ?? '').split(','),
  ]
    .map((id) => id?.trim())
    .filter((id): id is string => Boolean(id));
}

/**
 * Verifies the caller's Google access token and that it was issued to this app,
 * so only signed-in users of WortBlick can spend the Gemini quota.
 */
async function isAuthorized(request: Request): Promise<boolean> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return false;
  const token = authorization.slice('Bearer '.length);

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`,
  );
  if (!response.ok) return false;
  const info = (await response.json()) as { aud?: string; azp?: string };
  const clientIds = allowedClientIds();
  return clientIds.some((id) => id === info.aud || id === info.azp);
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return error(500, 'GEMINI_API_KEY is not set on the server.');

  if (!(await isAuthorized(request))) return error(401, 'Please sign in to analyze images.');

  const body = await request.json().catch(() => null);
  const imageBase64: unknown = body?.imageBase64;
  const level: unknown = body?.level;

  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    return error(400, 'imageBase64 is required.');
  }
  if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    return error(413, 'The image is too large.');
  }
  if (!CEFR_LEVELS.includes(level as CefrLevel)) {
    return error(400, `level must be one of ${CEFR_LEVELS.join(', ')}.`);
  }

  const geminiResponse = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      store: false,
      system_instruction: systemPrompt(level as CefrLevel),
      input: [
        { type: 'text', text: `Target level: ${level}` },
        { type: 'image', data: imageBase64, mime_type: 'image/jpeg' },
      ],
      response_format: { type: 'text', mime_type: 'application/json', schema: WORDS_SCHEMA },
      generation_config: { thinking_level: 'low' },
    }),
  });

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text();
    console.error('Gemini error', geminiResponse.status, detail);
    if (geminiResponse.status === 429) {
      return error(
        429,
        'Too many scans right now (free AI quota reached). Please try again later.',
      );
    }
    return error(502, 'The AI service could not analyze this image. Please try again.');
  }

  const interaction = (await geminiResponse.json()) as {
    steps?: { type: string; content?: { type: string; text?: string }[] }[];
  };
  const text = (interaction.steps ?? [])
    .filter((step) => step.type === 'model_output')
    .flatMap((step) => step.content ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('');

  try {
    const parsed = JSON.parse(text || '{}') as { words?: AnalyzedWord[] };
    return Response.json({ words: parsed.words ?? [] });
  } catch {
    return error(502, 'The AI returned an unexpected response.');
  }
}
