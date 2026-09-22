# WortBlick

Learn German from photos of real-world objects, packaging and signs. Built with Expo (SDK 57), Expo Router, Supabase and GPT-4o.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in keys (needed from Phase 3)
npx expo start               # press i / a / w for iOS, Android or web
```

Checks:

```bash
npm run typecheck
npx expo-doctor
```

## How this project was created

```bash
npx create-expo-app@latest app --template blank-typescript
npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-linking expo-constants expo-status-bar
npx expo install react-dom react-native-web @expo/vector-icons expo-font
```

Then `package.json#main` was set to `expo-router/entry`, and `app.json` got `scheme`, `experiments.typedRoutes` and `web.bundler: "metro"`.

## Structure

```
src/
  app/                    # Expo Router routes (every file is a screen)
    _layout.tsx           # Root stack
    (tabs)/
      _layout.tsx         # Bottom tabs: Scan, Flashcards
      index.tsx           # Home: level picker, camera/upload
      flashcards.tsx      # Leitner review
    analysis.tsx          # ImageAnalysis (pushed from Home with ?level=)
  components/             # Reusable UI (LevelSelector, later WordSheet, …)
  constants/theme.ts      # Colors, spacing, radii
  types/index.ts          # CefrLevel, AnalyzedWord, Flashcard
```

## Roadmap

1. ✅ Project setup and navigation
2. Camera and gallery upload (`expo-camera`, `expo-image-picker`)
3. GPT-4o OCR and word analysis
4. Word details bottom sheet (Persian / simple German)
5. Supabase auth, flashcards table and Leitner review
