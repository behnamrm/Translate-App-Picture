// Minimal Google Drive v3 client for the app's private appDataFolder.
import { getAccessToken } from './session';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

async function driveFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Google Drive request failed (${response.status}). ${detail.slice(0, 200)}`);
  }
  return response;
}

function multipartBody(metadata: object, content: string, mimeType: string, base64: boolean) {
  const boundary = `wortblick-${Math.random().toString(36).slice(2)}`;
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    ...(base64 ? ['Content-Transfer-Encoding: base64'] : []),
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');
  return { body, contentType: `multipart/related; boundary=${boundary}` };
}

export async function findFile(name: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${name}' and trashed = false`);
  const response = await driveFetch(
    `${API}/files?spaces=appDataFolder&q=${query}&fields=files(id)&pageSize=1`,
  );
  const { files } = (await response.json()) as { files: { id: string }[] };
  return files[0]?.id ?? null;
}

export async function createFile(
  name: string,
  content: string,
  mimeType: string,
  { base64 = false } = {},
): Promise<string> {
  const { body, contentType } = multipartBody(
    { name, parents: ['appDataFolder'], mimeType },
    content,
    mimeType,
    base64,
  );
  const response = await driveFetch(`${UPLOAD}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  });
  return ((await response.json()) as { id: string }).id;
}

export async function updateFile(id: string, content: string, mimeType: string) {
  await driveFetch(`${UPLOAD}/files/${id}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': mimeType },
    body: content,
  });
}

export async function downloadText(id: string): Promise<string> {
  const response = await driveFetch(`${API}/files/${id}?alt=media`);
  return response.text();
}

export async function downloadDataUri(id: string): Promise<string> {
  const response = await driveFetch(`${API}/files/${id}?alt=media`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.readAsDataURL(blob);
  });
}

export async function deleteFile(id: string) {
  await driveFetch(`${API}/files/${id}`, { method: 'DELETE' });
}
