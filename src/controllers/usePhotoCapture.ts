import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import { persistPhotoFromUri } from '../models';

const PHOTO_QUALITY = 0.3;

export interface UsePhotoCaptureResult {
  photoUri: string | null;
  error: string | null;
  takePhoto: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  clearPhoto: () => void;
  /** Lets a form seed the field with an already-persisted photo (editing an existing record). */
  setInitialPhoto: (uri: string | null) => void;
}

/**
 * Controller hook for capturing a single photo, either from the camera or the
 * gallery. Persistence into the app's document directory (surviving cache
 * purges) is delegated to `models/photo-storage`, never done here directly.
 */
export function usePhotoCapture(): UsePhotoCaptureResult {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = useCallback(async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      setError('Izin kamera ditolak.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: PHOTO_QUALITY });
    if (result.canceled || result.assets.length === 0) {
      return;
    }
    try {
      setPhotoUri(await persistPhotoFromUri(result.assets[0].uri));
    } catch {
      setError('Gagal menyimpan foto.');
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      setError('Izin galeri ditolak.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: PHOTO_QUALITY,
      mediaTypes: 'images',
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }
    try {
      setPhotoUri(await persistPhotoFromUri(result.assets[0].uri));
    } catch {
      setError('Gagal menyimpan foto.');
    }
  }, []);

  const clearPhoto = useCallback(() => setPhotoUri(null), []);
  const setInitialPhoto = useCallback((uri: string | null) => setPhotoUri(uri), []);

  return { photoUri, error, takePhoto, pickFromGallery, clearPhoto, setInitialPhoto };
}
