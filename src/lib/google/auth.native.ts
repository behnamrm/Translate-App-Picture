// Native implementation (iOS/Android). Requires a development build:
// @react-native-google-signin/google-signin is not included in Expo Go.
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { DRIVE_SCOPE, iosClientId, webClientId, type GoogleSession } from './types';

export const isGoogleConfigured = Boolean(webClientId);

// Google access tokens last one hour; getTokens() refreshes them as needed.
const TOKEN_LIFETIME_MS = 55 * 60 * 1000;

let configured = false;
function configure() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId,
    iosClientId,
    scopes: [DRIVE_SCOPE],
  });
  configured = true;
}

async function toSession(user: { email: string; name: string | null; photo: string | null }) {
  const { accessToken } = await GoogleSignin.getTokens();
  return {
    accessToken,
    expiresAt: Date.now() + TOKEN_LIFETIME_MS,
    user: { email: user.email, name: user.name, picture: user.photo },
  } satisfies GoogleSession;
}

export function preloadGoogleSignIn(): Promise<void> {
  configure();
  return Promise.resolve();
}

export async function signInWithGoogle(_loginHint?: string): Promise<GoogleSession> {
  if (!isGoogleConfigured) throw new Error('Google Sign-In is not configured.');
  configure();
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) throw new Error('Sign-in was cancelled.');
    return await toSession(response.data.user);
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-in is already in progress.');
    }
    throw e;
  }
}

export async function restoreSession(): Promise<GoogleSession | null> {
  if (!isGoogleConfigured) return null;
  configure();
  try {
    const response = await GoogleSignin.signInSilently();
    return response.type === 'success' ? await toSession(response.data.user) : null;
  } catch {
    return null;
  }
}

export async function refreshSession(session: GoogleSession): Promise<GoogleSession | null> {
  try {
    await GoogleSignin.clearCachedAccessToken(session.accessToken);
    const current = GoogleSignin.getCurrentUser();
    return current ? await toSession(current.user) : null;
  } catch {
    return null;
  }
}

export async function signOutGoogle(_session: GoogleSession | null) {
  await GoogleSignin.signOut();
}
