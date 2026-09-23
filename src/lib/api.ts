/**
 * Builds a URL for one of the app's API routes (src/app/api).
 * Relative URLs work on web and in development; native production builds
 * need EXPO_PUBLIC_API_URL pointing at the deployed site (e.g. your Vercel URL).
 */
export function apiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}
