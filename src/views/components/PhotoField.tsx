import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme';
import { Button } from './Button';

export interface PhotoFieldProps {
  label: string;
  photoUri: string | null;
  error: string | null;
  onTakePhoto: () => void;
  onPickFromGallery: () => void;
  onClear: () => void;
}

/** Photo capture field: thumbnail preview plus camera/gallery/retake actions. */
export function PhotoField({
  label,
  photoUri,
  error,
  onTakePhoto,
  onPickFromGallery,
  onClear,
}: PhotoFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {photoUri && <Image source={{ uri: photoUri }} style={styles.thumbnail} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.actions}>
        <View style={styles.actionItem}>
          <Button
            label={photoUri ? 'Ambil Ulang' : 'Ambil Foto'}
            onPress={onTakePhoto}
            variant="outline"
          />
        </View>
        <View style={styles.actionItem}>
          <Button label="Pilih dari Galeri" onPress={onPickFromGallery} variant="outline" />
        </View>
      </View>
      {photoUri && <Button label="Hapus Foto" onPress={onClear} variant="outline" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionItem: {
    flex: 1,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});
