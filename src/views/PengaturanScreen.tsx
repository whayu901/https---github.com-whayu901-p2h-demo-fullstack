import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { type HealthState, RETENTION_DAYS_OPTIONS, useHealthStatus, useSettings } from '../controllers';
import { Button, Card, ScreenContainer, SegmentedControl, TextField } from './components';
import { formatBytes } from './format';
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

const RETENTION_OPTIONS = RETENTION_DAYS_OPTIONS.map((days) => ({
  value: String(days),
  label: `${days} hari`,
}));

/** Pengaturan (settings) screen: server address, on-device storage, and demo/reset actions. */
export function PengaturanScreen() {
  const router = useRouter();
  const health = useHealthStatus();
  const settings = useSettings();
  const [savingUrl, setSavingUrl] = useState(false);

  const handleSaveUrl = async () => {
    setSavingUrl(true);
    const result = await settings.saveApiUrl();
    setSavingUrl(false);
    if (!result.ok) {
      Alert.alert('Gagal', result.message);
    }
  };

  const handleRunRetention = async () => {
    const result = await settings.runRetentionNow();
    Alert.alert(
      'Selesai',
      `${result.jumlahData} data dihapus, ${result.megabytesDibebaskan.toFixed(2)} MB dibebaskan.`
    );
  };

  const handleSeedDemo = async () => {
    await settings.seedOldDemo();
    Alert.alert('Selesai', 'Contoh data lama (10 hari) berhasil dibuat.');
  };

  const handleResetAll = () => {
    Alert.alert(
      'Reset semua data lokal?',
      'Seluruh riwayat P2H/P5M di perangkat ini akan dihapus permanen (server tetap menyimpan riwayat). Alamat server yang tersimpan tidak akan direset.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await settings.resetAll();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <Card>
        <Text style={typography.heading}>Server</Text>
        <TextField
          label="Alamat Server (API URL)"
          value={settings.apiUrlInput}
          onChangeText={settings.setApiUrlInput}
          placeholder="http://192.168.x.x:3000"
        />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Button label="Simpan" onPress={handleSaveUrl} loading={savingUrl} />
          </View>
          <View style={styles.rowItem}>
            <Button label="Pakai default (.env)" onPress={settings.useDefaultUrl} variant="outline" />
          </View>
        </View>
        <View style={styles.healthRow}>
          <View style={[styles.dot, { backgroundColor: HEALTH_DOT_COLORS[health.state] }]} />
          <Text style={typography.caption}>
            {HEALTH_LABELS[health.state]} · {health.apiUrl}
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={typography.heading}>Penyimpanan</Text>
        {settings.storage && (
          <>
            <Text style={typography.body}>
              Terpakai: {formatBytes(settings.storage.totalBytes)} (database{' '}
              {formatBytes(settings.storage.databaseBytes)}, foto {formatBytes(settings.storage.photosBytes)})
            </Text>
            <Text style={typography.body}>
              {settings.storage.pendingCount} menunggu · {settings.storage.syncedCount} tersinkron
            </Text>
          </>
        )}
        <Text style={typography.label}>Retensi data tersinkron</Text>
        <SegmentedControl
          options={RETENTION_OPTIONS}
          value={settings.storage ? String(settings.storage.retentionDays) : null}
          onChange={(value) => settings.setRetentionDays(Number.parseInt(value, 10))}
        />
        <Button label="Bersihkan data lama" onPress={handleRunRetention} variant="outline" />
        <Text style={typography.caption}>
          Server menyimpan seluruh riwayat. HP hanya menyimpan data terbaru.
        </Text>
      </Card>

      <Card>
        <Text style={typography.heading}>Demo</Text>
        <Button label="Buat contoh data lama (10 hari)" onPress={handleSeedDemo} variant="outline" />
        <Button label="Reset semua data lokal" onPress={handleResetAll} variant="danger" />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
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
