import { UNIT_TYPE_LABELS, type Unit } from '@p2h/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme';

export interface UnitPickerProps {
  units: readonly Unit[];
  selectedUnitId: string | null;
  onSelect: (unit: Unit) => void;
}

/** Tappable list of unit cards — no native Picker dependency needed. */
export function UnitPicker({ units, selectedUnitId, onSelect }: UnitPickerProps) {
  return (
    <View style={styles.list}>
      {units.map((unit) => {
        const selected = unit.id === selectedUnitId;
        return (
          <Pressable
            key={unit.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(unit)}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <Text style={[styles.code, selected && styles.textSelected]}>{unit.code}</Text>
            <Text style={[styles.name, selected && styles.textSelected]}>{unit.name}</Text>
            <Text style={[styles.type, selected && styles.textSelected]}>
              {UNIT_TYPE_LABELS[unit.type]} · {unit.site}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 2,
  },
  cardSelected: {
    borderColor: colors.charcoal,
    backgroundColor: colors.charcoal,
  },
  code: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
  },
  name: {
    fontSize: 14,
    color: colors.charcoal,
  },
  type: {
    fontSize: 12,
    color: colors.mutedText,
  },
  textSelected: {
    color: colors.white,
  },
});
