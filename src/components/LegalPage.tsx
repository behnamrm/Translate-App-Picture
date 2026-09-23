import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

interface Props {
  title: string;
  updated: string;
  children: ReactNode;
}

export function LegalPage({ title, updated, children }: Props) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title} role="heading">
        {title}
      </Text>
      <Text style={styles.updated}>Last updated: {updated}</Text>
      {children}
      <View style={styles.links}>
        <Link href="/" style={styles.link}>
          Open WortBlick
        </Link>
        <Link href="/privacy" style={styles.link}>
          Privacy Policy
        </Link>
        <Link href="/terms" style={styles.link}>
          Terms of Service
        </Link>
      </View>
    </ScrollView>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading} role="heading" aria-level={2}>
        {heading}
      </Text>
      {children}
    </View>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  updated: {
    color: colors.textMuted,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heading: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  link: {
    color: colors.primary,
    fontSize: 15,
  },
});
