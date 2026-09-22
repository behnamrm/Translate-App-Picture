import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';
import { addFlashcard, DuplicateCardError } from '@/lib/flashcards';
import type { AnalyzedWord } from '@/types';

import { Button } from './Button';

type Tab = 'persian' | 'german';
type SaveState = 'idle' | 'saving' | 'saved' | 'duplicate' | 'error';

/** Render with `key` set to the word so the save state resets for each word. */
interface Props {
  word: AnalyzedWord | null;
  onClose: () => void;
  /** Resolves to the stored context image path, or null if it could not be uploaded. */
  getContextImage: () => Promise<string | null>;
}

export function WordSheet({ word, onClose, getContextImage }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('persian');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const save = async () => {
    if (!word) return;
    setSaveState('saving');
    try {
      const imagePath = await getContextImage();
      await addFlashcard(word, imagePath);
      setSaveState('saved');
    } catch (e) {
      if (e instanceof DuplicateCardError) {
        setSaveState('duplicate');
      } else {
        setErrorMessage(e instanceof Error ? e.message : 'Could not save the card.');
        setSaveState('error');
      }
    }
  };

  return (
    <Modal visible={word !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      {word && (
        <View style={styles.sheetContainer} pointerEvents="box-none">
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.word}>{word.base_form || word.word}</Text>
                {word.base_form && word.base_form !== word.word && (
                  <Text style={styles.original}>in the image: {word.word}</Text>
                )}
              </View>
              <Pressable onPress={onClose} accessibilityLabel="Close" hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.segment} accessibilityRole="tablist">
              <SegmentButton
                label="فارسی"
                active={tab === 'persian'}
                onPress={() => setTab('persian')}
              />
              <SegmentButton
                label="Einfaches Deutsch"
                active={tab === 'german'}
                onPress={() => setTab('german')}
              />
            </View>

            <View style={styles.content}>
              {tab === 'persian' ? (
                <Text style={[styles.contentText, styles.persian]}>{word.persian_translation}</Text>
              ) : (
                <Text style={styles.contentText}>{word.simple_german}</Text>
              )}
            </View>

            {saveState === 'saved' ? (
              <View style={styles.status}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.statusText, { color: colors.success }]}>
                  Added to flashcards
                </Text>
              </View>
            ) : saveState === 'duplicate' ? (
              <View style={styles.status}>
                <Ionicons name="information-circle" size={20} color={colors.textMuted} />
                <Text style={styles.statusText}>Already in your flashcards</Text>
              </View>
            ) : (
              <>
                <Button
                  title="Add to Flashcards"
                  icon="add-circle-outline"
                  onPress={save}
                  loading={saveState === 'saving'}
                />
                {saveState === 'error' && <Text style={styles.error}>{errorMessage}</Text>}
              </>
            )}
          </View>
        </View>
      )}
    </Modal>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.segmentButton, active && styles.segmentButtonActive]}
    >
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.backdrop,
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    width: '100%',
    maxWidth: 600,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  word: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  original: {
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentLabelActive: {
    color: colors.primary,
  },
  content: {
    minHeight: 90,
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  contentText: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.text,
  },
  persian: {
    writingDirection: 'rtl',
    textAlign: 'right',
    fontSize: 20,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md - 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
