import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/constants/theme';
import {
  fetchBoxCounts,
  fetchDueFlashcards,
  getContextImage,
  submitReview,
} from '@/lib/flashcards';
import { BOX_INTERVAL_DAYS, MAX_BOX } from '@/lib/leitner';
import type { Flashcard } from '@/types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; queue: Flashcard[]; counts: Record<number, number> };

export default function FlashcardsScreen() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    setRevealed(false);
    setReviewedCount(0);
    try {
      const [queue, counts] = await Promise.all([fetchDueFlashcards(), fetchBoxCounts()]);
      setState({ status: 'ready', queue, counts });
    } catch (e) {
      setState({
        status: 'error',
        message: e instanceof Error ? e.message : 'Could not load cards.',
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const answer = async (correct: boolean) => {
    if (state.status !== 'ready') return;
    const [card, ...rest] = state.queue;
    setSubmitting(true);
    try {
      const { leitner_box: newBox } = await submitReview(card, correct);
      const counts = { ...state.counts };
      counts[card.leitner_box] -= 1;
      counts[newBox] += 1;
      setState({ ...state, queue: rest, counts });
      setReviewedCount((n) => n + 1);
      setRevealed(false);
    } catch (e) {
      setState({
        status: 'error',
        message: e instanceof Error ? e.message : 'Could not save review.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{state.message}</Text>
        <Button title="Try again" icon="refresh" onPress={load} />
      </View>
    );
  }

  const card = state.queue[0];
  const nextBox = card ? Math.min(card.leitner_box + 1, MAX_BOX) : 1;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <BoxOverview counts={state.counts} />

      {!card ? (
        <View style={styles.done}>
          <Ionicons name="checkmark-done-circle" size={56} color={colors.success} />
          <Text style={styles.doneTitle}>
            {reviewedCount > 0 ? 'All done for today!' : 'Nothing to review today'}
          </Text>
          <Text style={styles.muted}>
            {reviewedCount > 0
              ? `You reviewed ${reviewedCount} card${reviewedCount === 1 ? '' : 's'}. Come back tomorrow.`
              : 'Scan an image and add words to start learning.'}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.muted}>
            {state.queue.length} card{state.queue.length === 1 ? '' : 's'} due · Box{' '}
            {card.leitner_box}
          </Text>

          <View style={styles.card}>
            {card.context_image_url && (
              <ContextImage key={card.id} fileId={card.context_image_url} />
            )}
            <Text style={styles.cardWord}>{card.german_word}</Text>

            {revealed ? (
              <View style={styles.answer}>
                <Text style={styles.persian}>{card.persian_translation}</Text>
                <View style={styles.divider} />
                <Text style={styles.explanation}>{card.german_explanation}</Text>
              </View>
            ) : (
              <Button title="Show answer" variant="secondary" onPress={() => setRevealed(true)} />
            )}
          </View>

          {revealed && (
            <View style={styles.answerButtons}>
              <Button
                title="Nochmal"
                icon="refresh"
                variant="danger"
                onPress={() => answer(false)}
                disabled={submitting}
                style={styles.flex}
              />
              <Button
                title="Gewusst"
                icon="checkmark"
                onPress={() => answer(true)}
                disabled={submitting}
                style={[styles.flex, { backgroundColor: colors.success }]}
              />
            </View>
          )}
          {revealed && (
            <Text style={styles.hint}>
              Gewusst → Box {nextBox} (in {BOX_INTERVAL_DAYS[nextBox]} days) · Nochmal → Box 1
              (tomorrow)
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

/** Render with `key` per card so the previous card's image is never shown. */
function ContextImage({ fileId }: { fileId: string }) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getContextImage(fileId)
      .then((dataUri) => active && setUri(dataUri))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [fileId]);

  return uri ? (
    <Image source={{ uri }} style={styles.cardImage} resizeMode="cover" />
  ) : (
    <View style={[styles.cardImage, styles.centeredImage]}>
      <ActivityIndicator color={colors.textMuted} />
    </View>
  );
}

function BoxOverview({ counts }: { counts: Record<number, number> }) {
  return (
    <View style={styles.boxes}>
      {[1, 2, 3, 4, 5].map((box) => (
        <View key={box} style={styles.box}>
          <Text style={styles.boxCount}>{counts[box] ?? 0}</Text>
          <Text style={styles.boxLabel}>Box {box}</Text>
        </View>
      ))}
    </View>
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
    maxWidth: 600,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  boxes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  boxCount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  boxLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  centeredImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWord: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  answer: {
    gap: spacing.md,
  },
  persian: {
    fontSize: 22,
    lineHeight: 34,
    color: colors.text,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  explanation: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
  },
  answerButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  done: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  muted: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
