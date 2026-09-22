type TokenProvider = () => Promise<string>;

let provider: TokenProvider | null = null;

/** Registered by AuthProvider so non-React code (Drive, API calls) can get a fresh token. */
export function setAccessTokenProvider(next: TokenProvider) {
  provider = next;
}

export function getAccessToken(): Promise<string> {
  if (!provider) return Promise.reject(new Error('Not signed in.'));
  return provider();
}
