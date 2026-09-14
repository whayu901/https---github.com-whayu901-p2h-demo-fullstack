import { SHIFTS, SHIFT_LABELS, TOPIK_P5M_PRESET } from '@p2h/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useP5mForm } from '../controllers';
import { Badge, Button, Card, Chip, PhotoField, ScreenContainer, SegmentedControl, TextField } from './components';
import { colors, radii, spacing, typography } from './theme';

const SHIFT_OPTIONS = SHIFTS.map((shift) => ({ value: shift, label: SHIFT_LABELS[shift] }));

export interface P5mFormScreenProps {
  /** Present when editing an existing PENDING record; omitted when creating a new one. */
  editId?: string;
}

/** P5M (pre-shift safety talk) form screen — shared by the "new" and "edit" routes. */
export function P5mFormScreen({ editId }: P5mFormScreenProps) {
  const form = useP5mForm(editId);

  if (form.editStatus === 'loading') {
    return (
      <ScreenContainer>
        <Text style={typography.body}>Memuat…</Text>
      </ScreenContainer>
    );
  }

  if (form.editStatus === 'not_found') {
    return (
      <ScreenContainer>
        <Text style={typography.body}>Data tidak ditemukan.</Text>
      </ScreenContainer>
    );
  }

  if (form.editStatus === 'blocked') {
    return (
      <ScreenContainer>
        <Card>
          <Text style={typography.heading}>Tidak bisa diubah</Text>
          <Text style={typography.body}>
            Data sudah tersinkron dan tidak bisa diubah. Data yang sudah dikirim ke server bersifat
            final di perangkat — koreksi harus melalui pengawas.
          </Text>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Card>
        <TextField
          label="Tanggal (YYYY-MM-DD)"
          value={form.tanggal}
          onChangeText={form.setTanggal}
          placeholder="2026-09-14"
        />
        <TextField
          label="Jam Mulai (HH:mm)"
          value={form.jamMulai}
          onChangeText={form.setJamMulai}
          placeholder="07:00"
        />
        <Text style={typography.label}>Shift</Text>
        <SegmentedControl options={SHIFT_OPTIONS} value={form.shift} onChange={form.setShift} />
        <TextField
          label="Lokasi/Area"
          value={form.lokasiArea}
          onChangeText={form.setLokasiArea}
          placeholder="Lokasi pelaksanaan"
        />
        <TextField
          label="Departemen/Regu"
          value={form.departemenRegu}
          onChangeText={form.setDepartemenRegu}
          placeholder="Departemen atau regu"
        />
        <TextField
          label="Nama Pemimpin"
          value={form.namaPemimpin}
          onChangeText={form.setNamaPemimpin}
          placeholder="Nama pemimpin talk"
        />
        <TextField
          label="NRP Pemimpin"
          value={form.nrpPemimpin}
          onChangeText={form.setNrpPemimpin}
          placeholder="Nomor NRP"
        />
      </Card>

      <Card>
        <Text style={typography.heading}>Topik</Text>
        <View style={styles.chipWrap}>
          {TOPIK_P5M_PRESET.map((preset) => (
            <Chip
              key={preset}
              label={preset}
              selected={form.topik === preset}
              onPress={() => form.setTopik(preset)}
            />
          ))}
        </View>
        <TextField
          label="Topik (bebas diedit)"
          value={form.topik}
          onChangeText={form.setTopik}
          placeholder="Topik safety talk"
        />
        <TextField
          label="Uraian Singkat"
          value={form.uraianSingkat}
          onChangeText={form.setUraianSingkat}
          placeholder="Uraian singkat pelaksanaan (opsional)"
          multiline
        />
      </Card>

      <Card>
        <Text style={typography.heading}>Potensi Bahaya</Text>
        <AddableRow
          inputLabel="Potensi bahaya"
          value={form.potensiBahayaInput}
          onChangeText={form.setPotensiBahayaInput}
          onAdd={form.addPotensiBahaya}
        />
        {form.potensiBahaya.map((item, index) => (
          <RemovableChip key={`${item}-${index}`} label={item} onRemove={() => form.removePotensiBahaya(index)} />
        ))}
      </Card>

      <Card>
        <Text style={typography.heading}>Komitmen Pengendalian</Text>
        <AddableRow
          inputLabel="Komitmen pengendalian"
          value={form.komitmenInput}
          onChangeText={form.setKomitmenInput}
          onAdd={form.addKomitmen}
        />
        {form.komitmenPengendalian.map((item, index) => (
          <RemovableChip key={`${item}-${index}`} label={item} onRemove={() => form.removeKomitmen(index)} />
        ))}
      </Card>

      <Card>
        <TextField
          label="Informasi/Pengumuman (opsional)"
          value={form.informasiPengumuman}
          onChangeText={form.setInformasiPengumuman}
          placeholder="Informasi tambahan"
          multiline
        />
      </Card>

      <Card>
        <Text style={typography.heading}>Peserta</Text>
        <TextField
          label="Nama Peserta"
          value={form.pesertaNamaInput}
          onChangeText={form.setPesertaNamaInput}
          placeholder="Nama peserta"
        />
        <View style={styles.pesertaInputRow}>
          <View style={styles.pesertaNrpInput}>
            <TextField
              label="NRP"
              value={form.pesertaNrpInput}
              onChangeText={form.setPesertaNrpInput}
              placeholder="Nomor NRP"
            />
          </View>
          <Pressable accessibilityRole="button" onPress={form.addPeserta} style={styles.addButton}>
            <Text style={styles.addButtonLabel}>Tambah</Text>
          </Pressable>
        </View>

        <Text style={typography.caption}>
          {form.jumlahHadir} dari {form.peserta.length} hadir
        </Text>

        {form.peserta.map((item, index) => (
          <View key={`${item.nrp}-${index}`} style={styles.pesertaRow}>
            <View style={styles.pesertaInfo}>
              <Text style={styles.pesertaName}>{item.nama}</Text>
              <Text style={typography.caption}>{item.nrp}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => form.toggleHadir(index)}>
              <Badge label={item.hadir ? 'Hadir' : 'Tidak Hadir'} tone={item.hadir ? 'synced' : 'neutral'} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Hapus ${item.nama}`}
              onPress={() => form.removePeserta(index)}
            >
              <Text style={styles.remove}>×</Text>
            </Pressable>
          </View>
        ))}
      </Card>

      <Card>
        <PhotoField
          label="Foto"
          photoUri={form.photoUri}
          error={form.photoError}
          onTakePhoto={form.takePhoto}
          onPickFromGallery={form.pickPhotoFromGallery}
          onClear={form.clearPhoto}
        />
        <TextField
          label="Catatan"
          value={form.catatan}
          onChangeText={form.setCatatan}
          placeholder="Catatan tambahan (opsional)"
          multiline
        />
      </Card>

      {form.validationError && <Text style={{ color: colors.danger }}>{form.validationError}</Text>}

      <Button label="Simpan" onPress={form.save} loading={form.saving} />
    </ScreenContainer>
  );
}

interface AddableRowProps {
  inputLabel: string;
  value: string;
  onChangeText: (value: string) => void;
  onAdd: () => void;
}

function AddableRow({ inputLabel, value, onChangeText, onAdd }: AddableRowProps) {
  return (
    <View style={styles.addableRow}>
      <View style={styles.addableInput}>
        <TextField label={inputLabel} value={value} onChangeText={onChangeText} placeholder="Ketik lalu Tambah" />
      </View>
      <Pressable accessibilityRole="button" onPress={onAdd} style={styles.addButton}>
        <Text style={styles.addButtonLabel}>Tambah</Text>
      </Pressable>
    </View>
  );
}

function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View style={styles.removableChip}>
      <Text style={styles.removableLabel}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Hapus ${label}`} onPress={onRemove}>
        <Text style={styles.remove}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  addableRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  addableInput: {
    flex: 1,
  },
  addButton: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.charcoal,
  },
  addButtonLabel: {
    color: colors.white,
    fontWeight: '700',
  },
  removableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  removableLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.charcoal,
  },
  remove: {
    fontSize: 20,
    color: colors.mutedText,
    paddingHorizontal: spacing.sm,
  },
  pesertaInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  pesertaNrpInput: {
    flex: 1,
  },
  pesertaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pesertaInfo: {
    flex: 1,
  },
  pesertaName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.charcoal,
  },
});
