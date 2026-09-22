export interface GoogleUser {
  email: string;
  name: string | null;
  picture: string | null;
}

export interface GoogleSession {
  accessToken: string;
  /** Epoch milliseconds. */
  expiresAt: number;
  user: GoogleUser;
}

/** Drive "appDataFolder": a hidden folder only this app can read, inside the user's own Drive. */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
export const GOOGLE_SCOPES = ['openid', 'email', 'profile', DRIVE_SCOPE];

export const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export async function fetchGoogleUser(accessToken: string): Promise<GoogleUser> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Could not load your Google profile.');
  const info = await response.json();
  return { email: info.email, name: info.name ?? null, picture: info.picture ?? null };
}
