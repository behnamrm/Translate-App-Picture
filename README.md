# WortBlick

Learn German from photos of real-world objects, packaging and signs. Take or upload a photo, pick your CEFR level, and WortBlick finds the German words at that level, explains them in Persian (Farsi) or simple German, and lets you practise them with a Leitner flashcard system.

- **App:** Expo (SDK 57) + Expo Router, runs on web, iOS and Android
- **AI:** Google Gemini (free tier) reads the image and analyses the words, via a server route so the API key stays secret
- **Login & storage:** Sign in with Google; flashcards and photos are saved in a private app folder in the user's **own Google Drive**. There is no database to run.
- **Hosting:** Vercel (web app + API route)

## How it works

```
Photo ──► /api/analyze (server) ──► Gemini ──► words at your level
                 │ verifies the user's Google token
Flashcards ◄──► Google Drive appDataFolder (flashcards.json + scan-*.jpg)
```

- The Drive scope is `drive.appdata`: a hidden folder only WortBlick can access. The app can't see the user's other Drive files, and the user can delete the data from Drive → Settings → Manage apps.
- Leitner boxes: new cards are due immediately. **Gewusst** moves a card up one box, **Nochmal** sends it back to box 1. Next review: box 1 → 1 day, 2 → 3 days, 3 → 7 days, 4 → 14 days, 5 → 30 days.

## Setup

### 1. Gemini API key (free)

Create a key at <https://aistudio.google.com/apikey>. The free tier is rate limited, and Google may use free-tier requests to improve its products. Switch the project to a paid tier later if you need more capacity or privacy.

### 2. Google Sign-In (Google Cloud Console)

1. Create a project at <https://console.cloud.google.com>.
2. **APIs & Services → Library:** enable the **Google Drive API**.
3. **Google Auth Platform (OAuth consent screen):** choose *External*, fill in the app name and support email, add the scope `.../auth/drive.appdata`, and add yourself (and any testers) as **test users**.
4. **Credentials → Create credentials → OAuth client ID → Web application**, with these **Authorized JavaScript origins**:
   - `http://localhost:8081` (local development)
   - `https://<your-app>.vercel.app` (and your custom domain, if any)
5. Copy the client ID.

Until Google verifies your app, only the test users can sign in, and they'll see an "unverified app" warning. To publish to everyone, submit the app for verification on the same screen.

### 3. Run locally

```bash
npm install
cp .env.example .env.local   # fill in EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and GEMINI_API_KEY
npx expo start               # press w for web
```

Checks:

```bash
npm run typecheck
npx expo-doctor
```

## Deploy to Vercel

1. Push this repository to GitHub and import it at <https://vercel.com/new>. Vercel reads `vercel.json`, so keep the framework preset on *Other* and don't change the build settings.
2. In **Settings → Environment Variables**, add:
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   - `GEMINI_API_KEY`
   - optionally `GEMINI_MODEL` (default `gemini-3.8-flash`; `gemini-3.5-flash-lite` is faster, with higher free limits)
3. Deploy. Then add the deployment URL to the OAuth client's **Authorized JavaScript origins** (step 2.4).

`EXPO_PUBLIC_*` values are baked in at build time, so **redeploy after changing them**.

How the deployment works: `expo export -p web` builds the site into `dist/client` and the API routes into `dist/server`. `api/index.ts` is a Vercel function that serves both, using Expo's Vercel adapter.

## Native apps (iOS/Android)

Web is the main target. Native builds work with some extra setup:

- Google Sign-In on native uses `@react-native-google-signin/google-signin`, which **doesn't run in Expo Go**. Build a development build (`npx expo run:ios`, or `npx eas-cli build --profile development`).
- Create an **iOS** OAuth client (bundle ID `com.wortblick.app`) and set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`. This also turns on the config plugin in `app.config.ts`.
- For Android, create an **Android** OAuth client with your signing SHA-1, and add its ID to `GOOGLE_ALLOWED_CLIENT_IDS` on the server.
- Set `EXPO_PUBLIC_API_URL` to your Vercel URL so the app can reach `/api/analyze`.

## Project structure

```
api/index.ts                 # Vercel function (Expo server adapter)
src/
  app/
    _layout.tsx              # Root stack, redirects to sign-in when logged out
    sign-in.tsx              # Google sign-in
    (tabs)/index.tsx         # Home: level picker, take photo / upload
    (tabs)/flashcards.tsx    # Leitner review
    camera.tsx               # Full-screen camera
    analysis.tsx             # Word list for the scanned image
    api/analyze+api.ts       # Server: verifies Google token, calls Gemini
  components/                # Button, LevelSelector, WordSheet (bottom sheet)
  lib/
    google/auth.ts           # Web sign-in (Google Identity Services)
    google/auth.native.ts    # Native sign-in
    auth.tsx                 # Auth context
    drive.ts                 # Google Drive appDataFolder client
    flashcards.ts            # Flashcards stored in Drive
    leitner.ts               # Box intervals and review logic
    image.ts                 # Resize/compress photos before upload
```
