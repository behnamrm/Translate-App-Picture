import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1280;

/**
 * Downscales and re-encodes an image as JPEG so the upload stays well under
 * serverless request limits (~4.5 MB on Vercel) while text stays legible.
 */
export async function prepareImage(uri: string, width: number) {
  const context = ImageManipulator.manipulate(uri);
  if (width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!result.base64) throw new Error('Could not read the image.');
  return { uri: result.uri, base64: result.base64 };
}
