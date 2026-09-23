import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { isGoogleConfigured, preloadGoogleSignIn } from '@/lib/google/auth';

export default function SignInScreen() {
  const { signIn, lastUser } = useAuth();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGoogleConfigured) return;
    preloadGoogleSignIn()
      .then(() => setReady(true))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load Google Sign-In.'));
  }, []);

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>WortBlick</Text>
          <Text style={styles.tagline}>Learn German from the world around you.</Text>
        </View>

        {!isGoogleConfigured ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Google Sign-In is not configured</Text>
            <Text style={styles.noticeText}>
              Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (see .env.example and the README), then restart
              or redeploy the app.
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <Button
              title={lastUser ? `Continue as ${lastUser.email}` : 'Sign in with Google'}
              icon="logo-google"
              onPress={handleSignIn}
              loading={busy}
              disabled={!ready}
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.privacy}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
              <Text style={styles.privacyText}>
                Your flashcards are saved in a private app folder in your own Google Drive.
                WortBlick cannot see your other Drive files.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.legal}>
          <Link href="/privacy" style={styles.legalLink}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={styles.legalLink}>
            Terms of Service
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: {
    gap: spacing.sm,
  },
  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
  },
  tagline: {
    fontSize: 16,
    color: colors.textMuted,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
  privacy: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  privacyText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  legal: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  legalLink: {
    color: colors.textMuted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  notice: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  noticeTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  noticeText: {
    color: colors.text,
  },
});
