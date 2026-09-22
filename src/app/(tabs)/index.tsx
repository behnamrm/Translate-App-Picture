import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LevelSelector } from '@/components/LevelSelector';
import { colors, radius, spacing } from '@/constants/theme';
import type { CefrLevel } from '@/types';

export default function HomeScreen() {
  const [level, setLevel] = useState<CefrLevel>('B1');

  // Phase 2 replaces these placeholders with expo-camera / expo-image-picker.
  const openAnalysis = () => {
    router.push({ pathname: '/analysis', params: { level } });
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Learn German from the world around you</Text>
        <Text style={styles.subtitle}>
          Snap a product, a sign or a menu and discover the words at your level.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your level</Text>
        <LevelSelector value={level} onChange={setLevel} />
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.primary]} onPress={openAnalysis}>
          <Ionicons name="camera" size={22} color={colors.primaryText} />
          <Text style={[styles.buttonText, styles.primaryText]}>Take a photo</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.secondary]} onPress={openAnalysis}>
          <Ionicons name="images" size={22} color={colors.primary} />
          <Text style={[styles.buttonText, styles.secondaryText]}>Upload from gallery</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.textMuted,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.primaryText,
  },
  secondaryText: {
    color: colors.primary,
  },
});
