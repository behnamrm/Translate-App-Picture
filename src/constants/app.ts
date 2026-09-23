export const APP_NAME = 'WortBlick';

/** Shown on the Privacy Policy and Terms pages. Replace with the address you use for app support. */
export const CONTACT_EMAIL = process.env.EXPO_PUBLIC_CONTACT_EMAIL ?? 'your-email@example.com';

/** Routes that anyone can open without signing in (Google requires public policy URLs). */
export const PUBLIC_ROUTES = ['/privacy', '/terms'];
