import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Labeled check-square control, used for the operator's mandatory statement. */
export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  check: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 15,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: colors.charcoal,
  },
});
