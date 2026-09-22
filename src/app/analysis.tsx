import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

export default function ImageAnalysisScreen() {
  const { level } = useLocalSearchParams<{ level?: string }>();

  // Phase 3 sends the image to GPT-4o and renders the returned words here.
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analysis</Text>
      <Text style={styles.body}>Target level: {level ?? '—'}</Text>
      <Text style={styles.body}>Extracted words will appear here.</Text>
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
