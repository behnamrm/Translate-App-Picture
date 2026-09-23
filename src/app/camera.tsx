import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants/theme';
import { prepareImage } from '@/lib/image';
import { setScan } from '@/lib/scanStore';
import { CEFR_LEVELS, type CefrLevel } from '@/types';

export default function CameraScreen() {
  const params = useLocalSearchParams<{ level?: string }>();
  const level: CefrLevel = CEFR_LEVELS.includes(params.level as CefrLevel)
    ? (params.level as CefrLevel)
    : 'B1';

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.black} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
        <Ionicons name="camera-outline" size={48} color={colors.primary} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          WortBlick uses the camera to read German text on products and signs.
        </Text>
        {permission.canAskAgain ? (
          <Button title="Allow camera" onPress={requestPermission} />
        ) : (
          <Text style={styles.permissionText}>Enable camera access in your device settings.</Text>
        )}
        <Button title="Back" variant="secondary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const capture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      const image = await prepareImage(photo.uri, photo.width);
      setScan({ ...image, level });
      router.replace('/analysis');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not take the photo.');
      setCapturing(false);
    }
  };

  return (
    <View style={styles.black}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        onCameraReady={() => setReady(true)}
      />
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Close"
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.levelBadge}>{level}</Text>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.hint}>{error ?? 'Point at German text and tap the shutter'}</Text>
          <View style={styles.controls}>
            <View style={styles.iconButton} />
            <Pressable
              accessibilityLabel="Take photo"
              onPress={capture}
              disabled={!ready || capturing}
              style={[styles.shutter, (!ready || capturing) && styles.shutterDisabled]}
            >
              {capturing ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Pressable>
            <Pressable
              accessibilityLabel="Flip camera"
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              style={styles.iconButton}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  black: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  levelBadge: {
    color: '#000',
    backgroundColor: colors.accent,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    overflow: 'hidden',
  },
  bottom: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  hint: {
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  permissionText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
