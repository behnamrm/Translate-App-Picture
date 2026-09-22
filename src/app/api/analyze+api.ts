import { CEFR_LEVELS, type AnalyzedWord, type CefrLevel } from '@/types';

// Runs on the server (Expo dev server locally, a Vercel function in production),
// so the OpenAI key never reaches the client.

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

/** Verifies the caller's Supabase access token so only signed-in users can spend OpenAI credits. */
async function isAuthorized(request: Request): Promise<boolean> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return false;

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return false;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization },
  });
  return response.ok;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return error(500, 'OPENAI_API_KEY is not set on the server.');

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

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'german_words', strict: true, schema: WORDS_SCHEMA },
      },
      messages: [
        { role: 'system', content: systemPrompt(level as CefrLevel) },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Target level: ${level}` },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' },
            },
          ],
        },
      ],
    }),
  });

  if (!openaiResponse.ok) {
    const detail = await openaiResponse.text();
    console.error('OpenAI error', openaiResponse.status, detail);
    return error(502, 'The AI service could not analyze this image. Please try again.');
  }

  const completion = await openaiResponse.json();
  const message = completion.choices?.[0]?.message;
  if (message?.refusal) return error(422, message.refusal);

  try {
    const parsed = JSON.parse(message?.content ?? '{}') as { words?: AnalyzedWord[] };
    return Response.json({ words: parsed.words ?? [] });
  } catch {
    return error(502, 'The AI returned an unexpected response.');
  }
}
