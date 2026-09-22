import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LevelSelector } from '@/components/LevelSelector';
import { colors, spacing } from '@/constants/theme';
import { prepareImage } from '@/lib/image';
import { setScan } from '@/lib/scanStore';
import type { CefrLevel } from '@/types';

export default function HomeScreen() {
  const [level, setLevel] = useState<CefrLevel>('B1');
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = () => {
    setError(null);
    router.push({ pathname: '/camera', params: { level } });
  };

  const uploadPhoto = async () => {
    setError(null);
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const image = await prepareImage(asset.uri, asset.width);
      setScan({ ...image, level });
      router.push('/analysis');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the image.');
    } finally {
      setPicking(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
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

      <View style={styles.section}>
        <Button title="Take a photo" icon="camera" onPress={takePhoto} disabled={picking} />
        <Button
          title="Upload from gallery"
          icon="images"
          variant="secondary"
          onPress={uploadPhoto}
          loading={picking}
        />
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.xl,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
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
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  error: {
    color: colors.danger,
  },
});
