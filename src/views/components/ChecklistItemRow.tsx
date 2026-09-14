import { HASIL_ITEM, HASIL_ITEM_LABELS, type HasilItemValue, type KodeBahaya } from '@p2h/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, resultButtonHeight, spacing } from '../theme';
import { KodeBahayaChip } from './KodeBahayaChip';
import { TextField } from './TextField';

export interface ChecklistItemRowProps {
  label: string;
  kodeBahaya: KodeBahaya;
  hasil: HasilItemValue | null;
  keterangan: string;
  onSelectHasil: (hasil: HasilItemValue) => void;
  onChangeKeterangan: (keterangan: string) => void;
}

const hasilToneStyles: Record<HasilItemValue, { selected: object; text: object }> = {
  NORMAL: { selected: { backgroundColor: colors.success }, text: { color: colors.white } },
  TIDAK_NORMAL: { selected: { backgroundColor: colors.danger }, text: { color: colors.white } },
  NA: { selected: { backgroundColor: colors.mutedText }, text: { color: colors.white } },
};

/** One P2H checklist row: label + hazard chip, Normal/Tidak Normal/N/A buttons, and a note. */
export function ChecklistItemRow({
  label,
  kodeBahaya,
  hasil,
  keterangan,
  onSelectHasil,
  onChangeKeterangan,
}: ChecklistItemRowProps) {
  const showKeterangan = hasil === 'TIDAK_NORMAL';

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <KodeBahayaChip kode={kodeBahaya} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.buttons}>
        {HASIL_ITEM.map((option) => {
          const selected = option === hasil;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelectHasil(option)}
              style={[styles.button, selected && hasilToneStyles[option].selected]}
            >
              <Text style={[styles.buttonLabel, selected && hasilToneStyles[option].text]}>
                {HASIL_ITEM_LABELS[option]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {showKeterangan && (
        <TextField
          label="Keterangan temuan"
          value={keterangan}
          onChangeText={onChangeKeterangan}
          placeholder="Jelaskan temuan..."
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: resultButtonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
  },
});
