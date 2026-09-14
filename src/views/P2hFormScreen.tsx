import { PERNYATAAN_OPERATOR, SHIFTS, SHIFT_LABELS } from '@p2h/shared';
import { Text } from 'react-native';

import { useP2hForm } from '../controllers';
import {
  Button,
  Card,
  Checkbox,
  ChecklistItemRow,
  PhotoField,
  ScreenContainer,
  SegmentedControl,
  TextField,
  UnitPicker,
  VerdictCard,
  VerdictPill,
} from './components';
import { colors, typography } from './theme';

const SHIFT_OPTIONS = SHIFTS.map((shift) => ({ value: shift, label: SHIFT_LABELS[shift] }));

export interface P2hFormScreenProps {
  /** Present when editing an existing PENDING record; omitted when creating a new one. */
  editId?: string;
}

/** P2H (daily pre-use inspection) form screen — shared by the "new" and "edit" routes. */
export function P2hFormScreen({ editId }: P2hFormScreenProps) {
  const form = useP2hForm(editId);

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

  const showVerdictPill = form.verdict.itemStop.length > 0 || form.verdict.itemPerhatian.length > 0;

  return (
    <ScreenContainer>
      <Card>
        <Text style={typography.heading}>Pilih Unit</Text>
        <UnitPicker
          units={form.units}
          selectedUnitId={form.selectedUnit?.id ?? null}
          onSelect={form.selectUnit}
        />
      </Card>

      <Card>
        <TextField
          label="Nama Operator"
          value={form.namaOperator}
          onChangeText={form.setNamaOperator}
          placeholder="Nama lengkap operator"
        />
        <TextField label="NRP" value={form.nrp} onChangeText={form.setNrp} placeholder="Nomor NRP" />
        <TextField
          label="Tanggal (YYYY-MM-DD)"
          value={form.tanggal}
          onChangeText={form.setTanggal}
          placeholder="2026-09-14"
        />
        <Text style={typography.label}>Shift</Text>
        <SegmentedControl options={SHIFT_OPTIONS} value={form.shift} onChange={form.setShift} />
        <TextField
          label="Lokasi Kerja"
          value={form.lokasiKerja}
          onChangeText={form.setLokasiKerja}
          placeholder="Lokasi kerja saat ini"
        />
        <TextField
          label="HM/KM Awal"
          value={form.hmKmAwal}
          onChangeText={form.setHmKmAwal}
          placeholder="0"
          keyboardType="numeric"
        />
        <TextField
          label="HM/KM Akhir (opsional)"
          value={form.hmKmAkhir}
          onChangeText={form.setHmKmAkhir}
          placeholder="0"
          keyboardType="numeric"
        />
      </Card>

      {showVerdictPill && <VerdictPill status={form.verdict.status} />}

      {form.selectedUnit &&
        form.sections.map((section) => (
          <Card key={section.section}>
            <Text style={typography.heading}>{section.label}</Text>
            <Button
              label="Semua Normal"
              onPress={() => form.fillSemuaNormal(section.section)}
              variant="outline"
            />
            {section.items.map((item) => (
              <ChecklistItemRow
                key={item.key}
                label={item.label}
                kodeBahaya={item.kodeBahaya}
                hasil={item.hasil}
                keterangan={item.keterangan}
                onSelectHasil={(hasil) => form.setHasil(item.key, hasil)}
                onChangeKeterangan={(keterangan) => form.setKeterangan(item.key, keterangan)}
              />
            ))}
          </Card>
        ))}

      {form.selectedUnit && (
        <Card>
          <Checkbox
            label={PERNYATAAN_OPERATOR}
            checked={form.pernyataanOperator}
            onChange={form.setPernyataanOperator}
          />
          <TextField
            label="Catatan Operator"
            value={form.catatanOperator}
            onChangeText={form.setCatatanOperator}
            placeholder="Catatan tambahan (opsional)"
            multiline
          />
          <Text style={typography.caption}>
            Rekomendasi mekanik / Keputusan pengawas — Menunggu tindak lanjut pengawas
          </Text>
        </Card>
      )}

      <Card>
        <PhotoField
          label="Foto"
          photoUri={form.photoUri}
          error={form.photoError}
          onTakePhoto={form.takePhoto}
          onPickFromGallery={form.pickPhotoFromGallery}
          onClear={form.clearPhoto}
        />
      </Card>

      {form.selectedUnit && (
        <VerdictCard
          status={form.verdict.status}
          itemStop={form.verdict.itemStop}
          itemPerhatian={form.verdict.itemPerhatian}
          unansweredCount={form.verdict.unansweredCount}
          totalCount={form.verdict.totalCount}
        />
      )}

      {form.validationError && <Text style={{ color: colors.danger }}>{form.validationError}</Text>}

      <Button label="Simpan" onPress={form.save} loading={form.saving} />
    </ScreenContainer>
  );
}
