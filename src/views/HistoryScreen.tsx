import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type HistoryEntry, useHistory } from '../controllers';
import { Badge, Card } from './components';
import { formatDateTime, statusKelayakanBadge } from './format';
import { colors, spacing, typography } from './theme';

function editRoute(entry: HistoryEntry): string {
  return entry.kind === 'P2H' ? `/p2h/${entry.id}/edit` : `/p5m/${entry.id}/edit`;
}

function HistoryRow({
  entry,
  onLongPress,
}: {
  entry: HistoryEntry;
  onLongPress: (entry: HistoryEntry) => void;
}) {
  const router = useRouter();
  const verdict = entry.statusKelayakan ? statusKelayakanBadge(entry.statusKelayakan) : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/history/${entry.kind.toLowerCase()}/${entry.id}`)}
      onLongPress={() => onLongPress(entry)}
    >
      <Card>
        <View style={styles.rowHeader}>
          <Badge label={entry.kind} tone="neutral" />
          <Badge
            label={entry.syncStatus === 'PENDING' ? 'Menunggu' : 'Tersinkron'}
            tone={entry.syncStatus === 'PENDING' ? 'pending' : 'synced'}
          />
        </View>
        <Text style={typography.label}>{entry.title}</Text>
        <Text style={typography.body}>{entry.person}</Text>
        <Text style={typography.caption}>
          {entry.tanggal} · dibuat {formatDateTime(entry.dibuatPada)}
        </Text>
        {verdict && <Badge label={verdict.label} tone={verdict.tone} />}
      </Card>
    </Pressable>
  );
}

/** History screen: every local P2H/P5M record, newest first, with long-press Ubah/Hapus for PENDING rows. */
export function HistoryScreen() {
  const router = useRouter();
  const { entries, loading, deleteEntry } = useHistory();

  const confirmDelete = (entry: HistoryEntry) => {
    Alert.alert('Hapus data?', `Data "${entry.title}" akan dihapus permanen dari perangkat.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          const deleted = await deleteEntry(entry.kind, entry.id);
          if (!deleted) {
            Alert.alert('Gagal', 'Data sudah tersinkron dan tidak bisa dihapus.');
          }
        },
      },
    ]);
  };

  const handleLongPress = (entry: HistoryEntry) => {
    if (entry.syncStatus !== 'PENDING') {
      Alert.alert('Tidak bisa diubah', 'Data sudah tersinkron dan tidak bisa diubah di perangkat.');
      return;
    }
    Alert.alert(entry.title, 'Pilih tindakan untuk data yang belum tersinkron ini.', [
      { text: 'Ubah', onPress: () => router.push(editRoute(entry)) },
      { text: 'Hapus', style: 'destructive', onPress: () => confirmDelete(entry) },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <FlatList
        data={entries}
        keyExtractor={(entry) => `${entry.kind}-${entry.id}`}
        renderItem={({ item }) => <HistoryRow entry={item} onLongPress={handleLongPress} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          entries.length > 0 ? (
            <Text style={typography.caption}>
              Tekan lama data yang belum terkirim untuk ubah atau hapus.
            </Text>
          ) : null
        }
        ListEmptyComponent={
          !loading ? <Text style={typography.body}>Belum ada data tersimpan.</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
