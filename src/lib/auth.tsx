import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { clearFlashcardCache } from './flashcards';
import { refreshSession, restoreSession, signInWithGoogle, signOutGoogle } from './google/auth';
import type { GoogleSession, GoogleUser } from './google/types';
import { setAccessTokenProvider } from './session';

interface AuthContextValue {
  /** A signed-in session with a usable token. */
  session: GoogleSession | null;
  /** The last signed-in user, kept after the token expires so we can offer "Continue as …". */
  lastUser: GoogleUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EXPIRY_MARGIN_MS = 60 * 1000;

function isValid(session: GoogleSession | null): session is GoogleSession {
  return Boolean(session && session.expiresAt - EXPIRY_MARGIN_MS > Date.now());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GoogleSession | null>(null);
  const [lastUser, setLastUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<GoogleSession | null>(null);

  const update = useCallback((next: GoogleSession | null) => {
    sessionRef.current = next;
    setSession(next);
    if (next) setLastUser(next.user);
  }, []);

  useEffect(() => {
    restoreSession()
      .then(async (stored) => {
        if (!stored) return;
        setLastUser(stored.user);
        update(isValid(stored) ? stored : await refreshSession(stored));
      })
      .finally(() => setLoading(false));
  }, [update]);

  useEffect(() => {
    setAccessTokenProvider(async () => {
      const current = sessionRef.current;
      if (isValid(current)) return current.accessToken;
      const refreshed = current ? await refreshSession(current) : null;
      update(refreshed);
      if (!refreshed) throw new Error('Your Google session expired. Please sign in again.');
      return refreshed.accessToken;
    });
  }, [update]);

  const signIn = useCallback(async () => {
    update(await signInWithGoogle(lastUser?.email));
  }, [lastUser, update]);

  const signOut = useCallback(async () => {
    await signOutGoogle(sessionRef.current);
    clearFlashcardCache();
    setLastUser(null);
    update(null);
  }, [update]);

  return (
    <AuthContext.Provider value={{ session, lastUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
