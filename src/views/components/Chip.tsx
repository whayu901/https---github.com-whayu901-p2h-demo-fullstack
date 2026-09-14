import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, minTouchTarget, radii, spacing } from '../theme';

export interface ChipProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
}

/** Tappable pill chip, used for preset options such as P5M topics. */
export function Chip({ label, onPress, selected = false }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: minTouchTarget - 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
  },
  labelSelected: {
    color: colors.white,
  },
});
