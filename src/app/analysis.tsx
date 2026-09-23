import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { WordSheet } from '@/components/WordSheet';
import { colors, radius, spacing } from '@/constants/theme';
import { analyzeImage } from '@/lib/analyze';
import { uploadContextImage } from '@/lib/flashcards';
import { getScan } from '@/lib/scanStore';
import type { AnalyzedWord } from '@/types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; words: AnalyzedWord[] };

export default function ImageAnalysisScreen() {
  const scan = getScan();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [selected, setSelected] = useState<AnalyzedWord | null>(null);
  const uploadRef = useRef<Promise<string | null> | null>(null);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!scan) return;
    let active = true;
    analyzeImage(scan.base64, scan.level)
      .then((words) => active && setState({ status: 'done', words }))
      .catch(
        (e) =>
          active &&
          setState({
            status: 'error',
            message: e instanceof Error ? e.message : 'Analysis failed.',
          }),
      );
    return () => {
      active = false;
    };
  }, [scan, attempt]);

  const retry = () => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  };

  // Upload the photo at most once per scan, the first time a word is saved.
  // A failed upload is not fatal: the card is saved without an image.
  const getContextImage = useCallback(() => {
    if (!scan) return Promise.resolve(null);
    uploadRef.current ??= uploadContextImage(scan.base64).catch((e) => {
      console.warn('Context image upload failed', e);
      return null;
    });
    return uploadRef.current;
  }, [scan]);

  if (!scan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>No image selected.</Text>
        <Button title="Back to scan" onPress={() => router.replace('/')} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Image source={{ uri: scan.uri }} style={styles.image} resizeMode="contain" />

        <View style={styles.headingRow}>
          <Text style={styles.heading}>Words at your level</Text>
          <Text style={styles.levelBadge}>{scan.level}</Text>
        </View>

        {state.status === 'loading' && (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.muted}>Reading the German text…</Text>
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.loading}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
            <Text style={styles.error}>{state.message}</Text>
            <Button title="Try again" icon="refresh" onPress={retry} />
          </View>
        )}

        {state.status === 'done' && state.words.length === 0 && (
          <View style={styles.loading}>
            <Text style={styles.muted}>
              No {scan.level} words found in this image. Try another photo or a different level.
            </Text>
          </View>
        )}

        {state.status === 'done' && state.words.length > 0 && (
          <>
            <Text style={styles.muted}>Tap a word to see its meaning.</Text>
            <View style={styles.words}>
              {state.words.map((word, index) => (
                <Pressable
                  key={`${word.word}-${index}`}
                  onPress={() => setSelected(word)}
                  style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                >
                  <Text style={styles.chipText}>{word.word}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <WordSheet
        key={selected ? selected.word : 'closed'}
        word={selected}
        onClose={() => setSelected(null)}
        getContextImage={getContextImage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  levelBadge: {
    backgroundColor: colors.accent,
    color: '#000',
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    overflow: 'hidden',
  },
  loading: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 15,
    textAlign: 'center',
  },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipPressed: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
