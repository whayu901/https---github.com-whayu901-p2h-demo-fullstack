import {
  HASIL_ITEM_LABELS,
  PESAN_MENUNGGU_PENGAWAS,
  PERNYATAAN_OPERATOR,
  P2H_SECTIONS,
  P2H_SECTION_LABELS,
  SHIFT_LABELS,
} from '@p2h/shared';
import { useRouter } from 'expo-router';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { type RecordKind, useRecordDetail } from '../controllers';
import { Badge, Button, Card, Checkbox, KodeBahayaChip, ScreenContainer, VerdictCard } from './components';
import { formatCoordinates, formatDateTime } from './format';
import { colors, radii, spacing, typography } from './theme';

export interface DetailScreenProps {
  kind: RecordKind;
  id: string;
}

const SYNCED_NOTICE =
  'Data sudah terkirim dan tidak bisa diubah. Koreksi harus melalui pengawas.';

/** Read-only detail screen for a single P2H inspection or P5M safety talk. */
export function DetailScreen({ kind, id }: DetailScreenProps) {
  const router = useRouter();
  const { record, loading, deleteRecord } = useRecordDetail(kind, id);

  if (loading) {
    return (
      <ScreenContainer>
        <Text style={typography.body}>Memuat…</Text>
      </ScreenContainer>
    );
  }

  if (!record) {
    return (
      <ScreenContainer>
        <Text style={typography.body}>Data tidak ditemukan.</Text>
      </ScreenContainer>
    );
  }

  const handleDelete = (title: string) => {
    Alert.alert('Hapus data?', `Data "${title}" akan dihapus permanen dari perangkat.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          const deleted = await deleteRecord();
          if (deleted) {
            router.back();
          } else {
            Alert.alert('Gagal', 'Data sudah tersinkron dan tidak bisa dihapus.');
          }
        },
      },
    ]);
  };

  if (record.kind === 'p2h') {
    const { inspection, unit, verdict } = record;
    const isPending = inspection.syncStatus === 'PENDING';

    return (
      <ScreenContainer>
        <Card>
          <View style={styles.headerRow}>
            <Text style={typography.heading}>
              {unit ? `${unit.code} — ${unit.name}` : 'Unit tidak diketahui'}
            </Text>
            <Badge label={isPending ? 'Menunggu' : 'Tersinkron'} tone={isPending ? 'pending' : 'synced'} />
          </View>
          <Text style={typography.body}>Operator: {inspection.namaOperator}</Text>
          <Text style={typography.body}>NRP: {inspection.nrp}</Text>
          <Text style={typography.body}>Shift: {SHIFT_LABELS[inspection.shift]}</Text>
          <Text style={typography.body}>Tanggal: {inspection.tanggal}</Text>
          <Text style={typography.body}>Lokasi Kerja: {inspection.lokasiKerja}</Text>
          <Text style={typography.body}>
            HM/KM: {inspection.hmKmAwal}
            {inspection.hmKmAkhir !== null ? ` → ${inspection.hmKmAkhir}` : ''}
          </Text>
          <Text style={typography.caption}>Dibuat: {formatDateTime(inspection.dibuatPada)}</Text>
          <Text style={typography.caption}>
            {formatCoordinates(inspection.latitude, inspection.longitude)}
          </Text>
        </Card>

        <VerdictCard
          status={verdict.status}
          itemStop={verdict.itemStop}
          itemPerhatian={verdict.itemPerhatian}
          unansweredCount={0}
          totalCount={inspection.items.length}
        />

        {P2H_SECTIONS.map((section) => {
          const items = inspection.items.filter((item) => item.section === section);
          if (items.length === 0) {
            return null;
          }
          return (
            <Card key={section}>
              <Text style={typography.heading}>{P2H_SECTION_LABELS[section]}</Text>
              {items.map((item) => {
                const isFinding = item.hasil === 'TIDAK_NORMAL';
                return (
                  <View key={item.key} style={[styles.checklistRow, isFinding && styles.findingRow]}>
                    <View style={styles.checklistHeader}>
                      <View style={styles.checklistLabelRow}>
                        <KodeBahayaChip kode={item.kodeBahaya} />
                        <Text style={typography.label}>{item.label}</Text>
                      </View>
                      <Badge
                        label={HASIL_ITEM_LABELS[item.hasil]}
                        tone={item.hasil === 'NORMAL' ? 'synced' : isFinding ? 'danger' : 'neutral'}
                      />
                    </View>
                    {item.keterangan && <Text style={typography.caption}>{item.keterangan}</Text>}
                  </View>
                );
              })}
            </Card>
          );
        })}

        <Card>
          <Text style={typography.heading}>Pernyataan Operator</Text>
          <Checkbox label={PERNYATAAN_OPERATOR} checked={inspection.pernyataanOperator} onChange={() => {}} />
          {inspection.catatanOperator.length > 0 && (
            <Text style={typography.body}>Catatan: {inspection.catatanOperator}</Text>
          )}
          <Text style={typography.caption}>
            Rekomendasi mekanik / Keputusan pengawas —{' '}
            {inspection.rekomendasiMekanik ?? inspection.keputusanPengawas ?? PESAN_MENUNGGU_PENGAWAS}
          </Text>
        </Card>

        {inspection.fotoUri && (
          <Card>
            <Text style={typography.heading}>Foto</Text>
            <Image source={{ uri: inspection.fotoUri }} style={styles.photo} />
          </Card>
        )}

        {isPending ? (
          <Card>
            <Button label="Ubah" onPress={() => router.push(`/p2h/${inspection.id}/edit`)} />
            <Button
              label="Hapus"
              variant="outline"
              onPress={() => handleDelete(unit?.code ?? inspection.id)}
            />
          </Card>
        ) : (
          <Card>
            <Text style={typography.caption}>{SYNCED_NOTICE}</Text>
          </Card>
        )}
      </ScreenContainer>
    );
  }

  const { talk, jumlahHadir } = record;
  const isPending = talk.syncStatus === 'PENDING';

  return (
    <ScreenContainer>
      <Card>
        <View style={styles.headerRow}>
          <Text style={typography.heading}>{talk.topik}</Text>
          <Badge label={isPending ? 'Menunggu' : 'Tersinkron'} tone={isPending ? 'pending' : 'synced'} />
        </View>
        <Text style={typography.body}>Pemimpin: {talk.namaPemimpin}</Text>
        <Text style={typography.body}>NRP Pemimpin: {talk.nrpPemimpin}</Text>
        <Text style={typography.body}>Shift: {SHIFT_LABELS[talk.shift]}</Text>
        <Text style={typography.body}>Tanggal: {talk.tanggal}</Text>
        <Text style={typography.body}>Jam Mulai: {talk.jamMulai}</Text>
        <Text style={typography.body}>Lokasi/Area: {talk.lokasiArea}</Text>
        {talk.departemenRegu.length > 0 && (
          <Text style={typography.body}>Departemen/Regu: {talk.departemenRegu}</Text>
        )}
        {talk.uraianSingkat.length > 0 && (
          <Text style={typography.body}>Uraian: {talk.uraianSingkat}</Text>
        )}
        <Text style={typography.caption}>Dibuat: {formatDateTime(talk.dibuatPada)}</Text>
        <Text style={typography.caption}>{formatCoordinates(talk.latitude, talk.longitude)}</Text>
      </Card>

      <Card>
        <Text style={typography.heading}>Potensi Bahaya</Text>
        {talk.potensiBahaya.map((item, index) => (
          <Text key={`${item}-${index}`} style={typography.body}>
            • {item}
          </Text>
        ))}
      </Card>

      <Card>
        <Text style={typography.heading}>Komitmen Pengendalian</Text>
        {talk.komitmenPengendalian.map((item, index) => (
          <Text key={`${item}-${index}`} style={typography.body}>
            • {item}
          </Text>
        ))}
      </Card>

      {talk.informasiPengumuman.length > 0 && (
        <Card>
          <Text style={typography.heading}>Informasi/Pengumuman</Text>
          <Text style={typography.body}>{talk.informasiPengumuman}</Text>
        </Card>
      )}

      <Card>
        <Text style={typography.heading}>
          Peserta ({jumlahHadir} dari {talk.peserta.length} hadir)
        </Text>
        {talk.peserta.map((peserta, index) => (
          <View key={`${peserta.nrp}-${index}`} style={styles.pesertaRow}>
            <View style={styles.pesertaInfo}>
              <Text style={typography.body}>{peserta.nama}</Text>
              <Text style={typography.caption}>{peserta.nrp}</Text>
            </View>
            <Badge label={peserta.hadir ? 'Hadir' : 'Tidak Hadir'} tone={peserta.hadir ? 'synced' : 'neutral'} />
          </View>
        ))}
      </Card>

      {talk.fotoUri && (
        <Card>
          <Text style={typography.heading}>Foto</Text>
          <Image source={{ uri: talk.fotoUri }} style={styles.photo} />
        </Card>
      )}

      {talk.catatan.length > 0 && (
        <Card>
          <Text style={typography.heading}>Catatan</Text>
          <Text style={typography.body}>{talk.catatan}</Text>
        </Card>
      )}

      {isPending ? (
        <Card>
          <Button label="Ubah" onPress={() => router.push(`/p5m/${talk.id}/edit`)} />
          <Button label="Hapus" variant="outline" onPress={() => handleDelete(talk.topik)} />
        </Card>
      ) : (
        <Card>
          <Text style={typography.caption}>{SYNCED_NOTICE}</Text>
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistRow: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  findingRow: {
    backgroundColor: '#FBEEEC',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checklistLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  pesertaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pesertaInfo: {
    flex: 1,
  },
});
