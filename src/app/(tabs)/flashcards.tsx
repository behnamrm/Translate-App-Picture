import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

export default function FlashcardsScreen() {
  // Phase 5 loads due cards from Supabase and runs the Leitner review.
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Due today</Text>
      <Text style={styles.body}>No flashcards yet. Scan an image to add some words.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
