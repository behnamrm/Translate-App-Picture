// Web implementation: Google Identity Services token client (popup, no backend needed).
// Native builds use auth.native.ts instead.
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DRIVE_SCOPE,
  fetchGoogleUser,
  GOOGLE_SCOPES,
  webClientId,
  type GoogleSession,
} from './types';

const STORAGE_KEY = 'wortblick.google-session';
const GSI_SRC = 'https://accounts.google.com/gsi/client';

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken(overrides?: { prompt?: string; login_hint?: string }): void;
}

interface GoogleOAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message?: string }) => void;
  }): TokenClient;
  hasGrantedAllScopes(response: TokenResponse, ...scopes: string[]): boolean;
  revoke(token: string, done?: () => void): void;
}

declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleOAuth2 } };
  }
}

export const isGoogleConfigured = Boolean(webClientId);

let scriptPromise: Promise<void> | null = null;

/** Loads the Google Identity Services script. Call early so the popup opens directly on click. */
export function preloadGoogleSignIn(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load Google Sign-In.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function requestToken(loginHint?: string): Promise<TokenResponse> {
  await preloadGoogleSignIn();
  const oauth2 = window.google!.accounts.oauth2;
  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: webClientId!,
      scope: GOOGLE_SCOPES.join(' '),
      callback: (response) => {
        if (response.error) reject(new Error(response.error_description ?? response.error));
        else if (!oauth2.hasGrantedAllScopes(response, DRIVE_SCOPE)) {
          reject(new Error('Please allow access to Google Drive so your flashcards can be saved.'));
        } else resolve(response);
      },
      error_callback: (error) =>
        reject(new Error(error.type === 'popup_closed' ? 'Sign-in was cancelled.' : error.message)),
    });
    client.requestAccessToken({ prompt: '', login_hint: loginHint });
  });
}

export async function signInWithGoogle(loginHint?: string): Promise<GoogleSession> {
  if (!isGoogleConfigured) throw new Error('Google Sign-In is not configured.');
  const token = await requestToken(loginHint);
  const accessToken = token.access_token!;
  const session: GoogleSession = {
    accessToken,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    user: await fetchGoogleUser(accessToken),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

/** Returns the stored session, even if expired, so the UI can offer "Continue as …". */
export async function restoreSession(): Promise<GoogleSession | null> {
  if (typeof window === 'undefined') return null;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GoogleSession) : null;
  } catch {
    return null;
  }
}

/** Browsers can only get a new token from a user gesture, so expired sessions must sign in again. */
export async function refreshSession(_session: GoogleSession): Promise<GoogleSession | null> {
  return null;
}

export async function signOutGoogle(session: GoogleSession | null) {
  await AsyncStorage.removeItem(STORAGE_KEY);
  if (session && window.google) window.google.accounts.oauth2.revoke(session.accessToken);
}
