import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, minTouchTarget, radii } from '../theme';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

/** Generic segmented picker, used for the shift selector (PAGI/SIANG/MALAM). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radii.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  segmentSelected: {
    backgroundColor: colors.charcoal,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.charcoal,
  },
  labelSelected: {
    color: colors.white,
  },
});
