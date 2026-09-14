import { PESAN_STOP_OPERASI, type HasilItemP2H, type StatusKelayakan } from '@p2h/shared';
import { StyleSheet, Text, View } from 'react-native';

import { statusKelayakanBadge } from '../format';
import { colors, radii, spacing, statusKelayakanTone, typography } from '../theme';
import { Badge } from './Badge';
import { KodeBahayaChip } from './KodeBahayaChip';

export interface VerdictCardProps {
  status: StatusKelayakan;
  itemStop: readonly HasilItemP2H[];
  itemPerhatian: readonly HasilItemP2H[];
  unansweredCount: number;
  totalCount: number;
}

function FindingRow({ item, textColor }: { item: HasilItemP2H; textColor: string }) {
  return (
    <View style={styles.findingRow}>
      <KodeBahayaChip kode={item.kodeBahaya} />
      <Text style={[styles.findingLabel, { color: textColor }]}>{item.label}</Text>
    </View>
  );
}

/**
 * Big, prominent verdict card shown above the submit button on the P2H form
 * (and reused read-only on the detail screen). Updates live as checklist
 * items are answered.
 */
export function VerdictCard({ status, itemStop, itemPerhatian, unansweredCount, totalCount }: VerdictCardProps) {
  const tone = statusKelayakanTone[status];

  return (
    <View style={[styles.card, { backgroundColor: tone.background }]}>
      <Text style={[styles.title, { color: tone.text }]}>
        {status === 'STOP_OPERASI'
          ? 'STOP OPERASI'
          : status === 'OPERASI_DENGAN_PERHATIAN'
            ? 'OPERASI DENGAN PERHATIAN'
            : 'LAYAK OPERASI'}
      </Text>

      {status === 'STOP_OPERASI' && (
        <>
          <Text style={[styles.message, { color: tone.text }]}>{PESAN_STOP_OPERASI}</Text>
          {itemStop.map((item) => (
            <FindingRow key={item.key} item={item} textColor={tone.text} />
          ))}
        </>
      )}

      {status === 'OPERASI_DENGAN_PERHATIAN' && (
        <>
          <Text style={[styles.message, { color: tone.text }]}>
            Beberapa item perlu perhatian sebelum unit beroperasi penuh.
          </Text>
          {itemPerhatian.map((item) => (
            <FindingRow key={item.key} item={item} textColor={tone.text} />
          ))}
        </>
      )}

      {status === 'LAYAK_OPERASI' && unansweredCount > 0 && (
        <Text style={[styles.message, { color: tone.text }]}>
          {unansweredCount} dari {totalCount} item belum diperiksa
        </Text>
      )}
    </View>
  );
}

/**
 * Compact single-line pill, shown near the top of the P2H form once any item
 * has been marked TIDAK_NORMAL, so the verdict flip is visible without
 * scrolling down to the full `VerdictCard`.
 */
export function VerdictPill({ status }: { status: StatusKelayakan }) {
  const badge = statusKelayakanBadge(status);
  return (
    <View style={styles.pillRow}>
      <Text style={typography.caption}>Status saat ini:</Text>
      <Badge label={badge.label} tone={badge.tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  findingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
