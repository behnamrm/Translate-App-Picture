import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { CEFR_LEVELS, type CefrLevel } from '@/types';

interface Props {
  value: CefrLevel;
  onChange: (level: CefrLevel) => void;
}

export function LevelSelector({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {CEFR_LEVELS.map((level) => {
        const selected = level === value;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{level}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  labelSelected: {
    color: colors.primaryText,
  },
});
