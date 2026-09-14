import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { type HealthState, useHealthStatus, useSyncStatus } from '../controllers';
import { Button, Card, ScreenContainer } from './components';
import { formatDateTime } from './format';
import { colors, spacing, typography } from './theme';

const HEALTH_LABELS: Record<HealthState, string> = {
  checking: 'Memeriksa…',
  reachable: 'Server terjangkau',
  unreachable: 'Server tidak terjangkau',
};

const HEALTH_DOT_COLORS: Record<HealthState, string> = {
  checking: colors.mutedText,
  reachable: colors.success,
  unreachable: colors.danger,
};

/** Home screen: navigation to P2H/P5M forms, sync card, and history/Pengaturan links. */
export function HomeScreen() {
  const router = useRouter();
  const health = useHealthStatus();
  const sync = useSyncStatus();

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <View>
          <Text style={typography.title}>P2H & P5M</Text>
          <Text style={typography.subtitle}>Site Pit Utara</Text>
        </View>
        <Button label="Pengaturan" onPress={() => router.push('/pengaturan')} variant="outline" fullWidth={false} />
      </View>

      <Button label="P2H — Pemeriksaan Harian" onPress={() => router.push('/p2h/new')} />
      <Button
        label="P5M — Safety Talk"
        onPress={() => router.push('/p5m/new')}
        variant="secondary"
      />

      <Card>
        <Text style={typography.label}>Data menunggu sinkronisasi</Text>
        <Text style={styles.pendingCount}>{sync.pendingCount}</Text>

        <Button
          label="Sinkronisasi"
          onPress={sync.sync}
          loading={sync.syncing}
          variant="outline"
        />

        {sync.notice && (
          <Text style={sync.notice.kind === 'error' ? styles.errorText : styles.infoText}>
            {sync.notice.text}
          </Text>
        )}

        <Text style={typography.caption}>
          Terakhir sinkron:{' '}
          {sync.lastSyncAt ? formatDateTime(sync.lastSyncAt) : 'Belum pernah'}
        </Text>
      </Card>

      <Button label="Riwayat" onPress={() => router.push('/history')} variant="outline" />

      <View style={styles.footer}>
        <Text style={typography.caption}>{health.apiUrl}</Text>
        <View style={styles.healthRow}>
          <View style={[styles.dot, { backgroundColor: HEALTH_DOT_COLORS[health.state] }]} />
          <Text style={typography.caption}>{HEALTH_LABELS[health.state]}</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pendingCount: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.charcoal,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
  },
  infoText: {
    color: colors.mutedText,
    fontSize: 13,
  },
  footer: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
