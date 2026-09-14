import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme';

export type BadgeTone =
  | 'pending'
  | 'synced'
  | 'neutral'
  | 'danger'
  | 'stopOperasi'
  | 'perhatian'
  | 'layak';

export interface BadgeProps {
  label: string;
  tone: BadgeTone;
}

/** Small colored pill used for sync status, verdicts, and similar tags. */
export function Badge({ label, tone }: BadgeProps) {
  return (
    <View style={[styles.base, toneStyles[tone]]}>
      <Text style={[styles.label, toneTextStyles[tone]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radii.pill,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});

const toneStyles = StyleSheet.create({
  pending: { backgroundColor: '#FBEBC5' },
  synced: { backgroundColor: '#DCEEE1' },
  neutral: { backgroundColor: colors.border },
  danger: { backgroundColor: '#F4D9D4' },
  stopOperasi: { backgroundColor: colors.danger },
  perhatian: { backgroundColor: colors.amber },
  layak: { backgroundColor: colors.success },
});

const toneTextStyles = StyleSheet.create({
  pending: { color: '#8A6400' },
  synced: { color: colors.success },
  neutral: { color: colors.mutedText },
  danger: { color: colors.danger },
  stopOperasi: { color: colors.white },
  perhatian: { color: colors.charcoal },
  layak: { color: colors.white },
});
