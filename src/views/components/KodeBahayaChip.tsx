import type { KodeBahaya } from '@p2h/shared';
import { KODE_BAHAYA_LABELS } from '@p2h/shared';
import { StyleSheet, Text, View } from 'react-native';

import { kodeBahayaTone, radii, spacing } from '../theme';

export interface KodeBahayaChipProps {
  kode: KodeBahaya;
}

/** Small colored chip showing a checklist item's hazard code (AA/A/B/C). */
export function KodeBahayaChip({ kode }: KodeBahayaChipProps) {
  const tone = kodeBahayaTone[kode];
  return (
    <View
      style={[styles.chip, { backgroundColor: tone.background }]}
      accessibilityLabel={`Kode bahaya ${kode}: ${KODE_BAHAYA_LABELS[kode]}`}
    >
      <Text style={[styles.label, { color: tone.text }]}>{kode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
  },
});
